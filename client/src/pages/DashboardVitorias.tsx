import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Target, Zap, Award } from 'lucide-react';
import ConfettiExplosion from '@/components/Animations/ConfettiExplosion';
import { getSoundManager } from '@/services/soundManager';

interface Vitoria {
  id: string;
  data: Date;
  artilheiro: string;
  gols: number;
  pontos: number;
  tipo: 'acerto' | 'combo' | 'record';
}

export default function DashboardVitorias() {
  const [vitorias, setVitorias] = useState<Vitoria[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalGols, setTotalGols] = useState(0);
  const [totalPontos, setTotalPontos] = useState(0);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const [melhorStreak, setMelhorStreak] = useState(0);

  const soundManager = getSoundManager();

  useEffect(() => {
    // Carregar dados salvos do localStorage
    const dadosSalvos = localStorage.getItem('vitorias');
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      setVitorias(dados.vitorias || []);
      setStreak(dados.streak || 0);
      setTotalGols(dados.totalGols || 0);
      setTotalPontos(dados.totalPontos || 0);
      setMelhorStreak(dados.melhorStreak || 0);
    }
  }, []);

  const handleMarcarVitoria = (tipo: 'acerto' | 'combo' | 'record' = 'acerto') => {
    const gols = tipo === 'combo' ? 3 : tipo === 'record' ? 5 : 1;
    const pontos = tipo === 'combo' ? 150 : tipo === 'record' ? 250 : 50;

    const novaVitoria: Vitoria = {
      id: `vitoria_${Date.now()}`,
      data: new Date(),
      artilheiro: ['Neymar Jr', 'Vinícius Jr', 'Rodrygo', 'Endrick'][Math.floor(Math.random() * 4)],
      gols,
      pontos,
      tipo,
    };

    const novoStreak = streak + 1;
    const novoTotal = totalGols + gols;
    const novoPontos = totalPontos + pontos;
    const novoMelhorStreak = Math.max(melhorStreak, novoStreak);

    setVitorias(prev => [novaVitoria, ...prev]);
    setStreak(novoStreak);
    setTotalGols(novoTotal);
    setTotalPontos(novoPontos);
    setMelhorStreak(novoMelhorStreak);

    // Salvar no localStorage
    localStorage.setItem('vitorias', JSON.stringify({
      vitorias: [novaVitoria, ...vitorias],
      streak: novoStreak,
      totalGols: novoTotal,
      totalPontos: novoPontos,
      melhorStreak: novoMelhorStreak,
    }));

    // Efeitos visuais e sonoros
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    setConfetti({ x, y });

    if (tipo === 'acerto') {
      soundManager.playSuccess();
    } else if (tipo === 'combo') {
      soundManager.playCombo(novoStreak);
    } else if (tipo === 'record') {
      soundManager.playNewRecord();
    }

    setTimeout(() => setConfetti(null), 3000);
  };

  const handleResetarStreak = () => {
    if (confirm('Tem certeza que deseja resetar o streak?')) {
      setStreak(0);
      localStorage.setItem('vitorias', JSON.stringify({
        vitorias,
        streak: 0,
        totalGols,
        totalPontos,
        melhorStreak,
      }));
      soundManager.playDefeat();
    }
  };

  const getTipoEmoji = (tipo: string) => {
    const emojis: Record<string, string> = {
      acerto: '✅',
      combo: '🔥',
      record: '🏆',
    };
    return emojis[tipo] || '⭐';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {confetti && (
        <ConfettiExplosion
          x={confetti.x}
          y={confetti.y}
          intensity={80}
          duration={3000}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">🏆 Dashboard de Vitórias</h1>
          </div>
          <p className="text-gray-400">Acompanhe suas vitórias e streaks</p>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Streak Atual */}
          <Card className={`bg-gradient-to-br ${streak > 0 ? 'from-red-900 to-red-800' : 'from-slate-800 to-slate-700'} border-slate-700`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Streak Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-red-400 animate-pulse">{streak}</div>
              <p className="text-xs text-gray-400 mt-2">Vitórias consecutivas</p>
            </CardContent>
          </Card>

          {/* Melhor Streak */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Melhor Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-yellow-400">{melhorStreak}</div>
              <p className="text-xs text-gray-400 mt-2">Recorde pessoal</p>
            </CardContent>
          </Card>

          {/* Total de Gols */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                ⚽ Total de Gols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-green-400">{totalGols}</div>
              <p className="text-xs text-gray-400 mt-2">Gols marcados</p>
            </CardContent>
          </Card>

          {/* Total de Pontos */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Total de Pontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-purple-400">{totalPontos}</div>
              <p className="text-xs text-gray-400 mt-2">Pontos acumulados</p>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <Button
            onClick={() => handleMarcarVitoria('acerto')}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transform transition hover:scale-105"
          >
            ✅ Marcar Acerto (+50 pts)
          </Button>

          <Button
            onClick={() => handleMarcarVitoria('combo')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transform transition hover:scale-105"
          >
            🔥 Marcar Combo (+150 pts)
          </Button>

          <Button
            onClick={() => handleMarcarVitoria('record')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transform transition hover:scale-105"
          >
            🏆 Novo Recorde (+250 pts)
          </Button>

          <Button
            onClick={handleResetarStreak}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transform transition hover:scale-105"
          >
            ❌ Resetar Streak
          </Button>
        </div>

        {/* Histórico de Vitórias */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Histórico de Vitórias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vitorias.length === 0 ? (
              <p className="text-center text-gray-400">Nenhuma vitória registrada ainda!</p>
            ) : (
              <div className="space-y-3">
                {vitorias.slice(0, 10).map((vitoria, index) => (
                  <div
                    key={vitoria.id}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTipoEmoji(vitoria.tipo)}</span>
                      <div>
                        <p className="font-semibold text-white">{vitoria.artilheiro}</p>
                        <p className="text-xs text-gray-400">
                          {vitoria.data.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-green-400">{vitoria.gols} gol(s)</p>
                      <p className="text-sm text-purple-400">+{vitoria.pontos} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card className="mt-8 bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-blue-300 text-sm">
              💡 Dica: Mantenha seu streak e ganhe pontos! Cada acerto adiciona pontos ao seu total. Combos e recordes dão muito mais pontos!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
