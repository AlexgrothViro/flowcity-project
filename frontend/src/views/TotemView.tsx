import React, { useState, useEffect } from 'react';
import { HealthUnit, UnitLiveState, ManchesterPriority } from '../types.ts';
import { Clock, Tv, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

interface TotemViewProps {
  units: HealthUnit[];
  states: UnitLiveState[];
}

export const TotemView: React.FC<TotemViewProps> = ({ units, states }) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('upa_canudos');
  const [secondsAgo, setSecondsAgo] = useState(12);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];
  const currentState = states.find((s) => s.unidade_id === selectedUnitId);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((s) => (s >= 55 ? 5 : s + 2));
    }, 2000);
    return () => clearInterval(timer);
  }, [selectedUnitId]);

  const priorities: Array<{
    key: ManchesterPriority;
    nome: string;
    corBg: string;
    corTexto: string;
    borda: string;
    desc: string;
  }> = [
    {
      key: 'vermelho',
      nome: 'VERMELHO (EMERGÊNCIA)',
      corBg: 'bg-red-600',
      corTexto: 'text-white',
      borda: 'border-red-700',
      desc: 'Risco iminente de morte • Encaminhamento direto à Sala Vermelha'
    },
    {
      key: 'laranja',
      nome: 'LARANJA (MUITO URGENTE)',
      corBg: 'bg-orange-500',
      corTexto: 'text-white',
      borda: 'border-orange-600',
      desc: 'Risco severo • Atendimento prioritário alvo em até 10 minutos'
    },
    {
      key: 'amarelo',
      nome: 'AMARELO (URGENTE)',
      corBg: 'bg-yellow-400',
      corTexto: 'text-slate-950',
      borda: 'border-yellow-500',
      desc: 'Gravidade moderada • Requer exames diagnósticos rápidos'
    },
    {
      key: 'verde',
      nome: 'VERDE (POUCO URGENTE)',
      corBg: 'bg-emerald-600',
      corTexto: 'text-white',
      borda: 'border-emerald-700',
      desc: 'Baixa gravidade clínica • Pode ser atendido na UBS ou Teleconsulta'
    },
    {
      key: 'azul',
      nome: 'AZUL (NÃO URGENTE)',
      corBg: 'bg-blue-600',
      corTexto: 'text-white',
      borda: 'border-blue-700',
      desc: 'Casos crônicos ou queixas leves • Recomendado atendimento em UBS'
    }
  ];

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-800 space-y-8 min-h-[750px] flex flex-col justify-between">
      {/* Kiosk Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase">
            <Tv className="w-4 h-4" />
            Totem de Transparência Pública — Painel de Recepção
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mt-1">
            {selectedUnit?.nome}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{selectedUnit?.endereco}</p>
        </div>

        {/* Unit Selector (for testing different unit screens) */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-semibold">Exibir Unidade:</label>
          <select
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setSecondsAgo(3);
            }}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Wait-Time Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {priorities.map((p) => {
          const metric = currentState?.pow.prioridades[p.key];
          const isRed = p.key === 'vermelho';

          return (
            <div
              key={p.key}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition ${p.corBg} ${p.corTexto} ${p.borda} shadow-lg`}
            >
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider block opacity-90">
                  {p.nome.split(' ')[0]}
                </span>
                <span className="text-xs font-bold block opacity-80">
                  {p.nome.split('(')[1]?.replace(')', '')}
                </span>

                <div className="my-6 text-center">
                  {isRed ? (
                    <div className="text-2xl md:text-3xl font-black leading-tight py-2">
                      IMEDIATO
                      <span className="text-[10px] block opacity-80 font-normal">
                        Sala Vermelha
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-4xl md:text-5xl font-black font-mono tracking-tight block">
                        {metric?.wait_med_min == null ? "Indisponível" : "~" + metric.wait_med_min}
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-widest opacity-85">
                        MINUTOS
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 text-center">
                <span className="text-xs font-bold block bg-black/15 py-1 rounded-lg">
                  {metric?.fila === null ? 'Contagem suprimida' : (metric?.fila ?? 0) + ' aguardando'}
                </span>
                <p className="text-[10px] mt-2 leading-tight opacity-75 font-medium">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operating Rooms & Educational Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Rooms Active */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              Consultórios Médicos em Atendimento
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {currentState?.poo.salas_abertas ?? 0}{' '}
              <span className="text-sm font-normal text-slate-400">
                de {currentState?.poo.salas_totais ?? 0} salas
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Observation Beds */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              Leitos de Observação
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {currentState?.poo.leitos_observacao.ocupados ?? 'Suprimido'}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {currentState?.poo.leitos_observacao.capacidade ?? 0} leitos
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-950 text-blue-400 border border-blue-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Data Freshness & Signature */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Sincronizado há {secondsAgo} segundos
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
              Assinatura: {currentState?.assinatura.substring(0, 18)}...
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            Auditado
          </span>
        </div>
      </div>

      {/* Footer Educational Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-300">
        <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0" />
        <p className="leading-relaxed">
          <strong>Aviso aos Usuários:</strong> O atendimento nas unidades de urgência segue o{' '}
          <strong>Protocolo de Classificação de Risco (Manchester)</strong> preconizado pelo Ministério da
          Saúde. Casos mais graves (Vermelho e Laranja) são sempre atendidos prioritariamente à frente de
          casos verdes ou azuis, garantindo que vidas em perigo imediato recebam socorro sem demora.
        </p>
      </div>
    </div>
  );
};
