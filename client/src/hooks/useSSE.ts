import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";

export interface SSENotification {
  id: string;
  type: "alerta" | "bot_sinal" | "resultado" | "sistema" | "ping";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
  lida: boolean;
}

interface UseSSEOptions {
  enabled?: boolean;
  onNotification?: (n: SSENotification) => void;
}

export function useSSE({ enabled = true, onNotification }: UseSSEOptions = {}) {
  const [notifications, setNotifications] = useState<SSENotification[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(2000);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource("/api/sse", { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      reconnectDelay.current = 2000; // reset delay on success
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Omit<SSENotification, "id" | "lida">;

        // Ignorar pings
        if (data.type === "ping") return;
        // Ignorar mensagem inicial de conexão
        if (data.type === "sistema" && data.title === "Conectado") return;

        const notification: SSENotification = {
          ...data,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          lida: false,
        };

        setNotifications(prev => [notification, ...prev].slice(0, 50));
        onNotification?.(notification);

        // Toast visual com som
        const toastFn = data.type === "resultado"
          ? (data.message.includes("🟢") ? toast.success : toast.error)
          : data.type === "bot_sinal"
          ? toast.info
          : toast;

        toastFn(data.title, {
          description: data.message,
          duration: 6000,
          position: "top-right",
        });

        // Som de notificação (Web Audio API)
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = data.type === "resultado" ? (data.message.includes("🟢") ? 880 : 440) : 660;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          // AudioContext não disponível
        }
      } catch {
        // JSON inválido — ignorar
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      // Reconectar com backoff exponencial (máx 30s)
      if (enabled) {
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 30_000);
          connect();
        }, reconnectDelay.current);
      }
    };
  }, [enabled, onNotification]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      setConnected(false);
    };
  }, [enabled, connect]);

  const marcarLida = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }, []);

  const marcarTodasLidas = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
  }, []);

  const limpar = useCallback(() => {
    setNotifications([]);
  }, []);

  const naoLidas = notifications.filter(n => !n.lida).length;

  return { notifications, connected, naoLidas, marcarLida, marcarTodasLidas, limpar };
}
