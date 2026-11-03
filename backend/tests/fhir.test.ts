import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFlowBundle, buildLocationBundle, validateFhirResource } from '../src/fhir/resources.js';
import { KAnonymityGuard, type PublicUnitState } from '../src/services/privacy.js';
import type { UnitLiveState } from '../src/types.js';

function sampleState(): UnitLiveState {
  const state = {
    unidade_id: 'upa_canudos',
    timestamp: '2026-11-03T12:00:00.000Z',
    data_mode: 'SYNTHETIC_DEMO',
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
    poo: {
      salas_abertas: 4,
      salas_totais: 6,
      ocupacao_salas: 0.66,
      leitos_observacao: { ocupados: 1, capacidade: 2 },
      diagnostico: { raio_x: { operacional: true, fila_exames: 2, tempo_medio_min: 10 }, laboratorio: { operacional: true, fila_exames: 0, tempo_medio_min: 10 } }
    },
    samu: { ambulancias_retidas: 1, tempo_medio_giro_min: 20 },
    previsao_15min: { pow_delta: 0, poo_delta: 0, tendencia: 'ESTAVEL', confianca_previsao: 0.8 },
    previsao_30min: { pow_delta: 0, poo_delta: 0, tendencia: 'ESTAVEL', confianca_previsao: 0.8 },
    previsao_60min: { pow_delta: 0, poo_delta: 0, tendencia: 'ESTAVEL', confianca_previsao: 0.8 },
    idade_do_dado_s: 0,
    fontes: [],
    assinatura: 'unused'
  };
  return state as UnitLiveState;
}

test('FHIR Location collection includes modeled units without invented CNES identifiers', () => {
  const bundle = buildLocationBundle();
  assert.equal(bundle.resourceType, 'Bundle');
  assert.equal(bundle.type, 'collection');
  const locations = bundle.entry.map((entry) => entry.resource).filter((item) => item.resourceType === 'Location');
  assert.equal(locations.length, 4);
  assert.equal(locations.some((item) => JSON.stringify(item).includes('CNES')), false);
  assert.equal(validateFhirResource(locations[0]), true);
});

test('FHIR flow bundle includes requested R4 resource types and hides small counts', () => {
  const signerPayloads: object[] = [];
  const state = KAnonymityGuard.sanitizeState(sampleState(), (payload) => {
    signerPayloads.push(payload);
    return 'signed-sanitized-payload';
  });
  const bundle = buildFlowBundle([state]);
  const resources = bundle.entry.map((entry) => entry.resource);
  const types = new Set(resources.map((item) => item.resourceType));
  for (const type of ['Location', 'HealthcareService', 'Encounter', 'Observation', 'ServiceRequest', 'CommunicationRequest']) {
    assert.equal(types.has(type), true);
  }
  const observation = resources.find((item) => item.resourceType === 'Observation');
  const serialized = JSON.stringify(observation);
  assert.equal(serialized.includes('queue-count-vermelho'), false);
  assert.equal(serialized.includes('queue-count-laranja'), false);
  assert.equal(serialized.includes('SYNTHETIC_DEMO'), true);
  assert.ok(signerPayloads.length > 0);
  assert.equal(validateFhirResource({ resourceType: 'Observation', id: 'ok' }), true);
  assert.equal(validateFhirResource({ resourceType: 'Observation' }), false);
});

test('FHIR bundle is a collection preview, not an RNDS document submission envelope', () => {
  const state = KAnonymityGuard.sanitizeState(sampleState(), () => 'signature');
  const bundle = buildFlowBundle([state]);
  assert.equal(bundle.type, 'collection');
  assert.equal(bundle.entry.every((entry) => Boolean(entry.fullUrl)), true);
});
