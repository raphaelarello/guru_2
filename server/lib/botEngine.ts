import db from '../db/schema.js';
import nodemailer from 'nodemailer';
import { listAllOdds, type OddsWebhookEntry } from './oddsFeed.js';

export type BotChannelKey = 'app' | 'email' | 'whatsapp';
export type BotLevel = 'light' | 'medium' | 'strong';

type MetricSnapshot = {
  minute: number;
  homeScore: number;
  awayScore: number;
  totalGoals: number;
  homePressure: number;
  awayPressure: number;
  pressure: number;
  homeCorners: number;
  awayCorners: number;
  totalCorners: number;
  homeCards: number;
  awayCards: number;
  totalCards: number;
  dangerousAttacks: number;
};

export type BotConfig = {
  category?: string;
  market?: string;
  mode?: 'pre' | 'live' | 'hybrid';
  minMinute?: number;
  maxMinute?: number;
  minPressure?: number;
  minDangerousAttacks?: number;
  maxGoals?: number;
  minGoals?: number;
  minHomeCorners?: number;
  minAwayCorners?: number;
  minTotalCorners?: number;
  minCards?: number;
  maxOver25Odds?: number;
  maxHomeOdds?: number;
  minHomeOdds?: number;
  cooldownMinutes?: number;
  requireLevel?: BotLevel;
};

export type BotMatch = {
  entry: OddsWebhookEntry;
  metrics: MetricSnapshot;
  reasons: string[];
  score: number;
  level: BotLevel;
  market: string;
  selection: string;
  impliedOdds: number | null;
};

export type AlertDeliveryResult = { channel: BotChannelKey; ok: boolean; error?: string };

function getMailer() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function parseRaw(raw: unknown): MetricSnapshot {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const num = (k: string, fb: number) => {
    const v = Number(source[k]);
    return Number.isFinite(v) ? v : fb;
  };
  const minute = num('minute', 60);
  const homeScore = num('homeScore', 0);
  const awayScore = num('awayScore', 0);
  const homePressure = num('homePressure', 58);
  const awayPressure = num('awayPressure', 46);
  const homeCorners = num('homeCorners', 4);
  const awayCorners = num('awayCorners', 3);
  const homeCards = num('homeCards', 1);
  const awayCards = num('awayCards', 1);
  const dangerousAttacks = num('dangerousAttacks', Math.round((homePressure + awayPressure) * 1.5));
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
    dangerousAttacks,
  };
}

function levelForScore(score: number): BotLevel {
  if (score >= 85) return 'strong';
  if (score >= 68) return 'medium';
  return 'light';
}

function pushReason(reasons: string[], condition: boolean, message: string, points: number, scoreObj: { score: number }) {
  if (!condition) return;
  reasons.push(message);
  scoreObj.score += points;
}

function normalizePhone(phone?: string | null) {
  return (phone || '').replace(/\D/g, '');
}

