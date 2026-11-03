/**
 * Adaptador para integracao com e-SUS APS / PEC (Prontuario Eletronico do Cidadao)
 * Executa consultas somente-leitura (read-replica) no banco PostgreSQL do e-SUS
 * para computar tempo de espera de acolhimento e consultas de demanda espontanea.
 */
export class EsusCollectorAdapter {
  /**
   * Consulta SQL de exemplo para extracao agregada de acolhimento e triagem no e-SUS PEC
   * Nota: Nao extrai NENHUM dado pessoal (sem CPF, nome, prontuario), apenas contagens e deltas temporais.
   */
  public static readonly QUERY_ACCOLHIMENTO_TEMPO_ESPERA = `
    SELECT 
      fa.co_dim_unidade_saude AS cnes_unidade,
      DATE_TRUNC('hour', fa.dt_inicial) AS faixa_horaria,
      COUNT(*) AS total_acolhidos,
      AVG(EXTRACT(EPOCH FROM (fa.dt_final - fa.dt_inicial))/60) AS tempo_medio_espera_min
    FROM tb_fat_atendimento fa
    WHERE fa.dt_inicial >= NOW() - INTERVAL '4 hours'
    GROUP BY cnes_unidade, faixa_horaria
    ORDER BY faixa_horaria DESC;
  `;

  /**
   * Simula a extracao de eventos do e-SUS PEC para uma unidade de saude basica
   */
  public static extractMetrics(cnes: string) {
    return {
      cnes,
      timestamp: new Date().toISOString(),
      tipo_coleta: 'e-SUS/PEC Read-Replica',
      status: 'SIMULADO',
      data_mode: 'SYNTHETIC_DEMO',
      metricas_agregadas: {
        fila_acolhimento: Math.floor(Math.random() * 5) + 1,
        tempo_medio_acolhimento_min: 8,
        consultas_em_andamento: 3
      }
    };
  }
}
