# Simulação, alertas e privacidade estatística

## Simulação de filas
O endpoint `POST /api/v0/simulation/queue` roda uma simulação de eventos discretos com chegadas e tempos de serviço exponenciais, capacidade finita de fila e múltiplas execuções Monte Carlo. A resposta sempre carrega `data_mode: SYNTHETIC_DEMO`. Os limites de execução restringem duração e número esperado de eventos para proteger o serviço.

## Anomalias de chegada
`POST /api/v0/analytics/anomalies/observe` mantém uma janela móvel por chave (bairro + grupo de sintomas), calcula Z-score e CUSUM unilateral, e persiste alertas acionados na trilha de eventos e auditoria. A demonstração ainda não possui uma ingestão de incidência epidemiológica validada; alertas só devem ser tratados como sinais operacionais experimentais até haver série de referência real e revisão epidemiológica.

## Supressão k-anônima
As respostas públicas de estado substituem contagens inteiras positivas menores que 3 por `null` e um campo indicativo de supressão. A assinatura Ed25519 é recalculada sobre o payload já sanitizado, de modo que não certifique uma contagem escondida. Dados internos de simulação continuam em memória para cálculos de roteamento.

Contagens com valor zero são mantidas. A regra não transforma `null` em zero na interface.

## Uso responsável
A simulação não estima risco clínico individual, não escolhe prioridade de triagem e não substitui protocolo assistencial. Os resultados são cenários matemáticos para avaliação de capacidade, sem valor de decisão clínica.