export function evaluateBotAgainstEntry(config: BotConfig, entry: OddsWebhookEntry): BotMatch | null {
  const metrics = parseRaw(entry.raw);
  const scoreObj = { score: 35 };
  const reasons: string[] = [];
  const cat = config.category || 'custom';
  let market = config.market || 'Sinal customizado';
  let selection = market;
  let impliedOdds: number | null = entry.homeOdds ?? entry.over25Odds ?? 1.9;

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

  if (cat === 'over15_2t_live') {
    market = 'Over 1.5 no 2º tempo';
    selection = 'Over 1.5 2T';
    impliedOdds = entry.over25Odds ?? 1.95;
    pushReason(reasons, metrics.minute >= 46, 'Jogo já está no 2º tempo', 12, scoreObj);
    pushReason(reasons, metrics.totalGoals <= 2, 'Placar ainda deixa espaço para abertura', 10, scoreObj);
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 72), `Pressão alta (${metrics.pressure})`, 14, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 110), `Ataques perigosos em alta (${metrics.dangerousAttacks})`, 14, scoreObj);
    pushReason(reasons, (entry.over25Odds ?? 99) <= (config.maxOver25Odds ?? 2.1), `Odd do over ainda dentro da faixa (${(entry.over25Odds ?? 0).toFixed(2)})`, 10, scoreObj);
  } else if (cat === 'over05_ft_live') {
    market = 'Over 0.5 FT';
    selection = 'Gol ainda no 1º tempo';
    impliedOdds = entry.over25Odds ? Math.max(1.28, Math.min(1.72, entry.over25Odds - 0.45)) : 1.55;
    pushReason(reasons, metrics.minute <= 35, 'Jogo ainda está em janela cedo', 8, scoreObj);
    pushReason(reasons, metrics.totalGoals === 0, 'Placar zerado', 12, scoreObj);
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 65), `Pressão acumulada (${metrics.pressure})`, 14, scoreObj);
    pushReason(reasons, metrics.totalCorners >= (config.minTotalCorners ?? 3), `Escanteios já aceleraram o jogo (${metrics.totalCorners})`, 8, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 75), 'Ataques perigosos acima do corte', 14, scoreObj);
  } else if (cat === 'over05_55_live') {
    market = 'Over 0.5 aos 55\'';
    selection = 'Gol após 55';
    impliedOdds = entry.over25Odds ? Math.max(1.45, Math.min(2.15, entry.over25Odds - 0.2)) : 1.8;
    pushReason(reasons, metrics.minute >= (config.minMinute ?? 55), 'Jogo passou do minuto crítico', 12, scoreObj);
    pushReason(reasons, metrics.totalGoals === 0, 'Placar continua zerado', 12, scoreObj);
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 74), `Pressão forte aos ${metrics.minute}'`, 15, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 120), 'Ataques perigosos sustentados', 14, scoreObj);
    pushReason(reasons, metrics.totalCorners >= (config.minTotalCorners ?? 7), `Escanteios reforçam o cenário (${metrics.totalCorners})`, 8, scoreObj);
  } else if (cat === 'corners_pressure_live') {
    market = 'Escanteios por pressão';
    selection = 'Over escanteios';
    impliedOdds = entry.over85CornersOdds ?? 1.88;
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 76), `Pressão muito alta (${metrics.pressure})`, 16, scoreObj);
    pushReason(reasons, metrics.totalCorners >= (config.minTotalCorners ?? 7), `Linha de cantos já quente (${metrics.totalCorners})`, 14, scoreObj);
    pushReason(reasons, metrics.minute >= (config.minMinute ?? 30), 'Janela live madura', 8, scoreObj);
  } else if (cat === 'cards_pressure_live') {
    market = 'Cartões por temperatura';
    selection = 'Over cartões';
    impliedOdds = entry.over35CardsOdds ?? 1.82;
    pushReason(reasons, metrics.totalCards >= (config.minCards ?? 2), `Cartões já apareceram (${metrics.totalCards})`, 12, scoreObj);
    pushReason(reasons, metrics.minute >= (config.minMinute ?? 25), 'Jogo já mostrou amostra comportamental', 8, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 80), 'Ritmo alto eleva o contato', 8, scoreObj);
  } else if (cat === 'home_favorite_value') {
    market = 'Favorito em valor';
    selection = 'Casa vence';
    impliedOdds = entry.homeOdds ?? 1.75;
    pushReason(reasons, (entry.homeOdds ?? 99) <= (config.maxHomeOdds ?? 1.95), `Favorito com odd ainda aceitável (${(entry.homeOdds ?? 0).toFixed(2)})`, 12, scoreObj);
    pushReason(reasons, (entry.homeOdds ?? 99) >= (config.minHomeOdds ?? 1.5), 'Preço não está esmagado', 10, scoreObj);
    pushReason(reasons, metrics.homePressure >= 58, `Mandante pressionando mais (${metrics.homePressure})`, 12, scoreObj);
  } else {
    pushReason(reasons, metrics.pressure >= (config.minPressure ?? 60), 'Jogo atende pressão mínima', 12, scoreObj);
    pushReason(reasons, metrics.dangerousAttacks >= (config.minDangerousAttacks ?? 70), 'Ataques perigosos suficientes', 12, scoreObj);
  }

  const level = levelForScore(scoreObj.score);
  if (config.requireLevel === 'strong' && level !== 'strong') return null;
  if (config.requireLevel === 'medium' && level === 'light') return null;
  if (reasons.length === 0) return null;

  return { entry, metrics, reasons, score: scoreObj.score, level, market, selection, impliedOdds };
}

