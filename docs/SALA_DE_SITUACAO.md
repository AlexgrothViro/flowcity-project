# Sala de Situação e análise de cenários

A tela de gestão apresenta dados de demonstração até existir integração municipal verificada. Ela não recomenda fechamento/abertura de unidades, não aciona equipes e não é boletim oficial.

## Histórico

GET /api/v0/history/wait-times?unitId=upa_canudos&hours=24 lê snapshots persistidos. O período solicitado fica limitado a 24 horas no endpoint. Contagens de triagem menores que k=3 são suprimidas; a espera correspondente também fica oculta. Os snapshots são gravados pelo StateManager a cada minuto e podem demorar a formar uma série suficiente.

## Previsões

A linha histórica mostra espera amarela. As projeções de +15, +30 e +60 minutos usam os deltas e o campo de confiança do estado atual. A faixa sombreada é apenas indicativa e não é um intervalo estatístico calibrado; não deve sustentar decisão clínica ou operacional.

## What-if

POST /api/v0/simulation/queue executa comparação Monte Carlo com hipóteses de chegada Poisson e atendimento exponencial. A tela compara cenário base e cenário configurado, exibindo espera média, percentil 95, comprimento médio de fila e taxa de rejeição.

O controle de chegadas de ambulância apenas aumenta hipoteticamente a taxa total de chegadas; não representa GPS, dados de SAMU ou tempos de atendimento específicos. O número de equipe adicional representa servidores equivalentes no modelo. Não há custo municipal configurado, portanto o painel não calcula economia financeira.

## Boletim

JSON inclui estado agregado, histórico visível e cenário simulado. CSV contém os pontos da série histórica. A impressão usa a visualização atual do painel. Os arquivos são demonstrações e não prestação oficial de contas.
