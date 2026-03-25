import webpush from "web-push";

// VAPID keys — geradas uma vez e fixas no servidor
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "BNepEQau5rSRgfRGceyR9RYpc6Cecc2H0EBd0ZjlXquRbaV-xbTxdkV-9bkEjVKUGJQl--kasu8Tg_ahou1M4Vo";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "j-__p03oGwoC7H04emntJ8YIFd7QquZrZlq_jzLcBGA";

webpush.setVapidDetails(
  "mailto:admin@raphaguru.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export { VAPID_PUBLIC_KEY };

// In-memory subscriptions por userId (em produção, salvar no banco)
const subscriptions = new Map<string, webpush.PushSubscription[]>();

export function addSubscription(userId: string, sub: webpush.PushSubscription) {
  const existing = subscriptions.get(userId) ?? [];
  // Evitar duplicatas pelo endpoint
  const filtered = existing.filter(s => s.endpoint !== sub.endpoint);
  subscriptions.set(userId, [...filtered, sub]);
}

export function removeSubscription(userId: string, endpoint: string) {
  const existing = subscriptions.get(userId) ?? [];
  subscriptions.set(userId, existing.filter(s => s.endpoint !== endpoint));
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; icon?: string; url?: string; tag?: string }
) {
  const subs = subscriptions.get(userId) ?? [];
  if (subs.length === 0) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    url: payload.url ?? "/",
    tag: payload.tag ?? "rapha-guru",
  });

  const results = await Promise.allSettled(
    subs.map(sub => webpush.sendNotification(sub, data))
  );

  // Remover subscriptions inválidas (expiradas)
  const validSubs: webpush.PushSubscription[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      validSubs.push(subs[i]);
    } else {
      const err = result.reason as any;
      if (err?.statusCode !== 410 && err?.statusCode !== 404) {
        validSubs.push(subs[i]); // Manter se não for 410/404
      }
    }
  });
  subscriptions.set(userId, validSubs);
}

export async function broadcastPushToAll(
  payload: { title: string; body: string; icon?: string; url?: string; tag?: string }
) {
  const userIds = Array.from(subscriptions.keys());
  await Promise.allSettled(userIds.map(uid => sendPushNotification(uid, payload)));
}
