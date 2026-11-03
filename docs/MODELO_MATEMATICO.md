# Modelos implementados e limites de interpretação

Revisão: 03/11/2026. Esta descrição substitui a formulação anterior que apresentava uma solução teórica como se estivesse integralmente implementada. Base: leitura de código em 67ff4a5.

## Estimativa por prioridade

[ManchesterQueuingModel](../backend/src/engine/queuing.ts) calcula uma heurística com contagem em fila, salas ativas e tempo médio de consulta. Usa ao menos uma sala para evitar divisão por zero. Vermelho recebe espera zero no modelo demonstrativo; isso não mede nem garante atendimento imediato real.

Para cada prioridade seguinte, calcula aproximadamente:

**espera = arredondar(atraso acumulado das prioridades anteriores + 0,75 × contagem da prioridade × tempo médio de consulta / salas).**

O atraso acumulado cresce com o tempo de drenagem das classes anteriores. O campo chamado wait_med_min não é, por isso, uma mediana empírica observada. A confiança é uma regra predefinida, com penalidade por idade do dado; não foi calibrada com resultados reais.

Esse método não é uma solução exata de fila multiclasses M/M/c/K. Taxas de chegada declaradas na interface do modelo não devem ser interpretadas como parâmetros estimados e usados em toda a fórmula. Para uso real, definir alvo, comparar com referências e medir erro.

## Monte Carlo de cenários

[MonteCarloQueueSimulator](../backend/src/engine/monteCarlo.ts) é uma simulação de eventos discretos, com chegadas e serviços exponenciais, vários servidores e fila de capacidade finita. É separado da heurística por prioridade e não simula suas cinco classes clínicas.

A capacidade informada é a da fila aguardando; a capacidade total em serviço mais espera inclui os servidores. Usa semente para repetibilidade e limites de volume/duração. Distribuições e parâmetros são suposições do cenário, sem calibração institucional.

O P95 das médias entre execuções não é o percentil do tempo de cada paciente, nem um intervalo de previsão clínica validado. Reportar rejeição e volume atendido junto com espera; excluir chegadas por capacidade pode alterar a média observada.

## Kalman e projeção de curto prazo

[KalmanFilter1D](../backend/src/engine/kalman.ts) suaviza séries segundo parâmetros definidos no código. [NowcastingEngine](../backend/src/engine/nowcasting.ts) usa pesos horários fixos para gerar deltas e constantes de confiança por horizonte.

Os deltas atuais são determinados pela relação entre pesos horários; não representam um modelo treinado com histórico local. Embora receba medidas suavizadas, a fórmula dos deltas não utiliza diretamente seus valores para estimar a tendência. Os pesos não devem ser chamados de curva empírica validada de UPAs brasileiras.

O uso de horário do processo exige revisão de fuso em implantação. Intervalos gráficos demonstrativos não constituem cobertura probabilística comprovada.

## Como evoluir

Construir indicadores observados de eventos autorizados; preservar diferenças entre média, mediana, tempo de espera atual e previsão; validar distribuição de chegada/serviço; avaliar temporalmente contra persistência e mediana histórica. Conferir estabilidade por período, pico e grupos com amostra suficiente. [Plano de avaliação](planejamento/05_PILOTO_E_METRICAS.md).

Não confundir testes que verificam o algoritmo com validação dos pressupostos ou da utilidade no serviço.
