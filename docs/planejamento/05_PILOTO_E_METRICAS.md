# Plano de piloto e avaliação

Proposta para negociação, 03/11/2026. Piloto inicial em uma unidade e um fluxo, com observação interna. Metas abaixo são hipóteses de trabalho; não são resultados do FlowCity nem padrões clínicos. Base de planejamento: [OMS, guia DIIG](https://www.who.int/publications/i/item/9789240056572).

## Perguntas de avaliação

1. Os eventos existem, chegam com qualidade e representam o processo?
2. Gestores conseguem compreender os números e realizar uma tarefa útil?
3. A previsão melhora uma referência simples em dados futuros?
4. A rotina gera benefício mensurável sem trabalho duplicado?
5. É viável operar e manter o conector com o orçamento disponível?

A unidade seleciona uma decisão concreta, como revisar um gargalo na passagem de turno. Definir com a equipe o que é uma ação permitida; o piloto não automatiza decisão assistencial.

## Etapas

- **Linha de base / S5–S8:** pelo menos quatro semanas de dados autorizados e reconciliação. Não usar os gráficos para mudar a assistência.
- **Observação do modelo / S9–S12:** manter previsões registradas antes do resultado, sem influenciar o atendimento; comparar com referências.
- **Uso interno assistido / S13–S16:** gestores utilizam os dados observados e registram ações. Previsões só aparecem com status aprovado no marco G3.
- **Balanço:** relatório técnico, de uso e custo; decisão de ampliar, ajustar ou encerrar.

Quatro semanas por fase são uma janela operacional inicial. Sazonalidade, poucos eventos ou dados ruins podem exigir extensão. O tamanho necessário para inferências deve ser definido por profissional de avaliação/estatística após conhecer a variabilidade e o efeito de interesse.

## Dicionário dos principais indicadores

| Indicador | Definição proposta | Denominador ou cuidado |
| --- | --- | --- |
| Porta–classificação | Horário de início da classificação menos chegada | Episódios com ambos os horários válidos; não misturar início e fim |
| Classificação–atendimento | Início do primeiro atendimento definido menos início da classificação | Processo local precisa definir qual profissional/etapa conta |
| Porta–atendimento | Início do primeiro atendimento menos chegada | Apresentar mediana e P90 de episódios completos |
| Espera de quem permanece na fila | Horário de corte menos chegada/início da etapa | Retrato transversal; não equivale à espera total futura |
| Evasão antes de atendimento | Episódios com desfecho explicitamente registrado como saída antes do atendimento / chegadas elegíveis | Ausência de alta não prova evasão |
| Completude | Registros com todos os campos exigidos e válidos / registros elegíveis recebidos | Publicar também volume da origem e taxa de cobertura |
| Cobertura de ingestão | Episódios correspondentes / total elegível da origem na reconciliação | Sem denominador da origem não afirmar cobertura |
| Atraso de ingestão | Recebimento menos ocorrência do evento, em minutos | Mediana e P95; corrigir relógios e timezone |
| Erro temporal | Episódios com sequência impossível / episódios avaliáveis | Exibir exclusões, não corrigir silenciosamente |
| Esforço do gestor | Minutos para concluir tarefa de reunir e interpretar dados | Mesma tarefa antes/depois e número de participantes |
| Adoção | Turnos elegíveis em que gestor designado completou a revisão / turnos previstos | Um acesso ao site não demonstra uso útil |
| Custo operacional | Horas de suporte e integração + infraestrutura + terceiros | Separar implantação de custo recorrente |

Para tempos observados, registrar população, janela, fuso, unidade, prioridade registrada pela equipe e versão da regra. Episódios ainda abertos são censurados: não tratá-los como atendimento concluído nem como espera zero.

## Avaliação de previsões

Prever uma variável definida antes da análise, por exemplo a mediana observada de espera no próximo intervalo em uma unidade. A comparação precisa usar exatamente o mesmo alvo, corte e horizonte para todos os modelos.

Referências mínimas: último valor observado (persistência) e mediana histórica por período quando houver dados suficientes. Separar treino/ajuste, validação e teste por tempo; nunca embaralhar episódios futuros no treino. Registrar versão, instante da previsão, horizonte e dados disponíveis naquele instante.

Medir MAE em minutos, erro assinado, erros em períodos de pico e cobertura/largura de intervalos quando houver intervalos calibrados. Não chamar o P95 das médias simuladas de intervalo de previsão individual. Evitar MAPE onde os tempos podem ser zero.

Critério proposto: só manter previsão operacional se superar a referência por margem acordada antes do teste, de maneira consistente nos grupos avaliáveis, e se a informação melhorar uma tarefa real. Ganho apenas na média global pode esconder desempenho ruim em picos. Se não houver evidência suficiente, manter somente dados observados.

## Avaliação de efeito no serviço

Comparação simples antes/depois é descritiva: sazonalidade, equipe, demanda, protocolo e lotação podem explicar mudanças. Registrar esses fatores; usar unidade comparável e análise de série temporal quando desenho e volume permitirem. Atribuição causal exige desenho adequado.

Não prometer redução de espera, internações ou custo. Capacidade liberada, custo marginal evitado e economia de caixa são resultados diferentes. A pesquisa deve avaliar mudanças de processo e possíveis efeitos adversos, não apenas melhora do gráfico.

## Metas propostas de qualidade e uso

Pactuar até S2: completude ≥95%; erros temporais ≤2%; P95 de atraso ≤5 minutos, se a fonte suportar; reconciliação diária com tolerância definida com TI. As metas podem precisar de adaptação, documentada antes da avaliação.

Teste de tarefa com cinco gestores é formativo: quatro concluindo sem ajuda é um critério inicial de desenho, não estimativa representativa da população. Incluir profissionais com diferentes turnos e habilidades digitais.

## Interrupção e revisão

Suspender exposição institucional se houver mistura de dados sintéticos/reais, acesso indevido, fonte não autorizada ou informação enganosa que possa afetar decisões. Dado antigo deve ficar indisponível conforme política pactuada. Registrar incidente, responsável e retorno ao processo habitual; nunca interromper atendimento por indisponibilidade do FlowCity.

O parceiro decide se a avaliação constitui pesquisa e quais aprovações éticas se aplicam. Exportações do estudo seguem autorização e minimização; não publicar registros individuais.

## Entrega do piloto

Um relatório reproduzível com período, versão, cobertura, perdas, métricas, limitações, uso, custos e recomendação assinada pelos responsáveis designados. Registrar resultados negativos e a decisão sobre cada hipótese do [PRD](02_PRD_FLOWCITY.md).
