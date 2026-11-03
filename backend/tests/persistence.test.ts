import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PersistenceService } from '../src/services/persistence.js';
import type { SpecialistReferral, TeleconsultationAppointment, UnitLiveState } from '../src/types.js';

test('SQLite WAL persists and restores snapshots and telehealth records across restart', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flowcity-persistence-'));
  const previousPath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = path.join(directory, 'flowcity.sqlite');

  try {
    const first = new PersistenceService();
    await first.ready;
    assert.equal(first.driver, 'sqlite');

    const snapshot = {
      unidade_id: 'upa_canudos',
      timestamp: '2026-11-03T12:00:00.000Z',
      pow: { total_em_fila: 2 },
      assinatura: 'test-signature'
    } as unknown as UnitLiveState;
    const appointment = {
      id: 'appointment-1',
      protocolo: 'NH-1',
      paciente_anonimizado_id: 'anon-1',
      timestamp_criacao: snapshot.timestamp,
      status: 'AGENDADA',
      medico_mfc_nome: 'Equipe APS',
      medico_crm: '',
      link_sala_webrtc: ''
    } as TeleconsultationAppointment;
    const referral = {
      id: 'referral-1',
      especialidade: 'Cardiologia',
      tipo: 'REGULACAO_SISREG_PRIORITARIA',
      justificativa_clinica: 'Persistência de teste',
      prioridade_encaminhamento: 'MEDIA',
      status: 'SOLICITADO',
      timestamp_solicitacao: snapshot.timestamp,
      crm_solicitante: 'test'
    } as SpecialistReferral;

    await first.saveSnapshot(snapshot);
    await first.saveAppointment(appointment);
    await first.saveReferral(referral);
    await first.appendWorkflowEvent('triage', 'upa_canudos', { priority: 'verde' });
    await first.appendAudit({ actor: 'test', action: 'persist.test', entityType: 'test', entityId: '1' });
    await first.close();

    const reopened = new PersistenceService();
    await reopened.ready;
    assert.deepEqual(await reopened.loadLatestSnapshots(), [snapshot]);
    assert.deepEqual(await reopened.loadAppointments(), [appointment]);
    assert.deepEqual(await reopened.loadReferrals(), [referral]);
    await reopened.close();
  } finally {
    if (previousPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
});
