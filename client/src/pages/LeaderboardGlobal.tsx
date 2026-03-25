import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Medal, Search, TrendingUp } from 'lucide-react';

interface Player {
  rank: number;
  name: string;
  email: string;
  totalPoints: number;
  wins: number;
  streak: number;
  accuracy: number;
  plan: string;
  avatar?: string;
  joinDate: string;
}

export default function LeaderboardGlobal() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'elite'>('all');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'streak' | 'accuracy'>('points');

  useEffect(() => {
    // Gerar dados simulados de leaderboard
    const generatePlayers = (): Player[] => {
      const names = [
        'Carlos Silva', 'Ana Santos', 'Bruno Costa', 'Fernanda Oliveira', 'João Pereira',
        'Maria Souza', 'Pedro Alves', 'Lucia Martins', 'Rafael Gomes', 'Isabela Rocha',
        'Diego Ferreira', 'Camila Ribeiro', 'Lucas Barbosa', 'Sophia Teixeira', 'Gustavo Dias',
        'Beatriz Mendes', 'Felipe Carvalho', 'Amanda Silva', 'Marcelo Nunes', 'Juliana Costa',
      ];

      const plans = ['free', 'pro', 'elite'];
      const players: Player[] = [];

      for (let i = 0; i < 100; i++) {
        const basePoints = Math.floor(Math.random() * 5000) + 1000;
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const planMultiplier = plan === 'elite' ? 1.5 : plan === 'pro' ? 1.2 : 1;

        players.push({
          rank: i + 1,
          name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length)}` : ''),
          email: `user${i + 1}@raphaguru.com`,
          totalPoints: Math.floor(basePoints * planMultiplier),
          wins: Math.floor(Math.random() * 200) + 20,
          streak: Math.floor(Math.random() * 50),
          accuracy: Math.floor(Math.random() * 40) + 55,
          plan,
          joinDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        });
      }

      return players.sort((a, b) => b.totalPoints - a.totalPoints);
    };

    setPlayers(generatePlayers());
  }, []);

  const filteredPlayers = players
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = filterPlan === 'all' || p.plan === filterPlan;
      return matchesSearch && matchesPlan;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'wins':
          return b.wins - a.wins;
        case 'streak':
          return b.streak - a.streak;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        default:
          return b.totalPoints - a.totalPoints;
      }
    });

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'elite':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'elite':
        return '👑 ELITE';
      case 'pro':
        return '⭐ PRO';
      default:
        return '📱 FREE';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Medal className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">🏆 Leaderboard Global</h1>
          </div>
          <p className="text-gray-400">Top 100 melhores jogadores do RaphaGuru</p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Filtro de Plano */}
              <div className="flex gap-2">
                {(['all', 'free', 'pro', 'elite'] as const).map(plan => (
                  <button
                    key={plan}
                    onClick={() => setFilterPlan(plan)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      filterPlan === plan
                        ? plan === 'elite'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : plan === 'pro'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : plan === 'free'
                          ? 'bg-gray-500 text-white'
                          : 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {plan === 'all' ? 'Todos' : plan.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Ordenar por */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white font-semibold"
                >
                  <option value="points">📊 Pontos</option>
                  <option value="wins">🎯 Vitórias</option>
                  <option value="streak">🔥 Streak</option>
                  <option value="accuracy">🎪 Acurácia</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Posição</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Jogador</th>
                <th className="px-6 py-4 text-center text-gray-400 font-semibold">Plano</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">Pontos</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">Vitórias</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">Streak</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">Acurácia</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Entrada</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr
                  key={player.rank}
                  className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                    player.rank <= 3 ? 'bg-slate-700/30' : ''
                  }`}
                >
                  {/* Posição */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMedalEmoji(player.rank)}</span>
                      <span className="text-white font-bold">{player.rank}</span>
                    </div>
                  </td>

                  {/* Jogador */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-semibold">{player.name}</p>
                      <p className="text-gray-400 text-sm">{player.email}</p>
                    </div>
                  </td>

                  {/* Plano */}
                  <td className="px-6 py-4 text-center">
                    <Badge className={getPlanColor(player.plan)}>
                      {getPlanLabel(player.plan)}
                    </Badge>
                  </td>

                  {/* Pontos */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-white font-bold text-lg">{player.totalPoints.toLocaleString('pt-BR')}</span>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                  </td>

                  {/* Vitórias */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-yellow-400 font-semibold">🎯 {player.wins}</span>
                  </td>

                  {/* Streak */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-orange-400 font-semibold">🔥 {player.streak}</span>
                  </td>

                  {/* Acurácia */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                          style={{ width: `${player.accuracy}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold">{player.accuracy}%</span>
                    </div>
                  </td>

                  {/* Data de Entrada */}
                  <td className="px-6 py-4 text-gray-400 text-sm">{player.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Total de Jogadores</p>
                <p className="text-4xl font-bold text-white">{players.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Plano Elite</p>
                <p className="text-4xl font-bold text-yellow-400">{players.filter(p => p.plan === 'elite').length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Plano Pro</p>
                <p className="text-4xl font-bold text-blue-400">{players.filter(p => p.plan === 'pro').length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Pontos Totais</p>
                <p className="text-4xl font-bold text-green-400">
                  {players.reduce((sum, p) => sum + p.totalPoints, 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
