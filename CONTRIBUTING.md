# Contribuir com FlowCity Saúde

Comece pelo [índice documental](docs/README.md), [estado do protótipo](docs/STATUS_DO_PROJETO.md) e [backlog proposto](docs/planejamento/04_BACKLOG_PRIORIZADO.md).

## Propor trabalho

Descreva uma situação concreta, usuário, resultado esperado, evidência e critério de aceite. Distinguir hipótese, requisito futuro e comportamento já implementado. Use os modelos de issue de funcionalidade ou integração; não anexar credenciais, dados pessoais ou mensagens clínicas.

Não presumir parceria institucional, capacidade de unidade, benefício financeiro ou conformidade regulatória. Novas alegações precisam de fonte, data e limites.

## Dados e software

Manter exemplos sintéticos identificados. Não gravar nomes, CPF, CNS, prontuário ou texto sensível em logs e issues. A entrada de dados reais exige preparação institucional e acesso autorizado; ver [dados e governança](docs/planejamento/06_DADOS_ARQUITETURA_GOVERNANCA.md).

O motor por prioridade é heurístico e a simulação é um componente separado; ver [modelo implementado](docs/MODELO_MATEMATICO.md). Alterações de comportamento exigem testes adequados ao risco, com entradas de borda relevantes, sem confundir teste do código com validação clínica.

## Entregar alterações

Usar commits descritivos, como docs, feat, fix e test. Explicar problema, mudança, evidência e limite. Para código, executar verificações apropriadas (por exemplo testes, compilação e auditoria se dependências mudarem). Para documentação, conferir links, fontes e coerência de escopo; não é necessário repetir a suíte de software por mudança apenas textual.

Novas rotas devem ter contrato reconciliado com a implementação e permissões especificadas. Atualizar PRD, backlog, cronograma e piloto juntos quando uma decisão mudar o escopo. Registrar alterações de modelos, parâmetros e definições de métricas com versão.

## Ambiente

Comandos de instalação, desenvolvimento, testes e build estão no [README](README.md). Operação local em [manual](docs/MANUAL_OPERACIONAL_IMPLANTACAO.md).

A licença do código não representa suporte ou autorização assistencial. Módulos clínicos futuros precisam de finalidade, responsáveis e avaliação próprias.
