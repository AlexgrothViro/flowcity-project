import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PersistenceService } from '../src/services/persistence.js';
import type { UnitLiveState } from '../src/types.js';

test('snapshot history filters by unit and returns records in chronological order', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flowcity-history-'));
  const previousPath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = path.join(directory, 'flowcity.sqlite');
  const persistence = new PersistenceService();
  const now = Date.now();
  const makeSnapshot = (id: string, offsetMinutes: number) => ({
    unidade_id: id,
    timestamp: new Date(now - offsetMinutes * 60_000).toISOString(),
    assinatura: 'synthetic-signature'
  } as unknown as UnitLiveState);

  try {
    await persistence.ready;
    await persistence.saveSnapshots([
      makeSnapshot('upa_canudos', 10),
      makeSnapshot('upa_canudos', 5),
      makeSnapshot('hmnh_hospital', 2)
    ]);
    const history = await persistence.loadSnapshotHistory('upa_canudos', 24);
    assert.equal(history.length, 2);
    assert.ok(history[0].timestamp < history[1].timestamp);
    assert.ok(history.every((snapshot) => snapshot.unidade_id === 'upa_canudos'));
    await assert.rejects(() => persistence.loadSnapshotHistory('upa_canudos', 0), /hours must be between/);
  } finally {
    await persistence.close();
    if (previousPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
});
