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

  // ---- Bots ----
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
  }),

  // ---- Canais ----
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

  // ---- Alertas ----
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

  // ---- Banca ----
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

  // ---- Apostas ----
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

  // ---- Pitacos ----
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
