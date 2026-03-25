import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal, TrendingUp, Flame, Crown } from 'lucide-react';

interface Jogador {
  id: string;
  nome: string;
  time: string;
  gols: number;
  assistencias: number;
  pontos: number;
  forma: number;
  tendencia: 'up' | 'down' | 'stable';
  posicaoAnterior: number;
}

export default function LeaderboardAnimado() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [filtro, setFiltro] = useState<'gols' | 'assistencias' | 'pontos'>('gols');

  useEffect(() => {
    // Gerar dados iniciais
    const nomes = [
      'Neymar Jr',
      'Vinícius Júnior',
      'Rodrygo',
      'Endrick',
      'Richarlison',
      'Antony',
      'Lucas Paquetá',
      'Raphinha',
      'Éder Militão',
      'Marquinhos',
    ];

    const times = ['PSG', 'Real Madrid', 'Manchester City', 'Liverpool', 'Barcelona', 'Bayern'];

    const dados = nomes.map((nome, index) => ({
      id: `player_${index}`,
      nome,
      time: times[Math.floor(Math.random() * times.length)],
      gols: Math.floor(Math.random() * 30) + 5,
      assistencias: Math.floor(Math.random() * 15) + 2,
      pontos: Math.floor(Math.random() * 100) + 20,
      forma: Math.floor(Math.random() * 100) + 50,
      tendencia: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
      posicaoAnterior: Math.floor(Math.random() * 10) + 1,
    }));

    setJogadores(dados.sort((a, b) => b[filtro] - a[filtro]));
  }, [filtro]);

  const getMedalha = (posicao: number) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `${posicao}º`;
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (tendencia === 'down') return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
    return <div className="w-4 h-4 text-gray-400">-</div>;
  };

  const getTendenciaTexto = (tendencia: string) => {
    if (tendencia === 'up') return 'Subindo';
    if (tendencia === 'down') return 'Caindo';
    return 'Estável';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">🏆 Leaderboard Animado</h1>
          </div>
          <p className="text-gray-400">Ranking dos melhores artilheiros em tempo real</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-3">
          {['gols', 'assistencias', 'pontos'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filtro === f
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {f === 'gols' && '⚽ Gols'}
              {f === 'assistencias' && '🎯 Assistências'}
              {f === 'pontos' && '⭐ Pontos'}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {jogadores.map((jogador, index) => (
            <Card
              key={jogador.id}
              className={`bg-slate-800 border-slate-700 hover:border-green-500 transition transform hover:scale-102 cursor-pointer overflow-hidden ${
                index === 0 ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <CardContent className="pt-0 pb-0">
                <div className="flex items-center gap-4 p-4">
                  {/* Posição */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                    <span className="text-2xl font-bold text-white">{getMedalha(index + 1)}</span>
                  </div>

                  {/* Informações do Jogador */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-lg font-bold text-white">{jogador.nome}</p>
                      {index === 0 && <Flame className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-400">{jogador.time}</p>
                  </div>

                  {/* Forma */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                          style={{ width: `${jogador.forma}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-green-400 w-8 text-right">
                        {jogador.forma}%
                      </span>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex-shrink-0 flex gap-6 text-right">
                    <div>
                      <p className="text-2xl font-bold text-white">{jogador.gols}</p>
                      <p className="text-xs text-gray-400">Gols</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{jogador.assistencias}</p>
                      <p className="text-xs text-gray-400">Assist</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">{jogador.pontos}</p>
                      <p className="text-xs text-gray-400">Pontos</p>
                    </div>
                  </div>

                  {/* Tendência */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {getTendenciaIcon(jogador.tendencia)}
                    <span className={`text-xs font-semibold ${
                      jogador.tendencia === 'up' ? 'text-green-400' :
                      jogador.tendencia === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {getTendenciaTexto(jogador.tendencia)}
                    </span>
                  </div>
                </div>

                {/* Barra de progresso animada */}
                <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dicas */}
        <Card className="mt-8 bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-blue-300 text-sm">
              💡 Dica: Passe o mouse sobre os jogadores para ver mais detalhes. Os dados são atualizados em tempo real!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
