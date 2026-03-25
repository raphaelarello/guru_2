import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ValueBettingAlert {
  jogador: string;
  exchange: 'betfair' | 'pinnacle';
  odds: number;
  expectedProbability: number;
  value: number;
  timestamp: Date;
}

export default function ValueBetting() {
  const [alerts, setAlerts] = useState<ValueBettingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'betfair' | 'pinnacle'>('todos');

  useEffect(() => {
    // Simular dados de value betting
    const mockAlerts: ValueBettingAlert[] = [
      {
        jogador: 'Erling Haaland',
        exchange: 'betfair',
        odds: 2.45,
        expectedProbability: 0.35,
        value: 0.075,
        timestamp: new Date(),
      },
      {
        jogador: 'Vinícius Júnior',
        exchange: 'pinnacle',
        odds: 2.80,
        expectedProbability: 0.30,
        value: 0.056,
        timestamp: new Date(),
      },
      {
        jogador: 'Kylian Mbappé',
        exchange: 'betfair',
        odds: 2.65,
        expectedProbability: 0.32,
        value: 0.046,
        timestamp: new Date(),
      },
    ];

    setAlerts(mockAlerts);
    setLoading(false);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'todos') return true;
    return alert.exchange === filter;
  });

  const getValueColor = (value: number) => {
    if (value > 0.1) return 'bg-green-500/20 text-green-600';
    if (value > 0.07) return 'bg-emerald-500/20 text-emerald-600';
    return 'bg-yellow-500/20 text-yellow-600';
  };

  const getExchangeColor = (exchange: string) => {
    return exchange === 'betfair' ? 'bg-blue-500/20 text-blue-600' : 'bg-purple-500/20 text-purple-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-white">Value Betting</h1>
          </div>
          <p className="text-slate-400">Detecte oportunidades de apostas com value positivo</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          {(['todos', 'betfair', 'pinnacle'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'betfair' ? 'Betfair' : 'Pinnacle'}
            </button>
          ))}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Alertas</p>
                <p className="text-3xl font-bold text-white mt-2">{filteredAlerts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Value Médio</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {filteredAlerts.length > 0
                    ? ((filteredAlerts.reduce((sum, a) => sum + a.value, 0) / filteredAlerts.length) * 100).toFixed(2)
                    : '0'}
                  %
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Odds Média</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {filteredAlerts.length > 0
                    ? (filteredAlerts.reduce((sum, a) => sum + a.odds, 0) / filteredAlerts.length).toFixed(2)
                    : '0'}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Carregando alertas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhum alerta de value betting encontrado</p>
            </div>
          ) : (
            filteredAlerts.map((alert, idx) => (
              <Card
                key={idx}
                className="bg-slate-800/50 border-slate-700 p-6 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">{alert.jogador}</h3>
                      <Badge className={getExchangeColor(alert.exchange)}>
                        {alert.exchange.toUpperCase()}
                      </Badge>
                      <Badge className={getValueColor(alert.value)}>
                        Value: {(alert.value * 100).toFixed(2)}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Odds</p>
                        <p className="text-white font-semibold">{alert.odds.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Probabilidade Esperada</p>
                        <p className="text-white font-semibold">{(alert.expectedProbability * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Probabilidade Implícita</p>
                        <p className="text-white font-semibold">{((1 / alert.odds) * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>

                  <button className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Apostar
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
