/**
 * Adaptador para integracao com sistemas hospitalares (MV, Tasy, AGHUse)
 * atraves de mensagens padrao HL7 v2 (MLLP).
 * Processa mensagens ADT (Admission, Discharge, Transfer):
 * - ADT^A01: Admissao de paciente no pronto-socorro
 * - ADT^A08: Atualizacao de triagem de risco (Manchester)
 * - ADT^A03: Alta / saida do paciente
 */
export interface ParsedHl7Event {
  messageType: string;
  unitId: string;
  eventType: 'ADMISSAO' | 'TRIAGEM_MANCHESTER' | 'ALTA';
  priority?: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';
  timestamp: string;
}

export class Hl7CollectorAdapter {
  /**
   * Faz o parse basico de uma mensagem HL7 v2 delimitada por pipes (|)
   */
  public static parseAdtMessage(rawMessage: string): ParsedHl7Event | null {
    try {
      const lines = rawMessage.trim().split(/\r?\n/);
      const msh = lines.find((l) => l.startsWith('MSH'));
      if (!msh) return null;

      const mshFields = msh.split('|');
      const messageType = mshFields[8] || ''; // Ex: ADT^A08

      let eventType: 'ADMISSAO' | 'TRIAGEM_MANCHESTER' | 'ALTA' = 'ADMISSAO';
      if (messageType.includes('A08')) eventType = 'TRIAGEM_MANCHESTER';
      else if (messageType.includes('A03')) eventType = 'ALTA';

      // Procura segmento PV1 ou Z-segment com a classificacao Manchester
      let priority: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul' = 'verde';
      const pv1 = lines.find((l) => l.startsWith('PV1'));
      if (pv1 && pv1.toLowerCase().includes('amarelo')) priority = 'amarelo';
      if (pv1 && pv1.toLowerCase().includes('laranja')) priority = 'laranja';
      if (pv1 && pv1.toLowerCase().includes('vermelho')) priority = 'vermelho';
      if (pv1 && pv1.toLowerCase().includes('azul')) priority = 'azul';

      return {
        messageType,
        unitId: 'hmnh_hospital',
        eventType,
        priority,
        timestamp: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }
}
