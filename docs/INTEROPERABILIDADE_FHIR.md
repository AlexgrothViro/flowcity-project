# Interoperabilidade FHIR R4

## Escopo implementado

- `GET /api/v0/fhir/Location` publica as quatro unidades modeladas como um Bundle de coleção.
- `GET /api/v0/fhir/Bundle` publica um Bundle de demonstração com Location, HealthcareService, Encounter agregado, Observation por prioridade, ServiceRequest e CommunicationRequest.
- Os recursos usam um CodeSystem local FlowCity para indicadores operacionais. Não são atribuídos códigos LOINC, SNOMED CT, CNES ou perfis RNDS sem validação do código e do vínculo institucional.
- Contagens passam pelo guarda k-anônimo antes da exportação. Contagens suprimidas são omitidas da Observation; todos os exemplos carregam uma marca de dados demonstrativos.

## Limite de conformidade

Os builders verificam a estrutura-base de recurso e os campos de identificação, não substituem o validador oficial FHIR nem validam perfis de cada modelo da RNDS. O Bundle gerado é uma prévia agregada para inspeção e não deve ser enviado à RNDS como registro clínico. A integração real exige credenciamento, perfil compatível com o modelo selecionado e validação das terminologias, regras e exemplos do guia oficial.

A RNDS publica guias por modelo e estabelece FHIR R4 para os perfis aplicáveis. A operação de envio usa o serviço REST de Bundle depois de autenticação e credenciamento institucional. Consulte [Guia de Implementação da RNDS](https://fhir.saude.gov.br/) e [orientações oficiais de integração](https://fhir.saude.gov.br/pt-BR/integracao.html). Os recursos usados pelos builders seguem o núcleo publicado do [HL7 FHIR R4](https://hl7.org/fhir/R4/).

## Próximos passos antes de integração real

1. Selecionar o modelo RNDS aplicável aos registros que o FlowCity efetivamente produzirá.
2. Importar e validar os StructureDefinitions, ValueSets e CodeSystems daquele guia.
3. Confirmar identificadores oficiais de estabelecimentos com a secretaria e os cadastros oficiais.
4. Fazer validação de recursos por uma instância do validador FHIR e ambiente de homologação autorizado.
