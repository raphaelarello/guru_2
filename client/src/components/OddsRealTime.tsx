import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Odd {
  bookmaker: string;
  market: string;
  odd: number;
  probability: number;
  value: number;
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface OddsRealTimeProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
}

export const OddsRealTime: React.FC<OddsRealTimeProps> = ({ matchId, homeTeam, awayTeam }) => {
  const [odds, setOdds] = useState<Odd[]>([
    {
      bookmaker: 'Betfair',
      market: 'Vitória Casa',
      odd: 2.45,
      probability: 40.8,
      value: 5.2,
      trend: 'up',
      history: [2.40, 2.42, 2.45],
    },
    {
      bookmaker: 'Betfair',
      market: 'Empate',
      odd: 3.20,
      probability: 31.3,
      value: -0.9,
      trend: 'down',
      history: [3.30, 3.25, 3.20],
    },
    {
      bookmaker: 'Betfair',
      market: 'Vitória Fora',
      odd: 3.10,
      probability: 32.3,
      value: 2.1,
      trend: 'stable',
      history: [3.10, 3.10, 3.10],
    },
    {
      bookmaker: 'Pinnacle',
      market: 'Over 2.5 Gols',
      odd: 1.95,
      probability: 51.3,
      value: -1.3,
      trend: 'down',
      history: [1.98, 1.97, 1.95],
    },
    {
      bookmaker: 'Pinnacle',
      market: 'Under 2.5 Gols',
      odd: 1.92,
      probability: 52.1,
      value: 2.1,
      trend: 'up',
      history: [1.88, 1.90, 1.92],
    },
  ]);

  const [selectedMarket, setSelectedMarket] = useState<string>('Vitória Casa');

  // Simular atualização de odds
  useEffect(() => {
    const interval = setInterval(() => {
      setOdds(prevOdds =>
        prevOdds.map(odd => ({
          ...odd,
          odd: odd.odd + (Math.random() - 0.5) * 0.1,
          history: [...odd.history.slice(-2), odd.odd + (Math.random() - 0.5) * 0.1],
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getValueColor = (value: number) => {
    if (value > 2) return 'text-green-400';
    if (value > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <div className="w-4 h-4 bg-slate-400 rounded-full" />;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">📊 Odds em Tempo Real</h3>

        {/* Filtro de Mercados */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['Vitória Casa', 'Empate', 'Vitória Fora', 'Over 2.5', 'Under 2.5'].map(market => (
            <button
              key={market}
              onClick={() => setSelectedMarket(market)}
              className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                selectedMarket === market
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {market}
            </button>
          ))}
        </div>

        {/* Grid de Odds */}
        <div className="grid grid-cols-1 gap-3">
          {odds.map((odd, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{odd.bookmaker}</span>
                  <span className="text-xs text-slate-400">{odd.market}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(odd.trend)}
                  <span className="text-xs text-slate-400">
                    {odd.history[1]?.toFixed(2)} → {odd.odd.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Odd</div>
                  <div className="text-2xl font-bold text-white">{odd.odd.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Probabilidade</div>
                  <div className="text-lg font-semibold text-blue-400">{odd.probability.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Value</div>
                  <div className={`text-lg font-semibold ${getValueColor(odd.value)}`}>
                    {odd.value > 0 ? '+' : ''}{odd.value.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Indicador de Value */}
              {odd.value > 2 && (
                <div className="mt-2 px-2 py-1 bg-green-900/30 border border-green-700 rounded text-xs text-green-400">
                  ✓ Ótima oportunidade de value betting!
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="text-xs text-blue-300">
            💡 <strong>Dica:</strong> Procure por odds com value positivo acima de 2% para melhores retornos a longo prazo.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OddsRealTime;
