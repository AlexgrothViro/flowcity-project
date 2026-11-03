export type ManchesterPriority = 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';

export interface PriorityMetrics {
  fila: number;
  wait_med_min: number;
  conf: number; // 0.0 a 1.0
  pacientes_hora?: number;
}

export interface UnitCoordinates {
  lat: number;
  lng: number;
}

export type UnitType = 'HOSPITAL' | 'UPA' | 'UBS';

export interface UnitObservationBeds {
  ocupados: number;
  capacidade: number;
  ventiladores_ocupados?: number;
  ventiladores_total?: number;
}

export interface UnitDiagnosticStatus {
  raio_x: { operacional: boolean; fila_exames: number; tempo_medio_min: number };
  laboratorio: { operacional: boolean; fila_exames: number; tempo_medio_min: number };
  eletrocardiograma?: { operacional: boolean; tempo_medio_min: number };
}

export interface DataSourceWeight {
  tipo: 'HIS/ADT' | 'sensor_porta' | 'e-SUS/PEC' | 'SISREG' | 'triagem_totem';
  peso: number;
  ultima_leitura: string;
}

export interface ForecastDelta {
  pow_delta: number; // Ex: -0.12 (-12% no tempo de espera)
  poo_delta: number; // Ex: +0.05 (+5% na ocupacao)
  tendencia: 'SUBINDO' | 'ESTAVEL' | 'DESCENDO';
  confianca_previsao: number;
}

export interface HealthUnit {
  id: string;
  nome: string;
  tipo: UnitType;
  bairro: string;
  endereco: string;
  telefone: string;
  coordenadas: UnitCoordinates;
  horario_funcionamento: string;
  servicos: string[];
}

export interface UnitLiveState {
  unidade_id: string;
  timestamp: string;
  pow: {
    prioridades: Record<ManchesterPriority, PriorityMetrics>;
    tempo_medio_porta_triagem_min: number;
    total_em_fila: number;
  };
  poo: {
    salas_abertas: number;
    salas_totais: number;
    ocupacao_salas: number; // 0.0 a 1.0
    leitos_observacao: UnitObservationBeds;
    diagnostico: UnitDiagnosticStatus;
  };
  samu: {
    ambulancias_retidas: number;
    tempo_medio_giro_min: number;
  };
  previsao_15min: ForecastDelta;
  previsao_30min: ForecastDelta;
  previsao_60min: ForecastDelta;
  idade_do_dado_s: number;
  fontes: DataSourceWeight[];
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

// Telehealth and Triage types
export interface SymptomEvaluationRequest {
  sintoma_principal: string;
  respostas_red_flags: Record<string, boolean>;
  idade: number;
  gestante?: boolean;
  comorbidades?: string[];
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
  encaminhamento_especialista?: SpecialistReferral;
  receita_digital_id?: string;
}

export interface SpecialistReferral {
  id: string;
  especialidade: SpecialistField;
  tipo: 'TELEINTERCONSULTA_IMEDIATA' | 'REGULACAO_SISREG_PRIORITARIA';
  justificativa_clinica: string;
  prioridade_encaminhamento: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'SOLICITADO' | 'EM_ANALISE' | 'APROVADO_AGENDADO';
  timestamp_solicitacao: string;
  crm_solicitante: string;
  parecer_especialista?: string;
}
