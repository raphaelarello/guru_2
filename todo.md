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

## Fase 20 — Dashboard de Resultados Ultra-Inteligente (Multi-Mercado)
- [x] Schema: campo `mercadosPrevistos` JSON em pitacos (array de {tipo, valorPrevisto, valorReal, acertou})
- [x] Schema: campo `scorePrevisao` decimal em pitacos (0-100, calculado automaticamente)
- [x] Schema: campo `placarFinal` varchar em pitacos
- [x] Router: procedure pitacos.create aceita array de mercados previstos
- [x] Router: procedure pitacos.updateMercados aceita resultados individuais por mercado + calcula score
- [x] Router: procedure pitacos.stats retorna métricas avançadas por mercado
- [x] Componente ScorePrecisao: gauge circular SVG animado com score 0-100 e label dinâmico
- [x] Componente MercadoResultadoItem: linha com ícone, valor previsto vs real, badge acerto/erro
- [x] Componente ScoreBadge: mini badge colorido com score e label
- [x] Componente GaugeCircular: gauge circular reutilizável
- [x] Dashboard Painel: seção "Análise de Precisão" com gauge + bar chart por mercado
- [x] Dashboard Painel: últimos palpites com score individual
- [x] Dashboard Painel: melhor e pior mercado com destaque visual
- [x] Pitacos: formulário multi-mercado com atalhos rápidos (18 templates) e campo personalizado
- [x] Pitacos: modal de inserção de resultados com preview de score em tempo real
- [x] Pitacos: cálculo automático de score de precisão ponderado
- [x] Pitacos: aba "Análise de Precisão" com radar chart + ranking + evolução do score
- [x] Pitacos: resultado geral (green/red) determinado automaticamente pelo score

## Fase 21 — Bots Premium + Análise por Liga + Integração Bots→Palpites
- [x] Bots: toggle visual "Todas as Ligas / Ligas Específicas" no modal de configuração
- [x] Bots: ranking visual de performance com pódio animado (Top 3 com sparklines SVG)
- [x] Bots: badge "Top Performer" nos cards com taxa ≥ 70% e ≥ 5 sinais
- [x] Bots: barra de performance individual em cada card (verde/amarelo/vermelho)
- [x] Bots: tabela de demais bots com barra de progresso e cor por performance
- [x] Bots: cronService atualiza `totalSinais` ao criar alerta
- [x] Bots: schema com campos `taxaAcerto` e `historicoPerformance` (migração aplicada)
- [x] Pitacos: sub-aba "Por Liga" na Análise de Precisão
- [x] Pitacos: procedure `statsByLiga` retorna taxa de acerto, score médio e odd média por liga
- [x] Pitacos: gráfico de barras horizontais com taxa de acerto por liga
- [x] Pitacos: gráfico de barras com score médio por liga
- [x] Pitacos: tabela completa com taxa, score, odd média e greens/reds por liga
- [x] Pitacos: cards de destaque "Melhor Liga" e "Pior Liga"
- [x] Pitacos: botão Exportar relatório (.txt) com resumo geral + por liga
- [x] Alertas: ao marcar green/red, cria palpite automático com mercados do template do bot
- [x] Alertas: atualiza `taxaAcerto` e `historicoPerformance` do bot ao resolver alerta

## Fase 22 — Correção UX Ligas Específicas
- [x] Corrigir onClick do botão "Ligas Específicas" para ativar campo de busca
- [x] Melhorar UX: campo de busca de ligas abre automaticamente ao clicar em "Ligas Específicas"
- [x] FiltroLigas: prop forceOpen para abrir programaticamente
- [x] Estado visual claro de qual modo está ativo (Todas / Específicas)

