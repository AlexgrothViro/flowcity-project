# Acessibilidade e proteções da API

## Interface

- O link “Pular para o conteúdo principal” e os contornos visíveis de foco permitem navegar por teclado.
- O controle de texto oferece escala normal, grande e muito grande; a escolha é guardada no navegador.
- O modo de alto contraste usa texto preto, fundo neutro e bordas marcadas. As prioridades Manchester incluem símbolos e rótulos textuais além das cores.
- “Ler conteúdo” usa a síntese de voz já disponível no navegador em português do Brasil. O controle informa quando a API do navegador não existe e permite parar a leitura.
- Animações são reduzidas quando o sistema operacional solicita movimento reduzido.

Estes recursos são uma base de acessibilidade e não equivalem a uma auditoria ou certificação WCAG AAA. Componentes externos (incluindo o mapa e widgets) ainda precisam de avaliação manual com leitor de tela, teclado e medição de contraste.

## API

- Helmet adiciona cabeçalhos de segurança; o cabeçalho CSP ficou desligado para não bloquear o bundle do frontend e estilos do mapa. O app desativa `X-Powered-By`.
- O limitador em memória permite 300 requisições REST por IP em 15 minutos, com cabeçalhos de limite. O limite reinicia quando o processo reinicia e não é compartilhado entre réplicas.
- O corpo JSON tem limite de 256 KB.
- Zod valida coordenadas e prioridades de rota, cenários de simulação e documentos recebidos. Erros de entrada retornam HTTP 400 com os campos inválidos.
- `GET /api/v0/health` retorna status, horário, tempo de processo, driver de persistência e o rótulo `SYNTHETIC_DEMO`; não é uma verificação de disponibilidade externa ou de conexão com banco.
- Zod foi atualizado para a versão corrigida após a auditoria reportar uma vulnerabilidade alta. `npm audit` concluiu sem vulnerabilidades na validação de software anterior a esta revisão documental. Isso não é uma auditoria de segurança institucional.

## Limites de operação

Os dados de demonstração não são dados operacionais nem devem orientar atendimento. Antes de uso institucional, configure TLS e origens CORS, proteção compartilhada de limite em ambiente distribuído, uma CSP compatível com os recursos escolhidos e auditoria de acessibilidade completa.


## Evolução planejada

Os controles atuais não incluem autenticação/autorização completa por instituição. Prioridades de acesso, ingestão e publicação estão no [backlog](planejamento/04_BACKLOG_PRIORIZADO.md). Para interface, planejar avaliação contra critérios WCAG 2.2 pertinentes, com tarefas e componentes de terceiros; a meta e o escopo de conformidade devem ser explicitamente pactuados.
