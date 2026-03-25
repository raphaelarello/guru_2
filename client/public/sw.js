// RAPHA GURU — Service Worker para Web Push Notifications
const CACHE_NAME = "rapha-guru-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Receber push notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "RAPHA GURU", body: event.data.text(), url: "/" };
  }

  const options = {
    body: data.body ?? "Novo sinal detectado!",
    icon: data.icon ?? "/icon-192.png",
    badge: "/icon-72.png",
    tag: data.tag ?? "rapha-guru",
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url ?? "/" },
    actions: [
      { action: "open", title: "Ver agora" },
      { action: "dismiss", title: "Dispensar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "RAPHA GURU", options)
  );
});

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
