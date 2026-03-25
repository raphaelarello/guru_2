import { Router } from 'express';
import db from '../db/schema.js';
import { requireAuth, requirePlan, requireAdmin } from '../middleware/auth.js';
import { botStatsForUser, listTemplateCards, runBotScanOnce } from '../lib/botEngine.js';
import { saveOdds, listLatestOdds } from '../lib/oddsFeed.js';
import { writeAuditLog } from '../lib/audit.js';

const router = Router();
router.use(requireAuth, requirePlan('pro'));

function parseJSON<T>(value: unknown, fallback: T): T {
  try { return value ? JSON.parse(String(value)) as T : fallback; }
  catch { return fallback; }
}

function mapBotRow(row: Record<string, unknown>) {
  return {
    ...row,
    config: parseJSON<Record<string, unknown>>(row.config_json, {}),
    channels: parseJSON<string[]>(row.channels_json, ['app']),
  };
}

router.get('/bots/templates', (_req, res) => {
  const templates = listTemplateCards().map((row) => ({
    ...row,
    default_channels: parseJSON<string[]>(row.default_channels, ['app']),
    config: parseJSON<Record<string, unknown>>(row.config_json, {}),
  }));
  res.json({ templates });
});

router.get('/bots', (req, res) => {
  const bots = db.prepare(`SELECT * FROM user_bots WHERE user_id = ? ORDER BY updated_at DESC, id DESC`).all(req.user!.id) as Record<string, unknown>[];
  const alerts = db.prepare(`
    SELECT a.*, b.name bot_name, b.category
    FROM bot_alerts a JOIN user_bots b ON b.id = a.bot_id
    WHERE a.user_id = ?
    ORDER BY a.triggered_at DESC
    LIMIT 50
  `).all(req.user!.id) as Record<string, unknown>[];
  res.json({ bots: bots.map(mapBotRow), alerts, stats: botStatsForUser(req.user!.id), feed: listLatestOdds(24) });
});

router.post('/bots/templates/:slug/activate', (req, res) => {
  const tpl = db.prepare(`SELECT * FROM bot_templates WHERE slug = ? LIMIT 1`).get(req.params.slug) as Record<string, unknown> | undefined;
  if (!tpl) return res.status(404).json({ error: 'Template não encontrado' });

  const custom = req.body as Record<string, unknown>;
  const name = String(custom.name || tpl.name);
  const description = String(custom.description || tpl.description || '');
  const channels = Array.isArray(custom.channels) && custom.channels.length ? custom.channels : parseJSON<string[]>(tpl.default_channels, ['app']);
  const config = { ...parseJSON<Record<string, unknown>>(tpl.config_json, {}), ...(custom.config && typeof custom.config === 'object' ? custom.config as Record<string, unknown> : {}) };

  const r = db.prepare(`
    INSERT INTO user_bots (user_id, template_id, name, description, category, mode, status, config_json, channels_json, next_run_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, unixepoch() + 30)
  `).run(req.user!.id, tpl.id, name, description, tpl.category, tpl.mode, JSON.stringify(config), JSON.stringify(channels));

  writeAuditLog(req.user!.id, 'bots.template.activate', { template: tpl.slug, botId: r.lastInsertRowid }, req.user!.id, req.ip ?? null);
  res.json({ ok: true, id: r.lastInsertRowid });
});

router.post('/bots', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  if (!name || !category) return res.status(400).json({ error: 'name e category são obrigatórios' });
  const channels = Array.isArray(body.channels) && body.channels.length ? body.channels : ['app'];
  const config = body.config && typeof body.config === 'object' ? body.config as Record<string, unknown> : {};
  const r = db.prepare(`
    INSERT INTO user_bots (user_id, name, description, category, mode, status, config_json, channels_json, next_run_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch() + 30)
  `).run(req.user!.id, name, String(body.description || ''), category, String(body.mode || 'live'), body.status === 'paused' ? 'paused' : 'active', JSON.stringify(config), JSON.stringify(channels));
  writeAuditLog(req.user!.id, 'bots.create', { botId: r.lastInsertRowid, category }, req.user!.id, req.ip ?? null);
  res.json({ ok: true, id: r.lastInsertRowid });
});

router.patch('/bots/:id', (req, res) => {
  const bot = db.prepare(`SELECT * FROM user_bots WHERE id = ? AND user_id = ?`).get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;
  if (!bot) return res.status(404).json({ error: 'Bot não encontrado' });
  const body = req.body as Record<string, unknown>;
  const channels = Array.isArray(body.channels) ? body.channels : parseJSON<string[]>(bot.channels_json, ['app']);
  const config = body.config && typeof body.config === 'object' ? body.config as Record<string, unknown> : parseJSON<Record<string, unknown>>(bot.config_json, {});
  db.prepare(`
    UPDATE user_bots SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      channels_json = ?,
      config_json = ?,
      updated_at = unixepoch()
    WHERE id = ? AND user_id = ?
  `).run(body.name ?? null, body.description ?? null, body.status ?? null, JSON.stringify(channels), JSON.stringify(config), req.params.id, req.user!.id);
  writeAuditLog(req.user!.id, 'bots.update', { botId: req.params.id }, req.user!.id, req.ip ?? null);
  res.json({ ok: true });
});

