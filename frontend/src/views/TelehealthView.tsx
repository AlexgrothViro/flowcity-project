import React, { useState } from 'react';
import { CheckCircle2, Send, ShieldAlert, Stethoscope, Video } from 'lucide-react';
import type { SpecialistField } from '../types.ts';
import { requestSpecialistReferral } from '../services/api.ts';
import { ClinicalWorkflowPanel } from '../components/ClinicalWorkflowPanel.tsx';

interface TelehealthViewProps {
  initialAppointmentId?: string;
  onReferralCreated?: () => void;
}

export const TelehealthView: React.FC<TelehealthViewProps> = ({ initialAppointmentId, onReferralCreated }) => {
  const [specialty, setSpecialty] = useState<SpecialistField>('Cardiologia');
  const [interactionType, setInteractionType] = useState<'TELEINTERCONSULTA_IMEDIATA' | 'REGULACAO_SISREG_PRIORITARIA'>('REGULACAO_SISREG_PRIORITARIA');
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'>('MEDIA');
  const [registration, setRegistration] = useState('');
  const [justification, setJustification] = useState('');
  const [evidence, setEvidence] = useState({ pa_aferida: false, ecg_disponivel: false, creatinina_disponivel: false });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ score_prioridade_auxiliar?: number; pendencia_documental?: boolean } | null>(null);

  const submitReferral = async () => {
    if (!initialAppointmentId) return;
    setSending(true);
    setError('');
    try {
      const response = await requestSpecialistReferral({
        consulta_id: initialAppointmentId,
        especialidade: specialty,
        tipo: interactionType,
        justificativa_clinica: justification,
        crm_solicitante: registration,
        prioridade_declarada: priority,
        criterios_documentais: evidence
      });
      setResult(response);
      onReferralCreated?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível registrar a solicitação.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-cyan-100 p-2 text-cyan-800"><Video className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Fluxo demonstrativo de telessaúde</h1>
            <p className="mt-1 text-xs text-slate-600">Prontuário SOAP, encaminhamento auxiliar e verificação técnica de integridade documental.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" />WebRTC, TelessaúdeRS e SISREG não estão conectados.</span>
          <span>Use somente dados sintéticos. Não é prontuário ou serviço clínico de produção.</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">Consulta demonstrativa: <span className="font-mono">{initialAppointmentId || 'nenhuma consulta aberta'}</span></p>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <ClinicalWorkflowPanel appointmentId={initialAppointmentId} />

        <section className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="referral-title">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="h-4 w-4 text-cyan-700" />
            <h2 id="referral-title" className="font-bold text-sm text-slate-900">Encaminhamento para revisão humana</h2>
          </div>
          <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">Os protocolos de acesso devem ser definidos e adaptados pelo território. O score é demonstrativo, não estima risco clínico e não substitui a análise do regulador.</p>

          <label className="block text-xs font-semibold text-slate-700">
            Especialidade
            <select value={specialty} onChange={(event) => setSpecialty(event.target.value as SpecialistField)} className={inputClass}>
              <option>Cardiologia</option><option>Dermatologia</option><option>Ortopedia</option><option>Pediatria</option><option>Neurologia</option><option>Ginecologia</option><option>Psiquiatria</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Tipo de solicitação
            <select value={interactionType} onChange={(event) => setInteractionType(event.target.value as typeof interactionType)} className={inputClass}>
              <option value="TELEINTERCONSULTA_IMEDIATA">Teleinterconsulta imediata (canal não conectado)</option>
              <option value="REGULACAO_SISREG_PRIORITARIA">Regulação ambulatorial (integração não conectada)</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Prioridade declarada pelo profissional
            <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className={inputClass}>
              <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option>
            </select>
          </label>

          <fieldset className="rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-xs font-semibold text-slate-700">Informações documentais disponíveis (não bloqueantes)</legend>
            {([
              ['pa_aferida', 'Pressão arterial documentada'],
              ['ecg_disponivel', 'ECG prévio disponível'],
              ['creatinina_disponivel', 'Creatinina disponível']
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 py-1.5 text-xs text-slate-700">
                <input type="checkbox" checked={evidence[key]} onChange={(event) => setEvidence((current) => ({ ...current, [key]: event.target.checked }))} />
                {label}
              </label>
            ))}
            {specialty === 'Cardiologia' && !(evidence.pa_aferida && (evidence.ecg_disponivel || evidence.creatinina_disponivel)) && (
              <p className="mt-1 text-[11px] text-amber-800">Pendência documental sugerida para revisão; a solicitação não é bloqueada.</p>
            )}
          </fieldset>

          <label className="block text-xs font-semibold text-slate-700">
            Registro profissional do solicitante
            <input value={registration} onChange={(event) => setRegistration(event.target.value)} maxLength={80} placeholder="Identificador demonstrativo, não validado" className={inputClass} />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Justificativa clínica sintética
            <textarea value={justification} onChange={(event) => setJustification(event.target.value)} rows={5} maxLength={4000} className={inputClass} placeholder="Descreva o motivo do encaminhamento usando dados fictícios." />
          </label>

          {result && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Solicitação sintética registrada. Score administrativo auxiliar: {result.score_prioridade_auxiliar ?? '—'}/100. Pendência documental: {result.pendencia_documental ? 'sim' : 'não'}. Requer decisão humana; nenhum sistema externo foi notificado.</p>
            </div>
          )}
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
          <button type="button" disabled={!initialAppointmentId || registration.trim().length < 4 || justification.trim().length < 20 || sending} onClick={() => void submitReferral()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="h-4 w-4" />{sending ? 'Registrando…' : 'Registrar solicitação demonstrativa'}
          </button>
        </section>
      </div>
    </div>
  );
};
