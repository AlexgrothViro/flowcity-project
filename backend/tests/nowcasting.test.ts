import test from 'node:test';
import assert from 'node:assert/strict';
import { KalmanFilter1D } from '../src/engine/kalman.js';
import { NowcastingEngine } from '../src/engine/nowcasting.js';

test('KalmanFilter1D suaviza flutuacoes de medicao ruidosa', () => {
  const filter = new KalmanFilter1D(30, 0.05, 0.5);

  // Simula medicoes ruidosas em torno de 30
  const noisyReadings = [38, 25, 34, 27, 33, 29, 31];
  let lastFiltered = 30;

  for (const r of noisyReadings) {
    lastFiltered = filter.update(r);
  }

  // O valor suavizado deve convergir e ter menor variacao que os picos brutos
  assert.ok(lastFiltered > 28 && lastFiltered < 34);
});

test('NowcastingEngine projeta horizontes de 15, 30 e 60 minutos', () => {
  const engine = new NowcastingEngine();
  const date = new Date('2026-11-03T10:30:00Z'); // 10h30

  const forecasts = engine.generateForecasts('upa_canudos', 45, 0.85, date);

  assert.ok(forecasts.previsao_15min);
  assert.ok(forecasts.previsao_30min);
  assert.ok(forecasts.previsao_60min);

  // A confianca deve decair com o horizonte de tempo
  assert.ok(forecasts.previsao_15min.confianca_previsao >= forecasts.previsao_30min.confianca_previsao);
  assert.ok(forecasts.previsao_30min.confianca_previsao >= forecasts.previsao_60min.confianca_previsao);
});
