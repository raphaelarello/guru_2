import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  channel: 'artilheiros' | 'indisciplinados' | 'pitacos';
}

interface ServerMessage {
  type: 'artilheiros_update' | 'indisciplinados_update' | 'notificacao' | 'pong';
  data?: any;
  message?: string;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients = new Map<WebSocket, Set<string>>();
  private updateIntervals = new Map<string, NodeJS.Timeout>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupConnections();
    this.startUpdateBroadcasts();
  }

  private setupConnections() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Novo cliente conectado');
      this.clients.set(ws, new Set());

      ws.on('message', (data: string) => {
        try {
          const message: ClientMessage = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[WebSocket] Erro ao processar mensagem:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Mensagem inválida' }));
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Cliente desconectado');
        this.clients.delete(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('[WebSocket] Erro:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: ClientMessage) {
    const channels = this.clients.get(ws);
    if (!channels) return;

    switch (message.type) {
      case 'subscribe':
        channels.add(message.channel);
        console.log(`[WebSocket] Cliente inscrito em: ${message.channel}`);
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: message.channel,
          message: `Inscrito em ${message.channel}`,
        }));
        break;

      case 'unsubscribe':
        channels.delete(message.channel);
        console.log(`[WebSocket] Cliente desinscrito de: ${message.channel}`);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  private startUpdateBroadcasts() {
    // Broadcast de atualizações de artilheiros a cada 30 segundos
    this.updateIntervals.set('artilheiros', setInterval(() => {
      this.broadcastToChannel('artilheiros', {
        type: 'artilheiros_update',
        data: {
          timestamp: Date.now(),
          message: 'Dados de artilheiros atualizados',
        },
      });
    }, 30000));

    // Broadcast de atualizações de indisciplinados a cada 30 segundos
    this.updateIntervals.set('indisciplinados', setInterval(() => {
      this.broadcastToChannel('indisciplinados', {
        type: 'indisciplinados_update',
        data: {
          timestamp: Date.now(),
          message: 'Dados de indisciplinados atualizados',
        },
      });
    }, 30000));
  }

  private broadcastToChannel(channel: string, message: ServerMessage) {
    this.clients.forEach((channels, ws) => {
      if (channels.has(channel) && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcastNotification(notification: {
    type: 'artilheiro_novo' | 'indisciplinado_novo' | 'top5_mudanca' | 'cartao_recebido';
    title: string;
    message: string;
    data?: any;
  }) {
    const message: ServerMessage = {
      type: 'notificacao',
      data: notification,
    };

    this.clients.forEach((channels, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  public close() {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.wss.close();
  }
}

export function setupWebSocket(server: Server): WebSocketManager {
  return new WebSocketManager(server);
}

export type { WebSocketManager };
