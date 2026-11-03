import { PersistenceService } from '../services/persistence.js';
import { SignerService } from '../services/signer.js';
import { StateManager } from '../services/stateManager.js';

const enabled = process.env.ALLOW_SYNTHETIC_SEED === 'true';
if (!enabled) {
  throw new Error('Defina ALLOW_SYNTHETIC_SEED=true para gravar a série demonstrativa. Estes dados são sintéticos, não epidemiologia real.');
}

const persistence = new PersistenceService();
const stateManager = new StateManager(persistence);
const signer = new SignerService();

try {
  await persistence.ready;
  await stateManager.restorePersistedStates();
  stateManager.destroy();

  const baseStates = stateManager.getAllStates();
  const minutes = 30 * 24 * 60;
  const startAt = Date.now() - minutes * 60_000;
  let batch = [];

  for (let minute = 0; minute < minutes; minute += 1) {
    const timestamp = new Date(startAt + minute * 60_000).toISOString();
    for (const base of baseStates) {
      const hour = Math.floor((minute % 1440) / 60);
      const dailyWave = Math.sin((hour - 8) * Math.PI / 12);
      const weeklyWave = Math.sin((Math.floor(minute / 1440) % 7) * Math.PI / 3.5);
      const factor = Math.max(0.65, 1 + 0.16 * dailyWave + 0.08 * weeklyWave);
      const priorities = Object.fromEntries(
        Object.entries(base.pow.prioridades).map(([priority, metric]) => [
          priority,
          { ...metric, fila: Math.max(0, Math.round(metric.fila * factor)) }
        ])
      ) as typeof base.pow.prioridades;
      const payload = {
        ...base,
        timestamp,
        data_mode: 'SYNTHETIC_DEMO' as const,
        pow: {
          ...base.pow,
          prioridades: priorities,
          total_em_fila: Object.values(priorities).reduce((sum, item) => sum + item.fila, 0)
        }
      };
      const { assinatura: _previousSignature, ...unsigned } = payload;
      batch.push({ ...unsigned, assinatura: signer.signPayload(unsigned) });
    }

    if (batch.length >= 1000) {
      await persistence.saveSnapshots(batch);
      batch = [];
    }
    if ((minute + 1) % 1440 === 0) {
      console.log(JSON.stringify({ level: 'info', event: 'synthetic_seed_day', day: Math.floor((minute + 1) / 1440), days: 30 }));
    }
  }

  if (batch.length > 0) await persistence.saveSnapshots(batch);
  console.log(JSON.stringify({ level: 'info', event: 'synthetic_seed_complete', snapshots: minutes * baseStates.length, dataMode: 'SYNTHETIC_DEMO' }));
} finally {
  stateManager.destroy();
  await persistence.close();
}
