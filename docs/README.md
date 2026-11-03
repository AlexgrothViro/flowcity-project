# Documentação do FlowCity Saúde

Revisão: 03/11/2026. Este é o ponto de entrada. O repositório contém um protótipo sintético; o plano futuro ainda depende de validação e parceiros.

## Leitura recomendada

1. [Dossiê executivo](DOSSIE_EXECUTIVO_GOV.md): proposta em linguagem de gestão.
2. [Estado atual do software](STATUS_DO_PROJETO.md): o que foi construído e seus limites.
3. [Estudo externo e aplicabilidade](planejamento/01_ESTUDO_EXTERNO.md): alternativas e oportunidade a investigar.
4. [PRD](planejamento/02_PRD_FLOWCITY.md): problema, público, objetivos e escopo inicial.
5. [Cronograma](planejamento/03_ROADMAP_CRONOGRAMA.md): 16 semanas, marcos e próximos 14 dias.
6. [Backlog](planejamento/04_BACKLOG_PRIORIZADO.md): 22 melhorias e critérios de aceite.

## Planejar e validar

- [Piloto e métricas](planejamento/05_PILOTO_E_METRICAS.md)
- [Dados, arquitetura e governança](planejamento/06_DADOS_ARQUITETURA_GOVERNANCA.md)
- [Sustentação e viabilidade](planejamento/07_SUSTENTACAO_E_VIABILIDADE.md)
- [Riscos e registro de decisões](planejamento/08_RISCOS_E_DECISOES.md)
- [Descoberta e entrevistas](planejamento/09_DESCOBERTA_E_VALIDACAO.md)
- [Fontes e limites da pesquisa](planejamento/10_FONTES_E_EVIDENCIAS.md)

## Entender e executar o protótipo

- [Manual local](MANUAL_OPERACIONAL_IMPLANTACAO.md) e [README do projeto](../README.md)
- [Arquitetura implementada](ARQUITETURA_TECNICA.md)
- [Modelo matemático implementado e limites](MODELO_MATEMATICO.md)
- [Persistência](PERSISTENCIA_E_HISTORICO.md), [analítica e privacidade](ANALITICA_E_PRIVACIDADE.md)
- [Sala de Situação](SALA_DE_SITUACAO.md), [prévia FHIR](INTEROPERABILIDADE_FHIR.md)
- [SOAP e encaminhamento demonstrativos](TELESSAUDE_E_REGULACAO.md)
- [Acessibilidade e segurança atuais](ACESSIBILIDADE_E_SEGURANCA.md)
- [Contrato OpenAPI existente](openapi.yaml): precisa de reconciliação com as rotas; ver FC-007/015.

## Documentos institucionais de preparação

- [Contexto candidato de Novo Hamburgo](PILOTO_NOVO_HAMBURGO.md)
- [Preparação LGPD e responsabilidades](LGPD_ROPA_RIPD.md)
- [Telessaúde e referências](TELEMEDICINA_CFM.md)
- [Comunicação responsável](PLANO_COMUNICACAO_SOCIAL.md)
- [Registro desta revisão documental](REVISAO_DOCUMENTAL_2026-11-03.md)

## Regras de manutenção

Estado implementado, requisito futuro e hipótese devem ser identificados no início de cada documento. Toda promessa de resultado precisa de evidência e período. Não atribuir parceria, autorização ou papel legal sem formalização. Metas propostas e estimativas de custo não são resultados nem cotações.

Ao alterar escopo, revisar juntos PRD, backlog, cronograma e critérios do piloto. Após cada marco, atualizar estado, decisor, evidência e data. Revalidar fontes normativas antes de uso institucional. Não incluir dados pessoais nas issues ou exemplos.

O histórico das versões anteriores permanece no Git; os textos antigos com promessas não comprovadas foram substituídos, mantendo os caminhos de navegação.
