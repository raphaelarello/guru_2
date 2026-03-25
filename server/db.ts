import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  bots, InsertBot,
  canais, InsertCanal,
  alertas, InsertAlerta,
  bancas, InsertBanca,
  apostas, InsertAposta,
  pitacos, InsertPitaco,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---- Users ----
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Bots ----
export async function getBotsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bots).where(eq(bots.userId, userId)).orderBy(desc(bots.createdAt));
}

export async function createBot(data: InsertBot) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(bots).values(data);
  const result = await db.select().from(bots).where(eq(bots.userId, data.userId)).orderBy(desc(bots.createdAt)).limit(1);
  return result[0];
}

export async function getBotById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bots).where(and(eq(bots.id, id), eq(bots.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function updateBot(id: number, userId: number, data: Partial<InsertBot>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(bots).set(data).where(and(eq(bots.id, id), eq(bots.userId, userId)));
  const result = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  return result[0];
}

export async function deleteBot(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bots).where(and(eq(bots.id, id), eq(bots.userId, userId)));
}

// ---- Canais ----
export async function getCanaisByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(canais).where(eq(canais.userId, userId)).orderBy(desc(canais.createdAt));
}

export async function upsertCanal(data: InsertCanal) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(canais).values(data).onDuplicateKeyUpdate({ set: { ...data } });
  const result = await db.select().from(canais).where(and(eq(canais.userId, data.userId), eq(canais.tipo, data.tipo))).limit(1);
  return result[0];
}

export async function updateCanal(id: number, userId: number, data: Partial<InsertCanal>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(canais).set(data).where(and(eq(canais.id, id), eq(canais.userId, userId)));
  const result = await db.select().from(canais).where(eq(canais.id, id)).limit(1);
  return result[0];
}

// ---- Alertas ----
export async function getAlertasByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertas).where(eq(alertas.userId, userId)).orderBy(desc(alertas.createdAt)).limit(limit);
}

export async function createAlerta(data: InsertAlerta) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(alertas).values(data);
  const result = await db.select().from(alertas).where(eq(alertas.userId, data.userId)).orderBy(desc(alertas.createdAt)).limit(1);
  return result[0];
}

export async function updateAlerta(id: number, userId: number, data: Partial<InsertAlerta>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(alertas).set(data).where(and(eq(alertas.id, id), eq(alertas.userId, userId)));
  const result = await db.select().from(alertas).where(eq(alertas.id, id)).limit(1);
  return result[0];
}

// ---- Banca ----
export async function getBancaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bancas).where(eq(bancas.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertBanca(data: InsertBanca) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(bancas).values(data).onDuplicateKeyUpdate({ set: { ...data } });
  const result = await db.select().from(bancas).where(eq(bancas.userId, data.userId)).limit(1);
  return result[0];
}

// ---- Apostas ----
export async function getApostasByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apostas).where(eq(apostas.userId, userId)).orderBy(desc(apostas.createdAt)).limit(limit);
}

export async function createAposta(data: InsertAposta) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(apostas).values(data);
  const result = await db.select().from(apostas).where(eq(apostas.userId, data.userId)).orderBy(desc(apostas.createdAt)).limit(1);
  return result[0];
}

export async function updateAposta(id: number, userId: number, data: Partial<InsertAposta>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(apostas).set(data).where(and(eq(apostas.id, id), eq(apostas.userId, userId)));
  const result = await db.select().from(apostas).where(eq(apostas.id, id)).limit(1);
  return result[0];
}

// ---- Pitacos ----
export async function getPitacosByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pitacos).where(eq(pitacos.userId, userId)).orderBy(desc(pitacos.createdAt)).limit(limit);
}

export async function createPitaco(data: InsertPitaco) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(pitacos).values(data);
  const result = await db.select().from(pitacos).where(eq(pitacos.userId, data.userId)).orderBy(desc(pitacos.createdAt)).limit(1);
  return result[0];
}

export async function updatePitaco(id: number, userId: number, data: Partial<InsertPitaco>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pitacos).set(data).where(and(eq(pitacos.id, id), eq(pitacos.userId, userId)));
  const result = await db.select().from(pitacos).where(eq(pitacos.id, id)).limit(1);
  return result[0];
}
