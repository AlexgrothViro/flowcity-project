import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { Hl7CollectorAdapter } from '../src/adapters/hl7Collector.js';
import { PersistenceService } from '../src/services/persistence.js';

test('HL7 ADT admission, triage and discharge persist without raw patient identifiers', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flowcity-hl7-'));
  const oldPath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = path.join(directory, 'events.sqlite');
  const persistence = new PersistenceService();
  try {
    await persistence.ready;
    const adapter = new Hl7CollectorAdapter(persistence);
    const event = await adapter.ingest('MSH|^~\\&|HIS|HMNH|FLOWCITY|NH|202611031200||ADT^A01|1|P|2.5\r\nPID|1||12345||DOE^JANE\r\nPV1|1|E||verde');
    assert.equal(event?.eventType, 'ADMISSAO');
    const records = await persistence.loadWorkflowEvents();
    assert.equal(records.length, 1);
    assert.equal(records[0]?.eventType, 'admission');
    assert.equal(records[0]?.unitId, 'hmnh_hospital');
    assert.equal(JSON.stringify(records[0]).includes('DOE'), false);
    assert.equal(JSON.stringify(records[0]).includes('12345'), false);
  } finally {
    await persistence.close();
    if (oldPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = oldPath;
    rmSync(directory, { recursive: true, force: true });
  }
});

test('unavailable PostgreSQL connection falls back to SQLite', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flowcity-fallback-'));
  const oldPath = process.env.SQLITE_PATH;
  const oldUrl = process.env.DATABASE_URL;
  process.env.SQLITE_PATH = path.join(directory, 'fallback.sqlite');
  process.env.DATABASE_URL = 'postgres://flowcity:flowcity@127.0.0.1:1/flowcity';
  const persistence = new PersistenceService();
  try {
    await persistence.ready;
    assert.equal(persistence.driver, 'sqlite');
    await persistence.appendAudit({ actor: 'test', action: 'fallback.ok', entityType: 'test' });
  } finally {
    await persistence.close();
    if (oldPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = oldPath;
    if (oldUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldUrl;
    rmSync(directory, { recursive: true, force: true });
  }
});
