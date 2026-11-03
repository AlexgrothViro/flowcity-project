import React from 'react';
import { ManchesterPriority } from '../types.ts';

interface ManchesterBadgeProps {
  priority: ManchesterPriority;
  waitMinutes?: number | null;
  count?: number | null;
  showDetails?: boolean;
}

export const MANCHESTER_CONFIG: Record<
  ManchesterPriority,
  { label: string; bg: string; text: string; border: string; dot: string; maxTime: string }
> = {
  vermelho: {
    label: 'Vermelho (Emergência)',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
    dot: 'bg-red-600',
    maxTime: '0 min (Imediato)'
  },
  laranja: {
    label: 'Laranja (Muito Urgente)',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-300',
    dot: 'bg-orange-600',
    maxTime: 'Alvo: até 10 min'
  },
  amarelo: {
    label: 'Amarelo (Urgente)',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    maxTime: 'Alvo: até 60 min'
  },
  verde: {
    label: 'Verde (Pouco Urgente)',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
    maxTime: 'Alvo: até 120 min'
  },
  azul: {
    label: 'Azul (Não Urgente)',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    dot: 'bg-blue-600',
    maxTime: 'Alvo: até 240 min'
  }
};

export const ManchesterBadge: React.FC<ManchesterBadgeProps> = ({
  priority,
  waitMinutes,
  count,
  showDetails = false
}) => {
  const config = MANCHESTER_CONFIG[priority];
  const symbol: Record<ManchesterPriority, string> = { vermelho: '◆', laranja: '▲', amarelo: '●', verde: '■', azul: '◇' };

  return (
    <div
      className={`inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
        <span><span aria-hidden="true" className="mr-1 font-black">{symbol[priority]}</span>{config.label}</span>
      </div>

      <div className="flex items-center gap-2 font-mono">
        {count !== undefined && (
          <span className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-bold">
            {count === null ? 'Contagem suprimida' : count} na fila
          </span>
        )}
        {waitMinutes !== undefined && (
          <span className="font-extrabold text-[12px]">
{waitMinutes === null ? 'Indisponível' : waitMinutes === 0 ? '0 min' : '~' + waitMinutes + ' min'}
          </span>
        )}
      </div>

      {showDetails && (
        <span className="text-[10px] text-slate-500 block font-normal">
          {config.maxTime}
        </span>
      )}
    </div>
  );
};
