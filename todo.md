# RAPHA GURU - TODO

## Banco de Dados e Estrutura Base
- [x] Schema: tabelas bots, alertas, canais, apostas, banca, jogos
- [x] Migrations com pnpm db:push
- [x] Queries helpers em server/db.ts
- [x] Routers tRPC para todas as features

## Layout e Navegação
- [x] Dark mode com tema verde neon (index.css)
- [x] Sidebar com navegação: Pitacos, Painel, Ao Vivo, Bots, Kelly Tracker, Auditoria
- [x] RaphaLayout com sidebar colapsável
- [x] Responsividade mobile
- [x] Tela de login com CTA

## Dashboard Ao Vivo
- [x] Lista de 20 jogos ao vivo com dados simulados
- [x] Oportunidades detectadas por IA com probabilidades
- [x] Cards de jogos com mercados, odds e EV
- [x] Modal de detalhes com motivos da análise
- [x] Filtros por status (quente/morno/frio) e busca

## Sistema de Bots
- [x] 14 templates de IA prontos (Over 0.5 FT, Goleada, BTTS, etc)
- [x] Ativação com 1 clique
- [x] Criação de bot personalizado
- [x] Toggle ativo/pausado por bot
- [x] Configuração de confiança mínima e limite diário
- [x] Exclusão de bots

## Canais de Notificação
- [x] WhatsApp via Evolution API
- [x] WhatsApp via Z-API
- [x] Telegram Bot
- [x] E-mail (SMTP)
- [x] Push Notifications
- [x] Configuração de canal com formulário
- [x] Toggle ativo/inativo por canal

## Histórico de Alertas (Auditoria)
- [x] Lista completa de alertas com filtros
- [x] Detalhes: mercado, odd, EV, motivos, resultado
- [x] Modal de detalhes clicável
- [x] Atualização de resultado (Green/Red/Void)
- [x] Busca por jogo ou mercado

## Kelly Tracker
- [x] Calculadora de stake baseada em Kelly
- [x] Kelly fracionado (1/4, 1/2, 3/4, completo)
- [x] Configuração de banca total
- [x] Stop Loss e Stop Gain
- [x] Registro de apostas
- [x] ROI em tempo real
- [x] Gráfico de evolução da banca (Recharts)
- [x] Atualização de resultado com cálculo automático de lucro

## Pitacos e Painel
- [x] Página de Pitacos com análises manuais
- [x] Painel de estatísticas gerais
- [x] Métricas de performance (taxa de acerto, ROI, banca)
- [x] Ações rápidas no painel

## Testes
- [x] 20 testes unitários passando (auth, bots, canais, alertas, banca, apostas, pitacos)

## Deploy
- [ ] Commit e push para GitHub (raphaelarello/guru_2)
- [ ] Checkpoint salvo
