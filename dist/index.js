var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  db: () => db,
  default: () => schema_default
});
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __dir, DATA, DB_FILE, db, insertPlan, seedPlans, schema_default, insertBotTemplate, seedBotTemplates;
var init_schema = __esm({
  "server/db/schema.ts"() {
    "use strict";
    __dir = path.dirname(fileURLToPath(import.meta.url));
    DATA = path.resolve(process.cwd(), "data");
    DB_FILE = path.join(DATA, "rapha.db");
    fs.mkdirSync(DATA, { recursive: true });
    db = new Database(DB_FILE);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("synchronous = NORMAL");
    db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'free',
    avatar_url    TEXT,
    phone         TEXT,
    cpf           TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    email_verified INTEGER NOT NULL DEFAULT 0,
    verify_token  TEXT,
    reset_token   TEXT,
    reset_expires INTEGER,
    last_login_at INTEGER,
    login_count   INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS plans (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    description   TEXT,
    price_monthly REAL NOT NULL DEFAULT 0,
    price_annual  REAL,
    features      TEXT NOT NULL DEFAULT '[]',
    limits        TEXT NOT NULL DEFAULT '{}',
    badge_color   TEXT DEFAULT '#3b82f6',
    is_active     INTEGER NOT NULL DEFAULT 1,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_slug           TEXT    NOT NULL,
    status              TEXT    NOT NULL DEFAULT 'pending',
    billing_cycle       TEXT    NOT NULL DEFAULT 'monthly',
    amount_brl          REAL    NOT NULL DEFAULT 0,
    payment_method      TEXT,
    gateway             TEXT    DEFAULT 'pagarme',
    gateway_sub_id      TEXT,
    gateway_customer_id TEXT,
    period_start        INTEGER,
    period_end          INTEGER,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    cancelled_at        INTEGER,
    cancel_reason       TEXT,
    next_billing_at     INTEGER,
    trial_ends_at       INTEGER,
    created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at          INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    subscription_id INTEGER REFERENCES subscriptions(id),
    amount_brl      REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending',
    method          TEXT    NOT NULL,
    gateway         TEXT    NOT NULL DEFAULT 'pagarme',
    gateway_order_id TEXT,
    gateway_charge_id TEXT,
    pix_qr_code     TEXT,
    pix_qr_base64   TEXT,
    pix_expires_at  INTEGER,
    boleto_url      TEXT,
    boleto_barcode  TEXT,
    boleto_expires_at INTEGER,
    paid_at         INTEGER,
    refunded_at     INTEGER,
    failure_reason  TEXT,
    gateway_payload TEXT,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti        TEXT    NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT    NOT NULL,
    meta       TEXT,
    ip_address TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    type       TEXT    NOT NULL DEFAULT 'info',
    read       INTEGER NOT NULL DEFAULT 0,
    action_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS automation_accounts (
    id                  TEXT PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bookmaker           TEXT NOT NULL,
    name                TEXT NOT NULL,
    username            TEXT NOT NULL,
    encrypted_password  TEXT NOT NULL,
    maxDailyStake       REAL NOT NULL DEFAULT 500,
    maxSingleStake      REAL NOT NULL DEFAULT 100,
    maxOddsAccepted     REAL NOT NULL DEFAULT 10,
    minOddsAccepted     REAL NOT NULL DEFAULT 1.05,
    enabled             INTEGER NOT NULL DEFAULT 1,
    createdAt           TEXT NOT NULL,
    updated_at          INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action       TEXT NOT NULL,
    meta         TEXT,
    ip_address   TEXT,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
  CREATE INDEX IF NOT EXISTS idx_subs_user_status  ON subscriptions(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_payments_user     ON payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_user_time   ON usage_logs(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_jti      ON sessions(jti);
  CREATE INDEX IF NOT EXISTS idx_notif_user_read   ON notifications(user_id, read);
  CREATE INDEX IF NOT EXISTS idx_auto_accounts_user ON automation_accounts(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_actor   ON audit_logs(actor_user_id, created_at);
`);
    insertPlan = db.prepare(`
  INSERT OR IGNORE INTO plans
    (slug, name, description, price_monthly, price_annual, features, limits, badge_color, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
    seedPlans = db.transaction(() => {
      insertPlan.run(
        "free",
        "Gratuito",
        "Explore sem compromisso",
        0,
        null,
        JSON.stringify(["5 an\xE1lises/dia", "2 favoritos", "Hist\xF3rico 7 dias"]),
        JSON.stringify({ analyses_per_day: 5, favorites: 2, betslip: 3, history_days: 7 }),
        "#6b7280",
        0
      );
      insertPlan.run(
        "basic",
        "B\xE1sico",
        "Para apostadores casuais",
        29.9,
        239.9,
        JSON.stringify(["30 an\xE1lises/dia", "20 favoritos", "Hist\xF3rico 30 dias", "Suporte por e-mail"]),
        JSON.stringify({ analyses_per_day: 30, favorites: 20, betslip: 10, history_days: 30 }),
        "#3b82f6",
        1
      );
      insertPlan.run(
        "pro",
        "Pro",
        "Para apostadores s\xE9rios",
        69.9,
        559.9,
        JSON.stringify(["An\xE1lises ilimitadas", "Favoritos ilimitados", "Hist\xF3rico 90 dias", "Value bets", "Alertas ao vivo", "Suporte priorit\xE1rio"]),
        JSON.stringify({ analyses_per_day: -1, favorites: -1, betslip: 20, history_days: 90 }),
        "#a855f7",
        2
      );
      insertPlan.run(
        "elite",
        "Elite",
        "Tudo sem limites",
        149.9,
        1199.9,
        JSON.stringify(["Tudo do Pro", "Automa\xE7\xE3o de apostas", "Hist\xF3rico ilimitado", "Relat\xF3rios PDF", "API de dados", "Suporte VIP 24/7"]),
        JSON.stringify({ analyses_per_day: -1, favorites: -1, betslip: -1, history_days: -1 }),
        "#f59e0b",
        3
      );
    });
    seedPlans();
    (function ensureAdmin() {
      const existing = db.prepare(`SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`).get();
      if (existing) {
        const hasSub = db.prepare(`SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`).get(existing.id);
        if (!hasSub) {
          db.prepare(`
        INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start)
        VALUES (?, 'elite', 'active', 'monthly', 0, unixepoch())
      `).run(existing.id);
        }
        return;
      }
      if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
        console.warn("[DB] Nenhum admin bootstrapado. Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o primeiro administrador.");
        return;
      }
      const adminEmail = process.env.ADMIN_EMAIL || "admin@raphaguru.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "superadmin";
      const hash = bcrypt.hashSync(adminPassword, 10);
      db.prepare(`
    INSERT INTO users (email, name, password_hash, role, is_active, email_verified)
    VALUES (?, 'Administrador', ?, 'admin', 1, 1)
  `).run(adminEmail, hash);
      const adminId = db.prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`).get(adminEmail).id;
      db.prepare(`
    INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start)
    VALUES (?, 'elite', 'active', 'monthly', 0, unixepoch())
  `).run(adminId);
      console.log(`[DB] \u2713 ${adminEmail} bootstrapado`);
    })();
    console.log("[DB] SQLite pronto:", DB_FILE);
    schema_default = db;
    db.exec(`
  CREATE TABLE IF NOT EXISTS crm_contacts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name          TEXT    NOT NULL,
    email         TEXT,
    phone         TEXT,
    telegram_id   TEXT,
    status        TEXT    NOT NULL DEFAULT 'prospect',
    plan_interest TEXT,
    notes         TEXT,
    tags          TEXT    DEFAULT '[]',
    last_contact_at INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    type          TEXT    NOT NULL DEFAULT 'email',
    status        TEXT    NOT NULL DEFAULT 'draft',
    audience      TEXT    NOT NULL DEFAULT 'all',
    audience_filter TEXT  DEFAULT '{}',
    subject       TEXT,
    body          TEXT    NOT NULL DEFAULT '',
    art_url       TEXT,
    scheduled_at  INTEGER,
    sent_at       INTEGER,
    sent_count    INTEGER DEFAULT 0,
    open_count    INTEGER DEFAULT 0,
    click_count   INTEGER DEFAULT 0,
    created_by    INTEGER REFERENCES users(id),
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS campaign_sends (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id   INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    contact_id    INTEGER REFERENCES crm_contacts(id) ON DELETE SET NULL,
    channel       TEXT    NOT NULL DEFAULT 'email',
    status        TEXT    NOT NULL DEFAULT 'pending',
    sent_at       INTEGER,
    opened_at     INTEGER,
    error         TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS financial_rules (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    trigger_type  TEXT    NOT NULL,
    days_before   INTEGER DEFAULT 0,
    channel       TEXT    NOT NULL DEFAULT 'email',
    template_id   INTEGER REFERENCES campaigns(id),
    audience      TEXT    DEFAULT 'all',
    is_active     INTEGER NOT NULL DEFAULT 1,
    last_run_at   INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS financial_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          TEXT    NOT NULL,
    amount        REAL,
    due_date      INTEGER,
    paid_date     INTEGER,
    status        TEXT    NOT NULL DEFAULT 'open',
    notes         TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_crm_status    ON crm_contacts(status);
  CREATE INDEX IF NOT EXISTS idx_camp_status   ON campaigns(status);
  CREATE INDEX IF NOT EXISTS idx_fin_user      ON financial_events(user_id, status);
`);
    db.exec(`
  CREATE TABLE IF NOT EXISTS bot_templates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    description   TEXT NOT NULL,
    category      TEXT NOT NULL,
    mode          TEXT NOT NULL DEFAULT 'live',
    default_channels TEXT NOT NULL DEFAULT '[]',
    config_json   TEXT NOT NULL DEFAULT '{}',
    ai_ready      INTEGER NOT NULL DEFAULT 1,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS user_bots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id   INTEGER REFERENCES bot_templates(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    category      TEXT NOT NULL,
    mode          TEXT NOT NULL DEFAULT 'live',
    status        TEXT NOT NULL DEFAULT 'active',
    config_json   TEXT NOT NULL DEFAULT '{}',
    channels_json TEXT NOT NULL DEFAULT '["app"]',
    run_count     INTEGER NOT NULL DEFAULT 0,
    alert_count   INTEGER NOT NULL DEFAULT 0,
    win_count     INTEGER NOT NULL DEFAULT 0,
    loss_count    INTEGER NOT NULL DEFAULT 0,
    roi_units     REAL    NOT NULL DEFAULT 0,
    last_run_at   INTEGER,
    last_alert_at INTEGER,
    next_run_at   INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS bot_runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    bot_id        INTEGER NOT NULL REFERENCES user_bots(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scanned_count INTEGER NOT NULL DEFAULT 0,
    matched_count INTEGER NOT NULL DEFAULT 0,
    alerts_sent   INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'done',
    started_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at      INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS bot_alerts (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    bot_id           INTEGER NOT NULL REFERENCES user_bots(id) ON DELETE CASCADE,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id         TEXT NOT NULL,
    match_label      TEXT NOT NULL,
    league           TEXT,
    market           TEXT NOT NULL,
    signal_json      TEXT NOT NULL DEFAULT '{}',
    channel_status_json TEXT NOT NULL DEFAULT '{}',
    outcome_status   TEXT NOT NULL DEFAULT 'pending',
    triggered_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    sent_at          INTEGER,
    resolved_at      INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_bot_templates_slug  ON bot_templates(slug);
  CREATE INDEX IF NOT EXISTS idx_user_bots_user      ON user_bots(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_bot_alerts_user     ON bot_alerts(user_id, triggered_at DESC);
  CREATE INDEX IF NOT EXISTS idx_bot_runs_user       ON bot_runs(user_id, started_at DESC);
`);
    insertBotTemplate = db.prepare(`
  INSERT OR IGNORE INTO bot_templates
    (slug, name, description, category, mode, default_channels, config_json, ai_ready, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
`);
    seedBotTemplates = db.transaction(() => {
      insertBotTemplate.run(
        "over15-2t-live",
        "Over 1.5 no 2\xBA tempo - Ao Vivo",
        "Bot focado em jogos que chegam ao 2\xBA tempo ainda vivos e com press\xE3o forte para abertura em gols.",
        "over15_2t_live",
        "live",
        JSON.stringify(["app", "whatsapp"]),
        JSON.stringify({ category: "over15_2t_live", mode: "live", minMinute: 46, maxGoals: 2, minPressure: 72, minDangerousAttacks: 110, maxOver25Odds: 2.1, cooldownMinutes: 30, requireLevel: "medium" }),
        1
      );
      insertBotTemplate.run(
        "over05-ft-live",
        "Over 0.5 FT",
        "Bot focado em identificar oportunidades de entrada no in\xEDcio do primeiro tempo com press\xE3o e volume suficientes.",
        "over05_ft_live",
        "live",
        JSON.stringify(["app", "whatsapp"]),
        JSON.stringify({ category: "over05_ft_live", mode: "live", maxMinute: 35, maxGoals: 0, minPressure: 65, minDangerousAttacks: 75, minTotalCorners: 3, cooldownMinutes: 20, requireLevel: "medium" }),
        2
      );
      insertBotTemplate.run(
        "over05-55-live",
        "Over 0.5 aos 55'",
        "Bot focado em jogos que chegam aos 55 minutos zerados, mas com sinais fortes de press\xE3o, ataques perigosos e cantos.",
        "over05_55_live",
        "live",
        JSON.stringify(["app", "whatsapp", "email"]),
        JSON.stringify({ category: "over05_55_live", mode: "live", minMinute: 55, maxGoals: 0, minPressure: 74, minDangerousAttacks: 120, minTotalCorners: 7, cooldownMinutes: 20, requireLevel: "strong" }),
        3
      );
      insertBotTemplate.run(
        "corners-pressure-live",
        "Escanteios por Press\xE3o",
        "Bot focado em partidas que mostram press\xE3o extrema e volume alto de cantos.",
        "corners_pressure_live",
        "live",
        JSON.stringify(["app", "whatsapp"]),
        JSON.stringify({ category: "corners_pressure_live", mode: "live", minMinute: 30, minPressure: 76, minTotalCorners: 7, cooldownMinutes: 25, requireLevel: "medium" }),
        4
      );
      insertBotTemplate.run(
        "cards-pressure-live",
        "Cart\xF5es por Temperatura",
        "Bot focado em jogos nervosos, com cart\xF5es cedo e ritmo intenso.",
        "cards_pressure_live",
        "live",
        JSON.stringify(["app", "email"]),
        JSON.stringify({ category: "cards_pressure_live", mode: "live", minMinute: 25, minCards: 2, minDangerousAttacks: 80, cooldownMinutes: 25, requireLevel: "medium" }),
        5
      );
      insertBotTemplate.run(
        "home-favorite-value",
        "Favorito com Valor",
        "Bot pr\xE9-jogo/h\xEDbrido para identificar mandantes favoritos ainda com pre\xE7o aceit\xE1vel e sinais extras de dom\xEDnio.",
        "home_favorite_value",
        "hybrid",
        JSON.stringify(["app", "email"]),
        JSON.stringify({ category: "home_favorite_value", mode: "hybrid", minHomeOdds: 1.5, maxHomeOdds: 1.95, cooldownMinutes: 120, requireLevel: "medium" }),
        6
      );
    });
    seedBotTemplates();
  }
});

// server/lib/plans.ts
function getActiveSubscription(userId) {
  return schema_default.prepare(`
    SELECT s.*, p.name as plan_name, p.features, p.limits, p.price_monthly, p.badge_color
    FROM subscriptions s
    JOIN plans p ON p.slug = s.plan_slug
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get(userId);
}
function ensureSubscriptionConsistency(userId) {
  const now = Math.floor(Date.now() / 1e3);
  const active = getActiveSubscription(userId);
  if (active && active.plan_slug !== "free" && active.period_end && Number(active.period_end) < now) {
    schema_default.prepare(`
      UPDATE subscriptions
      SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, unixepoch()), updated_at = unixepoch()
      WHERE id = ?
    `).run(active.id);
    const free = schema_default.prepare(`SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' AND plan_slug = 'free' LIMIT 1`).get(userId);
    if (!free) {
      schema_default.prepare(`
        INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start, period_end)
        VALUES (?, 'free', 'active', 'monthly', 0, unixepoch(), unixepoch() + 31536000)
      `).run(userId);
    }
    schema_default.prepare(`UPDATE users SET role = 'free', updated_at = unixepoch() WHERE id = ? AND role != 'admin'`).run(userId);
    return getActiveSubscription(userId) ?? null;
  }
  return active ?? null;
}
function getEffectivePlanSlug(userId, role) {
  if (role === "admin") return "admin";
  const sub = ensureSubscriptionConsistency(userId);
  return String(sub?.plan_slug ?? role ?? "free");
}
var PLAN_RANK;
var init_plans = __esm({
  "server/lib/plans.ts"() {
    "use strict";
    init_schema();
    PLAN_RANK = {
      free: 0,
      basic: 1,
      pro: 2,
      elite: 3,
      admin: 99
    };
  }
});

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
function signToken(user) {
  const jti = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const token = jwt.sign({ ...user, jti }, JWT_SECRET, { expiresIn: "30d" });
  schema_default.prepare(`
    INSERT INTO sessions (user_id, jti, expires_at)
    VALUES (?, ?, unixepoch() + 2592000)
  `).run(user.id, jti);
  return token;
}
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token obrigat\xF3rio" });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const session = schema_default.prepare(`SELECT id FROM sessions WHERE jti = ? AND expires_at > unixepoch()`).get(payload.jti);
    if (!session) {
      res.status(401).json({ error: "Sess\xE3o expirada" });
      return;
    }
    const user = schema_default.prepare(`SELECT id, email, name, role, is_active FROM users WHERE id = ?`).get(payload.id);
    if (!user || !user.is_active) {
      res.status(401).json({ error: "Conta inativa" });
      return;
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      jti: payload.jti,
      ...payload.impersonated_by ? { impersonated_by: payload.impersonated_by } : {}
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inv\xE1lido" });
  }
}
function requirePlan(min) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const plan = getEffectivePlanSlug(req.user.id, req.user.role);
    if ((PLAN_RANK[plan] ?? 0) < (PLAN_RANK[min] ?? 0)) {
      res.status(403).json({ error: `Plano m\xEDnimo: ${min}`, upgrade_url: "/planos", current_plan: plan });
      return;
    }
    next();
  };
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Acesso restrito a admins" });
    return;
  }
  next();
}
var JWT_SECRET;
var init_auth = __esm({
  "server/middleware/auth.ts"() {
    "use strict";
    init_schema();
    init_plans();
    JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "rapha-guru-dev-secret-MUDE-EM-PRODUCAO");
    if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
      throw new Error("JWT_SECRET obrigat\xF3rio em produ\xE7\xE3o");
    }
  }
});

// server/lib/audit.ts
function writeAuditLog(actorUserId, action, meta, targetUserId, ip) {
  try {
    schema_default.prepare(`
      INSERT INTO audit_logs (actor_user_id, target_user_id, action, meta, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(actorUserId, targetUserId ?? null, action, meta ? JSON.stringify(meta) : null, ip ?? null);
  } catch {
  }
}
var init_audit = __esm({
  "server/lib/audit.ts"() {
    "use strict";
    init_schema();
  }
});

// server/routes/auth.ts
var auth_exports = {};
__export(auth_exports, {
  default: () => auth_default
});
import { Router as Router2 } from "express";
import bcrypt2 from "bcryptjs";
import nodemailer2 from "nodemailer";
import crypto3 from "crypto";
function serializeSubscription(sub) {
  return sub ? {
    ...sub,
    features: JSON.parse(String(sub.features ?? "[]")),
    limits: JSON.parse(String(sub.limits ?? "{}"))
  } : null;
}
function getSubscription(userId) {
  return ensureSubscriptionConsistency(userId);
}
async function getMailer2() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer2.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}
var router3, SALT, auth_default;
var init_auth2 = __esm({
  "server/routes/auth.ts"() {
    "use strict";
    init_schema();
    init_auth();
    init_plans();
    init_audit();
    router3 = Router2();
    SALT = 12;
    router3.post("/register", async (req, res) => {
      try {
        const { email, name, password, phone } = req.body;
        if (!email || !name || !password) return res.status(400).json({ error: "email, nome e senha s\xE3o obrigat\xF3rios" });
        if (password.length < 8) return res.status(400).json({ error: "Senha deve ter ao menos 8 caracteres" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Email inv\xE1lido" });
        const normalizedEmail = email.toLowerCase().trim();
        const exists = schema_default.prepare(`SELECT id FROM users WHERE email = ?`).get(normalizedEmail);
        if (exists) return res.status(409).json({ error: "Email j\xE1 cadastrado" });
        const hash = await bcrypt2.hash(password, SALT);
        const result = schema_default.prepare(`
      INSERT INTO users (email, name, password_hash, phone, role)
      VALUES (?, ?, ?, ?, 'free')
    `).run(normalizedEmail, name.trim(), hash, phone ?? null);
        const userId = Number(result.lastInsertRowid);
        schema_default.prepare(`
      INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start, period_end)
      VALUES (?, 'free', 'active', 'monthly', 0, unixepoch(), unixepoch() + 31536000)
    `).run(userId);
        schema_default.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, '\u{1F389} Bem-vindo ao Rapha Guru!', 'Sua conta foi criada. Explore as an\xE1lises e fa\xE7a upgrade quando quiser.', 'success')
    `).run(userId);
        const user = schema_default.prepare(`SELECT id, email, name, role FROM users WHERE id = ?`).get(userId);
        writeAuditLog(userId, "auth.register", { email: normalizedEmail }, userId, req.ip ?? null);
        res.status(201).json({ token: signToken(user), user, subscription: serializeSubscription(getSubscription(userId)) });
      } catch (err) {
        console.error("[auth/register]", err);
        res.status(500).json({ error: "Erro interno" });
      }
    });
    router3.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email e senha obrigat\xF3rios" });
        const user = schema_default.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim());
        if (!user) return res.status(401).json({ error: "Email ou senha incorretos" });
        if (!user.is_active) return res.status(403).json({ error: "Conta desativada" });
        const valid = await bcrypt2.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "Email ou senha incorretos" });
        schema_default.prepare(`UPDATE users SET last_login_at = unixepoch(), login_count = login_count + 1 WHERE id = ?`).run(user.id);
        const sub = getSubscription(user.id);
        writeAuditLog(user.id, "auth.login", void 0, user.id, req.ip ?? null);
        res.json({
          token: signToken({ id: user.id, email: user.email, name: user.name, role: user.role }),
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          subscription: serializeSubscription(sub)
        });
      } catch (err) {
        console.error("[auth/login]", err);
        res.status(500).json({ error: "Erro interno" });
      }
    });
    router3.post("/logout", requireAuth, (req, res) => {
      schema_default.prepare(`DELETE FROM sessions WHERE jti = ?`).run(req.user.jti);
      writeAuditLog(req.user.id, "auth.logout", void 0, req.user.id, req.ip ?? null);
      res.json({ ok: true });
    });
    router3.get("/me", requireAuth, (req, res) => {
      const user = schema_default.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.phone,
           u.email_verified, u.login_count, u.last_login_at, u.created_at
    FROM users u WHERE u.id = ?
  `).get(req.user.id);
      if (!user) return res.status(404).json({ error: "N\xE3o encontrado" });
      const sub = getSubscription(req.user.id);
      const since30 = Math.floor(Date.now() / 1e3) - 86400 * 30;
      const usage = schema_default.prepare(`SELECT action, COUNT(*) as n FROM usage_logs WHERE user_id = ? AND created_at > ? GROUP BY action`).all(req.user.id, since30);
      const unread = schema_default.prepare(`SELECT COUNT(*) as n FROM notifications WHERE user_id = ? AND read = 0`).get(req.user.id).n;
      res.json({
        user,
        subscription: serializeSubscription(sub),
        usage_30d: Object.fromEntries(usage.map((u) => [u.action, u.n])),
        unread_notifications: unread
      });
    });
    router3.patch("/profile", requireAuth, (req, res) => {
      const { name, phone, avatar_url } = req.body;
      schema_default.prepare(`
    UPDATE users SET
      name       = COALESCE(?, name),
      phone      = COALESCE(?, phone),
      avatar_url = COALESCE(?, avatar_url),
      updated_at = unixepoch()
    WHERE id = ?
  `).run(name ?? null, phone ?? null, avatar_url ?? null, req.user.id);
      writeAuditLog(req.user.id, "auth.profile.update", { changed: ["name", "phone", "avatar_url"].filter((k) => req.body[k] !== void 0) }, req.user.id, req.ip ?? null);
      res.json({ ok: true });
    });
    router3.post("/change-password", requireAuth, async (req, res) => {
      const { current, novo } = req.body;
      if (!current || !novo) return res.status(400).json({ error: "Campos obrigat\xF3rios" });
      if (novo.length < 8) return res.status(400).json({ error: "M\xEDnimo 8 caracteres" });
      const user = schema_default.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user.id);
      if (!await bcrypt2.compare(current, user.password_hash)) return res.status(400).json({ error: "Senha atual incorreta" });
      const hash = await bcrypt2.hash(novo, SALT);
      schema_default.prepare(`UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?`).run(hash, req.user.id);
      schema_default.prepare(`DELETE FROM sessions WHERE user_id = ? AND jti != ?`).run(req.user.id, req.user.jti);
      writeAuditLog(req.user.id, "auth.password.change", void 0, req.user.id, req.ip ?? null);
      res.json({ ok: true, message: "Senha alterada. Outros dispositivos foram deslogados." });
    });
    router3.post("/forgot-password", async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email obrigat\xF3rio" });
      const user = schema_default.prepare(`SELECT id, name FROM users WHERE email = ?`).get(email.toLowerCase().trim());
      if (!user) return res.json({ ok: true, message: "Se o e-mail existir, voc\xEA receber\xE1 as instru\xE7\xF5es." });
      const token = crypto3.randomBytes(24).toString("hex");
      const expires = Math.floor(Date.now() / 1e3) + 3600;
      schema_default.prepare(`UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?`).run(token, expires, user.id);
      const baseUrl = process.env.APP_BASE_URL || process.env.ALLOWED_ORIGIN?.split(",")[0]?.trim() || "http://localhost:3000";
      const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-senha?token=${token}`;
      const transporter = await getMailer2();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email.toLowerCase().trim(),
          subject: "Redefini\xE7\xE3o de senha \u2014 Rapha Guru",
          text: `Ol\xE1, ${user.name}.

Para redefinir sua senha, acesse: ${resetUrl}

Este link expira em 1 hora.`,
          html: `<p>Ol\xE1, <strong>${user.name}</strong>.</p><p>Para redefinir sua senha, acesse o link abaixo:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este link expira em 1 hora.</p>`
        });
      } else {
        console.log(`[RESET] ${email}: ${resetUrl}`);
      }
      writeAuditLog(user.id, "auth.password.forgot", { transporter: Boolean(transporter) }, user.id, req.ip ?? null);
      const body = { ok: true, message: "Se o e-mail existir, voc\xEA receber\xE1 as instru\xE7\xF5es." };
      if (process.env.NODE_ENV !== "production" && process.env.EXPOSE_RESET_TOKEN === "1") body._dev_token = token;
      res.json(body);
    });
    router3.post("/reset-password", async (req, res) => {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ error: "Token e senha obrigat\xF3rios" });
      if (password.length < 8) return res.status(400).json({ error: "M\xEDnimo 8 caracteres" });
      const user = schema_default.prepare(`SELECT id FROM users WHERE reset_token = ? AND reset_expires > unixepoch()`).get(token);
      if (!user) return res.status(400).json({ error: "Token inv\xE1lido ou expirado" });
      const hash = await bcrypt2.hash(password, SALT);
      schema_default.prepare(`
    UPDATE users
    SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = unixepoch()
    WHERE id = ?
  `).run(hash, user.id);
      schema_default.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(user.id);
      writeAuditLog(user.id, "auth.password.reset", void 0, user.id, req.ip ?? null);
      res.json({ ok: true, message: "Senha redefinida com sucesso!" });
    });
    router3.post("/refresh", requireAuth, (req, res) => {
      const user = schema_default.prepare(`SELECT id, email, name, role FROM users WHERE id = ? AND is_active = 1`).get(req.user.id);
      if (!user) return res.status(401).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      const sub = getSubscription(user.id);
      res.json({ token: signToken(user), user, subscription: serializeSubscription(sub) });
    });
    router3.post("/reset-admin", requireAuth, requireAdmin, async (req, res) => {
      const { password, email } = req.body;
      if (!password || password.length < 10) return res.status(400).json({ error: "Defina uma senha forte com pelo menos 10 caracteres" });
      const admin = schema_default.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
      if (!admin) return res.status(404).json({ error: "Admin n\xE3o encontrado" });
      const hash = await bcrypt2.hash(password, 12);
      schema_default.prepare(`UPDATE users SET password_hash = ?, email = COALESCE(?, email), updated_at = unixepoch() WHERE id = ?`).run(hash, email ?? null, admin.id);
      schema_default.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(admin.id);
      writeAuditLog(req.user.id, "admin.reset_admin_password", { email: email ?? null }, admin.id, req.ip ?? null);
      res.json({ ok: true, message: "Credenciais do administrador atualizadas com sucesso." });
    });
    auth_default = router3;
  }
});

