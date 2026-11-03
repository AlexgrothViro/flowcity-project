import test from 'node:test';
import assert from 'node:assert/strict';
import { SignerService } from '../src/services/signer.js';

test('SignerService gera e valida assinaturas Ed25519', () => {
  const signer = new SignerService();
  const pubKey = signer.getPublicKey();

  const payload = {
    unidade_id: 'upa_canudos',
    tempo_espera_min: 24,
    timestamp: '2026-11-03T10:00:00Z'
  };

  const signature = signer.signPayload(payload);
  assert.ok(signature.startsWith('ed25519:'));

  // Validacao com a chave publica original deve passar
  const isValid = SignerService.verifySignature(payload, signature, pubKey);
  assert.equal(isValid, true);

  // Alteracao no payload (tampering) deve invalidar a assinatura
  const tamperedPayload = { ...payload, tempo_espera_min: 99 };
  const isTamperedValid = SignerService.verifySignature(tamperedPayload, signature, pubKey);
  assert.equal(isTamperedValid, false);
});
