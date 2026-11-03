# Pré-mortem e registro de decisões

Proposta de trabalho, 03/11/2026. Imagine que o projeto foi lançado e fracassou: quais causas teriam sido evitáveis? Esta revisão é de planejamento, sem auditoria independente.

## Riscos reais — Tigers

| ID | Risco | Urgência | Mitigação concreta | Responsável proposto | Prazo relativo |
| --- | --- | --- | --- | --- | --- |
| R1 | Não há acesso ou dados não representam o processo | Bloqueia piloto real | Acordo da fonte, amostra e reconciliação antes da previsão | TI + dono do dado | G1/G2 |
| R2 | Vazamento por acesso amplo, séries ou totais | Bloqueia exposição | Autorização integral e revisão conjunta das saídas; teste de reconstrução | Segurança + encarregado | G1 |
| R3 | Dados sintéticos se misturam aos institucionais | Bloqueia uso | Ambientes e modos explícitos; gerador proibido no modo institucional | Engenharia | G1 |
| R4 | Usuário interpreta previsão como garantia | Bloqueia publicação | Tarefa de entendimento, rótulos de incerteza e política de indisponibilidade | Produto + gestor | Antes de G3/G4 |
| R5 | Alertas não têm responsável ou ação possível | Bloqueia validação de valor | Escolher uma decisão, responsável e retorno ao processo habitual | Patrocinador | G0 |
| R6 | Previsão piora picos ou grupos pequenos | Bloqueia uso do modelo | Avaliar fora da amostra; retirar modelo sem desempenho; manter observados | Dados + avaliador | G3 |
| R7 | Falha de banco ou integração fica silenciosa | Bloqueia operação | Readiness, reconciliação, restauração e política explícita de falha | Engenharia/operador | G2 |
| R8 | Equipe não consegue sustentar suporte | Antes de ampliar | Medir carga e orçamento; SLA compatível e plano de saída | Proponente | G4 |
| R9 | Crescimento prematuro de módulos clínicos | Bloqueia esses módulos | Novo escopo, responsáveis e análise regulatória por finalidade | Produto + responsável clínico | Antes de mudança de finalidade |

“Bloqueia” significa que a fase não deve receber dados ou usuários institucionais nas condições descritas. O desenvolvimento com dados sintéticos pode prosseguir nos itens independentes.

## Preocupações possivelmente superdimensionadas — Paper Tigers

- **Precisar de microsserviços desde o primeiro piloto:** não há medição que justifique esse custo hoje. Reavaliar quando isolamento, carga ou equipe exigirem.
- **Precisar de modelo complexo para começar:** dados observados e uma referência simples permitem avaliar valor. Complexidade precisa provar ganho.
- **Precisar de integração RNDS para observar um fluxo interno:** a pergunta inicial pode usar fonte local autorizada. Revisitar se o escopo passar a produzir modelo nacional aplicável.

Essas avaliações valem para o recorte proposto e podem mudar com exigência institucional.

## Questões pouco discutidas — Elephants

- Quem tem autoridade para mudar o processo quando o painel mostra gargalo?
- O fornecedor da origem permite acesso com preço e prazo sustentáveis?
- Um indicador pode virar instrumento punitivo contra equipe ou unidade?
- Se os tempos publicados mudarem o comportamento de procura, a rede consegue responder?
- Qual vantagem permanecerá se o sistema atual oferecer painel equivalente?
- Quem mantém o projeto quando o proponente não estiver disponível?

Investigar nas entrevistas e registrar evidências até G0/G1. Benefício incerto deve permanecer hipótese, não ir para material comercial como resultado.

## Registro inicial de decisões

| ID | Proposta | Estado | Evidência para confirmar/rever |
| --- | --- | --- | --- |
| D01 | Primeiro produto: observação interna em uma unidade | Proposta | Entrevistas e problema recorrente em G0 |
| D02 | Manter monólito enquanto suficiente | Proposta | Volume, isolamento e custo de manutenção |
| D03 | Não publicar previsão antes de avaliação temporal | Proposta | Relatório G3 e entendimento do usuário |
| D04 | Separar dados públicos e eventos privados | Proposta | Política de dados e avaliação de reconstrução |
| D05 | Telessaúde como linha futura com parceiro | Proposta | Necessidade, serviço e governança próprios |

Nenhuma proposta acima foi aprovada em nome de instituição. Depois de cada marco, registrar data, decisor, evidência, alternativas consideradas e motivo. Revisitar o pré-mortem duas semanas antes de uso institucional.
