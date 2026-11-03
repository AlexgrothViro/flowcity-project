/**
 * Filtro de Kalman 1D para suavizacao de ruido em series temporais
 * de tempo de espera e ocupacao hospitalar.
 */
export class KalmanFilter1D {
  private x: number; // Estado estimado
  private p: number; // Covariancia do erro de estimativa
  private q: number; // Ruido do processo (variabilidade do fluxo de entrada)
  private r: number; // Ruido da medicao (imprecisao de carimbo no HIS/totem)

  constructor(initialValue: number, processNoise: number = 0.05, measurementNoise: number = 0.5) {
    this.x = initialValue;
    this.p = 1.0;
    this.q = processNoise;
    this.r = measurementNoise;
  }

  /**
   * Atualiza a estimativa com uma nova medicao ruidosa
   */
  public update(measurement: number): number {
    // 1. Etapa de Predicao (Time Update)
    // O estado anterior e projetado (x_k|k-1 = x_k-1)
    this.p = this.p + this.q;

    // 2. Etapa de Medicao (Measurement Update)
    // Calcula o Ganho de Kalman K = P / (P + R)
    const k = this.p / (this.p + this.r);

    // Atualiza a estimativa com a nova medicao
    this.x = this.x + k * (measurement - this.x);

    // Atualiza a covariancia do erro P = (1 - K) * P
    this.p = (1 - k) * this.p;

    return this.x;
  }

  public getState(): number {
    return this.x;
  }

  public reset(value: number): void {
    this.x = value;
    this.p = 1.0;
  }
}
