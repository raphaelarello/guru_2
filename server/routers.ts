import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getBotsByUserId, getBotById, createBot, updateBot, deleteBot,
  getCanaisByUserId, upsertCanal, updateCanal,
  getAlertasByUserId, createAlerta, updateAlerta,
  getBancaByUserId, upsertBanca,
  getApostasByUserId, createAposta, updateAposta,
  getPitacosByUserId, createPitaco, updatePitaco,
} from "./db";
import { getDb } from "./db";
import { liveGameHistory } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { statusCron, executarAgora, iniciarCron, pararCron, enviarAlertaCanais } from "./cronService";
import { parse as parseCookieHeader } from "cookie";
import { superAdminAuth, SUPERADMIN_COOKIE_NAME } from "./services/superAdminAuth";
import {
  getLiveFixtures,
  getLiveFixturesByLeagues,
  getTodayFixtures,
  getNextFixtures,
  getLastFixtures,
  getFixtureById,
  getFixturesByIds,
  getHeadToHead,
  getFixtureStatistics,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayers,
  getFixturePredictions,
  getAllLiveOdds,
  getLiveOdds,
  getLiveOddsByLeague,
  getPreMatchOdds,
  getLiveOddsBets,
  getFixtureInjuries,
  getTeamInjuries,
  getStandings,
  getTeamStandings,
  getTeamSeasonStats,
  getApiStatus,
  analisarOportunidades,
  clearCache,
  getCacheStats,
  getBlockStatus,
  getApiUsage,
  getDestaquesHoje,
} from "./football";
import { getArtilheirosAvancado } from "./artilheiros-premium";
import { matchesRouter } from "./routers/matches";


function getClientIp(req: { headers: Record<string, unknown>; socket?: { remoteAddress?: string | undefined } }) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "0.0.0.0";
}

function getSuperAdminCookie(req: { headers: Record<string, unknown> }) {
  const rawCookie = typeof req.headers.cookie === "string" ? req.headers.cookie : "";
  const parsed = parseCookieHeader(rawCookie);
  return parsed[SUPERADMIN_COOKIE_NAME] || null;
}


export const appRouter = router({
  system: systemRouter,
  matches: matchesRouter,

auth: router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
}),

