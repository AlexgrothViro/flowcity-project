import { NOVO_HAMBURGO_UNITS } from '../config/units.js';
import { ManchesterQueuingModel } from '../engine/queuing.js';
import { NowcastingEngine } from '../engine/nowcasting.js';
import { SignerService } from './signer.js';
import { UnitLiveState, ManchesterPriority } from '../types.js';
import { PersistenceService } from './persistence.js';

export class StateManager {
  private liveStates: Map<string, UnitLiveState> = new Map();
  private nowcastingEngine: NowcastingEngine = new NowcastingEngine();
  private signer: SignerService = new SignerService();
  private listeners: Array<(states: UnitLiveState[]) => void> = [];
  private snapshotTimer: NodeJS.Timeout | null = null;

  constructor(private readonly persistence: PersistenceService = new PersistenceService()) {
    this.initializeStates();
    this.startSimulationTicker();
    this.snapshotTimer = setInterval(() => { void this.persistSnapshots(); }, 60_000);
    this.snapshotTimer.unref?.();
  }

  public getPublicKey(): string {
    return this.signer.getPublicKey();
  }

  public signPublicPayload(payload: object): string {
    return this.signer.signPayload(payload);
  }

  private initializeStates() {
    // Inicializa estados realistas para as unidades de Novo Hamburgo
    const baseQueues: Record<string, Record<ManchesterPriority, number>> = {
      hmnh_hospital: { vermelho: 0, laranja: 2, amarelo: 14, verde: 28, azul: 11 },
      upa_canudos: { vermelho: 0, laranja: 3, amarelo: 12, verde: 22, azul: 9 },
      usf_santo_afonso: { vermelho: 0, laranja: 0, amarelo: 2, verde: 6, azul: 4 },
      usf_canudos: { vermelho: 0, laranja: 0, amarelo: 1, verde: 5, azul: 3 }
    };

    const baseRooms: Record<string, { abertas: number; totais: number }> = {
      hmnh_hospital: { abertas: 10, totais: 12 },
      upa_canudos: { abertas: 6, totais: 8 },
      usf_santo_afonso: { abertas: 4, totais: 4 },
      usf_canudos: { abertas: 3, totais: 4 }
    };

    const baseObservationBeds: Record<string, { ocupados: number; capacidade: number }> = {
      hmnh_hospital: { ocupados: 28, capacidade: 32 },
      upa_canudos: { ocupados: 14, capacidade: 18 },
      usf_santo_afonso: { ocupados: 1, capacidade: 2 },
      usf_canudos: { ocupados: 0, capacidade: 2 }
    };

    for (const unit of NOVO_HAMBURGO_UNITS) {
      const q = baseQueues[unit.id] || { vermelho: 0, laranja: 1, amarelo: 5, verde: 10, azul: 5 };
      const r = baseRooms[unit.id] || { abertas: 3, totais: 4 };
      const obs = baseObservationBeds[unit.id] || { ocupados: 2, capacidade: 4 };

      const powPriorities = ManchesterQueuingModel.calculateWaitTimes({
        activeRooms: r.abertas,
        queueCounts: q,
        dataFreshnessSeconds: 15
      });

      const totalFila = Object.values(q).reduce((sum, n) => sum + n, 0);
      const medianWait = powPriorities.amarelo.wait_med_min;
      const occupancyRate = Number((obs.ocupados / obs.capacidade).toFixed(2));

      const forecasts = this.nowcastingEngine.generateForecasts(
        unit.id,
        medianWait,
        occupancyRate
      );

      const payloadWithoutSig = {
        unidade_id: unit.id,
        data_mode: 'SYNTHETIC_DEMO' as const,
        timestamp: new Date().toISOString(),
        pow: {
          prioridades: powPriorities,
          tempo_medio_porta_triagem_min: unit.tipo === 'HOSPITAL' ? 12 : unit.tipo === 'UPA' ? 9 : 5,
          total_em_fila: totalFila
        },
        poo: {
          salas_abertas: r.abertas,
          salas_totais: r.totais,
          ocupacao_salas: Number((r.abertas / r.totais).toFixed(2)),
          leitos_observacao: obs,
          diagnostico: {
            raio_x: { operacional: true, fila_exames: unit.tipo === 'HOSPITAL' ? 8 : 4, tempo_medio_min: 25 },
            laboratorio: { operacional: true, fila_exames: unit.tipo === 'HOSPITAL' ? 15 : 6, tempo_medio_min: 40 }
          }
        },
        samu: {
          ambulancias_retidas: unit.tipo === 'HOSPITAL' ? 1 : unit.tipo === 'UPA' ? 2 : 0,
          tempo_medio_giro_min: unit.tipo === 'HOSPITAL' ? 38 : unit.tipo === 'UPA' ? 28 : 12
        },
        ...forecasts,
        idade_do_dado_s: 15,
        fontes: [
          { tipo: 'HIS/ADT' as const, peso: 0.65, ultima_leitura: new Date().toISOString() },
          { tipo: 'sensor_porta' as const, peso: 0.20, ultima_leitura: new Date().toISOString() },
          { tipo: 'triagem_totem' as const, peso: 0.15, ultima_leitura: new Date().toISOString() }
        ]
      };

      const assinatura = this.signer.signPayload(payloadWithoutSig);

      this.liveStates.set(unit.id, {
        ...payloadWithoutSig,
        assinatura
      });
    }
  }

