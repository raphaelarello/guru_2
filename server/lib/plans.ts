import db from '../db/schema.js';

export const PLAN_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  elite: 3,
  admin: 99,
};

export function getActiveSubscription(userId: number) {
  return db.prepare(`
    SELECT s.*, p.name as plan_name, p.features, p.limits, p.price_monthly, p.badge_color
    FROM subscriptions s
    JOIN plans p ON p.slug = s.plan_slug
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get(userId) as Record<string, unknown> | undefined;
}

export function ensureSubscriptionConsistency(userId: number): Record<string, unknown> | null {
  const now = Math.floor(Date.now() / 1000);
  const active = getActiveSubscription(userId);
  if (active && active.plan_slug !== 'free' && active.period_end && Number(active.period_end) < now) {
    db.prepare(`
      UPDATE subscriptions
      SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, unixepoch()), updated_at = unixepoch()
      WHERE id = ?
    `).run(active.id);

    const free = db.prepare(`SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' AND plan_slug = 'free' LIMIT 1`).get(userId) as { id: number } | undefined;
    if (!free) {
      db.prepare(`
        INSERT INTO subscriptions (user_id, plan_slug, status, billing_cycle, amount_brl, period_start, period_end)
        VALUES (?, 'free', 'active', 'monthly', 0, unixepoch(), unixepoch() + 31536000)
      `).run(userId);
    }
    db.prepare(`UPDATE users SET role = 'free', updated_at = unixepoch() WHERE id = ? AND role != 'admin'`).run(userId);
    return getActiveSubscription(userId) ?? null;
  }
  return active ?? null;
}

export function getEffectivePlanSlug(userId: number, role?: string | null): string {
  if (role === 'admin') return 'admin';
  const sub = ensureSubscriptionConsistency(userId);
  return String(sub?.plan_slug ?? role ?? 'free');
}

export function getPlanLimits(planSlug: string): Record<string, number> {
  const row = db.prepare(`SELECT limits FROM plans WHERE slug = ?`).get(planSlug) as { limits: string } | undefined;
  return row ? (JSON.parse(row.limits) as Record<string, number>) : {};
}