router.post('/bots/:id/toggle', (req, res) => {
  const bot = db.prepare(`SELECT id, status FROM user_bots WHERE id = ? AND user_id = ?`).get(req.params.id, req.user!.id) as { id: number; status: string } | undefined;
  if (!bot) return res.status(404).json({ error: 'Bot não encontrado' });
  const next = bot.status === 'active' ? 'paused' : 'active';
  db.prepare(`UPDATE user_bots SET status = ?, updated_at = unixepoch() WHERE id = ? AND user_id = ?`).run(next, req.params.id, req.user!.id);
  res.json({ ok: true, status: next });
});

router.delete('/bots/:id', (req, res) => {
  const r = db.prepare(`DELETE FROM user_bots WHERE id = ? AND user_id = ?`).run(req.params.id, req.user!.id);
  if (!r.changes) return res.status(404).json({ error: 'Bot não encontrado' });
  writeAuditLog(req.user!.id, 'bots.delete', { botId: req.params.id }, req.user!.id, req.ip ?? null);
  res.json({ ok: true });
});

router.post('/bots/scan-now', async (req, res) => {
  const body = req.body as { botId?: number };
  if (body?.botId) {
    const owned = db.prepare(`SELECT id FROM user_bots WHERE id = ? AND user_id = ?`).get(body.botId, req.user!.id) as { id: number } | undefined;
    if (!owned) return res.status(404).json({ error: 'Bot não encontrado' });
  }
  const result = await runBotScanOnce(body?.botId);
  res.json({ ok: true, ...result, stats: botStatsForUser(req.user!.id) });
});

router.get('/bots/alerts', (req, res) => {
  const alerts = db.prepare(`
    SELECT a.*, b.name bot_name, b.category
    FROM bot_alerts a JOIN user_bots b ON b.id = a.bot_id
    WHERE a.user_id = ?
    ORDER BY a.triggered_at DESC
    LIMIT 200
  `).all(req.user!.id) as Record<string, unknown>[];
  res.json({ alerts });
});

router.patch('/bots/alerts/:id/result', (req, res) => {
  const body = req.body as { outcome_status?: 'win' | 'loss' | 'void' | 'pending'; roi_units?: number };
  const alert = db.prepare(`SELECT * FROM bot_alerts WHERE id = ? AND user_id = ?`).get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;
  if (!alert) return res.status(404).json({ error: 'Alerta não encontrado' });
  const next = body.outcome_status || 'pending';
  db.prepare(`UPDATE bot_alerts SET outcome_status = ?, resolved_at = unixepoch() WHERE id = ? AND user_id = ?`).run(next, req.params.id, req.user!.id);

  if (next === 'win' || next === 'loss') {
    db.prepare(`
      UPDATE user_bots SET
        win_count = win_count + ?,
        loss_count = loss_count + ?,
        roi_units = roi_units + ?,
        updated_at = unixepoch()
      WHERE id = ? AND user_id = ?
    `).run(next === 'win' ? 1 : 0, next === 'loss' ? 1 : 0, Number(body.roi_units ?? (next === 'win' ? 1 : -1)), alert.bot_id, req.user!.id);
  }

  res.json({ ok: true, stats: botStatsForUser(req.user!.id) });
});

router.get('/bots/stats', (req, res) => {
  res.json(botStatsForUser(req.user!.id));
});

router.post('/bots/demo-feed', requireAdmin, (_req, res) => {
  const entries = [
    {
      matchId: 'live-101', source: 'demo-bots', provider: 'Radar Demo', league: 'Brasil Série A', homeTeam: 'Flamengo', awayTeam: 'Bahia', homeOdds: 1.74, drawOdds: 3.8, awayOdds: 4.9, over25Odds: 1.83, under25Odds: 2.05, over85CornersOdds: 1.9, over35CardsOdds: 1.77,
      raw: { minute: 58, homeScore: 0, awayScore: 0, homePressure: 81, awayPressure: 59, homeCorners: 6, awayCorners: 2, homeCards: 1, awayCards: 2, dangerousAttacks: 132 },
    },
    {
      matchId: 'live-102', source: 'demo-bots', provider: 'Radar Demo', league: 'Premier League', homeTeam: 'Liverpool', awayTeam: 'Brighton', homeOdds: 1.62, drawOdds: 4.2, awayOdds: 5.5, over25Odds: 1.71, under25Odds: 2.18, over85CornersOdds: 1.84, over35CardsOdds: 1.96,
      raw: { minute: 27, homeScore: 0, awayScore: 0, homePressure: 78, awayPressure: 43, homeCorners: 5, awayCorners: 1, homeCards: 0, awayCards: 1, dangerousAttacks: 102 },
    },
    {
      matchId: 'live-103', source: 'demo-bots', provider: 'Radar Demo', league: 'La Liga', homeTeam: 'Getafe', awayTeam: 'Sevilla', homeOdds: 2.26, drawOdds: 3.05, awayOdds: 3.45, over25Odds: 2.02, under25Odds: 1.8, over85CornersOdds: 1.92, over35CardsOdds: 1.69,
      raw: { minute: 63, homeScore: 0, awayScore: 0, homePressure: 69, awayPressure: 67, homeCorners: 4, awayCorners: 5, homeCards: 2, awayCards: 3, dangerousAttacks: 116 },
    },
  ];
  entries.forEach(saveOdds);
  res.json({ ok: true, entries: listLatestOdds(20) });
});

export default router;
