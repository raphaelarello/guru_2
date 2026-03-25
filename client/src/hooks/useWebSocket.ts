import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url = window.location.origin, autoConnect = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Conectado ao servidor");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Desconectado do servidor");
      setIsConnected(false);
    });

    socket.on("error", (error: any) => {
      console.error("[WebSocket] Erro:", error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [url, autoConnect]);

  const subscribe = useCallback(
    (channel: string, callback: (data: any) => void) => {
      if (!socketRef.current) return;

      socketRef.current.emit(`subscribe:${channel}`);
      socketRef.current.on(`${channel}:update`, callback);

      return () => {
        socketRef.current?.emit(`unsubscribe:${channel}`);
        socketRef.current?.off(`${channel}:update`, callback);
      };
    },
    []
  );

  const unsubscribe = useCallback((channel: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit(`unsubscribe:${channel}`);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    subscribe,
    unsubscribe,
    emit,
  };
}

export function useArtilheirosWebSocket() {
  const { isConnected, subscribe } = useWebSocket();
  const [artilheiros, setArtilheiros] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe("artilheiros", (data) => {
      setArtilheiros(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  return { artilheiros, loading, isConnected };
}

export function useLeaderboardWebSocket() {
  const { isConnected, subscribe } = useWebSocket();
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe("leaderboard", (data) => {
      setLeaderboard(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  return { leaderboard, loading, isConnected };
}
