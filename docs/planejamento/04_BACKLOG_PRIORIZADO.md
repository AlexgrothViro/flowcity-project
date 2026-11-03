# Backlog de evolução

Revisão: 03/11/2026. Propostas ainda não implementadas. Ordem baseada em dependências, consequência de falha e valor a validar. Não há dados de uso para RICE quantitativo. Esforço relativo: P = poucos dias; M = uma a duas semanas; G = várias semanas técnicas. Esperas externas não estão incluídas.

## P0 — antes de dados institucionais

| ID | Melhoria | Aceite observável | Dependência | Porte |
| --- | --- | --- | --- | --- |
| FC-001 | Descobrir problema e responsável | 12 entrevistas, quatro papéis, um fluxo e decisão selecionados; objeções registradas | Participantes | M |
| FC-002 | Isolar demonstração | Gerador sintético não inicia no ambiente institucional; mistura de origens falha visivelmente | Configuração explícita | M |
| FC-003 | Autenticar e autorizar por unidade/papel | Leitura e escrita privadas negadas sem credencial e fora da unidade; SSE/WS seguem política | Identidade pactuada | G |
| FC-004 | Formalizar contrato de dados | Dicionário, finalidade, responsáveis, retenção e acesso acordados | Jurídico + TI | M |
| FC-005 | Revisar saídas públicas | Revisar totais, séries, rotas, previsões, FHIR e exportação; testar reconstrução por diferenças e células complementares | Inventário | G |
| FC-006 | Tornar perda de banco explícita | Ambiente institucional não troca silenciosamente de banco; restauração demonstrada | Operação definida | M |
| FC-007 | Validar todas as entradas | Corpo, query e parâmetros validados; limites e erros consistentes; matriz de acesso por endpoint | FC-003 | M |

## P1 — primeira versão interna

| ID | Melhoria | Aceite observável | Dependência | Porte |
| --- | --- | --- | --- | --- |
| FC-008 | Conectar uma fonte com idempotência | Duplicação não altera contagem; eventos atrasados reconciliados; reprocessamento auditável | FC-002/004/006 | G |
| FC-009 | Mostrar qualidade e origem | Métrica mostra horários do evento e ingestão, origem e qualidade; dado antigo fica indisponível conforme regra | FC-008 | M |
| FC-010 | Padronizar tempos observados | Mediana, estimativa e espera atual são distintas; denominadores e exclusões conferem na amostra | FC-008/009 | M |
| FC-011 | Avaliar previsões | Comparação temporal com persistência/mediana histórica, sem futuro no treino; relatório por horizonte | FC-010 | G |
| FC-012 | Registrar ação e encerramento | Problema, ação, responsável, prazo e resultado; acesso autorizado | FC-003/009 | M |
| FC-013 | Operar e recuperar | Logs sem dados sensíveis; readiness separado de liveness; backup, restauração e rollback exercitados | FC-006/008 | G |
| FC-014 | Acessibilidade das tarefas essenciais | Teclado, foco, leitor de tela, zoom, contraste medido e tabela alternativa revisados | UX das tarefas | M |
| FC-015 | Testar fluxo e implantação | Sessão, ingestão, atualização e falha cobertas ponta a ponta; caminho de arquivos do container conferido | FC-003/008/009 | M |
| FC-016 | Estabilizar assinatura e origem | Identificador de chave/emissor, proteção, rotação e serialização definidos | Gestão de segredos | M |

## P2 — após prova de utilidade

| ID | Ideia e benefício a investigar | Condição de entrada | Porte |
| --- | --- | --- | --- |
| FC-017 | Resumo de passagem de turno e gargalos | FC-012 adotado; resumo aprovado pela equipe | M |
| FC-018 | Cenários de capacidade calibrados | FC-011 aprovado, distribuições documentadas | G |
| FC-019 | Página pública de serviços e atualização | G4, entendimento e privacidade avaliados | G |
| FC-020 | Várias unidades e isolamento de acesso | Segunda unidade acordada; indicadores comparáveis | G |
| FC-021 | Alertas nos canais já usados | Demanda validada e autorização de mensagens; sem dados sensíveis | M |
| FC-022 | Apoio a oferta/absenteísmo ambulatorial | Lacuna em relação às soluções existentes; novo PRD | G |

## P3 — pesquisa futura

- **RNDS:** selecionar modelo aplicável e seguir credenciamento/homologação; não enviar os agregados atuais como registros clínicos.
- **Teleinterconsulta:** avaliar parceria com serviço habilitado; identidade, prontuário e responsabilidades exigem projeto próprio.
- **Conectores reutilizáveis:** biblioteca versionada para reduzir a segunda implantação, sem presumir acesso a sistemas proprietários.
- **Equidade territorial:** estudar quem fica fora dos canais digitais, com desenho amostral e proteção de privacidade.
- **Indicadores sazonais externos:** incorporar apenas com ganho fora da amostra, licença e fonte estável.

Triagem autônoma, prescrição e destino automático de ambulância exigem finalidade e avaliação regulatória específicas. Não entram por simples pontuação de backlog.

## Ordem de início

FC-001/004 avançam com o parceiro. Engenharia prepara FC-002/003/005/006 antes do conector. Qualidade e definições sustentam a avaliação do modelo. Sem fonte confiável, mais complexidade não demonstra valor.
