import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConfettiExplosion from '@/components/Animations/ConfettiExplosion';
import ParticleEffect from '@/components/Animations/ParticleEffect';
import { getSoundManager } from '@/services/soundManager';

interface Fogos {
  id: string;
  x: number;
  y: number;
  color: string;
}

export default function CelebracaoEpica() {
  const [fogos, setFogos] = useState<Fogos[]>([]);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; type: string }>>([]);
  const [mensagem, setMensagem] = useState('');
  const [celebrando, setCelebrando] = useState(false);

  const soundManager = getSoundManager();

  const mensagensVitoria = [
    '🎉 VITÓRIA ÉPICA! 🎉',
    '🏆 VOCÊ É O MELHOR! 🏆',
    '⚡ PERFORMANCE INSANA! ⚡',
    '🔥 FOGO NO CAMPO! 🔥',
    '👑 CAMPEÃO! 👑',
    '🌟 ESTRELA BRILHANTE! 🌟',
    '💎 DIAMANTE PURO! 💎',
    '🚀 FOGUETE LANÇADO! 🚀',
  ];

  const cores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#ff0066'];

  const handleCelebrar = () => {
    setCelebrando(true);
    setMensagem(mensagensVitoria[Math.floor(Math.random() * mensagensVitoria.length)]);

    // Criar múltiplos fogos de artifício
    const novosFogos: Fogos[] = [];
    for (let i = 0; i < 8; i++) {
      novosFogos.push({
        id: `fogo_${Date.now()}_${i}`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.6),
        color: cores[i % cores.length],
      });
    }

    setFogos(novosFogos);

    // Confete em múltiplos pontos
    const novoConfetti = [
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
    ];

    setConfetti(novoConfetti[0]);

    // Partículas
    const novasParticulas = [
      { x: window.innerWidth * 0.2, y: window.innerHeight * 0.4, type: 'star' },
      { x: window.innerWidth * 0.8, y: window.innerHeight * 0.4, type: 'circle' },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6, type: 'square' },
    ];

    setParticles(novasParticulas);

    // Sons épicos
    soundManager.playEpicVictory();
    setTimeout(() => soundManager.playCelebration(), 500);

    setTimeout(() => {
      setCelebrando(false);
      setFogos([]);
      setConfetti(null);
      setParticles([]);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6 overflow-hidden">
      {/* Confete */}
      {confetti && (
        <ConfettiExplosion
          x={confetti.x}
          y={confetti.y}
          intensity={150}
          duration={5000}
          colors={cores}
        />
      )}

      {/* Partículas */}
      {particles.map((p, i) => (
        <ParticleEffect
          key={`particle_${i}`}
          x={p.x}
          y={p.y}
          count={80}
          type={p.type as any}
          color={cores[i % cores.length]}
          duration={3000}
        />
      ))}

      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
        <Card className="bg-gradient-to-br from-purple-900 to-slate-900 border-2 border-yellow-400 shadow-2xl">
          <CardContent className="pt-12 pb-12 px-12 text-center">
            {/* Título Épico */}
            <div className="mb-8">
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 mb-4 animate-pulse">
                🎊 CELEBRAÇÃO ÉPICA 🎊
              </h1>
              <p className="text-2xl text-gray-300 mb-4">Você conquistou uma vitória memorável!</p>
            </div>

            {/* Mensagem Dinâmica */}
            {mensagem && (
              <div className="mb-12 p-8 bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-xl border-2 border-yellow-400 animate-bounce">
                <p className="text-5xl font-black text-yellow-300">{mensagem}</p>
              </div>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-slate-800 rounded-lg border-2 border-green-400">
                <p className="text-gray-300 text-sm mb-2">Gols</p>
                <p className="text-4xl font-bold text-green-400">5</p>
              </div>

              <div className="p-6 bg-slate-800 rounded-lg border-2 border-blue-400">
                <p className="text-gray-300 text-sm mb-2">Pontos</p>
                <p className="text-4xl font-bold text-blue-400">250</p>
              </div>

              <div className="p-6 bg-slate-800 rounded-lg border-2 border-purple-400">
                <p className="text-gray-300 text-sm mb-2">Streak</p>
                <p className="text-4xl font-bold text-purple-400">15</p>
              </div>
            </div>

            {/* Emojis Animados */}
            <div className="mb-12 flex justify-center gap-4 text-6xl animate-bounce">
              <span>🏆</span>
              <span>⭐</span>
              <span>🎉</span>
              <span>🔥</span>
              <span>👑</span>
            </div>

            {/* Botão de Celebração */}
            <Button
              onClick={handleCelebrar}
              disabled={celebrando}
              className="bg-gradient-to-r from-yellow-400 to-red-400 hover:from-yellow-500 hover:to-red-500 text-black font-black py-6 px-12 rounded-xl text-2xl transform transition hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              {celebrando ? '🎆 CELEBRANDO... 🎆' : '🎆 EXPLODIR EM CELEBRAÇÃO 🎆'}
            </Button>

            {/* Mensagem Inspiradora */}
            <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-lg">
                ✨ Você está em uma sequência incrível! Continue assim e quebre todos os recordes! ✨
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fundo com efeito de pulso */}
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 animate-pulse" />
      </div>
    </div>
  );
}
