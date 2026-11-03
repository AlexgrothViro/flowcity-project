# Status do projeto — FlowCity Saúde

**Revisão:** Épicos 1–8 concluídos no repositório. Branch de entrega: `main`.

Este documento descreve o estado do código, não uma implantação. A configuração e os dados do protótipo são sintéticos; não há operação municipal conectada.

## Planejamento após o protótipo

Revisão documental de 03/11/2026: os oito épicos descrevem a entrega de um protótipo, não prontidão para operação assistencial. A próxima etapa proposta está no [PRD](planejamento/02_PRD_FLOWCITY.md), com [cronograma](planejamento/03_ROADMAP_CRONOGRAMA.md), [backlog](planejamento/04_BACKLOG_PRIORIZADO.md) e [critérios de piloto](planejamento/05_PILOTO_E_METRICAS.md). A validação de 37 testes citada aqui é a anterior a esta revisão; não houve nova execução de software na etapa exclusivamente documental.

## Épicos concluídos

1. **Persistência:** SQLite em modo WAL, opção de PostgreSQL, eventos de fluxo de trabalho, auditoria append-only e consulta de snapshots históricos.
2. **Analítica e privacidade:** simulação Monte Carlo, detecção de anomalias e supressão de contagens pequenas nos dados públicos.
3. **Interoperabilidade:** prévias de recursos FHIR R4 e coleta de eventos HL7 ADT sem identificadores pessoais nos cenários cobertos.
4. **Mapa de unidades:** mapa interativo com unidades configuradas e estimativas demonstrativas de distância e deslocamento.
5. **Fluxos de telessaúde:** formulários SOAP e checklist de apoio documental; verificação de hash/assinatura não afirma confiança do emissor.
6. **Sala de Situação:** histórico, cenários hipotéticos, faixa de incerteza não calibrada, exportação e impressão.
7. **Acessibilidade e segurança:** controles de leitura, foco de teclado, contraste, símbolos Manchester, Helmet, limite REST em memória, validação Zod e endpoint de saúde.
8. **Testes e documentação:** 37 testes backend (unitários e de integração), README revisto e notas de escopo e operação.

## Limites conhecidos

- Os dados e parâmetros iniciais são sintéticos e não calibrados com dados de saúde reais.
- Não existem integrações operacionais com HIS/prontuário, SISREG, RNDS, ICP-Brasil, serviços de videoconferência, SMS ou WhatsApp.
- FHIR é prévia de recursos, não submissão à RNDS; a verificação criptográfica não confirma a identidade ou autoridade do emissor.
- Mapas usam serviços externos de tiles e linhas/distâncias aproximadas; não há trânsito nem GTFS.
- A faixa do simulador não é previsão validada. Resultados não são recomendações de equipe, transferência ou custo.
- O rate limit é local ao processo; produção com múltiplas instâncias precisa de armazenamento compartilhado e limites por usuário/cliente.
- A CSP está desativada; o deployment precisa de uma política compatível com os recursos do frontend.
- Os recursos de acessibilidade são uma base. Ainda falta auditoria completa WCAG, testes de leitor de tela, avaliação de contraste por componente e testes de ponta a ponta.
- O teste automatizado atual cobre backend. Não substitui validação de integração, teste de carga, segurança ou revisão clínica.

## Últimos commits dos épicos finais

- Épico 6 — `09f4458` — sala de situação e relatórios de cenários.
- Épico 7 — `ede471f` — acessibilidade e proteções da API.
- Épico 8 — testes de borda e integração, README revisto e status documentado.

## Próximos passos se o projeto avançar para piloto

1. Definir patrocinador municipal, responsável clínico e governança dos dados.
2. Acordar protocolos locais, métricas e fontes antes de ligar integrações.
3. Fazer avaliação de impacto à proteção de dados e threat model com a equipe de segurança.
4. Validar calibração e vieses em ambiente controlado, com supervisão clínica e critérios de interrupção.
5. Completar auditoria de acessibilidade, carga, recuperação e resposta a incidentes.
6. Planejar integração e autorização formal com cada sistema participante.