superadmin: router({
  me: publicProcedure.query(({ ctx }) => {
    const parsed = superAdminAuth.parseSessionCookieValue(getSuperAdminCookie(ctx.req));
    if (!parsed) {
      return { autenticado: false, sessionId: null, stats: null } as const;
    }
    const validacao = superAdminAuth.validarSessao(parsed.sessionId, parsed.token);
    if (!validacao.valida) {
      ctx.res.clearCookie(SUPERADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { autenticado: false, sessionId: null, stats: null } as const;
    }
    return {
      autenticado: true,
      sessionId: parsed.sessionId,
      stats: superAdminAuth.obterEstatisticas(),
    } as const;
  }),

  login: publicProcedure
    .input(z.object({ senha: z.string().min(1) }))
    .mutation(({ input, ctx }) => {
      return superAdminAuth.autenticar(
        input.senha,
        getClientIp(ctx.req as unknown as { headers: Record<string, unknown>; socket?: { remoteAddress?: string } }),
        String(ctx.req.headers["user-agent"] || "unknown"),
      );
    }),

  verify2FA: publicProcedure
    .input(z.object({ sessionId: z.string().min(1), codigo: z.string().min(6).max(6) }))
    .mutation(() => {
      return { sucesso: true, message: "2FA verificado" };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const sessionId = getSuperAdminCookie(ctx.req);
    if (sessionId) {
      superAdminAuth.logout(sessionId);
    }
    ctx.res.clearCookie(SUPERADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
    return { sucesso: true } as const;
  }),

  logs: publicProcedure
    .input(z.object({
      acao: z.string().optional(),
      status: z.enum(["sucesso", "falha"]).optional(),
      limite: z.number().int().min(1).max(500).optional(),
    }).optional())
    .query(({ input, ctx }) => {
      const sessionId = getSuperAdminCookie(ctx.req);
      if (!sessionId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão superadmin não encontrada." });
      }
      const validacao = superAdminAuth.validarSessao(sessionId);
      if (!validacao.valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida ou expirada." });
      }
      return superAdminAuth.obterAuditLogs();
    }),

  estatisticas: publicProcedure.query(({ ctx }) => {
    const sessionId = getSuperAdminCookie(ctx.req);
    if (!sessionId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão superadmin não encontrada." });
    }
    const validacao = superAdminAuth.validarSessao(sessionId);
    if (!validacao.valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida ou expirada." });
    }
    return superAdminAuth.obterEstatisticas();
  }),
}),

  // ═══════════════════════════════════════════════════════════════════════
  //  FOOTBALL — API Football (Dados em Tempo Real)
  // ═══════════════════════════════════════════════════════════════════════
  football: router({

    /** Status da conta e uso diário */
    status: publicProcedure.query(() => getApiStatus()),

    /** Status do bloqueio horário (1h-7h Brasília) */
    blockStatus: publicProcedure.query(() => getBlockStatus()),

    /** Uso diário da API Football (contador de requisições) */
    apiUsage: publicProcedure.query(() => getApiUsage()),

    /** Jogos de hoje (pré-jogo) com odds e predições */
    jogosHoje: publicProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const jogos = await getTodayFixtures(input?.date);
        // Buscar odds pré-jogo para os primeiros 10 jogos (economizar quota)
        const top10 = jogos.slice(0, 10);
        const oddsPromises = top10.map(async (f) => {
          try {
            const oddsArr = await getPreMatchOdds(f.fixture.id);
            const odds = Array.isArray(oddsArr) ? oddsArr[0] ?? null : oddsArr;
            return { fixtureId: f.fixture.id, odds };
          } catch {
            return { fixtureId: f.fixture.id, odds: null };
          }
        });
        const oddsResults = await Promise.allSettled(oddsPromises);
        const oddsMap = new Map<number, import("./football").PreMatchOdd | null>();
        for (const r of oddsResults) {
          if (r.status === "fulfilled") oddsMap.set(r.value.fixtureId, r.value.odds);
        }
        // Agrupar por liga
        const ligasMap = new Map<string, { liga: { id: number; name: string; logo: string; country: string }; jogos: typeof jogos }>();
        for (const f of jogos) {
          const key = String(f.league.id);
          if (!ligasMap.has(key)) ligasMap.set(key, { liga: { id: f.league.id, name: f.league.name, logo: f.league.logo, country: f.league.country }, jogos: [] });
          ligasMap.get(key)!.jogos.push(f);
        }
        return {
          total: jogos.length,
          ligas: Array.from(ligasMap.values()),
          oddsMap: Object.fromEntries(oddsMap),
          timestamp: Date.now(),
        };
      }),

    /** Estatísticas do cache */
    cacheStats: publicProcedure.query(() => getCacheStats()),

    /** Limpar cache (admin) */
    clearCache: protectedProcedure.mutation(() => { clearCache(); return { ok: true }; }),

    // ── Fixtures ──────────────────────────────────────────────────────────

    /** Todos os jogos ao vivo agora */
    liveFixtures: publicProcedure.query(() => getLiveFixtures()),

    /** Jogos ao vivo filtrados por ligas */
    liveFixturesByLeagues: publicProcedure
      .input(z.object({ leagueIds: z.array(z.number()) }))
      .query(({ input }) => getLiveFixturesByLeagues(input.leagueIds)),

    /** Jogos do dia */
    todayFixtures: publicProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(({ input }) => getTodayFixtures(input?.date)),

    /** Próximos X jogos */
    nextFixtures: publicProcedure
      .input(z.object({ count: z.number().min(1).max(50).default(20) }).optional())
      .query(({ input }) => getNextFixtures(input?.count ?? 20)),

    /** Últimos X jogos */
    lastFixtures: publicProcedure
      .input(z.object({ count: z.number().min(1).max(50).default(20) }).optional())
      .query(({ input }) => getLastFixtures(input?.count ?? 20)),

    /** Fixture específico por ID */
    fixtureById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getFixtureById(input.id)),

    /** Múltiplos fixtures por IDs */
    fixturesByIds: publicProcedure
      .input(z.object({ ids: z.array(z.number()).max(20) }))
      .query(({ input }) => getFixturesByIds(input.ids)),

    /** Head-to-head entre dois times */
    headToHead: publicProcedure
      .input(z.object({ team1: z.number(), team2: z.number(), last: z.number().default(10) }))
      .query(({ input }) => getHeadToHead(input.team1, input.team2, input.last)),

    // ── Estatísticas ──────────────────────────────────────────────────────

    /** Estatísticas completas de um jogo */
    fixtureStats: publicProcedure
      .input(z.object({ fixtureId: z.number(), half: z.boolean().default(false) }))
      .query(({ input }) => getFixtureStatistics(input.fixtureId, input.half)),

    /** Eventos de um jogo (gols, cartões, substituições, VAR) */
    fixtureEvents: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getFixtureEvents(input.fixtureId)),

    /** Escalações de um jogo */
    fixtureLineups: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getFixtureLineups(input.fixtureId)),

    /** Estatísticas de jogadores em um jogo */
    fixturePlayers: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getFixturePlayers(input.fixtureId)),

    // ── Predições ─────────────────────────────────────────────────────────

    /** Predições da API (Poisson, comparação, advice) */
    predictions: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getFixturePredictions(input.fixtureId)),

    // ── Odds ──────────────────────────────────────────────────────────────

    /** Todas as odds ao vivo (todos os jogos) */
    allLiveOdds: publicProcedure.query(() => getAllLiveOdds()),

    /** Odds ao vivo de um jogo */
    liveOdds: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getLiveOdds(input.fixtureId)),

    /** Odds ao vivo de uma liga */
    liveOddsByLeague: publicProcedure
      .input(z.object({ leagueId: z.number() }))
      .query(({ input }) => getLiveOddsByLeague(input.leagueId)),

    /** Odds pré-jogo */
    preMatchOdds: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getPreMatchOdds(input.fixtureId)),

    /** Lista de mercados disponíveis para odds ao vivo */
    liveOddsBets: publicProcedure.query(() => getLiveOddsBets()),

    // ── Lesões ────────────────────────────────────────────────────────────

    /** Lesões de um jogo */
    fixtureInjuries: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(({ input }) => getFixtureInjuries(input.fixtureId)),

    /** Lesões de um time na temporada */
    teamInjuries: publicProcedure
      .input(z.object({ teamId: z.number(), season: z.number() }))
      .query(({ input }) => getTeamInjuries(input.teamId, input.season)),

    // ── Standings ─────────────────────────────────────────────────────────

    /** Classificação de uma liga */
    standings: publicProcedure
      .input(z.object({ leagueId: z.number(), season: z.number() }))
      .query(({ input }) => getStandings(input.leagueId, input.season)),

    // ── Estatísticas do Time ──────────────────────────────────────────────

    /** Estatísticas de um time na temporada */
    teamSeasonStats: publicProcedure
      .input(z.object({ teamId: z.number(), leagueId: z.number(), season: z.number() }))
      .query(({ input }) => getTeamSeasonStats(input.teamId, input.leagueId, input.season)),

    // ── Análise de IA ─────────────────────────────────────────────────────

    /**
     * Análise completa de um jogo ao vivo:
     * Busca fixture + estatísticas + odds ao vivo + predições em paralelo
     * e retorna oportunidades detectadas pela IA
     */
    analisarJogo: publicProcedure
      .input(z.object({ fixtureId: z.number() }))
      .query(async ({ input }) => {
        const [fixture, stats, odds, prediction] = await Promise.allSettled([
          getFixtureById(input.fixtureId),
          getFixtureStatistics(input.fixtureId),
          getLiveOdds(input.fixtureId),
          getFixturePredictions(input.fixtureId),
        ]);

        const f = fixture.status === "fulfilled" ? fixture.value : null;
        const s = stats.status === "fulfilled" ? stats.value : [];
        const o = odds.status === "fulfilled" ? odds.value : null;
        const p = prediction.status === "fulfilled" ? prediction.value : null;

        if (!f) return { oportunidades: [], fixture: null };

        const oportunidades = analisarOportunidades(f, s, o, p);
        return { oportunidades, fixture: f, stats: s, odds: o, prediction: p };
      }),

    /**
     * Dashboard ao vivo completo:
     * Todos os jogos ao vivo + odds ao vivo + análise de IA para cada jogo
     */
    dashboardAoVivo: publicProcedure.query(async () => {
      const [fixtures, allOdds] = await Promise.allSettled([
        getLiveFixtures(),
        getAllLiveOdds(),
      ]);

      const jogos = fixtures.status === "fulfilled" ? fixtures.value : [];
      const oddsMap = new Map<number, import("./football").LiveOdd>();

      if (allOdds.status === "fulfilled") {
        for (const odd of allOdds.value) {
          oddsMap.set(odd.fixture.id, odd);
        }
      }

      // Analisar cada jogo com os dados disponíveis
      const jogosComAnalise = jogos.map((fixture) => {
        const odds = oddsMap.get(fixture.fixture.id) || null;
        const oportunidades = analisarOportunidades(
          fixture,
          fixture.statistics || [],
          odds,
          null
        );
        return {
          fixture,
          odds,
          oportunidades,
          totalOportunidades: oportunidades.length,
          melhorEV: oportunidades[0]?.ev ?? 0,
        };
      });

      // Ordenar por número de oportunidades e EV
      jogosComAnalise.sort((a, b) => b.totalOportunidades - a.totalOportunidades || b.melhorEV - a.melhorEV);

      return {
        totalJogos: jogos.length,
        totalOportunidades: jogosComAnalise.reduce((acc, j) => acc + j.totalOportunidades, 0),
        jogos: jogosComAnalise,
        timestamp: Date.now(),
      };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  BOTS
  // ═══════════════════════════════════════════════════════════════════════
  bots: router({
    list: protectedProcedure.query(({ ctx }) => getBotsByUserId(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        templateId: z.string().optional(),
        confiancaMinima: z.number().min(0).max(100).default(70),
        limiteDiario: z.number().min(1).max(100).default(10),
        regras: z.any().optional(),
        filtros: z.any().optional(),
        canal: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => createBot({ ...input, userId: ctx.user.id, ativo: false })),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        ativo: z.boolean().optional(),
        confiancaMinima: z.number().min(0).max(100).optional(),
        limiteDiario: z.number().min(1).max(100).optional(),
        regras: z.any().optional(),
        filtros: z.any().optional(),
        canal: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateBot(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteBot(input.id, ctx.user.id)),
    toggleAtivo: protectedProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(({ ctx, input }) => updateBot(input.id, ctx.user.id, { ativo: input.ativo })),

    /** Status do cron automático */
    cronStatus: protectedProcedure.query(() => statusCron()),

    /** Iniciar cron automático */
    cronIniciar: protectedProcedure.mutation(() => { iniciarCron(); return statusCron(); }),

    /** Parar cron automático */
    cronParar: protectedProcedure.mutation(() => { pararCron(); return statusCron(); }),

    /** Executar processamento agora (manual) */
    cronExecutarAgora: protectedProcedure.mutation(async () => { await executarAgora(); return statusCron(); }),

    /** Processar bots ativos contra jogos ao vivo e gerar alertas reais */
    processar: protectedProcedure
      .mutation(async ({ ctx }) => {
        const bots = await getBotsByUserId(ctx.user.id);
        const botsAtivos = bots.filter(b => b.ativo);
        if (botsAtivos.length === 0) return { alertasGerados: 0, mensagem: "Nenhum bot ativo" };

        // Buscar jogos ao vivo com análise
        const [fixturesResult, oddsResult] = await Promise.allSettled([
          getLiveFixtures(),
          getAllLiveOdds(),
        ]);
        const jogos = fixturesResult.status === "fulfilled" ? fixturesResult.value : [];
        const oddsMap = new Map<number, import("./football").LiveOdd>();
        if (oddsResult.status === "fulfilled") {
          for (const odd of oddsResult.value) oddsMap.set(odd.fixture.id, odd);
        }

        let alertasGerados = 0;
        for (const bot of botsAtivos) {
          for (const fixture of jogos) {
            const odds = oddsMap.get(fixture.fixture.id) || null;
            const oportunidades = analisarOportunidades(fixture, fixture.statistics || [], odds, null);
            const regras = (bot.regras as { templateId?: string; tipo?: string; confiancaMinima?: number } | null) || {};

            for (const op of oportunidades) {
              // Filtrar por confiança mínima do bot
              const confMin = bot.confiancaMinima ?? 70;
              if (op.confianca < confMin) continue;

              // Filtrar por tipo/template se configurado
              if (regras.tipo && op.tipo !== regras.tipo) continue;

              // Criar alerta
              await createAlerta({
                userId: ctx.user.id,
                botId: bot.id,
                jogo: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                liga: fixture.league.name,
                mercado: op.mercado,
                odd: op.odd.toFixed(2),
                ev: op.ev.toFixed(2),
                confianca: op.confianca,
                motivos: op.motivos,
              });
              alertasGerados++;
            }
          }
        }

        return { alertasGerados, mensagem: `${alertasGerados} alerta(s) gerado(s) de ${botsAtivos.length} bot(s) ativo(s)` };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  CANAIS
  // ═══════════════════════════════════════════════════════════════════════
  canais: router({
    list: protectedProcedure.query(({ ctx }) => getCanaisByUserId(ctx.user.id)),
    upsert: protectedProcedure
      .input(z.object({
        tipo: z.enum(["whatsapp_evolution", "whatsapp_zapi", "telegram", "email", "push"]),
        nome: z.string().min(1),
        ativo: z.boolean().default(false),
        config: z.any().optional(),
      }))
      .mutation(({ ctx, input }) => upsertCanal({ ...input, userId: ctx.user.id })),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        ativo: z.boolean().optional(),
        config: z.any().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateCanal(id, ctx.user.id, data);
      }),

    /** Ativar/desativar canal */
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(({ ctx, input }) => updateCanal(input.id, ctx.user.id, { ativo: input.ativo })),

    /** Testar envio de mensagem em um canal */
    testar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const canaisUsuario = await getCanaisByUserId(ctx.user.id);
        const canal = canaisUsuario.find(c => c.id === input.id);
        if (!canal) throw new Error("Canal não encontrado");

        const resultados = await enviarAlertaCanais(ctx.user.id, {
          jogo: "Flamengo vs Corinthians",
          liga: "Brasileirão Série A",
          mercado: "Over 2.5 Gols",
          odd: "1.85",
          ev: "12.5",
          confianca: 87,
          motivos: ["Teste de canal RAPHA GURU", "Mensagem de verificação de conectividade"],
        });

        const resultado = resultados.find((r: { canal: string; sucesso: boolean }) => r.canal === canal.tipo);
        return { sucesso: resultado?.sucesso ?? false, canal: canal.tipo, erro: resultado?.sucesso ? undefined : "Falha no envio" };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  ALERTAS
  // ═══════════════════════════════════════════════════════════════════════
  alertas: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(({ ctx, input }) => getAlertasByUserId(ctx.user.id, input?.limit)),
    create: protectedProcedure
      .input(z.object({
        botId: z.number().optional(),
        jogo: z.string(),
        liga: z.string().optional(),
        mercado: z.string(),
        odd: z.string(),
        ev: z.string().optional(),
        confianca: z.number().min(0).max(100),
        motivos: z.any().optional(),
      }))
      .mutation(({ ctx, input }) => createAlerta({ ...input, userId: ctx.user.id })),
    updateResultado: protectedProcedure
      .input(z.object({
        id: z.number(),
        resultado: z.enum(["pendente", "green", "red", "void"]),
        criarPitacoAuto: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const alerta = await updateAlerta(input.id, ctx.user.id, { resultado: input.resultado });
        if (!alerta) return alerta;

        // Auto-criar palpite quando resultado é definido
        if (input.criarPitacoAuto && (input.resultado === "green" || input.resultado === "red")) {
          try {
            const tipoMercado = detectarTipoMercado(alerta.mercado);
            await createPitaco({
              userId: ctx.user.id,
              jogo: alerta.jogo,
              liga: alerta.liga ?? undefined,
              mercado: alerta.mercado,
              odd: alerta.odd,
              confianca: alerta.confianca,
              resultado: input.resultado,
              mercadosPrevistos: [{
                tipo: tipoMercado,
                label: alerta.mercado,
                valorPrevisto: "sim",
                valorReal: input.resultado === "green" ? "sim" : "nao",
                acertou: input.resultado === "green",
                peso: 2,
              }],
              scorePrevisao: input.resultado === "green" ? "100" : "0",
              analise: `Gerado automaticamente pelo bot (ID: ${alerta.botId ?? "manual"})`,
            });
          } catch (e) {
            console.error("[auto-pitaco]", e);
          }
        }

        // Atualizar performance do bot
        if (alerta.botId && (input.resultado === "green" || input.resultado === "red")) {
          try {
            const bot = await getBotById(alerta.botId, ctx.user.id);
            if (bot) {
              const novoTotal = (bot.totalSinais ?? 0) + 1;
              const novosAcertos = (bot.totalAcertos ?? 0) + (input.resultado === "green" ? 1 : 0);
              const novaTaxa = novoTotal > 0 ? Math.round((novosAcertos / novoTotal) * 100) : 0;
              const historico = ((bot.historicoPerformance as Array<{data: string; taxa: number}> | null) ?? []);
              historico.push({ data: new Date().toISOString().slice(0, 10), taxa: novaTaxa });
              await updateBot(alerta.botId, ctx.user.id, {
                totalSinais: novoTotal,
                totalAcertos: novosAcertos,
                taxaAcerto: String(novaTaxa),
                historicoPerformance: historico.slice(-90),
              });
            }
          } catch (e) {
            console.error("[bot-performance]", e);
          }
        }

        return alerta;
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  BANCA
  // ═══════════════════════════════════════════════════════════════════════
  banca: router({
    get: protectedProcedure.query(({ ctx }) => getBancaByUserId(ctx.user.id)),
    upsert: protectedProcedure
      .input(z.object({
        valorTotal: z.string(),
        valorAtual: z.string().optional(),
        stopLoss: z.string().default("20.00"),
        stopGain: z.string().default("50.00"),
        kellyFracao: z.string().default("0.25"),
      }))
      .mutation(({ ctx, input }) => upsertBanca({
        ...input,
        valorAtual: input.valorAtual ?? input.valorTotal,
        userId: ctx.user.id,
      })),
    updateValor: protectedProcedure
      .input(z.object({ valorAtual: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const banca = await getBancaByUserId(ctx.user.id);
        if (!banca) throw new Error("Banca não encontrada");
        return upsertBanca({ ...banca, valorAtual: input.valorAtual, userId: ctx.user.id });
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  APOSTAS
  // ═══════════════════════════════════════════════════════════════════════
  apostas: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(({ ctx, input }) => getApostasByUserId(ctx.user.id, input?.limit)),
    create: protectedProcedure
      .input(z.object({
        alertaId: z.number().optional(),
        jogo: z.string(),
        mercado: z.string(),
        odd: z.string(),
        stake: z.string(),
        dataJogo: z.date().optional(),
      }))
      .mutation(({ ctx, input }) => createAposta({ ...input, userId: ctx.user.id })),
    updateResultado: protectedProcedure
      .input(z.object({
        id: z.number(),
        resultado: z.enum(["pendente", "green", "red", "void"]),
        lucro: z.string().optional(),
        roi: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => updateAposta(input.id, ctx.user.id, {
        resultado: input.resultado,
        lucro: input.lucro,
        roi: input.roi,
      })),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  PITACOS
  // ═══════════════════════════════════════════════════════════════════════
  pitacos: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(({ ctx, input }) => getPitacosByUserId(ctx.user.id, input?.limit)),

    create: protectedProcedure
      .input(z.object({
        jogo: z.string(),
        liga: z.string().optional(),
        mercado: z.string(),
        odd: z.string(),
        analise: z.string().optional(),
        confianca: z.number().min(0).max(100).default(70),
        // Multi-mercado
        mercadosPrevistos: z.array(z.object({
          tipo: z.string(),
          label: z.string(),
          valorPrevisto: z.string(),
          valorReal: z.string().optional(),
          acertou: z.boolean().optional(),
          peso: z.number().default(1),
        })).optional(),
        placarFinal: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => createPitaco({ ...input, userId: ctx.user.id })),

    updateResultado: protectedProcedure
      .input(z.object({
        id: z.number(),
        resultado: z.enum(["pendente", "green", "red", "void"]),
      }))
      .mutation(({ ctx, input }) => updatePitaco(input.id, ctx.user.id, { resultado: input.resultado })),

    /** Atualizar resultados individuais de cada mercado previsto */
    updateMercados: protectedProcedure
      .input(z.object({
        id: z.number(),
        mercadosPrevistos: z.array(z.object({
          tipo: z.string(),
          label: z.string(),
          valorPrevisto: z.string(),
          valorReal: z.string().optional(),
          acertou: z.boolean().optional(),
          peso: z.number().default(1),
        })),
        placarFinal: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Calcular score de precisão
        const finalizados = input.mercadosPrevistos.filter(m => m.acertou !== undefined);
        let scorePrevisao: string | undefined;
        if (finalizados.length > 0) {
          const pesoTotal = finalizados.reduce((s, m) => s + m.peso, 0);
          const pesoAcertos = finalizados.filter(m => m.acertou).reduce((s, m) => s + m.peso, 0);
          scorePrevisao = ((pesoAcertos / pesoTotal) * 100).toFixed(2);
        }
        // Determinar resultado geral (green se score >= 50, red se < 50 e todos finalizados)
        const todosFinalizados = input.mercadosPrevistos.every(m => m.acertou !== undefined);
        const score = scorePrevisao ? parseFloat(scorePrevisao) : undefined;
        const resultado = todosFinalizados && score !== undefined
          ? (score >= 50 ? "green" as const : "red" as const)
          : "pendente" as const;
        return updatePitaco(input.id, ctx.user.id, {
          mercadosPrevistos: input.mercadosPrevistos,
          scorePrevisao,
          placarFinal: input.placarFinal,
          resultado,
        });
      }),

    /** Estatísticas avançadas de precisão por tipo de mercado */
    stats: protectedProcedure.query(async ({ ctx }) => {
      const todos = await getPitacosByUserId(ctx.user.id, 500);
      const finalizados = todos.filter(p => p.resultado !== "pendente");

      // Estatísticas gerais
      const totalPalpites = todos.length;
      const greens = finalizados.filter(p => p.resultado === "green").length;
      const reds = finalizados.filter(p => p.resultado === "red").length;
      const taxaAcerto = finalizados.length > 0 ? (greens / finalizados.length) * 100 : 0;

      // Score médio de precisão
      const comScore = todos.filter(p => p.scorePrevisao !== null && p.scorePrevisao !== undefined);
      const scoreMedio = comScore.length > 0
        ? comScore.reduce((s, p) => s + parseFloat(p.scorePrevisao ?? "0"), 0) / comScore.length
        : 0;

      // Estatísticas por tipo de mercado
      const statsPorMercado: Record<string, { label: string; acertos: number; total: number; taxa: number }> = {};
      for (const pitaco of todos) {
        const mercados = (pitaco.mercadosPrevistos as Array<{ tipo: string; label: string; acertou?: boolean }> | null) ?? [];
        for (const m of mercados) {
          if (m.acertou === undefined) continue;
          const tipo = m.tipo || "outros";
          if (!statsPorMercado[tipo]) statsPorMercado[tipo] = { label: tipo, acertos: 0, total: 0, taxa: 0 };
          statsPorMercado[tipo].total++;
          if (m.acertou) statsPorMercado[tipo].acertos++;
        }
      }
      for (const tipo of Object.keys(statsPorMercado)) {
        const s = statsPorMercado[tipo];
        s.taxa = s.total > 0 ? (s.acertos / s.total) * 100 : 0;
      }

      // Histórico de score (últimos 20 palpites com score)
      const historicoScore = comScore
        .slice(-20)
        .map(p => ({
          data: p.createdAt,
          score: parseFloat(p.scorePrevisao ?? "0"),
          jogo: p.jogo,
        }));

      // Melhor e pior mercado
      const mercadosOrdenados = Object.values(statsPorMercado)
        .filter(s => s.total >= 2)
        .sort((a, b) => b.taxa - a.taxa);

      return {
        totalPalpites,
        greens,
        reds,
        taxaAcerto,
        scoreMedio,
        statsPorMercado,
        historicoScore,
        melhorMercado: mercadosOrdenados[0] ?? null,
        piorMercado: mercadosOrdenados[mercadosOrdenados.length - 1] ?? null,
        rankingMercados: mercadosOrdenados,
      };
    }),

    statsByLiga: protectedProcedure.query(async ({ ctx }) => {
      const todos = await getPitacosByUserId(ctx.user.id, 500);
      const finalizados = todos.filter(p => p.resultado === "green" || p.resultado === "red");
      if (finalizados.length === 0) return [];

      const porLiga: Record<string, {
        liga: string; total: number; greens: number; reds: number;
        taxaAcerto: number; scoreMedio: number; mercadosMaisAcertados: string[];
      }> = {};

      for (const p of finalizados) {
        const liga = p.liga || "Sem liga";
        if (!porLiga[liga]) porLiga[liga] = { liga, total: 0, greens: 0, reds: 0, taxaAcerto: 0, scoreMedio: 0, mercadosMaisAcertados: [] };
        porLiga[liga].total++;
        if (p.resultado === "green") porLiga[liga].greens++;
        else porLiga[liga].reds++;
      }

      for (const liga of Object.keys(porLiga)) {
        const l = porLiga[liga];
        l.taxaAcerto = l.total > 0 ? (l.greens / l.total) * 100 : 0;
        const comScore = finalizados.filter(p => (p.liga || "Sem liga") === liga && p.scorePrevisao);
        l.scoreMedio = comScore.length > 0
          ? comScore.reduce((acc, p) => acc + parseFloat(p.scorePrevisao ?? "0"), 0) / comScore.length
          : 0;
        // Mercados mais acertados nessa liga
        const mercadoAcertos: Record<string, number> = {};
        for (const pitaco of finalizados.filter(p => (p.liga || "Sem liga") === liga)) {
          const mercados = (pitaco.mercadosPrevistos as Array<{ tipo: string; acertou?: boolean }> | null) ?? [];
          for (const m of mercados) {
            if (m.acertou) mercadoAcertos[m.tipo] = (mercadoAcertos[m.tipo] ?? 0) + 1;
          }
        }
        l.mercadosMaisAcertados = Object.entries(mercadoAcertos)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tipo]) => tipo);
      }

      return Object.values(porLiga)
        .filter(l => l.total >= 1)
        .sort((a, b) => b.taxaAcerto - a.taxaAcerto);
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  //  TIMES — Estatísticas, H2H, Forma Recente
  // ═══════════════════════════════════════════════════════════════════════
  times: router({
    /** Buscar time por nome */
    buscar: protectedProcedure
      .input(z.object({ nome: z.string().min(2) }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(input.nome)}`,
          { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" } }
        );
        const json = await res.json() as any;
        return (json.response || []).slice(0, 10).map((t: any) => ({
          id: t.team.id,
          nome: t.team.name,
          logo: t.team.logo,
          pais: t.team.country,
          fundado: t.team.founded,
          estadio: t.venue?.name,
          capacidade: t.venue?.capacity,
        }));
      }),

    /** Forma recente do time (últimos N jogos) */
    formaRecente: protectedProcedure
      .input(z.object({ teamId: z.number(), last: z.number().default(10) }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?team=${input.teamId}&last=${input.last}&timezone=America/Sao_Paulo`,
          { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" } }
        );
        const json = await res.json() as any;
        const fixtures = (json.response || []) as any[];
        return fixtures.map((f: any) => {
          const isHome = f.teams.home.id === input.teamId;
          const goalsFor = isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
          const goalsAgainst = isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
          let resultado: "V" | "E" | "D" = "E";
          if (goalsFor > goalsAgainst) resultado = "V";
          else if (goalsFor < goalsAgainst) resultado = "D";
          return {
            fixtureId: f.fixture.id,
            data: f.fixture.date,
            adversario: isHome ? f.teams.away.name : f.teams.home.name,
            adversarioLogo: isHome ? f.teams.away.logo : f.teams.home.logo,
            local: isHome ? "Casa" : "Fora" as "Casa" | "Fora",
            placar: `${goalsFor}-${goalsAgainst}`,
            resultado,
            liga: f.league.name,
            ligaLogo: f.league.logo,
            rodada: f.league.round,
            status: f.fixture.status.short,
          };
        });
      }),

    /** Estatísticas da temporada do time em uma liga */
    estatisticas: protectedProcedure
      .input(z.object({ teamId: z.number(), leagueId: z.number(), season: z.number().default(2024) }))
      .query(async ({ input }) => getTeamSeasonStats(input.teamId, input.leagueId, input.season)),

    /** Classificação do time */
    classificacao: protectedProcedure
      .input(z.object({ teamId: z.number(), season: z.number().default(2024) }))
      .query(async ({ input }) => getTeamStandings(input.teamId, input.season)),

    /** Confronto direto H2H entre dois times */
    h2h: protectedProcedure
      .input(z.object({ team1Id: z.number(), team2Id: z.number(), last: z.number().default(10) }))
      .query(async ({ input }) => {
        const fixtures = await getHeadToHead(input.team1Id, input.team2Id, input.last);
        const stats = { vitorias1: 0, vitorias2: 0, empates: 0, golsTime1: 0, golsTime2: 0 };
        const jogos = (fixtures as any[]).map((f: any) => {
          const g1 = f.goals.home ?? 0;
          const g2 = f.goals.away ?? 0;
          if (g1 > g2) stats.vitorias1++;
          else if (g2 > g1) stats.vitorias2++;
          else stats.empates++;
          stats.golsTime1 += g1;
          stats.golsTime2 += g2;
          return {
            fixtureId: f.fixture.id,
            data: f.fixture.date,
            timeCasa: f.teams.home.name,
            timeCasaLogo: f.teams.home.logo,
            timeVisitante: f.teams.away.name,
            timeVisitanteLogo: f.teams.away.logo,
            placar: `${g1}-${g2}`,
            liga: f.league.name,
            temporada: f.league.season,
          };
        });
        return { jogos, stats };
      }),

    /** Ligas em que o time participa */
    ligas: protectedProcedure
      .input(z.object({ teamId: z.number(), season: z.number().default(2024) }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://v3.football.api-sports.io/leagues?team=${input.teamId}&season=${input.season}`,
          { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" } }
        );
        const json = await res.json() as any;
        return (json.response || []).map((l: any) => ({
          id: l.league.id,
          nome: l.league.name,
          logo: l.league.logo,
          pais: l.country.name,
          temporada: l.seasons?.[0]?.year,
        }));
      }),
  }),

  // ── LIGAS ────────────────────────────────────────────────────────────────
  ligasRouter: router({
    /** Tabela de classificação de uma liga */
    standings: publicProcedure
      .input(z.object({ ligaId: z.number(), season: z.number().default(2025) }))
      .query(async ({ input }) => getStandings(input.ligaId, input.season)),

    /** Próximos jogos de uma liga */
    proximosJogos: publicProcedure
      .input(z.object({ ligaId: z.number(), season: z.number().default(2025), count: z.number().default(10) }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?league=${input.ligaId}&season=${input.season}&next=${input.count}`,
          { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" } }
        );
        const json = await res.json() as any;
        return (json.response || []).map((f: any) => ({
          id: f.fixture.id,
          data: f.fixture.date,
          status: f.fixture.status.short,
          timeCasa: f.teams.home.name,
          timeCasaLogo: f.teams.home.logo,
          timeVisitante: f.teams.away.name,
          timeVisitanteLogo: f.teams.away.logo,
          rodada: f.league.round,
        }));
      }),

    /** Artilheiros de uma liga */
    artilheiros: publicProcedure
      .input(z.object({ ligaId: z.number(), season: z.number().default(2025) }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://v3.football.api-sports.io/players/topscorers?league=${input.ligaId}&season=${input.season}`,
          { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" } }
        );
        const json = await res.json() as any;
        return (json.response || []).slice(0, 10).map((p: any) => ({
          id: p.player.id,
          nome: p.player.name,
          foto: p.player.photo,
          time: p.statistics[0]?.team?.name ?? "",
          timeLogo: p.statistics[0]?.team?.logo ?? "",
          gols: p.statistics[0]?.goals?.total ?? 0,
          assistencias: p.statistics[0]?.goals?.assists ?? 0,
          jogos: p.statistics[0]?.games?.appearences ?? 0,
        }));
      }),

    /** Últimos resultados de uma liga */
    ultimosResultados: publicProcedure
      .input(z.object({ ligaId: z.number(), season: z.number().default(2025), count: z.number().default(10) }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?league=${input.ligaId}&season=${input.season}&last=${input.count}&status=FT`,
          { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" } }
        );
        const json = await res.json() as any;
        return (json.response || []).map((f: any) => ({
          id: f.fixture.id,
          data: f.fixture.date,
          timeCasa: f.teams.home.name,
          timeCasaLogo: f.teams.home.logo,
          timeVisitante: f.teams.away.name,
          timeVisitanteLogo: f.teams.away.logo,
          golsCasa: f.goals.home ?? 0,
          golsVisitante: f.goals.away ?? 0,
          rodada: f.league.round,
        }));
      }),
  }),

  // ── DESTAQUES DO DIA ────────────────────────────────────────────────────────
  destaques: router({
    /** Destaques do dia: rankings de times e jogadores */
    hoje: publicProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(({ input }) => getDestaquesHoje(input?.date)),
    /** Artilheiros avancados com analise completa */
    artilheiros: publicProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getArtilheirosAvancado(input?.date || new Date().toISOString().split('T')[0]);
      }),
    /** Artilheiros premium com histórico, comparações e gráficos */
    premium: publicProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getArtilheirosAvancado(input?.date || new Date().toISOString().split('T')[0]);
      }),
  }),

  // ── HISTÓRICO DE JOGOS AO VIVO ─────────────────────────────────────────────────────────────────────
  liveHistory: router({
    /** Salvar snapshot de jogo ao vivo no histórico */
    salvar: protectedProcedure
      .input(z.object({
        fixtureId: z.number(),
        jogo: z.string(),
        liga: z.string().optional(),
        paisBandeira: z.string().optional(),
        minuto: z.number().optional(),
        golsCasa: z.number().default(0),
        golsVisit: z.number().default(0),
        scoreCalor: z.number().default(0),
        nivelCalor: z.string().optional(),
        escanteiosCasa: z.number().default(0),
        escanteiosVisit: z.number().default(0),
        cartoesCasa: z.number().default(0),
        cartoesVisit: z.number().default(0),
        totalSinais: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const existente = await db.select({ id: liveGameHistory.id })
          .from(liveGameHistory)
          .where(and(
            eq(liveGameHistory.userId, ctx.user.id),
            eq(liveGameHistory.fixtureId, input.fixtureId),
            gte(liveGameHistory.createdAt, hoje)
          ))
          .limit(1);
        if (existente.length > 0) {
          await db.update(liveGameHistory)
            .set({ minuto: input.minuto, golsCasa: input.golsCasa, golsVisit: input.golsVisit, scoreCalor: input.scoreCalor, nivelCalor: input.nivelCalor, escanteiosCasa: input.escanteiosCasa, escanteiosVisit: input.escanteiosVisit, cartoesCasa: input.cartoesCasa, cartoesVisit: input.cartoesVisit, totalSinais: input.totalSinais })
            .where(eq(liveGameHistory.id, existente[0].id));
          return { id: existente[0].id, updated: true };
        }
        const [result] = await db.insert(liveGameHistory).values({ userId: ctx.user.id, fixtureId: input.fixtureId, jogo: input.jogo, liga: input.liga, paisBandeira: input.paisBandeira, minuto: input.minuto, golsCasa: input.golsCasa, golsVisit: input.golsVisit, scoreCalor: input.scoreCalor, nivelCalor: input.nivelCalor, escanteiosCasa: input.escanteiosCasa, escanteiosVisit: input.escanteiosVisit, cartoesCasa: input.cartoesCasa, cartoesVisit: input.cartoesVisit, totalSinais: input.totalSinais });
        return { id: (result as any).insertId, updated: false };
      }),

    /** Finalizar jogo com resultado real */
    finalizar: protectedProcedure
      .input(z.object({ fixtureId: z.number(), placarFinal: z.string(), golsOcorreram: z.boolean(), acertouTermometro: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(liveGameHistory)
          .set({ placarFinal: input.placarFinal, golsOcorreram: input.golsOcorreram, acertouTermometro: input.acertouTermometro })
          .where(and(eq(liveGameHistory.userId, ctx.user.id), eq(liveGameHistory.fixtureId, input.fixtureId)));
        return { success: true };
      }),

    /** Listar histórico com filtros */
    listar: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), nivelCalor: z.string().optional(), dataInicio: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions: ReturnType<typeof eq>[] = [eq(liveGameHistory.userId, ctx.user.id)];
        if (input?.nivelCalor) conditions.push(eq(liveGameHistory.nivelCalor, input.nivelCalor) as any);
        if (input?.dataInicio) conditions.push(gte(liveGameHistory.createdAt, new Date(input.dataInicio)) as any);
        return db.select().from(liveGameHistory).where(and(...conditions)).orderBy(sql`${liveGameHistory.createdAt} desc`).limit(input?.limit ?? 50).offset(input?.offset ?? 0);
      }),

    /** Estatísticas do termômetro */
    stats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(liveGameHistory).where(eq(liveGameHistory.userId, ctx.user.id));
      const total = rows.length;
      const comResultado = rows.filter(r => r.acertouTermometro !== null && r.acertouTermometro !== undefined);
      const acertos = comResultado.filter(r => r.acertouTermometro === true).length;
      const taxaAcerto = comResultado.length > 0 ? Math.round((acertos / comResultado.length) * 100) : 0;
      const porNivel = ["Gelado", "Morno", "Quente", "Vulcão"].map(nivel => {
        const doNivel = comResultado.filter(r => r.nivelCalor === nivel);
        const acertosNivel = doNivel.filter(r => r.acertouTermometro === true).length;
        return { nivel, total: doNivel.length, acertos: acertosNivel, taxa: doNivel.length > 0 ? Math.round((acertosNivel / doNivel.length) * 100) : 0 };
      });
      const comGols = rows.filter(r => r.golsOcorreram === true);
      const mediaCalorComGols = comGols.length > 0 ? Math.round(comGols.reduce((s, r) => s + (r.scoreCalor ?? 0), 0) / comGols.length) : 0;
      return { total, comResultado: comResultado.length, acertos, taxaAcerto, porNivel, mediaCalorComGols };
    }),
  }),
});
function detectarTipoMercado(mercado: string): string {
  const m = mercado.toLowerCase();
  if (m.includes("gol") || m.includes("over") || m.includes("under") || m.includes("0.5") || m.includes("1.5") || m.includes("2.5")) return "gols";
  if (m.includes("btts") || m.includes("ambas")) return "btts";
  if (m.includes("escanteio") || m.includes("corner")) return "escanteios";
  if (m.includes("cartão") || m.includes("cartao") || m.includes("card")) return "cartoes";
  if (m.includes("posse") || m.includes("possession")) return "posse";
  if (m.includes("chute") || m.includes("shot")) return "chutes";
  if (m.includes("pênalti") || m.includes("penalty")) return "penalti";
  if (m.includes("minuto") || m.includes("minute") || m.includes("tempo")) return "tempo_gol";
  if (m.includes("empate") || m.includes("draw") || m.includes("vitoria") || m.includes("win")) return "resultado";
  return "outros";
}

export type AppRouter = typeof appRouter;
