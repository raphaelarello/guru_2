/**
 * Rapha Guru — Automation API Router v4.0
 * Contas isoladas por usuário · credenciais criptografadas · acesso restrito a Elite/Admin
 */

import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import db from './db/schema.js';
import { engine, ADAPTERS } from './automation/engine.js';
import { BOOKMAKER_DEFS } from './automation/types.js';
import type { BookmakerAccount, BetOrder } from './automation/types.js';
import { requireAuth, requirePlan, requireAdmin } from './middleware/auth.js';
import { writeAuditLog } from './lib/audit.js';

const router = express.Router();
const DATA_DIR = path.resolve(process.cwd(), 'data');
const KEY_FILE = path.join(DATA_DIR, 'key.bin');

router.use(requireAuth, requirePlan('elite'));

function getKey(): Buffer {
  if (fs.existsSync(KEY_FILE)) return fs.readFileSync(KEY_FILE);
  const key = crypto.randomBytes(32);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });
  return key;
}

function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return `${iv.toString('hex')}:${Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex')}`;
}

function decrypt(data: string): string {
  const key = getKey();
  const [ivHex, encHex] = data.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final().toString('utf8');
}

function mapAccountRow(row: Record<string, unknown>): BookmakerAccount {
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
    createdAt: String(row.createdAt),
  };
}

function loadAccountsForUser(userId: number): BookmakerAccount[] {
  const rows = db.prepare(`SELECT * FROM automation_accounts WHERE user_id = ? ORDER BY updated_at DESC`).all(userId) as Record<string, unknown>[];
  return rows.map(mapAccountRow);
}

function getAccountForUser(userId: number, accountId: string): BookmakerAccount | undefined {
  return loadAccountsForUser(userId).find((account) => account.id === accountId);
}

function checkLimits(account: BookmakerAccount, order: BetOrder): string | null {
  if (order.stake > account.maxSingleStake) return `Stake R$ ${order.stake} excede limite por aposta (R$ ${account.maxSingleStake})`;
  if (order.odds < (account.minOddsAccepted ?? 1.01)) return `Odd ${order.odds} abaixo do mínimo configurado (${account.minOddsAccepted ?? 1.01})`;
  if (account.maxOddsAccepted && order.odds > account.maxOddsAccepted) return `Odd ${order.odds} acima do máximo configurado (${account.maxOddsAccepted})`;
  return null;
}

router.get('/bookmakers', (_req, res) => {
  res.json({ bookmakers: Object.entries(BOOKMAKER_DEFS).map(([id, def]) => ({ ...def, supported: !!ADAPTERS[id] })) });
});

router.get('/accounts', (req, res) => {
  const accounts = loadAccountsForUser(req.user!.id).map((a) => ({ ...a, password: '***' }));
  res.json({ accounts });
});

router.post('/accounts', express.json(), (req, res) => {
  const body = req.body as Partial<BookmakerAccount>;
  if (!body.bookmaker || !body.username || !body.password) return res.status(400).json({ error: 'bookmaker, username e password são obrigatórios' });
  if (!ADAPTERS[body.bookmaker]) return res.status(400).json({ error: `Casa "${body.bookmaker}" não suportada` });

  const account: BookmakerAccount = {
    id: body.id ?? `${body.bookmaker}_${crypto.randomUUID()}`,
    ownerUserId: req.user!.id,
    bookmaker: body.bookmaker,
    name: body.name ?? body.bookmaker,
    username: body.username,
    password: body.password,
    maxDailyStake: body.maxDailyStake ?? 500,
    maxSingleStake: body.maxSingleStake ?? 100,
    maxOddsAccepted: body.maxOddsAccepted ?? 10,
    minOddsAccepted: body.minOddsAccepted ?? 1.05,
    enabled: body.enabled ?? true,
    createdAt: body.createdAt ?? new Date().toISOString(),
  };

  db.prepare(`
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
    req.user!.id,
    account.bookmaker,
    account.name,
    account.username,
    encrypt(account.password),
    account.maxDailyStake,
    account.maxSingleStake,
    account.maxOddsAccepted,
    account.minOddsAccepted,
    account.enabled ? 1 : 0,
    account.createdAt,
  );

  writeAuditLog(req.user!.id, 'automation.account.upsert', { accountId: account.id, bookmaker: account.bookmaker }, req.user!.id, req.ip ?? null);
  res.json({ success: true, account: { ...account, password: '***' } });
});

router.patch('/accounts/:id', express.json(), (req, res) => {
  const current = getAccountForUser(req.user!.id, req.params.id);
  if (!current) return res.status(404).json({ error: 'Conta não encontrada' });

  const body = req.body as Partial<BookmakerAccount>;
  const next: BookmakerAccount = {
    ...current,
    ...body,
    id: current.id,
    ownerUserId: req.user!.id,
    password: body.password ?? current.password,
  };

  db.prepare(`
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
    req.user!.id,
  );

  writeAuditLog(req.user!.id, 'automation.account.update', { accountId: next.id }, req.user!.id, req.ip ?? null);
  res.json({ success: true });
});

router.delete('/accounts/:id', (req, res) => {
  const result = db.prepare(`DELETE FROM automation_accounts WHERE id = ? AND user_id = ?`).run(req.params.id, req.user!.id);
  if (!result.changes) return res.status(404).json({ error: 'Conta não encontrada' });
  writeAuditLog(req.user!.id, 'automation.account.delete', { accountId: req.params.id }, req.user!.id, req.ip ?? null);
  res.json({ success: true });
});

