# Rapha Guru v68 — Hardening + SaaS/Automation Security Pass

## Entregue nesta versão

### Segurança / Auth
- troca de `bcrypt` para `bcryptjs` no auth/schema
- seed de admin refeito para **não apagar/recriar** o admin a cada boot
- bootstrap de admin controlado por `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `JWT_SECRET` passa a ser obrigatório em produção
- `/api/auth/reset-admin` agora exige sessão admin autenticada
- fluxo de `forgot-password` com link real (`APP_BASE_URL/reset-senha?token=...`)
- envio SMTP real quando configurado
- `_dev_token` só aparece se `EXPOSE_RESET_TOKEN=1` em ambiente não-produção
- auditoria básica para ações críticas (auth/admin/automation/payments)

### Planos / assinatura
- `requirePlan()` agora considera a assinatura ativa do usuário
- consistência automática de assinatura expirada → downgrade para free
- cancelamento alterado para **cancel_at_period_end**, sem derrubar acesso na hora

### Pagamentos
- webhook Pagar.me preparado para validação HMAC via `PAGARME_WEBHOOK_SECRET`
- payload bruto (`rawBody`) preservado para validação
- checkout grava melhor histórico/auditoria
- assinatura ativa automaticamente em cartão pago na hora

### Webhooks / segurança HTTP
- CORS endurecido via `ALLOWED_ORIGIN`
- endpoints de odds aceitam assinatura HMAC opcional (`ODDS_WEBHOOK_SECRET`)
- endpoint demo de odds agora é admin-only
- health endpoints adicionados: `/api/health` e `/api/health/ready`

### Automação
- `/api/automation` protegido por auth + plano `elite`
- contas de automação movidas do arquivo global para a tabela `automation_accounts`
- contas isoladas por usuário
- logs e filas filtrados por usuário
- screenshots filtradas por conta do usuário
- sessões Playwright isoladas por conta (`accountId_bookmaker.json`)
- status de automação indexado por conta, não mais por bookmaker global

### Frontend
- rota `/automacao` protegida por plano
- rota `/admin` protegida por admin
- rota `/minha-conta` protegida por login
- nova página `/reset-senha`
- Automation Center passou a enviar JWT no backend
- AuthContext agora calcula plano efetivo usando `subscription.plan_slug`
- analytics placeholder removido do `client/index.html` para build limpo

## Validação executada neste ambiente
- `vite build` + bundle do servidor: **OK**
- bundle frontend gerado em `dist/public`
- bundle backend gerado em `dist/index.js`

## Limitação encontrada no ambiente de validação
- a execução completa do servidor **não pôde ser finalizada aqui** porque o `better-sqlite3` exige binário nativo e a compilação do addon foi interrompida pelo ambiente local desta sessão.
- Em ambiente normal de deploy/dev com toolchain nativa liberada, o projeto deve instalar/compilar a dependência normalmente.

## Próximos blocos recomendados
- desacoplar `role` administrativo de `plan_slug` comercial de forma total
- migrar ingestão esportiva pesada para backend + cache persistido
- reduzir peso da Home principal
- adicionar testes automatizados do core de auth/payments/admin
