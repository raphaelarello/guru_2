import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface OddComparativo {
  mercado: string;
  betfair: {
    odd: number;
    volume: number;
    timestamp: number;
  };
  pinnacle: {
    odd: number;
    volume: number;
    timestamp: number;
  };
  valueBetting: {
    detectado: boolean;
    percentualValue: number;
    recomendacao: string;
  };
}

interface JogoOdds {
  fixtureId: number;
  casa: string;
  visitante: string;
  odds: OddComparativo[];
  ultimaAtualizacao: number;
}

export default function ValueBetting() {
  const [jogos, setJogos] = useState<JogoOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJogo, setSelectedJogo] = useState<JogoOdds | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simular dados de Value Betting
  useEffect(() => {
    const carregarDados = () => {
      setLoading(true);
      
      const jogosMock: JogoOdds[] = [
        {
          fixtureId: 1,
          casa: 'Manchester City',
          visitante: 'Liverpool',
          odds: [
            {
              mercado: 'Vitória Casa',
              betfair: { odd: 1.88, volume: 125000, timestamp: Date.now() },
              pinnacle: { odd: 1.82, volume: 95000, timestamp: Date.now() },
              valueBetting: { detectado: true, percentualValue: 3.3, recomendacao: 'BET na Betfair: 3.3% melhor' },
            },
            {
              mercado: 'Empate',
              betfair: { odd: 3.65, volume: 45000, timestamp: Date.now() },
              pinnacle: { odd: 3.60, volume: 38000, timestamp: Date.now() },
              valueBetting: { detectado: false, percentualValue: 1.4, recomendacao: '' },
            },
            {
              mercado: 'Over 2.5 Gols',
              betfair: { odd: 1.98, volume: 180000, timestamp: Date.now() },
              pinnacle: { odd: 1.92, volume: 140000, timestamp: Date.now() },
              valueBetting: { detectado: true, percentualValue: 3.1, recomendacao: 'BET na Betfair: 3.1% melhor' },
            },
            {
              mercado: 'Ambas Marcam',
              betfair: { odd: 1.75, volume: 95000, timestamp: Date.now() },
              pinnacle: { odd: 1.78, volume: 85000, timestamp: Date.now() },
              valueBetting: { detectado: false, percentualValue: -1.7, recomendacao: '' },
            },
          ],
          ultimaAtualizacao: Date.now(),
        },
        {
          fixtureId: 2,
          casa: 'Real Madrid',
          visitante: 'Barcelona',
          odds: [
            {
              mercado: 'Vitória Casa',
              betfair: { odd: 2.15, volume: 95000, timestamp: Date.now() },
              pinnacle: { odd: 2.08, volume: 75000, timestamp: Date.now() },
              valueBetting: { detectado: true, percentualValue: 3.4, recomendacao: 'BET na Betfair: 3.4% melhor' },
            },
            {
              mercado: 'Over 2.5 Gols',
              betfair: { odd: 2.05, volume: 120000, timestamp: Date.now() },
              pinnacle: { odd: 1.98, volume: 95000, timestamp: Date.now() },
              valueBetting: { detectado: true, percentualValue: 3.5, recomendacao: 'BET na Betfair: 3.5% melhor' },
            },
          ],
          ultimaAtualizacao: Date.now(),
        },
        {
          fixtureId: 3,
          casa: 'Bayern Munich',
          visitante: 'Borussia Dortmund',
          odds: [
            {
              mercado: 'Vitória Visitante',
              betfair: { odd: 4.35, volume: 35000, timestamp: Date.now() },
              pinnacle: { odd: 4.20, volume: 28000, timestamp: Date.now() },
              valueBetting: { detectado: true, percentualValue: 3.6, recomendacao: 'BET na Betfair: 3.6% melhor' },
            },
            {
              mercado: 'Over 2.5 Gols',
              betfair: { odd: 1.85, volume: 95000, timestamp: Date.now() },
              pinnacle: { odd: 1.80, volume: 75000, timestamp: Date.now() },
              valueBetting: { detectado: true, percentualValue: 2.8, recomendacao: 'BET na Betfair: 2.8% melhor' },
            },
          ],
          ultimaAtualizacao: Date.now(),
        },
      ];

      setJogos(jogosMock);
      setLoading(false);
    };

    carregarDados();

    if (autoRefresh) {
      const interval = setInterval(carregarDados, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const totalValueBetting = jogos.reduce((acc, jogo) => {
    return acc + jogo.odds.filter(o => o.valueBetting.detectado).length;
  }, 0);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Dados atualizados com sucesso!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Value Betting</h1>
              <p className="text-slate-400">Oportunidades de apostas com valor acima do esperado</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Jogos Monitorados</div>
                <div className="text-3xl font-bold text-white">{jogos.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Oportunidades Value</div>
                <div className="text-3xl font-bold text-emerald-400">{totalValueBetting}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Última Atualização</div>
                <div className="text-sm text-white">
                  {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Jogos */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block">
                <RefreshCw className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-slate-400 mt-4">Carregando dados...</p>
            </div>
          ) : (
            jogos.map((jogo) => {
              const temValue = jogo.odds.some(o => o.valueBetting.detectado);
              return (
                <Card
                  key={jogo.fixtureId}
                  className={`bg-slate-800/50 border cursor-pointer transition-all hover:border-emerald-500/50 ${
                    temValue ? 'border-emerald-500/30' : 'border-slate-700'
                  }`}
                  onClick={() => setSelectedJogo(jogo)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {jogo.casa} vs {jogo.visitante}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {jogo.odds.length} mercados disponíveis
                        </p>
                      </div>
                      {temValue && (
                        <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {jogo.odds.filter(o => o.valueBetting.detectado).length} Value
                        </Badge>
                      )}
                    </div>

                    {/* Odds Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {jogo.odds.slice(0, 4).map((odd, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            odd.valueBetting.detectado
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-slate-700/30 border-slate-600/30'
                          }`}
                        >
                          <div className="text-xs text-slate-400 mb-1 truncate">
                            {odd.mercado}
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {odd.betfair.odd.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-500">Betfair</div>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {odd.pinnacle.odd.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-500">Pinnacle</div>
                            </div>
                          </div>
                          {odd.valueBetting.detectado && (
                            <div className="text-xs text-emerald-400 mt-2 font-semibold">
                              +{odd.valueBetting.percentualValue.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal de Detalhes */}
        {selectedJogo && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedJogo(null)}
          >
            <Card
              className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedJogo.casa} vs {selectedJogo.visitante}
                </CardTitle>
                <CardDescription>Análise detalhada de value betting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedJogo.odds.map((odd, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      odd.valueBetting.detectado
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-700/30 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {odd.mercado}
                        </h4>
                        {odd.valueBetting.detectado && (
                          <div className="flex items-center mt-2">
                            <AlertCircle className="w-4 h-4 text-emerald-400 mr-2" />
                            <span className="text-sm text-emerald-400 font-semibold">
                              {odd.valueBetting.recomendacao}
                            </span>
                          </div>
                        )}
                      </div>
                      {odd.valueBetting.detectado && (
                        <Badge className="bg-emerald-600 text-white">
                          +{odd.valueBetting.percentualValue.toFixed(1)}% Value
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-3 rounded">
                        <div className="text-xs text-slate-400 mb-2">Betfair</div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {odd.betfair.odd.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Volume: {(odd.betfair.volume / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded">
                        <div className="text-xs text-slate-400 mb-2">Pinnacle</div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {odd.pinnacle.odd.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Volume: {(odd.pinnacle.volume / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>

                    {odd.valueBetting.detectado && (
                      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
                        <div className="text-sm text-emerald-400">
                          <strong>Análise:</strong> A odd na Betfair está {odd.valueBetting.percentualValue.toFixed(1)}% acima da Pinnacle,
                          indicando uma oportunidade de value betting. Recomenda-se apostar na Betfair.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
