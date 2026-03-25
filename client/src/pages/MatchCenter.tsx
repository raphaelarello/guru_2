import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, AlertCircle, TrendingUp } from 'lucide-react';

interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-100
  type: 'pressão' | 'oportunidade' | 'perigo';
}

interface MatchEvent {
  minute: number;
  type: 'gol' | 'cartão' | 'substituição' | 'falta' | 'escanteio';
  team: 'home' | 'away';
  player: string;
  description: string;
}

export default function MatchCenter() {
  const [currentMinute, setCurrentMinute] = useState(45);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MatchEvent | null>(null);

  // Gerar dados de heatmap simulados
  useEffect(() => {
    const generateHeatmap = () => {
      const points: HeatmapPoint[] = [];

      // Zona de pressão (ataque do time da casa)
      for (let i = 0; i < 15; i++) {
        points.push({
          x: 70 + Math.random() * 25,
          y: 30 + Math.random() * 40,
          intensity: 40 + Math.random() * 50,
          type: 'pressão',
        });
      }

      // Zona de oportunidade (meio-campo)
      for (let i = 0; i < 10; i++) {
        points.push({
          x: 40 + Math.random() * 20,
          y: 20 + Math.random() * 60,
          intensity: 50 + Math.random() * 40,
          type: 'oportunidade',
        });
      }

      // Zona de perigo (defesa)
      for (let i = 0; i < 8; i++) {
        points.push({
          x: 10 + Math.random() * 20,
          y: 25 + Math.random() * 50,
          intensity: 30 + Math.random() * 60,
          type: 'perigo',
        });
      }

      setHeatmapData(points);
    };

    // Gerar eventos simulados
    const generateEvents = () => {
      const eventsList: MatchEvent[] = [
        {
          minute: 12,
          type: 'escanteio',
          team: 'home',
          player: 'Time da Casa',
          description: 'Escanteio cobrado',
        },
        {
          minute: 23,
          type: 'cartão',
          team: 'away',
          player: 'João Silva',
          description: 'Cartão amarelo por falta',
        },
        {
          minute: 34,
          type: 'gol',
          team: 'home',
          player: 'Carlos Santos',
          description: 'Gol de cabeça após escanteio',
        },
        {
          minute: 45,
          type: 'substituição',
          team: 'away',
          player: 'Pedro Costa',
          description: 'Substituído por Lucas Ferreira',
        },
      ];

      setEvents(eventsList);
    };

    generateHeatmap();
    generateEvents();
  }, []);

  const getHeatmapColor = (intensity: number, type: string) => {
    if (type === 'perigo') {
      return `rgba(239, 68, 68, ${intensity / 100})`;
    } else if (type === 'oportunidade') {
      return `rgba(34, 197, 94, ${intensity / 100})`;
    } else {
      return `rgba(59, 130, 246, ${intensity / 100})`;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'gol':
        return '⚽';
      case 'cartão':
        return '🟨';
      case 'substituição':
        return '🔄';
      case 'falta':
        return '🚫';
      case 'escanteio':
        return '🚩';
      default:
        return '📍';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'gol':
        return 'bg-yellow-500';
      case 'cartão':
        return 'bg-red-500';
      case 'substituição':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">⚽ Match Center</h1>
          </div>
          <p className="text-gray-400">Análise em tempo real com heatmap e timeline de eventos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap Principal */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Heatmap do Jogo - {currentMinute}°
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Campo de Futebol */}
                <div className="relative w-full bg-gradient-to-b from-green-700 to-green-800 rounded-lg overflow-hidden" style={{ aspectRatio: '2/3' }}>
                  {/* Linhas do campo */}
                  <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    {/* Linha do meio */}
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" opacity="0.3" />
                    {/* Círculo do meio */}
                    <circle cx="50%" cy="50%" r="15%" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
                    {/* Áreas */}
                    <rect x="0" y="25%" width="20%" height="50%" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
                    <rect x="80%" y="25%" width="20%" height="50%" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
                  </svg>

                  {/* Pontos de Heatmap */}
                  {heatmapData.map((point, idx) => (
                    <div
                      key={idx}
                      className="absolute rounded-full blur-xl"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        width: '40px',
                        height: '40px',
                        backgroundColor: getHeatmapColor(point.intensity, point.type),
                        transform: 'translate(-50%, -50%)',
                        boxShadow: `0 0 20px ${getHeatmapColor(point.intensity, point.type)}`,
                      }}
                    />
                  ))}

                  {/* Legenda */}
                  <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Pressão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Oportunidade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Perigo</span>
                    </div>
                  </div>
                </div>

                {/* Controle de Minuto */}
                <div className="mt-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={currentMinute}
                      onChange={(e) => setCurrentMinute(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white font-bold text-lg">{currentMinute}°</span>
                  </div>
                </div>

                {/* Estatísticas do Minuto */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Pressão</p>
                    <p className="text-2xl font-bold text-blue-400">{Math.floor(40 + (currentMinute / 90) * 40)}%</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Posse</p>
                    <p className="text-2xl font-bold text-green-400">{Math.floor(45 + Math.random() * 10)}%</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">xG</p>
                    <p className="text-2xl font-bold text-yellow-400">{(1.2 + (currentMinute / 90) * 0.8).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline de Eventos */}
          <div>
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      selectedEvent?.minute === event.minute
                        ? 'bg-slate-600 border-2 border-yellow-400'
                        : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getEventIcon(event.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{event.minute}°</span>
                          <Badge className={getEventColor(event.type)}>
                            {event.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{event.player}</p>
                        <p className="text-gray-400 text-xs">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detalhes do Evento Selecionado */}
        {selectedEvent && (
          <Card className="mt-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Detalhes do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Minuto</p>
                  <p className="text-2xl font-bold text-white">{selectedEvent.minute}°</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tipo</p>
                  <p className="text-2xl font-bold text-yellow-400">{selectedEvent.type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {selectedEvent.team === 'home' ? 'Casa' : 'Visitante'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Jogador</p>
                  <p className="text-lg font-bold text-green-400">{selectedEvent.player}</p>
                </div>
              </div>
              <p className="text-gray-300 mt-4">{selectedEvent.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
