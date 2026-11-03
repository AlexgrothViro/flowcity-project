# Persistência e dados de demonstração

## Armazenamento

O backend usa SQLite em modo WAL por padrão, criando `data/flowcity.sqlite`. O caminho pode ser alterado por `SQLITE_PATH`. Para PostgreSQL/TimescaleDB, configure `DATABASE_URL`; se a conexão inicial falhar, o serviço registra um evento estruturado e abre SQLite local como fallback.

O esquema guarda snapshots por unidade, eventos de fluxo, consultas, encaminhamentos e trilha de auditoria. Snapshots são gravados a cada minuto e a última amostra de cada unidade é restaurada durante a inicialização. O processo não grava nomes, CPF ou prontuário nessa camada de snapshots.

## Série sintética

O histórico de 30 dias é gerado apenas sob comando explícito:

```powershell
$env:ALLOW_SYNTHETIC_SEED = 'true'
npm.cmd run seed:synthetic --workspace=backend
```

A rotina grava 30 dias de snapshots em intervalos de um minuto e rotula cada payload como `SYNTHETIC_DEMO`. Os valores são dados de demonstração matematicamente variáveis; não representam registros epidemiológicos observados de Novo Hamburgo e não devem ser usados para decisões clínicas, gestão real ou auditoria pública.

## Estado de validação

A cobertura atual confirma gravação e restauração de snapshots, consultas e encaminhamentos em SQLite após reabertura do banco. A conexão PostgreSQL requer validação em um ambiente de integração com uma instância PostgreSQL disponível. Os adaptadores HL7/e-SUS ainda precisam ser ligados aos eventos persistidos antes de tratar o histórico de admissão, triagem e alta como integrado.
