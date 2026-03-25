import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Zap, Target, Crown } from 'lucide-react';
import ConfettiExplosion from '@/components/Animations/ConfettiExplosion';
import { getSoundManager } from '@/services/soundManager';

interface Achievement {
  id: string;
  nome: string;
  descricao: string;
  emoji: string;
  desbloqueado: boolean;
  progresso: number;
  meta: number;
  data?: Date;
}

interface Recorde {
  tipo: string;
  valor: number;
  data: Date;
  emoji: string;
}

export default function RankingRecordes() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recordes, setRecordes] = useState<Recorde[]>([]);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const soundManager = getSoundManager();

  useEffect(() => {
    // Carregar achievements do localStorage
    const dadosSalvos = localStorage.getItem('achievements');
    const achievementsIniciais: Achievement[] = [
      {
        id: 'first_goal',
        nome: 'Primeiro Gol',
        descricao: 'Marque seu primeiro gol',
        emoji: '⚽',
        desbloqueado: false,
        progresso: 0,
        meta: 1,
      },
      {
        id: 'ten_goals',
        nome: '10 Gols',
        descricao: 'Marque 10 gols',
        emoji: '🎯',
        desbloqueado: false,
        progresso: 0,
        meta: 10,
      },
      {
        id: 'fifty_goals',
        nome: '50 Gols',
        descricao: 'Marque 50 gols',
        emoji: '🔥',
        desbloqueado: false,
        progresso: 0,
        meta: 50,
      },
      {
        id: 'hundred_goals',
        nome: '100 Gols',
        descricao: 'Marque 100 gols',
        emoji: '💯',
        desbloqueado: false,
        progresso: 0,
        meta: 100,
      },
      {
        id: 'five_streak',
        nome: 'Streak de 5',
        descricao: 'Atinja 5 vitórias consecutivas',
        emoji: '🔗',
        desbloqueado: false,
        progresso: 0,
        meta: 5,
      },
      {
        id: 'ten_streak',
        nome: 'Streak de 10',
        descricao: 'Atinja 10 vitórias consecutivas',
        emoji: '⛓️',
        desbloqueado: false,
        progresso: 0,
        meta: 10,
      },
      {
        id: 'hundred_points',
        nome: '100 Pontos',
        descricao: 'Acumule 100 pontos',
        emoji: '💎',
        desbloqueado: false,
        progresso: 0,
        meta: 100,
      },
      {
        id: 'five_combos',
        nome: '5 Combos',
        descricao: 'Desbloqueie 5 combos',
        emoji: '💥',
        desbloqueado: false,
        progresso: 0,
        meta: 5,
      },
    ];

    if (dadosSalvos) {
      setAchievements(JSON.parse(dadosSalvos));
    } else {
      setAchievements(achievementsIniciais);
      localStorage.setItem('achievements', JSON.stringify(achievementsIniciais));
    }

    // Carregar recordes
    const recordesSalvos = localStorage.getItem('recordes');
    const recordesIniciais: Recorde[] = [
      { tipo: 'Melhor Streak', valor: 15, data: new Date('2026-03-20'), emoji: '🔥' },
      { tipo: 'Maior Pontuação', valor: 250, data: new Date('2026-03-22'), emoji: '⭐' },
      { tipo: 'Total de Gols', valor: 47, data: new Date('2026-03-25'), emoji: '⚽' },
      { tipo: 'Combos Desbloqueados', valor: 8, data: new Date('2026-03-24'), emoji: '💥' },
    ];

    if (recordesSalvos) {
      setRecordes(JSON.parse(recordesSalvos));
    } else {
      setRecordes(recordesIniciais);
      localStorage.setItem('recordes', JSON.stringify(recordesIniciais));
    }
  }, []);

  const handleDesbloquearAchievement = (id: string) => {
    const updated = achievements.map(a => {
      if (a.id === id && !a.desbloqueado) {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        setConfetti({ x, y });
        soundManager.playNewRecord();

        return {
          ...a,
          desbloqueado: true,
          data: new Date(),
          progresso: a.meta,
        };
      }
      return a;
    });

    setAchievements(updated);
    localStorage.setItem('achievements', JSON.stringify(updated));
    setTimeout(() => setConfetti(null), 3000);
  };

  const totalDesbloqueados = achievements.filter(a => a.desbloqueado).length;
  const percentualConclusao = Math.round((totalDesbloqueados / achievements.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {confetti && (
        <ConfettiExplosion
          x={confetti.x}
          y={confetti.y}
          intensity={100}
          duration={3000}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">🏆 Ranking de Recordes</h1>
          </div>
          <p className="text-gray-400">Desbloqueie achievements e quebre recordes</p>
        </div>

        {/* Progresso Geral */}
        <Card className="mb-8 bg-gradient-to-r from-purple-900 to-slate-800 border-purple-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Progresso Geral</h3>
              <span className="text-3xl font-bold text-purple-400">{percentualConclusao}%</span>
            </div>

            <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                style={{ width: `${percentualConclusao}%` }}
              />
            </div>

            <p className="text-sm text-gray-300">
              {totalDesbloqueados} de {achievements.length} achievements desbloqueados
            </p>
          </CardContent>
        </Card>

        {/* Recordes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Seus Recordes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recordes.map((recorde, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:border-yellow-400 transition">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl mb-2">{recorde.emoji}</p>
                    <p className="text-sm text-gray-400 mb-2">{recorde.tipo}</p>
                    <p className="text-3xl font-bold text-yellow-400">{recorde.valor}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {recorde.data.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-blue-400" />
            Achievements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map(achievement => (
              <Card
                key={achievement.id}
                className={`cursor-pointer transition transform hover:scale-105 ${
                  achievement.desbloqueado
                    ? 'bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-600'
                    : 'bg-slate-800 border-slate-700 opacity-60'
                }`}
                onClick={() => handleDesbloquearAchievement(achievement.id)}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-5xl mb-3">{achievement.emoji}</p>

                    <h3 className="font-bold text-white mb-1">{achievement.nome}</h3>
                    <p className="text-xs text-gray-300 mb-3">{achievement.descricao}</p>

                    {/* Barra de Progresso */}
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-300 ${
                          achievement.desbloqueado
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min((achievement.progresso / achievement.meta) * 100, 100)}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-gray-400">
                      {achievement.progresso}/{achievement.meta}
                    </p>

                    {achievement.desbloqueado && (
                      <Badge className="mt-3 bg-yellow-500 text-black">
                        ✓ Desbloqueado
                      </Badge>
                    )}

                    {achievement.data && (
                      <p className="text-xs text-gray-500 mt-2">
                        {achievement.data.toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dicas */}
        <Card className="mt-8 bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-blue-300 text-sm">
              💡 Dica: Clique nos achievements para desbloqueá-los! Desbloqueie todos para se tornar um campeão! 🏆
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
