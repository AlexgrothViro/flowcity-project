# Diretrizes de Contribuição — FlowCity Saúde

Agradecemos o interesse em contribuir com o **FlowCity Saúde**, um projeto dedicado a melhorar a eficiência, a transparência e o acesso no Sistema Único de Saúde (SUS).

---

## 1. Princípios Não-Negociáveis do Projeto

1. **LGPD & Privacidade:**
   * NUNCA adicione coleta, log ou armazenamento de Dados Pessoais Identificáveis (PII) nos módulos públicos de PoW e PoO.
   * Não registre nomes, CPFs, números de prontuário ou endereços IP completos em logs de aplicação.
2. **Integridade Matemática e Clínica:**
   * Qualquer alteração no motor de filas ($M/M/c/K$), Filtro de Kalman ou curvas de sazonalidade deve vir acompanhada de testes unitários que comprovem a não-regressão.
   * Os protocolos de teletriagem devem sempre manter a salvaguarda de *Red Flags* (encaminhamento imediato para atendimento presencial e SAMU 192 diante de risco iminente de morte).
3. **Conformidade CFM:**
   * O módulo de telemedicina deve respeitar a Resolução CFM nº 2.314/2022, exigindo registro de consentimento e suporte à assinatura digital ICP-Brasil.

---

## 2. Fluxo de Desenvolvimento

### 2.1 Configuração do Ambiente
```bash
# Instalar dependências de todos os workspaces
npm install

# Rodar a suíte de testes
npm test

# Executar em modo de desenvolvimento (Backend + Frontend)
npm run dev
```

### 2.2 Estrutura de Branches e Commits
* Utilize a convenção de **Conventional Commits**:
  * `feat: ...` para novas funcionalidades.
  * `fix: ...` para correção de bugs.
  * `docs: ...` para documentação.
  * `test: ...` para testes unitários ou de integração.

---

## 3. Checklist para Pull Requests
- [ ] O código passa no `npm test` com 100% de sucesso.
- [ ] O código compila sem erros no TypeScript (`npm run build`).
- [ ] Não há introdução de dependências pesadas ou vulnerabilidades (`npm audit`).
- [ ] Novas rotas da API estão documentadas no `docs/openapi.yaml`.
