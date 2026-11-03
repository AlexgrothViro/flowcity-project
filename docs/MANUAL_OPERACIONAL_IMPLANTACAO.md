# Manual local do protótipo

Revisão: 03/11/2026. Este é um guia de execução demonstrativa. Procedimentos assistenciais de uma unidade precisam de elaboração e aprovação próprias.

## Executar

Requisitos e comandos ficam no [README](../README.md). Instalar dependências; usar npm run dev para desenvolvimento, ou npm run build e npm start para a versão compilada. Backend: localhost:3001. Frontend de desenvolvimento: localhost:5173.

Usar apenas dados sintéticos. O banco padrão é SQLite; DATABASE_URL permite tentar PostgreSQL, com retorno ao SQLite em falha. Esse comportamento precisa de política explícita para operação institucional.

## Demonstrar

1. Abrir o portal e identificar o modo de demonstração.
2. Conferir unidades, origem, atualização e valores suprimidos.
3. Explorar mapa e estimativas aproximadas sem usá-los como orientação assistencial.
4. Abrir Sala de Situação e distinguir histórico, cenário e previsão.
5. Exportar somente informação sintética; não preencher dados pessoais nos formulários.

O carregamento de 30 dias sintéticos exige habilitação explícita e pode gravar muitos snapshots. Usar base descartável; instrução no README e em [persistência](PERSISTENCIA_E_HISTORICO.md).

## Verificar problemas locais

Falha de API: conferir processo, porta e logs. Ausência de histórico: conferir persistência e tempo de execução; não substituir dado ausente por zero. Health mostra informação básica do processo, não prontidão completa de integração. Frontend não servido: conferir build e caminho relativo; o layout da imagem deve ser validado antes de depender do Docker.

Não há suporte institucional 24/7 contratado. Não usar a aplicação como dependência do atendimento de uma unidade.

## Preparar implantação futura

Seguir [dados e governança](planejamento/06_DADOS_ARQUITETURA_GOVERNANCA.md), [piloto](planejamento/05_PILOTO_E_METRICAS.md) e [backlog](planejamento/04_BACKLOG_PRIORIZADO.md). Designar responsável por ingestão, painel, segurança, contingência e retorno ao processo habitual. Uma autorização para demonstração não autoriza entrada de dados reais.
