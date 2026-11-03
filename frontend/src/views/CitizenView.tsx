import React, { useState } from 'react';
import {
  HealthUnit,
  UnitLiveState,
  RouteRecommendation,
  TriageResult,
  ManchesterPriority
} from '../types.ts';
import { ManchesterBadge } from '../components/ManchesterBadge.tsx';
import { requestRoute, evaluateTriage, createTelehealthAppointment } from '../services/api.ts';
import {
  Compass,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  PhoneCall,
  Video,
  AlertTriangle,
  CheckCircle2,
  Building,
  Navigation,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface CitizenViewProps {
  units: HealthUnit[];
  states: UnitLiveState[];
  onOpenTelehealth: (appointmentId?: string) => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  units,
  states,
  onOpenTelehealth
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'HOSPITAL' | 'UPA' | 'UBS'>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<HealthUnit | null>(null);

  // Estados de Rota Inteligente
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeAcuity, setRouteAcuity] = useState<ManchesterPriority>('verde');
  const [routeResult, setRouteResult] = useState<RouteRecommendation | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Estados de Teletriagem
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [triageStep, setTriageStep] = useState<1 | 2 | 3>(1);
  const [selectedSymptom, setSelectedSymptom] = useState<string>('Sintomas Respiratórios / Gripe / Tosse');
  const [redFlagsAnswers, setRedFlagsAnswers] = useState<Record<string, boolean>>({});
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [loadingTriage, setLoadingTriage] = useState(false);

  const getStateForUnit = (unitId: string) => states.find((s) => s.unidade_id === unitId);

  const filteredUnits = units.filter((u) => {
    if (filterType === 'ALL') return true;
    return u.tipo === filterType;
  });

  const handleCalculateRoute = async (prio: ManchesterPriority = routeAcuity) => {
    setLoadingRoute(true);
    try {
      // Coordenadas centrais de Novo Hamburgo
      const res = await requestRoute(-29.6880, -51.1300, prio);
      setRouteResult(res);
      setRouteModalOpen(true);
    } catch (err) {
      alert('Erro ao calcular rota');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleRunTriage = async () => {
    setLoadingTriage(true);
    try {
      const res = await evaluateTriage({
        sintoma_principal: selectedSymptom,
        respostas_red_flags: redFlagsAnswers,
        idade: 35
      });
      setTriageResult(res);
      setTriageStep(3);
    } catch {
      alert('Erro ao processar teletriagem');
    } finally {
      setLoadingTriage(false);
    }
  };

  const handleStartTelehealthFromTriage = async () => {
    try {
      const appt = await createTelehealthAppointment(`Teletriagem: ${selectedSymptom}`);
      setTriageModalOpen(false);
      onOpenTelehealth(appt.id);
    } catch {
      alert('Erro ao agendar teleconsulta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-800 via-blue-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-200 backdrop-blur-sm border border-cyan-400/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Rede de Saúde Integrada de Novo Hamburgo
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Para onde ir agora sem esperar horas na fila?
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Consulte os tempos de espera em tempo real por cor de triagem (Protocolo Manchester),
            ocupação de leitos e receba a melhor rota entre o Hospital Municipal, UPA Canudos e UBSs.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => handleCalculateRoute('verde')}
              disabled={loadingRoute}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs md:text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 hover:scale-[1.02] active:scale-95"
            >
              <Compass className="w-4 h-4" />
              {loadingRoute ? 'Calculando...' : 'Descobrir Melhor Unidade Agora'}
            </button>

            <button
              onClick={() => {
                setTriageStep(1);
                setTriageModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs md:text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 border border-white/20"
            >
              <Video className="w-4 h-4 text-cyan-300" />
              Teletriagem & Teleconsulta Online
            </button>
          </div>
        </div>

        {/* Decorative Grid / Accent */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-40 bottom-0 -mb-10 h-60 w-60 rounded-full bg-blue-500/20 blur-2xl" />
      </div>

      {/* Filter and Overview Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Unidades de Atendimento em Novo Hamburgo
          </h2>
          <p className="text-xs text-slate-500">
            Dados sincronizados em tempo real com o e-SUS PEC e HIS hospitalar
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl border border-slate-300/50 self-start">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({units.length})
          </button>
          <button
            onClick={() => setFilterType('HOSPITAL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterType === 'HOSPITAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hospital
          </button>
          <button
            onClick={() => setFilterType('UPA')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterType === 'UPA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UPA 24h
          </button>
          <button
            onClick={() => setFilterType('UBS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterType === 'UBS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UBS / USF
          </button>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredUnits.map((unit) => {
          const liveState = getStateForUnit(unit.id);
          const pow = liveState?.pow;
          const poo = liveState?.poo;
          const prev30 = liveState?.previsao_30min;

          return (
            <div
              key={unit.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4"
            >
              {/* Unit Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                        unit.tipo === 'HOSPITAL'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : unit.tipo === 'UPA'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {unit.tipo === 'HOSPITAL'
                        ? 'HOSPITAL MUNICIPAL'
                        : unit.tipo === 'UPA'
                        ? 'PRONTO ATENDIMENTO 24H'
                        : 'ATENÇÃO BÁSICA (UBS)'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {unit.horario_funcionamento}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{unit.nome}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {unit.endereco}
                  </p>
                </div>

                {/* Trend Badge */}
                {prev30 && (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                      prev30.tendencia === 'DESCENDO'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : prev30.tendencia === 'SUBINDO'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {prev30.tendencia === 'DESCENDO' ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : prev30.tendencia === 'SUBINDO' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>Previsão 30m: {prev30.tendencia}</span>
                  </div>
                )}
              </div>

              {/* Waiting Times by Priority (PoW) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Tempo de Espera por Triagem (Manchester):</span>
                  <span>{pow?.total_em_fila === null ? 'Contagem suprimida' : (pow?.total_em_fila ?? 0) + ' pacientes aguardando'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ManchesterBadge
                    priority="amarelo"
                    count={pow?.prioridades.amarelo.fila}
                    waitMinutes={pow?.prioridades.amarelo.wait_med_min}
                  />
                  <ManchesterBadge
                    priority="verde"
                    count={pow?.prioridades.verde.fila}
                    waitMinutes={pow?.prioridades.verde.wait_med_min}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <ManchesterBadge
                    priority="vermelho"
                    count={pow?.prioridades.vermelho.fila}
                    waitMinutes={pow?.prioridades.vermelho.wait_med_min}
                  />
                  <ManchesterBadge
                    priority="laranja"
                    count={pow?.prioridades.laranja.fila}
                    waitMinutes={pow?.prioridades.laranja.wait_med_min}
                  />
                  <ManchesterBadge
                    priority="azul"
                    count={pow?.prioridades.azul.fila}
                    waitMinutes={pow?.prioridades.azul.wait_med_min}
                  />
                </div>
              </div>

              {/* Occupancy and Capacity (PoO) */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Consultórios Médicos Ativos:</span>
                  <span className="font-bold text-slate-900">
                    {poo?.salas_abertas ?? 0} de {poo?.salas_totais ?? 0} salas
                  </span>
                </div>

                {poo?.leitos_observacao && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Leitos de Observação:</span>
                      <span className="font-semibold text-slate-700">
                        {poo.leitos_observacao.ocupados === null
                          ? 'Contagem suprimida'
                          : <>{poo.leitos_observacao.ocupados} / {poo.leitos_observacao.capacidade} ocupados ({Math.round(((poo.leitos_observacao.ocupados ?? 0) / poo.leitos_observacao.capacidade) * 100)}%)</>}
                      </span>
                    </div>
                    <div className={poo.leitos_observacao.ocupados === null ? "hidden" : "w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"}>
                      <div
                        className={`h-full rounded-full ${
                          (poo.leitos_observacao.ocupados ?? 0) / poo.leitos_observacao.capacidade > 0.85
                            ? 'bg-rose-500'
                            : 'bg-cyan-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            ((poo.leitos_observacao.ocupados ?? 0) / poo.leitos_observacao.capacidade) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    handleCalculateRoute('verde');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  Calcular Tempo Total
                </button>

                <a
                  href={`tel:${unit.telefone.replace(/\D/g, '')}`}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Ligar
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE ROTA INTELIGENTE */}
      {routeModalOpen && routeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                  Recomendação do Sistema
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Melhor Unidade para Você Agora
                </h3>
              </div>
              <button
                onClick={() => setRouteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Winner Card */}
            <div className="bg-cyan-50/80 rounded-xl p-4 border border-cyan-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-600 text-white">
                  1ª OPÇÃO RECOMENDADA
                </span>
                <span className="text-xs font-bold text-cyan-900">
                  ~{routeResult.distancia_km} km de você
                </span>
              </div>

              <h4 className="text-lg font-black text-slate-900">
                {routeResult.unidade_sugerida.nome}
              </h4>
              <p className="text-xs text-slate-600">{routeResult.unidade_sugerida.endereco}</p>

              {/* Time Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-200/60 text-center">
                <div className="bg-white/80 p-2 rounded-lg border border-cyan-100">
                  <span className="text-[10px] text-slate-500 block">Viagem</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {routeResult.tempo_estimado_deslocamento_min} min
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-cyan-100">
                  <span className="text-[10px] text-slate-500 block">Fila Atual</span>
                  <span className="font-extrabold text-cyan-700 text-sm">
                    ~{routeResult.tempo_estimado_espera_min} min
                  </span>
                </div>
                <div className="bg-cyan-600 p-2 rounded-lg text-white">
                  <span className="text-[10px] text-cyan-100 block">Tempo Total</span>
                  <span className="font-extrabold text-sm">
                    ~{routeResult.tempo_total_porta_medico_min} min
                  </span>
                </div>
              </div>

              <p className="text-xs text-cyan-900 font-medium bg-white/60 p-2.5 rounded-lg border border-cyan-100">
                💡 {routeResult.justificativa}
              </p>
            </div>

            {/* Alternatives */}
            {routeResult.alternativas.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Outras unidades avaliadas:</span>
                <div className="space-y-1.5">
                  {routeResult.alternativas.map((alt) => (
                    <div
                      key={alt.unidade.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    >
                      <span className="font-medium text-slate-800">{alt.unidade.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Total: ~{alt.tempo_total_min} min</span>
                        <span className="text-rose-600 font-bold">+{alt.diferenca_min} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRouteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fechar
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${routeResult.unidade_sugerida.coordenadas.lat},${routeResult.unidade_sugerida.coordenadas.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                Navegar com GPS
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TELETRIAGEM */}
      {triageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Teletriagem do SUS — Novo Hamburgo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Avaliação clínica digital com classificação de risco
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTriageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Select Chief Symptom */}
            {triageStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">
                  Selecione o sintoma ou desconforto principal que motivou sua busca de atendimento:
                </p>

                <div className="space-y-2">
                  {[
                    'Sintomas Respiratórios / Gripe / Tosse',
                    'Dor no Peito / Torácica',
                    'Dor de Cabeça / Cefaleia',
                    'Dor Articular / Lombar / Trauma Leve',
                    'Lesão de Pele / Manchas / Alergia'
                  ].map((sintoma) => (
                    <label
                      key={sintoma}
                      onClick={() => setSelectedSymptom(sintoma)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        selectedSymptom === sintoma
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{sintoma}</span>
                      <input
                        type="radio"
                        checked={selectedSymptom === sintoma}
                        onChange={() => setSelectedSymptom(sintoma)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setTriageStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500"
                  >
                    Próximo: Perguntas de Alarme
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Red Flags Check */}
            {triageStep === 2 && (
              <div className="space-y-4">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">
                    Responda com honestidade: se houver qualquer sinal de alarme, você será encaminhado
                    imediatamente para um hospital presencial ou SAMU 192.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-800">
                    Você apresenta algum destes sinais?
                  </span>

                  {[
                    { id: 'dor_irradiando', label: 'Dor intensa irradiando para braço, mandíbula ou costas' },
                    { id: 'falta_ar_grave', label: 'Dificuldade grave para respirar ou sensação de sufocamento' },
                    { id: 'desmaio_vertigem', label: 'Desmaio recente, perda de consciência ou convulsão' },
                    { id: 'labios_roxos', label: 'Lábios arroxeados ou confusão mental aguda' }
                  ].map((flag) => (
                    <label
                      key={flag.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!redFlagsAnswers[flag.id]}
                        onChange={(e) =>
                          setRedFlagsAnswers({ ...redFlagsAnswers, [flag.id]: e.target.checked })
                        }
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="text-slate-800 font-medium">{flag.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setTriageStep(1)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleRunTriage}
                    disabled={loadingTriage}
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500"
                  >
                    {loadingTriage ? 'Avaliando com Protocolo...' : 'Concluir Classificação'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Triage Outcome */}
            {triageStep === 3 && triageResult && (
              <div className="space-y-4">
                {triageResult.permite_teleconsulta ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Classificação: {triageResult.prioridade_sugerida.toUpperCase()} (Sem Sinais de Alarme)
                    </div>

                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {triageResult.recomendacao_imediata}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={handleStartTelehealthFromTriage}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition"
                      >
                        <Video className="w-4 h-4" />
                        Iniciar Teleconsulta da Atenção Primária Agora
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      Atenção: Atendimento Presencial Urgente Necessário
                    </div>

                    <p className="text-xs text-rose-900 leading-relaxed font-medium">
                      {triageResult.recomendacao_imediata}
                    </p>

                    {triageResult.acionar_samu_urgente && (
                      <div className="pt-2">
                        <a
                          href="tel:192"
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30"
                        >
                          <PhoneCall className="w-4 h-4" />
                          Ligar 192 (SAMU Novo Hamburgo)
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setTriageModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
