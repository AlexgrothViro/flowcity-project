# FlowCity Saúde — Dossiê Executivo & Proposta para Gestores Públicos

**Plataforma de Inteligência de Fluxo, Balanceamento de Demanda e Telessaúde Integrada ao SUS**

---

## 1. Sumário Executivo

A superlotação das portas de urgência e emergência (UPAs e Prontos-Socorros Hospitalares) é um dos problemas mais complexos da gestão pública de saúde no Brasil. O cidadão, diante da incerteza sobre o funcionamento e o tempo de espera nas Unidades Básicas de Saúde (UBS), dirige-se automaticamente à UPA mais visível — mesmo para queixas clínicas de baixa gravidade (classificadas como Verde ou Azul pelo Protocolo de Manchester).

Esse comportamento gera três consequências crônicas:
1. **Sobrecarga desnecessária das portas de urgência**, elevando o tempo de espera para até 4 a 6 horas para casos de menor gravidade.
2. **Retenção de macas do SAMU nas UPAs**, imobilizando ambulâncias que deveriam estar disponíveis para atendimentos de resgate de alta gravidade na cidade.
3. **Elevado estresse e violência contra profissionais de saúde** na recepção, gerados pela falta de transparência e pela incompreensão do critério de risco clínico.

O **FlowCity Saúde** resolve este gargalo ao criar uma camada inteligente de visibilidade em tempo real sobre a rede de saúde:
* **PoW (Proof-of-Wait):** Publica tempos de espera medianos auditados por cor de prioridade de triagem.
* **PoO (Proof-of-Occupancy):** Monitora a ocupação de consultórios, leitos de observação e exames diagnósticos.
* **Smart Routing Municipal:** Indica ao cidadão e às equipes de socorro a melhor unidade da rede, calculando tempo de viagem somado ao tempo de fila.
* **Teletriagem com Teleinterconsulta:** Absorve casos leves e moderados por atendimento remoto na Atenção Primária, com possibilidade de conexão direta com especialistas médicos focais (Cardiologia, Dermatologia, Ortopedia, Neurologia, Pediatria).

---

## 2. Diagnóstico da Dor Pública & Impacto Econômico

### 2.1 Custo Comparativo de Atendimento no SUS
Segundo estimativas do Conselho Federal de Medicina (CFM) e do Conass:
* Um atendimento de baixa complexidade em **porta de UPA/Hospital Geral** custa em média de **R$ 180 a R$ 350 por episódio** (custos de estrutura pesada, insumos hospitalares, plantonistas de emergência).
* O mesmo acolhimento realizado na **Atenção Básica (UBS/USF)** custa entre **R$ 45 e R$ 75**.
* O atendimento realizado via **Teleconsulta da APS / Teletriagem** custa entre **R$ 25 e R$ 40**.

**Impacto em Novo Hamburgo (RS):**
Em uma rede com média de 8.000 atendimentos mensais na UPA Canudos, onde ~60% dos pacientes são classificados como Verde ou Azul:
* Redirecionar apenas 25% desses casos pouco urgentes (1.200 atendimentos/mês) para teleconsultas ou UBSs economiza entre **R$ 160.000 e R$ 370.000 mensais** em custos operacionais e desperdício de insumos na porta de emergência.

### 2.2 Giro de Ambulâncias e Retenção do SAMU
A retenção média de uma ambulância em porta de UPA varia de 40 a 90 minutos aguardando liberação de maca ou leito. O FlowCity Saúde fornece aos reguladores do SAMU a telemetria preditiva (+15 a +60 min) da ocupação de leitos de observação, permitindo o direcionamento prévio da ambulância para a unidade com menor sobrecarga e reduzindo o tempo de retenção em até **25%**.

---

## 3. Conformidade Regulatória & LGPD by Design

O FlowCity Saúde atende rigorosamente a todo o arcabouço normativo nacional:

1. **LGPD (Lei nº 13.709/2018):**
   * Os dados públicos de fila e ocupação são **100% anonimizados e agregados** (Art. 12 da LGPD). Não há divulgação de PII, prontuários, nomes ou localizações individuais.
   * Regra de $k$-anonimato mínimo ($k \ge 3$) em períodos de baixa demanda.
   * Registro formal de ROPA (Art. 37) e RIPD (Art. 38) sob as bases legais de execução de políticas públicas (Art. 7º, II) e tutela da saúde (Art. 11, II, "f").
2. **Telemedicina e Telessaúde (Resolução CFM nº 2.314/2022 & Lei nº 14.510/2023):**
   * Registro eletrônico em prontuário seguro, consentimento prévio do paciente, garantia de privacidade e assinatura digital no padrão ICP-Brasil.
3. **Protocolo de Manchester e Ministério da Saúde:**
   * Alinhamento estrito às cores oficiais de risco e diretrizes da Política Nacional de Humanização (PNH / Acolhimento com Classificação de Risco).

---

## 4. Modalidades Legais de Contratação Pública

Prefeituras e consórcios municipais podem contratar o FlowCity Saúde por vias ágeis e respaldadas pela legislação brasileira:

### 4.1 Contrato Público de Solução Inovadora (CPSI — Marco Legal das Startups, LC nº 182/2021)
* **Vantagens:** Dispensa licitação tradicional prévia para teste de soluções inovadoras.
* **Prazo:** Vigência de até 12 meses (prorrogável por mais 12).
* **Limite Financeiro:** Até R$ 1,6 milhão por modalidade.
* **Aplicação ideal:** O projeto-piloto de 90 dias em Novo Hamburgo enquadra-se perfeitamente no CPSI para validação de hipóteses e aferição de KPIs.

### 4.2 Dispensa ou Inexigibilidade de Licitação (Nova Lei de Licitações nº 14.133/2021)
* **Art. 75, IV, "c":** Dispensa para contratação de produtos para pesquisa e desenvolvimento (P&D).
* **Art. 74:** Inexigibilidade em virtude de singularidade do motor estocástico de Nowcasting integrado a Ed25519 e teleinterconsulta regulada.

---

## 5. Modelo de Sustentação & Precificação Indicativa

A precificação para redes municipais é estruturada em modelo SaaS com base no porte da cidade e número de unidades conectadas:

| Porte do Município | Unidades Cobertas | Setup & Integração (Único) | Assinatura Mensal (SaaS) |
| :--- | :---: | :---: | :---: |
| **Pequeno (até 80k hab.)** | 1 PA + 4 UBSs | R$ 25.000 | R$ 7.500 / mês |
| **Médio (80k a 300k hab. - ex.: Novo Hamburgo)** | 1 Hospital + 2 UPAs + 8 UBSs | R$ 45.000 | R$ 16.000 / mês |
| **Grande (> 300k hab.) / Consórcios Regionais** | Rede hospitalar ampliada | R$ 80.000 | R$ 32.000 / mês |

*Inclui: Coletores em tempo real, motor de filas M/M/c/K, agora-casting, PWA do cidadão, dashboards de regulação, totens de recepção, módulo de teleconsulta/teleinterconsulta, suporte técnico 24/7 e relatórios analíticos de gestão.*
