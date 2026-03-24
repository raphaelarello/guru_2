import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock das funções de banco de dados
vi.mock("./db", () => ({
  getBotsByUserId: vi.fn().mockResolvedValue([]),
  createBot: vi.fn().mockResolvedValue({ id: 1, nome: "Bot Teste", ativo: false, userId: 1, confiancaMinima: 75, limiteDiario: 10, totalSinais: 0, totalAcertos: 0, createdAt: new Date(), updatedAt: new Date() }),
  updateBot: vi.fn().mockResolvedValue({ id: 1, ativo: true }),
  deleteBot: vi.fn().mockResolvedValue(undefined),
  getCanaisByUserId: vi.fn().mockResolvedValue([]),
  upsertCanal: vi.fn().mockResolvedValue({ id: 1, tipo: "telegram", nome: "Telegram", ativo: true }),
  updateCanal: vi.fn().mockResolvedValue({ id: 1, ativo: false }),
  getAlertasByUserId: vi.fn().mockResolvedValue([]),
  createAlerta: vi.fn().mockResolvedValue({ id: 1, jogo: "Flamengo vs Palmeiras", mercado: "Over 2.5", odd: "1.85", confianca: 80, resultado: "pendente", userId: 1, createdAt: new Date(), updatedAt: new Date() }),
  updateAlerta: vi.fn().mockResolvedValue({ id: 1, resultado: "green" }),
  getBancaByUserId: vi.fn().mockResolvedValue(null),
  upsertBanca: vi.fn().mockResolvedValue({ id: 1, valorTotal: "1000.00", valorAtual: "1000.00", stopLoss: "20.00", stopGain: "50.00", kellyFracao: "0.25", userId: 1 }),
  getApostasByUserId: vi.fn().mockResolvedValue([]),
  createAposta: vi.fn().mockResolvedValue({ id: 1, jogo: "Flamengo vs Palmeiras", mercado: "Over 2.5", odd: "1.85", stake: "50.00", resultado: "pendente", userId: 1, createdAt: new Date(), updatedAt: new Date() }),
  updateAposta: vi.fn().mockResolvedValue({ id: 1, resultado: "green", lucro: "42.50" }),
  getPitacosByUserId: vi.fn().mockResolvedValue([]),
  createPitaco: vi.fn().mockResolvedValue({ id: 1, jogo: "Flamengo vs Palmeiras", mercado: "BTTS", odd: "1.75", confianca: 70, resultado: "pendente", userId: 1, createdAt: new Date(), updatedAt: new Date() }),
  updatePitaco: vi.fn().mockResolvedValue({ id: 1, resultado: "green" }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("retorna o usuário autenticado", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.id).toBe(1);
    expect(user?.name).toBe("Test User");
  });

  it("faz logout e limpa o cookie", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("bots", () => {
  it("lista bots do usuário", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const bots = await caller.bots.list();
    expect(Array.isArray(bots)).toBe(true);
  });

  it("cria um novo bot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const bot = await caller.bots.create({ nome: "Bot Teste", confiancaMinima: 75, limiteDiario: 10 });
    expect(bot?.nome).toBe("Bot Teste");
    expect(bot?.ativo).toBe(false);
  });

  it("ativa/desativa um bot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bots.toggleAtivo({ id: 1, ativo: true });
    expect(result?.ativo).toBe(true);
  });

  it("deleta um bot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.bots.delete({ id: 1 })).resolves.not.toThrow();
  });
});

describe("canais", () => {
  it("lista canais do usuário", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const canais = await caller.canais.list();
    expect(Array.isArray(canais)).toBe(true);
  });

  it("configura canal Telegram", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const canal = await caller.canais.upsert({ tipo: "telegram", nome: "Telegram Bot", ativo: true, config: { botToken: "123:ABC", chatId: "-100123" } });
    expect(canal?.tipo).toBe("telegram");
    expect(canal?.ativo).toBe(true);
  });
});

describe("alertas", () => {
  it("lista alertas do usuário", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const alertas = await caller.alertas.list();
    expect(Array.isArray(alertas)).toBe(true);
  });

  it("cria um alerta", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const alerta = await caller.alertas.create({ jogo: "Flamengo vs Palmeiras", mercado: "Over 2.5", odd: "1.85", confianca: 80 });
    expect(alerta?.jogo).toBe("Flamengo vs Palmeiras");
    expect(alerta?.resultado).toBe("pendente");
  });

  it("atualiza resultado do alerta", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.alertas.updateResultado({ id: 1, resultado: "green" });
    expect(result?.resultado).toBe("green");
  });
});

describe("banca", () => {
  it("retorna null quando banca não existe", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const banca = await caller.banca.get();
    expect(banca).toBeNull();
  });

  it("cria/atualiza banca", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const banca = await caller.banca.upsert({ valorTotal: "1000.00", stopLoss: "20.00", stopGain: "50.00", kellyFracao: "0.25" });
    expect(banca?.valorTotal).toBe("1000.00");
  });
});

describe("apostas", () => {
  it("lista apostas do usuário", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const apostas = await caller.apostas.list();
    expect(Array.isArray(apostas)).toBe(true);
  });

  it("registra uma aposta", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const aposta = await caller.apostas.create({ jogo: "Flamengo vs Palmeiras", mercado: "Over 2.5", odd: "1.85", stake: "50.00" });
    expect(aposta?.jogo).toBe("Flamengo vs Palmeiras");
    expect(aposta?.resultado).toBe("pendente");
  });

  it("atualiza resultado da aposta com lucro", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.apostas.updateResultado({ id: 1, resultado: "green", lucro: "42.50", roi: "85.00" });
    expect(result?.resultado).toBe("green");
  });
});

describe("pitacos", () => {
  it("lista pitacos do usuário", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pitacos = await caller.pitacos.list();
    expect(Array.isArray(pitacos)).toBe(true);
  });

  it("cria um pitaco", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pitaco = await caller.pitacos.create({ jogo: "Flamengo vs Palmeiras", mercado: "BTTS", odd: "1.75", confianca: 70 });
    expect(pitaco?.jogo).toBe("Flamengo vs Palmeiras");
  });

  it("atualiza resultado do pitaco", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pitacos.updateResultado({ id: 1, resultado: "green" });
    expect(result?.resultado).toBe("green");
  });
});
