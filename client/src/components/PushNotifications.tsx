import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'goal' | 'card' | 'corner' | 'odds' | 'alert';
  title: string;
  message: string;
  team?: string;
  player?: string;
  timestamp: number;
}

export const PushNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Verificar permissão de notificação
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setIsEnabled(true);
      showNotification('Notificações Ativadas', 'Você receberá alertas sobre gols, cartões e mudanças de odds!');
    }
  };

  // Mostrar notificação
  const showNotification = (title: string, message: string) => {
    if (permission === 'granted' && isEnabled) {
      new Notification(title, {
        body: message,
        icon: '⚽',
        badge: '🔔',
        tag: 'match-notification',
      });
    }

    // Adicionar à lista local
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'alert',
      title,
      message,
      timestamp: Date.now(),
    };

    setNotifications(prev => [notification, ...prev].slice(0, 5));
  };

  // Simular eventos de jogo
  useEffect(() => {
    const events = [
      { type: 'goal', title: 'GOL! ⚽', message: 'Haaland marcou para Manchester City!' },
      { type: 'card', title: 'CARTÃO AMARELO 🟨', message: 'De Bruyne recebeu cartão amarelo' },
      { type: 'corner', title: 'ESCANTEIO 🚩', message: 'Escanteio para Liverpool' },
      { type: 'odds', title: 'MUDANÇA DE ODDS 📊', message: 'Over 2.5 caiu para 1.92' },
    ];

    const interval = setInterval(() => {
      if (isEnabled && Math.random() > 0.7) {
        const event = events[Math.floor(Math.random() * events.length)];
        showNotification(event.title, event.message);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'card':
        return '🟨';
      case 'corner':
        return '🚩';
      case 'odds':
        return '📊';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'border-green-700 bg-green-900/20';
      case 'card':
        return 'border-yellow-700 bg-yellow-900/20';
      case 'corner':
        return 'border-blue-700 bg-blue-900/20';
      case 'odds':
        return 'border-purple-700 bg-purple-900/20';
      default:
        return 'border-slate-700 bg-slate-900/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controle de Notificações */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Notificações Push</span>
          </div>
          <button
            onClick={requestPermission}
            disabled={permission === 'granted' && isEnabled}
            className={`px-4 py-2 rounded font-semibold text-sm transition ${
              permission === 'granted' && isEnabled
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {permission === 'granted' && isEnabled ? '✓ Ativadas' : 'Ativar Notificações'}
          </button>
        </div>

        {permission !== 'granted' && (
          <div className="text-xs text-slate-400">
            Clique em "Ativar Notificações" para receber alertas sobre gols, cartões, escanteios e mudanças de odds.
          </div>
        )}
      </div>

      {/* Lista de Notificações Recentes */}
      {notifications.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Notificações Recentes</h4>
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`border rounded-lg p-3 flex items-start justify-between gap-2 ${getNotificationColor(notif.type)}`}
              >
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{notif.title}</div>
                    <div className="text-xs text-slate-300">{notif.message}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="text-slate-400 hover:text-slate-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configurações */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Configurar Alertas</h4>
        <div className="space-y-2">
          {[
            { label: 'Alertas de Gols', checked: true },
            { label: 'Alertas de Cartões', checked: true },
            { label: 'Alertas de Escanteios', checked: false },
            { label: 'Alertas de Mudança de Odds', checked: true },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800"
              />
              <span className="text-sm text-slate-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PushNotifications;
