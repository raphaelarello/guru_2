# Rapha Guru v72 — Motor de Bots Instantâneos + WhatsApp + Dashboard

## O que entrou

### Backend
- novo módulo `server/routes/bots.ts`
- novo motor `server/lib/botEngine.ts`
- novo store compartilhado `server/lib/oddsFeed.ts`
- scheduler de bots iniciado no servidor com varredura a cada 60s
- novos endpoints:
  - `GET /api/bots/templates`
  - `GET /api/bots`
  - `POST /api/bots/templates/:slug/activate`
  - `POST /api/bots`
  - `PATCH /api/bots/:id`
  - `POST /api/bots/:id/toggle`
  - `DELETE /api/bots/:id`
  - `POST /api/bots/scan-now`
  - `GET /api/bots/alerts`
  - `PATCH /api/bots/alerts/:id/result`
  - `GET /api/bots/stats`
  - `POST /api/bots/demo-feed` (admin)
- entrega de alertas por:
  - sistema (`notifications`)
  - e-mail SMTP
  - WhatsApp Cloud API (Meta)
- dashboard de efetividade por filtro / categoria
- registro de alertas, runs, ROI e resultados win/loss/void

### Banco
Novas tabelas:
- `bot_templates`
- `user_bots`
- `bot_runs`
- `bot_alerts`

### Seeds de bots prontos
- Over 1.5 no 2º tempo - Ao Vivo
- Over 0.5 FT
- Over 0.5 aos 55'
- Escanteios por Pressão
- Cartões por Temperatura
- Favorito com Valor

### Frontend
- novo dashboard `client/src/components/bots/BotAutomationDashboard.tsx`
- página `/automacao` passou a ter dois modos:
  - Bots instantâneos
  - Execução em casas
- cards inspirados na UX de concorrentes, mas com foco em:
  - filtros
  - varredura manual instantânea
  - status ativo/pausado
  - ROI/acertos/alertas
  - ativação de bots prontos
  - feed monitorado 24h
  - marcação de resultado dos alertas

## Observações de operação
- WhatsApp exige:
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_PHONE_ID`
  - telefone cadastrado no usuário
- e-mail exige SMTP configurado
- sem canal externo configurado, os alertas continuam chegando no sistema
- para produção real 24h por todas as ligas, é necessário alimentar `oddsFeed` por webhook/feed externo consistente
