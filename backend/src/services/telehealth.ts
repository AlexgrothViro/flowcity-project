import { TeleconsultationAppointment, SpecialistReferral, SpecialistField } from '../types.js';
import { PersistenceService } from './persistence.js';

export class TelehealthService {
  private appointments: Map<string, TeleconsultationAppointment> = new Map();
  private referrals: Map<string, SpecialistReferral> = new Map();

  public constructor(private readonly persistence: PersistenceService = new PersistenceService()) {}

  private persist(operation: Promise<void>): void {
    void operation.catch((error: unknown) => {
      console.error(JSON.stringify({ level: 'error', event: 'telehealth_persistence_failed', message: error instanceof Error ? error.message : 'unknown error' }));
    });
  }

  public async restorePersistedRecords(): Promise<void> {
    await this.persistence.ready;
    const [appointments, referrals] = await Promise.all([
      this.persistence.loadAppointments(),
      this.persistence.loadReferrals()
    ]);
    this.appointments = new Map(appointments.map((appointment) => [appointment.id, appointment]));
    this.referrals = new Map(referrals.map((referral) => [referral.id, referral]));
  }

  public createAppointment(pacienteAnonimizadoId: string, resumoCaso: string): TeleconsultationAppointment {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `tele_nh_${Date.now()}`;
    const appointment: TeleconsultationAppointment = {
      id,
      protocolo: `2026-NH-TELE-${randomSuffix}`,
      paciente_anonimizado_id: pacienteAnonimizadoId,
      timestamp_criacao: new Date().toISOString(),
      status: 'AGENDADA',
      medico_mfc_nome: 'Equipe de Atenção Primária',
      medico_crm: '',
      link_sala_webrtc: '',
      resumo_caso: resumoCaso
    };
    this.appointments.set(id, appointment);
    this.persist(this.persistence.saveAppointment(appointment));
    this.persist(this.persistence.appendWorkflowEvent('consultation', null, { appointmentId: id, status: appointment.status }));
    this.persist(this.persistence.appendAudit({ actor: 'telehealth', action: 'appointment.created', entityType: 'telehealth_appointment', entityId: id }));
    return appointment;
  }

  public getAllAppointments(): TeleconsultationAppointment[] {
    return Array.from(this.appointments.values()).sort(
      (a, b) => new Date(b.timestamp_criacao).getTime() - new Date(a.timestamp_criacao).getTime()
    );
  }

  public getAppointmentById(id: string): TeleconsultationAppointment | undefined {
    return this.appointments.get(id);
  }

  public requestSpecialistReferral(
    appointmentId: string,
    especialidade: SpecialistField,
    tipo: 'TELEINTERCONSULTA_IMEDIATA' | 'REGULACAO_SISREG_PRIORITARIA',
    justificativaClinica: string,
    crmSolicitante: string
  ): SpecialistReferral {
    const referralId = `ref_${Date.now()}`;
    const referral: SpecialistReferral = {
      id: referralId,
      especialidade,
      tipo,
      justificativa_clinica: justificativaClinica,
      prioridade_encaminhamento: 'ALTA',
      status: 'SOLICITADO',
      timestamp_solicitacao: new Date().toISOString(),
      crm_solicitante: crmSolicitante
    };
    this.referrals.set(referralId, referral);
    const appointment = this.appointments.get(appointmentId);
    if (appointment) {
      appointment.encaminhamento_especialista = referral;
      this.appointments.set(appointmentId, appointment);
      this.persist(this.persistence.saveAppointment(appointment));
    }
    this.persist(this.persistence.saveReferral(referral));
    this.persist(this.persistence.appendWorkflowEvent('consultation', null, { appointmentId, referralId, specialty: especialidade }));
    this.persist(this.persistence.appendAudit({ actor: 'telehealth', action: 'referral.requested', entityType: 'specialist_referral', entityId: referralId }));
    return referral;
  }

  public getAllReferrals(): SpecialistReferral[] {
    return Array.from(this.referrals.values()).sort(
      (a, b) => new Date(b.timestamp_solicitacao).getTime() - new Date(a.timestamp_solicitacao).getTime()
    );
  }

  public answerReferral(
    referralId: string,
    parecer: string,
    status: 'APROVADO_AGENDADO' | 'EM_ANALISE'
  ): SpecialistReferral | undefined {
    const referral = this.referrals.get(referralId);
    if (!referral) return undefined;
    referral.parecer_especialista = parecer;
    referral.status = status;
    this.referrals.set(referralId, referral);
    this.persist(this.persistence.saveReferral(referral));
    this.persist(this.persistence.appendAudit({
      actor: 'telehealth',
      action: 'referral.answered',
      entityType: 'specialist_referral',
      entityId: referralId,
      details: { status }
    }));
    return referral;
  }
}
