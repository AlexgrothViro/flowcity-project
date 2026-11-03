# FlowCity Saúde — Manual de Operação e Implantação de Campo

Este manual estabelece os Procedimentos Operacionais Padrão (POP) e os requisitos técnicos para a implantação e operação do **FlowCity Saúde** nas unidades da rede municipal de saúde.

---

## 1. Princípio de Trabalho Zero (Sem Retrabalho para a Enfermagem)

Um dos maiores erros em tecnologia em saúde pública é exigir que enfermeiros e recepcionistas preencham um sistema adicional.
O FlowCity Saúde adota o princípio de **"Trabalho Humano Adicional Zero"**:
* A enfermagem e a recepção continuam utilizando **exatamente os mesmos sistemas de rotina** (HIS hospitalar, e-SUS PEC, software de acolhimento).
* O micro-coletor (`Adapter Daemon`) do FlowCity Saúde é configurado para ler automaticamente os carimbos de data/hora emitidos pelos sistemas existentes (momento do check-in, carimbo da classificação de risco, momento em que o médico abre a ficha do paciente e momento da alta/saída).
* Nenhum profissional precisa digitar dados de fila manualmente no FlowCity Saúde.

---

## 2. Procedimentos Operacionais por Função

### 2.1 Equipe de Recepção e Triagem (Enfermagem)
1. **Acolhimento Presencial:** Recebe o paciente e realiza a classificação de risco habitual pelo Protocolo de Manchester.
2. **Totem de Sala de Espera:**
   * O totem na sala de espera atualiza-se a cada 10 a 15 segundos automaticamente.
   * Em caso de dúvidas ou reclamações de pacientes verdes/azuis sobre a demora, a recepção pode orientar: *"O nosso painel é atualizado pelo sistema central; os casos com risco de morte (amarelo, laranja e vermelho) têm prioridade clínica absoluta. O senhor também pode consultar o app ou fazer a teleconsulta no celular se preferir não aguardar na sala física."*

### 2.2 Médico da Atenção Primária / Telessaúde (MFC)
1. **Entrada na Sala de Teleconsulta:**
   * Acessa a lista de pacientes acolhidos pela teletriagem digital no painel do FlowCity Saúde.
   * Clica em **"Iniciar Consulta"** para abrir a sala segura WebRTC.
2. **Conduta Clínica:**
   * Se o quadro for resolúvel na APS (80% dos casos de tosse, cefaleia tensional, disúria leve, lombalgia): prescreve medicamento digitalmente com assinatura ICP-Brasil e orienta o paciente.
   * Se identificar dúvida diagnóstica ou necessidade de conduta especializada: clica no botão **"Solicitar Teleinterconsulta com Especialista"**.
   * Preenche a especialidade desejada (ex.: Cardiologia), a justificativa clínica em 2 ou 3 frases e seleciona:
     * *Interconsulta Imediata (Vídeo):* se o especialista de plantão puder entrar na chamada síncrona.
     * *Regulação SISREG Prioritária:* se o paciente necessitar de consulta presencial especializada fundamentada.

### 2.3 Médico Especialista Focal (Matriciamento)
1. O especialista de sobreaviso ou plantão acessa a aba **"Fila de Teleinterconsulta"** no Painel de Regulação.
2. Analisa a justificativa clínica e exames anexados pelo médico da APS.
3. Emite o parecer técnico em até 15 minutos ou ingressa na chamada de vídeo compartilhada para orientar a conduta conjunta.
4. Caso confirme necessidade de consulta ambulatorial presencial, autoriza o agendamento no SISREG com prioridade clínica comprovada, eliminando o absenteísmo e a fila cega.

### 2.4 Central de Regulação de Urgências & SAMU 192
1. O médico regulador do SAMU monitora o mapa de calor e os tempos de espera do painel do FlowCity Saúde.
2. Ao receber chamado da ambulância em campo:
   * Verifica a previsão de ocupação (+15 a +30 min) dos leitos de observação e consultórios da UPA Canudos versus Hospital Municipal.
   * Orienta a equipe socorrista para a unidade com menor sobrecarga operacional, evitando a retenção de macas.

---

## 3. Checklist Técnico de Infraestrutura de TI

### 3.1 Conexão com o e-SUS APS / PEC (Nas UBSs)
* **Requisito:** Acesso de somente-leitura (Read-Only) à réplica do banco de dados PostgreSQL do e-SUS PEC da Secretaria de Saúde.
* **Tabelas acessadas:** `tb_atend_prof`, `tb_fat_atendimento`, `tb_dim_tempo`.
* **Privilégios:** Usuário `flowcity_reader` com permissão estrita de `SELECT` apenas nas colunas de data/hora e tipo de serviço (nenhuma permissão de `UPDATE`, `DELETE` ou `INSERT`).

### 3.2 Conexão com HIS Hospitalar / UPA (MV, Tasy ou AGHUse)
* **Opção A (HL7 MLLP):** Recebimento de mensagens padrão `ADT^A01`, `ADT^A08` e `ADT^A03` na porta TCP 2575 da intranet hospitalar.
* **Opção B (View de Banco de Dados):** Consulta periódica a cada 10 segundos em View desnormalizada anonimizada contendo contagem de atendimentos ativos por cor Manchester.

### 3.3 Totens de Sala de Espera (Hardware & Rede)
* **Equipamento:** Smart TV comercial (43" a 55") com navegador integrado ou Mini-PC (Raspberry Pi 4 / Intel N100) conectado via HDMI.
* **Modo de Operação:** Kiosk mode (tela cheia automática sem barras de navegação).
* **Endereço do Totem:** `http://<ip-servidor>:3001/` na aba **Totem Recepção**, com a unidade pré-fixada (ex.: UPA Canudos).
* **Conectividade:** Cabo de rede Ethernet CAT6 ou Wi-Fi 5 GHz dedicado para garantir latência inferior a 100 ms.
