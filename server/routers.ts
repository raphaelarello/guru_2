import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getBotsByUserId, createBot, updateBot, deleteBot,
  getCanaisByUserId, upsertCanal, updateCanal,
  getAlertasByUserId, createAlerta, updateAlerta,
  getBancaByUserId, upsertBanca,
  getApostasByUserId, createAposta, updateAposta,
  getPitacosByUserId, createPitaco, updatePitaco,
} from "./db";
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
  getTeamSeasonStats,
  getApiStatus,
  analisarOportunidades,
  clearCache,
  getCacheStats,
  getBlockStatus,
} from "./football";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
      }))
      .mutation(({ ctx, input }) => updateAlerta(input.id, ctx.user.id, { resultado: input.resultado })),
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
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(({ ctx, input }) => getPitacosByUserId(ctx.user.id, input?.limit)),
    create: protectedProcedure
      .input(z.object({
        jogo: z.string(),
        liga: z.string().optional(),
        mercado: z.string(),
        odd: z.string(),
        analise: z.string().optional(),
        confianca: z.number().min(0).max(100).default(70),
      }))
      .mutation(({ ctx, input }) => createPitaco({ ...input, userId: ctx.user.id })),
    updateResultado: protectedProcedure
      .input(z.object({
        id: z.number(),
        resultado: z.enum(["pendente", "green", "red", "void"]),
      }))
      .mutation(({ ctx, input }) => updatePitaco(input.id, ctx.user.id, { resultado: input.resultado })),
  }),
});

export type AppRouter = typeof appRouter;
