import { createHash } from 'node:crypto';
import { SignerService } from './signer.js';
import type { SpecialistField } from '../types.js';

export type DeclaredClinicalPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface ReferralEvidence {
  paAferida?: boolean;
  ecgDisponivel?: boolean;
  creatininaDisponivel?: boolean;
  justificativaCompleta?: boolean;
}

const declaredPriorityPoints: Record<DeclaredClinicalPriority, number> = {
  BAIXA: 10,
  MEDIA: 25,
  ALTA: 40,
  URGENTE: 55
};

export function assessReferralSupport(input: {
  specialty: SpecialistField;
  declaredPriority: DeclaredClinicalPriority;
  waitingDays: number;
  evidence: ReferralEvidence;
}) {
  const evidence = [
    input.evidence.paAferida === true,
    input.evidence.ecgDisponivel === true,
    input.evidence.creatininaDisponivel === true,
    input.evidence.justificativaCompleta === true
  ];
  const evidencePoints = Math.round((evidence.filter(Boolean).length / evidence.length) * 30);
  const waitingPoints = Math.min(15, Math.max(0, Math.floor(input.waitingDays / 2)));
  const priorityScore = Math.min(100, declaredPriorityPoints[input.declaredPriority] + evidencePoints + waitingPoints);
  const cardiologyMinimumPending = input.specialty === 'Cardiologia'
    && !(input.evidence.paAferida && (input.evidence.ecgDisponivel || input.evidence.creatininaDisponivel));

  return {
    priorityScore,
    declaredPriority: input.declaredPriority,
    evidencePoints,
    waitingPoints,
    cardiologyMinimumPending,
    requiresProfessionalReview: true as const,
    dataMode: 'SYNTHETIC_DEMO' as const,
    interpretation: 'Apoio administrativo demonstrativo; não é classificação clínica, não substitui protocolos locais nem decisão do regulador.'
  };
}

export function verifySignedClinicalDocument(input: {
  document: Record<string, unknown>;
  signature: string;
  publicKeyHex: string;
  sha256: string;
}) {
  const serialized = JSON.stringify(input.document);
  const calculatedHash = createHash('sha256').update(serialized, 'utf8').digest('hex');
  const hashMatches = calculatedHash === input.sha256.toLowerCase();
  const signatureMatches = hashMatches
    && SignerService.verifySignature(input.document, input.signature, input.publicKeyHex);

  return {
    integrityValid: signatureMatches,
    hashMatches,
    signatureMatches,
    issuerVerified: false as const,
    status: signatureMatches ? 'INTEGRIDADE_VALIDADA' as const : 'INVALIDO_OU_ALTERADO' as const,
    message: signatureMatches
      ? 'Integridade criptográfica validada. A identidade do emissor e a validade legal não foram verificadas.'
      : 'Hash ou assinatura inválidos para o conteúdo informado.',
    dataMode: 'SYNTHETIC_DEMO' as const
  };
}
