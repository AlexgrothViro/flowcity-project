# Telessaúde, SOAP e regulação demonstrativa

O fluxo atual é um protótipo local com dados sintéticos. Não está conectado a WebRTC, TelessaúdeRS, SISREG, CFM, ICP-Brasil, CNES ou cadastro profissional municipal. Não deve receber dados de pacientes reais.

## Registro SOAP

POST /api/v0/telehealth/appointments/:id/soap salva S (subjetivo), O (objetivo), A (avaliação) e P (plano) na consulta demonstrativa. CID-10 e CIAP-2 recebem validação de formato, sem validar existência ou adequação clínica do código. O registro inclui modo de demonstração e metadados mínimos na trilha de auditoria.

Em NODE_ENV=production, o endpoint responde 503 por padrão. Em produção, os endpoints SOAP e de encaminhamento ficam sempre desativados até que a autenticação, a autorização por perfil e o processo de segurança clínica sejam implementados.

## Encaminhamento e score auxiliar

POST /api/v0/telehealth/referral registra a prioridade declarada pelo profissional e campos documentais. O score de 0 a 100 é uma métrica administrativa demonstrativa derivada da prioridade declarada e completude documental. Não representa risco, urgência ou recomendação clínica, não ordena pacientes e requer revisão humana.

Para Cardiologia, o protótipo sinaliza para revisão a ausência de pressão arterial documentada ou de ECG/creatinina disponível, sem bloquear o envio. Os campos servem como lembrete de informação. Critérios oficiais precisam ser escolhidos, versionados e aprovados pela regulação municipal antes de uso. O Ministério da Saúde alerta que protocolos de referência devem ser adaptados ao território e não usados automaticamente ou fora de contexto.

## Verificador de documentos

POST /api/v0/telehealth/documents/verify recebe document, signature, public_key_hex e sha256. O resultado informa somente se o hash e a assinatura Ed25519 correspondem ao conteúdo apresentado. issuerVerified permanece false: uma chave incluída pelo próprio remetente não prova quem emitiu o documento.

O protótipo não emite receitas ou atestados e não valida CRM, certificado ICP-Brasil, revogação, prescrição ou validade legal. Não use esse resultado para dispensar medicamentos, aceitar atestados ou autenticar um profissional.

## Referências oficiais

- [Manual do e-SUS APS — SOAP e avaliação CID-10/CIAP-2](https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/PEC_06_atendimentos/)
- [Ministério da Saúde — Protocolos de Acesso e adaptação territorial](https://www.gov.br/saude/pt-br/composicao/saes/drac/protocolos)
- [Resolução CFM nº 2.314/2022](https://www.sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2022/2314_2022.pdf)
- [Portal de Prescrição Eletrônica do CFM](https://prescricaoeletronica.cfm.org.br/)