export function buildAlertBody(botName: string, match: BotMatch) {
  const label = `${match.entry.homeTeam || 'Casa'} x ${match.entry.awayTeam || 'Visitante'}`;
  return [
    `🚨 ${botName}`,
    `${label}${match.entry.league ? ` · ${match.entry.league}` : ''}`,
    `Mercado: ${match.market}`,
    `Momento: ${match.metrics.minute}' · pressão ${match.metrics.pressure} · escanteios ${match.metrics.totalCorners} · cartões ${match.metrics.totalCards}`,
    `Força do sinal: ${match.level.toUpperCase()} (${match.score}/100)`,
    `Motivos: ${match.reasons.slice(0, 3).join(' • ')}`,
  ].join('\n');
}

async function sendAppNotification(userId: number, title: string, body: string) {
  db.prepare(`INSERT INTO notifications (user_id, title, body, type, action_url) VALUES (?, ?, ?, 'info', '/automacao')`).run(userId, title, body);
  return true;
}

async function sendEmail(email: string, title: string, body: string) {
  const mailer = getMailer();
  if (!mailer) return false;
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@raphaguru.com',
    to: email,
    subject: title,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  });
  return true;
}

async function sendWhatsApp(phone: string, body: string) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) return false;
  const to = normalizePhone(phone);
  if (!to) return false;
  const res = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  return res.ok;
}

export async function deliverBotAlert(userId: number, channels: BotChannelKey[], title: string, body: string): Promise<AlertDeliveryResult[]> {
  const user = db.prepare(`SELECT id, email, phone, name FROM users WHERE id = ?`).get(userId) as { id: number; email: string | null; phone: string | null; name: string } | undefined;
  if (!user) return [{ channel: 'app', ok: false, error: 'Usuário não encontrado' }];
  const results: AlertDeliveryResult[] = [];
  for (const channel of channels) {
    try {
      if (channel === 'app') {
        await sendAppNotification(userId, title, body);
        results.push({ channel, ok: true });
      } else if (channel === 'email') {
        if (!user.email) results.push({ channel, ok: false, error: 'Usuário sem e-mail' });
        else {
          const ok = await sendEmail(user.email, title, body);
          results.push({ channel, ok, ...(ok ? {} : { error: 'SMTP não configurado' }) });
        }
      } else if (channel === 'whatsapp') {
        if (!user.phone) results.push({ channel, ok: false, error: 'Usuário sem telefone' });
        else {
          const ok = await sendWhatsApp(user.phone, body);
          results.push({ channel, ok, ...(ok ? {} : { error: 'WhatsApp Cloud API não configurada' }) });
        }
      }
    } catch (err) {
      results.push({ channel, ok: false, error: err instanceof Error ? err.message : 'Falha desconhecida' });
    }
  }
  return results;
}

function cooldownActive(botId: number, matchId: string, cooldownMinutes: number) {
  const row = db.prepare(`
    SELECT triggered_at
    FROM bot_alerts
    WHERE bot_id = ? AND match_id = ?
    ORDER BY triggered_at DESC
    LIMIT 1
  `).get(botId, matchId) as { triggered_at: number } | undefined;
  if (!row) return false;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return (Date.now() - row.triggered_at * 1000) < cooldownMs;
}

