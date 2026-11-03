export type ManchesterPriority = 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';

export interface PriorityMetrics {
  fila: number | null;
  wait_med_min: number | null;
  conf: number;
  pacientes_hora?: number;
}

export type UnitType = 'HOSPITAL' | 'UPA' | 'UBS';

export interface HealthUnit {
  id: string;
  nome: string;
  tipo: UnitType;
  bairro: string;
  endereco: string;
  telefone: string;
  coordenadas: { lat: number; lng: number };
  horario_funcionamento: string;
  servicos: string[];
}

export interface ForecastDelta {
  pow_delta: number;
  poo_delta: number;
  tendencia: 'SUBINDO' | 'ESTAVEL' | 'DESCENDO';
  confianca_previsao: number;
}

export interface UnitLiveState {
  unidade_id: string;
  timestamp: string;
  pow: {
    prioridades: Record<ManchesterPriority, PriorityMetrics>;
    tempo_medio_porta_triagem_min: number;
    total_em_fila: number | null;
  };
  poo: {
    salas_abertas: number;
    salas_totais: number;
    ocupacao_salas: number;
    leitos_observacao: {
      ocupados: number | null;
      capacidade: number;
    };
    diagnostico: {
      raio_x: { operacional: boolean; fila_exames: number | null; tempo_medio_min: number };
      laboratorio: { operacional: boolean; fila_exames: number | null; tempo_medio_min: number };
    };
  };
  samu: {
    ambulancias_retidas: number | null;
    tempo_medio_giro_min: number;
  };
  previsao_15min: ForecastDelta;
  previsao_30min: ForecastDelta;
  previsao_60min: ForecastDelta;
  idade_do_dado_s: number;
  fontes: Array<{ tipo: string; peso: number; ultima_leitura: string }>;
  assinatura: string;
}

export interface RouteRecommendation {
  unidade_sugerida: HealthUnit;
  tempo_estimado_deslocamento_min: number;
  tempo_estimado_espera_min: number;
  tempo_total_porta_medico_min: number;
  distancia_km: number;
  justificativa: string;
  alternativas: Array<{
    unidade: HealthUnit;
    tempo_total_min: number;
    diferenca_min: number;
  }>;
}

export interface TriageResult {
  prioridade_sugerida: ManchesterPriority;
  classificacao_risco: 'EMERGENCIA' | 'URGENCIA' | 'POUCO_URGENTE' | 'NAO_URGENTE';
  permite_teleconsulta: boolean;
  recomendacao_imediata: string;
  acionar_samu_urgente: boolean;
  unidades_recomendadas_ids: string[];
}

export type SpecialistField =
  | 'Cardiologia'
  | 'Dermatologia'
  | 'Ortopedia'
  | 'Pediatria'
  | 'Neurologia'
  | 'Ginecologia'
  | 'Psiquiatria';

export interface ClinicalSoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  cid10?: string;
  ciap2?: string;
  professionalRegistration: string;
  updatedAt: string;
  dataMode: 'SYNTHETIC_DEMO';
}
export interface TeleconsultationAppointment {
  id: string;
  protocolo: string;
  paciente_anonimizado_id: string;
  timestamp_criacao: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  medico_mfc_nome: string;
  medico_crm: string;
  link_sala_webrtc: string;
  resumo_caso?: string;
  soap_note?: ClinicalSoapNote;
  encaminhamento_especialista?: SpecialistReferral;
}

export interface SpecialistReferral {
  id: string;
  especialidade: string;
  tipo: 'TELEINTERCONSULTA_IMEDIATA' | 'REGULACAO_SISREG_PRIORITARIA';
  justificativa_clinica: string;
  prioridade_encaminhamento: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'SOLICITADO' | 'EM_ANALISE' | 'APROVADO_AGENDADO';
  timestamp_solicitacao: string;
  crm_solicitante: string;
  parecer_especialista?: string;
  prioridade_declarada?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  score_prioridade_auxiliar?: number;
  criterios_documentais?: {
    pa_aferida: boolean;
    ecg_disponivel: boolean;
    creatinina_disponivel: boolean;
    justificativa_completa: boolean;
  };
  pendencia_documental?: boolean;
  decisao_regulador_pendente?: boolean;
  data_mode?: 'SYNTHETIC_DEMO';
}
