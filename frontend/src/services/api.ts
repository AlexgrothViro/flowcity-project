import {
  HealthUnit,
  UnitLiveState,
  RouteRecommendation,
  TriageResult,
  TeleconsultationAppointment,
  SpecialistReferral,
  ManchesterPriority,
  ClinicalSoapNote
} from '../types.ts';

const API_BASE = '/api/v0';

export async function fetchUnits(): Promise<{ municipio: any; unidades: HealthUnit[] }> {
  const res = await fetch(`${API_BASE}/units`);
  if (!res.ok) throw new Error('Falha ao carregar unidades');
  return res.json();
}

export async function fetchStates(): Promise<{ timestamp: string; unidades: UnitLiveState[] }> {
  const res = await fetch(`${API_BASE}/states`);
  if (!res.ok) throw new Error('Falha ao carregar telemetria de estados');
  return res.json();
}

export interface WaitHistoryPoint {
  captured_at: string;
  wait_yellow_minutes: number | null;
  yellow_count: number | null;
  data_mode: string;
}

export async function fetchWaitHistory(unitId: string, hours = 24): Promise<{
  unit_id: string;
  hours: number;
  k: number;
  count: number;
  data_mode: string;
  points: WaitHistoryPoint[];
}> {
  const query = new URLSearchParams({ unitId, hours: String(hours) });
  const res = await fetch(`${API_BASE}/history/wait-times?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar histórico de espera');
  return res.json();
}

export interface QueueScenarioInput {
  arrivalRatePerHour: number;
  averageServiceMinutes: number;
  servers: number;
  queueCapacity: number;
  durationMinutes: number;
  runs: number;
  arrivalMultiplier: number;
  additionalServers: number;
  seed: number;
}

export interface QueueScenarioOutput {
  runs: number;
  meanWaitMinutes: number;
  p95MeanWaitMinutes: number;
  meanQueueLength: number;
  rejectionRate: number;
  servedPerHour: number;
}

export async function simulateQueueScenario(scenario: QueueScenarioInput): Promise<QueueScenarioOutput> {
  const res = await fetch(`${API_BASE}/simulation/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario)
  });
  if (!res.ok) throw new Error('Cenário inválido para o simulador');
  const data = await res.json();
  return data.result;
}

export async function fetchMetrics(): Promise<any> {
  const res = await fetch(`${API_BASE}/system/metrics`);
  if (!res.ok) throw new Error('Falha ao carregar metricas');
  return res.json();
}

export async function requestRoute(
  lat: number,
  lng: number,
  prioridade: ManchesterPriority
): Promise<RouteRecommendation> {
  const res = await fetch(`${API_BASE}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, prioridade })
  });
  if (!res.ok) throw new Error('Falha ao calcular rota');
  return res.json();
}

export async function fetchTriageCatalog(): Promise<any> {
  const res = await fetch(`${API_BASE}/triage/catalog`);
  if (!res.ok) throw new Error('Falha ao carregar catalogo de triagem');
  return res.json();
}

export async function evaluateTriage(payload: any): Promise<TriageResult> {
  const res = await fetch(`${API_BASE}/triage/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Falha ao avaliar triagem');
  return res.json();
}

export async function createTelehealthAppointment(resumoCaso: string): Promise<TeleconsultationAppointment> {
  const res = await fetch(`${API_BASE}/telehealth/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumo_caso: resumoCaso })
  });
  if (!res.ok) throw new Error('Falha ao agendar teleconsulta');
  return res.json();
}

export async function fetchTelehealthAppointments(): Promise<TeleconsultationAppointment[]> {
  const res = await fetch(`${API_BASE}/telehealth/appointments`);
  if (!res.ok) throw new Error('Falha ao carregar teleconsultas');
  return res.json();
}

export async function requestSpecialistReferral(data: {
  consulta_id: string;
  especialidade: string;
  tipo: string;
  justificativa_clinica: string;
  crm_solicitante: string;
  prioridade_declarada: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  criterios_documentais: { pa_aferida: boolean; ecg_disponivel: boolean; creatinina_disponivel: boolean };
}): Promise<SpecialistReferral> {
  const res = await fetch(`${API_BASE}/telehealth/referral`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Falha ao solicitar encaminhamento');
  return res.json();
}
export async function saveClinicalSoapNote(appointmentId: string, note: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  cid10?: string;
  ciap2?: string;
  professionalRegistration: string;
}): Promise<ClinicalSoapNote> {
  const res = await fetch(`${API_BASE}/telehealth/appointments/${encodeURIComponent(appointmentId)}/soap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  });
  if (!res.ok) throw new Error('Falha ao salvar registro SOAP');
  return res.json();
}

export interface SignedDocumentVerificationPackage {
  document: Record<string, unknown>;
  signature: string;
  public_key_hex: string;
  sha256: string;
}

export async function verifySignedClinicalDocument(packageData: SignedDocumentVerificationPackage): Promise<{
  integrityValid: boolean;
  hashMatches: boolean;
  signatureMatches: boolean;
  issuerVerified: false;
  status: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/telehealth/documents/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packageData)
  });
  if (!res.ok) throw new Error('Pacote de verificação inválido');
  return res.json();
}

export async function fetchSpecialistReferrals(): Promise<SpecialistReferral[]> {
  const res = await fetch(`${API_BASE}/telehealth/referrals`);
  if (!res.ok) throw new Error('Falha ao carregar encaminhamentos');
  return res.json();
}

export async function answerSpecialistReferral(id: string, parecer: string): Promise<SpecialistReferral> {
  const res = await fetch(`${API_BASE}/telehealth/referrals/${id}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parecer, status: 'APROVADO_AGENDADO' })
  });
  if (!res.ok) throw new Error('Falha ao responder encaminhamento');
  return res.json();
}

export async function sendWhatsAppMessage(message: string): Promise<any> {
  const res = await fetch(`${API_BASE}/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, phone: '51999887766' })
  });
  if (!res.ok) throw new Error('Falha ao enviar mensagem');
  return res.json();
}

export function subscribeToLiveStates(onUpdate: (states: UnitLiveState[]) => void): () => void {
  // Tenta SSE primeiro
  try {
    const eventSource = new EventSource(`${API_BASE}/events/stream`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          onUpdate(data);
        }
      } catch (err) {
        console.error('Erro ao processar dados de SSE:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Fallback para polling
      const interval = setInterval(async () => {
        try {
          const res = await fetchStates();
          onUpdate(res.unidades);
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  } catch {
    // Polling fallback
    const interval = setInterval(async () => {
      try {
        const res = await fetchStates();
        onUpdate(res.unidades);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }
}
