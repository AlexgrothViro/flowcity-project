import test from 'node:test';
import assert from 'node:assert/strict';
import { ClinicalTriageProtocol } from '../src/protocols/triage.js';

test('Teletriagem bloqueia teleconsulta em presenca de sinais de alarme criticos (Red Flags)', () => {
  const result = ClinicalTriageProtocol.evaluate({
    sintoma_principal: 'Dor no Peito / Torácica',
    respostas_red_flags: {
      dor_irradiando: true,
      falta_ar_subita: true
    },
    idade: 55
  });

  // Dois red flags criticos -> Vermelho imediato
  assert.equal(result.prioridade_sugerida, 'vermelho');
  assert.equal(result.classificacao_risco, 'EMERGENCIA');
  assert.equal(result.permite_teleconsulta, false);
  assert.equal(result.acionar_samu_urgente, true);
});

test('Teletriagem permite teleconsulta e direciona para APS em sintomas leves', () => {
  const result = ClinicalTriageProtocol.evaluate({
    sintoma_principal: 'Sintomas Respiratórios / Gripe / Tosse',
    respostas_red_flags: {
      falta_ar_grave: false,
      labios_roxos: false,
      sonolencia_extrema: false
    },
    idade: 32
  });

  assert.ok(result.prioridade_sugerida === 'verde' || result.prioridade_sugerida === 'azul');
  assert.equal(result.permite_teleconsulta, true);
  assert.equal(result.acionar_samu_urgente, false);
  assert.ok(result.unidades_recomendadas_ids.includes('usf_santo_afonso'));
});
