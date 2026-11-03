# FlowCity Saúde — Plataforma Municipal de Inteligência de Fluxo Hospitalar & Regulação em Tempo Real

[![Status](https://img.shields.io/badge/Status-Piloto%20Operacional-success)](https://github.com/AlexgrothViro/flowcity-project)
[![Cidade Piloto](https://img.shields.io/badge/Piloto-Novo%20Hamburgo%20%2F%20RS-blue)](https://github.com/AlexgrothViro/flowcity-project)
[![LGPD](https://img.shields.io/badge/LGPD-Privacy%20by%20Design-emerald)](docs/LGPD_ROPA_RIPD.md)
[![CFM](https://img.shields.io/badge/Telemedicina-CFM%202.314%2F2022-indigo)](docs/TELEMEDICINA_CFM.md)
[![License](https://img.shields.io/badge/License-MIT-slate)](LICENSE)

O **FlowCity Saúde** é uma plataforma pública municipal que monitora e publica, em tempo real:
1. **PoW (Proof-of-Wait):** Tempo mediano de espera por prioridade clínica de triagem (Protocolo de Manchester: Vermelho, Laranja, Amarelo, Verde, Azul).
2. **PoO (Proof-of-Occupancy):** Ocupação de leitos de observação, consultórios ativos e disponibilidade diagnóstica (Raio-X e Laboratório).
3. **Agora-Casting Estocástico (15–60 min):** Previsão probabilística da curva de espera e ocupação usando filas $M/M/c/K$, Filtro de Kalman 1D e curvas sazonais epidemiológicas.
4. **Smart Routing Municipal:** Sugere a melhor unidade (Hospital, UPA ou UBS) balanceando distância geográfica, gravidade e tempo total porta-médico.
5. **Teletriagem & Teleinterconsulta Especializada:** Protocolo digital que acolhe casos leves/moderados por teleconsulta da Atenção Primária e permite acionamento imediato de médicos especialistas (Cardiologia, Dermatologia, Ortopedia, etc.) via teleinterconsulta ou regulação prioritária no SISREG.

Tudo operando com **dados agregados sem PII**, assegurado por **LGPD by Design** e assinado digitalmente com criptografia assimétrica **Ed25519**.

---

## 🏛️ Cenário Piloto: Novo Hamburgo (RS)

O projeto está modelado com as unidades âncora da rede pública municipal de **Novo Hamburgo - RS** gerida pela **FSNH (Fundação de Saúde Pública de Novo Hamburgo)**:

| Unidade | Tipo | Função na Rede |
| :--- | :---: | :--- |
| **Hospital Municipal de Novo Hamburgo (HMNH)** | Hospital | Referência regional, emergência hospitalar, cirurgia e UTI. |
| **UPA 24h Canudos** | UPA | Pronto atendimento de alto volume clínico e pediátrico (bairro Canudos). |
| **USF Santo Afonso** | UBS / ESF | Atenção Primária, acolhimento com classificação de risco, polo de telemedicina. |
| **USF Canudos / UBS Centro** | UBS / ESF | Atenção Primária, crônicos e polo de teleinterconsulta especializada. |

---

## 🖥️ Módulos e Interfaces Integradas

A plataforma inclui interfaces completas e responsivas para todos os públicos:

* **Portal do Cidadão (PWA):** Consulta de filas por cor, rotas inteligentes, estimativa de economia de tempo e wizard de teletriagem do SUS.
* **Painel de Regulação / SAMU / SMS:** Telemetria centralizada da rede, monitoramento do giro de ambulâncias (retenção de macas), alertas preditivos de saturação e fila de teleinterconsultas.
* **Totem de Recepção (Kiosk Mode):** Modo display de alto contraste e acessibilidade para televisores e totens em salas de espera de hospitais e UPAs, com aviso educativo sobre o Protocolo de Manchester.
* **Sala de Teleconsulta & Teleinterconsulta (CFM 2.314/2022):** Ambiente de videoconferência médica com emissor de receituário digital ICP-Brasil e matriciamento direto com especialistas.
* **Simulador de Bot de WhatsApp:** Demonstração do atendimento conversacional de baixo atrito ao cidadão.
* **API Aberta Municipal (v0):** Especificação pública com assinatura criptográfica Ed25519 verificável para transparência e auditoria externa.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js 20+**
* **npm 10+**

### 1. Clonar o repositório
```bash
git clone https://github.com/AlexgrothViro/flowcity-project.git
cd flowcity-project
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Executar os Testes Automatizados
```bash
npm test
```
*Executa a suíte de testes unitários do motor matemático de filas M/M/c/K, Filtro de Kalman, rotas Haversine, assinaturas Ed25519 e árvore de teletriagem.*

### 4. Compilar e Iniciar o Sistema Completo
```bash
# Compilar backend e frontend
npm run build

# Iniciar servidor integrado
npm start
```

Acesse no seu navegador: **`http://localhost:3001`**

Para desenvolvimento com hot-reload:
```bash
npm run dev
```

---

## 🐳 Executando com Docker & Docker Compose

```bash
docker compose up --build
```
Inicia a aplicação completa, o cache em memória Redis e o banco TimescaleDB/PostgreSQL.

---

## 📡 Exemplo de Payload da API Municipal (v0 Specification)

`GET /api/v0/units/upa_canudos`

```json
{
  "unidade_id": "upa_canudos",
  "timestamp": "2026-11-03T10:00:00-03:00",
  "pow": {
    "prioridades": {
      "vermelho": { "fila": 0, "wait_med_min": 0, "conf": 0.98 },
      "laranja":  { "fila": 2, "wait_med_min": 6, "conf": 0.89 },
      "amarelo":  { "fila": 12, "wait_med_min": 24, "conf": 0.86 },
      "verde":    { "fila": 20, "wait_med_min": 58, "conf": 0.83 },
      "azul":     { "fila": 8, "wait_med_min": 85, "conf": 0.80 }
    },
    "tempo_medio_porta_triagem_min": 9,
    "total_em_fila": 42
  },
  "poo": {
    "salas_abertas": 6,
    "salas_totais": 8,
    "ocupacao_salas": 0.75,
    "leitos_observacao": { "ocupados": 14, "capacidade": 18 },
    "diagnostico": {
      "raio_x": { "operacional": true, "fila_exames": 4, "tempo_medio_min": 25 },
      "laboratorio": { "operacional": true, "fila_exames": 6, "tempo_medio_min": 40 }
    }
  },
  "previsao_15min": { "pow_delta": 0.0, "poo_delta": 0.0, "tendencia": "ESTAVEL", "confianca_previsao": 0.92 },
  "previsao_30min": { "pow_delta": -0.10, "poo_delta": -0.05, "tendencia": "DESCENDO", "confianca_previsao": 0.86 },
  "previsao_60min": { "pow_delta": -0.15, "poo_delta": -0.08, "tendencia": "DESCENDO", "confianca_previsao": 0.78 },
  "idade_do_dado_s": 14,
  "fontes": [
    { "tipo": "HIS/ADT", "peso": 0.65, "ultima_leitura": "2026-11-03T10:00:00Z" },
    { "tipo": "sensor_porta", "peso": 0.20, "ultima_leitura": "2026-11-03T10:00:00Z" },
    { "tipo": "triagem_totem", "peso": 0.15, "ultima_leitura": "2026-11-03T10:00:00Z" }
  ],
  "assinatura": "ed25519:0717434c10c2f28f076ccef7b4b9c242e6abc9e1a0dd..."
}
```

---

## 📚 Documentação Técnica, Jurídica e Operacional

* [Dossiê Executivo & Proposta para Gestores Públicos](docs/DOSSIE_EXECUTIVO_GOV.md) *(Diagnóstico, economia de recursos e contratação via Marco Legal das Startups)*
* [Manual de Operação e Implantação de Campo](docs/MANUAL_OPERACIONAL_IMPLANTACAO.md) *(POPs para Enfermagem, Médicos da APS, Especialistas e SAMU)*
* [Plano de Comunicação Social e Conscientização da População](docs/PLANO_COMUNICACAO_SOCIAL.md) *(Pedagogia de cores Manchester e campanhas de adesão)*
* [Conformidade LGPD — ROPA e RIPD](docs/LGPD_ROPA_RIPD.md) *(Privacy by Design, k-anonimato e bases legais)*
* [Regulamentação de Telemedicina — CFM nº 2.314/2022](docs/TELEMEDICINA_CFM.md) *(Diretrizes de teleconsulta e teleinterconsulta)*
* [Plano do Piloto em Novo Hamburgo (RS)](docs/PILOTO_NOVO_HAMBURGO.md) *(Escopo de 90 dias com HMNH, UPA Canudos e USFs)*
* [Arquitetura Técnica & Topologia](docs/ARQUITETURA_TECNICA.md) *(Diagramas C4 e padrões de interoperabilidade)*
* [Modelo Matemático de Filas e Kalman Filter](docs/MODELO_MATEMATICO.md) *(Dedução de M/M/c/K e equações de estado)*
* [Especificação OpenAPI 3.0 (Swagger)](docs/openapi.yaml) *(Especificação formal de endpoints e esquemas de dados)*
* [Diretrizes de Contribuição](CONTRIBUTING.md) *(Padrões de código e fluxo de desenvolvimento)*

---

## ⚖️ Licença

Distribuído sob licença MIT. Consulte `LICENSE` para mais detalhes.
