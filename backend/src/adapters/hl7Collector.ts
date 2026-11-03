import type { PersistenceService } from '../services/persistence.js';

/**
 * Parser and persistence adapter for HL7 v2 ADT messages (A01/A08/A03).
 * Messages must be accepted only from a configured trusted ingress outside this class.
 * No patient identifiers or raw messages are persisted.
 */
export interface ParsedHl7Event {
  messageType: string;
  unitId: string;
  eventType: 'ADMISSAO' | 'TRIAGEM_MANCHESTER' | 'ALTA';
  priority?: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';
  timestamp: string;
}

export class Hl7CollectorAdapter {
  public constructor(private readonly persistence?: PersistenceService) {}

  public async ingest(rawMessage: string): Promise<ParsedHl7Event | null> {
    const event = Hl7CollectorAdapter.parseAdtMessage(rawMessage);
    if (!event || !this.persistence) return event;
    const normalizedType = event.eventType === 'ADMISSAO'
      ? 'admission'
      : event.eventType === 'ALTA'
        ? 'discharge'
        : 'triage';
    await this.persistence.appendWorkflowEvent(normalizedType, event.unitId, {
      source: 'HL7_V2_ADT',
      messageType: event.messageType,
      priority: event.priority,
      occurredAt: event.timestamp,
      dataMode: 'OPERATIONAL'
    });
    await this.persistence.appendAudit({
      actor: 'hl7-adapter',
      action: 'workflow_event.ingested',
      entityType: 'workflow_event',
      details: { source: 'HL7_V2_ADT', eventType: event.eventType, unitId: event.unitId }
    });
    return event;
  }

  public static parseAdtMessage(rawMessage: string): ParsedHl7Event | null {
    try {
      const lines = rawMessage.trim().split(/\r?\n/);
      const msh = lines.find((line) => line.startsWith('MSH'));
      if (!msh) return null;
      const fields = msh.split('|');
      const messageType = fields[8] || '';
      let eventType: ParsedHl7Event['eventType'] = 'ADMISSAO';
      if (messageType.includes('A08')) eventType = 'TRIAGEM_MANCHESTER';
      else if (messageType.includes('A03')) eventType = 'ALTA';

      let priority: ParsedHl7Event['priority'] = 'verde';
      const pv1 = lines.find((line) => line.startsWith('PV1'));
      const text = pv1?.toLowerCase() || '';
      if (text.includes('amarelo')) priority = 'amarelo';
      if (text.includes('laranja')) priority = 'laranja';
      if (text.includes('vermelho')) priority = 'vermelho';
      if (text.includes('azul')) priority = 'azul';

      return { messageType, unitId: 'hmnh_hospital', eventType, priority, timestamp: new Date().toISOString() };
    } catch {
      return null;
    }
  }
}
