# FlowCity Saúde — Especificação Técnica da Arquitetura

Este documento descreve a topologia, os fluxos de integração e a infraestrutura tecnológica que suportam o **FlowCity Saúde**.

---

## 1. Topologia de Implantação

```
[ Hospital Municipal HMNH ]        [ UPA 24h Canudos ]        [ UBS Santo Afonso / Canudos ]
    (HIS / ADT / Oracle)              (HIS / Tasy / MV)              (e-SUS PEC / Postgres)
             │                               │                               │
             ▼                               ▼                               ▼
       [Edge Adapter]                  [Edge Adapter]                  [Edge Adapter]
             │                               │                               │
             └───────────────────────┬───────┴───────────────────────────────┘
                                     │  (HTTPS TLS 1.3 / mTLS / JSON Events)
                                     ▼
                      ┌──────────────────────────────┐
                      │    FlowCity API Gateway      │
                      │  - Autenticação e ROPA Audit │
                      │  - WebSocket / SSE Server    │
                      └──────────────┬───────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │  State & Queuing Engine │             │   Telehealth Service    │
    │  - Fila M/M/c/K         │             │  - Salas WebRTC (LiveKit)│
    │  - Kalman Filter 1D     │             │  - Prescrição Digital   │
    │  - Nowcasting 15-60 min │             │  - Teleinterconsulta    │
    │  - Assinador Ed25519    │             │  - Matriciamento SISREG │
    └────────────┬────────────┘             └────────────┬────────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                            ┌─────────────────┐
                            │  PostgreSQL /   │
                            │  TimescaleDB    │
                            │  & Redis Cache  │
                            └─────────────────┘
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
[ PWA Cidadão ]             [ Dashboard Regulação ]       [ Totens de Recepção ]
(Rotas & Espera)             (SAMU / SMS / Leitos)         (Kiosk Alto Contraste)
```

---

## 2. Padrões de Interoperabilidade e Protocolos

* **HL7 FHIR R4:** Mapeamento de recursos `Encounter`, `Observation` e `CarePlan` para integração futura com a **RNDS (Rede Nacional de Dados em Saúde)**.
* **HL7 v2 (MLLP):** Suporte a mensagens hospitalares `ADT^A01` (Admissão), `ADT^A08` (Atualização de Triagem Manchester) e `ADT^A03` (Alta).
* **Ed25519 Cryptographic Signatures:** Assinatura digital padrão Curve25519 gerada com `tweetnacl` para garantir autenticidade e não-repúdio das informações de tempo de espera.