// server/routes/payments.ts
var payments_exports = {};
__export(payments_exports, {
  default: () => payments_default
});
import { Router as Router3 } from "express";
import crypto4 from "crypto";
async function pm(method, path5, body) {
  const auth = Buffer.from(`${PM_KEY}:`).toString("base64");
  const res = await fetch(`${PM_BASE}${path5}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Pagar.me ${res.status}`);
  return data;
}
function serializePlanRow(row) {
  return {
    ...row,
    ...row.features ? { features: JSON.parse(row.features) } : {},
    ...row.limits ? { limits: JSON.parse(row.limits) } : {}
  };
}
function getSubscription2(userId) {
  return ensureSubscriptionConsistency(userId);
}
function verifyWebhookSignature(rawBody, signature, secret) {
  if (!secret) return true;
  if (!rawBody || !signature) return false;
  const candidates = [
    crypto4.createHmac("sha256", secret).update(rawBody).digest("hex"),
    crypto4.createHmac("sha256", secret).update(rawBody).digest("base64")
  ];
  const provided = signature.replace(/^sha256=/i, "").trim();
  return candidates.some((candidate) => {
    try {
      return crypto4.timingSafeEqual(Buffer.from(candidate), Buffer.from(provided));
    } catch {
      return false;
    }
  });
}
async function activateSub(userId, planSlug, cycle, amount, orderId) {
  const now = Math.floor(Date.now() / 1e3);
  const expiry = now + (cycle === "annual" ? 365 : 31) * 86400;
  schema_default.prepare(`UPDATE subscriptions SET status = 'cancelled', updated_at = unixepoch() WHERE user_id = ? AND status = 'active'`).run(userId);
  schema_default.prepare(`
    INSERT INTO subscriptions
      (user_id, plan_slug, status, billing_cycle, amount_brl, gateway_sub_id, period_start, period_end, next_billing_at)
    VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)
  `).run(userId, planSlug, cycle, amount, orderId, now, expiry, expiry);
  schema_default.prepare(`UPDATE users SET role = ?, updated_at = unixepoch() WHERE id = ? AND role != 'admin'`).run(planSlug, userId);
  schema_default.prepare(`
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (?, ?, ?, 'success')
  `).run(userId, `\u2705 Plano ${planSlug} ativado!`, "Seu acesso foi atualizado. Aproveite todos os recursos!");
}
function simulatePayment(method, payId) {
  if (method === "pix") {
    return {
      pix_qr_code: `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${(Math.random() * 100).toFixed(2)}5802BR5913RAPHA GURU6009SAO PAULO62140510RAPHAGURU${payId}6304ABCD`,
      pix_qr_base64: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO_PIX_RAPHA_GURU",
      pix_expires_at: Math.floor(Date.now() / 1e3) + 3600
    };
  }
  if (method === "boleto") {
    return {
      boleto_url: "https://boleto.pagarme.com/demo",
      boleto_barcode: "34191.75124 34567.261280 67117.190000 9 99990000100000",
      boleto_expires_at: Math.floor(Date.now() / 1e3) + 3 * 86400
    };
  }
  return {};
}
var router4, PM_KEY, PM_BASE, PM_WEBHOOK_SECRET, payments_default;
var init_payments = __esm({
  "server/routes/payments.ts"() {
    "use strict";
    init_schema();
    init_auth();
    init_plans();
    init_audit();
    router4 = Router3();
    PM_KEY = process.env.PAGARME_API_KEY || "";
    PM_BASE = "https://api.pagar.me/core/v5";
    PM_WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET || "";
    router4.get("/plans", (_req, res) => {
      const plans = schema_default.prepare(`SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order`).all();
      res.json({ plans: plans.map((p) => serializePlanRow(p)) });
    });
    router4.get("/subscription", requireAuth, (req, res) => {
      const sub = getSubscription2(req.user.id);
      const payments = schema_default.prepare(`
    SELECT id, amount_brl, status, method, created_at, paid_at
    FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.user.id);
      res.json({ subscription: sub ? serializePlanRow(sub) : null, payments });
    });
    router4.post("/checkout", requireAuth, async (req, res) => {
      try {
        const { plan_slug, billing_cycle = "monthly", method, cpf } = req.body;
        if (!plan_slug || !method) return res.status(400).json({ error: "plan_slug e method s\xE3o obrigat\xF3rios" });
        const plan = schema_default.prepare(`SELECT * FROM plans WHERE slug = ? AND is_active = 1`).get(plan_slug);
        if (!plan) return res.status(404).json({ error: "Plano n\xE3o encontrado" });
        if (plan.slug === "free") return res.status(400).json({ error: "Plano gratuito n\xE3o requer pagamento" });
        const user = schema_default.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
        const amountCents = Math.round((billing_cycle === "annual" && plan.price_annual ? plan.price_annual : plan.price_monthly) * 100);
        const amountBrl = amountCents / 100;
        const payResult = schema_default.prepare(`INSERT INTO payments (user_id, amount_brl, status, method, gateway) VALUES (?, ?, 'pending', ?, 'pagarme')`).run(user.id, amountBrl, method);
        const paymentId = Number(payResult.lastInsertRowid);
        if (!PM_KEY) {
          const simulated = simulatePayment(method, paymentId);
          const keys = Object.keys(simulated);
          if (keys.length) {
            schema_default.prepare(`UPDATE payments SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).run(...Object.values(simulated), paymentId);
          }
          writeAuditLog(req.user.id, "payments.checkout.demo", { plan_slug, billing_cycle, method, payment_id: paymentId }, req.user.id, req.ip ?? null);
          return res.json({ payment_id: paymentId, status: "pending", method, ...simulated, _demo: true, _demo_msg: "Configure PAGARME_API_KEY para pagamentos reais" });
        }
        let customerId = schema_default.prepare(`
      SELECT gateway_customer_id FROM subscriptions
      WHERE user_id = ? AND gateway_customer_id IS NOT NULL LIMIT 1
    `).get(user.id)?.gateway_customer_id ?? null;
        if (!customerId) {
          const cust = await pm("POST", "/customers", {
            name: user.name,
            email: user.email,
            type: "individual",
            document: (cpf ?? user.cpf ?? "00000000000").replace(/\D/g, ""),
            document_type: "CPF",
            phones: user.phone ? {
              mobile_phone: {
                country_code: "55",
                area_code: user.phone.replace(/\D/g, "").slice(0, 2),
                number: user.phone.replace(/\D/g, "").slice(2)
              }
            } : void 0
          });
          customerId = cust.id;
        }
        const orderPayload = {
          customer_id: customerId,
          items: [{ amount: amountCents, description: `Rapha Guru ${plan.name}`, quantity: 1, code: plan.slug }]
        };
        let paymentBlock;
        if (method === "pix") {
          paymentBlock = { payment_method: "pix", pix: { expires_in: 3600 } };
        } else if (method === "boleto") {
          paymentBlock = {
            payment_method: "boleto",
            boleto: {
              instructions: "Pague at\xE9 o vencimento para ativar sua assinatura.",
              due_at: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)
            }
          };
        } else if (method === "credit_card") {
          const { card_token, installments } = req.body;
          if (!card_token) return res.status(400).json({ error: "card_token obrigat\xF3rio para cart\xE3o" });
          paymentBlock = {
            payment_method: "credit_card",
            credit_card: {
              recurrence: (installments ?? 1) === 1,
              installments: installments ?? 1,
              statement_descriptor: "RAPHA GURU",
              card_token
            }
          };
        } else {
          return res.status(400).json({ error: "M\xE9todo inv\xE1lido: pix | boleto | credit_card" });
        }
        orderPayload.payments = [paymentBlock];
        const order = await pm("POST", "/orders", orderPayload);
        const charge = order.charges?.[0];
        const lastTx = charge?.last_transaction ?? {};
        const updates = { gateway_order_id: order.id };
        if (method === "pix") {
          updates.pix_qr_code = lastTx.qr_code;
          updates.pix_qr_base64 = lastTx.qr_code_url;
          updates.pix_expires_at = Math.floor(Date.now() / 1e3) + 3600;
        }
        if (method === "boleto") {
          updates.boleto_url = lastTx.url;
          updates.boleto_barcode = lastTx.line;
          updates.boleto_expires_at = Math.floor(Date.now() / 1e3) + 3 * 86400;
        }
        schema_default.prepare(`
      UPDATE payments SET gateway_order_id = ?, pix_qr_code = ?, pix_qr_base64 = ?, pix_expires_at = ?,
      boleto_url = ?, boleto_barcode = ?, boleto_expires_at = ?
      WHERE id = ?
    `).run(
          String(updates.gateway_order_id ?? ""),
          updates.pix_qr_code ?? null,
          updates.pix_qr_base64 ?? null,
          updates.pix_expires_at ?? null,
          updates.boleto_url ?? null,
          updates.boleto_barcode ?? null,
          updates.boleto_expires_at ?? null,
          paymentId
        );
        schema_default.prepare(`UPDATE subscriptions SET gateway_customer_id = ? WHERE user_id = ? AND status = 'active'`).run(customerId, user.id);
        writeAuditLog(req.user.id, "payments.checkout", { plan_slug, billing_cycle, method, payment_id: paymentId, gateway_order_id: order.id }, req.user.id, req.ip ?? null);
        if (method === "credit_card" && order.status === "paid") {
          await activateSub(user.id, plan.slug, billing_cycle, amountBrl, String(order.id));
          schema_default.prepare(`UPDATE payments SET status = 'paid', paid_at = unixepoch() WHERE id = ?`).run(paymentId);
          return res.json({ payment_id: paymentId, status: "paid", message: "Assinatura ativada!" });
        }
        res.json({ payment_id: paymentId, status: "pending", method, ...updates });
      } catch (err) {
        console.error("[checkout]", err);
        res.status(500).json({ error: err instanceof Error ? err.message : "Erro no checkout" });
      }
    });
    router4.post("/webhook", async (req, res) => {
      const signature = String(req.headers["x-hub-signature"] || req.headers["x-hub-signature-256"] || req.headers["x-pagarme-signature"] || "");
      if (!verifyWebhookSignature(req.rawBody, signature || void 0, PM_WEBHOOK_SECRET)) {
        return res.status(401).json({ error: "Assinatura do webhook inv\xE1lida" });
      }
      const event = req.body;
      console.log("[webhook]", event.type);
      try {
        if (event.type === "order.paid") {
          const order = event.data ?? {};
          const orderId = String(order.id ?? "");
          const pay = schema_default.prepare(`SELECT p.id, p.user_id, p.amount_brl FROM payments p WHERE p.gateway_order_id = ?`).get(orderId);
          if (pay) {
            schema_default.prepare(`UPDATE payments SET status = 'paid', paid_at = unixepoch(), gateway_payload = ? WHERE gateway_order_id = ?`).run(JSON.stringify(order), orderId);
            const items = order.items;
            const planSlug = items?.[0]?.code ?? "basic";
            await activateSub(pay.user_id, planSlug, "monthly", pay.amount_brl, orderId);
            writeAuditLog(pay.user_id, "payments.webhook.paid", { orderId, planSlug }, pay.user_id, null);
          }
        }
        if (event.type === "order.payment_failed") {
          const orderId = String(event.data?.id ?? "");
          schema_default.prepare(`UPDATE payments SET status = 'failed', failure_reason = ?, gateway_payload = ? WHERE gateway_order_id = ?`).run("Pagamento recusado pela operadora", JSON.stringify(event.data ?? {}), orderId);
        }
        res.json({ received: true });
      } catch (err) {
        console.error("[webhook error]", err);
        res.status(500).json({ error: "Webhook error" });
      }
    });
    router4.post("/cancel", requireAuth, (req, res) => {
      const { reason } = req.body;
      const active = schema_default.prepare(`
    SELECT id, period_end, plan_slug FROM subscriptions
    WHERE user_id = ? AND status = 'active' AND plan_slug != 'free'
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);
      if (!active) return res.status(404).json({ error: "Nenhuma assinatura paga ativa" });
      schema_default.prepare(`
    UPDATE subscriptions
    SET cancel_at_period_end = 1,
        cancelled_at = COALESCE(cancelled_at, unixepoch()),
        cancel_reason = ?,
        updated_at = unixepoch()
    WHERE id = ?
  `).run(reason ?? "Cancelado pelo usu\xE1rio", active.id);
      schema_default.prepare(`
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (?, 'Assinatura programada para cancelamento', 'Seu acesso permanece ativo at\xE9 o fim do per\xEDodo atual.', 'warning')
  `).run(req.user.id);
      writeAuditLog(req.user.id, "payments.cancel_at_period_end", { subscription_id: active.id, period_end: active.period_end }, req.user.id, req.ip ?? null);
      res.json({ ok: true, cancel_at_period_end: true, period_end: active.period_end });
    });
    router4.post("/refund", requireAuth, async (req, res) => {
      const { payment_id, reason } = req.body;
      if (!payment_id) return res.status(400).json({ error: "payment_id obrigat\xF3rio" });
      const pay = schema_default.prepare(`SELECT * FROM payments WHERE id = ? AND user_id = ?`).get(payment_id, req.user.id);
      if (!pay) return res.status(404).json({ error: "Pagamento n\xE3o encontrado" });
      if (pay.status !== "paid") return res.status(400).json({ error: "Apenas pagamentos pagos podem ser estornados" });
      try {
        if (PM_KEY && pay.gateway_order_id) {
          await pm("POST", `/orders/${pay.gateway_order_id}/refund`, { reason });
        }
        schema_default.prepare(`UPDATE payments SET status = 'refunded', refunded_at = unixepoch(), failure_reason = ? WHERE id = ?`).run(reason ?? "Estorno solicitado pelo usu\xE1rio", payment_id);
        schema_default.prepare(`INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, 'info')`).run(req.user.id, "\u{1F4B0} Estorno processado", `Seu estorno de R$ ${Number(pay.amount_brl).toFixed(2)} foi solicitado e ser\xE1 processado em at\xE9 7 dias \xFAteis.`);
        writeAuditLog(req.user.id, "payments.refund", { payment_id, reason: reason ?? null }, req.user.id, req.ip ?? null);
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Erro no estorno" });
      }
    });
    router4.post("/coupon/apply", requireAuth, (req, res) => {
      const { code, plan_slug } = req.body;
      if (!code) return res.status(400).json({ error: "C\xF3digo obrigat\xF3rio" });
      const COUPONS = {
        RAPHA10: { discount: 10, type: "pct" },
        RAPHA20: { discount: 20, type: "pct" },
        PROMO50: { discount: 50, type: "fixed", plans: ["basic", "pro"] },
        ELITE30: { discount: 30, type: "pct", plans: ["elite"] }
      };
      const coupon = COUPONS[code.toUpperCase()];
      if (!coupon) return res.status(404).json({ error: "Cupom inv\xE1lido ou expirado" });
      if (coupon.plans && plan_slug && !coupon.plans.includes(plan_slug)) return res.status(400).json({ error: "Cupom n\xE3o v\xE1lido para este plano" });
      res.json({ ok: true, coupon: { code, ...coupon } });
    });
    payments_default = router4;
  }
});

// server/routes/admin.ts
var admin_exports = {};
__export(admin_exports, {
  default: () => admin_default
});
import { Router as Router4 } from "express";
var router5, admin_default;
var init_admin = __esm({
  "server/routes/admin.ts"() {
    "use strict";
    init_schema();
    init_auth();
    init_audit();
    router5 = Router4();
    router5.get("/admin/dashboard", requireAuth, requireAdmin, (_req, res) => {
      const now = Math.floor(Date.now() / 1e3);
      const today = now - 86400;
      const week = now - 7 * 86400;
      const month = now - 30 * 86400;
      const q = (sql, ...params) => schema_default.prepare(sql).get(...params);
      const qa2 = (sql, ...params) => schema_default.prepare(sql).all(...params);
      const totalUsers = q(`SELECT COUNT(*) n FROM users WHERE role != 'admin'`).n;
      const activeToday = q(`SELECT COUNT(*) n FROM users WHERE last_login_at > ?`, today).n;
      const newToday = q(`SELECT COUNT(*) n FROM users WHERE created_at > ?`, today).n;
      const newWeek = q(`SELECT COUNT(*) n FROM users WHERE created_at > ?`, week).n;
      const newMonth = q(`SELECT COUNT(*) n FROM users WHERE created_at > ?`, month).n;
      const paidSubs = q(`SELECT COUNT(*) n FROM subscriptions WHERE status='active' AND plan_slug != 'free'`).n;
      const mrr = q(`SELECT COALESCE(SUM(amount_brl),0) s FROM subscriptions WHERE status='active' AND billing_cycle='monthly' AND plan_slug != 'free'`).s;
      const revenueMonth = q(`SELECT COALESCE(SUM(amount_brl),0) s FROM payments WHERE status='paid' AND paid_at > ?`, month).s;
      const revenueWeek = q(`SELECT COALESCE(SUM(amount_brl),0) s FROM payments WHERE status='paid' AND paid_at > ?`, week).s;
      const revenueToday = q(`SELECT COALESCE(SUM(amount_brl),0) s FROM payments WHERE status='paid' AND paid_at > ?`, today).s;
      const churnMonth = q(`SELECT COUNT(*) n FROM subscriptions WHERE status='cancelled' AND cancelled_at > ?`, month).n;
      const planDist = qa2(`SELECT plan_slug, COUNT(*) n FROM subscriptions WHERE status='active' GROUP BY plan_slug ORDER BY n DESC`);
      const recentPays = qa2(`
    SELECT p.id, p.amount_brl, p.status, p.method, p.created_at, p.paid_at,
           u.name user_name, u.email
    FROM payments p JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC LIMIT 20
  `);
      const topActions = qa2(`
    SELECT action, COUNT(*) n FROM usage_logs WHERE created_at > ? GROUP BY action ORDER BY n DESC LIMIT 8
  `, month);
      const revenueChart = qa2(`
    SELECT date(paid_at,'unixepoch') day, SUM(amount_brl) total, COUNT(*) n
    FROM payments WHERE status='paid' AND paid_at > ?
    GROUP BY day ORDER BY day
  `, month);
      res.json({
        users: { total: totalUsers, active_today: activeToday, new_today: newToday, new_week: newWeek, new_month: newMonth, paid_subs: paidSubs },
        revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth, mrr, churn_month: churnMonth },
        plan_distribution: planDist,
        recent_payments: recentPays,
        top_actions: topActions,
        revenue_chart: revenueChart
      });
    });
    router5.get("/admin/users", requireAuth, requireAdmin, (req, res) => {
      const { page = "1", limit = "25", q = "", role = "", status = "" } = req.query;
      const off = (Number(page) - 1) * Number(limit);
      const params = [];
      let where = `WHERE u.role != 'admin'`;
      if (q) {
        where += ` AND (u.email LIKE ? OR u.name LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
      }
      if (role) {
        where += ` AND u.role = ?`;
        params.push(role);
      }
      if (status === "active") where += ` AND u.is_active = 1`;
      if (status === "inactive") where += ` AND u.is_active = 0`;
      const total = schema_default.prepare(`SELECT COUNT(*) n FROM users u ${where}`).get(...params).n;
      const users = schema_default.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.is_active, u.email_verified,
           u.last_login_at, u.login_count, u.created_at,
           s.plan_slug, s.status sub_status, s.period_end
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
    ${where}
    ORDER BY u.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), off);
      res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    });
    router5.patch("/admin/users/:id", requireAuth, requireAdmin, (req, res) => {
      const { id } = req.params;
      const { role, is_active, name } = req.body;
      schema_default.prepare(`
    UPDATE users SET
      role = COALESCE(?, role),
      is_active = COALESCE(?, is_active),
      name = COALESCE(?, name),
      updated_at = unixepoch()
    WHERE id = ?
  `).run(role ?? null, is_active ?? null, name ?? null, id);
      if (role && role !== "admin") {
        const now = Math.floor(Date.now() / 1e3);
        schema_default.prepare(`UPDATE subscriptions SET status='cancelled', updated_at=unixepoch() WHERE user_id=? AND status='active'`).run(id);
        schema_default.prepare(`
      INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start, period_end)
      VALUES (?, ?, 'active', 'monthly', 0, ?, ?)
    `).run(id, role, now, now + 30 * 86400);
        schema_default.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, ?, ?, 'info')
    `).run(id, "Plano atualizado pelo administrador", `Seu plano foi alterado para ${role}.`);
      }
      res.json({ ok: true });
    });
    router5.get("/admin/reports", requireAuth, requireAdmin, (req, res) => {
      const { days = "30" } = req.query;
      const since = Math.floor(Date.now() / 1e3) - Number(days) * 86400;
      const qa2 = (sql, ...p) => schema_default.prepare(sql).all(...p);
      res.json({
        revenue_by_day: qa2(`
      SELECT date(paid_at,'unixepoch') day, SUM(amount_brl) total, COUNT(*) count
      FROM payments WHERE status='paid' AND paid_at > ? GROUP BY day ORDER BY day
    `, since),
        new_users_by_day: qa2(`
      SELECT date(created_at,'unixepoch') day, COUNT(*) count
      FROM users WHERE created_at > ? GROUP BY day ORDER BY day
    `, since),
        churn_by_day: qa2(`
      SELECT date(cancelled_at,'unixepoch') day, COUNT(*) count
      FROM subscriptions WHERE cancelled_at > ? GROUP BY day ORDER BY day
    `, since),
        plan_distribution: qa2(`
      SELECT plan_slug, COUNT(*) count FROM subscriptions WHERE status='active' GROUP BY plan_slug
    `),
        payment_methods: qa2(`
      SELECT method, COUNT(*) count, SUM(amount_brl) total
      FROM payments WHERE status='paid' AND paid_at > ? GROUP BY method
    `, since),
        top_users: qa2(`
      SELECT u.id, u.email, u.name, u.role, COUNT(ul.id) actions
      FROM users u LEFT JOIN usage_logs ul ON ul.user_id = u.id AND ul.created_at > ?
      GROUP BY u.id ORDER BY actions DESC LIMIT 20
    `, since),
        pending_payments: qa2(`
      SELECT p.*, u.name user_name, u.email FROM payments p JOIN users u ON u.id = p.user_id
      WHERE p.status = 'pending' ORDER BY p.created_at DESC LIMIT 20
    `)
      });
    });
    router5.get("/user/stats", requireAuth, (req, res) => {
      const userId = req.user.id;
      const now = Math.floor(Date.now() / 1e3);
      const qa2 = (sql, ...p) => schema_default.prepare(sql).all(...p);
      const q = (sql, ...p) => schema_default.prepare(sql).get(...p);
      const sub = q(`
    SELECT s.*, p.name plan_name, p.features, p.limits, p.price_monthly, p.badge_color
    FROM subscriptions s JOIN plans p ON p.slug = s.plan_slug
    WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1
  `, userId);
      const payments = qa2(`
    SELECT id, amount_brl, status, method, created_at, paid_at
    FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `, userId);
      const usageTotal = qa2(`
    SELECT action, COUNT(*) n FROM usage_logs WHERE user_id = ? GROUP BY action
  `, userId);
      const usage30d = qa2(`
    SELECT action, COUNT(*) n FROM usage_logs WHERE user_id = ? AND created_at > ?
    GROUP BY action
  `, userId, now - 30 * 86400);
      const usageToday = qa2(`
    SELECT action, COUNT(*) n FROM usage_logs WHERE user_id = ? AND created_at > ?
    GROUP BY action
  `, userId, now - 86400);
      const usageChart = qa2(`
    SELECT date(created_at,'unixepoch') day, COUNT(*) n
    FROM usage_logs WHERE user_id = ? AND created_at > ?
    GROUP BY day ORDER BY day
  `, userId, now - 30 * 86400);
      const days = qa2(`
    SELECT DISTINCT date(created_at,'unixepoch') day
    FROM usage_logs WHERE user_id = ? ORDER BY day DESC LIMIT 60
  `, userId);
      let streak = 0;
      let check = /* @__PURE__ */ new Date();
      check.setHours(0, 0, 0, 0);
      for (const { day } of days) {
        const d = /* @__PURE__ */ new Date(day + "T00:00:00");
        const diff = Math.round((check.getTime() - d.getTime()) / 864e5);
        if (diff <= 1) {
          streak++;
          check = d;
        } else break;
      }
      const notifications = qa2(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
  `, userId);
      schema_default.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`).run(userId);
      const user = q(`
    SELECT id, email, name, role, avatar_url, phone, email_verified, login_count, last_login_at, created_at
    FROM users WHERE id = ?
  `, userId);
      const toMap = (arr) => Object.fromEntries(arr.map((x) => [x.action, x.n]));
      res.json({
        user,
        subscription: sub ? { ...sub, features: JSON.parse(sub.features), limits: JSON.parse(sub.limits) } : null,
        usage: {
          total: toMap(usageTotal),
          last_30d: toMap(usage30d),
          today: toMap(usageToday),
          chart: usageChart
        },
        streak_days: streak,
        payments,
        notifications,
        member_since: user?.created_at ?? null
      });
    });
    router5.post("/user/notify-read", requireAuth, (req, res) => {
      const { ids } = req.body;
      if (ids?.length) {
        ids.forEach((id) => schema_default.prepare(`UPDATE notifications SET read=1 WHERE id=? AND user_id=?`).run(id, req.user.id));
      } else {
        schema_default.prepare(`UPDATE notifications SET read=1 WHERE user_id=?`).run(req.user.id);
      }
      res.json({ ok: true });
    });
    router5.post("/usage/log", requireAuth, (req, res) => {
      const { action, meta } = req.body;
      if (!action) {
        res.status(400).json({ error: "action obrigat\xF3rio" });
        return;
      }
      try {
        schema_default.prepare(`INSERT INTO usage_logs (user_id, action, meta, ip_address) VALUES (?, ?, ?, ?)`).run(req.user.id, action, meta ? JSON.stringify(meta) : null, req.ip ?? null);
        res.json({ ok: true });
      } catch {
        res.json({ ok: true });
      }
    });
    router5.delete("/admin/users/:id", requireAuth, requireAdmin, (req, res) => {
      const { id } = req.params;
      schema_default.prepare(`DELETE FROM users WHERE id = ? AND role != 'admin'`).run(id);
      res.json({ ok: true });
    });
    router5.post("/admin/users/:id/notify", requireAuth, requireAdmin, (req, res) => {
      const { id } = req.params;
      const { title, body, type = "info", action_url } = req.body;
      if (!title || !body) return res.status(400).json({ error: "title e body obrigat\xF3rios" });
      schema_default.prepare(`INSERT INTO notifications (user_id, title, body, type, action_url) VALUES (?, ?, ?, ?, ?)`).run(id, title, body, type, action_url ?? null);
      writeAuditLog(req.user.id, "admin.notify_user", { title, type }, Number(id), req.ip ?? null);
      res.json({ ok: true });
    });
    router5.post("/admin/notify-all", requireAuth, requireAdmin, (req, res) => {
      const { title, body, type = "info", plan_filter } = req.body;
      if (!title || !body) return res.status(400).json({ error: "title e body obrigat\xF3rios" });
      let users;
      if (plan_filter) {
        users = schema_default.prepare(`SELECT u.id FROM users u JOIN subscriptions s ON s.user_id = u.id WHERE s.plan_slug = ? AND s.status = 'active' AND u.is_active = 1`).all(plan_filter);
      } else {
        users = schema_default.prepare(`SELECT id FROM users WHERE is_active = 1 AND role != 'admin'`).all();
      }
      const insert = schema_default.prepare(`INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`);
      const tx = schema_default.transaction(() => {
        users.forEach((u) => insert.run(u.id, title, body, type));
      });
      tx();
      writeAuditLog(req.user.id, "admin.notify_all", { sent: users.length, plan_filter: plan_filter ?? null, type }, null, req.ip ?? null);
      res.json({ ok: true, sent: users.length });
    });
    router5.post("/admin/users/:id/impersonate", requireAuth, requireAdmin, (req, res) => {
      const { id } = req.params;
      const user = schema_default.prepare(`SELECT id, email, name, role FROM users WHERE id = ? AND role != 'admin'`).get(id);
      if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      const token = signToken({ ...user, impersonated_by: req.user.id });
      writeAuditLog(req.user.id, "admin.impersonate", { impersonated_user_id: user.id }, user.id, req.ip ?? null);
      res.json({ token, user });
    });
    router5.get("/admin/export/users", requireAuth, requireAdmin, (req, res) => {
      const users = schema_default.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.is_active, u.email_verified,
           u.phone, u.login_count, u.last_login_at, u.created_at,
           s.plan_slug, s.status sub_status, s.amount_brl sub_amount,
           s.billing_cycle, s.period_end
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
    WHERE u.role != 'admin'
    ORDER BY u.created_at DESC
  `).all();
      const headers = ["id", "email", "nome", "plano", "status", "ativo", "email_verificado", "telefone", "logins", "ultimo_acesso", "cadastro", "valor_mensalidade", "ciclo", "proxima_cobranca"];
      const fmt = (ts) => ts ? new Date(Number(ts) * 1e3).toLocaleDateString("pt-BR") : "";
      const rows = users.map((u) => [
        u.id,
        u.email,
        u.name,
        u.plan_slug ?? "free",
        u.sub_status ?? "active",
        u.is_active ? "sim" : "n\xE3o",
        u.email_verified ? "sim" : "n\xE3o",
        u.phone ?? "",
        u.login_count,
        fmt(u.last_login_at),
        fmt(u.created_at),
        u.sub_amount ?? 0,
        u.billing_cycle ?? "monthly",
        fmt(u.period_end)
      ]);
      const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="usuarios-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv"`);
      res.send("\uFEFF" + csv);
    });
    router5.post("/admin/plans", requireAuth, requireAdmin, (req, res) => {
      const { slug, name, description, price_monthly, price_annual, features, limits, badge_color, sort_order, is_active } = req.body;
      if (!slug || !name || price_monthly === void 0) return res.status(400).json({ error: "slug, name e price_monthly obrigat\xF3rios" });
      schema_default.prepare(`
    INSERT INTO plans (slug, name, description, price_monthly, price_annual, features, limits, badge_color, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name, description = excluded.description,
      price_monthly = excluded.price_monthly, price_annual = excluded.price_annual,
      features = excluded.features, limits = excluded.limits,
      badge_color = excluded.badge_color, sort_order = excluded.sort_order,
      is_active = excluded.is_active
  `).run(
        slug,
        name,
        description ?? null,
        price_monthly,
        price_annual ?? null,
        JSON.stringify(features ?? []),
        JSON.stringify(limits ?? {}),
        badge_color ?? "#3b82f6",
        sort_order ?? 0,
        is_active ?? 1
      );
      res.json({ ok: true });
    });
    router5.get("/admin/realtime", requireAuth, requireAdmin, (_req, res) => {
      const now = Math.floor(Date.now() / 1e3);
      const hour = now - 3600;
      const q = (sql, ...p) => schema_default.prepare(sql).get(...p);
      const qa2 = (sql, ...p) => schema_default.prepare(sql).all(...p);
      res.json({
        active_last_hour: q(`SELECT COUNT(DISTINCT user_id) n FROM usage_logs WHERE created_at > ?`, hour).n,
        actions_last_hour: q(`SELECT COUNT(*) n FROM usage_logs WHERE created_at > ?`, hour).n,
        pending_payments: q(`SELECT COUNT(*) n FROM payments WHERE status = 'pending'`).n,
        pending_amount: q(`SELECT COALESCE(SUM(amount_brl),0) s FROM payments WHERE status = 'pending'`).s,
        recent_signups: qa2(`SELECT name, email, created_at FROM users WHERE created_at > ? ORDER BY created_at DESC LIMIT 5`, hour),
        recent_actions: qa2(`SELECT user_id, action, created_at FROM usage_logs ORDER BY created_at DESC LIMIT 10`)
      });
    });
    admin_default = router5;
  }
});

// server/routes/marketing.ts
var marketing_exports = {};
__export(marketing_exports, {
  default: () => marketing_default
});
import { Router as Router5 } from "express";
import nodemailer3 from "nodemailer";
function getMailer3() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer3.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}
async function sendChannel(channel, to, subject, body) {
  try {
    if (channel === "email" && to.email) {
      const mailer = getMailer3();
      if (!mailer) {
        console.warn("[marketing] SMTP not configured");
        return false;
      }
      await mailer.sendMail({
        from: process.env.SMTP_FROM ?? "noreply@raphaguru.com",
        to: to.email,
        subject,
        html: body.replace(/\n/g, "<br>"),
        text: body
      });
      return true;
    }
    if (channel === "whatsapp" && to.phone && process.env.WHATSAPP_TOKEN) {
      const phone = to.phone.replace(/\D/g, "");
      const res = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body } })
      });
      return res.ok;
    }
    if (channel === "telegram" && to.telegram_id && process.env.TELEGRAM_BOT_TOKEN) {
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: to.telegram_id, text: `*${subject}*

${body}`, parse_mode: "Markdown" })
      });
      return res.ok;
    }
    if (channel === "app" && to.user_id) {
      schema_default.prepare(`INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, 'info')`).run(
        to.user_id,
        subject,
        body
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[marketing] send ${channel}:`, err);
    return false;
  }
}
var router6, qa, marketing_default;
var init_marketing = __esm({
  "server/routes/marketing.ts"() {
    "use strict";
    init_schema();
    init_auth();
    router6 = Router5();
    qa = (sql, ...p) => schema_default.prepare(sql).all(...p);
    router6.get("/admin/crm/contacts", requireAuth, requireAdmin, (req, res) => {
      const { status, q: search, page = "1", limit = "50" } = req.query;
      const off = (Number(page) - 1) * Number(limit);
      let where = "1=1";
      const params = [];
      if (status) {
        where += ` AND c.status = ?`;
        params.push(status);
      }
      if (search) {
        where += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      const contacts = schema_default.prepare(`
    SELECT c.*, u.role, u.last_login_at,
           s.plan_slug, s.status sub_status, s.period_end, s.amount_brl
    FROM crm_contacts c
    LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN subscriptions s ON s.user_id = c.user_id AND s.status = 'active'
    WHERE ${where}
    ORDER BY c.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), off);
      const total = schema_default.prepare(`SELECT COUNT(*) n FROM crm_contacts c WHERE ${where}`).get(...params).n;
      res.json({ contacts, total });
    });
    router6.post("/admin/crm/contacts", requireAuth, requireAdmin, (req, res) => {
      const { name, email, phone, telegram_id, status = "prospect", plan_interest, notes, tags } = req.body;
      if (!name) return res.status(400).json({ error: "Nome obrigat\xF3rio" });
      const user = email ? schema_default.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase()) : void 0;
      const r = schema_default.prepare(`
    INSERT INTO crm_contacts (user_id, name, email, phone, telegram_id, status, plan_interest, notes, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user?.id ?? null, name, email ?? null, phone ?? null, telegram_id ?? null, status, plan_interest ?? null, notes ?? null, tags ?? "[]");
      res.json({ id: r.lastInsertRowid, ok: true });
    });
    router6.patch("/admin/crm/contacts/:id", requireAuth, requireAdmin, (req, res) => {
      const { id } = req.params;
      const { name, email, phone, telegram_id, status, plan_interest, notes, tags } = req.body;
      schema_default.prepare(`UPDATE crm_contacts SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone), telegram_id=COALESCE(?,telegram_id), status=COALESCE(?,status), plan_interest=COALESCE(?,plan_interest), notes=COALESCE(?,notes), tags=COALESCE(?,tags), updated_at=unixepoch() WHERE id=?`).run(name ?? null, email ?? null, phone ?? null, telegram_id ?? null, status ?? null, plan_interest ?? null, notes ?? null, tags ?? null, id);
      res.json({ ok: true });
    });
    router6.delete("/admin/crm/contacts/:id", requireAuth, requireAdmin, (req, res) => {
      schema_default.prepare(`DELETE FROM crm_contacts WHERE id = ?`).run(req.params.id);
      res.json({ ok: true });
    });
    router6.get("/admin/campaigns", requireAuth, requireAdmin, (_req, res) => {
      const campaigns = qa(`
    SELECT c.*, (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = c.id) total_sends
    FROM campaigns c ORDER BY c.created_at DESC LIMIT 100
  `);
      res.json({ campaigns });
    });
    router6.post("/admin/campaigns", requireAuth, requireAdmin, (req, res) => {
      const { title, type = "email", audience = "all", audience_filter, subject, body, art_url, scheduled_at } = req.body;
      if (!title || !body) return res.status(400).json({ error: "T\xEDtulo e corpo obrigat\xF3rios" });
      const r = schema_default.prepare(`INSERT INTO campaigns (title, type, status, audience, audience_filter, subject, body, art_url, scheduled_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(title, type, "draft", audience, audience_filter ?? "{}", subject ?? title, body, art_url ?? null, scheduled_at ? new Date(scheduled_at).getTime() / 1e3 : null, req.user.id);
      res.json({ id: r.lastInsertRowid, ok: true });
    });
    router6.patch("/admin/campaigns/:id", requireAuth, requireAdmin, (req, res) => {
      const { title, type, audience, audience_filter, subject, body, art_url, scheduled_at, status } = req.body;
      schema_default.prepare(`UPDATE campaigns SET title=COALESCE(?,title), type=COALESCE(?,type), audience=COALESCE(?,audience), audience_filter=COALESCE(?,audience_filter), subject=COALESCE(?,subject), body=COALESCE(?,body), art_url=COALESCE(?,art_url), scheduled_at=COALESCE(?,scheduled_at), status=COALESCE(?,status), updated_at=unixepoch() WHERE id=?`).run(title ?? null, type ?? null, audience ?? null, audience_filter ?? null, subject ?? null, body ?? null, art_url ?? null, scheduled_at ? new Date(scheduled_at).getTime() / 1e3 : null, status ?? null, req.params.id);
      res.json({ ok: true });
    });
    router6.post("/admin/campaigns/:id/send", requireAuth, requireAdmin, async (req, res) => {
      const camp = schema_default.prepare(`SELECT * FROM campaigns WHERE id = ?`).get(req.params.id);
      if (!camp) return res.status(404).json({ error: "Campanha n\xE3o encontrada" });
      const channel = camp.type || "email";
      const filter = (() => {
        try {
          return JSON.parse(camp.audience_filter || "{}");
        } catch {
          return {};
        }
      })();
      let users = [];
      if (camp.audience === "all") {
        users = schema_default.prepare(`SELECT u.id, u.name, u.email, u.phone, NULL telegram_id FROM users u WHERE u.is_active=1 AND u.role != 'admin'`).all();
      } else if (camp.audience === "plan" && filter.plan) {
        users = schema_default.prepare(`SELECT u.id, u.name, u.email, u.phone, NULL telegram_id FROM users u JOIN subscriptions s ON s.user_id=u.id AND s.status='active' WHERE s.plan_slug=? AND u.is_active=1`).all(filter.plan);
      } else if (camp.audience === "delinquent") {
        users = schema_default.prepare(`SELECT u.id, u.name, u.email, u.phone, NULL telegram_id FROM users u JOIN subscriptions s ON s.user_id=u.id WHERE s.status='overdue' AND u.is_active=1`).all();
      } else if (camp.audience === "prospects") {
        const contacts = schema_default.prepare(`SELECT name, email, phone, telegram_id FROM crm_contacts WHERE status='prospect'`).all();
        users = contacts;
      } else if (camp.audience === "expiring") {
        const days = filter.days ?? 7;
        const threshold = Math.floor(Date.now() / 1e3) + days * 86400;
        users = schema_default.prepare(`SELECT u.id, u.name, u.email, u.phone, NULL telegram_id FROM users u JOIN subscriptions s ON s.user_id=u.id AND s.status='active' WHERE s.period_end <= ? AND s.period_end > unixepoch() AND u.is_active=1`).all(threshold);
      }
      let sent = 0;
      for (const user of users) {
        const ok = await sendChannel(channel, user, camp.subject, camp.body);
        const insertSend = schema_default.prepare(`INSERT INTO campaign_sends (campaign_id, user_id, channel, status, sent_at) VALUES (?, ?, ?, ?, ?)`);
        insertSend.run(camp.id, user.id ?? null, channel, ok ? "sent" : "failed", ok ? Math.floor(Date.now() / 1e3) : null);
        if (ok) sent++;
      }
      schema_default.prepare(`UPDATE campaigns SET status='sent', sent_at=unixepoch(), sent_count=? WHERE id=?`).run(sent, camp.id);
      res.json({ ok: true, sent, total: users.length });
    });
    router6.get("/admin/financial/overview", requireAuth, requireAdmin, (_req, res) => {
      const now = Math.floor(Date.now() / 1e3);
      const month = now - 30 * 86400;
      const mrr = schema_default.prepare(`SELECT COALESCE(SUM(amount_brl),0) s FROM subscriptions WHERE status='active' AND billing_cycle='monthly'`).get().s;
      const arr = schema_default.prepare(`SELECT COALESCE(SUM(amount_brl),0) s FROM subscriptions WHERE status='active' AND billing_cycle='annual'`).get().s;
      const activeCount = schema_default.prepare(`SELECT COUNT(*) n FROM subscriptions WHERE status='active' AND plan_slug!='free'`).get().n;
      const overdue = schema_default.prepare(`SELECT COUNT(*) n FROM subscriptions WHERE status='overdue'`).get().n;
      const expiring7 = schema_default.prepare(`SELECT COUNT(*) n FROM subscriptions WHERE status='active' AND period_end BETWEEN unixepoch() AND unixepoch()+604800`).get().n;
      const expiring30 = schema_default.prepare(`SELECT COUNT(*) n FROM subscriptions WHERE status='active' AND period_end BETWEEN unixepoch() AND unixepoch()+2592000`).get().n;
      const revenueMonth = schema_default.prepare(`SELECT COALESCE(SUM(amount_brl),0) s FROM payments WHERE status='paid' AND paid_at > ?`).get(month).s;
      const churnMonth = schema_default.prepare(`SELECT COUNT(*) n FROM subscriptions WHERE cancelled_at > ?`).get(month).n;
      const delinquents = schema_default.prepare(`
    SELECT u.id, u.name, u.email, u.phone, s.plan_slug, s.amount_brl, s.period_end
    FROM subscriptions s JOIN users u ON u.id = s.user_id
    WHERE s.status = 'overdue'
    ORDER BY s.period_end ASC LIMIT 20
  `).all();
      const expiringList = schema_default.prepare(`
    SELECT u.id, u.name, u.email, s.plan_slug, s.amount_brl, s.period_end,
           CAST((s.period_end - unixepoch()) / 86400 AS INTEGER) days_left
    FROM subscriptions s JOIN users u ON u.id = s.user_id
    WHERE s.status='active' AND s.period_end BETWEEN unixepoch() AND unixepoch()+2592000
    ORDER BY s.period_end ASC LIMIT 30
  `).all();
      const byPlan = schema_default.prepare(`
    SELECT plan_slug, COUNT(*) n, COALESCE(SUM(amount_brl),0) revenue
    FROM subscriptions WHERE status='active'
    GROUP BY plan_slug ORDER BY revenue DESC
  `).all();
      res.json({ mrr, arr, activeCount, overdue, expiring7, expiring30, revenueMonth, churnMonth, delinquents, expiringList, byPlan });
    });
    router6.get("/admin/financial/rules", requireAuth, requireAdmin, (_req, res) => {
      const rules = qa(`SELECT * FROM financial_rules ORDER BY created_at DESC`);
      res.json({ rules });
    });
    router6.post("/admin/financial/rules", requireAuth, requireAdmin, (req, res) => {
      const { name, trigger_type, days_before, channel, audience } = req.body;
      if (!name || !trigger_type) return res.status(400).json({ error: "Nome e trigger obrigat\xF3rios" });
      const r = schema_default.prepare(`INSERT INTO financial_rules (name, trigger_type, days_before, channel, audience) VALUES (?,?,?,?,?)`).run(name, trigger_type, Number(days_before ?? 0), channel ?? "email", audience ?? "all");
      res.json({ id: r.lastInsertRowid, ok: true });
    });
    router6.patch("/admin/financial/rules/:id", requireAuth, requireAdmin, (req, res) => {
      const { is_active, name, days_before, channel } = req.body;
      schema_default.prepare(`UPDATE financial_rules SET is_active=COALESCE(?,is_active), name=COALESCE(?,name), days_before=COALESCE(?,days_before), channel=COALESCE(?,channel) WHERE id=?`).run(is_active ?? null, name ?? null, days_before ?? null, channel ?? null, req.params.id);
      res.json({ ok: true });
    });
    marketing_default = router6;
  }
});

// server/index.ts
import express2 from "express";
import { createServer } from "http";
import path4 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import crypto5 from "crypto";

// server/automationRouter.ts
init_schema();
import express from "express";
import * as fs3 from "fs";
import * as path3 from "path";
import * as crypto2 from "crypto";

// server/automation/engine.ts
import { chromium } from "playwright";

// server/automation/human.ts
function gaussian(mean, std) {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.max(50, Math.round(mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
}
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function humanDelay(meanMs, stdDevMs) {
  return new Promise((r) => setTimeout(r, gaussian(meanMs, stdDevMs ?? meanMs * 0.25)));
}
var DELAYS = {
  afterPageLoad: () => humanDelay(1800, 400),
  beforeClick: () => humanDelay(380, 130),
  betweenKeypress: () => humanDelay(85, 32),
  afterLogin: () => humanDelay(2400, 550),
  afterSearch: () => humanDelay(1400, 320),
  beforeBetConfirm: () => humanDelay(2800, 650),
  afterBetConfirm: () => humanDelay(3200, 900),
  scrollPause: () => humanDelay(420, 110),
  betweenBets: () => humanDelay(9e3, 2500),
  afterError: () => humanDelay(3e3, 800)
};
async function moveMouse(page, fromX, fromY, toX, toY) {
  const steps = randomBetween(10, 18);
  const cp1x = fromX + (toX - fromX) * 0.3 + randomBetween(-30, 30);
  const cp1y = fromY + (toY - fromY) * 0.3 + randomBetween(-30, 30);
  const cp2x = fromX + (toX - fromX) * 0.7 + randomBetween(-20, 20);
  const cp2y = fromY + (toY - fromY) * 0.7 + randomBetween(-20, 20);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(
      (1 - t) ** 3 * fromX + 3 * (1 - t) ** 2 * t * cp1x + 3 * (1 - t) * t ** 2 * cp2x + t ** 3 * toX
    );
    const y = Math.round(
      (1 - t) ** 3 * fromY + 3 * (1 - t) ** 2 * t * cp1y + 3 * (1 - t) * t ** 2 * cp2y + t ** 3 * toY
    );
    await page.mouse.move(x, y);
    await new Promise((r) => setTimeout(r, randomBetween(8, 20)));
  }
}
async function humanType(page, selector, text, opts) {
  const el = await page.waitForSelector(selector, { timeout: opts?.timeout ?? 1e4 });
  if (!el) throw new Error(`humanType: selector not found: ${selector}`);
  const box = await el.boundingBox();
  if (box) {
    const x = box.x + box.width * 0.5;
    const y = box.y + box.height * 0.5;
    const from = { x: x + randomBetween(-100, 100), y: y + randomBetween(-80, 80) };
    await page.mouse.move(from.x, from.y);
    await moveMouse(page, from.x, from.y, x, y);
  }
  await page.focus(selector);
  await humanDelay(180, 60);
  await page.keyboard.press("Control+a");
  await humanDelay(80, 25);
  await page.keyboard.press("Backspace");
  await humanDelay(120, 40);
  for (let i = 0; i < text.length; i++) {
    await page.keyboard.type(text[i]);
    const baseDelay = gaussian(88, 32);
    if (Math.random() < 0.04 && i < text.length - 1) {
      await new Promise((r) => setTimeout(r, baseDelay));
      await page.keyboard.type(String.fromCharCode(text.charCodeAt(i) + randomBetween(-3, 3)));
      await humanDelay(250, 80);
      await page.keyboard.press("Backspace");
    }
    await new Promise((r) => setTimeout(r, baseDelay));
    if (Math.random() < 0.04) await humanDelay(500, 150);
  }
}
async function humanClick(page, selector, opts) {
  const el = await page.waitForSelector(selector, { timeout: opts?.timeout ?? 1e4 });
  if (!el) throw new Error(`humanClick: not found: ${selector}`);
  const box = await el.boundingBox();
  if (!box) throw new Error(`humanClick: no bounding box: ${selector}`);
  const targetX = box.x + box.width * (0.25 + Math.random() * 0.5);
  const targetY = box.y + box.height * (0.25 + Math.random() * 0.5);
  const startX = targetX + randomBetween(-120, 120);
  const startY = targetY + randomBetween(-80, 80);
  await page.mouse.move(startX, startY);
  await humanDelay(100, 35);
  await moveMouse(page, startX, startY, targetX, targetY);
  await humanDelay(60, 20);
  await page.mouse.click(targetX, targetY);
}
async function humanScroll(page, deltaY) {
  const steps = randomBetween(4, 8);
  const step = deltaY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(randomBetween(-3, 3), step + randomBetween(-8, 8));
    await humanDelay(110, 35);
  }
}
async function fillStakeInput(page, selector, value) {
  const str = value.toFixed(2).replace(".", ",");
  await page.focus(selector);
  await humanDelay(280, 90);
  await page.click(selector, { clickCount: 3 });
  await humanDelay(120, 40);
  await humanType(page, selector, str);
  await humanDelay(320, 100);
  await page.keyboard.press("Tab");
  await humanDelay(180, 60);
}
async function waitForSelector(page, selector, maxMs = 15e3) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      await page.waitForSelector(selector, { timeout: 2e3 });
      return true;
    } catch {
      await humanDelay(700, 180);
    }
  }
  return false;
}
async function hasCaptcha(page) {
  const sels = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    ".g-recaptcha",
    "#captcha",
    "[data-sitekey]",
    'iframe[title*="captcha" i]',
    '[class*="captcha" i]',
    '[class*="turnstile"]',
    'iframe[src*="challenges.cloudflare"]'
  ];
  for (const s of sels) {
    if (await page.$(s)) return true;
  }
  return false;
}
async function trySelectors(page, selectors, action, value, timeout = 3e3) {
  for (const sel of selectors) {
    try {
      if (action === "click") {
        await humanClick(page, sel, { timeout });
      } else if (action === "fill" && value !== void 0) {
        await humanType(page, sel, value, { timeout });
      }
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

// server/automation/adapters/betano.ts
var BASE = "https://www.betano.bet.br";
var SEL = {
  balance: ['[data-testid="header-balance"]', ".user-balance", '[class*="userBalance"]', '[class*="balance__amount"]', '[class*="Balance"]'],
  loginBtn: ['button[data-testid="login-button"]', 'button[class*="login"]', '[class*="LoginButton"]', 'button:has-text("Entrar")', 'button:has-text("Login")'],
  username: ['input[name="username"]', 'input[name="email"]', 'input[type="email"]', 'input[data-testid="username"]', 'input[placeholder*="mail" i]', 'input[autocomplete="username"]'],
  password: ['input[name="password"]', 'input[type="password"]', 'input[data-testid="password"]', 'input[autocomplete="current-password"]'],
  submit: ['button[type="submit"]', 'button[data-testid="login-submit"]', 'button:has-text("Entrar")', 'button:has-text("Fazer login")', '[class*="SubmitButton"]'],
  search: ['[data-testid="search-input"]', 'input[placeholder*="Pesquisar" i]', 'input[placeholder*="Buscar" i]', 'input[type="search"]', '[class*="SearchInput"]'],
  stake: ['input[data-testid="stake-input"]', 'input[class*="stakeInput"]', 'input[class*="StakeInput"]', 'input[placeholder*="Valor" i]', '[class*="betslip"] input[type="number"]', '[class*="Betslip"] input[type="text"]'],
  confirm: ['button[data-testid="place-bet"]', 'button[data-testid="confirm-bet"]', 'button:has-text("Fazer aposta")', 'button:has-text("Confirmar aposta")', 'button:has-text("Apostar")', '[class*="PlaceBet"]'],
  betslip: ['[class*="betslip"]', '[class*="Betslip"]', '[data-testid*="betslip"]', '[class*="BetSlip"]'],
  success: ['[data-testid="bet-confirmation"]', '[class*="BetConfirmation"]', '[class*="successMessage"]', '[class*="success"]', 'text="Aposta realizada"', 'text="Aposta colocada"', 'text="Apostas colocadas"'],
  error: ['[data-testid="error-message"]', '[class*="errorMessage"]', '[role="alert"]', '[class*="Error"]:not([class*="errorBoundary"])'],
  odds: ['[data-testid="betslip-odds"]', '[class*="betslip"] [class*="odds"]', '[class*="BetslipOdds"]', '[class*="SelectionOdds"]']
};
var BetanoAdapter = class {
  constructor(page) {
    this.page = page;
  }
  async isLoggedIn() {
    try {
      await this.page.goto(`${BASE}/pt-br/`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      await DELAYS.afterPageLoad();
      for (const sel of SEL.balance) {
        if (await this.page.$(sel)) return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  async login(username, password) {
    try {
      await this.page.goto(`${BASE}/pt-br/`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      if (await hasCaptcha(this.page)) {
        console.warn("[Betano] CAPTCHA detectado");
        return false;
      }
      const loginClicked = await trySelectors(this.page, SEL.loginBtn, "click", void 0, 4e3);
      if (!loginClicked) {
        await this.page.goto(`${BASE}/pt-br/login/`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      }
      await DELAYS.afterPageLoad();
      const userOk = await trySelectors(this.page, SEL.username, "fill", username, 5e3);
      if (!userOk) throw new Error("Campo usu\xE1rio n\xE3o encontrado");
      await humanDelay(500, 150);
      const passOk = await trySelectors(this.page, SEL.password, "fill", password, 5e3);
      if (!passOk) throw new Error("Campo senha n\xE3o encontrado");
      await DELAYS.beforeClick();
      const submitOk = await trySelectors(this.page, SEL.submit, "click", void 0, 4e3);
      if (!submitOk) throw new Error("Bot\xE3o submit n\xE3o encontrado");
      await DELAYS.afterLogin();
      const has2fa = await this.page.$('input[data-testid*="otp"], input[placeholder*="c\xF3digo" i], input[placeholder*="OTP" i]').catch(() => null);
      if (has2fa) {
        console.warn("[Betano] 2FA detectado \u2014 login manual necess\xE1rio");
        return false;
      }
      return await this.isLoggedIn();
    } catch (err) {
      console.error("[Betano] Erro no login:", err);
      return false;
    }
  }
  async getBalance() {
    try {
      await this.page.goto(`${BASE}/pt-br/`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      await DELAYS.afterPageLoad();
      for (const sel of SEL.balance) {
        const el = await this.page.$(sel);
        if (el) {
          const text = await el.textContent() ?? "";
          const match = text.match(/[\d.,]+/);
          if (match) return parseFloat(match[0].replace(/\./g, "").replace(",", "."));
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  async searchMatch(homeTeam, awayTeam) {
    try {
      await this.page.goto(`${BASE}/pt-br/sports/futebol/`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      await DELAYS.afterPageLoad();
      for (const sel of SEL.search) {
        try {
          await humanType(this.page, sel, homeTeam, { timeout: 3e3 });
          await DELAYS.afterSearch();
          const terms = [homeTeam, `${homeTeam} vs`, `${homeTeam} x`, awayTeam];
          for (const term of terms) {
            try {
              const links = await this.page.$$(`a[href*="futebol"]`);
              for (const link of links) {
                const text = (await link.textContent() ?? "").toLowerCase();
                if (text.includes(homeTeam.toLowerCase()) || text.includes(awayTeam.toLowerCase())) {
                  return await link.getAttribute("href");
                }
              }
            } catch {
              continue;
            }
          }
          break;
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  async placeBet(order) {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await this.page.goto(`${BASE}/pt-br/sports/futebol/`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      const matchUrl = await this.searchMatch(order.homeTeam, order.awayTeam);
      if (matchUrl) {
        const fullUrl = matchUrl.startsWith("http") ? matchUrl : `${BASE}${matchUrl}`;
        await this.page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 15e3 });
        await DELAYS.afterPageLoad();
      } else {
        await humanScroll(this.page, 300);
        await humanDelay(800, 200);
      }
      const marketClicked = await this.findAndClickMarket(order);
      if (!marketClicked) {
        return { success: false, bookmaker: "betano", order, error: `Mercado n\xE3o encontrado: ${order.marketLabel}`, errorCode: "MARKET_CLOSED", timestamp: ts };
      }
      const betslipOk = await waitForSelector(this.page, SEL.betslip.join(", "), 1e4);
      if (!betslipOk) {
        return { success: false, bookmaker: "betano", order, error: "Betslip n\xE3o apareceu", errorCode: "CONFIRM_FAILED", timestamp: ts };
      }
      await humanDelay(900, 250);
      const stakeOk = await this.fillStake(order.stake);
      if (!stakeOk) {
        return { success: false, bookmaker: "betano", order, error: "Campo de valor n\xE3o encontrado", errorCode: "CONFIRM_FAILED", timestamp: ts };
      }
      await DELAYS.beforeBetConfirm();
      const currentOdds = await this.getCurrentOdds();
      const maxSlippage = order.maxOddsSlippage ?? 0.03;
      if (currentOdds && currentOdds < order.odds * (1 - maxSlippage)) {
        return {
          success: false,
          bookmaker: "betano",
          order,
          error: `Odd caiu al\xE9m do limite: esperada ${order.odds.toFixed(2)}, atual ${currentOdds.toFixed(2)}`,
          errorCode: "ODDS_CHANGED",
          timestamp: ts
        };
      }
      if (currentOdds && order.odds > 0) {
        const diff = Math.abs(currentOdds - order.odds) / order.odds;
        if (diff > 0.05) {
          return {
            success: false,
            bookmaker: "betano",
            order,
            error: `Odd com varia\xE7\xE3o excessiva (${(diff * 100).toFixed(1)}%)`,
            errorCode: "ODDS_CHANGED",
            timestamp: ts
          };
        }
      }
      const confirmOk = await trySelectors(this.page, SEL.confirm, "click", void 0, 6e3);
      if (!confirmOk) {
        return { success: false, bookmaker: "betano", order, error: "Bot\xE3o de confirma\xE7\xE3o n\xE3o encontrado", errorCode: "CONFIRM_FAILED", timestamp: ts };
      }
      await DELAYS.afterBetConfirm();
      const betId = await this.extractBetId();
      if (betId) {
        return { success: true, bookmaker: "betano", order, betId, confirmedOdds: currentOdds ?? order.odds, confirmedStake: order.stake, timestamp: ts };
      }
      const errMsg = await this.extractError();
      return { success: false, bookmaker: "betano", order, error: errMsg ?? "Confirma\xE7\xE3o n\xE3o detectada", errorCode: "CONFIRM_FAILED", timestamp: ts };
    } catch (err) {
      return { success: false, bookmaker: "betano", order, error: err instanceof Error ? err.message : String(err), errorCode: "NETWORK_ERROR", timestamp: ts };
    }
  }
  // ── Helpers ────────────────────────────────────────────────
  async findAndClickMarket(order) {
    const marketTexts = {
      result: order.selection === "home" ? [order.homeTeam, "1"] : order.selection === "away" ? [order.awayTeam, "2"] : ["Empate", "X"],
      over_goals: [`Mais de ${this.lineFromLabel(order.marketLabel)}`, `Over ${this.lineFromLabel(order.marketLabel)}`, `+${this.lineFromLabel(order.marketLabel)}`],
      btts: ["Ambas as equipes marcam - Sim", "Ambos marcam - Sim", "Sim"],
      corners: [`Mais de ${this.lineFromLabel(order.marketLabel)} escanteios`, `Over ${this.lineFromLabel(order.marketLabel)} escanteios`, "Escanteios"],
      cards: [`Mais de ${this.lineFromLabel(order.marketLabel)} cart\xF5es`, "Cart\xF5es"],
      handicap: [order.marketLabel, `Handicap ${this.lineFromLabel(order.marketLabel)}`],
      halftime: ["1\xBA Tempo", "Intervalo", "Primeiro Tempo"]
    };
    const texts = marketTexts[order.marketType] ?? [order.marketLabel, order.selection];
    for (const text of texts) {
      try {
        const el = await this.page.locator(`text="${text}"`).first().elementHandle({ timeout: 2e3 });
        if (el) {
          await humanClick(this.page, `text="${text}"`);
          return true;
        }
      } catch {
        continue;
      }
    }
    try {
      const buttons = await this.page.$$('button[class*="odd"], button[class*="Odd"], [data-testid*="odd"]');
      for (const btn of buttons) {
        const txt = (await btn.textContent() ?? "").trim();
        if (texts.some((t) => txt.toLowerCase().includes(t.toLowerCase()))) {
          await btn.click();
          return true;
        }
      }
    } catch {
    }
    return false;
  }
  lineFromLabel(label) {
    const match = label.match(/(\d+\.?\d*)/);
    return match ? match[1] : "2.5";
  }
  async fillStake(stake) {
    for (const sel of SEL.stake) {
      try {
        await fillStakeInput(this.page, sel, stake);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }
  async getCurrentOdds() {
    for (const sel of SEL.odds) {
      try {
        const el = await this.page.$(sel);
        if (el) {
          const text = await el.textContent() ?? "";
          const match = text.match(/[\d.]+/);
          if (match) return parseFloat(match[0]);
        }
      } catch {
        continue;
      }
    }
    return null;
  }
  async extractBetId() {
    for (const sel of SEL.success) {
      try {
        const el = await this.page.$(sel);
        if (el) {
          const text = await el.textContent() ?? "";
          const idMatch = text.match(/[A-Z0-9]{6,20}/);
          return idMatch ? idMatch[0] : `BETANO_${Date.now()}`;
        }
      } catch {
        continue;
      }
    }
    return null;
  }
  async extractError() {
    for (const sel of SEL.error) {
      try {
        const el = await this.page.$(sel);
        if (el) return (await el.textContent())?.trim() ?? null;
      } catch {
        continue;
      }
    }
    return null;
  }
};

// server/automation/adapters/bet365.ts
var BASE2 = "https://www.bet365.bet.br";
var Bet365Adapter = class {
  constructor(page) {
    this.page = page;
  }
  async isLoggedIn() {
    try {
      await this.page.goto(`${BASE2}/#/HO/`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      await DELAYS.afterPageLoad();
      return !!await this.page.$('.hm-BalanceWithBetslip_Balance, .hm-LoggedInHeader, [class*="BalanceWithBetslip"], [class*="LoggedIn"]');
    } catch {
      return false;
    }
  }
  async login(username, password) {
    try {
      await this.page.goto(`${BASE2}/#/HO/`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      if (await hasCaptcha(this.page)) return false;
      await trySelectors(this.page, [
        '.hm-LoginButton, [class*="LoginButton"]',
        'button:has-text("Entrar")',
        '[aria-label*="Login" i]'
      ], "click", void 0, 8e3);
      await DELAYS.afterPageLoad();
      await trySelectors(this.page, ['input[name="username"]', 'input[id*="username"]', 'input[placeholder*="Usu\xE1rio" i]'], "fill", username, 5e3);
      await humanDelay(600, 150);
      await trySelectors(this.page, ['input[name="password"]', 'input[type="password"]'], "fill", password, 5e3);
      await DELAYS.beforeClick();
      await trySelectors(this.page, ['button[type="submit"]', ".lpb-LoginButtonV2", 'button:has-text("Entrar")'], "click", void 0, 5e3);
      await DELAYS.afterLogin();
      return await this.isLoggedIn();
    } catch {
      return false;
    }
  }
  async getBalance() {
    try {
      const el = await this.page.$('.hm-BalanceWithBetslip_Balance, [class*="BalanceWithBetslip"]');
      if (!el) return null;
      const text = await el.textContent() ?? "";
      const m = text.match(/[\d.,]+/);
      return m ? parseFloat(m[0].replace(/\./g, "").replace(",", ".")) : null;
    } catch {
      return null;
    }
  }
  async searchMatch(homeTeam, awayTeam) {
    try {
      await this.page.goto(`${BASE2}/#/SO/`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      const searchOk = await trySelectors(this.page, [
        '.sm-Search, [class*="SearchBox"]',
        'button[aria-label*="Pesquisar" i]',
        '[class*="SearchIcon"]'
      ], "click", void 0, 5e3);
      if (searchOk) {
        await trySelectors(this.page, ['input[type="search"]', ".sm-SearchInput"], "fill", homeTeam, 3e3);
        await DELAYS.afterSearch();
        const links = await this.page.$$('a[href*="futebol"], a[href*="soccer"]');
        for (const link of links) {
          const txt = (await link.textContent() ?? "").toLowerCase();
          if (txt.includes(homeTeam.toLowerCase()) && txt.includes(awayTeam.toLowerCase())) {
            return await link.getAttribute("href");
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  async placeBet(order) {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await this.page.goto(`${BASE2}/#/SO/`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      const matchUrl = await this.searchMatch(order.homeTeam, order.awayTeam);
      if (matchUrl) {
        await this.page.goto(matchUrl.startsWith("http") ? matchUrl : `${BASE2}${matchUrl}`, { waitUntil: "domcontentloaded", timeout: 15e3 });
        await DELAYS.afterPageLoad();
      }
      const marketTexts = this.getMarketTexts(order);
      let clicked = false;
      for (const text of marketTexts) {
        try {
          const el = await this.page.locator(`text="${text}"`).first().elementHandle({ timeout: 2e3 });
          if (el) {
            await humanClick(this.page, `text="${text}"`);
            clicked = true;
            break;
          }
        } catch {
          continue;
        }
      }
      if (!clicked) return { success: false, bookmaker: "bet365", order, error: "Mercado n\xE3o encontrado", errorCode: "MARKET_CLOSED", timestamp: ts };
      const betslipOk = await waitForSelector(this.page, '.bs-BetslipBox, [class*="BetslipBox"], .bss-StandardSinglesBet', 1e4);
      if (!betslipOk) return { success: false, bookmaker: "bet365", order, error: "Betslip n\xE3o apareceu", errorCode: "CONFIRM_FAILED", timestamp: ts };
      await humanDelay(800, 200);
      const stakeOk = await trySelectors(
        this.page,
        ['input.bss-BetStakeInput, [class*="BetStakeInput"]', 'input[class*="stake" i]', '.bs-BetslipBox input[type="text"]'],
        "fill",
        order.stake.toFixed(2).replace(".", ","),
        5e3
      );
      if (!stakeOk) return { success: false, bookmaker: "bet365", order, error: "Campo stake n\xE3o encontrado", errorCode: "CONFIRM_FAILED", timestamp: ts };
      await DELAYS.beforeBetConfirm();
      const confirmOk = await trySelectors(
        this.page,
        ['.bs-PlaceBets, [class*="PlaceBets"]', 'button:has-text("Fazer aposta")', 'button:has-text("Confirmar")'],
        "click",
        void 0,
        6e3
      );
      if (!confirmOk) return { success: false, bookmaker: "bet365", order, error: "Confirmar n\xE3o encontrado", errorCode: "CONFIRM_FAILED", timestamp: ts };
      await DELAYS.afterBetConfirm();
      const successEl = await this.page.$('.bs-ReceiptSingle, [class*="Receipt"], [class*="BetSuccess"]');
      if (successEl) {
        return { success: true, bookmaker: "bet365", order, betId: `B365_${Date.now()}`, confirmedOdds: order.odds, confirmedStake: order.stake, timestamp: ts };
      }
      const errEl = await this.page.$('[class*="Error"], [class*="Alert"], [role="alert"]');
      const errMsg = errEl ? await errEl.textContent() : null;
      return { success: false, bookmaker: "bet365", order, error: errMsg ?? "Confirma\xE7\xE3o n\xE3o detectada", errorCode: "CONFIRM_FAILED", timestamp: ts };
    } catch (err) {
      return { success: false, bookmaker: "bet365", order, error: err instanceof Error ? err.message : String(err), errorCode: "NETWORK_ERROR", timestamp: ts };
    }
  }
  getMarketTexts(order) {
    const lineMatch = order.marketLabel.match(/(\d+\.?\d*)/);
    const line = lineMatch ? lineMatch[1] : "2.5";
    const map = {
      result: order.selection === "home" ? ["1", order.homeTeam] : order.selection === "away" ? ["2", order.awayTeam] : ["X", "Empate"],
      over_goals: [`Mais de ${line}`, `Over ${line}`, `Acima de ${line}`],
      btts: ["Ambas marcam - Sim", "Sim"],
      corners: [`Mais de ${line}`, `Escanteios Over ${line}`],
      cards: [`Mais de ${line}`, "Cart\xF5es"],
      halftime: ["Intervalo/Final", "1\xBA Tempo"]
    };
    return map[order.marketType] ?? [order.marketLabel];
  }
};

// server/automation/adapters/others.ts
var BaseAdapter = class {
  constructor(page) {
    this.page = page;
  }
  async isLoggedIn() {
    try {
      await this.page.goto(`${this.BASE}`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      await DELAYS.afterPageLoad();
      for (const sel of this.SEL.balance) {
        if (await this.page.$(sel)) return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  async login(username, password) {
    try {
      await this.page.goto(`${this.BASE}`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      if (await hasCaptcha(this.page)) return false;
      await trySelectors(this.page, this.SEL.loginBtn, "click", void 0, 5e3);
      await DELAYS.afterPageLoad();
      const userOk = await trySelectors(this.page, this.SEL.username, "fill", username, 5e3);
      if (!userOk) throw new Error("Campo usu\xE1rio n\xE3o encontrado");
      await humanDelay(500, 150);
      const passOk = await trySelectors(this.page, this.SEL.password, "fill", password, 5e3);
      if (!passOk) throw new Error("Campo senha n\xE3o encontrado");
      await DELAYS.beforeClick();
      await trySelectors(this.page, this.SEL.submit, "click", void 0, 5e3);
      await DELAYS.afterLogin();
      return await this.isLoggedIn();
    } catch {
      return false;
    }
  }
  async getBalance() {
    try {
      for (const sel of this.SEL.balance) {
        const el = await this.page.$(sel);
        if (el) {
          const text = await el.textContent() ?? "";
          const m = text.match(/[\d.,]+/);
          if (m) return parseFloat(m[0].replace(/\./g, "").replace(",", "."));
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  async searchMatch(homeTeam, awayTeam) {
    try {
      await this.page.goto(`${this.BASE}${this.SPORTS_PATH}`, { waitUntil: "domcontentloaded", timeout: 15e3 });
      await DELAYS.afterPageLoad();
      const links = await this.page.$$('a[href*="futebol"], a[href*="soccer"], a[href*="football"]');
      for (const link of links) {
        const txt = (await link.textContent() ?? "").toLowerCase();
        if (txt.includes(homeTeam.toLowerCase()) || txt.includes(awayTeam.toLowerCase())) {
          return await link.getAttribute("href");
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  async placeBet(order) {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await this.page.goto(`${this.BASE}${this.SPORTS_PATH}`, { waitUntil: "domcontentloaded", timeout: 2e4 });
      await DELAYS.afterPageLoad();
      const matchUrl = await this.searchMatch(order.homeTeam, order.awayTeam);
      if (matchUrl) {
        const full = matchUrl.startsWith("http") ? matchUrl : `${this.BASE}${matchUrl}`;
        await this.page.goto(full, { waitUntil: "domcontentloaded", timeout: 15e3 });
        await DELAYS.afterPageLoad();
      }
      const marketTexts = this.getMarketTexts(order);
      let clicked = false;
      for (const text of marketTexts) {
        try {
          const el = await this.page.locator(`text="${text}"`).first().elementHandle({ timeout: 2e3 });
          if (el) {
            await humanClick(this.page, `text="${text}"`);
            clicked = true;
            break;
          }
        } catch {
          continue;
        }
      }
      if (!clicked) {
        const btns = await this.page.$$('button[class*="odd" i], button[class*="bet" i], [data-testid*="odd"]');
        for (const btn of btns) {
          const txt = (await btn.textContent() ?? "").toLowerCase();
          if (marketTexts.some((t) => txt.includes(t.toLowerCase()))) {
            await btn.click();
            clicked = true;
            break;
          }
        }
      }
      if (!clicked) {
        return { success: false, bookmaker: this.NAME, order, error: `Mercado n\xE3o encontrado: ${order.marketLabel}`, errorCode: "MARKET_CLOSED", timestamp: ts };
      }
      const betslipOk = await waitForSelector(this.page, this.SEL.betslip.join(", "), 1e4);
      if (!betslipOk) {
        return { success: false, bookmaker: this.NAME, order, error: "Betslip n\xE3o apareceu", errorCode: "CONFIRM_FAILED", timestamp: ts };
      }
      await humanDelay(800, 200);
      const stakeOk = await trySelectors(this.page, this.SEL.stake, "fill", order.stake.toFixed(2).replace(".", ","), 5e3);
      if (!stakeOk) {
        return { success: false, bookmaker: this.NAME, order, error: "Campo de valor n\xE3o encontrado", errorCode: "CONFIRM_FAILED", timestamp: ts };
      }
      await DELAYS.beforeBetConfirm();
      const confirmOk = await trySelectors(this.page, this.SEL.confirm, "click", void 0, 6e3);
      if (!confirmOk) {
        return { success: false, bookmaker: this.NAME, order, error: "Bot\xE3o confirmar n\xE3o encontrado", errorCode: "CONFIRM_FAILED", timestamp: ts };
      }
      await DELAYS.afterBetConfirm();
      for (const sel of this.SEL.success) {
        const el = await this.page.$(sel);
        if (el) {
          return { success: true, bookmaker: this.NAME, order, betId: `${this.NAME.toUpperCase()}_${Date.now()}`, confirmedOdds: order.odds, confirmedStake: order.stake, timestamp: ts };
        }
      }
      for (const sel of this.SEL.error) {
        const el = await this.page.$(sel);
        if (el) {
          const msg = await el.textContent();
          return { success: false, bookmaker: this.NAME, order, error: msg?.trim() ?? "Erro desconhecido", errorCode: "CONFIRM_FAILED", timestamp: ts };
        }
      }
      return { success: false, bookmaker: this.NAME, order, error: "Confirma\xE7\xE3o n\xE3o detectada", errorCode: "CONFIRM_FAILED", timestamp: ts };
    } catch (err) {
      return { success: false, bookmaker: this.NAME, order, error: err instanceof Error ? err.message : String(err), errorCode: "NETWORK_ERROR", timestamp: ts };
    }
  }
  getMarketTexts(order) {
    const lineMatch = order.marketLabel.match(/(\d+\.?\d*)/);
    const line = lineMatch ? lineMatch[1] : "2.5";
    const map = {
      result: order.selection === "home" ? [order.homeTeam, "1"] : order.selection === "away" ? [order.awayTeam, "2"] : ["Empate", "X"],
      over_goals: [`Mais de ${line}`, `Over ${line}`, `+${line} gols`],
      btts: ["Ambos marcam - Sim", "Ambas marcam - Sim", "Sim"],
      corners: [`Mais de ${line}`, `Over ${line} escanteios`],
      cards: [`Mais de ${line}`, "Cart\xF5es"]
    };
    return map[order.marketType] ?? [order.marketLabel, order.selection];
  }
};
var SuperbetAdapter = class extends BaseAdapter {
  constructor() {
    super(...arguments);
    this.BASE = "https://superbet.bet.br";
    this.SPORTS_PATH = "/pt-br/esportes/futebol";
    this.NAME = "superbet";
    this.SEL = {
      balance: ['[class*="balance" i]', '[class*="Balance"]', '[data-testid*="balance"]', '[class*="saldo"]'],
      loginBtn: ['button:has-text("Entrar")', '[class*="loginBtn"]', '[data-testid="login"]', '[class*="Login"]'],
      username: ['input[type="email"]', 'input[name="username"]', 'input[name="login"]', 'input[placeholder*="email" i]'],
      password: ['input[type="password"]', 'input[name="password"]'],
      submit: ['button[type="submit"]', 'button:has-text("Entrar")', 'button:has-text("Login")'],
      stake: ['input[class*="stake" i]', 'input[placeholder*="Valor" i]', 'input[class*="amount" i]', '[class*="betslip" i] input[type="number"]'],
      confirm: ['button:has-text("Confirmar aposta")', 'button:has-text("Fazer aposta")', 'button:has-text("Apostar")', 'button:has-text("Confirmar")', '[class*="confirmBet"]', '[class*="ConfirmBet"]'],
      success: ['[class*="success" i]', 'text="Aposta realizada"', 'text="Apostado"', '[class*="confirmation" i]'],
      error: ['[class*="error" i]', '[role="alert"]', '[class*="Alert"]'],
      betslip: ['[class*="betslip" i]', '[class*="Betslip"]', '[class*="BetSlip"]', '[data-testid*="betslip"]']
    };
  }
};
var KTO_Adapter = class extends BaseAdapter {
  constructor() {
    super(...arguments);
    this.BASE = "https://www.kto.bet.br";
    this.SPORTS_PATH = "/sports/futebol";
    this.NAME = "kto";
    this.SEL = {
      balance: ['[class*="balance" i]', '[class*="Balance"]', '[data-qa*="balance"]', ".header-balance"],
      loginBtn: ['button:has-text("Entrar")', '[class*="loginButton"]', ".login-button", 'a[href*="login"]'],
      username: ['input[name="username"]', 'input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]'],
      password: ['input[type="password"]', 'input[name="password"]'],
      submit: ['button[type="submit"]', 'button:has-text("Entrar")', 'button:has-text("Confirmar")'],
      stake: ['input[class*="stake" i]', 'input[placeholder*="Valor" i]', 'input[data-qa*="stake"]', '[class*="betslip" i] input'],
      confirm: ['button:has-text("Confirmar")', 'button:has-text("Fazer aposta")', 'button:has-text("Apostar")', '[data-qa*="place-bet"]', '[class*="placeBet"]'],
      success: ['[class*="success" i]', 'text="Aposta confirmada"', 'text="Aposta realizada"', '[class*="receipt"]'],
      error: ['[class*="error" i]', '[role="alert"]'],
      betslip: ['[class*="betslip" i]', '[class*="BetSlip"]', ".bet-slip"]
    };
  }
};
var EstrelaBetAdapter = class extends BaseAdapter {
  constructor() {
    super(...arguments);
    this.BASE = "https://www.estrelabet.bet.br";
    this.SPORTS_PATH = "/sports/football";
    this.NAME = "estrelabet";
    this.SEL = {
      balance: ['[class*="balance" i]', '[class*="Balance"]', '[class*="saldo"]'],
      loginBtn: ['button:has-text("Entrar")', '[class*="login"]', 'a[href*="login"]'],
      username: ['input[name="username"]', 'input[type="email"]', 'input[placeholder*="email" i]'],
      password: ['input[type="password"]', 'input[name="password"]'],
      submit: ['button[type="submit"]', 'button:has-text("Entrar")', 'button:has-text("Login")'],
      stake: ['input[class*="stake" i]', 'input[placeholder*="Valor" i]', '[class*="betslip" i] input[type="number"]'],
      confirm: ['button:has-text("Confirmar")', 'button:has-text("Apostar")', 'button:has-text("Fazer aposta")', '[class*="confirmBet"]'],
      success: ['[class*="success" i]', 'text="Aposta realizada"', '[class*="confirmation"]'],
      error: ['[class*="error" i]', '[role="alert"]'],
      betslip: ['[class*="betslip" i]', '[class*="BetSlip"]']
    };
  }
};

// server/automation/engine.ts
import * as fs2 from "fs";
import * as path2 from "path";
import * as crypto from "crypto";
var SESSIONS_DIR = path2.resolve(process.cwd(), "data", "sessions");
var LOG_DIR = path2.resolve(process.cwd(), "data", "bet_logs");
var SCREENS_DIR = path2.resolve(process.cwd(), "data", "screenshots");
var DAILY_FILE = path2.resolve(process.cwd(), "data", "daily_totals.json");
var ADAPTERS = {
  betano: BetanoAdapter,
  bet365: Bet365Adapter,
  superbet: SuperbetAdapter,
  kto: KTO_Adapter,
  estrelabet: EstrelaBetAdapter
};
var Mutex = class {
  constructor() {
    this.queue = [];
    this.locked = false;
  }
  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise((resolve3) => this.queue.push(resolve3));
  }
  release() {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
};
function loadDailyTotals() {
  try {
    if (!fs2.existsSync(DAILY_FILE)) return {};
    return JSON.parse(fs2.readFileSync(DAILY_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveDailyTotals(t) {
  fs2.mkdirSync(path2.dirname(DAILY_FILE), { recursive: true });
  fs2.writeFileSync(DAILY_FILE, JSON.stringify(t, null, 2));
}
function todayKey() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE");
}
function addDailyStake(accountId, stake) {
  const totals = loadDailyTotals();
  const today = todayKey();
  if (!totals[accountId] || totals[accountId].date !== today) {
    totals[accountId] = { date: today, staked: 0, bets: 0 };
  }
  totals[accountId].staked += stake;
  totals[accountId].bets++;
  saveDailyTotals(totals);
  return totals;
}
function getDailyStake(accountId) {
  const totals = loadDailyTotals();
  const entry = totals[accountId];
  if (!entry || entry.date !== todayKey()) return 0;
  return entry.staked;
}
var AutomationEngine = class {
  constructor() {
    this.browser = null;
    this.contexts = /* @__PURE__ */ new Map();
    this.status = /* @__PURE__ */ new Map();
    this.mutexes = /* @__PURE__ */ new Map();
    // Bet queue
    this.queue = [];
    this.queueMap = /* @__PURE__ */ new Map();
  }
  // ── Browser init ────────────────────────────────────────────
  async init() {
    fs2.mkdirSync(SESSIONS_DIR, { recursive: true });
    fs2.mkdirSync(LOG_DIR, { recursive: true });
    fs2.mkdirSync(SCREENS_DIR, { recursive: true });
    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--window-size=1440,900",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process"
      ]
    });
    console.log("[AutoEngine v3] Browser iniciado");
  }
  async shutdown() {
    for (const ctx of this.contexts.values()) await ctx.close().catch(() => {
    });
    await this.browser?.close().catch(() => {
    });
    this.browser = null;
    console.log("[AutoEngine] Encerrado");
  }
  // ── Mutex per bookmaker ─────────────────────────────────────
  getMutex(bookmaker) {
    if (!this.mutexes.has(bookmaker)) this.mutexes.set(bookmaker, new Mutex());
    return this.mutexes.get(bookmaker);
  }
  // ── Context with full anti-detection ───────────────────────
  async getContext(account) {
    const contextKey = account.id;
    if (this.contexts.has(contextKey)) return this.contexts.get(contextKey);
    if (!this.browser) await this.init();
    const sessionFile = path2.join(SESSIONS_DIR, `${account.id}_${account.bookmaker}.json`);
    const storageState = fs2.existsSync(sessionFile) ? sessionFile : void 0;
    const ua = randomUserAgent();
    const ctx = await this.browser.newContext({
      storageState,
      viewport: { width: 1440, height: 900 },
      userAgent: ua,
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      geolocation: { latitude: -23.5505 + (Math.random() * 0.01 - 5e-3), longitude: -46.6333 + (Math.random() * 0.01 - 5e-3) },
      permissions: ["geolocation"],
      colorScheme: "light",
      extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" },
      javaScriptEnabled: true,
      bypassCSP: false
    });
    await ctx.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => void 0 });
      const fakePlugins = [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
        { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
      ];
      Object.defineProperty(navigator, "plugins", {
        get: () => Object.assign(fakePlugins, { item: (i) => fakePlugins[i], namedItem: (n) => fakePlugins.find((p) => p.name === n) ?? null })
      });
      Object.defineProperty(navigator, "languages", { get: () => ["pt-BR", "pt", "en-US", "en"] });
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const dataURL = origToDataURL.call(this, type, quality);
        if (type === "image/png") {
          return dataURL.slice(0, -6) + btoa(String.fromCharCode(Math.floor(Math.random() * 3))).slice(0, 4) + "==";
        }
        return dataURL;
      };
      const origGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) return "Intel Inc.";
        if (param === 37446) return "Intel Iris OpenGL Engine";
        return origGetParameter.call(this, param);
      };
      window.chrome = {
        runtime: {},
        loadTimes: () => ({ startLoadTime: Date.now() / 1e3 - Math.random() * 2 }),
        csi: () => ({ onloadT: Date.now(), pageT: Math.random() * 1e3 })
      };
      Object.defineProperty(screen, "colorDepth", { get: () => 24 });
      Object.defineProperty(screen, "pixelDepth", { get: () => 24 });
    });
    this.contexts.set(contextKey, ctx);
    return ctx;
  }
  async saveSession(account) {
    const ctx = this.contexts.get(account.id);
    if (!ctx) return;
    await ctx.storageState({ path: path2.join(SESSIONS_DIR, `${account.id}_${account.bookmaker}.json`) });
  }
  // ── Login ───────────────────────────────────────────────────
  async login(account) {
    const AdapterClass = ADAPTERS[account.bookmaker];
    if (!AdapterClass) return { success: false, message: `Casa "${account.bookmaker}" n\xE3o suportada` };
    return this.getMutex(account.bookmaker).run(async () => {
      this.setStatus(account.id, { state: "logging_in", message: "Fazendo login..." });
      try {
        const ctx = await this.getContext(account);
        const page = await ctx.newPage();
        const adapter = new AdapterClass(page);
        const alreadyIn = await adapter.isLoggedIn().catch(() => false);
        if (alreadyIn) {
          const balance = await adapter.getBalance().catch(() => null);
          await page.close();
          this.setStatus(account.id, { state: "ready", message: "Sess\xE3o ativa", balance: balance ?? void 0 });
          return { success: true, message: "Sess\xE3o j\xE1 ativa" };
        }
        const ok = await adapter.login(account.username, account.password);
        if (ok) {
          const balance = await adapter.getBalance().catch(() => null);
          await this.saveSession(account);
          await page.close();
          this.setStatus(account.id, { state: "ready", message: "Login realizado", balance: balance ?? void 0 });
          return { success: true, message: "Login realizado com sucesso" };
        } else {
          await page.close();
          this.setStatus(account.id, { state: "error", message: "Falha no login \u2014 credenciais ou CAPTCHA" });
          return { success: false, message: "Credenciais inv\xE1lidas ou CAPTCHA detectado" };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.setStatus(account.id, { state: "error", message: msg });
        return { success: false, message: msg };
      }
    });
  }
  // ── Place bet (single, with retry) ─────────────────────────
  async placeBet(bookmaker, order, account, maxRetries = 3) {
    const AdapterClass = ADAPTERS[bookmaker];
    if (!AdapterClass) {
      return { success: false, bookmaker, error: `Casa "${bookmaker}" n\xE3o suportada`, errorCode: "UNKNOWN", order };
    }
    return this.getMutex(bookmaker).run(async () => {
      let lastResult = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const t0 = Date.now();
        const ctx = await this.getContext(account);
        const page = await ctx.newPage();
        try {
          this.setStatus(account.id, {
            state: "placing_bet",
            message: `${attempt > 1 ? `Tentativa ${attempt}/${maxRetries}: ` : ""}${order.matchLabel} \u2014 ${order.marketLabel}`
          });
          const adapter = new AdapterClass(page);
          const loggedIn = await adapter.isLoggedIn().catch(() => false);
          if (!loggedIn) {
            await page.close();
            lastResult = { success: false, bookmaker, error: "Sess\xE3o expirada", errorCode: "SESSION_EXPIRED", order };
            if (attempt === 1) {
              const relogin = await this.login(account);
              if (!relogin.success) break;
              continue;
            }
            break;
          }
          const balance = await adapter.getBalance().catch(() => null);
          if (balance !== null && balance < order.stake) {
            await page.close();
            lastResult = { success: false, bookmaker, error: `Saldo insuficiente: R$ ${balance.toFixed(2)}`, errorCode: "INSUFFICIENT_FUNDS", order };
            break;
          }
          const todayStaked = getDailyStake(account.id);
          if (todayStaked + order.stake > account.maxDailyStake) {
            await page.close();
            lastResult = {
              success: false,
              bookmaker,
              error: `Limite di\xE1rio atingido: R$ ${todayStaked.toFixed(2)} / R$ ${account.maxDailyStake.toFixed(2)}`,
              errorCode: "STAKE_LIMIT",
              order
            };
            break;
          }
          const result = await adapter.placeBet(order);
          result.durationMs = Date.now() - t0;
          const screenshotName = `${account.id}_${bookmaker}_${Date.now()}_${result.success ? "ok" : "err"}.png`;
          const screenshotPath = path2.join(SCREENS_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {
          });
          result.screenshotPath = screenshotPath;
          await this.saveSession(account);
          await page.close();
          this.logBet(bookmaker, order, result, account.id, account.ownerUserId);
          if (result.success) {
            const totals = addDailyStake(account.id, order.stake);
            this.setStatus(account.id, {
              state: "ready",
              message: `\u2713 Aposta realizada: ${result.betId ?? "confirmada"}`,
              balance: balance ?? void 0,
              todayStake: totals[account.id]?.staked,
              todayBets: totals[account.id]?.bets
            });
            return result;
          }
          lastResult = result;
          const retryable = result.errorCode !== "INSUFFICIENT_FUNDS" && result.errorCode !== "STAKE_LIMIT" && result.errorCode !== "MARKET_CLOSED";
          if (!retryable || attempt >= maxRetries) break;
          const backoff = Math.pow(3, attempt) * 5e3;
          console.warn(`[AutoEngine] Tentativa ${attempt} falhou (${result.errorCode}). Backoff ${backoff}ms`);
          this.setStatus(account.id, { state: "cooldown", message: `Aguardando ${Math.round(backoff / 1e3)}s antes de tentar novamente...` });
          await humanDelay(backoff, backoff * 0.1);
        } catch (err) {
          await page.close().catch(() => {
          });
          const msg = err instanceof Error ? err.message : String(err);
          lastResult = { success: false, bookmaker, error: msg, errorCode: "NETWORK_ERROR", order, durationMs: Date.now() - t0 };
          if (attempt < maxRetries) {
            const backoff = Math.pow(3, attempt) * 5e3;
            this.setStatus(account.id, { state: "cooldown", message: `Erro de rede. Aguardando ${Math.round(backoff / 1e3)}s...` });
            await humanDelay(backoff, backoff * 0.1);
          }
        }
      }
      const final = lastResult ?? { success: false, bookmaker, error: "Todas as tentativas falharam", errorCode: "UNKNOWN", order };
      this.setStatus(account.id, { state: "error", message: final.error ?? "Erro desconhecido" });
      this.logBet(bookmaker, order, final, account.id, account.ownerUserId);
      return final;
    });
  }
  // ── Bet Queue ───────────────────────────────────────────────
  addToQueue(accountId, bookmaker, order, maxRetries = 3, ownerUserId) {
    const item = {
      id: crypto.randomUUID(),
      accountId,
      ownerUserId,
      bookmaker,
      order,
      addedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "queued",
      retries: 0,
      maxRetries
    };
    this.queue.push(item);
    this.queueMap.set(item.id, item);
    return item;
  }
  async runQueue(accounts, ownerUserId) {
    const pending = this.queue.filter((i) => i.status === "queued" && (ownerUserId == null || i.ownerUserId === ownerUserId));
    const results = [];
    for (const item of pending) {
      const account = accounts.find((a) => a.id === item.accountId);
      if (!account || !account.enabled) {
        item.status = "failed";
        item.result = { success: false, bookmaker: item.bookmaker, error: "Conta n\xE3o encontrada ou desativada", order: item.order };
        results.push(item);
        continue;
      }
      item.status = "running";
      const result = await this.placeBet(item.bookmaker, item.order, account, item.maxRetries);
      item.result = result;
      item.status = result.success ? "done" : "failed";
      results.push(item);
      if (pending.indexOf(item) < pending.length - 1) {
        await humanDelay(9e3, 2500);
      }
    }
    return results;
  }
  cancelQueueItem(id) {
    const item = this.queueMap.get(id);
    if (!item || item.status !== "queued") return false;
    item.status = "cancelled";
    return true;
  }
  getQueue(ownerUserId) {
    return [...this.queue].filter((item) => ownerUserId == null || item.ownerUserId === ownerUserId);
  }
  clearQueue(ownerUserId) {
    this.queue = this.queue.filter((i) => i.status === "running" || ownerUserId != null && i.ownerUserId !== ownerUserId);
  }
  // ── Balance ─────────────────────────────────────────────────
  async getBalance(account) {
    const AdapterClass = ADAPTERS[account.bookmaker];
    if (!AdapterClass) return null;
    const ctx = await this.getContext(account);
    const page = await ctx.newPage();
    try {
      const adapter = new AdapterClass(page);
      const balance = await adapter.getBalance();
      await page.close();
      if (balance !== null) {
        const s = this.status.get(account.id);
        if (s) this.setStatus(account.id, { ...s, balance });
      }
      return balance;
    } catch {
      await page.close().catch(() => {
      });
      return null;
    }
  }
  // ── Status ──────────────────────────────────────────────────
  setStatus(key, status) {
    this.status.set(key, { ...status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  }
  getStatus(key) {
    return this.status.get(key) ?? null;
  }
  getAllStatus() {
    return Object.fromEntries(this.status.entries());
  }
  // ── Logging ─────────────────────────────────────────────────
  logBet(bookmaker, order, result, accountId, ownerUserId) {
    const logFile = path2.join(LOG_DIR, `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.jsonl`);
    const entry = JSON.stringify({
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      accountId,
      ownerUserId,
      bookmaker,
      match: order.matchLabel,
      market: order.marketLabel,
      odds: order.odds,
      stake: order.stake,
      success: result.success,
      betId: result.betId,
      errorCode: result.errorCode,
      error: result.error,
      durationMs: result.durationMs,
      screenshot: result.screenshotPath ? path2.basename(result.screenshotPath) : void 0
    });
    fs2.appendFileSync(logFile, entry + "\n");
  }
  getLogs(days = 7, ownerUserId, accountIds) {
    const entries = [];
    if (!fs2.existsSync(LOG_DIR)) return entries;
    const files = fs2.readdirSync(LOG_DIR).filter((f) => f.endsWith(".jsonl")).sort().slice(-days);
    for (const file of files) {
      for (const line of fs2.readFileSync(path2.join(LOG_DIR, file), "utf8").trim().split("\n")) {
        if (line) try {
          entries.push(JSON.parse(line));
        } catch {
        }
      }
    }
    return entries.filter((entry) => ownerUserId == null || Number(entry.ownerUserId ?? -1) === ownerUserId).filter((entry) => !accountIds?.length || accountIds.includes(String(entry.accountId ?? ""))).reverse();
  }
};
var engine = new AutomationEngine();
function randomUserAgent() {
  const agents = [
    // Chrome 124 Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Safari/537.36",
    // Chrome 124 Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Safari/537.36",
    // Chrome 125 Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.60 Safari/537.36",
    // Chrome 125 Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

// server/automation/types.ts
var BOOKMAKER_DEFS = {
  betano: {
    id: "betano",
    name: "Betano",
    url: "https://www.betano.bet.br",
    logoUrl: "https://www.betano.bet.br/favicon.ico",
    color: "#e4002b",
    supportedMarkets: ["result", "over_goals", "btts", "handicap", "corners", "cards"]
  },
  bet365: {
    id: "bet365",
    name: "bet365",
    url: "https://www.bet365.bet.br",
    logoUrl: "https://www.bet365.bet.br/favicon.ico",
    color: "#1d7a00",
    supportedMarkets: ["result", "over_goals", "btts", "handicap", "corners", "cards", "halftime"]
  },
  superbet: {
    id: "superbet",
    name: "Superbet",
    url: "https://superbet.bet.br",
    logoUrl: "https://superbet.bet.br/favicon.ico",
    color: "#ff6600",
    supportedMarkets: ["result", "over_goals", "btts", "corners"]
  },
  kto: {
    id: "kto",
    name: "KTO",
    url: "https://www.kto.bet.br",
    logoUrl: "https://www.kto.bet.br/favicon.ico",
    color: "#00a8e0",
    supportedMarkets: ["result", "over_goals", "btts"]
  },
  estrelabet: {
    id: "estrelabet",
    name: "EstrelaBet",
    url: "https://www.estrelabet.bet.br",
    logoUrl: "https://www.estrelabet.bet.br/favicon.ico",
    color: "#ffd700",
    supportedMarkets: ["result", "over_goals", "btts", "corners"]
  }
};

// server/automationRouter.ts
init_auth();
init_audit();
var router = express.Router();
var DATA_DIR = path3.resolve(process.cwd(), "data");
var KEY_FILE = path3.join(DATA_DIR, "key.bin");
router.use(requireAuth, requirePlan("elite"));
function getKey() {
  if (fs3.existsSync(KEY_FILE)) return fs3.readFileSync(KEY_FILE);
  const key = crypto2.randomBytes(32);
  fs3.mkdirSync(DATA_DIR, { recursive: true });
  fs3.writeFileSync(KEY_FILE, key, { mode: 384 });
  return key;
}
function encrypt(text) {
  const key = getKey();
  const iv = crypto2.randomBytes(16);
  const cipher = crypto2.createCipheriv("aes-256-cbc", key, iv);
  return `${iv.toString("hex")}:${Buffer.concat([cipher.update(text, "utf8"), cipher.final()]).toString("hex")}`;
}
function decrypt(data) {
  const key = getKey();
  const [ivHex, encHex] = data.split(":");
  const decipher = crypto2.createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex")).toString("utf8") + decipher.final().toString("utf8");
}
function mapAccountRow(row) {
  return {
    id: String(row.id),
    ownerUserId: Number(row.user_id),
    bookmaker: String(row.bookmaker),
    name: String(row.name),
    username: String(row.username),
    password: decrypt(String(row.encrypted_password)),
    maxDailyStake: Number(row.maxDailyStake),
    maxSingleStake: Number(row.maxSingleStake),
    maxOddsAccepted: Number(row.maxOddsAccepted),
    minOddsAccepted: Number(row.minOddsAccepted),
    enabled: Boolean(row.enabled),
    createdAt: String(row.createdAt)
  };
}
function loadAccountsForUser(userId) {
  const rows = schema_default.prepare(`SELECT * FROM automation_accounts WHERE user_id = ? ORDER BY updated_at DESC`).all(userId);
  return rows.map(mapAccountRow);
}
function getAccountForUser(userId, accountId) {
  return loadAccountsForUser(userId).find((account) => account.id === accountId);
}
function checkLimits(account, order) {
  if (order.stake > account.maxSingleStake) return `Stake R$ ${order.stake} excede limite por aposta (R$ ${account.maxSingleStake})`;
  if (order.odds < (account.minOddsAccepted ?? 1.01)) return `Odd ${order.odds} abaixo do m\xEDnimo configurado (${account.minOddsAccepted ?? 1.01})`;
  if (account.maxOddsAccepted && order.odds > account.maxOddsAccepted) return `Odd ${order.odds} acima do m\xE1ximo configurado (${account.maxOddsAccepted})`;
  return null;
}
router.get("/bookmakers", (_req, res) => {
  res.json({ bookmakers: Object.entries(BOOKMAKER_DEFS).map(([id, def]) => ({ ...def, supported: !!ADAPTERS[id] })) });
});
router.get("/accounts", (req, res) => {
  const accounts = loadAccountsForUser(req.user.id).map((a) => ({ ...a, password: "***" }));
  res.json({ accounts });
});
router.post("/accounts", express.json(), (req, res) => {
  const body = req.body;
  if (!body.bookmaker || !body.username || !body.password) return res.status(400).json({ error: "bookmaker, username e password s\xE3o obrigat\xF3rios" });
  if (!ADAPTERS[body.bookmaker]) return res.status(400).json({ error: `Casa "${body.bookmaker}" n\xE3o suportada` });
  const account = {
    id: body.id ?? `${body.bookmaker}_${crypto2.randomUUID()}`,
    ownerUserId: req.user.id,
    bookmaker: body.bookmaker,
    name: body.name ?? body.bookmaker,
    username: body.username,
    password: body.password,
    maxDailyStake: body.maxDailyStake ?? 500,
    maxSingleStake: body.maxSingleStake ?? 100,
    maxOddsAccepted: body.maxOddsAccepted ?? 10,
    minOddsAccepted: body.minOddsAccepted ?? 1.05,
    enabled: body.enabled ?? true,
    createdAt: body.createdAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
  schema_default.prepare(`
    INSERT INTO automation_accounts (
      id, user_id, bookmaker, name, username, encrypted_password,
      maxDailyStake, maxSingleStake, maxOddsAccepted, minOddsAccepted, enabled, createdAt, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(id) DO UPDATE SET
      bookmaker = excluded.bookmaker,
      name = excluded.name,
      username = excluded.username,
      encrypted_password = excluded.encrypted_password,
      maxDailyStake = excluded.maxDailyStake,
      maxSingleStake = excluded.maxSingleStake,
      maxOddsAccepted = excluded.maxOddsAccepted,
      minOddsAccepted = excluded.minOddsAccepted,
      enabled = excluded.enabled,
      updated_at = unixepoch()
  `).run(
    account.id,
    req.user.id,
    account.bookmaker,
    account.name,
    account.username,
    encrypt(account.password),
    account.maxDailyStake,
    account.maxSingleStake,
    account.maxOddsAccepted,
    account.minOddsAccepted,
    account.enabled ? 1 : 0,
    account.createdAt
  );
  writeAuditLog(req.user.id, "automation.account.upsert", { accountId: account.id, bookmaker: account.bookmaker }, req.user.id, req.ip ?? null);
  res.json({ success: true, account: { ...account, password: "***" } });
});
router.patch("/accounts/:id", express.json(), (req, res) => {
  const current = getAccountForUser(req.user.id, req.params.id);
  if (!current) return res.status(404).json({ error: "Conta n\xE3o encontrada" });
  const body = req.body;
  const next = {
    ...current,
    ...body,
    id: current.id,
    ownerUserId: req.user.id,
    password: body.password ?? current.password
  };
  schema_default.prepare(`
    UPDATE automation_accounts SET
      bookmaker = ?,
      name = ?,
      username = ?,
      encrypted_password = ?,
      maxDailyStake = ?,
      maxSingleStake = ?,
      maxOddsAccepted = ?,
      minOddsAccepted = ?,
      enabled = ?,
      updated_at = unixepoch()
    WHERE id = ? AND user_id = ?
  `).run(
    next.bookmaker,
    next.name,
    next.username,
    encrypt(next.password),
    next.maxDailyStake,
    next.maxSingleStake,
    next.maxOddsAccepted,
    next.minOddsAccepted,
    next.enabled ? 1 : 0,
    next.id,
    req.user.id
  );
  writeAuditLog(req.user.id, "automation.account.update", { accountId: next.id }, req.user.id, req.ip ?? null);
  res.json({ success: true });
});
router.delete("/accounts/:id", (req, res) => {
  const result = schema_default.prepare(`DELETE FROM automation_accounts WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Conta n\xE3o encontrada" });
  writeAuditLog(req.user.id, "automation.account.delete", { accountId: req.params.id }, req.user.id, req.ip ?? null);
  res.json({ success: true });
});
router.post("/login", express.json(), async (req, res) => {
  const { accountId } = req.body;
  const account = getAccountForUser(req.user.id, accountId);
  if (!account) return res.status(404).json({ error: "Conta n\xE3o encontrada" });
  const result = await engine.login(account);
  writeAuditLog(req.user.id, "automation.login", { accountId }, req.user.id, req.ip ?? null);
  res.json(result);
});
router.get("/status", (req, res) => {
  const accountIds = new Set(loadAccountsForUser(req.user.id).map((account) => account.id));
  const all = engine.getAllStatus();
  const filtered = Object.fromEntries(Object.entries(all).filter(([key]) => accountIds.has(key)));
  res.json({ status: filtered });
});
router.get("/balance/:accountId", async (req, res) => {
  const account = getAccountForUser(req.user.id, req.params.accountId);
  if (!account) return res.status(404).json({ error: "Conta n\xE3o encontrada" });
  const balance = await engine.getBalance(account);
  res.json({ bookmaker: account.bookmaker, balance });
});
router.post("/bet", express.json(), async (req, res) => {
  const { accountId, order } = req.body;
  if (!accountId || !order) return res.status(400).json({ error: "accountId e order obrigat\xF3rios" });
  const account = getAccountForUser(req.user.id, accountId);
  if (!account) return res.status(404).json({ error: "Conta n\xE3o encontrada" });
  if (!account.enabled) return res.status(400).json({ error: "Conta desativada" });
  const limitErr = checkLimits(account, order);
  if (limitErr) return res.status(400).json({ error: limitErr });
  const result = await engine.placeBet(account.bookmaker, order, account);
  writeAuditLog(req.user.id, "automation.bet.single", { accountId, success: result.success, bookmaker: account.bookmaker }, req.user.id, req.ip ?? null);
  res.json(result);
});
router.post("/bet/multi", express.json(), async (req, res) => {
  const { accountIds, order } = req.body;
  const owned = loadAccountsForUser(req.user.id);
  const accounts = owned.filter((account) => accountIds.includes(account.id) && account.enabled);
  if (!accounts.length) return res.status(400).json({ error: "Nenhuma conta v\xE1lida" });
  const results = await Promise.allSettled(
    accounts.map(async (account) => {
      const err = checkLimits(account, order);
      if (err) return { success: false, bookmaker: account.bookmaker, error: err };
      return engine.placeBet(account.bookmaker, order, account);
    })
  );
  writeAuditLog(req.user.id, "automation.bet.multi", { accounts: accounts.map((a) => a.id), count: accounts.length }, req.user.id, req.ip ?? null);
  res.json({
    results: results.map((r, i) => ({
      bookmaker: accounts[i]?.bookmaker,
      ...r.status === "fulfilled" ? r.value : { success: false, error: String(r.reason) }
    }))
  });
});
router.get("/queue", (req, res) => {
  res.json({ queue: engine.getQueue(req.user.id) });
});
router.post("/queue", express.json(), (req, res) => {
  const { accountId, order, maxRetries = 3 } = req.body;
  const account = getAccountForUser(req.user.id, accountId);
  if (!account) return res.status(404).json({ error: "Conta n\xE3o encontrada" });
  const err = checkLimits(account, order);
  if (err) return res.status(400).json({ error: err });
  const item = engine.addToQueue(accountId, account.bookmaker, order, maxRetries, req.user.id);
  res.json({ success: true, queueItemId: item.id, item });
});
router.post("/queue/run", async (req, res) => {
  const accounts = loadAccountsForUser(req.user.id);
  const results = await engine.runQueue(accounts, req.user.id);
  res.json({ results: results.filter((item) => item.ownerUserId === req.user.id) });
});
router.delete("/queue/:id", (req, res) => {
  const item = engine.getQueue(req.user.id).find((entry) => entry.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Item n\xE3o encontrado" });
  const ok = engine.cancelQueueItem(req.params.id);
  res.json({ success: ok, message: ok ? "Cancelado" : "Item n\xE3o encontrado ou j\xE1 executando" });
});
router.delete("/queue", (req, res) => {
  engine.clearQueue(req.user.id);
  res.json({ success: true });
});
router.get("/logs", (req, res) => {
  const days = Number(req.query.days ?? 7);
  const accountIds = loadAccountsForUser(req.user.id).map((account) => account.id);
  res.json({ entries: engine.getLogs(days, req.user.id, accountIds) });
});
router.get("/screenshots", (req, res) => {
  const dir = path3.resolve(process.cwd(), "data", "screenshots");
  if (!fs3.existsSync(dir)) return res.json({ files: [] });
  const accountIds = new Set(loadAccountsForUser(req.user.id).map((account) => account.id));
  const files = fs3.readdirSync(dir).filter((file) => file.endsWith(".png")).filter((file) => {
    const prefix = file.split("_")[0];
    return accountIds.has(prefix);
  }).sort().reverse().slice(0, 50).map((file) => {
    const parts = file.split("_");
    return { name: file, accountId: parts[0], bookmaker: parts[1], ts: parts[2], ok: file.includes("_ok") };
  });
  res.json({ files });
});
router.get("/screenshots/:name", (req, res) => {
  const safeName = req.params.name.replace(/\//g, "");
  const accountIds = new Set(loadAccountsForUser(req.user.id).map((account) => account.id));
  const prefix = safeName.split("_")[0];
  if (!accountIds.has(prefix)) return res.status(404).end();
  const file = path3.resolve(process.cwd(), "data", "screenshots", safeName);
  if (!fs3.existsSync(file) || !file.endsWith(".png")) return res.status(404).end();
  res.setHeader("Content-Type", "image/png");
  fs3.createReadStream(file).pipe(res);
});
router.post("/shutdown", requireAdmin, async (_req, res) => {
  await engine.shutdown();
  res.json({ success: true });
});
var automationRouter_default = router;

// server/index.ts
init_auth();

// server/lib/oddsFeed.ts
var oddsStore = /* @__PURE__ */ new Map();
function normalizeNumber(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
function saveOdds(payload) {
  const entry = {
    matchId: String(payload.matchId),
    source: payload.source || "webhook",
    provider: payload.provider || "Feed externo",
    homeTeam: payload.homeTeam,
    awayTeam: payload.awayTeam,
    league: payload.league,
    homeOdds: normalizeNumber(payload.homeOdds),
    drawOdds: normalizeNumber(payload.drawOdds),
    awayOdds: normalizeNumber(payload.awayOdds),
    over25Odds: normalizeNumber(payload.over25Odds),
    under25Odds: normalizeNumber(payload.under25Odds),
    over85CornersOdds: normalizeNumber(payload.over85CornersOdds),
    over35CardsOdds: normalizeNumber(payload.over35CardsOdds),
    raw: payload.raw,
    receivedAt: Date.now()
  };
  oddsStore.set(entry.matchId, entry);
  return entry;
}
function getOddsEntry(matchId) {
  return oddsStore.get(matchId);
}
function listLatestOdds(limit = 50) {
  return [...oddsStore.values()].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, limit);
}
function listAllOdds() {
  return [...oddsStore.values()];
}

// server/routes/bots.ts
init_schema();
init_auth();
import { Router } from "express";

// server/lib/botEngine.ts
init_schema();
import nodemailer from "nodemailer";
function getMailer() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}
function parseRaw(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const num = (k, fb) => {
    const v = Number(source[k]);
    return Number.isFinite(v) ? v : fb;
  };
  const minute = num("minute", 60);
  const homeScore = num("homeScore", 0);
  const awayScore = num("awayScore", 0);
  const homePressure = num("homePressure", 58);
  const awayPressure = num("awayPressure", 46);
  const homeCorners = num("homeCorners", 4);
  const awayCorners = num("awayCorners", 3);
  const homeCards = num("homeCards", 1);
  const awayCards = num("awayCards", 1);
  const dangerousAttacks = num("dangerousAttacks", Math.round((homePressure + awayPressure) * 1.5));
  return {
    minute,
    homeScore,
    awayScore,
    totalGoals: homeScore + awayScore,
    homePressure,
    awayPressure,
    pressure: Math.max(homePressure, awayPressure),
    homeCorners,
    awayCorners,
    totalCorners: homeCorners + awayCorners,
    homeCards,
    awayCards,
    totalCards: homeCards + awayCards,
    dangerousAttacks
  };
}
function levelForScore(score) {
  if (score >= 85) return "strong";
  if (score >= 68) return "medium";
  return "light";
}
function pushReason(reasons, condition, message, points, scoreObj) {
  if (!condition) return;
  reasons.push(message);
  scoreObj.score += points;
}
function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "");
}
function evaluateBotAgainstEntry(config, entry) {
  const metrics = parseRaw(entry.raw);
  const scoreObj = { score: 35 };
  const reasons = [];
  const cat = config.category || "custom";
  let market = config.market || "Sinal customizado";
  let selection = market;
  let impliedOdds = entry.homeOdds ?? entry.over25Odds ?? 1.9;
  if (config.minMinute != null && metrics.minute < config.minMinute) return null;
  if (config.maxMinute != null && metrics.minute > config.maxMinute) return null;
  if (config.maxGoals != null && metrics.totalGoals > config.maxGoals) return null;
  if (config.minGoals != null && metrics.totalGoals < config.minGoals) return null;
  if (config.minPressure != null && metrics.pressure < config.minPressure) return null;
  if (config.minDangerousAttacks != null && metrics.dangerousAttacks < config.minDangerousAttacks) return null;
  if (config.minHomeCorners != null && metrics.homeCorners < config.minHomeCorners) return null;
  if (config.minAwayCorners != null && metrics.awayCorners < config.minAwayCorners) return null;
  if (config.minTotalCorners != null && metrics.totalCorners < config.minTotalCorners) return null;
  if (config.minCards != null && metrics.totalCards < config.minCards) return null;
  if (cat === "over15_2t_live") {
    market = "Over 1.5 no 2\xBA tempo";
    selection = "Over 1.5 2T";
    impliedOdds = entry.over25Odds ?? 1.95;
    pushReason(reasons, metrics.minute >= 46, "Jogo j\xE1 est\xE1 no 2\xBA tempo", 12, scoreObj);
    pushReason(reasons, metrics.totalGoals <= 2, "Placar ainda deixa espa\xE7o para abertura", 10, scoreObj);
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 72), `Press\xE3o alta (${metrics.pressure})`, 14, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 110), `Ataques perigosos em alta (${metrics.dangerousAttacks})`, 14, scoreObj);
    pushReason(reasons, (entry.over25Odds ?? 99) <= (config.maxOver25Odds ?? 2.1), `Odd do over ainda dentro da faixa (${(entry.over25Odds ?? 0).toFixed(2)})`, 10, scoreObj);
  } else if (cat === "over05_ft_live") {
    market = "Over 0.5 FT";
    selection = "Gol ainda no 1\xBA tempo";
    impliedOdds = entry.over25Odds ? Math.max(1.28, Math.min(1.72, entry.over25Odds - 0.45)) : 1.55;
    pushReason(reasons, metrics.minute <= 35, "Jogo ainda est\xE1 em janela cedo", 8, scoreObj);
    pushReason(reasons, metrics.totalGoals === 0, "Placar zerado", 12, scoreObj);
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 65), `Press\xE3o acumulada (${metrics.pressure})`, 14, scoreObj);
    pushReason(reasons, metrics.totalCorners >= (config.minTotalCorners ?? 3), `Escanteios j\xE1 aceleraram o jogo (${metrics.totalCorners})`, 8, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 75), "Ataques perigosos acima do corte", 14, scoreObj);
  } else if (cat === "over05_55_live") {
    market = "Over 0.5 aos 55'";
    selection = "Gol ap\xF3s 55";
    impliedOdds = entry.over25Odds ? Math.max(1.45, Math.min(2.15, entry.over25Odds - 0.2)) : 1.8;
    pushReason(reasons, metrics.minute >= (config.minMinute ?? 55), "Jogo passou do minuto cr\xEDtico", 12, scoreObj);
    pushReason(reasons, metrics.totalGoals === 0, "Placar continua zerado", 12, scoreObj);
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 74), `Press\xE3o forte aos ${metrics.minute}'`, 15, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 120), "Ataques perigosos sustentados", 14, scoreObj);
    pushReason(reasons, metrics.totalCorners >= (config.minTotalCorners ?? 7), `Escanteios refor\xE7am o cen\xE1rio (${metrics.totalCorners})`, 8, scoreObj);
  } else if (cat === "corners_pressure_live") {
    market = "Escanteios por press\xE3o";
    selection = "Over escanteios";
    impliedOdds = entry.over85CornersOdds ?? 1.88;
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 76), `Press\xE3o muito alta (${metrics.pressure})`, 16, scoreObj);
    pushReason(reasons, metrics.totalCorners >= (config.minTotalCorners ?? 7), `Linha de cantos j\xE1 quente (${metrics.totalCorners})`, 14, scoreObj);
    pushReason(reasons, metrics.minute >= (config.minMinute ?? 30), "Janela live madura", 8, scoreObj);
  } else if (cat === "cards_pressure_live") {
    market = "Cart\xF5es por temperatura";
    selection = "Over cart\xF5es";
    impliedOdds = entry.over35CardsOdds ?? 1.82;
    pushReason(reasons, metrics.totalCards >= (config.minCards ?? 2), `Cart\xF5es j\xE1 apareceram (${metrics.totalCards})`, 12, scoreObj);
    pushReason(reasons, metrics.minute >= (config.minMinute ?? 25), "Jogo j\xE1 mostrou amostra comportamental", 8, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 80), "Ritmo alto eleva o contato", 8, scoreObj);
  } else if (cat === "home_favorite_value") {
    market = "Favorito em valor";
    selection = "Casa vence";
    impliedOdds = entry.homeOdds ?? 1.75;
    pushReason(reasons, (entry.homeOdds ?? 99) <= (config.maxHomeOdds ?? 1.95), `Favorito com odd ainda aceit\xE1vel (${(entry.homeOdds ?? 0).toFixed(2)})`, 12, scoreObj);
    pushReason(reasons, (entry.homeOdds ?? 99) >= (config.minHomeOdds ?? 1.5), "Pre\xE7o n\xE3o est\xE1 esmagado", 10, scoreObj);
    pushReason(reasons, metrics.homePressure >= 58, `Mandante pressionando mais (${metrics.homePressure})`, 12, scoreObj);
  } else {
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 60), "Jogo atende press\xE3o m\xEDnima", 12, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 70), "Ataques perigosos suficientes", 12, scoreObj);
  }
  const level = levelForScore(scoreObj.score);
  if (config.requireLevel === "strong" && level !== "strong") return null;
  if (config.requireLevel === "medium" && level === "light") return null;
  if (reasons.length === 0) return null;
  return { entry, metrics, reasons, score: scoreObj.score, level, market, selection, impliedOdds };
}
function buildAlertBody(botName, match) {
  const label = `${match.entry.homeTeam || "Casa"} x ${match.entry.awayTeam || "Visitante"}`;
  return [
    `\u{1F6A8} ${botName}`,
    `${label}${match.entry.league ? ` \xB7 ${match.entry.league}` : ""}`,
    `Mercado: ${match.market}`,
    `Momento: ${match.metrics.minute}' \xB7 press\xE3o ${match.metrics.pressure} \xB7 escanteios ${match.metrics.totalCorners} \xB7 cart\xF5es ${match.metrics.totalCards}`,
    `For\xE7a do sinal: ${match.level.toUpperCase()} (${match.score}/100)`,
    `Motivos: ${match.reasons.slice(0, 3).join(" \u2022 ")}`
  ].join("\n");
}
async function sendAppNotification(userId, title, body) {
  schema_default.prepare(`INSERT INTO notifications (user_id, title, body, type, action_url) VALUES (?, ?, ?, 'info', '/automacao')`).run(userId, title, body);
  return true;
}
async function sendEmail(email, title, body) {
  const mailer = getMailer();
  if (!mailer) return false;
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@raphaguru.com",
    to: email,
    subject: title,
    text: body,
    html: body.replace(/\n/g, "<br>")
  });
  return true;
}
async function sendWhatsApp(phone, body) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) return false;
  const to = normalizePhone(phone);
  if (!to) return false;
  const res = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } })
  });
  return res.ok;
}
async function deliverBotAlert(userId, channels, title, body) {
  const user = schema_default.prepare(`SELECT id, email, phone, name FROM users WHERE id = ?`).get(userId);
  if (!user) return [{ channel: "app", ok: false, error: "Usu\xE1rio n\xE3o encontrado" }];
  const results = [];
  for (const channel of channels) {
    try {
      if (channel === "app") {
        await sendAppNotification(userId, title, body);
        results.push({ channel, ok: true });
      } else if (channel === "email") {
        if (!user.email) results.push({ channel, ok: false, error: "Usu\xE1rio sem e-mail" });
        else {
          const ok = await sendEmail(user.email, title, body);
          results.push({ channel, ok, ...ok ? {} : { error: "SMTP n\xE3o configurado" } });
        }
      } else if (channel === "whatsapp") {
        if (!user.phone) results.push({ channel, ok: false, error: "Usu\xE1rio sem telefone" });
        else {
          const ok = await sendWhatsApp(user.phone, body);
          results.push({ channel, ok, ...ok ? {} : { error: "WhatsApp Cloud API n\xE3o configurada" } });
        }
      }
    } catch (err) {
      results.push({ channel, ok: false, error: err instanceof Error ? err.message : "Falha desconhecida" });
    }
  }
  return results;
}
function cooldownActive(botId, matchId, cooldownMinutes) {
  const row = schema_default.prepare(`
    SELECT triggered_at
    FROM bot_alerts
    WHERE bot_id = ? AND match_id = ?
    ORDER BY triggered_at DESC
    LIMIT 1
  `).get(botId, matchId);
  if (!row) return false;
  const cooldownMs = cooldownMinutes * 60 * 1e3;
  return Date.now() - row.triggered_at * 1e3 < cooldownMs;
}
async function runBotScanOnce(botId) {
  const bots = botId ? schema_default.prepare(`SELECT * FROM user_bots WHERE id = ? AND status = 'active'`).all(botId) : schema_default.prepare(`SELECT * FROM user_bots WHERE status = 'active'`).all();
  const feed = listAllOdds();
  const runStarted = Math.floor(Date.now() / 1e3);
  const allResults = [];
  for (const bot of bots) {
    const config = JSON.parse(String(bot.config_json || "{}"));
    const channels = JSON.parse(String(bot.channels_json || '["app"]'));
    const matches = feed.map((entry) => evaluateBotAgainstEntry(config, entry)).filter(Boolean);
    let matched = 0;
    let alerts = 0;
    for (const match of matches) {
      if (cooldownActive(Number(bot.id), match.entry.matchId, config.cooldownMinutes ?? 30)) continue;
      matched += 1;
      const body = buildAlertBody(String(bot.name), match);
      const title = `${String(bot.name)} \xB7 ${match.market}`;
      const deliveries = await deliverBotAlert(Number(bot.user_id), channels, title, body);
      schema_default.prepare(`
        INSERT INTO bot_alerts (
          bot_id, user_id, match_id, match_label, league, market, signal_json, channel_status_json, outcome_status, triggered_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', unixepoch(), unixepoch())
      `).run(
        bot.id,
        bot.user_id,
        match.entry.matchId,
        `${match.entry.homeTeam || "Casa"} x ${match.entry.awayTeam || "Visitante"}`,
        match.entry.league ?? null,
        match.market,
        JSON.stringify({ score: match.score, level: match.level, reasons: match.reasons, metrics: match.metrics, impliedOdds: match.impliedOdds, entry: match.entry }),
        JSON.stringify(deliveries)
      );
      alerts += 1;
      allResults.push({ bot_id: bot.id, match_id: match.entry.matchId, market: match.market, level: match.level, delivered: deliveries });
    }
    schema_default.prepare(`
      INSERT INTO bot_runs (bot_id, user_id, scanned_count, matched_count, alerts_sent, status, started_at, ended_at)
      VALUES (?, ?, ?, ?, ?, 'done', ?, unixepoch())
    `).run(bot.id, bot.user_id, feed.length, matched, alerts, runStarted);
    schema_default.prepare(`
      UPDATE user_bots
      SET run_count = COALESCE(run_count,0) + 1,
          alert_count = COALESCE(alert_count,0) + ?,
          last_run_at = unixepoch(),
          last_alert_at = CASE WHEN ? > 0 THEN unixepoch() ELSE last_alert_at END,
          next_run_at = unixepoch() + 60,
          updated_at = unixepoch()
      WHERE id = ?
    `).run(alerts, alerts, bot.id);
  }
  return { scannedBots: bots.length, feedSize: feed.length, results: allResults };
}
var interval = null;
function startBotScheduler() {
  if (interval) return;
  interval = setInterval(() => {
    runBotScanOnce().catch((err) => console.error("[bots] scheduler:", err));
  }, 6e4);
}
function stopBotScheduler() {
  if (interval) clearInterval(interval);
  interval = null;
}
function listTemplateCards() {
  return schema_default.prepare(`SELECT * FROM bot_templates ORDER BY sort_order ASC, id ASC`).all();
}
function botStatsForUser(userId) {
  const overview = schema_default.prepare(`
    SELECT
      COUNT(*) total_bots,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) active_bots,
      COALESCE(SUM(alert_count),0) total_alerts,
      COALESCE(SUM(win_count),0) total_wins,
      COALESCE(SUM(loss_count),0) total_losses,
      COALESCE(SUM(roi_units),0) total_roi_units,
      COALESCE(SUM(run_count),0) total_runs
    FROM user_bots WHERE user_id = ?
  `).get(userId);
  const byFilter = schema_default.prepare(`
    SELECT category, COUNT(*) bots, COALESCE(SUM(alert_count),0) alerts, COALESCE(SUM(win_count),0) wins, COALESCE(SUM(loss_count),0) losses
    FROM user_bots WHERE user_id = ? GROUP BY category ORDER BY alerts DESC, wins DESC
  `).all(userId);
  const recent = schema_default.prepare(`
    SELECT a.*, b.name bot_name, b.category
    FROM bot_alerts a
    JOIN user_bots b ON b.id = a.bot_id
    WHERE a.user_id = ?
    ORDER BY a.triggered_at DESC
    LIMIT 60
  `).all(userId);
  const hitRate = Number(overview.total_wins || 0) + Number(overview.total_losses || 0) > 0 ? Number(overview.total_wins || 0) / (Number(overview.total_wins || 0) + Number(overview.total_losses || 0)) : 0;
  return { overview: { ...overview, hit_rate: hitRate }, by_filter: byFilter, recent_alerts: recent };
}

// server/routes/bots.ts
init_audit();
var router2 = Router();
router2.use(requireAuth, requirePlan("pro"));
function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(String(value)) : fallback;
  } catch {
    return fallback;
  }
}
function mapBotRow(row) {
  return {
    ...row,
    config: parseJSON(row.config_json, {}),
    channels: parseJSON(row.channels_json, ["app"])
  };
}
router2.get("/bots/templates", (_req, res) => {
  const templates = listTemplateCards().map((row) => ({
    ...row,
    default_channels: parseJSON(row.default_channels, ["app"]),
    config: parseJSON(row.config_json, {})
  }));
  res.json({ templates });
});
router2.get("/bots", (req, res) => {
  const bots = schema_default.prepare(`SELECT * FROM user_bots WHERE user_id = ? ORDER BY updated_at DESC, id DESC`).all(req.user.id);
  const alerts = schema_default.prepare(`
    SELECT a.*, b.name bot_name, b.category
    FROM bot_alerts a JOIN user_bots b ON b.id = a.bot_id
    WHERE a.user_id = ?
    ORDER BY a.triggered_at DESC
    LIMIT 50
  `).all(req.user.id);
  res.json({ bots: bots.map(mapBotRow), alerts, stats: botStatsForUser(req.user.id), feed: listLatestOdds(24) });
});
router2.post("/bots/templates/:slug/activate", (req, res) => {
  const tpl = schema_default.prepare(`SELECT * FROM bot_templates WHERE slug = ? LIMIT 1`).get(req.params.slug);
  if (!tpl) return res.status(404).json({ error: "Template n\xE3o encontrado" });
  const custom = req.body;
  const name = String(custom.name || tpl.name);
  const description = String(custom.description || tpl.description || "");
  const channels = Array.isArray(custom.channels) && custom.channels.length ? custom.channels : parseJSON(tpl.default_channels, ["app"]);
  const config = { ...parseJSON(tpl.config_json, {}), ...custom.config && typeof custom.config === "object" ? custom.config : {} };
  const r = schema_default.prepare(`
    INSERT INTO user_bots (user_id, template_id, name, description, category, mode, status, config_json, channels_json, next_run_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, unixepoch() + 30)
  `).run(req.user.id, tpl.id, name, description, tpl.category, tpl.mode, JSON.stringify(config), JSON.stringify(channels));
  writeAuditLog(req.user.id, "bots.template.activate", { template: tpl.slug, botId: r.lastInsertRowid }, req.user.id, req.ip ?? null);
  res.json({ ok: true, id: r.lastInsertRowid });
});
router2.post("/bots", (req, res) => {
  const body = req.body;
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  if (!name || !category) return res.status(400).json({ error: "name e category s\xE3o obrigat\xF3rios" });
  const channels = Array.isArray(body.channels) && body.channels.length ? body.channels : ["app"];
  const config = body.config && typeof body.config === "object" ? body.config : {};
  const r = schema_default.prepare(`
    INSERT INTO user_bots (user_id, name, description, category, mode, status, config_json, channels_json, next_run_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch() + 30)
  `).run(req.user.id, name, String(body.description || ""), category, String(body.mode || "live"), body.status === "paused" ? "paused" : "active", JSON.stringify(config), JSON.stringify(channels));
  writeAuditLog(req.user.id, "bots.create", { botId: r.lastInsertRowid, category }, req.user.id, req.ip ?? null);
  res.json({ ok: true, id: r.lastInsertRowid });
});
router2.patch("/bots/:id", (req, res) => {
  const bot = schema_default.prepare(`SELECT * FROM user_bots WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot n\xE3o encontrado" });
  const body = req.body;
  const channels = Array.isArray(body.channels) ? body.channels : parseJSON(bot.channels_json, ["app"]);
  const config = body.config && typeof body.config === "object" ? body.config : parseJSON(bot.config_json, {});
  schema_default.prepare(`
    UPDATE user_bots SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      channels_json = ?,
      config_json = ?,
      updated_at = unixepoch()
    WHERE id = ? AND user_id = ?
  `).run(body.name ?? null, body.description ?? null, body.status ?? null, JSON.stringify(channels), JSON.stringify(config), req.params.id, req.user.id);
  writeAuditLog(req.user.id, "bots.update", { botId: req.params.id }, req.user.id, req.ip ?? null);
  res.json({ ok: true });
});
router2.post("/bots/:id/toggle", (req, res) => {
  const bot = schema_default.prepare(`SELECT id, status FROM user_bots WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot n\xE3o encontrado" });
  const next = bot.status === "active" ? "paused" : "active";
  schema_default.prepare(`UPDATE user_bots SET status = ?, updated_at = unixepoch() WHERE id = ? AND user_id = ?`).run(next, req.params.id, req.user.id);
  res.json({ ok: true, status: next });
});
router2.delete("/bots/:id", (req, res) => {
  const r = schema_default.prepare(`DELETE FROM user_bots WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
  if (!r.changes) return res.status(404).json({ error: "Bot n\xE3o encontrado" });
  writeAuditLog(req.user.id, "bots.delete", { botId: req.params.id }, req.user.id, req.ip ?? null);
  res.json({ ok: true });
});
router2.post("/bots/scan-now", async (req, res) => {
  const body = req.body;
  if (body?.botId) {
    const owned = schema_default.prepare(`SELECT id FROM user_bots WHERE id = ? AND user_id = ?`).get(body.botId, req.user.id);
    if (!owned) return res.status(404).json({ error: "Bot n\xE3o encontrado" });
  }
  const result = await runBotScanOnce(body?.botId);
  res.json({ ok: true, ...result, stats: botStatsForUser(req.user.id) });
});
router2.get("/bots/alerts", (req, res) => {
  const alerts = schema_default.prepare(`
    SELECT a.*, b.name bot_name, b.category
    FROM bot_alerts a JOIN user_bots b ON b.id = a.bot_id
    WHERE a.user_id = ?
    ORDER BY a.triggered_at DESC
    LIMIT 200
  `).all(req.user.id);
  res.json({ alerts });
});
router2.patch("/bots/alerts/:id/result", (req, res) => {
  const body = req.body;
  const alert = schema_default.prepare(`SELECT * FROM bot_alerts WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);
  if (!alert) return res.status(404).json({ error: "Alerta n\xE3o encontrado" });
  const next = body.outcome_status || "pending";
  schema_default.prepare(`UPDATE bot_alerts SET outcome_status = ?, resolved_at = unixepoch() WHERE id = ? AND user_id = ?`).run(next, req.params.id, req.user.id);
  if (next === "win" || next === "loss") {
    schema_default.prepare(`
      UPDATE user_bots SET
        win_count = win_count + ?,
        loss_count = loss_count + ?,
        roi_units = roi_units + ?,
        updated_at = unixepoch()
      WHERE id = ? AND user_id = ?
    `).run(next === "win" ? 1 : 0, next === "loss" ? 1 : 0, Number(body.roi_units ?? (next === "win" ? 1 : -1)), alert.bot_id, req.user.id);
  }
  res.json({ ok: true, stats: botStatsForUser(req.user.id) });
});
router2.get("/bots/stats", (req, res) => {
  res.json(botStatsForUser(req.user.id));
});
router2.post("/bots/demo-feed", requireAdmin, (_req, res) => {
  const entries = [
    {
      matchId: "live-101",
      source: "demo-bots",
      provider: "Radar Demo",
      league: "Brasil S\xE9rie A",
      homeTeam: "Flamengo",
      awayTeam: "Bahia",
      homeOdds: 1.74,
      drawOdds: 3.8,
      awayOdds: 4.9,
      over25Odds: 1.83,
      under25Odds: 2.05,
      over85CornersOdds: 1.9,
      over35CardsOdds: 1.77,
      raw: { minute: 58, homeScore: 0, awayScore: 0, homePressure: 81, awayPressure: 59, homeCorners: 6, awayCorners: 2, homeCards: 1, awayCards: 2, dangerousAttacks: 132 }
    },
    {
      matchId: "live-102",
      source: "demo-bots",
      provider: "Radar Demo",
      league: "Premier League",
      homeTeam: "Liverpool",
      awayTeam: "Brighton",
      homeOdds: 1.62,
      drawOdds: 4.2,
      awayOdds: 5.5,
      over25Odds: 1.71,
      under25Odds: 2.18,
      over85CornersOdds: 1.84,
      over35CardsOdds: 1.96,
      raw: { minute: 27, homeScore: 0, awayScore: 0, homePressure: 78, awayPressure: 43, homeCorners: 5, awayCorners: 1, homeCards: 0, awayCards: 1, dangerousAttacks: 102 }
    },
    {
      matchId: "live-103",
      source: "demo-bots",
      provider: "Radar Demo",
      league: "La Liga",
      homeTeam: "Getafe",
      awayTeam: "Sevilla",
      homeOdds: 2.26,
      drawOdds: 3.05,
      awayOdds: 3.45,
      over25Odds: 2.02,
      under25Odds: 1.8,
      over85CornersOdds: 1.92,
      over35CardsOdds: 1.69,
      raw: { minute: 63, homeScore: 0, awayScore: 0, homePressure: 69, awayPressure: 67, homeCorners: 4, awayCorners: 5, homeCards: 2, awayCards: 3, dangerousAttacks: 116 }
    }
  ];
  entries.forEach(saveOdds);
  res.json({ ok: true, entries: listLatestOdds(20) });
});
var bots_default = router2;

// server/index.ts
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path4.dirname(__filename);
var ODDS_WEBHOOK_SECRET = process.env.ODDS_WEBHOOK_SECRET || "";
function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGINS || "";
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}
function verifyHmac(rawBody, signature, secret) {
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!rawBody || !signature) return false;
  const provided = signature.replace(/^sha256=/i, "").trim();
  const candidates = [
    crypto5.createHmac("sha256", secret).update(rawBody).digest("hex"),
    crypto5.createHmac("sha256", secret).update(rawBody).digest("base64")
  ];
  return candidates.some((candidate) => {
    try {
      return crypto5.timingSafeEqual(Buffer.from(candidate), Buffer.from(provided));
    } catch {
      return false;
    }
  });
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  const allowedOrigins = parseAllowedOrigins();
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "no-referrer" }
  }));
  app.use(cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, process.env.NODE_ENV !== "production");
      return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true
  }));
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    max: 10,
    message: { error: "Muitas tentativas. Aguarde 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1e3,
    max: 200,
    message: { error: "Limite de requisi\xE7\xF5es atingido." }
  });
  app.use("/api/", apiLimiter);
  app.use("/api/auth/login", loginLimiter);
  app.use(express2.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  }));
  app.use(express2.urlencoded({ extended: true }));
  try {
    await Promise.resolve().then(() => (init_schema(), schema_exports));
    console.log("[Servidor] Banco SaaS pronto");
  } catch (err) {
    console.warn("[Servidor] Banco SaaS indispon\xEDvel:", err);
  }
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, uptime: process.uptime(), now: Date.now(), env: process.env.NODE_ENV || "development" });
  });
  app.get("/api/health/ready", (_req, res) => {
    res.json({ ok: true, automation: true, odds_cache_size: listLatestOdds(5e3).length, bots: true });
  });
  try {
    const [authR, payR, adminR] = await Promise.all([
      Promise.resolve().then(() => (init_auth2(), auth_exports)).then((m) => m.default),
      Promise.resolve().then(() => (init_payments(), payments_exports)).then((m) => m.default),
      Promise.resolve().then(() => (init_admin(), admin_exports)).then((m) => m.default)
    ]);
    const { default: marketingR } = await Promise.resolve().then(() => (init_marketing(), marketing_exports));
    app.use("/api/auth", authR);
    app.use("/api/payments", payR);
    app.use("/api", adminR);
    app.use("/api", marketingR);
    app.use("/api", bots_default);
    console.log("[Servidor] Rotas SaaS: /api/auth, /api/payments, /api/admin, /api/user, /api/admin/crm, /api/admin/campaigns, /api/admin/financial, /api/bots");
  } catch (err) {
    console.warn("[Servidor] Rotas SaaS indispon\xEDveis:", err);
    app.use("/api/auth", (_req, res) => res.status(503).json({ error: "M\xF3dulo SaaS indispon\xEDvel neste ambiente", detalhes: ["Instale depend\xEAncias: better-sqlite3, bcryptjs, jsonwebtoken"] }));
    app.use("/api/payments", (_req, res) => res.status(503).json({ error: "Pagamentos indispon\xEDveis neste ambiente", detalhes: ["Defina PAGARME_API_KEY e instale as depend\xEAncias do m\xF3dulo SaaS"] }));
  }
  app.post("/api/webhooks/odds", (req, res) => {
    const signature = String(req.headers["x-webhook-signature"] || req.headers["x-hub-signature"] || "");
    if (!verifyHmac(req.rawBody, signature || void 0, ODDS_WEBHOOK_SECRET)) {
      return res.status(401).json({ ok: false, message: "Assinatura inv\xE1lida" });
    }
    const body = req.body;
    const list = Array.isArray(body) ? body : [body];
    const valid = list.filter((item) => item && item.matchId);
    if (valid.length === 0) return res.status(400).json({ ok: false, message: "Payload precisa incluir matchId" });
    const saved = valid.map(saveOdds);
    return res.json({ ok: true, saved: saved.length, entries: saved });
  });
  app.get("/api/webhooks/odds/latest", (_req, res) => {
    const entries = listLatestOdds(50);
    res.json({ entries });
  });
  app.get("/api/webhooks/odds/:matchId", (req, res) => {
    const entry = getOddsEntry(req.params.matchId);
    if (!entry) return res.status(404).json({ ok: false, message: "Nenhum snapshot para este jogo" });
    return res.json(entry);
  });
  app.post("/api/webhooks/odds/demo", requireAuth, requireAdmin, (_req, res) => {
    const sample = [
      { matchId: "demo-001", source: "demo", provider: "Feed demonstra\xE7\xE3o", homeTeam: "Time da Casa", awayTeam: "Time Visitante", homeOdds: 1.92, drawOdds: 3.35, awayOdds: 4.1, over25Odds: 1.84, under25Odds: 2.01, over85CornersOdds: 1.95, over35CardsOdds: 1.76 },
      { matchId: "demo-002", source: "demo", provider: "Feed demonstra\xE7\xE3o", homeTeam: "Favorito FC", awayTeam: "Zebra SC", homeOdds: 1.68, drawOdds: 3.7, awayOdds: 5, over25Odds: 1.71, under25Odds: 2.1, over85CornersOdds: 1.82, over35CardsOdds: 1.88 }
    ];
    sample.forEach(saveOdds);
    res.json({ ok: true, entries: listLatestOdds(20) });
  });
  try {
    await engine.init();
    app.use("/api/automation", automationRouter_default);
    startBotScheduler();
    console.log("[Servidor] M\xF3dulo de automa\xE7\xE3o carregado");
  } catch (err) {
    console.warn("[Servidor] Automa\xE7\xE3o indispon\xEDvel:", err);
    app.use("/api/automation", (_req, res) => {
      res.status(503).json({ error: "M\xF3dulo de automa\xE7\xE3o indispon\xEDvel neste ambiente", detalhes: ["Instale o Playwright", "Execute: pnpm instalar:automacao", "Reinicie o servidor"] });
    });
  }
  process.on("SIGTERM", async () => {
    await engine.shutdown().catch(() => void 0);
    stopBotScheduler();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await engine.shutdown().catch(() => void 0);
    stopBotScheduler();
    process.exit(0);
  });
  const staticPath = process.env.NODE_ENV === "production" ? path4.resolve(__dirname, "public") : path4.resolve(__dirname, "..", "dist", "public");
  app.use(express2.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path4.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
