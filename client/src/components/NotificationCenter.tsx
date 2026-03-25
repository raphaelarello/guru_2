'use client';

import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';
import { AlertCircle, TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface Notification {
  type: 'artilheiro_novo' | 'indisciplinado_novo' | 'top5_mudanca' | 'cartao_recebido';
  title: string;
  message: string;
  data?: any;
}

export default function NotificationCenter() {
  const { isConnected } = useWebSocket();
  const [lastMessage, setLastMessage] = React.useState<any>(null);

  React.useEffect(() => {
    // Simular notificações para demo
    const timer = setInterval(() => {
      setLastMessage({ type: 'notificacao', data: { type: 'artilheiro_novo', title: 'Novo Artilheiro', message: 'Atualização em tempo real' } });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'notificacao') return;

    const notification: Notification = lastMessage.data;

    switch (notification.type) {
      case 'artilheiro_novo':
        toast.success(
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">{notification.title}</p>
              <p className="text-sm text-slate-300">{notification.message}</p>
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right',
          }
        );
        break;

      case 'indisciplinado_novo':
        toast.warning(
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">{notification.title}</p>
              <p className="text-sm text-slate-300">{notification.message}</p>
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right',
          }
        );
        break;

      case 'top5_mudanca':
        toast.info(
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">{notification.title}</p>
              <p className="text-sm text-slate-300">{notification.message}</p>
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right',
          }
        );
        break;

      case 'cartao_recebido':
        toast.error(
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">{notification.title}</p>
              <p className="text-sm text-slate-300">{notification.message}</p>
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right',
          }
        );
        break;
    }
  }, [lastMessage]);

  return (
    <div className="fixed bottom-4 right-4 text-xs text-slate-500">
      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Conectado</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>Desconectado</span>
        </div>
      )}
    </div>
  );
}
