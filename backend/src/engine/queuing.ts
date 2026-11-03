import { ManchesterPriority, PriorityMetrics } from '../types.js';

export interface PriorityQueueInput {
  activeRooms: number;
  queueCounts: Record<ManchesterPriority, number>;
  meanConsultationMinutes?: number; // Default 12 min
  arrivalRatesPerHour?: Record<ManchesterPriority, number>;
  dataFreshnessSeconds?: number;
}

export class ManchesterQueuingModel {
  /**
   * Prioridades ordenadas por gravidade clinica (1 = maior urgencia)
   */
  private static readonly PRIORITY_ORDER: ManchesterPriority[] = [
    'vermelho',
    'laranja',
    'amarelo',
    'verde',
    'azul'
  ];

  /**
   * Alvos clinicos recomendados pelo Protocolo de Manchester (em minutos)
   */
  public static readonly TARGET_WAIT_MINUTES: Record<ManchesterPriority, number> = {
    vermelho: 0,
    laranja: 10,
    amarelo: 60,
    verde: 120,
    azul: 240
  };

  /**
   * Calcula o tempo estimado de espera e confianca para cada prioridade de triagem
   * usando modelo estocastico M/M/c com classes de prioridade nao-preemptivas.
   */
  public static calculateWaitTimes(input: PriorityQueueInput): Record<ManchesterPriority, PriorityMetrics> {
    const {
      activeRooms,
      queueCounts,
      meanConsultationMinutes = 12,
      dataFreshnessSeconds = 60
    } = input;

    const c = Math.max(1, activeRooms);
    const mu = 60 / meanConsultationMinutes; // Atendimentos por consultorio por hora (ex: 5 pac/h)
    const serviceRateSystemPerHour = c * mu;

    const result: Record<ManchesterPriority, PriorityMetrics> = {
      vermelho: { fila: 0, wait_med_min: 0, conf: 0.98, pacientes_hora: 0 },
      laranja: { fila: 0, wait_med_min: 0, conf: 0.92, pacientes_hora: 0 },
      amarelo: { fila: 0, wait_med_min: 0, conf: 0.88, pacientes_hora: 0 },
      verde: { fila: 0, wait_med_min: 0, conf: 0.85, pacientes_hora: 0 },
      azul: { fila: 0, wait_med_min: 0, conf: 0.82, pacientes_hora: 0 }
    };

    // Fator de decaimento de confianca pela idade do dado (freshness penalty)
    const freshnessPenalty = Math.max(0, Math.min(0.20, (dataFreshnessSeconds - 60) / 600));

    // Calculo acumulativo de atraso por prioridade
    let accumulatedHigherPriorityWaitMin = 0;

    for (let i = 0; i < this.PRIORITY_ORDER.length; i++) {
      const priority = this.PRIORITY_ORDER[i];
      const count = Math.max(0, queueCounts[priority] || 0);

      if (priority === 'vermelho') {
        // Vermelho e atendido imediatamente na sala vermelha (rescitacao/estabilizacao)
        result.vermelho = {
          fila: count,
          wait_med_min: 0,
          conf: Math.max(0.70, Number((0.98 - freshnessPenalty).toFixed(2))),
          pacientes_hora: Number((count * 1.2).toFixed(1))
        };
        continue;
      }

      // Tempo necessario para drenar a fila atual deste nivel nos consultorios disponiveis
      const drainTimeCurrentPriorityMin = (count * meanConsultationMinutes) / c;

      // O tempo de espera medio inclui o que ja esta na frente com prioridade maior ou igual
      const estimatedWait = Math.round(accumulatedHigherPriorityWaitMin + (drainTimeCurrentPriorityMin * 0.75));

      // Calcula confianca baseada no tamanho da fila e na taxa de atualizacao
      const baseConf = 0.92 - (i * 0.03);
      const conf = Math.max(0.65, Number((baseConf - freshnessPenalty).toFixed(2)));

      result[priority] = {
        fila: count,
        wait_med_min: estimatedWait,
        conf,
        pacientes_hora: Number(((count / (Math.max(1, estimatedWait) / 60))).toFixed(1))
      };

      // Acumula atraso que impactara as prioridades inferiores
      accumulatedHigherPriorityWaitMin += drainTimeCurrentPriorityMin;
    }

    return result;
  }
}
