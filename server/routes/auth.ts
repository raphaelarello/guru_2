/**
 * Rapha Guru — Auth Routes
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import db from '../db/schema.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { ensureSubscriptionConsistency } from '../lib/plans.js';
import { writeAuditLog } from '../lib/audit.js';

const router = Router();
const SALT = 12;

function serializeSubscription(sub: Record<string, unknown> | undefined | null) {
  return sub ? {
    ...sub,
    features: JSON.parse(String(sub.features ?? '[]')),
    limits: JSON.parse(String(sub.limits ?? '{}')),
  } : null;
}

function getSubscription(userId: number) {
  return ensureSubscriptionConsistency(userId) as Record<string, unknown> | null;
}

async function getMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, phone } = req.body as { email?: string; name?: string; password?: string; phone?: string };

    if (!email || !name || !password) return res.status(400).json({ error: 'email, nome e senha são obrigatórios' });
    if (password.length < 8) return res.status(400).json({ error: 'Senha deve ter ao menos 8 caracteres' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' });

    const normalizedEmail = email.toLowerCase().trim();
    const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(normalizedEmail) as { id: number } | undefined;
    if (exists) return res.status(409).json({ error: 'Email já cadastrado' });

    const hash = await bcrypt.hash(password, SALT);
    const result = db.prepare(`
      INSERT INTO users (email, name, password_hash, phone, role)
      VALUES (?, ?, ?, ?, 'free')
    `).run(normalizedEmail, name.trim(), hash, phone ?? null) as { lastInsertRowid: number };
    const userId = Number(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start, period_end)
      VALUES (?, 'free', 'active', 'monthly', 0, unixepoch(), unixepoch() + 31536000)
    `).run(userId);

    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, '🎉 Bem-vindo ao Rapha Guru!', 'Sua conta foi criada. Explore as análises e faça upgrade quando quiser.', 'success')
    `).run(userId);

    const user = db.prepare(`SELECT id, email, name, role FROM users WHERE id = ?`).get(userId) as { id: number; email: string; name: string; role: string };
    writeAuditLog(userId, 'auth.register', { email: normalizedEmail }, userId, req.ip ?? null);

    res.status(201).json({ token: signToken(user), user, subscription: serializeSubscription(getSubscription(userId)) });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as {
      id: number; email: string; name: string; password_hash: string; role: string; is_active: number;
    } | undefined;

    if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });
    if (!user.is_active) return res.status(403).json({ error: 'Conta desativada' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou senha incorretos' });

    db.prepare(`UPDATE users SET last_login_at = unixepoch(), login_count = login_count + 1 WHERE id = ?`).run(user.id);
    const sub = getSubscription(user.id);
    writeAuditLog(user.id, 'auth.login', undefined, user.id, req.ip ?? null);

    res.json({
      token: signToken({ id: user.id, email: user.email, name: user.name, role: user.role }),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      subscription: serializeSubscription(sub),
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  db.prepare(`DELETE FROM sessions WHERE jti = ?`).run(req.user!.jti);
  writeAuditLog(req.user!.id, 'auth.logout', undefined, req.user!.id, req.ip ?? null);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.phone,
           u.email_verified, u.login_count, u.last_login_at, u.created_at
    FROM users u WHERE u.id = ?
  `).get(req.user!.id) as Record<string, unknown> | undefined;
  if (!user) return res.status(404).json({ error: 'Não encontrado' });

  const sub = getSubscription(req.user!.id);
  const since30 = Math.floor(Date.now() / 1000) - 86400 * 30;
  const usage = db.prepare(`SELECT action, COUNT(*) as n FROM usage_logs WHERE user_id = ? AND created_at > ? GROUP BY action`).all(req.user!.id, since30) as { action: string; n: number }[];
  const unread = (db.prepare(`SELECT COUNT(*) as n FROM notifications WHERE user_id = ? AND read = 0`).get(req.user!.id) as { n: number }).n;

  res.json({
    user,
    subscription: serializeSubscription(sub),
    usage_30d: Object.fromEntries(usage.map((u) => [u.action, u.n])),
    unread_notifications: unread,
  });
});

router.patch('/profile', requireAuth, (req, res) => {
  const { name, phone, avatar_url } = req.body as { name?: string; phone?: string; avatar_url?: string };
  db.prepare(`
    UPDATE users SET
      name       = COALESCE(?, name),
      phone      = COALESCE(?, phone),
      avatar_url = COALESCE(?, avatar_url),
      updated_at = unixepoch()
    WHERE id = ?
  `).run(name ?? null, phone ?? null, avatar_url ?? null, req.user!.id);

  writeAuditLog(req.user!.id, 'auth.profile.update', { changed: ['name', 'phone', 'avatar_url'].filter((k) => (req.body as Record<string, unknown>)[k] !== undefined) }, req.user!.id, req.ip ?? null);
  res.json({ ok: true });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { current, novo } = req.body as { current?: string; novo?: string };
  if (!current || !novo) return res.status(400).json({ error: 'Campos obrigatórios' });
  if (novo.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

  const user = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user!.id) as { password_hash: string };
  if (!(await bcrypt.compare(current, user.password_hash))) return res.status(400).json({ error: 'Senha atual incorreta' });

  const hash = await bcrypt.hash(novo, SALT);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?`).run(hash, req.user!.id);
  db.prepare(`DELETE FROM sessions WHERE user_id = ? AND jti != ?`).run(req.user!.id, req.user!.jti);
  writeAuditLog(req.user!.id, 'auth.password.change', undefined, req.user!.id, req.ip ?? null);

  res.json({ ok: true, message: 'Senha alterada. Outros dispositivos foram deslogados.' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: 'Email obrigatório' });

  const user = db.prepare(`SELECT id, name FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as { id: number; name: string } | undefined;
  if (!user) return res.json({ ok: true, message: 'Se o e-mail existir, você receberá as instruções.' });

  const token = crypto.randomBytes(24).toString('hex');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  db.prepare(`UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?`).run(token, expires, user.id);

  const baseUrl = process.env.APP_BASE_URL || process.env.ALLOWED_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-senha?token=${token}`;
  const transporter = await getMailer();
  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email.toLowerCase().trim(),
      subject: 'Redefinição de senha — Rapha Guru',
      text: `Olá, ${user.name}.\n\nPara redefinir sua senha, acesse: ${resetUrl}\n\nEste link expira em 1 hora.`,
      html: `<p>Olá, <strong>${user.name}</strong>.</p><p>Para redefinir sua senha, acesse o link abaixo:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este link expira em 1 hora.</p>`,
    });
  } else {
    console.log(`[RESET] ${email}: ${resetUrl}`);
  }

  writeAuditLog(user.id, 'auth.password.forgot', { transporter: Boolean(transporter) }, user.id, req.ip ?? null);
  const body: Record<string, unknown> = { ok: true, message: 'Se o e-mail existir, você receberá as instruções.' };
  if (process.env.NODE_ENV !== 'production' && process.env.EXPOSE_RESET_TOKEN === '1') body._dev_token = token;
  res.json(body);
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) return res.status(400).json({ error: 'Token e senha obrigatórios' });
  if (password.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

  const user = db.prepare(`SELECT id FROM users WHERE reset_token = ? AND reset_expires > unixepoch()`).get(token) as { id: number } | undefined;
  if (!user) return res.status(400).json({ error: 'Token inválido ou expirado' });

  const hash = await bcrypt.hash(password, SALT);
  db.prepare(`
    UPDATE users
    SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = unixepoch()
    WHERE id = ?
  `).run(hash, user.id);
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(user.id);
  writeAuditLog(user.id, 'auth.password.reset', undefined, user.id, req.ip ?? null);

  res.json({ ok: true, message: 'Senha redefinida com sucesso!' });
});

router.post('/refresh', requireAuth, (req, res) => {
  const user = db.prepare(`SELECT id, email, name, role FROM users WHERE id = ? AND is_active = 1`).get(req.user!.id) as
    { id: number; email: string; name: string; role: string } | undefined;
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

  const sub = getSubscription(user.id);
  res.json({ token: signToken(user), user, subscription: serializeSubscription(sub) });
});

router.post('/reset-admin', requireAuth, requireAdmin, async (req, res) => {
  const { password, email } = req.body as { password?: string; email?: string };
  if (!password || password.length < 10) return res.status(400).json({ error: 'Defina uma senha forte com pelo menos 10 caracteres' });

  const admin = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get() as { id: number } | undefined;
  if (!admin) return res.status(404).json({ error: 'Admin não encontrado' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare(`UPDATE users SET password_hash = ?, email = COALESCE(?, email), updated_at = unixepoch() WHERE id = ?`).run(hash, email ?? null, admin.id);
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(admin.id);
  writeAuditLog(req.user!.id, 'admin.reset_admin_password', { email: email ?? null }, admin.id, req.ip ?? null);

  res.json({ ok: true, message: 'Credenciais do administrador atualizadas com sucesso.' });
});

export default router;