export async function runBotScanOnce(botId?: number) {
  const bots = (botId
    ? db.prepare(`SELECT * FROM user_bots WHERE id = ? AND status = 'active'`).all(botId)
    : db.prepare(`SELECT * FROM user_bots WHERE status = 'active'`).all()) as Record<string, unknown>[];

  const feed = listAllOdds();
  const runStarted = Math.floor(Date.now() / 1000);
  const allResults: Record<string, unknown>[] = [];

  for (const bot of bots) {
    const config = JSON.parse(String(bot.config_json || '{}')) as BotConfig;
    const channels = JSON.parse(String(bot.channels_json || '["app"]')) as BotChannelKey[];
    const matches = feed.map((entry) => evaluateBotAgainstEntry(config, entry)).filter(Boolean) as BotMatch[];
    let matched = 0;
    let alerts = 0;
    for (const match of matches) {
      if (cooldownActive(Number(bot.id), match.entry.matchId, config.cooldownMinutes ?? 30)) continue;
      matched += 1;
      const body = buildAlertBody(String(bot.name), match);
      const title = `${String(bot.name)} · ${match.market}`;
      const deliveries = await deliverBotAlert(Number(bot.user_id), channels, title, body);
      db.prepare(`
        INSERT INTO bot_alerts (
          bot_id, user_id, match_id, match_label, league, market, signal_json, channel_status_json, outcome_status, triggered_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', unixepoch(), unixepoch())
      `).run(
        bot.id,
        bot.user_id,
        match.entry.matchId,
        `${match.entry.homeTeam || 'Casa'} x ${match.entry.awayTeam || 'Visitante'}`,
        match.entry.league ?? null,
        match.market,
        JSON.stringify({ score: match.score, level: match.level, reasons: match.reasons, metrics: match.metrics, impliedOdds: match.impliedOdds, entry: match.entry }),
        JSON.stringify(deliveries),
      );
      alerts += 1;
      allResults.push({ bot_id: bot.id, match_id: match.entry.matchId, market: match.market, level: match.level, delivered: deliveries });
    }

    db.prepare(`
      INSERT INTO bot_runs (bot_id, user_id, scanned_count, matched_count, alerts_sent, status, started_at, ended_at)
      VALUES (?, ?, ?, ?, ?, 'done', ?, unixepoch())
    `).run(bot.id, bot.user_id, feed.length, matched, alerts, runStarted);

    db.prepare(`
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

let interval: NodeJS.Timeout | null = null;

export function startBotScheduler() {
  if (interval) return;
  interval = setInterval(() => {
    runBotScanOnce().catch((err) => console.error('[bots] scheduler:', err));
  }, 60_000);
}

export function stopBotScheduler() {
  if (interval) clearInterval(interval);
  interval = null;
}

export function listTemplateCards() {
  return db.prepare(`SELECT * FROM bot_templates ORDER BY sort_order ASC, id ASC`).all() as Record<string, unknown>[];
}

export function botStatsForUser(userId: number) {
  const overview = db.prepare(`
    SELECT
      COUNT(*) total_bots,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) active_bots,
      COALESCE(SUM(alert_count),0) total_alerts,
      COALESCE(SUM(win_count),0) total_wins,
      COALESCE(SUM(loss_count),0) total_losses,
      COALESCE(SUM(roi_units),0) total_roi_units,
      COALESCE(SUM(run_count),0) total_runs
    FROM user_bots WHERE user_id = ?
  `).get(userId) as Record<string, number>;

  const byFilter = db.prepare(`
    SELECT category, COUNT(*) bots, COALESCE(SUM(alert_count),0) alerts, COALESCE(SUM(win_count),0) wins, COALESCE(SUM(loss_count),0) losses
    FROM user_bots WHERE user_id = ? GROUP BY category ORDER BY alerts DESC, wins DESC
  `).all(userId) as Record<string, unknown>[];

  const recent = db.prepare(`
    SELECT a.*, b.name bot_name, b.category
    FROM bot_alerts a
    JOIN user_bots b ON b.id = a.bot_id
    WHERE a.user_id = ?
    ORDER BY a.triggered_at DESC
    LIMIT 60
  `).all(userId) as Record<string, unknown>[];

  const hitRate = Number(overview.total_wins || 0) + Number(overview.total_losses || 0) > 0
    ? Number(overview.total_wins || 0) / (Number(overview.total_wins || 0) + Number(overview.total_losses || 0))
    : 0;

  return { overview: { ...overview, hit_rate: hitRate }, by_filter: byFilter, recent_alerts: recent };
}
