/**
 * Rapha Guru — Middleware JWT + RBAC
 */
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import db from '../db/schema.js';
import { PLAN_RANK, getEffectivePlanSlug, getPlanLimits } from '../lib/plans.js';

export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'rapha-guru-dev-secret-MUDE-EM-PRODUCAO');

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  jti: string;
  impersonated_by?: number;
}

declare global {
  namespace Express {
    interface Request { user?: JWTPayload; rawBody?: Buffer; }
  }
}

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET obrigatório em produção');
}

export function signToken(user: { id: number; email: string; name: string; role: string; impersonated_by?: number }): string {
  const jti = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const token = jwt.sign({ ...user, jti }, JWT_SECRET, { expiresIn: '30d' });

  db.prepare(`
    INSERT INTO sessions (user_id, jti, expires_at)
    VALUES (?, ?, unixepoch() + 2592000)
  `).run(user.id, jti);

  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token obrigatório' });
    return;
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JWTPayload;
    const session = db.prepare(`SELECT id FROM sessions WHERE jti = ? AND expires_at > unixepoch()`).get(payload.jti) as { id: number } | undefined;
    if (!session) {
      res.status(401).json({ error: 'Sessão expirada' });
      return;
    }

    const user = db.prepare(`SELECT id, email, name, role, is_active FROM users WHERE id = ?`).get(payload.id) as
      { id: number; email: string; name: string; role: string; is_active: number } | undefined;
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'Conta inativa' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      jti: payload.jti,
      ...(payload.impersonated_by ? { impersonated_by: payload.impersonated_by } : {}),
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function requirePlan(min: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    const plan = getEffectivePlanSlug(req.user.id, req.user.role);
    if ((PLAN_RANK[plan] ?? 0) < (PLAN_RANK[min] ?? 0)) {
      res.status(403).json({ error: `Plano mínimo: ${min}`, upgrade_url: '/planos', current_plan: plan });
      return;
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a admins' });
    return;
  }
  next();
}

export function logUsage(action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user) {
      try {
        db.prepare(`INSERT INTO usage_logs (user_id, action, ip_address) VALUES (?, ?, ?)`).run(req.user.id, action, req.ip ?? null);
      } catch {
        // nunca quebra a request
      }
    }
    next();
  };
}

export function checkUsageLimit(userId: number, action: string): { ok: boolean; used: number; limit: number; plan: string } {
  const user = db.prepare(`SELECT role FROM users WHERE id = ?`).get(userId) as { role: string } | undefined;
  if (!user) return { ok: false, used: 0, limit: 0, plan: 'free' };

  const plan = getEffectivePlanSlug(userId, user.role);
  const limits = getPlanLimits(plan);
  const dailyKey = action === 'analysis' ? 'analyses_per_day' : action;
  const limit = limits[dailyKey] ?? -1;
  if (limit === -1) return { ok: true, used: 0, limit: -1, plan };

  const since = Math.floor(Date.now() / 1000) - 86400;
  const used = (db.prepare(`SELECT COUNT(*) as n FROM usage_logs WHERE user_id = ? AND action = ? AND created_at > ?`).get(userId, action, since) as { n: number }).n;
  return { ok: used < limit, used, limit, plan };
}
