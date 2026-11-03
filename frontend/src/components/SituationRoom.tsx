import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileJson2, Printer, RefreshCw, SlidersHorizontal, TrendingUp } from 'lucide-react';
import type { HealthUnit, UnitLiveState } from '../types.ts';
import { fetchWaitHistory, simulateQueueScenario } from '../services/api.ts';

interface Props {
  units: HealthUnit[];
  states: UnitLiveState[];
}
interface HistoryPoint {
  captured_at: string;
  wait_yellow_minutes: number | null;
  yellow_count: number | null;
  data_mode: string;
}
interface Scenario {
  arrivalRatePerHour: number;
  averageServiceMinutes: number;
  servers: number;
  queueCapacity: number;
  durationMinutes: number;
  runs: number;
  arrivalMultiplier: number;
  additionalServers: number;
  seed: number;
  ambulanceArrivalsPerHour: number;
}

const CHART_WIDTH = 900;
const CHART_HEIGHT = 280;
const CHART_PADDING = { top: 24, right: 24, bottom: 36, left: 48 };

function makeLinePath(points: Array<{ x: number; y: number | null }>) {
  let penDown = false;
  return points.map((point) => {
    if (point.y === null) {
      penDown = false;
      return '';
    }
    const command = penDown ? 'L ' : 'M ';
    penDown = true;
    return command + point.x.toFixed(1) + ' ' + point.y.toFixed(1);
  }).filter(Boolean).join(' ');
}
function downloadFile(filename: string, contents: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const SituationRoom: React.FC<Props> = ({ units, states }) => {
  const [unitId, setUnitId] = useState('upa_canudos');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const selectedState = states.find((item) => item.unidade_id === unitId);
  const selectedUnit = units.find((unit) => unit.id === unitId);

  const [scenario, setScenario] = useState<Scenario>({
    arrivalRatePerHour: 12,
    averageServiceMinutes: 20,
    servers: 4,
    queueCapacity: 50,
    durationMinutes: 60,
    runs: 500,
    arrivalMultiplier: 1.4,
    additionalServers: 2,
    seed: 20261103,
    ambulanceArrivalsPerHour: 0
  });

  useEffect(() => {
    const currentState = states.find((item) => item.unidade_id === unitId);
    if (!currentState) return;
    setScenario((previous) => ({
      ...previous,
      servers: Math.max(1, currentState.poo.salas_abertas),
      arrivalRatePerHour: currentState.pow.prioridades.amarelo.pacientes_hora ?? previous.arrivalRatePerHour
    }));
  }, [unitId, states]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const result = await fetchWaitHistory(unitId, 24);
      setHistory(result.points);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar a série histórica.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    const interval = setInterval(() => void loadHistory(), 60_000);
    return () => clearInterval(interval);
  }, [unitId]);

  const validHistory = useMemo(() => history.filter((point) => point.wait_yellow_minutes !== null), [history]);
  const chart = useMemo(() => {
    if (validHistory.length < 2) return null;
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const values = validHistory.map((point) => point.wait_yellow_minutes ?? 0);
    const maxValue = Math.max(10, ...values, selectedState?.pow.prioridades.amarelo.wait_med_min ?? 0);
    const scaleY = (value: number) => CHART_PADDING.top + plotHeight - (value / maxValue) * plotHeight;
    const firstTime = new Date(validHistory[0].captured_at).getTime();
    const duration = Math.max(1, Date.now() - firstTime);
    const historicalPoints = history.map((point) => ({
      x: CHART_PADDING.left + ((new Date(point.captured_at).getTime() - firstTime) / duration) * plotWidth,
      y: point.wait_yellow_minutes === null ? null : scaleY(point.wait_yellow_minutes)
    }));
    const baseWait = selectedState?.pow.prioridades.amarelo.wait_med_min ?? values[values.length - 1];
    const forecastEntries = [
      { minute: 0, delta: 0, confidence: 1 },
      { minute: 15, delta: selectedState?.previsao_15min.pow_delta ?? 0, confidence: selectedState?.previsao_15min.confianca_previsao ?? 0 },
      { minute: 30, delta: selectedState?.previsao_30min.pow_delta ?? 0, confidence: selectedState?.previsao_30min.confianca_previsao ?? 0 },
      { minute: 60, delta: selectedState?.previsao_60min.pow_delta ?? 0, confidence: selectedState?.previsao_60min.confianca_previsao ?? 0 }
    ];
    const forecastPoints = forecastEntries.map((entry) => {
      const projected = Math.max(0, baseWait * (1 + entry.delta));
      const uncertainty = projected * Math.max(0, 1 - entry.confidence) * 0.35;
      const x = CHART_PADDING.left + plotWidth + (entry.minute / 60) * 100;
      return {
        x,
        y: scaleY(projected),
        lowY: scaleY(Math.max(0, projected - uncertainty)),
        highY: scaleY(projected + uncertainty)
      };
    });
    const upper = forecastPoints.map((point) => point.x.toFixed(1) + ',' + point.highY.toFixed(1)).join(' ');
    const lower = [...forecastPoints].reverse().map((point) => point.x.toFixed(1) + ',' + point.lowY.toFixed(1)).join(' ');
    return {
      historicalPath: makeLinePath(historicalPoints),
      forecastPath: makeLinePath(forecastPoints.map(({ x, y }) => ({ x, y }))),
      uncertaintyPolygon: upper + ' ' + lower,
      maxValue,
      yTicks: [0, Math.round(maxValue / 2), Math.round(maxValue)]
    };
  }, [validHistory, selectedState]);

  const runSimulation = async () => {
    setSimulationLoading(true);
    setSimulationError('');
    try {
      const { ambulanceArrivalsPerHour, ...baseScenario } = scenario;
      const baseline = { ...baseScenario, arrivalMultiplier: 1, additionalServers: 0 };
      const proposed = {
        ...scenario,
        arrivalRatePerHour: scenario.arrivalRatePerHour + ambulanceArrivalsPerHour,
        additionalServers: scenario.additionalServers
      };
      const [before, after] = await Promise.all([
        simulateQueueScenario(baseline),
        simulateQueueScenario(proposed)
      ]);
      setComparison({ before, after, proposed, createdAt: new Date().toISOString() });
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : 'Não foi possível executar o cenário.');
    } finally {
      setSimulationLoading(false);
    }
  };

  const exportReport = (format: 'json' | 'csv') => {
    const report = {
      generated_at: new Date().toISOString(),
      data_mode: 'SYNTHETIC_DEMO',
      unit_id: unitId,
      unit_name: selectedUnit?.nome ?? unitId,
      history_hours: 24,
      history_points: history,
      current_state: selectedState ? {
        captured_at: selectedState.timestamp,
        yellow_wait_minutes: selectedState.pow.prioridades.amarelo.wait_med_min,
        yellow_count: selectedState.pow.prioridades.amarelo.fila,
        rooms_open: selectedState.poo.salas_abertas,
        rooms_total: selectedState.poo.salas_totais,
        forecast_60_min_delta: selectedState.previsao_60min.pow_delta
      } : null,
      what_if: comparison
    };
    if (format === 'json') {
      downloadFile('flowcity-boletim-' + unitId + '.json', JSON.stringify(report, null, 2), 'application/json');
      return;
    }
    const headers = ['captured_at', 'wait_yellow_minutes', 'yellow_count', 'data_mode'];
    const rows = history.map((point) => headers.map((header) => JSON.stringify((point as any)[header] ?? '')).join(','));
    downloadFile('flowcity-historico-' + unitId + '.csv', [headers.join(','), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
  };

  const updateScenario = (key: keyof Scenario, value: number) => {
    setScenario((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="situation-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="situation-title" className="flex items-center gap-2 text-base font-bold text-slate-900">
            <TrendingUp className="h-4 w-4 text-cyan-700" />Sala de Situação — série histórica e cenários
          </h2>
          <p className="mt-1 text-xs text-slate-500">A série histórica usa snapshots persistidos, com contagens pequenas suprimidas.</p>
        </div>
        <label className="text-xs font-semibold text-slate-700">
          Unidade
          <select value={unitId} onChange={(event) => setUnitId(event.target.value)} className="ml-2 rounded-lg border border-slate-300 px-2 py-1.5">
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.nome}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <strong className="text-slate-800">Espera Manchester amarela — últimas 24 horas</strong>
          <span className="text-[11px] text-slate-500">{validHistory.length} pontos visíveis • k ≥ 3 • demonstração</span>
        </div>
        {historyLoading && <p className="p-6 text-center text-xs text-slate-500">Carregando histórico…</p>}
        {historyError && <p role="alert" className="p-4 text-xs text-rose-700">{historyError}</p>}
        {!historyLoading && !historyError && validHistory.length < 2 && (
          <div className="p-6 text-center text-xs text-slate-600">
            Ainda não há dados suficientes para traçar a série. Ela será preenchida conforme forem persistidos novos snapshots.
          </div>
        )}
        {!historyLoading && chart && (
          <div className="overflow-x-auto">
            <svg viewBox={'0 0 ' + (CHART_WIDTH + 100) + ' ' + CHART_HEIGHT} className="min-w-[720px] w-full" role="img" aria-label="Série histórica de espera e previsão indicativa para os próximos 60 minutos">
              {chart.yTicks.map((tick) => {
                const y = CHART_PADDING.top + (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) * (1 - tick / chart.maxValue);
                return (
                  <g key={tick}>
                    <line x1={CHART_PADDING.left} x2={CHART_WIDTH} y1={y} y2={y} stroke="#cbd5e1" strokeDasharray="3 5" />
                    <text x={8} y={y + 4} fontSize="11" fill="#64748b">{tick}m</text>
                  </g>
                );
              })}
              <polygon points={chart.uncertaintyPolygon} fill="#0891b2" fillOpacity="0.14" />
              <path d={chart.historicalPath} fill="none" stroke="#334155" strokeWidth="2.5" />
              <path d={chart.forecastPath} fill="none" stroke="#0891b2" strokeWidth="3" strokeDasharray="7 5" />
              <line x1={CHART_WIDTH} x2={CHART_WIDTH} y1={CHART_PADDING.top} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="#94a3b8" strokeDasharray="4 4" />
              <text x={CHART_PADDING.left} y={CHART_HEIGHT - 8} fontSize="11" fill="#64748b">24 h atrás</text>
              <text x={CHART_WIDTH - 12} y={CHART_HEIGHT - 8} fontSize="11" fill="#64748b">agora</text>
              <text x={CHART_WIDTH + 12} y={CHART_HEIGHT - 8} fontSize="11" fill="#64748b">+60 min</text>
            </svg>
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-600">
          <span><b className="text-slate-700">━</b> Histórico persistido</span>
          <span><b className="text-cyan-700">┅</b> Projeção do estado</span>
          <span><b className="text-cyan-500">▰</b> Faixa indicativa, não calibrada</span>
          <button type="button" onClick={() => void loadHistory()} className="inline-flex items-center gap-1 text-cyan-800 hover:underline"><RefreshCw className="h-3 w-3" />Atualizar</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><SlidersHorizontal className="h-4 w-4 text-cyan-700" />Simulador What-if</h3>
          <p className="text-[11px] leading-relaxed text-slate-500">Comparação Monte Carlo com chegadas Poisson e atendimento exponencial. Parâmetros são hipóteses; o resultado não aciona nem recomenda mudanças operacionais.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-medium text-slate-700">Chegadas/hora
              <input type="number" min="0" max="500" value={scenario.arrivalRatePerHour} onChange={(event) => updateScenario('arrivalRatePerHour', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <label className="text-[11px] font-medium text-slate-700">Atendimento médio (min)
              <input type="number" min="1" max="240" value={scenario.averageServiceMinutes} onChange={(event) => updateScenario('averageServiceMinutes', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <label className="text-[11px] font-medium text-slate-700">Consultórios abertos
              <input type="number" min="1" max="100" value={scenario.servers} onChange={(event) => updateScenario('servers', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <label className="text-[11px] font-medium text-slate-700">Chegadas de ambulância/h
              <input type="number" min="0" max="50" value={scenario.ambulanceArrivalsPerHour} onChange={(event) => updateScenario('ambulanceArrivalsPerHour', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <label className="text-[11px] font-medium text-slate-700">Capacidade da fila
              <input type="number" min="0" max="1000" value={scenario.queueCapacity} onChange={(event) => updateScenario('queueCapacity', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <label className="text-[11px] font-medium text-slate-700">Aumento da demanda (%)
              <input type="range" min="100" max="250" step="5" value={Math.round(scenario.arrivalMultiplier * 100)} onChange={(event) => updateScenario('arrivalMultiplier', Number(event.target.value) / 100)} className="mt-2 w-full" />
              <span>{Math.round(scenario.arrivalMultiplier * 100)}%</span>
            </label>
            <label className="text-[11px] font-medium text-slate-700">Equipe adicional (+ consultórios/médicos)
              <input type="range" min="0" max="10" value={scenario.additionalServers} onChange={(event) => updateScenario('additionalServers', Number(event.target.value))} className="mt-2 w-full" />
              <span>{scenario.additionalServers}</span>
            </label>
          </div>
          <button type="button" disabled={simulationLoading} onClick={() => void runSimulation()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-600 disabled:opacity-50">
            {simulationLoading ? 'Executando 500 cenários…' : 'Simular e comparar'}
          </button>
          {simulationError && <p role="alert" className="text-xs text-rose-700">{simulationError}</p>}
          {comparison && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-500">Base (espera média)</span><strong>{comparison.before.meanWaitMinutes.toFixed(1)} min</strong></div>
              <div className="rounded-lg bg-cyan-50 p-3"><span className="block text-cyan-800">Cenário (espera média)</span><strong>{comparison.after.meanWaitMinutes.toFixed(1)} min</strong></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-500">P95 da espera simulada</span><strong>{comparison.after.p95MeanWaitMinutes.toFixed(1)} min</strong></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-500">Rejeições na fila</span><strong>{(comparison.after.rejectionRate * 100).toFixed(1)}%</strong></div>
            </div>
          )}
          <p className="text-[10px] text-slate-500">Economia financeira não calculada: o sistema não possui custos municipais configurados. Chegadas de ambulância são incluídas apenas como incremento hipotético de demanda, sem dados reais de frota.</p>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Boletim executivo agregado</h3>
          <p className="text-[11px] leading-relaxed text-slate-500">Exporta métricas agregadas para análise e prestação de contas. Sem nomes ou identificadores pessoais.</p>
          <div className="print-hidden grid grid-cols-3 gap-2">
            <button type="button" onClick={() => exportReport('json')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><FileJson2 className="h-3.5 w-3.5" />JSON</button>
            <button type="button" onClick={() => exportReport('csv')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-3.5 w-3.5" />CSV</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><Printer className="h-3.5 w-3.5" />Imprimir</button>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-900">Este painel está conectado a dados sintéticos de demonstração. O relatório não é prestação de contas oficial.</div>
        </div>
      </div>
    </section>
  );
};
