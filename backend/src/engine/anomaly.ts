export interface AnomalyResult {
  key: string;
  currentRate: number;
  baselineMean: number;
  zScore: number | null;
  cusum: number;
  isAnomaly: boolean;
  reason?: 'Z_SCORE' | 'CUSUM';
}

interface SeriesState {
  values: number[];
  cusum: number;
}

export class ArrivalAnomalyDetector {
  private readonly series = new Map<string, SeriesState>();

  public constructor(
    private readonly windowSize = 60,
    private readonly zThreshold = 2,
    private readonly cusumThreshold = 5
  ) {
    if (!Number.isInteger(windowSize) || windowSize < 5 || zThreshold <= 0 || cusumThreshold <= 0) {
      throw new Error('Invalid anomaly detector configuration');
    }
  }

  public observe(key: string, currentRate: number): AnomalyResult {
    if (!key.trim() || !Number.isFinite(currentRate) || currentRate < 0) {
      throw new Error('A non-empty key and non-negative finite rate are required');
    }
    const state = this.series.get(key) ?? { values: [], cusum: 0 };
    const values = state.values;
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : currentRate;
    const variance = values.length > 1
      ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
      : 0;
    const deviation = Math.sqrt(variance);
    const zScore = deviation > 0 ? (currentRate - mean) / deviation : null;
    const cusum = Math.max(0, state.cusum + (currentRate - mean) - deviation * 0.5);
    const zAnomaly = zScore !== null && zScore >= this.zThreshold;
    const cusumAnomaly = cusum >= this.cusumThreshold;

    values.push(currentRate);
    if (values.length > this.windowSize) values.shift();
    this.series.set(key, { values, cusum: cusumAnomaly ? 0 : cusum });

    return {
      key,
      currentRate,
      baselineMean: mean,
      zScore,
      cusum,
      isAnomaly: zAnomaly || cusumAnomaly,
      ...(zAnomaly ? { reason: 'Z_SCORE' as const } : cusumAnomaly ? { reason: 'CUSUM' as const } : {})
    };
  }
}
