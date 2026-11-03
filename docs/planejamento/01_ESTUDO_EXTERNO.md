# Estudo externo e aplicabilidade

Revisão: 03/11/2026. Pesquisa documental exploratória em fontes primárias. Não foram feitas entrevistas, cotações nem avaliações de campo. [Registro de fontes](10_FONTES_E_EVIDENCIAS.md).

## Recomendação

Testar o FlowCity como camada de observação de fluxo e qualidade de dados para gestores de uma unidade de urgência. A hipótese é ajudar a perceber dados atrasados e gargalos, registrar uma ação e conferir seu resultado. A compra e a adoção dependem de esse trabalho existir e ainda ser mal atendido pelas ferramentas locais.

Começar com uma unidade, uma fonte autorizada e um fluxo mensurável. O protótipo atual usa dados sintéticos. Testes de software e precisão em simulação não demonstram impacto assistencial.

## Referenciais e alternativas já existentes

| Referência | Achado externo | Implicação proposta |
| --- | --- | --- |
| [Sistemas do Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/saes/drac/regulacao-do-acesso/sistemas-de-informacao) | O Ministério disponibiliza SISREG e e-SUS Regulação; a página informa escopo ambulatorial do e-SUS | Identificar uma lacuna concreta antes de criar outro fluxo regulatório |
| [SUS Digital Gestor](https://webatendimento.saude.gov.br/faq/susdigitalgestor) | Informações estratégicas e filas de regulação, com perfis de acesso | Demonstrar utilidade adicional na operação local e qualidade da origem |
| [Saúde Já Curitiba](https://saudeja.curitiba.pr.gov.br/duvidas-frequentes) | Agendamentos, confirmações e serviços ao cidadão | Um aplicativo municipal não é diferencial por si só; aproveitar canais existentes |
| [Painel do RJ](https://painel-regulacao-usuario-do-sus.saude.rj.gov.br/duvidas) | Acompanhamento de solicitações, oferta e filas | Separar fila de consulta especializada de espera dentro de uma emergência |
| [NSW Health](https://www.health.nsw.gov.au/Hospitals/Going_To_hospital/Pages/emergency-departments.aspx) | Publica informação sobre emergências e explica atendimento por urgência clínica | Estudar linguagem e atualização; não importar protocolos de outro país |
| [Manual de NIR](https://bvsms.saude.gov.br/bvs/publicacoes/manual_implantacao_implementacao_nir_nucelo_interno_regulacao_hospitais_gerais_especializado.pdf) | Organização da regulação interna e articulação institucional | Entrevistar NIR e liderança; todo alerta precisa de responsável capaz de agir |
| [RNDS](https://fhir.saude.gov.br/pt-BR/integracao.html) | Integração tem homologação e requisitos institucionais | Escolher modelo aplicável; Bundle de demonstração não equivale a integração |
| [OMS, DIIG](https://www.who.int/publications/i/item/9789240010567) | Planejamento orientado a necessidades, custos e contexto | Investir por etapas e medir resultados antes de expandir |

Este levantamento não é um censo de fornecedores, uma revisão sistemática nem uma comparação completa das plataformas. A existência dos referenciais não prova que atendem ao problema de um parceiro específico. Tampouco comprova benefícios do FlowCity.

A [Portaria GM/MS 9.262/2025](https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt9262_31_12_2025.html) inclui acesso, equidade e transparência entre objetivos da política de regulação. O alinhamento de propósito não constitui aprovação do produto; a aplicação depende do contexto institucional.

## Três filas distintas

1. **Dentro da unidade:** chegada, classificação realizada pela equipe e início do atendimento. A unidade de análise é o episódio e sua etapa.
2. **Ambulatorial regulada:** solicitação, priorização, agendamento e atendimento. A unidade de análise é o pedido.
3. **Fluxo hospitalar:** necessidade de leito, liberação, transferência e internação. A unidade de análise é o processo e a capacidade disponível.

Uma única tela não resolve os três processos. A proposta inicial é observar o primeiro, em articulação com o NIR quando existir. Transferências e destinos assistenciais dependem da regulação e dos protocolos locais.

## Onde pode ser aplicado

| Ambiente | Utilidade possível | Condição de entrada | Momento |
| --- | --- | --- | --- |
| UPA/pronto atendimento | Visibilidade de etapas e dados ausentes; passagem de turno | Gestor, fonte de eventos e equipe para validar o fluxo | Primeira escolha |
| Hospital com NIR | Gargalos entre etapas e comunicação interna | Patrocínio do NIR e acesso acordado com TI | Alternativa inicial |
| APS | Entender oferta e demanda por período | Processo e agenda definidos; encaixe no sistema existente | Após primeiro piloto |
| Consórcio municipal | Indicadores comparáveis entre unidades | Governança e acordos de compartilhamento | Após duas implantações |
| SAMU/regulação de urgência | Informação operacional complementar | Atualidade comprovada e governança específica | Posterior |
| Cidadão | Informação institucional compreensível | Dados confiáveis, privacidade e comunicação aprovada | Posterior ao uso interno |
| Universidade | Avaliação dos métodos | Plano de pesquisa e avaliação ética aplicável | Parceria de apoio |

Novo Hamburgo é um contexto do protótipo, sem parceria ou autorização confirmadas. Nomes, CNES, serviços, horários, capacidade e mantenedores precisam ser validados com a gestão. O [CNES](https://webatendimento.saude.gov.br/faq/cnes) é referência cadastral; não mede fila ao vivo.

## Hipóteses a testar

- O gestor perde tempo conciliando telas, planilhas e chamadas.
- O atraso da informação justifica outra ferramenta.
- Existe uma ação viável quando um gargalo é identificado.
- O fornecedor permite um conector autorizado a custo aceitável.
- O orçamento comporta implantação, manutenção e acompanhamento.

Não usar os números antigos de economia, custo por consulta ou percentual de casos leves como argumento comercial. Medir o contexto local. Ver [descoberta](09_DESCOBERTA_E_VALIDACAO.md), [PRD](02_PRD_FLOWCITY.md) e [piloto](05_PILOTO_E_METRICAS.md).
