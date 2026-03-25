import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Bots automáticos
export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  templateId: varchar("templateId", { length: 100 }),
  ativo: boolean("ativo").default(false).notNull(),
  confiancaMinima: int("confiancaMinima").default(70).notNull(),
  limiteDiario: int("limiteDiario").default(10).notNull(),
  totalSinais: int("totalSinais").default(0).notNull(),
  totalAcertos: int("totalAcertos").default(0).notNull(),
  regras: json("regras"),
  filtros: json("filtros"), // filtros avançados: ligas, minuto, placar, odds, etc.
  canal: varchar("canal", { length: 100 }).default("painel"),
  taxaAcerto: decimal("taxaAcerto", { precision: 5, scale: 2 }).default("0"),
  historicoPerformance: json("historicoPerformance"), // [{data: string, taxa: number}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

// Canais de notificação
export const canais = mysqlTable("canais", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["whatsapp_evolution", "whatsapp_zapi", "telegram", "email", "push"]).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: boolean("ativo").default(false).notNull(),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Canal = typeof canais.$inferSelect;
export type InsertCanal = typeof canais.$inferInsert;

// Alertas/Sinais gerados pelos bots
export const alertas = mysqlTable("alertas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  botId: int("botId"),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  liga: varchar("liga", { length: 255 }),
  mercado: varchar("mercado", { length: 255 }).notNull(),
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(),
  ev: decimal("ev", { precision: 8, scale: 2 }),
  confianca: int("confianca").notNull(),
  motivos: json("motivos"),
  resultado: mysqlEnum("resultado", ["pendente", "green", "red", "void"]).default("pendente").notNull(),
  enviado: boolean("enviado").default(false).notNull(),
  canaisEnviados: json("canaisEnviados"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alerta = typeof alertas.$inferSelect;
export type InsertAlerta = typeof alertas.$inferInsert;

// Banca do usuário
export const bancas = mysqlTable("bancas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).default("1000.00").notNull(),
  valorAtual: decimal("valorAtual", { precision: 12, scale: 2 }).default("1000.00").notNull(),
  stopLoss: decimal("stopLoss", { precision: 5, scale: 2 }).default("20.00").notNull(),
  stopGain: decimal("stopGain", { precision: 5, scale: 2 }).default("50.00").notNull(),
  kellyFracao: decimal("kellyFracao", { precision: 3, scale: 2 }).default("0.25").notNull(),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Banca = typeof bancas.$inferSelect;
export type InsertBanca = typeof bancas.$inferInsert;

// Registro de apostas
export const apostas = mysqlTable("apostas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertaId: int("alertaId"),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  mercado: varchar("mercado", { length: 255 }).notNull(),
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(),
  stake: decimal("stake", { precision: 12, scale: 2 }).notNull(),
  resultado: mysqlEnum("resultado", ["pendente", "green", "red", "void"]).default("pendente").notNull(),
  lucro: decimal("lucro", { precision: 12, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 2 }),
  dataJogo: timestamp("dataJogo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aposta = typeof apostas.$inferSelect;
export type InsertAposta = typeof apostas.$inferInsert;

// Pitacos (análises manuais)
export const pitacos = mysqlTable("pitacos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  liga: varchar("liga", { length: 255 }),
  mercado: varchar("mercado", { length: 255 }).notNull(),
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(),
  analise: text("analise"),
  confianca: int("confianca").default(70).notNull(),
  resultado: mysqlEnum("resultado", ["pendente", "green", "red", "void"]).default("pendente").notNull(),
  // Multi-mercado: array de { tipo, label, valorPrevisto, valorReal, acertou, peso }
  mercadosPrevistos: json("mercadosPrevistos"),
  // Score de precisão calculado: 0-100 (acertos ponderados / total de mercados)
  scorePrevisao: decimal("scorePrevisao", { precision: 5, scale: 2 }),
  // Placar final real
  placarFinal: varchar("placarFinal", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pitaco = typeof pitacos.$inferSelect;
export type InsertPitaco = typeof pitacos.$inferInsert;

// Push Subscriptions (Web Push Notifications)
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscriptionRecord = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Histórico de jogos ao vivo (termômetro de calor)
export const liveGameHistory = mysqlTable("live_game_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  liga: varchar("liga", { length: 255 }),
  paisBandeira: varchar("paisBandeira", { length: 10 }),
  minuto: int("minuto"),
  golsCasa: int("golsCasa").default(0),
  golsVisit: int("golsVisit").default(0),
  scoreCalor: int("scoreCalor").default(0),
  nivelCalor: varchar("nivelCalor", { length: 20 }),
  escanteiosCasa: int("escanteiosCasa").default(0),
  escanteiosVisit: int("escanteiosVisit").default(0),
  cartoesCasa: int("cartoesCasa").default(0),
  cartoesVisit: int("cartoesVisit").default(0),
  totalSinais: int("totalSinais").default(0),
  golsOcorreram: boolean("golsOcorreram").default(false),
  placarFinal: varchar("placarFinal", { length: 20 }),
  acertouTermometro: boolean("acertouTermometro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LiveGameHistoryRecord = typeof liveGameHistory.$inferSelect;
export type InsertLiveGameHistory = typeof liveGameHistory.$inferInsert;
