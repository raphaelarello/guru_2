import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getArtilheirosAvancado } from "./artilheiros-premium";

interface ClientData {
  userId?: string;
  connectedAt: Date;
  subscriptions: Set<string>;
}

const clients = new Map<string, ClientData>();
let io: SocketIOServer | null = null;

class WebSocketManager {
  private io: SocketIOServer;
  private updateIntervals = new Map<string, NodeJS.Timeout>();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });
    io = this.io;
    this.setupConnections();
    this.startUpdateBroadcasts();
  }

  private setupConnections() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

      clients.set(socket.id, {
        connectedAt: new Date(),
        subscriptions: new Set(),
      });

      socket.on("subscribe:artilheiros", () => {
        const clientData = clients.get(socket.id);
        if (clientData) {
          clientData.subscriptions.add("artilheiros");
          socket.join("artilheiros");
          console.log(`[WebSocket] Cliente ${socket.id} inscrito em artilheiros`);
          const artilheiros = getArtilheirosAvancado();
          socket.emit("artilheiros:update", artilheiros);
        }
      });

      socket.on("subscribe:leaderboard", () => {
        const clientData = clients.get(socket.id);
        if (clientData) {
          clientData.subscriptions.add("leaderboard");
          socket.join("leaderboard");
          console.log(`[WebSocket] Cliente ${socket.id} inscrito em leaderboard`);
          const leaderboard = this.generateLeaderboardData();
          socket.emit("leaderboard:update", leaderboard);
        }
      });

      socket.on("unsubscribe:artilheiros", () => {
        const clientData = clients.get(socket.id);
        if (clientData) {
          clientData.subscriptions.delete("artilheiros");
          socket.leave("artilheiros");
        }
      });

      socket.on("unsubscribe:leaderboard", () => {
        const clientData = clients.get(socket.id);
        if (clientData) {
          clientData.subscriptions.delete("leaderboard");
          socket.leave("leaderboard");
        }
      });

      socket.on("disconnect", () => {
        clients.delete(socket.id);
        console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
      });

      socket.on("error", (error: any) => {
        console.error(`[WebSocket] Erro no cliente ${socket.id}:`, error);
      });
    });
  }

  private startUpdateBroadcasts() {
    this.updateIntervals.set(
      "artilheiros",
      setInterval(() => {
        const artilheiros = getArtilheirosAvancado();
        this.io.to("artilheiros").emit("artilheiros:update", artilheiros);
        console.log(`[WebSocket] Broadcast de artilheiros enviado`);
      }, 30000)
    );

    this.updateIntervals.set(
      "leaderboard",
      setInterval(() => {
        const leaderboard = this.generateLeaderboardData();
        this.io.to("leaderboard").emit("leaderboard:update", leaderboard);
        console.log(`[WebSocket] Broadcast de leaderboard enviado`);
      }, 30000)
    );
  }

  private generateLeaderboardData() {
    const artilheiros = getArtilheirosAvancado();
    return {
      topGols: (artilheiros as any).topGols?.slice(0, 10) || [],
      topAssistencias: (artilheiros as any).topAssistencias?.slice(0, 10) || [],
      topEficiencia: (artilheiros as any).topEficiencia?.slice(0, 10) || [],
      timestamp: Date.now(),
    };
  }

  public broadcastNotification(notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    this.io.emit("notificacao", notification);
  }

  public close() {
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.io.close();
  }

  public getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      artilheirosSubscribers:
        this.io.sockets.adapter.rooms.get("artilheiros")?.size || 0,
      leaderboardSubscribers:
        this.io.sockets.adapter.rooms.get("leaderboard")?.size || 0,
    };
  }
}

export function setupWebSocket(server: HTTPServer): WebSocketManager {
  const wsManager = new WebSocketManager(server);
  return wsManager;
}

export type { WebSocketManager };