## Fase 23 — Estatísticas de Times + Notificações SSE + PDF
- [x] Página Estatísticas de Times: busca por nome de time
- [x] Estatísticas de Times: forma recente (últimos 10 jogos) com resultado, placar, adversário
- [x] Estatísticas de Times: gols marcados/sofridos, clean sheets, média de gols
- [x] Estatísticas de Times: confronto direto H2H entre dois times
- [x] Estatísticas de Times: gráfico de desempenho (linha do tempo de resultados)
- [x] Estatísticas de Times: estatísticas da liga atual (posição, pontos, saldo de gols)
- [x] Rota /times na navegação sidebar
- [x] SSE: endpoint /api/sse no servidor para push de eventos em tempo real
- [x] SSE: hook useSSE no frontend para escutar eventos
- [x] SSE: badge de notificação no sino do header com contagem não lida
- [x] SSE: painel de notificações com lista de alertas recentes
- [x] SSE: som de notificação ao receber novo alerta
- [x] SSE: toast automático ao receber novo sinal de bot
- [x] PDF: botão "Exportar PDF" na página de Pitacos com loading state
- [x] PDF: relatório com header RAPHA GURU, data, resumo geral
- [x] PDF: tabela de performance por mercado com taxa de acerto e score médio
- [x] PDF: tabela de performance por liga com greens/reds
- [x] PDF: lista dos últimos 20 palpites com score individual
- [x] PDF: gerado via html2canvas + jsPDF no frontend

## Fase 24 — Interatividade Máxima + PWA + Ligas Mundiais

### Cards do Painel Clicáveis
- [ ] Card "Bots Ativos" → navega para /bots
- [ ] Card "Jogos Ao Vivo" → navega para /ao-vivo
- [ ] Card "Alertas Hoje" → navega para /auditoria
- [ ] Card "Taxa de Acerto" → navega para /pitacos (aba análise)
- [ ] Card "Banca Atual" → navega para /kelly
- [ ] Card "Lucro Total" → navega para /kelly
- [ ] Comparativo Bots vs Manual no Painel (gráfico de barras lado a lado)
- [ ] Seção "Desempenho por Estratégia" com taxa, ROI e total de cada tipo

### PWA + Web Push Notifications
- [ ] manifest.json com ícones e configuração PWA
- [ ] service worker (sw.js) com push handler
- [ ] Geração de VAPID keys e configuração no servidor
- [ ] Endpoint /api/push/subscribe para salvar subscriptions
- [ ] Endpoint /api/push/send para enviar notificações
- [ ] Tabela push_subscriptions no banco de dados
- [ ] Botão "Ativar Notificações" no header/painel
- [ ] cronService envia push ao criar novo alerta
- [ ] Notificação com título, ícone e link direto para o alerta

### Dicionário de Ligas Mundiais (500+)
- [ ] Ligas da Europa: todas as ligas principais e secundárias (50+ países)
- [ ] Ligas das Américas: Brasil (todas as divisões), Argentina, México, EUA, Chile, Colômbia, etc.
- [ ] Ligas da Ásia: Japão, Coreia, China, Índia, Arábia Saudita, Qatar, UAE, etc.
- [ ] Ligas da África: Nigéria, Egito, África do Sul, Marrocos, etc.
- [ ] Ligas da Oceania: Austrália, Nova Zelândia, etc.
- [ ] Competições internacionais: Champions, Europa League, Copa Libertadores, Copa do Mundo, etc.
- [ ] IDs reais da API Football para cada liga (para filtros funcionarem)

### Página de Ligas
- [ ] Rota /ligas na sidebar
- [ ] Lista de todas as ligas com bandeira, país e temporada atual
- [ ] Tabela de classificação da liga selecionada
- [ ] Artilheiros da liga selecionada
- [ ] Próximas rodadas da liga selecionada
- [ ] Filtro por continente/país

### Interatividade Máxima em Todas as Telas
- [ ] Bots: cards clicáveis → modal de detalhes/edição
- [ ] Bots: números de sinais clicáveis → vai para Auditoria filtrada por bot
- [ ] Jogos de Hoje: cards clicáveis → modal de detalhes expandido
- [ ] Ao Vivo: cards clicáveis → modal de análise completa
- [ ] Auditoria: linhas clicáveis → modal de detalhes do alerta
- [ ] Kelly Tracker: linhas clicáveis → modal de detalhes da aposta
- [ ] Painel: seção "Últimos Palpites" com link direto para cada palpite

