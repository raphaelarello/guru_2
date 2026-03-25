import db from '../db/schema.js';

export function writeAuditLog(actorUserId: number | null, action: string, meta?: unknown, targetUserId?: number | null, ip?: string | null) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (actor_user_id, target_user_id, action, meta, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(actorUserId, targetUserId ?? null, action, meta ? JSON.stringify(meta) : null, ip ?? null);
  } catch {
    // auditoria nunca deve quebrar a request
  }
}