router.post('/login', express.json(), async (req, res) => {
  const { accountId } = req.body as { accountId: string };
  const account = getAccountForUser(req.user!.id, accountId);
  if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
  const result = await engine.login(account);
  writeAuditLog(req.user!.id, 'automation.login', { accountId }, req.user!.id, req.ip ?? null);
  res.json(result);
});

router.get('/status', (req, res) => {
  const accountIds = new Set(loadAccountsForUser(req.user!.id).map((account) => account.id));
  const all = engine.getAllStatus();
  const filtered = Object.fromEntries(Object.entries(all).filter(([key]) => accountIds.has(key)));
  res.json({ status: filtered });
});

router.get('/balance/:accountId', async (req, res) => {
  const account = getAccountForUser(req.user!.id, req.params.accountId);
  if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
  const balance = await engine.getBalance(account);
  res.json({ bookmaker: account.bookmaker, balance });
});

router.post('/bet', express.json(), async (req, res) => {
  const { accountId, order } = req.body as { accountId: string; order: BetOrder };
  if (!accountId || !order) return res.status(400).json({ error: 'accountId e order obrigatórios' });

  const account = getAccountForUser(req.user!.id, accountId);
  if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
  if (!account.enabled) return res.status(400).json({ error: 'Conta desativada' });

  const limitErr = checkLimits(account, order);
  if (limitErr) return res.status(400).json({ error: limitErr });

  const result = await engine.placeBet(account.bookmaker, order, account);
  writeAuditLog(req.user!.id, 'automation.bet.single', { accountId, success: result.success, bookmaker: account.bookmaker }, req.user!.id, req.ip ?? null);
  res.json(result);
});

router.post('/bet/multi', express.json(), async (req, res) => {
  const { accountIds, order } = req.body as { accountIds: string[]; order: BetOrder };
  const owned = loadAccountsForUser(req.user!.id);
  const accounts = owned.filter((account) => accountIds.includes(account.id) && account.enabled);
  if (!accounts.length) return res.status(400).json({ error: 'Nenhuma conta válida' });

  const results = await Promise.allSettled(
    accounts.map(async (account) => {
      const err = checkLimits(account, order);
      if (err) return { success: false, bookmaker: account.bookmaker, error: err };
      return engine.placeBet(account.bookmaker, order, account);
    }),
  );

  writeAuditLog(req.user!.id, 'automation.bet.multi', { accounts: accounts.map((a) => a.id), count: accounts.length }, req.user!.id, req.ip ?? null);
  res.json({
    results: results.map((r, i) => ({
      bookmaker: accounts[i]?.bookmaker,
      ...(r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) }),
    })),
  });
});

router.get('/queue', (req, res) => {
  res.json({ queue: engine.getQueue(req.user!.id) });
});

router.post('/queue', express.json(), (req, res) => {
  const { accountId, order, maxRetries = 3 } = req.body as { accountId: string; order: BetOrder; maxRetries?: number };
  const account = getAccountForUser(req.user!.id, accountId);
  if (!account) return res.status(404).json({ error: 'Conta não encontrada' });

  const err = checkLimits(account, order);
  if (err) return res.status(400).json({ error: err });

  const item = engine.addToQueue(accountId, account.bookmaker, order, maxRetries, req.user!.id);
  res.json({ success: true, queueItemId: item.id, item });
});

router.post('/queue/run', async (req, res) => {
  const accounts = loadAccountsForUser(req.user!.id);
  const results = await engine.runQueue(accounts, req.user!.id);
  res.json({ results: results.filter((item) => item.ownerUserId === req.user!.id) });
});

router.delete('/queue/:id', (req, res) => {
  const item = engine.getQueue(req.user!.id).find((entry) => entry.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  const ok = engine.cancelQueueItem(req.params.id);
  res.json({ success: ok, message: ok ? 'Cancelado' : 'Item não encontrado ou já executando' });
});

router.delete('/queue', (req, res) => {
  engine.clearQueue(req.user!.id);
  res.json({ success: true });
});

router.get('/logs', (req, res) => {
  const days = Number((req.query as Record<string, string>).days ?? 7);
  const accountIds = loadAccountsForUser(req.user!.id).map((account) => account.id);
  res.json({ entries: engine.getLogs(days, req.user!.id, accountIds) });
});

router.get('/screenshots', (req, res) => {
  const dir = path.resolve(process.cwd(), 'data', 'screenshots');
  if (!fs.existsSync(dir)) return res.json({ files: [] });

  const accountIds = new Set(loadAccountsForUser(req.user!.id).map((account) => account.id));
  const files = fs.readdirSync(dir)
    .filter((file) => file.endsWith('.png'))
    .filter((file) => {
      const prefix = file.split('_')[0];
      return accountIds.has(prefix);
    })
    .sort()
    .reverse()
    .slice(0, 50)
    .map((file) => {
      const parts = file.split('_');
      return { name: file, accountId: parts[0], bookmaker: parts[1], ts: parts[2], ok: file.includes('_ok') };
    });
  res.json({ files });
});

router.get('/screenshots/:name', (req, res) => {
  const safeName = req.params.name.replace(/\//g, '');
  const accountIds = new Set(loadAccountsForUser(req.user!.id).map((account) => account.id));
  const prefix = safeName.split('_')[0];
  if (!accountIds.has(prefix)) return res.status(404).end();

  const file = path.resolve(process.cwd(), 'data', 'screenshots', safeName);
  if (!fs.existsSync(file) || !file.endsWith('.png')) return res.status(404).end();
  res.setHeader('Content-Type', 'image/png');
  fs.createReadStream(file).pipe(res);
});

router.post('/shutdown', requireAdmin, async (_req, res) => {
  await engine.shutdown();
  res.json({ success: true });
});

export default router;
