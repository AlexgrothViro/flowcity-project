import type { ManchesterPriority, UnitLiveState, UnitDiagnosticStatus, UnitObservationBeds, PriorityMetrics } from '../types.js';

type PublicCount = number | null;
type PublicPriorityMetrics = Omit<PriorityMetrics, 'fila' | 'wait_med_min'> & { fila: PublicCount; wait_med_min: number | null; contagem_suprimida?: true };
type PublicDiagnosticStatus = Omit<UnitDiagnosticStatus, 'raio_x' | 'laboratorio'> & {
  raio_x: Omit<UnitDiagnosticStatus['raio_x'], 'fila_exames'> & { fila_exames: PublicCount; contagem_suprimida?: true };
  laboratorio: Omit<UnitDiagnosticStatus['laboratorio'], 'fila_exames'> & { fila_exames: PublicCount; contagem_suprimida?: true };
};
type PublicObservationBeds = Omit<UnitObservationBeds, 'ocupados' | 'ventiladores_ocupados'> & {
  ocupados: PublicCount;
  ventiladores_ocupados?: PublicCount;
  contagem_suprimida?: true;
};

export type PublicUnitState = Omit<UnitLiveState, 'pow' | 'poo' | 'samu' | 'assinatura'> & {
  pow: Omit<UnitLiveState['pow'], 'prioridades' | 'total_em_fila'> & {
    prioridades: Record<ManchesterPriority, PublicPriorityMetrics>;
    total_em_fila: PublicCount;
    contagem_total_suprimida?: true;
  };
  poo: Omit<UnitLiveState['poo'], 'leitos_observacao' | 'diagnostico'> & {
    leitos_observacao: PublicObservationBeds;
    diagnostico: PublicDiagnosticStatus;
  };
  samu: Omit<UnitLiveState['samu'], 'ambulancias_retidas'> & { ambulancias_retidas: PublicCount };
  assinatura: string;
};

export class KAnonymityGuard {
  public static readonly MIN_GROUP_SIZE = 3;

  public static suppress(count: number, k = KAnonymityGuard.MIN_GROUP_SIZE): PublicCount {
    if (!Number.isInteger(k) || k < KAnonymityGuard.MIN_GROUP_SIZE) {
      throw new Error('k must be an integer of at least 3');
    }
    if (!Number.isInteger(count) || count < 0) {
      throw new Error('count must be a non-negative integer');
    }
    return count > 0 && count < k ? null : count;
  }

  public static sanitizeState(state: UnitLiveState, sign: (payload: object) => string): PublicUnitState {
    const { assinatura: _signature, ...copy } = structuredClone(state);
    const priorities = Object.fromEntries(
      Object.entries(copy.pow.prioridades).map(([priority, metrics]) => {
        const fila = this.suppress(metrics.fila);
        return [priority, { ...metrics, fila, wait_med_min: fila === null ? null : metrics.wait_med_min, ...(fila === null ? { contagem_suprimida: true as const } : {}) }];
      })
    ) as Record<ManchesterPriority, PublicPriorityMetrics>;
    const total = this.suppress(copy.pow.total_em_fila);
    const occupiedBeds = this.suppress(copy.poo.leitos_observacao.ocupados);
    const diagnostics = {
      raio_x: {
        ...copy.poo.diagnostico.raio_x,
        fila_exames: this.suppress(copy.poo.diagnostico.raio_x.fila_exames)
      },
      laboratorio: {
        ...copy.poo.diagnostico.laboratorio,
        fila_exames: this.suppress(copy.poo.diagnostico.laboratorio.fila_exames)
      },
      ...(copy.poo.diagnostico.eletrocardiograma
        ? { eletrocardiograma: copy.poo.diagnostico.eletrocardiograma }
        : {})
    };
    const beds = {
      ...copy.poo.leitos_observacao,
      ocupados: occupiedBeds,
      ...(copy.poo.leitos_observacao.ventiladores_ocupados === undefined
        ? {}
        : { ventiladores_ocupados: this.suppress(copy.poo.leitos_observacao.ventiladores_ocupados) }),
      ...(occupiedBeds === null ? { contagem_suprimida: true as const } : {})
    };
    const unsigned = {
      ...copy,
      pow: {
        ...copy.pow,
        prioridades: priorities,
        total_em_fila: total,
        ...(total === null ? { contagem_total_suprimida: true as const } : {})
      },
      poo: { ...copy.poo, leitos_observacao: beds, diagnostico: diagnostics },
      samu: { ...copy.samu, ambulancias_retidas: this.suppress(copy.samu.ambulancias_retidas) }
    };
    return { ...unsigned, assinatura: sign(unsigned) } as PublicUnitState;
  }
}
