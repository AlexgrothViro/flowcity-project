# FlowCity Saúde — Conformidade LGPD: ROPA e RIPD

Este documento estabelece a conformidade jurídica e técnica da plataforma **FlowCity Saúde** com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)**, detalhando o **ROPA (Registro das Operações de Tratamento)** e o **RIPD (Relatório de Impacto à Proteção de Dados)**.

---

## 1. Princípio Fundamental: *Privacy by Design* e Agregação

O FlowCity Saúde foi concebido sob a premissa de que a transparência municipal de filas e ocupação **NÃO necessita de Dados Pessoais Identificáveis (PII)** dos cidadãos.

* **Artigo 12 da LGPD:** Os dados anonimizados não são considerados dados pessoais para os fins da lei, salvo se o processo de anonimização puder ser revertido.
* Os indicadores de **Proof-of-Wait (PoW)** e **Proof-of-Occupancy (PoO)** são agregados estocásticos (contagens inteiras e médias móveis em minutos), sem qualquer vínculo a CPF, Cartão Nacional de Saúde (CNS), nome civil, endereço ou imagem de câmeras.

---

## 2. Registro das Operações de Tratamento (ROPA - Art. 37 LGPD)

| Campo | Especificação |
| :--- | :--- |
| **Controlador** | Secretaria Municipal de Saúde de Novo Hamburgo (SMS / FSNH) |
| **Operador Tecnológico** | Plataforma FlowCity Saúde |
| **Finalidade** | Monitoramento de tempo de espera, balanceamento de carga entre unidades e transparência ativa |
| **Base Legal** | Art. 7º, II (Execução de políticas públicas) e Art. 11, II, "f" (Tutela da saúde, exclusivamente em procedimento realizado por profissionais de saúde) |
| **Categorias de Titulares** | Pacientes que procuram a rede de urgência e atenção primária municipal |
| **Categorias de Dados Coletados** | **Públicos:** Apenas agregados (contagem de pacientes por cor Manchester e minutos de espera).<br>**Módulo Teleconsulta (Privado):** Telefone (WhatsApp), resumo de queixas de triagem, prescrição digital emitida pelo médico assistente. |
| **Compartilhamento** | Dados de telemedicina são restritos ao prontuário eletrônico do paciente e ao médico da consulta. Métricas de filas são publicadas em API aberta municipal. |
| **Medidas de Segurança** | Criptografia em trânsito (TLS 1.3), criptografia de repouso (AES-256), assinaturas Ed25519 nos dados públicos, autenticação multifator para operadores. |

---

## 3. Relatório de Impacto à Proteção de Dados (RIPD - Art. 38 LGPD)

### 3.1 Riscos Identificados e Medidas de Mitigação

#### Risco 1: Reidentificação em Horários de Baixa Demanda ($k$-Anonimato)
* **Cenário:** Às 03h30 da manhã, um totem na recepção exibe *"1 paciente Vermelho na fila"*. Um observador na recepção pode deduzir que a pessoa que acabou de entrar em uma maca é o referido paciente.
* **Mitigação:** Regra de $k$-anonimato mínimo ($k \ge 3$). Quando o número de pacientes em uma prioridade for menor que 3, o sistema não exibe o número absoluto de pessoas, apenas o tempo estimado de triagem ou agrupa na categoria imediatamente adjacente.

#### Risco 2: Vazamento de Dados na Teletriagem e Teleconsulta
* **Cenário:** O cidadão relata sintomas no bot de WhatsApp ou Web App que poderiam ser interceptados.
* **Mitigação:** 
  1. Uso de WebSockets e HTTPS seguros (TLS 1.3).
  2. Protocolo de minimização de dados: a teletriagem NÃO solicita CPF, endereço residencial ou histórico familiar completo para calcular o tempo de espera.
  3. No caso de agendamento de teleconsulta, os dados clínicos trafegam diretamente para a sessão criptografada do médico responsável (CFM 2.314/2022).

#### Risco 3: Adulteração de Indicadores de Espera
* **Cenário:** Um invasor altera os dados de tempo de espera para induzir pânico ou superlotação artificial.
* **Mitigação:** Cada payload publicado pelo FlowCity Saúde é assinado digitalmente com chave assimétrica **Ed25519** mantida pela infraestrutura municipal. Qualquer alteração nos bytes invalida a assinatura criptográfica publicamente verificável.
