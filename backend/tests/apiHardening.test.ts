import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import test from 'node:test';
import { createApiRouter } from '../src/routes/api.js';
import { StateManager } from '../src/services/stateManager.js';
import { TelehealthService } from '../src/services/telehealth.js';
import type { PersistenceService } from '../src/services/persistence.js';

const fakePersistence = { driver: 'sqlite', ready: Promise.resolve() } as unknown as PersistenceService;

test('API health endpoint reports demo mode and persistence driver', async (t) => {
  const stateManager = new StateManager(fakePersistence);
  const app = express();
  app.use(express.json());
  app.use('/api/v0', createApiRouter(stateManager, new TelehealthService(fakePersistence), fakePersistence));
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    stateManager.destroy();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/v0`;

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const healthBody = await health.json() as { status: string; persistence: string; data_mode: string };
  assert.equal(healthBody.status, 'ok');
  assert.equal(healthBody.persistence, 'sqlite');
  assert.equal(healthBody.data_mode, 'SYNTHETIC_DEMO');

  const invalidCoordinates = await fetch(`${base}/route`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lat: 91, lng: 0 }) });
  assert.equal(invalidCoordinates.status, 400);

  const unknownField = await fetch(`${base}/route`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lat: 0, lng: 0, debug: true }) });
  assert.equal(unknownField.status, 400);

  const invalidScenario = await fetch(`${base}/simulation/queue`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ arrivalRatePerHour: -1 }) });
  assert.equal(invalidScenario.status, 400);

  const validScenario = await fetch(`${base}/simulation/queue`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ arrivalRatePerHour: 8, averageServiceMinutes: 15, servers: 2, queueCapacity: 12, durationMinutes: 60, runs: 2, seed: 3 }) });
  assert.equal(validScenario.status, 200);
  const scenarioBody = await validScenario.json() as { data_mode: string; result: { runs: number } };
  assert.equal(scenarioBody.data_mode, 'SYNTHETIC_DEMO');
  assert.equal(scenarioBody.result.runs, 2);
});