## Fase 24 — Progresso (concluído)
- [x] Página /ligas criada com tabela de classificação, artilheiros, próximos jogos e últimos resultados
- [x] Rota /ligas adicionada ao App.tsx e sidebar (ícone Trophy)
- [x] Filtros de continente corrigidos (América do Sul, América do Norte, Europa, Ásia, África, Oceania, Mundial)
- [x] Card "Jogos Ao Vivo" no Painel agora usa dados dinâmicos (trpc.football.liveFixtures, atualiza a cada 60s)
- [x] Comparativo Bots vs Manual adicionado ao Painel
- [x] Cards do Painel todos clicáveis com navegação para telas relevantes
- [x] Estatísticas rápidas da liga (total de times, gols na temporada, média gols/jogo)
- [x] Tabela de classificação com cores por posição (campeões/rebaixamento) e forma recente
- [x] Artilheiros com pódio visual (🥇🥈🥉) e foto do jogador
- [x] Próximos jogos e últimos resultados clicáveis → navega para /ao-vivo
- [x] Times na tabela clicáveis → navega para /times com ID do time

## Fase 25 - Interatividade Total (concluida)
- [x] Tela Ao Vivo: cards clicaveis com modal ultra-detalhado
- [x] Termometro de calor por partida (score 0-100, niveis: gelado/morno/quente/vulcao)
- [x] Gols com nomes dos jogadores e minuto na timeline
- [x] Cartoes com cor (amarelo/vermelho) e contador interativo
- [x] Escanteios com contador e barra visual
- [x] Auto-refresh a cada 30s com indicador visual
- [x] Ordenacao por calor, gols, minuto, escanteios
- [x] Filtro de datas em JogosHoje (menos 2 a mais 5 dias)
- [x] Botoes Ao Vivo / Proximos Jogos (ordenados por horario) em JogosHoje
- [x] Filtro de data especifica + Ontem na Auditoria
- [x] Filtro de periodo + data especifica no Kelly Tracker

## Fase 26 - PWA + Ligas 500+ + Comparativo Bots vs Manual
- [ ] Expandir dicionario de ligas para 500+ com IDs reais API Football
- [ ] Ligas da Asia: J-League, K-League, CSL, Saudi Pro League, Qatar Stars, UAE, India ISL, etc.
- [ ] Ligas da Africa: AFCON, Nigeria NPFL, Egypt Premier, South Africa PSL, Morocco Botola, etc.
- [ ] Ligas das Americas: MLS, Liga MX, Argentina Primera, Chile Primera, Colombia Primera, etc.
- [ ] Ligas da Europa: todas as divisoes principais e secundarias (50+ paises)
- [ ] Competicoes internacionais: Champions, Europa League, Copa Libertadores, Copa do Mundo, etc.
- [ ] PWA manifest.json com icones e configuracao
- [ ] Service worker (sw.js) com push handler
- [ ] Geracao de VAPID keys no servidor
- [ ] Tabela push_subscriptions no banco de dados
- [ ] Endpoint /api/push/subscribe para salvar subscriptions
- [ ] Botao "Ativar Notificacoes" no header
- [ ] cronService envia push ao criar novo alerta
- [ ] Comparativo Bots vs Palpites Manuais no Painel (grafico de barras)
- [ ] Secao "Desempenho por Estrategia" com taxa, ROI e total de cada tipo

## Fase 26 - PWA + Ligas 500+ + Comparativo (Concluída)
- [x] PWA manifest.json com meta tags Apple e tema verde
- [x] Service Worker (sw.js) para Web Push Notifications
- [x] Hook usePushNotifications com subscribe/unsubscribe
- [x] Botão de push no header mobile do DashboardLayout
- [x] Endpoints subscribePush/unsubscribePush no systemRouter
- [x] Dicionário de ligas confirmado com 253 ligas (todos os continentes)
- [x] Comparativo Bots vs Manual melhorado com gráfico recharts semanal
- [x] EV médio para bots e ROI médio para apostas manuais no comparativo
- [x] 0 erros TypeScript
