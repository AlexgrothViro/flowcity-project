# FlowCity Saúde

Protótipo de software para explorar fluxos de atendimento, estimativas de espera e ocupação em uma rede municipal de saúde. O projeto está configurado com unidades-modelo de Novo Hamburgo (RS) e usa **dados sintéticos**. Ele não está conectado a uma prefeitura, hospital ou sistema de saúde e não deve apoiar decisões clínicas ou operacionais.

## O que há no protótipo

- Portal demonstrativo, painel de situação e visualização em mapa com unidades e distâncias estimadas.
- Modelo de filas por prioridade Manchester, projeções de curto prazo e simulador de cenários Monte Carlo.
- Série histórica local, exportação de relatório e gráficos rotulados como simulação.
- Fluxos de demonstração de telessaúde com campos SOAP e apoio documental a encaminhamentos.
- Prévia de recursos FHIR R4, assinaturas Ed25519 para integridade, armazenamento SQLite WAL ou PostgreSQL, e controles básicos de acessibilidade.
- API REST em `/api/v0`, fluxo de eventos SSE e WebSocket.

Os módulos não conectam com prontuário, SISREG, RNDS, ICP-Brasil, WhatsApp, SMS ou serviço de vídeo. A assinatura demonstra integridade criptográfica; ela não autentica a identidade ou a habilitação do emissor. As estimativas de rota não usam trânsito ou horários de transporte público.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Executar localmente

```bash
git clone https://github.com/AlexgrothViro/flowcity-project.git
cd flowcity-project
npm install
npm run dev
```

O backend fica em `http://localhost:3001` e o frontend Vite em `http://localhost:5173`. Para servir a versão compilada pelo backend:

```bash
npm run build
npm start
```

Abra `http://localhost:3001`. O SQLite é criado em `data/flowcity.sqlite` por padrão. Defina `SQLITE_PATH` para escolher outro arquivo. Defina `DATABASE_URL` para tentar PostgreSQL; se a conexão não estiver disponível, o serviço volta ao SQLite.

## Verificações

```bash
npm test
npm run build
npm audit
```

A suíte atual tem 37 testes unitários e de integração no backend. O mapa, interface e fluxos completos ainda precisam de testes de ponta a ponta e avaliação manual com tecnologias assistivas.

## API de demonstração

- `GET /api/v0/health` — estado básico do processo.
- `GET /api/v0/units` — unidades configuradas.
- `GET /api/v0/states` — estados agregados e sanitizados.
- `GET /api/v0/history/wait-times?unitId=upa_canudos&hours=24` — histórico local, quando disponível.
- `POST /api/v0/simulation/queue` — cenário de filas sintético.
- `GET /api/v0/fhir/Location` e `GET /api/v0/fhir/Bundle` — prévias FHIR, sem envio à RNDS.
- `GET /api/v0/openapi.json` — descrição reduzida da API.

A documentação OpenAPI está em [`docs/openapi.yaml`](docs/openapi.yaml). O limite padrão é 300 requisições REST por IP a cada 15 minutos, guardado em memória por processo.

## Dados históricos sintéticos

O banco local recebe snapshots durante a execução. Para carregar uma série demonstrativa de 30 dias, de forma explícita:

```bash
# PowerShell
$env:ALLOW_SYNTHETIC_SEED = 'true'
npm run seed:synthetic --workspace=backend
```

Essa operação grava 43.200 snapshots por unidade no banco configurado. Use uma base descartável de demonstração. Não execute contra uma base que contenha dados de produção.

## Documentação

- [Status, épicos e limites conhecidos](docs/STATUS_DO_PROJETO.md)
- [Persistência e histórico](docs/PERSISTENCIA_E_HISTORICO.md)
- [Sala de Situação](docs/SALA_DE_SITUACAO.md)
- [Acessibilidade e segurança da API](docs/ACESSIBILIDADE_E_SEGURANCA.md)
- [Privacidade e supressão de grupos pequenos](docs/ANALITICA_E_PRIVACIDADE.md)
- [Interoperabilidade FHIR](docs/INTEROPERABILIDADE_FHIR.md)
- [Telessaúde e regulação](docs/TELESSAUDE_E_REGULACAO.md)
- [Arquitetura técnica](docs/ARQUITETURA_TECNICA.md)

Consulte as demais notas em [`docs/`](docs/).

## Antes de qualquer uso institucional

O projeto ainda exige validação com os serviços municipais, governança clínica, avaliação de segurança e privacidade, testes de carga, integração real e aprovação regulatória aplicável. Consulte [acessibilidade e segurança](docs/ACESSIBILIDADE_E_SEGURANCA.md) para limites específicos. O modo de demonstração deve permanecer separado de dados assistenciais reais.

## Licença

MIT. Consulte [`LICENSE`](LICENSE).
