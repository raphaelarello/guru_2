import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConfettiExplosion from '@/components/Animations/ConfettiExplosion';
import ParticleEffect from '@/components/Animations/ParticleEffect';
import { Trophy, Zap, Heart, Flame } from 'lucide-react';

interface Gol {
  id: string;
  artilheiro: string;
  time: string;
  minuto: number;
  tipo: 'normal' | 'pênalti' | 'contra-ataque' | 'bicicleta';
  reacao: 'celebracao' | 'frustacao' | 'raiva' | 'surpresa';
}

export default function SimuladorGols() {
  const [gols, setGols] = useState<Gol[]>([]);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const [particles, setParticles] = useState<{ x: number; y: number; type: string } | null>(null);
  const [reacao, setReacao] = useState<string | null>(null);

  const artilheiros = [
    'Neymar Jr',
    'Vinícius Júnior',
    'Rodrygo',
    'Vinicius Jr',
    'Endrick',
    'Richarlison',
    'Antony',
  ];

  const times = ['Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Santos', 'Cruzeiro'];

  const tipos = ['normal', 'pênalti', 'contra-ataque', 'bicicleta'];
  const reacoes = ['celebracao', 'frustacao', 'raiva', 'surpresa'];

  const handleMarcarGol = () => {
    const novoGol: Gol = {
      id: `gol_${Date.now()}`,
      artilheiro: artilheiros[Math.floor(Math.random() * artilheiros.length)],
      time: times[Math.floor(Math.random() * times.length)],
      minuto: Math.floor(Math.random() * 90) + 1,
      tipo: tipos[Math.floor(Math.random() * tipos.length)] as any,
      reacao: reacoes[Math.floor(Math.random() * reacoes.length)] as any,
    };

    setGols(prev => [novoGol, ...prev]);

    // Efeitos visuais
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    setConfetti({ x, y });
    setParticles({ x, y, type: 'star' });
    setReacao(novoGol.reacao);

    setTimeout(() => {
      setConfetti(null);
      setParticles(null);
      setReacao(null);
    }, 3000);
  };

  const getReacaoEmoji = (reacao: string) => {
    const emojis: Record<string, string> = {
      celebracao: '🎉',
      frustacao: '😤',
      raiva: '🔥',
      surpresa: '😲',
    };
    return emojis[reacao] || '⚽';
  };

  const getReacaoTexto = (reacao: string) => {
    const textos: Record<string, string> = {
      celebracao: 'CELEBRAÇÃO!',
      frustacao: 'QUE FRUSTRAÇÃO!',
      raiva: 'QUE RAIVA!',
      surpresa: 'QUE SURPRESA!',
    };
    return textos[reacao] || 'GOL!';
  };

  const getTipoGolTexto = (tipo: string) => {
    const textos: Record<string, string> = {
      normal: 'Gol Normal',
      pênalti: 'Pênalti',
      'contra-ataque': 'Contra-ataque',
      bicicleta: 'Bicicleta',
    };
    return textos[tipo] || tipo;
  };

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

      {particles && (
        <ParticleEffect
          x={particles.x}
          y={particles.y}
          count={50}
          type={particles.type as any}
          color="#fbbf24"
          duration={2000}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2">⚽ Simulador de Gols</h1>
          <p className="text-gray-400">Marque gols e veja as reações animadas!</p>
        </div>

        {/* Botão de Marcar Gol */}
        <div className="mb-8 text-center">
          <Button
            onClick={handleMarcarGol}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transform transition hover:scale-105 active:scale-95"
          >
            ⚽ MARCAR GOL
          </Button>
        </div>

        {/* Reação Grande */}
        {reacao && (
          <div className="mb-8 text-center animate-bounce">
            <div className="text-9xl mb-4">{getReacaoEmoji(reacao)}</div>
            <div className="text-4xl font-bold text-yellow-400 animate-pulse">
              {getReacaoTexto(reacao)}
            </div>
          </div>
        )}

        {/* Histórico de Gols */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Total de Gols</p>
                <p className="text-4xl font-bold text-green-400">{gols.length}</p>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-gray-400 text-sm mb-2">Tipos de Gol</p>
                <div className="space-y-2">
                  {['normal', 'pênalti', 'contra-ataque', 'bicicleta'].map(tipo => (
                    <div key={tipo} className="flex justify-between">
                      <span className="text-gray-400">{getTipoGolTexto(tipo)}</span>
                      <span className="text-white font-semibold">
                        {gols.filter(g => g.tipo === tipo).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-gray-400 text-sm mb-2">Reações</p>
                <div className="space-y-2">
                  {['celebracao', 'frustacao', 'raiva', 'surpresa'].map(reacao => (
                    <div key={reacao} className="flex justify-between">
                      <span className="text-gray-400">{getReacaoTexto(reacao)}</span>
                      <span className="text-white font-semibold">
                        {gols.filter(g => g.reacao === reacao).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Gols */}
          <div className="lg:col-span-2 space-y-4">
            {gols.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-400">Nenhum gol marcado ainda. Clique no botão acima!</p>
                </CardContent>
              </Card>
            ) : (
              gols.map((gol, index) => (
                <Card
                  key={gol.id}
                  className="bg-slate-800 border-slate-700 hover:border-green-500 transition transform hover:scale-105 cursor-pointer"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getReacaoEmoji(gol.reacao)}</span>
                          <div>
                            <p className="text-xl font-bold text-white">{gol.artilheiro}</p>
                            <p className="text-sm text-gray-400">
                              {gol.time} • {getTipoGolTexto(gol.tipo)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-bold text-yellow-400">{gol.minuto}'</p>
                        <p className="text-xs text-gray-500">#{index + 1}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {gol.tipo === 'bicicleta' && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold">
                          🚴 Bicicleta
                        </span>
                      )}
                      {gol.tipo === 'pênalti' && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                          🔴 Pênalti
                        </span>
                      )}
                      {gol.tipo === 'contra-ataque' && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold">
                          ⚡ Contra-ataque
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                        {getReacaoTexto(gol.reacao)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Dicas */}
        <Card className="mt-8 bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-blue-300 text-sm">
              💡 Dica: Clique no botão "MARCAR GOL" para simular gols com reações aleatórias, tipos diferentes e animações épicas!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
