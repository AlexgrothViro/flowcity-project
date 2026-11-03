import {
  HealthUnit,
  UnitLiveState,
  RouteRecommendation,
  TriageResult,
  TeleconsultationAppointment,
  SpecialistReferral,
  ManchesterPriority
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
}): Promise<SpecialistReferral> {
  const res = await fetch(`${API_BASE}/telehealth/referral`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Falha ao solicitar encaminhamento');
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
