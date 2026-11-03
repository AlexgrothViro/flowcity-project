import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import type { UnitLiveState, TeleconsultationAppointment, SpecialistReferral } from '../types.js';

type SqliteDb = InstanceType<typeof Database>;

export interface AuditEntry {
  actor: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export class PersistenceService {
  public readonly ready: Promise<void>;
  private sqlite: SqliteDb | null = null;
  private pool: Pool | null = null;
  private mode: 'sqlite' | 'postgres' = 'sqlite';

  public constructor() {
    const connectionString = process.env.DATABASE_URL;
    this.ready = connectionString
      ? this.connectPostgres(connectionString)
      : Promise.resolve().then(() => this.openSqlite());
  }

  public get driver(): 'sqlite' | 'postgres' {
    return this.mode;
  }

  private async connectPostgres(connectionString: string): Promise<void> {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });
    try {
      await pool.query('SELECT 1');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS unit_snapshots (
          id TEXT PRIMARY KEY, unit_id TEXT NOT NULL, captured_at TIMESTAMPTZ NOT NULL,
          payload_json JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS unit_snapshots_unit_time_idx ON unit_snapshots(unit_id, captured_at DESC);
        CREATE TABLE IF NOT EXISTS workflow_events (
          id TEXT PRIMARY KEY, unit_id TEXT, event_type TEXT NOT NULL,
          occurred_at TIMESTAMPTZ NOT NULL, payload_json JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS workflow_events_time_idx ON workflow_events(occurred_at DESC);
        CREATE TABLE IF NOT EXISTS telehealth_appointments (
          id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL, payload_json JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS specialist_referrals (
          id TEXT PRIMARY KEY, requested_at TIMESTAMPTZ NOT NULL, payload_json JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY, occurred_at TIMESTAMPTZ NOT NULL, actor TEXT NOT NULL,
          action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, details_json JSONB NOT NULL
        );
      `);
      this.pool = pool;
      this.mode = 'postgres';
    } catch (error) {
      await pool.end().catch(() => undefined);
      console.error(JSON.stringify({ level: 'warn', event: 'postgres_unavailable_fallback_sqlite', message: error instanceof Error ? error.message : 'unknown error' }));
      this.openSqlite();
    }
  }

  private openSqlite(): void {
    const filename = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'flowcity.sqlite');
    mkdirSync(path.dirname(filename), { recursive: true });
    const db = new Database(filename);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE IF NOT EXISTS unit_snapshots (
        id TEXT PRIMARY KEY, unit_id TEXT NOT NULL, captured_at TEXT NOT NULL, payload_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS unit_snapshots_unit_time_idx ON unit_snapshots(unit_id, captured_at DESC);
      CREATE TABLE IF NOT EXISTS workflow_events (
        id TEXT PRIMARY KEY, unit_id TEXT, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, payload_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS workflow_events_time_idx ON workflow_events(occurred_at DESC);
      CREATE TABLE IF NOT EXISTS telehealth_appointments (
        id TEXT PRIMARY KEY, created_at TEXT NOT NULL, payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS specialist_referrals (
        id TEXT PRIMARY KEY, requested_at TEXT NOT NULL, payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, actor TEXT NOT NULL,
        action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, details_json TEXT NOT NULL
      );
      CREATE TRIGGER IF NOT EXISTS audit_log_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
      CREATE TRIGGER IF NOT EXISTS audit_log_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
    `);
    this.sqlite = db;
    this.mode = 'sqlite';
  }

  public async saveSnapshot(snapshot: UnitLiveState): Promise<void> {
    await this.ready;
    const id = `${snapshot.unidade_id}:${snapshot.timestamp}`;
    const payload = JSON.stringify(snapshot);
    if (this.mode === 'postgres' && this.pool) {
      await this.pool.query(
        'INSERT INTO unit_snapshots(id, unit_id, captured_at, payload_json) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(id) DO NOTHING',
        [id, snapshot.unidade_id, snapshot.timestamp, payload]
      );
      return;
    }
    this.sqlite?.prepare('INSERT OR IGNORE INTO unit_snapshots(id, unit_id, captured_at, payload_json) VALUES(?,?,?,?)')
      .run(id, snapshot.unidade_id, snapshot.timestamp, payload);
  }

  public async saveSnapshots(snapshots: UnitLiveState[]): Promise<void> {
    await this.ready;
    if (snapshots.length === 0) return;
    if (this.mode === 'postgres' && this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        for (let offset = 0; offset < snapshots.length; offset += 500) {
          const batch = snapshots.slice(offset, offset + 500);
          const values: unknown[] = [];
          const placeholders = batch.map((snapshot, index) => {
            const base = index * 4;
            values.push(`${snapshot.unidade_id}:${snapshot.timestamp}`, snapshot.unidade_id, snapshot.timestamp, JSON.stringify(snapshot));
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4}::jsonb)`;
          }).join(',');
          await client.query(
            `INSERT INTO unit_snapshots(id,unit_id,captured_at,payload_json) VALUES ${placeholders} ON CONFLICT(id) DO NOTHING`,
            values
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      return;
    }
    const insert = this.sqlite?.prepare('INSERT OR IGNORE INTO unit_snapshots(id, unit_id, captured_at, payload_json) VALUES(?,?,?,?)');
    const transaction = this.sqlite?.transaction((batch: UnitLiveState[]) => {
      for (const snapshot of batch) {
        insert?.run(`${snapshot.unidade_id}:${snapshot.timestamp}`, snapshot.unidade_id, snapshot.timestamp, JSON.stringify(snapshot));
      }
    });
    transaction?.(snapshots);
  }
  public async loadSnapshotHistory(unitId: string, hours = 24): Promise<UnitLiveState[]> {
    await this.ready;
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      throw new Error('hours must be between 1 and 168');
    }
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    if (this.mode === 'postgres' && this.pool) {
      const result = await this.pool.query(
        'SELECT payload_json FROM unit_snapshots WHERE unit_id = $1 AND captured_at >= $2 ORDER BY captured_at ASC',
        [unitId, since]
      );
      return result.rows.map((row) =>
        typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) as UnitLiveState : row.payload_json as UnitLiveState
      );
    }
    const rows = this.sqlite?.prepare(
      'SELECT payload_json FROM unit_snapshots WHERE unit_id = ? AND captured_at >= ? ORDER BY captured_at ASC'
    ).all(unitId, since) as Array<{ payload_json: string }> | undefined;
    return (rows || []).map((row) => JSON.parse(row.payload_json) as UnitLiveState);
  }

  public async loadLatestSnapshots(): Promise<UnitLiveState[]> {
    await this.ready;
    if (this.mode === 'postgres' && this.pool) {
      const result = await this.pool.query(
        'SELECT DISTINCT ON (unit_id) payload_json FROM unit_snapshots ORDER BY unit_id, captured_at DESC'
      );
      return result.rows.map((row) => row.payload_json as UnitLiveState);
    }
    const result = this.sqlite?.prepare(`
      SELECT s.payload_json FROM unit_snapshots s
      JOIN (SELECT unit_id, MAX(captured_at) AS captured_at FROM unit_snapshots GROUP BY unit_id) latest
      ON latest.unit_id = s.unit_id AND latest.captured_at = s.captured_at
    `).all() as Array<{ payload_json: string }> | undefined;
    return (result || []).map((row) => JSON.parse(row.payload_json) as UnitLiveState);
  }

  public async appendWorkflowEvent(
    eventType: 'admission' | 'triage' | 'consultation' | 'discharge',
    unitId: string | null,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.ready;
    const id = randomUUID();
    const occurredAt = new Date().toISOString();
    const json = JSON.stringify(payload);
    if (this.mode === 'postgres' && this.pool) {
      await this.pool.query(
        'INSERT INTO workflow_events(id, unit_id, event_type, occurred_at, payload_json) VALUES($1,$2,$3,$4,$5::jsonb)',
        [id, unitId, eventType, occurredAt, json]
      );
      return;
    }
    this.sqlite?.prepare('INSERT INTO workflow_events(id, unit_id, event_type, occurred_at, payload_json) VALUES(?,?,?,?,?)')
      .run(id, unitId, eventType, occurredAt, json);
  }

  public async saveAppointment(appointment: TeleconsultationAppointment): Promise<void> {
    await this.ready;
    const json = JSON.stringify(appointment);
    if (this.mode === 'postgres' && this.pool) {
      await this.pool.query(
        'INSERT INTO telehealth_appointments(id, created_at, payload_json) VALUES($1,$2,$3::jsonb) ON CONFLICT(id) DO UPDATE SET payload_json=EXCLUDED.payload_json',
        [appointment.id, appointment.timestamp_criacao, json]
      );
      return;
    }
    this.sqlite?.prepare('INSERT INTO telehealth_appointments(id, created_at, payload_json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload_json=excluded.payload_json')
      .run(appointment.id, appointment.timestamp_criacao, json);
  }

  public async saveReferral(referral: SpecialistReferral): Promise<void> {
    await this.ready;
    const json = JSON.stringify(referral);
    if (this.mode === 'postgres' && this.pool) {
      await this.pool.query(
        'INSERT INTO specialist_referrals(id, requested_at, payload_json) VALUES($1,$2,$3::jsonb) ON CONFLICT(id) DO UPDATE SET payload_json=EXCLUDED.payload_json',
        [referral.id, referral.timestamp_solicitacao, json]
      );
      return;
    }
    this.sqlite?.prepare('INSERT INTO specialist_referrals(id, requested_at, payload_json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload_json=excluded.payload_json')
      .run(referral.id, referral.timestamp_solicitacao, json);
  }

  public async loadWorkflowEvents(limit = 100): Promise<Array<{ id: string; unitId: string | null; eventType: string; occurredAt: string; payload: Record<string, unknown> }>> {
    await this.ready;
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    if (this.mode === 'postgres' && this.pool) {
      const result = await this.pool.query(
        'SELECT id, unit_id, event_type, occurred_at, payload_json FROM workflow_events ORDER BY occurred_at DESC LIMIT $1',
        [safeLimit]
      );
      return result.rows.map((row) => ({ id: row.id as string, unitId: row.unit_id as string | null, eventType: row.event_type as string, occurredAt: (row.occurred_at as Date).toISOString(), payload: row.payload_json as Record<string, unknown> }));
    }
    const rows = this.sqlite?.prepare(
      'SELECT id, unit_id, event_type, occurred_at, payload_json FROM workflow_events ORDER BY occurred_at DESC LIMIT ?'
    ).all(safeLimit) as Array<{ id: string; unit_id: string | null; event_type: string; occurred_at: string; payload_json: string }> | undefined;
    return (rows || []).map((row) => ({ id: row.id, unitId: row.unit_id, eventType: row.event_type, occurredAt: row.occurred_at, payload: JSON.parse(row.payload_json) as Record<string, unknown> }));
  }
  public async loadAppointments(): Promise<TeleconsultationAppointment[]> {
    await this.ready;
    if (this.mode === 'postgres' && this.pool) {
      const result = await this.pool.query('SELECT payload_json FROM telehealth_appointments ORDER BY created_at DESC');
      return result.rows.map((row) => row.payload_json as TeleconsultationAppointment);
    }
    const rows = this.sqlite?.prepare('SELECT payload_json FROM telehealth_appointments ORDER BY created_at DESC').all() as Array<{ payload_json: string }> | undefined;
    return (rows || []).map((row) => JSON.parse(row.payload_json) as TeleconsultationAppointment);
  }

  public async loadReferrals(): Promise<SpecialistReferral[]> {
    await this.ready;
    if (this.mode === 'postgres' && this.pool) {
      const result = await this.pool.query('SELECT payload_json FROM specialist_referrals ORDER BY requested_at DESC');
      return result.rows.map((row) => row.payload_json as SpecialistReferral);
    }
    const rows = this.sqlite?.prepare('SELECT payload_json FROM specialist_referrals ORDER BY requested_at DESC').all() as Array<{ payload_json: string }> | undefined;
    return (rows || []).map((row) => JSON.parse(row.payload_json) as SpecialistReferral);
  }
  public async appendAudit(entry: AuditEntry): Promise<void> {
    await this.ready;
    const id = randomUUID();
    const now = new Date().toISOString();
    const details = JSON.stringify(entry.details || {});
    if (this.mode === 'postgres' && this.pool) {
      await this.pool.query(
        'INSERT INTO audit_log(id, occurred_at, actor, action, entity_type, entity_id, details_json) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)',
        [id, now, entry.actor, entry.action, entry.entityType, entry.entityId || null, details]
      );
      return;
    }
    this.sqlite?.prepare('INSERT INTO audit_log(id, occurred_at, actor, action, entity_type, entity_id, details_json) VALUES(?,?,?,?,?,?,?)')
      .run(id, now, entry.actor, entry.action, entry.entityType, entry.entityId || null, details);
  }

  public async close(): Promise<void> {
    await this.ready;
    this.sqlite?.close();
    this.sqlite = null;
    await this.pool?.end();
    this.pool = null;
  }
}
