import { TeleconsultationAppointment, SpecialistReferral, SpecialistField } from '../types.js';

export class TelehealthService {
  private appointments: Map<string, TeleconsultationAppointment> = new Map();
  private referrals: Map<string, SpecialistReferral> = new Map();

  constructor() {
    this.seedInitialAppointments();
  }

  private seedInitialAppointments() {
    // Cria alguns agendamentos para demonstracao inicial
    const seedId = 'tele_nh_001';
    const seedReferral: SpecialistReferral = {
      id: 'ref_cardio_101',
      especialidade: 'Cardiologia',
      tipo: 'TELEINTERCONSULTA_IMEDIATA',
      justificativa_clinica: 'Paciente hipertenso de 58 anos com oscilação pressórica recente pós-ajuste de Losartana. Dúvida na associação de Anlodipino.',
      prioridade_encaminhamento: 'MEDIA',
      status: 'EM_ANALISE',
      timestamp_solicitacao: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      crm_solicitante: 'CRM/RS 45892 (Dr. Lucas Mendes - MFC USF Santo Afonso)'
    };

    this.referrals.set(seedReferral.id, seedReferral);

    this.appointments.set(seedId, {
      id: seedId,
      protocolo: '2026-NH-TELE-8941',
      paciente_anonimizado_id: 'PAC-NH-***-72',
      timestamp_criacao: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'EM_ANDAMENTO',
      medico_mfc_nome: 'Dra. Mariana Costa (Clínica de Família)',
      medico_crm: 'CRM/RS 38412',
      link_sala_webrtc: 'https://tele.flowcity.saude.gov.br/room/nh-room-8941',
      resumo_caso: 'Acolhimento de paciente com queixa de tosse seca há 5 dias sem dispneia.',
      encaminhamento_especialista: seedReferral
    });
  }

  public createAppointment(pacienteAnonimizadoId: string, resumoCaso: string): TeleconsultationAppointment {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `tele_nh_${Date.now()}`;
    const protocolo = `2026-NH-TELE-${randomSuffix}`;

    const appointment: TeleconsultationAppointment = {
      id,
      protocolo,
      paciente_anonimizado_id: pacienteAnonimizadoId,
      timestamp_criacao: new Date().toISOString(),
      status: 'AGENDADA',
      medico_mfc_nome: 'Dr. Plantonista Telessaúde APS',
      medico_crm: 'CRM/RS 41092',
      link_sala_webrtc: `https://tele.flowcity.saude.gov.br/room/nh-room-${randomSuffix}`,
      resumo_caso: resumoCaso
    };

    this.appointments.set(id, appointment);
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

    const appt = this.appointments.get(appointmentId);
    if (appt) {
      appt.encaminhamento_especialista = referral;
      this.appointments.set(appointmentId, appt);
    }

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
    return referral;
  }
}