  private timer: NodeJS.Timeout | null = null;

  private startSimulationTicker() {
    // Atualiza estocasticamente a cada 7 segundos para demonstracao em tempo real
    this.timer = setInterval(() => {
      this.tickSimulation();
    }, 7000);
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  public destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  public async restorePersistedStates(): Promise<void> {
    await this.persistence.ready;
    const snapshots = await this.persistence.loadLatestSnapshots();
    for (const snapshot of snapshots) {
      if (!this.liveStates.has(snapshot.unidade_id)) continue;
      const { assinatura: _oldSignature, ...payload } = snapshot;
      this.liveStates.set(snapshot.unidade_id, { ...payload, assinatura: this.signer.signPayload(payload) });
    }
    await this.persistSnapshots();
  }

  private async persistSnapshots(): Promise<void> {
    try {
      for (const state of this.liveStates.values()) await this.persistence.saveSnapshot(state);
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', event: 'snapshot_persistence_failed', message: error instanceof Error ? error.message : 'unknown error' }));
    }
  }

  private tickSimulation() {
    const updated: UnitLiveState[] = [];

    for (const unit of NOVO_HAMBURGO_UNITS) {
      const state = this.liveStates.get(unit.id);
      if (!state) continue;

      // Perturbacao estocastica leve (pacientes chegando e saindo)
      const currentPriorities = { ...state.pow.prioridades };
      const currentQueue = {
        vermelho: currentPriorities.vermelho.fila,
        laranja: currentPriorities.laranja.fila,
        amarelo: currentPriorities.amarelo.fila,
        verde: currentPriorities.verde.fila,
        azul: currentPriorities.azul.fila
      };

      // Probabilidade de chegada ou saida
      if (Math.random() > 0.4) {
        const delta = Math.random() > 0.5 ? 1 : -1;
        currentQueue.verde = Math.max(1, currentQueue.verde + delta);
      }
      if (Math.random() > 0.6) {
        const delta = Math.random() > 0.6 ? 1 : -1;
        currentQueue.amarelo = Math.max(0, currentQueue.amarelo + delta);
      }

      const activeRooms = state.poo.salas_abertas;
      const updatedPow = ManchesterQueuingModel.calculateWaitTimes({
        activeRooms,
        queueCounts: currentQueue,
        dataFreshnessSeconds: Math.floor(Math.random() * 45) + 5
      });

      const totalFila = Object.values(currentQueue).reduce((a, b) => a + b, 0);
      const medianWait = updatedPow.amarelo.wait_med_min;
      const occupancyRate = state.poo.ocupacao_salas;

      const forecasts = this.nowcastingEngine.generateForecasts(unit.id, medianWait, occupancyRate);

      const nextPayload = {
        unidade_id: unit.id,
        data_mode: state.data_mode || 'SYNTHETIC_DEMO',
        timestamp: new Date().toISOString(),
        pow: {
          prioridades: updatedPow,
          tempo_medio_porta_triagem_min: state.pow.tempo_medio_porta_triagem_min,
          total_em_fila: totalFila
        },
        poo: {
          ...state.poo
        },
        samu: {
          ...state.samu
        },
        ...forecasts,
        idade_do_dado_s: Math.floor(Math.random() * 30) + 10,
        fontes: state.fontes.map((f) => ({ ...f, ultima_leitura: new Date().toISOString() }))
      };

      const assinatura = this.signer.signPayload(nextPayload);
      const finalState: UnitLiveState = {
        ...nextPayload,
        assinatura
      };

      this.liveStates.set(unit.id, finalState);
      updated.push(finalState);
    }

    this.notifyListeners(updated);
  }

  public subscribe(listener: (states: UnitLiveState[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(states: UnitLiveState[]) {
    for (const listener of this.listeners) {
      try {
        listener(states);
      } catch (err) {
        console.error('Erro em listener do StateManager:', err);
      }
    }
  }

  public getAllStates(): UnitLiveState[] {
    return Array.from(this.liveStates.values());
  }

  public getStateById(unitId: string): UnitLiveState | undefined {
    return this.liveStates.get(unitId);
  }

  public getRawMap(): Map<string, UnitLiveState> {
    return this.liveStates;
  }
}
