import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Trash2,
  CheckCircle,
  AlertCircle,
  Trophy,
  Settings,
  Search,
  Filter,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'alerta' | 'vitoria' | 'achievement' | 'sistema';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  icon: string;
  color: string;
}

export default function DashboardNotificacoes() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alerta',
      title: 'Oportunidade de Value Betting',
      message: 'Score: 85 | Confiança: 92% | Recomendação: Betfair vs Pinnacle',
      timestamp: Date.now() - 5 * 60000,
      read: false,
      icon: '🎯',
      color: 'bg-blue-500/20 border-blue-500/50',
    },
    {
      id: '2',
      type: 'vitoria',
      title: 'Vitória!',
      message: 'Streak: 5 | Pontos: 250 | Você está em grande forma!',
      timestamp: Date.now() - 15 * 60000,
      read: false,
      icon: '🎉',
      color: 'bg-green-500/20 border-green-500/50',
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Achievement Desbloqueado',
      message: '🏅 Top Scorer: Atingiu 100 pontos em uma semana',
      timestamp: Date.now() - 30 * 60000,
      read: true,
      icon: '🏆',
      color: 'bg-yellow-500/20 border-yellow-500/50',
    },
    {
      id: '4',
      type: 'sistema',
      title: 'Manutenção Programada',
      message: 'Sistema em manutenção de 02:00 a 03:00 UTC',
      timestamp: Date.now() - 60 * 60000,
      read: true,
      icon: '⚙️',
      color: 'bg-gray-500/20 border-gray-500/50',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'nao-lidos' | 'lidos'>(
    'todos'
  );
  const [typeFilter, setTypeFilter] = useState<Notification['type'] | 'todos'>('todos');

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch =
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesReadStatus =
        selectedFilter === 'todos' ||
        (selectedFilter === 'nao-lidos' && !notif.read) ||
        (selectedFilter === 'lidos' && notif.read);

      const matchesType = typeFilter === 'todos' || notif.type === typeFilter;

      return matchesSearch && matchesReadStatus && matchesType;
    });
  }, [notifications, searchTerm, selectedFilter, typeFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifs =>
      notifs.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifs => notifs.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifs => notifs.filter(n => n.id !== id));
  };

  const handleDeleteAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alerta':
        return '🎯';
      case 'vitoria':
        return '🎉';
      case 'achievement':
        return '🏆';
      case 'sistema':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const getTypeBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'alerta':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'vitoria':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'achievement':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'sistema':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Centro de Notificações</h1>
          </div>
          <p className="text-gray-400">
            {unreadCount} notificação{unreadCount !== 1 ? 's' : ''} não lida
            {unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Controles */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Status de Leitura
                  </label>
                  <select
                    value={selectedFilter}
                    onChange={e =>
                      setSelectedFilter(e.target.value as typeof selectedFilter)
                    }
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="todos">Todas</option>
                    <option value="nao-lidos">Não Lidas</option>
                    <option value="lidos">Lidas</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Tipo</label>
                  <select
                    value={typeFilter}
                    onChange={e =>
                      setTypeFilter(e.target.value as typeof typeFilter)
                    }
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="alerta">Alertas</option>
                    <option value="vitoria">Vitórias</option>
                    <option value="achievement">Achievements</option>
                    <option value="sistema">Sistema</option>
                  </select>
                </div>

                <div className="flex gap-2 items-end">
                  <Button
                    onClick={handleMarkAllAsRead}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar Tudo
                  </Button>
                  <Button
                    onClick={handleDeleteAll}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 text-lg">Nenhuma notificação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(notif => (
              <Card
                key={notif.id}
                className={`border-l-4 transition ${
                  notif.read
                    ? 'bg-slate-800/50 border-slate-700 border-l-gray-600'
                    : 'bg-slate-800 border-slate-700 border-l-yellow-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{getTypeIcon(notif.type)}</div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{notif.title}</h3>
                          <Badge
                            className={`${getTypeBadgeColor(notif.type)} border`}
                          >
                            {notif.type.charAt(0).toUpperCase() +
                              notif.type.slice(1)}
                          </Badge>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          )}
                        </div>

                        <p className="text-gray-300 text-sm mb-2">{notif.message}</p>

                        <p className="text-gray-500 text-xs">{formatTime(notif.timestamp)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!notif.read && (
                        <Button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(notif.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Total</p>
              <p className="text-3xl font-bold text-white">{notifications.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Não Lidas</p>
              <p className="text-3xl font-bold text-yellow-400">{unreadCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Lidas</p>
              <p className="text-3xl font-bold text-green-400">
                {notifications.filter(n => n.read).length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Taxa de Leitura</p>
              <p className="text-3xl font-bold text-blue-400">
                {notifications.length === 0
                  ? '0'
                  : Math.round(
                      (notifications.filter(n => n.read).length /
                        notifications.length) *
                        100
                    )}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
