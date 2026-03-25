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
- [x] Commit e push para GitHub (raphaelarello/guru_2)
- [x] Checkpoint salvo (versão 7c83d837)

## Integração API Football (Prioridade)
- [x] Configurar chave API Football no projeto (75.000 req/dia, plano Ultra)
- [x] Endpoint /fixtures?live=all — jogos ao vivo em tempo real
- [x] Endpoint /fixtures/statistics — estatísticas detalhadas por jogo
- [x] Endpoint /odds/live — odds ao vivo por jogo
- [x] Endpoint /fixtures — jogos do dia com pré-jogo
- [x] Cache inteligente (TTL por endpoint) para não exceder quota
- [x] Bloqueio de chamadas entre 1h e 7h da manhã (horário Brasília)
- [x] Análise de IA com dados reais (EV, confiança, motivos, predições)
- [x] Bots disparando alertas com dados reais (endpoint processar)
- [x] Atualização automática a cada 30 segundos
- [x] Página Ao Vivo reescrita com dados reais: gols, cartões, odds, estatísticas
- [x] Modal de detalhes: Sinais, Estatísticas, Eventos, Predição (API Football)
- [x] Botão Processar Agora nos Bots para gerar alertas reais
- [x] Motor de análise: Over 0.5/1.5/2.5, BTTS, Goleada, Escanteios, Cartões, EV+

## Bugs
- [x] Erro "Cannot read properties of undefined (reading 'find')" na página Ao Vivo — CORRIGIDO (campo odds vs bets na interface LiveOdd)

## Fase 16 — Automação, Pré-Jogo e Alertas Reais
- [x] Cron job automático: processar bots ativos a cada 5 minutos
- [x] Controle de cron no painel (ativar/desativar, próxima execução, última execução, total alertas)
- [x] Seção Jogos de Hoje: partidas do dia com odds pré-jogo
- [x] Predições da API Football nos jogos de hoje (aba Predição no modal)
- [x] Filtros por liga nos jogos de hoje
- [x] Envio real de alertas via WhatsApp (Evolution API)
- [x] Envio real de alertas via WhatsApp (Z-API)
- [x] Envio real de alertas via Telegram Bot
- [x] Envio real de alertas via E-mail (SMTP)
- [x] Formatação rica das mensagens de alerta (emoji, mercado, odd, EV, motivos, horário Brasília)
- [x] Botão Testar canal com feedback visual (sucesso/falha)
- [x] Endpoints cronIniciar, cronParar, cronExecutarAgora, cronStatus no router

## Bugs Fase 17
- [x] Estatísticas em inglês no modal Ao Vivo — CORRIGIDO (mapa de tradução PT-BR)
- [x] Estatísticas zeradas para ligas menores — CORRIGIDO (mensagem "não disponível")
- [x] Mercados em inglês — CORRIGIDO (Acima, Ambas Marcam, etc.)
- [x] Atualização ao vivo lenta — CORRIGIDO (reduzido para 10s)

## Fase 18 — Filtros Avançados, Ligas em PT-BR e Interatividade Máxima
- [x] Dicionário completo de ligas em português com emoji de bandeira e país (200+ ligas)
- [x] Componente FiltroLigas reutilizável com multi-seleção e "Selecionar Todas"
- [x] Componente FiltroAvancado com mercado, urgência, confiança, odds mínima/máxima
- [x] Filtros avançados na página Ao Vivo: liga, mercado, urgência, confiança mínima
- [x] Filtros avançados em Jogos de Hoje: liga, horário, odds mínima/máxima
- [x] Filtros avançados nos Bots (Fila de Sinais): liga, mercado, confiança
- [x] Filtros avançados na Auditoria: liga, resultado, mercado, período + exportar CSV
- [x] Filtros avançados no Kelly Tracker: busca, resultado, exportar CSV
- [x] Bandeiras e nomes PT-BR em todos os cards de jogos
- [x] Templates de bots com ativação 1 clique + filtro por categoria (Gols, BTTS, Resultado, Tempo, Especiais)
- [x] Badge "Já ativado" nos templates que já foram criados
- [x] Botão de configuração avançada ao lado do 1 clique nos templates
- [x] Cron automático com controles na aba Central dos Bots

## Fase 19 — Sistema de Bots Premium Ultra-Avançado
- [x] Expandir para 35+ templates de IA com novas categorias (42 templates)
- [x] Templates: Gol nos primeiros 5/10/15/20/30 minutos
- [x] Templates: Gol nos últimos 15/10 minutos
- [x] Templates: Virada em andamento (time perdendo mas pressionando)
- [x] Templates: Placar exato provável (0-0, 1-0, 1-1, 2-0, 2-1)
- [x] Templates: Escanteios acima de 8/10/12
- [x] Templates: Cartões acima de 3/5
- [x] Templates: Posse de bola dominante (>65%)
- [x] Templates: Chutes a gol acima de 10
- [x] Templates: Pressão intensa (xG alto sem gol)
- [x] Templates: Empate no intervalo + Over 2.5 FT
- [x] Templates: Time favorito perdendo (value bet)
- [x] Templates: Gol de pênalti detectado
- [x] Templates: Jogo de 6 pontos (ambos precisam vencer)
- [x] Construtor visual de bots com filtros avançados no modal
- [x] Filtro por liga específica em cada bot (multi-seleção com FiltroLigas)
- [x] Filtro por minuto de jogo (slider mínimo/máximo)
- [x] Filtro por placar atual (empate, casa vence, visitante vence)
- [x] Filtro por odds mínima/máxima (slider)
- [x] Filtro por EV mínimo configurável
- [x] Filtro por tipo de jogo (ao vivo / pré-jogo / ambos)
- [x] Filtro por diferença máxima de gols
- [x] Filtro por importância do jogo (qualquer, importante, decisivo, derby)
- [x] Resumo visual dos filtros configurados no modal
- [x] Badge de filtros ativos nos cards de bots na Central
- [x] Busca de templates por nome/descrição
- [x] Filtro de templates por tag (popular, value, ao-vivo, seguro, alto-risco)
- [x] Filtro de templates por categoria (Gols, BTTS, Resultado, Placar Exato, etc.)
- [x] Campo `filtros` JSON na tabela bots (migração aplicada)
- [x] Campo `canal` na tabela bots para canal de envio por bot
- [x] cronService atualizado para respeitar todos os filtros avançados
- [x] Procedimento canais.toggle para ativar/desativar canal
- [x] Visual melhorado da página de Canais com status de conexão
- [ ] Página Estatísticas de Times com busca e histórico
- [ ] Confrontos diretos (H2H) entre dois times
- [ ] Forma recente (últimos 5/10 jogos)
