import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { assessReferralSupport, verifySignedClinicalDocument } from '../src/services/clinicalWorkflow.js';
import { TelehealthService } from '../src/services/telehealth.js';
import { PersistenceService } from '../src/services/persistence.js';
import { SignerService } from '../src/services/signer.js';

test('cardiology checklist flags missing documentation without blocking referral support', () => {
  const result = assessReferralSupport({
    specialty: 'Cardiologia',
    declaredPriority: 'ALTA',
    waitingDays: 0,
    evidence: { paAferida: true, ecgDisponivel: false, creatininaDisponivel: false, justificativaCompleta: true }
  });
  assert.equal(result.cardiologyMinimumPending, true);
  assert.equal(result.requiresProfessionalReview, true);
  assert.equal(result.dataMode, 'SYNTHETIC_DEMO');
  assert.match(result.interpretation, /não é classificação clínica/);
});

test('referral support score is bounded and increases with declared priority and evidence', () => {
  const minimal = assessReferralSupport({
    specialty: 'Dermatologia',
    declaredPriority: 'BAIXA',
    waitingDays: 0,
    evidence: {}
  });
  const complete = assessReferralSupport({
    specialty: 'Dermatologia',
    declaredPriority: 'URGENTE',
    waitingDays: 90,
    evidence: { paAferida: true, ecgDisponivel: true, creatininaDisponivel: true, justificativaCompleta: true }
  });
  assert.ok(minimal.priorityScore >= 0);
  assert.ok(complete.priorityScore <= 100);
  assert.ok(complete.priorityScore > minimal.priorityScore);
});

test('document verifier checks SHA-256 and Ed25519 integrity but does not assert issuer trust', () => {
  const signer = new SignerService();
  const document = { id: 'synthetic-doc-1', type: 'demonstration', value: 'example' };
  const signature = signer.signPayload(document);
  const sha256 = createHash('sha256').update(JSON.stringify(document), 'utf8').digest('hex');
  const valid = verifySignedClinicalDocument({
    document,
    signature,
    publicKeyHex: signer.getPublicKey(),
    sha256
  });
  assert.equal(valid.integrityValid, true);
  assert.equal(valid.issuerVerified, false);

  const tampered = verifySignedClinicalDocument({
    document: { ...document, value: 'changed' },
    signature,
    publicKeyHex: signer.getPublicKey(),
    sha256
  });
  assert.equal(tampered.integrityValid, false);
});

test('SOAP note is persisted on its synthetic telehealth appointment', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flowcity-soap-'));
  const previousPath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = path.join(directory, 'flowcity.sqlite');
  const persistence = new PersistenceService();

  try {
    await persistence.ready;
    const service = new TelehealthService(persistence);
    await service.restorePersistedRecords();
    const appointment = service.createAppointment('SYNTHETIC-PATIENT', 'Synthetic test appointment');
    const note = await service.saveClinicalNote(appointment.id, {
      subjective: 'Synthetic subject',
      objective: 'Synthetic objective',
      assessment: 'Synthetic assessment',
      plan: 'Synthetic plan',
      cid10: 'A90',
      ciap2: 'A77',
      professionalRegistration: 'DEMO-CRM'
    });
    assert.equal(note?.dataMode, 'SYNTHETIC_DEMO');
    const stored = (await persistence.loadAppointments()).find((item) => item.id === appointment.id);
    assert.equal(stored?.soap_note?.cid10, 'A90');
    assert.equal(stored?.soap_note?.ciap2, 'A77');
  } finally {
    await persistence.close();
    if (previousPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
});
