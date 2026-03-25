/**
 * Rapha Guru — Banco de Dados SQLite
 * Usa better-sqlite3 (síncrono, sem ORM, máxima performance)
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const DATA   = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA, 'rapha.db');

fs.mkdirSync(DATA, { recursive: true });

export const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// ── Schema completo ───────────────────────────────────────────
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

// ── Seed planos ───────────────────────────────────────────────
const insertPlan = db.prepare(`
  INSERT OR IGNORE INTO plans
    (slug, name, description, price_monthly, price_annual, features, limits, badge_color, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const seedPlans = db.transaction(() => {
  insertPlan.run('free', 'Gratuito', 'Explore sem compromisso', 0, null,
    JSON.stringify(['5 análises/dia', '2 favoritos', 'Histórico 7 dias']),
    JSON.stringify({ analyses_per_day: 5, favorites: 2, betslip: 3, history_days: 7 }),
    '#6b7280', 0);

  insertPlan.run('basic', 'Básico', 'Para apostadores casuais', 29.90, 239.90,
    JSON.stringify(['30 análises/dia', '20 favoritos', 'Histórico 30 dias', 'Suporte por e-mail']),
    JSON.stringify({ analyses_per_day: 30, favorites: 20, betslip: 10, history_days: 30 }),
    '#3b82f6', 1);

  insertPlan.run('pro', 'Pro', 'Para apostadores sérios', 69.90, 559.90,
    JSON.stringify(['Análises ilimitadas', 'Favoritos ilimitados', 'Histórico 90 dias', 'Value bets', 'Alertas ao vivo', 'Suporte prioritário']),
    JSON.stringify({ analyses_per_day: -1, favorites: -1, betslip: 20, history_days: 90 }),
    '#a855f7', 2);

  insertPlan.run('elite', 'Elite', 'Tudo sem limites', 149.90, 1199.90,
    JSON.stringify(['Tudo do Pro', 'Automação de apostas', 'Histórico ilimitado', 'Relatórios PDF', 'API de dados', 'Suporte VIP 24/7']),
    JSON.stringify({ analyses_per_day: -1, favorites: -1, betslip: -1, history_days: -1 }),
    '#f59e0b', 3);
});
seedPlans();

// ── Seed admin seguro ────────────────────────────────────────
(function ensureAdmin() {
  const existing = db.prepare(`SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`).get() as { id: number; email: string } | undefined;
  if (existing) {
    const hasSub = db.prepare(`SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`).get(existing.id) as { id: number } | undefined;
    if (!hasSub) {
      db.prepare(`
        INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start)
        VALUES (?, 'elite', 'active', 'monthly', 0, unixepoch())
      `).run(existing.id);
    }
    return;
  }

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    console.warn('[DB] Nenhum admin bootstrapado. Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o primeiro administrador.');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@raphaguru.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'superadmin';
  const hash = bcrypt.hashSync(adminPassword, 10);

  db.prepare(`
    INSERT INTO users (email, name, password_hash, role, is_active, email_verified)
    VALUES (?, 'Administrador', ?, 'admin', 1, 1)
  `).run(adminEmail, hash);

  const adminId = (db.prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`).get(adminEmail) as { id: number }).id;
  db.prepare(`
    INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start)
    VALUES (?, 'elite', 'active', 'monthly', 0, unixepoch())
  `).run(adminId);

  console.log(`[DB] ✓ ${adminEmail} bootstrapado`);
})();

console.log('[DB] SQLite pronto:', DB_FILE);
export default db;

// ── Marketing & Financeiro ────────────────────────────────────
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


// ── Bots & Alertas Inteligentes ───────────────────────────────
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

const insertBotTemplate = db.prepare(`
  INSERT OR IGNORE INTO bot_templates
    (slug, name, description, category, mode, default_channels, config_json, ai_ready, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
`);

const seedBotTemplates = db.transaction(() => {
  insertBotTemplate.run(
    'over15-2t-live',
    'Over 1.5 no 2º tempo - Ao Vivo',
    'Bot focado em jogos que chegam ao 2º tempo ainda vivos e com pressão forte para abertura em gols.',
    'over15_2t_live',
    'live',
    JSON.stringify(['app','whatsapp']),
    JSON.stringify({ category: 'over15_2t_live', mode: 'live', minMinute: 46, maxGoals: 2, minPressure: 72, minDangerousAttacks: 110, maxOver25Odds: 2.1, cooldownMinutes: 30, requireLevel: 'medium' }),
    1,
  );
  insertBotTemplate.run(
    'over05-ft-live',
    'Over 0.5 FT',
    'Bot focado em identificar oportunidades de entrada no início do primeiro tempo com pressão e volume suficientes.',
    'over05_ft_live',
    'live',
    JSON.stringify(['app','whatsapp']),
    JSON.stringify({ category: 'over05_ft_live', mode: 'live', maxMinute: 35, maxGoals: 0, minPressure: 65, minDangerousAttacks: 75, minTotalCorners: 3, cooldownMinutes: 20, requireLevel: 'medium' }),
    2,
  );
  insertBotTemplate.run(
    'over05-55-live',
    "Over 0.5 aos 55'",
    'Bot focado em jogos que chegam aos 55 minutos zerados, mas com sinais fortes de pressão, ataques perigosos e cantos.',
    'over05_55_live',
    'live',
    JSON.stringify(['app','whatsapp','email']),
    JSON.stringify({ category: 'over05_55_live', mode: 'live', minMinute: 55, maxGoals: 0, minPressure: 74, minDangerousAttacks: 120, minTotalCorners: 7, cooldownMinutes: 20, requireLevel: 'strong' }),
    3,
  );
  insertBotTemplate.run(
    'corners-pressure-live',
    'Escanteios por Pressão',
    'Bot focado em partidas que mostram pressão extrema e volume alto de cantos.',
    'corners_pressure_live',
    'live',
    JSON.stringify(['app','whatsapp']),
    JSON.stringify({ category: 'corners_pressure_live', mode: 'live', minMinute: 30, minPressure: 76, minTotalCorners: 7, cooldownMinutes: 25, requireLevel: 'medium' }),
    4,
  );
  insertBotTemplate.run(
    'cards-pressure-live',
    'Cartões por Temperatura',
    'Bot focado em jogos nervosos, com cartões cedo e ritmo intenso.',
    'cards_pressure_live',
    'live',
    JSON.stringify(['app','email']),
    JSON.stringify({ category: 'cards_pressure_live', mode: 'live', minMinute: 25, minCards: 2, minDangerousAttacks: 80, cooldownMinutes: 25, requireLevel: 'medium' }),
    5,
  );
  insertBotTemplate.run(
    'home-favorite-value',
    'Favorito com Valor',
    'Bot pré-jogo/híbrido para identificar mandantes favoritos ainda com preço aceitável e sinais extras de domínio.',
    'home_favorite_value',
    'hybrid',
    JSON.stringify(['app','email']),
    JSON.stringify({ category: 'home_favorite_value', mode: 'hybrid', minHomeOdds: 1.5, maxHomeOdds: 1.95, cooldownMinutes: 120, requireLevel: 'medium' }),
    6,
  );
});
seedBotTemplates();
