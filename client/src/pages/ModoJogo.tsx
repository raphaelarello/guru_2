import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, Calendar, Trophy } from 'lucide-react';
import ConfettiExplosion from '@/components/Animations/ConfettiExplosion';
import { getSoundManager } from '@/services/soundManager';

interface Desafio {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'diario' | 'semanal' | 'mensal';
  meta: number;
  progresso: number;
  recompensa: number;
  emoji: string;
  concluido: boolean;
  dataInicio: Date;
  dataFim: Date;
}

export default function ModoJogo() {
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const [totalRecompensas, setTotalRecompensas] = useState(0);
  const soundManager = getSoundManager();

  useEffect(() => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const fimHoje = new Date(hoje);
    fimHoje.setDate(fimHoje.getDate() + 1);

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 7);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    const desafiosIniciais: Desafio[] = [
      {
        id: 'diario_1',
        nome: 'Gol Diário',
        descricao: 'Marque 5 gols hoje',
        tipo: 'diario',
        meta: 5,
        progresso: 3,
        recompensa: 50,
        emoji: '⚽',
        concluido: false,
        dataInicio: hoje,
        dataFim: fimHoje,
      },
      {
        id: 'diario_2',
        nome: 'Pontos Diários',
        descricao: 'Ganhe 100 pontos hoje',
        tipo: 'diario',
        meta: 100,
        progresso: 75,
        recompensa: 75,
        emoji: '💎',
        concluido: false,
        dataInicio: hoje,
        dataFim: fimHoje,
      },
      {
        id: 'semanal_1',
        nome: 'Semana de Gols',
        descricao: 'Marque 30 gols esta semana',
        tipo: 'semanal',
        meta: 30,
        progresso: 18,
        recompensa: 200,
        emoji: '🔥',
        concluido: false,
        dataInicio: inicioSemana,
        dataFim: fimSemana,
      },
      {
        id: 'semanal_2',
        nome: 'Streak Semanal',
        descricao: 'Atinja 10 vitórias consecutivas',
        tipo: 'semanal',
        meta: 10,
        progresso: 7,
        recompensa: 250,
        emoji: '⛓️',
        concluido: false,
        dataInicio: inicioSemana,
        dataFim: fimSemana,
      },
      {
        id: 'mensal_1',
        nome: 'Campeão do Mês',
        descricao: 'Marque 100 gols este mês',
        tipo: 'mensal',
        meta: 100,
        progresso: 47,
        recompensa: 500,
        emoji: '👑',
        concluido: false,
        dataInicio: inicioMes,
        dataFim: fimMes,
      },
      {
        id: 'mensal_2',
        nome: 'Pontuação Mensal',
        descricao: 'Ganhe 1000 pontos este mês',
        tipo: 'mensal',
        meta: 1000,
        progresso: 650,
        recompensa: 750,
        emoji: '💰',
        concluido: false,
        dataInicio: inicioMes,
        dataFim: fimMes,
      },
    ];

    const dadosSalvos = localStorage.getItem('desafios');
    if (dadosSalvos) {
      setDesafios(JSON.parse(dadosSalvos));
    } else {
      setDesafios(desafiosIniciais);
      localStorage.setItem('desafios', JSON.stringify(desafiosIniciais));
    }

    const recompensasSalvas = localStorage.getItem('totalRecompensas');
    if (recompensasSalvas) {
      setTotalRecompensas(parseInt(recompensasSalvas));
    }
  }, []);

  const handleConcluirDesafio = (id: string) => {
    const updated = desafios.map(d => {
      if (d.id === id && !d.concluido) {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        setConfetti({ x, y });
        soundManager.playEpicVictory();
        setTotalRecompensas(prev => prev + d.recompensa);
        localStorage.setItem('totalRecompensas', String(totalRecompensas + d.recompensa));

        return {
          ...d,
          concluido: true,
          progresso: d.meta,
        };
      }
      return d;
    });

    setDesafios(updated);
    localStorage.setItem('desafios', JSON.stringify(updated));
    setTimeout(() => setConfetti(null), 3000);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      diario: '📅 Diário',
      semanal: '📆 Semanal',
      mensal: '📊 Mensal',
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      diario: 'bg-blue-500',
      semanal: 'bg-purple-500',
      mensal: 'bg-orange-500',
    };
    return colors[tipo] || 'bg-gray-500';
  };

  const desafiosConcluidos = desafios.filter(d => d.concluido).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {confetti && (
        <ConfettiExplosion
          x={confetti.x}
          y={confetti.y}
          intensity={120}
          duration={3000}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">🎮 Modo de Jogo</h1>
          </div>
          <p className="text-gray-400">Complete desafios e ganhe recompensas</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Desafios Concluídos</p>
                <p className="text-4xl font-bold text-green-400">
                  {desafiosConcluidos}/{desafios.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Recompensas Ganhas</p>
                <p className="text-4xl font-bold text-yellow-400">{totalRecompensas}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Taxa de Conclusão</p>
                <p className="text-4xl font-bold text-purple-400">
                  {Math.round((desafiosConcluidos / desafios.length) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desafios por Tipo */}
        {['diario', 'semanal', 'mensal'].map(tipo => (
          <div key={tipo} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {getTipoLabel(tipo)}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {desafios
                .filter(d => d.tipo === tipo)
                .map(desafio => (
                  <Card
                    key={desafio.id}
                    className={`border-2 transition ${
                      desafio.concluido
                        ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-600'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{desafio.emoji}</span>
                          <div>
                            <h3 className="font-bold text-white text-lg">{desafio.nome}</h3>
                            <p className="text-sm text-gray-400">{desafio.descricao}</p>
                          </div>
                        </div>
                        <Badge className={`${getTipoColor(desafio.tipo)} text-white`}>
                          +{desafio.recompensa}
                        </Badge>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs text-gray-400">Progresso</span>
                          <span className="text-xs font-semibold text-gray-300">
                            {desafio.progresso}/{desafio.meta}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              desafio.concluido
                                ? 'bg-gradient-to-r from-green-400 to-green-600'
                                : 'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}
                            style={{
                              width: `${Math.min((desafio.progresso / desafio.meta) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Botão */}
                      <Button
                        onClick={() => handleConcluirDesafio(desafio.id)}
                        disabled={desafio.concluido}
                        className={`w-full ${
                          desafio.concluido
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {desafio.concluido ? '✓ Concluído' : 'Concluir Desafio'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}

        {/* Dicas */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-blue-300 text-sm">
              💡 Dica: Complete desafios para ganhar recompensas! Quanto mais desafios completar, mais pontos você ganha! 🎯
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
