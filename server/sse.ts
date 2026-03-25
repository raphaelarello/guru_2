/**
 * Server-Sent Events (SSE) — Notificações em tempo real
 * Cada cliente conectado recebe eventos via stream HTTP persistente.
 */
import type { Request, Response } from "express";

interface SSEClient {
  id: string;
  userId: string;
  res: Response;
  connectedAt: number;
}

interface SSEEvent {
  type: "alerta" | "bot_sinal" | "resultado" | "sistema" | "ping";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// Mapa de clientes conectados por userId
const clients = new Map<string, SSEClient[]>();

/** Registra um novo cliente SSE */
export function registerSSEClient(req: Request, res: Response, userId: string) {
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Headers SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const client: SSEClient = { id: clientId, userId, res, connectedAt: Date.now() };

  // Adicionar ao mapa
  const userClients = clients.get(userId) ?? [];
  userClients.push(client);
  clients.set(userId, userClients);

  // Enviar evento de conexão
  sendToClient(client, {
    type: "sistema",
    title: "Conectado",
    message: "Notificações em tempo real ativas",
    timestamp: Date.now(),
  });

  // Ping a cada 25s para manter conexão viva
  const pingInterval = setInterval(() => {
    try {
      sendToClient(client, {
        type: "ping",
        title: "ping",
        message: "",
        timestamp: Date.now(),
      });
    } catch {
      clearInterval(pingInterval);
    }
  }, 25_000);

  // Limpar ao desconectar
  req.on("close", () => {
    clearInterval(pingInterval);
    const remaining = (clients.get(userId) ?? []).filter(c => c.id !== clientId);
    if (remaining.length === 0) {
      clients.delete(userId);
    } else {
      clients.set(userId, remaining);
    }
  });
}

/** Envia evento para um cliente específico */
function sendToClient(client: SSEClient, event: SSEEvent) {
  const data = JSON.stringify(event);
  client.res.write(`data: ${data}\n\n`);
}

/** Envia evento para todos os clientes de um usuário */
export function notifyUser(userId: string, event: Omit<SSEEvent, "timestamp">) {
  const userClients = clients.get(userId) ?? [];
  const fullEvent: SSEEvent = { ...event, timestamp: Date.now() };
  for (const client of userClients) {
    try {
      sendToClient(client, fullEvent);
    } catch {
      // Cliente desconectado — será limpo no evento close
    }
  }
}

/** Envia evento para TODOS os usuários conectados (broadcast) */
export function broadcastToAll(event: Omit<SSEEvent, "timestamp">) {
  const fullEvent: SSEEvent = { ...event, timestamp: Date.now() };
  Array.from(clients.values()).forEach(userClients => {
    for (const client of userClients) {
      try {
        sendToClient(client, fullEvent);
      } catch {
        // Ignorar clientes desconectados
      }
    }
  });
}

/** Retorna estatísticas de conexões ativas */
export function getSSEStats() {
  let total = 0;
  Array.from(clients.values()).forEach(uc => { total += uc.length; });
  return { totalUsers: clients.size, totalConnections: total };
}
