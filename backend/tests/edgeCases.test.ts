import assert from 'node:assert/strict';
import test from 'node:test';
import { ArrivalAnomalyDetector } from '../src/engine/anomaly.js';
import { ManchesterQueuingModel } from '../src/engine/queuing.js';
import { ClinicalTriageProtocol } from '../src/protocols/triage.js';
import { KAnonymityGuard } from '../src/services/privacy.js';

test('k-anonymity rejects negative, fractional and non-finite counts', () => {
  for (const count of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => KAnonymityGuard.suppress(count), /count must be a non-negative integer/);
  }
});

test('k-anonymity allows a stricter threshold but never a weaker one', () => {
  assert.equal(KAnonymityGuard.suppress(3, 4), null);
  assert.equal(KAnonymityGuard.suppress(4, 4), 4);
  assert.throws(() => KAnonymityGuard.suppress(4, 2), /at least 3/);
});

test('anomaly detector rejects an invalid window configuration', () => {
  assert.throws(() => new ArrivalAnomalyDetector(4), /Invalid anomaly detector configuration/);
  assert.throws(() => new ArrivalAnomalyDetector(10, 0), /Invalid anomaly detector configuration/);
});

test('anomaly detector rejects blank keys and invalid arrival rates', () => {
  const detector = new ArrivalAnomalyDetector();
  assert.throws(() => detector.observe('  ', 1), /non-empty key/);
  assert.throws(() => detector.observe('clinic', -1), /non-negative finite rate/);
  assert.throws(() => detector.observe('clinic', Number.NaN), /non-negative finite rate/);
});

test('anomaly detector does not flag a stable series', () => {
  const detector = new ArrivalAnomalyDetector(20, 2, 5);
  const results = Array.from({ length: 12 }, () => detector.observe('stable', 4));
  assert.ok(results.every((result) => !result.isAnomaly));
});

test('anomaly detector keeps independent baselines for separate units', () => {
  const detector = new ArrivalAnomalyDetector(20, 2, 5);
  detector.observe('unit-a', 1);
  detector.observe('unit-b', 100);
  const result = detector.observe('unit-a', 2);
  assert.equal(result.baselineMean, 1);
  assert.equal(result.isAnomaly, false);
});

test('one critical triage red flag blocks teleconsultation', () => {
  const result = ClinicalTriageProtocol.evaluate({
    sintoma_principal: 'Sintomas Respiratórios / Gripe / Tosse',
    respostas_red_flags: { falta_ar_grave: true, labios_roxos: false, sonolencia_extrema: false },
    idade: 40
  });
  assert.equal(result.prioridade_sugerida, 'laranja');
  assert.equal(result.permite_teleconsulta, false);
});

test('multiple declared comorbidities raise triage priority to yellow', () => {
  const result = ClinicalTriageProtocol.evaluate({
    sintoma_principal: 'Sintomas Respiratórios / Gripe / Tosse',
    respostas_red_flags: {},
    comorbidades: ['A', 'B', 'C'],
    idade: 40
  });
  assert.equal(result.prioridade_sugerida, 'amarelo');
  assert.equal(result.permite_teleconsulta, false);
});

test('unknown symptom wording does not invent a red flag', () => {
  const result = ClinicalTriageProtocol.evaluate({ sintoma_principal: 'sintoma sem regra cadastrada', respostas_red_flags: {}, idade: 30 });
  assert.notEqual(result.prioridade_sugerida, 'vermelho');
  assert.equal(result.acionar_samu_urgente, false);
});

test('queue model remains finite when no rooms are reported', () => {
  const result = ManchesterQueuingModel.calculateWaitTimes({ activeRooms: 0, queueCounts: { vermelho: 0, laranja: 0, amarelo: 0, verde: 0, azul: 0 } });
  assert.ok(Object.values(result).every((metric) => Number.isFinite(metric.wait_med_min)));
  assert.equal(result.amarelo.wait_med_min, 0);
});

test('queue model clamps negative queue counts and confidence for stale data', () => {
  const result = ManchesterQueuingModel.calculateWaitTimes({
    activeRooms: 2,
    queueCounts: { vermelho: -2, laranja: 0, amarelo: 0, verde: 0, azul: 0 },
    dataFreshnessSeconds: 10000
  });
  assert.equal(result.vermelho.fila, 0);
  assert.ok(Object.values(result).every((metric) => metric.conf >= 0.65));
});
