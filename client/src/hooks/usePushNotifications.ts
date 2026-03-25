import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

const VAPID_PUBLIC_KEY = "BNepEQau5rSRgfRGceyR9RYpc6Cecc2H0EBd0ZjlXquRbaV-xbTxdkV-9bkEjVKUGJQl--kasu8Tg_ahou1M4Vo";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushStatus = "unsupported" | "denied" | "granted" | "default" | "loading";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const subscribeMutation = trpc.system.subscribePush.useMutation();
  const unsubscribeMutation = trpc.system.unsubscribePush.useMutation();

  // Registrar Service Worker
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(!!sub);
        setStatus(Notification.permission as PushStatus);
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  const subscribe = useCallback(async () => {
    if (!swRegistration) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return false;
      }

      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      });

      setIsSubscribed(true);
      setStatus("granted");
      return true;
    } catch (err) {
      console.error("Erro ao ativar push:", err);
      return false;
    }
  }, [swRegistration, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!swRegistration) return;

    const sub = await swRegistration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
    }
    setIsSubscribed(false);
  }, [swRegistration, unsubscribeMutation]);

  return { status, isSubscribed, subscribe, unsubscribe };
}
