import assert from 'node:assert/strict';
import test from 'node:test';
import { ArrivalAnomalyDetector } from '../src/engine/anomaly.js';
import { MonteCarloQueueSimulator } from '../src/engine/monteCarlo.js';
import { KAnonymityGuard } from '../src/services/privacy.js';
import { SignerService } from '../src/services/signer.js';
import type { UnitLiveState } from '../src/types.js';

test('Monte Carlo results are reproducible for a fixed seed', () => {
  const scenario = {
    arrivalRatePerHour: 24,
    averageServiceMinutes: 18,
    servers: 3,
    queueCapacity: 12,
    durationMinutes: 240,
    runs: 100,
    seed: 123
  };
  assert.deepEqual(
    MonteCarloQueueSimulator.simulate(scenario),
    MonteCarloQueueSimulator.simulate(scenario)
  );
});

test('Monte Carlo additional servers reduce expected wait', () => {
  const base = {
    arrivalRatePerHour: 50,
    averageServiceMinutes: 20,
    servers: 2,
    queueCapacity: 80,
    durationMinutes: 360,
    runs: 400,
    seed: 77
  };
  const usual = MonteCarloQueueSimulator.simulate(base);
  const expanded = MonteCarloQueueSimulator.simulate({ ...base, additionalServers: 2 });
  assert.ok(expanded.meanWaitMinutes < usual.meanWaitMinutes);
  assert.ok(usual.rejectionRate >= 0 && usual.rejectionRate <= 1);
});

test('Anomaly detector triggers on sustained rate increase', () => {
  const detector = new ArrivalAnomalyDetector(60, 2, 5);
  for (let i = 0; i < 20; i += 1) detector.observe('Canudos:respiratorio', 1);
  const result = detector.observe('Canudos:respiratorio', 10);
  assert.equal(result.isAnomaly, true);
  assert.equal(result.reason, 'CUSUM');
});

test('k-anonymity suppresses counts 1 and 2 while preserving zero and groups >= 3', () => {
  assert.equal(KAnonymityGuard.suppress(0), 0);
  assert.equal(KAnonymityGuard.suppress(1), null);
  assert.equal(KAnonymityGuard.suppress(2), null);
  assert.equal(KAnonymityGuard.suppress(3), 3);
  assert.throws(() => KAnonymityGuard.suppress(2, 2));
});

test('public sanitized state is signed after small queue counts are hidden', () => {
  const signer = new SignerService();
  const state = {
    unidade_id: 'upa_canudos',
    timestamp: new Date().toISOString(),
    pow: {
      prioridades: {
        vermelho: { fila: 1, wait_med_min: 0, conf: 1 },
        laranja: { fila: 2, wait_med_min: 3, conf: 0.8 },
        amarelo: { fila: 3, wait_med_min: 10, conf: 0.8 },
        verde: { fila: 0, wait_med_min: 0, conf: 1 },
        azul: { fila: 4, wait_med_min: 12, conf: 0.8 }
      },
      tempo_medio_porta_triagem_min: 5,
      total_em_fila: 10
    },
    poo: { salas_abertas: 1, salas_totais: 2, ocupacao_salas: 0.5, leitos_observacao: { ocupados: 1, capacidade: 2 }, diagnostico: { raio_x: { operacional: true, fila_exames: 2, tempo_medio_min: 10 }, laboratorio: { operacional: true, fila_exames: 0, tempo_medio_min: 10 } } },
    samu: { ambulancias_retidas: 1, tempo_medio_giro_min: 20 },
    previsao_15min: { pow_delta: 0, poo_delta: 0, tendencia: 'ESTAVEL', confianca_previsao: 0.8 },
    previsao_30min: { pow_delta: 0, poo_delta: 0, tendencia: 'ESTAVEL', confianca_previsao: 0.8 },
    previsao_60min: { pow_delta: 0, poo_delta: 0, tendencia: 'ESTAVEL', confianca_previsao: 0.8 },
    idade_do_dado_s: 0,
    fontes: [],
    assinatura: 'unused'
  } as unknown as UnitLiveState;
  const result = KAnonymityGuard.sanitizeState(state, (payload) => signer.signPayload(payload));
  assert.equal(result.pow.prioridades.vermelho.fila, null);
  assert.equal(result.pow.prioridades.vermelho.wait_med_min, null);
  assert.equal(result.pow.prioridades.laranja.fila, null);
  assert.equal(result.pow.prioridades.laranja.wait_med_min, null);
  assert.equal(result.pow.prioridades.amarelo.fila, 3);
  assert.equal(result.pow.prioridades.amarelo.wait_med_min, 10);
  assert.equal(result.pow.prioridades.verde.fila, 0);
  const { assinatura, ...unsigned } = result;
  assert.equal(SignerService.verifySignature(unsigned, assinatura, signer.getPublicKey()), true);
});
