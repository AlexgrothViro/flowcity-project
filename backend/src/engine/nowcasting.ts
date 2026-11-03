import { ForecastDelta } from '../types.js';
import { KalmanFilter1D } from './kalman.js';

export class NowcastingEngine {
  private kalmanFilters: Map<string, KalmanFilter1D> = new Map();

  /**
   * Curva de intensidade horaria padrao em UPAs e Prontos-Socorros do SUS (0h a 23h)
   */
  private static readonly HOURLY_SEASONALITY_WEIGHTS: number[] = [
    0.35, 0.28, 0.22, 0.20, 0.25, 0.40, // 00h - 05h
    0.70, 1.10, 1.35, 1.45, 1.40, 1.25, // 06h - 11h (Pico matutino)
    1.15, 1.05, 1.10, 1.20, 1.35, 1.50, // 12h - 17h (Entardecer)
    1.55, 1.40, 1.20, 0.95, 0.75, 0.50  // 18h - 23h (Pico noturno e queda)
  ];

  private getFilter(unitId: string, metric: string, initialVal: number): KalmanFilter1D {
    const key = `${unitId}_${metric}`;
    if (!this.kalmanFilters.has(key)) {
      this.kalmanFilters.set(key, new KalmanFilter1D(initialVal, 0.08, 0.35));
    }
    return this.kalmanFilters.get(key)!;
  }

  /**
   * Projeta agora-casting para horizontes de 15, 30 e 60 minutos
   */
  public generateForecasts(
    unitId: string,
    currentWaitMedian: number,
    currentOccupancyRate: number,
    referenceDate: Date = new Date()
  ): {
    previsao_15min: ForecastDelta;
    previsao_30min: ForecastDelta;
    previsao_60min: ForecastDelta;
  } {
    const filterWait = this.getFilter(unitId, 'wait', currentWaitMedian);
    const filterOcc = this.getFilter(unitId, 'occ', currentOccupancyRate);

    const smoothedWait = filterWait.update(currentWaitMedian);
    const smoothedOcc = filterOcc.update(currentOccupancyRate);

    const currentHour = referenceDate.getHours();
    const currentMinute = referenceDate.getMinutes();

    return {
      previsao_15min: this.projectHorizon(smoothedWait, smoothedOcc, currentHour, currentMinute, 15),
      previsao_30min: this.projectHorizon(smoothedWait, smoothedOcc, currentHour, currentMinute, 30),
      previsao_60min: this.projectHorizon(smoothedWait, smoothedOcc, currentHour, currentMinute, 60)
    };
  }

  private projectHorizon(
    currentWait: number,
    currentOcc: number,
    hour: number,
    minute: number,
    horizonMinutes: number
  ): ForecastDelta {
    const currentWeight = NowcastingEngine.HOURLY_SEASONALITY_WEIGHTS[hour % 24];
    
    // Calcula hora futura fracionada
    const futureTotalMinutes = hour * 60 + minute + horizonMinutes;
    const futureHour = Math.floor(futureTotalMinutes / 60) % 24;
    const futureWeight = NowcastingEngine.HOURLY_SEASONALITY_WEIGHTS[futureHour];

    // Fator de tendencia baseado no gradiente da curva sazonal
    const seasonalityDelta = (futureWeight - currentWeight) / Math.max(0.1, currentWeight);

    // Variacao percentual esperada em PoW
    let powDelta = Number((seasonalityDelta * 0.65).toFixed(2));
    // Limita delta razoavel (-35% a +45%)
    powDelta = Math.max(-0.35, Math.min(0.45, powDelta));

    // Variacao percentual esperada em PoO
    let pooDelta = Number((seasonalityDelta * 0.40).toFixed(2));
    pooDelta = Math.max(-0.25, Math.min(0.35, pooDelta));

    // Define tendencia textual
    let tendencia: 'SUBINDO' | 'ESTAVEL' | 'DESCENDO' = 'ESTAVEL';
    if (powDelta > 0.05) tendencia = 'SUBINDO';
    else if (powDelta < -0.05) tendencia = 'DESCENDO';

    // Decaimento de confianca com a distancia do horizonte
    const baseConf = horizonMinutes === 15 ? 0.92 : horizonMinutes === 30 ? 0.86 : 0.78;
    const confianca_previsao = Number(baseConf.toFixed(2));

    return {
      pow_delta: powDelta,
      poo_delta: pooDelta,
      tendencia,
      confianca_previsao
    };
  }
}
