import React, { useState, useEffect } from 'react';
import {
  HealthUnit,
  UnitLiveState,
  SpecialistReferral
} from '../types.ts';
import {
  fetchMetrics,
  fetchSpecialistReferrals,
  answerSpecialistReferral
} from '../services/api.ts';
import { SituationRoom } from '../components/SituationRoom.tsx';
import {
  Activity,
  Ambulance,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Stethoscope,
  Building2,
  Users,
  FileText,
  Send,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  units: HealthUnit[];
  states: UnitLiveState[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ units, states }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [referrals, setReferrals] = useState<SpecialistReferral[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<SpecialistReferral | null>(null);
  const [specialistOpinion, setSpecialistOpinion] = useState('');
  const [submittingOpinion, setSubmittingOpinion] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [m, r] = await Promise.all([fetchMetrics(), fetchSpecialistReferrals()]);
      setMetrics(m);
      setReferrals(r);
    } catch {}
  };

  const handleAnswerReferral = async () => {
    if (!selectedReferral || !specialistOpinion.trim()) return;
    setSubmittingOpinion(true);
    try {
      await answerSpecialistReferral(selectedReferral.id, specialistOpinion);
      setSpecialistOpinion('');
      setSelectedReferral(null);
      await loadData();
    } catch {
      alert('Erro ao enviar parecer de teleinterconsulta');
    } finally {
      setSubmittingOpinion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operational Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sala de Situação — FlowCity Saúde
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Painel demonstrativo de fila, salas, projeções e cenários
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-slate-600">
            Atualização: <strong className="text-slate-900 font-mono">Simulação local (SSE)</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 font-bold text-cyan-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-600" />
            Previsão demonstrativa
          </span>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients Waiting */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pacientes em Fila na Rede</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {metrics?.total_pacientes_em_fila === null ? "Suprimido" : metrics?.total_pacientes_em_fila ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">
            Distribuídos em 4 unidades integradas
          </div>
        </div>

        {/* Average Yellow Wait */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Média Espera Amarelo (Urgente)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-700">
            ~{metrics?.tempo_medio_amarelo_rede_min === null ? "Indisponível" : metrics?.tempo_medio_amarelo_rede_min ?? 0} min
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Métrica do motor simulado
          </div>
        </div>

        {/* SAMU Ambulance Turnaround */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Giro do SAMU (Retenção Macas)</span>
            <Ambulance className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {metrics?.ambulancias_samu_retidas === null ? "Suprimido" : metrics?.ambulancias_samu_retidas ?? 0}{' '}
            <span className="text-sm font-semibold text-slate-400">ambulâncias</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Tempo médio de liberação: <strong>32 min</strong>
          </div>
        </div>

        {/* Network Balance Index */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ocupação média das salas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {Math.round((metrics?.ocupacao_media_salas ?? 0) * 100)}%
          </div>
          <div className="text-[11px] text-slate-500">
            Média das ocupações simuladas
          </div>
        </div>
      </div>

      {/* Critical Regulation Alert Banner */}
      {metrics?.recomendacao_operacional && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <strong className="text-amber-900 font-extrabold text-sm block">
              Recomendação Operacional da Regulação Automática:
            </strong>
            <p className="text-amber-800 leading-relaxed font-medium">
              {metrics.recomendacao_operacional}
            </p>
          </div>
        </div>
      )}

      <SituationRoom units={units} states={states} />

      {/* Live Units Detail Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-600" />
          Telemetria Comparativa por Unidade (PoW & PoO)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {states.map((st) => {
            const unit = units.find((u) => u.id === st.unidade_id);
            if (!unit) return null;

            return (
              <div
                key={st.unidade_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {unit.tipo}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">{unit.nome}</h3>
                    <p className="text-xs text-slate-500">{unit.bairro} • {unit.horario_funcionamento}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {st.pow.total_em_fila ?? 'Contagem suprimida'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">aguardando</span>
                  </div>
                </div>

                {/* Manchester Table */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5">
                  <div className="grid grid-cols-5 text-center font-bold text-[11px] pb-1 border-b border-slate-200/80">
                    <span className="text-red-600">Vermelho</span>
                    <span className="text-orange-600">Laranja</span>
                    <span className="text-amber-600">Amarelo</span>
                    <span className="text-emerald-600">Verde</span>
                    <span className="text-blue-600">Azul</span>
                  </div>
                  <div className="grid grid-cols-5 text-center font-mono text-xs">
                    <span>{st.pow.prioridades.vermelho.wait_med_min === null ? "Suprimido" : st.pow.prioridades.vermelho.wait_med_min + "m"}</span>
                    <span>{st.pow.prioridades.laranja.wait_med_min === null ? "Suprimido" : st.pow.prioridades.laranja.wait_med_min + "m"}</span>
                    <span className="font-bold text-amber-700">
                      {st.pow.prioridades.amarelo.wait_med_min === null ? "Suprimido" : st.pow.prioridades.amarelo.wait_med_min + "m"}
                    </span>
                    <span>{st.pow.prioridades.verde.wait_med_min === null ? "Suprimido" : st.pow.prioridades.verde.wait_med_min + "m"}</span>
                    <span>{st.pow.prioridades.azul.wait_med_min === null ? "Suprimido" : st.pow.prioridades.azul.wait_med_min + "m"}</span>
                  </div>
                </div>

                {/* Nowcasting Deltas (15m, 30m, 60m) */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">+15 min</span>
                    <span className="font-extrabold text-slate-800">
                      {st.previsao_15min.pow_delta > 0 ? '+' : ''}
                      {Math.round(st.previsao_15min.pow_delta * 100)}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">+30 min</span>
                    <span className="font-extrabold text-slate-800">
                      {st.previsao_30min.pow_delta > 0 ? '+' : ''}
                      {Math.round(st.previsao_30min.pow_delta * 100)}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">+60 min</span>
                    <span className="font-extrabold text-slate-800">
                      {st.previsao_60min.pow_delta > 0 ? '+' : ''}
                      {Math.round(st.previsao_60min.pow_delta * 100)}%
                    </span>
                  </div>
                </div>

                {/* Diagnostics and Beds */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span>
                    Consultórios: <strong>{st.poo.salas_abertas}/{st.poo.salas_totais}</strong>
                  </span>
                  <span>
                    Leitos Obs:{' '}
                    <strong>
                      {st.poo.leitos_observacao.ocupados ?? 'Suprimido'}/{st.poo.leitos_observacao.capacidade}
                    </strong>
                  </span>
                  <span>
                    Raio-X: <strong>{st.poo.diagnostico.raio_x.fila_exames ?? 'Suprimido'} na fila</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teleinterconsulta / Specialist Referrals Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-700" />
              Solicitações demonstrativas de encaminhamento
            </h2>
            <p className="text-xs text-slate-500">
              Solicitações sintéticas aguardando revisão humana; sem integração com SISREG ou TelessaúdeRS.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            {referrals.length} Solicitações Ativas
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Especialidade</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Justificativa Clínica</th>
                  <th className="p-3.5">Solicitante</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      {ref.especialidade}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-200">
                        {ref.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-xs truncate">
                      {ref.justificativa_clinica}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {ref.crm_solicitante}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          ref.status === 'APROVADO_AGENDADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReferral(ref)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm transition"
                      >
                        Avaliar Parecer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Specialist Opinion Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-bold text-cyan-700 uppercase">
                  Matriciamento Médico — {selectedReferral.especialidade}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Registrar parecer demonstrativo
                </h3>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-800 block">Quadro Clínico Relatado pelo MFC:</span>
              <p className="text-slate-700 italic">"{selectedReferral.justificativa_clinica}"</p>
              <span className="text-[11px] text-slate-500 block pt-1">
                Solicitante: {selectedReferral.crm_solicitante}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Parecer / Conduta do Médico Especialista Focal:
              </label>
              <textarea
                value={specialistOpinion}
                onChange={(e) => setSpecialistOpinion(e.target.value)}
                placeholder="Resumo sintético do parecer profissional. Use apenas conteúdo fictício."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAnswerReferral}
                disabled={submittingOpinion || !specialistOpinion.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingOpinion ? 'Gravando...' : 'Registrar parecer demonstrativo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
