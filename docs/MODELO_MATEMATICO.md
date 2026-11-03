# FlowCity Saúde — Modelo Matemático de Filas e Agora-Casting

Este documento formaliza a modelagem estocástica e os algoritmos de previsão que compõem o núcleo analítico do **FlowCity Saúde**.

---

## 1. Fila de Prioridades Não-Preemptiva ($M/M/c/K$)

O fluxo de pacientes em um pronto atendimento segue chegadas poissonianas com taxas de chegada $\lambda_p$ distintas para cada uma das classes de prioridade $p \in \{1, 2, 3, 4, 5\}$ correspondentes ao Protocolo de Manchester:

* $p=1$: Vermelho (Emergência absoluta)
* $p=2$: Laranja (Muito urgente)
* $p=3$: Amarelo (Urgente)
* $p=4$: Verde (Pouco urgente)
* $p=5$: Azul (Não urgente)

### 1.1 Taxas de Serviço e Intensidade de Tráfego

Seja $c$ o número de consultórios médicos em atendimento ativo e $\mu$ a taxa de atendimento por consultório. A intensidade de tráfego parcial para as primeiras $p$ classes é definida por:

$$\sigma_p = \sum_{i=1}^p \rho_i = \sum_{i=1}^p \frac{\lambda_i}{c \mu}$$

Para que o sistema seja estável em regime estacionário, é necessário que $\sigma_5 < 1$. Em períodos de pico transitório ($\sigma_5 \ge 1$), o modelo comuta para a solução transiente com horizonte finito $K$.

### 1.2 Tempo Médio de Espera por Prioridade ($W_q^{(p)}$)

No regime de prioridade não-preemptiva (onde um médico não interrompe a consulta de um paciente em andamento, exceto na chegada de um caso Vermelho), o tempo médio de espera na fila para um paciente da prioridade $p$ é dado por:

$$W_q^{(1)} \approx 0 \quad (\text{encaminhamento direto à sala de estabilização})$$

$$W_q^{(p)} = \frac{W_0}{(1 - \sigma_{p-1})(1 - \sigma_p)}, \quad \forall p \in \{2, 3, 4, 5\}$$

onde $W_0$ é o atraso médio residual:

$$W_0 = \sum_{i=1}^5 \frac{\lambda_i E[S_i^2]}{2 c} = \sum_{i=1}^5 \frac{\rho_i}{\mu_i}$$

---

## 2. Filtro de Kalman Unidimensional e Suavização

Para eliminar o ruído estocástico decorrente de carimbos de data/hora irregulares nos sistemas de prontuário eletrônico (HIS e e-SUS PEC), aplicamos um Filtro de Kalman 1D contínuo:

1. **Predição do Estado:**
   $$x_{k|k-1} = x_{k-1}$$
   $$P_{k|k-1} = P_{k-1} + Q$$
   onde $Q$ é a variância do ruído do processo de chegada hospitalar.

2. **Ganho de Kalman:**
   $$K_k = \frac{P_{k|k-1}}{P_{k|k-1} + R}$$
   onde $R$ é a variância do ruído de medição do sistema.

3. **Atualização da Estimativa:**
   $$x_k = x_{k|k-1} + K_k (z_k - x_{k|k-1})$$
   $$P_k = (1 - K_k) P_{k|k-1}$$

---

## 3. Agora-Casting (15, 30 e 60 minutos) com Sazonalidade Intraday

O modelo combina o estado suavizado $x_k$ com a derivada da curva sazonal empírica de UPAs brasileiras:

$$S(h), \quad h \in [0, 23]$$

A projeção de variação para um horizonte futuro $\Delta t \in \{15, 30, 60\}$ minutos é dada por:

$$\Delta PoW = \alpha \cdot \frac{S(h + \Delta t) - S(h)}{S(h)}$$

$$\Delta PoO = \beta \cdot \frac{S(h + \Delta t) - S(h)}{S(h)}$$

onde $\alpha = 0.65$ e $\beta = 0.40$ são os fatores de amortecimento calibrados empiricamente.
