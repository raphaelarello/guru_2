import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Filter, Heart, Share2, BarChart3 } from 'lucide-react';

interface Jogo {
  id: string;
  minuto: number;
  status: 'ao-vivo' | 'finalizado' | 'proximo';
  casa: {
    nome: string;
    sigla: string;
    gols: number;
    cartoes: number;
    escanteios: number;
    posicao: number;
    ultimos5: string[];
    caracteristica: string;
    favorito: number;
  };
  visitante: {
    nome: string;
    sigla: string;
    gols: number;
    cartoes: number;
    escanteios: number;
    posicao: number;
    ultimos5: string[];
    caracteristica: string;
    favorito: number;
  };
  gols: Array<{
    time: 'casa' | 'visitante';
    jogador: string;
    minuto: number;
  }>;
  competicao: string;
  horario: string;
}

const JOGOS_MOCK: Jogo[] = [
  {
    id: '1',
    minuto: 45,
    status: 'ao-vivo',
    casa: {
      nome: 'Manchester City',
      sigla: 'MCI',
      gols: 2,
      cartoes: 1,
      escanteios: 5,
      posicao: 1,
      ultimos5: ['V', 'V', 'V', 'E', 'V'],
      caracteristica: 'Ataque Matador',
      favorito: 65,
    },
    visitante: {
      nome: 'Liverpool',
      sigla: 'LIV',
      gols: 1,
      cartoes: 0,
      escanteios: 3,
      posicao: 2,
      ultimos5: ['V', 'V', 'E', 'V', 'D'],
      caracteristica: 'Defesa Forte',
      favorito: 35,
    },
    gols: [
      { time: 'casa', jogador: 'Haaland', minuto: 12 },
      { time: 'casa', jogador: 'Foden', minuto: 38 },
      { time: 'visitante', jogador: 'Vinícius', minuto: 42 },
    ],
    competicao: 'Premier League',
    horario: '15:00',
  },
  {
    id: '2',
    minuto: 0,
    status: 'proximo',
    casa: {
      nome: 'Real Madrid',
      sigla: 'RMA',
      gols: 0,
      cartoes: 0,
      escanteios: 0,
      posicao: 1,
      ultimos5: ['V', 'V', 'V', 'V', 'E'],
      caracteristica: 'Equilíbrio Tático',
      favorito: 72,
    },
    visitante: {
      nome: 'Barcelona',
      sigla: 'FCB',
      gols: 0,
      cartoes: 0,
      escanteios: 0,
      posicao: 2,
      ultimos5: ['V', 'V', 'D', 'V', 'V'],
      caracteristica: 'Posse de Bola',
      favorito: 28,
    },
    gols: [],
    competicao: 'La Liga',
    horario: '20:45',
  },
  {
    id: '3',
    minuto: 90,
    status: 'finalizado',
    casa: {
      nome: 'PSG',
      sigla: 'PSG',
      gols: 3,
      cartoes: 2,
      escanteios: 8,
      posicao: 1,
      ultimos5: ['V', 'V', 'V', 'E', 'V'],
      caracteristica: 'Ataque Matador',
      favorito: 68,
    },
    visitante: {
      nome: 'Marseille',
      sigla: 'OM',
      gols: 2,
      cartoes: 1,
      escanteios: 4,
      posicao: 3,
      ultimos5: ['V', 'E', 'V', 'D', 'V'],
      caracteristica: 'Retranqueiro',
      favorito: 32,
    },
    gols: [
      { time: 'casa', jogador: 'Mbappé', minuto: 15 },
      { time: 'visitante', jogador: 'Payet', minuto: 28 },
      { time: 'casa', jogador: 'Neymar', minuto: 52 },
      { time: 'casa', jogador: 'Cavani', minuto: 78 },
      { time: 'visitante', jogador: 'Benedetto', minuto: 85 },
    ],
    competicao: 'Ligue 1',
    horario: '20:00',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ao-vivo':
      return 'bg-green-500/20 border-green-500/50';
    case 'finalizado':
      return 'bg-gray-500/20 border-gray-500/50';
    case 'proximo':
      return 'bg-blue-500/20 border-blue-500/50';
    default:
      return 'bg-gray-500/20 border-gray-500/50';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ao-vivo':
      return 'AO VIVO';
    case 'finalizado':
      return 'FINALIZADO';
    case 'proximo':
      return 'PRÓXIMO';
    default:
      return status;
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'ao-vivo':
      return 'bg-green-500 text-white';
    case 'finalizado':
      return 'bg-gray-500 text-white';
    case 'proximo':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getResultadoColor = (resultado: string) => {
  switch (resultado) {
    case 'V':
      return 'text-green-400 bg-green-500/20';
    case 'E':
      return 'text-yellow-400 bg-yellow-500/20';
    case 'D':
      return 'text-red-400 bg-red-500/20';
    default:
      return 'text-gray-400 bg-gray-500/20';
  }
};

export default function PainelSofaScore() {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ao-vivo' | 'finalizado' | 'proximo'>('todos');
  const [jogoSelecionado, setJogoSelecionado] = useState<string>('1');
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  const jogosFiltrados = useMemo(() => {
    return JOGOS_MOCK.filter((jogo) => {
      if (filtroStatus === 'todos') return true;
      return jogo.status === filtroStatus;
    });
  }, [filtroStatus]);

  const jogoAtual = JOGOS_MOCK.find((j) => j.id === jogoSelecionado) || JOGOS_MOCK[0];

  const toggleFavorito = (id: string) => {
    const novo = new Set(favoritos);
    if (novo.has(id)) {
      novo.delete(id);
    } else {
      novo.add(id);
    }
    setFavoritos(novo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header com Filtros */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-green-400">⚽</span> RaphaGuru
            </h1>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                <Calendar className="w-5 h-5 text-slate-300" />
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                <Filter className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Botões de Filtro */}
          <div className="flex gap-2">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'ao-vivo', label: '🔴 Ao Vivo' },
              { id: 'finalizado', label: '✓ Finalizado' },
              { id: 'proximo', label: '⏱ Próximo' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFiltroStatus(btn.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtroStatus === btn.id
                    ? 'bg-green-500/30 border border-green-500 text-green-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Sidebar Esquerda - Grid de Jogos */}
        <div className="w-80 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          {jogosFiltrados.map((jogo) => (
            <button
              key={jogo.id}
              onClick={() => setJogoSelecionado(jogo.id)}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                jogoSelecionado === jogo.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusBadgeColor(jogo.status)}`}>
                  {getStatusLabel(jogo.status)}
                </span>
                {jogo.status === 'ao-vivo' && <span className="text-xs text-green-400 font-bold">{jogo.minuto}'</span>}
              </div>

              <div className="text-sm font-bold text-white mb-2">{jogo.competicao}</div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs text-slate-400">{jogo.casa.sigla}</div>
                  <div className="text-lg font-bold text-white">{jogo.casa.gols}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">vs</div>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs text-slate-400">{jogo.visitante.sigla}</div>
                  <div className="text-lg font-bold text-white">{jogo.visitante.gols}</div>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-400">{jogo.horario}</div>
            </button>
          ))}
        </div>

        {/* Conteúdo Principal - Jogo Selecionado */}
        <div className="flex-1">
          {/* Card Principal do Jogo */}
          <div className={`p-8 rounded-xl border-2 ${getStatusColor(jogoAtual.status)} bg-slate-900/50 mb-6`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">{jogoAtual.competicao}</div>
                <div className={`text-sm font-bold px-3 py-1 rounded w-fit ${getStatusBadgeColor(jogoAtual.status)}`}>
                  {getStatusLabel(jogoAtual.status)}
                  {jogoAtual.status === 'ao-vivo' && <span className="ml-2">{jogoAtual.minuto}'</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFavorito(jogoAtual.id)}
                  className={`p-2 rounded-lg transition ${
                    favoritos.has(jogoAtual.id) ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:text-red-400'
                  }`}
                >
                  <Heart className="w-5 h-5" fill={favoritos.has(jogoAtual.id) ? 'currentColor' : 'none'} />
                </button>
                <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Placar Principal */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              {/* Casa */}
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">{jogoAtual.casa.nome}</div>
                <div className="text-6xl font-bold text-white mb-4">{jogoAtual.casa.gols}</div>

                {/* Últimos 5 Jogos */}
                <div className="flex justify-center gap-1 mb-3">
                  {jogoAtual.casa.ultimos5.map((resultado, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${getResultadoColor(resultado)}`}
                    >
                      {resultado}
                    </div>
                  ))}
                </div>

                {/* Posição e Característica */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400">
                    <span className="text-green-400 font-bold">{jogoAtual.casa.posicao}º</span> na tabela
                  </div>
                  <div className="text-slate-300 font-medium">{jogoAtual.casa.caracteristica}</div>
                </div>
              </div>

              {/* Barra de Favorito */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm text-slate-400 mb-4">Favorito</div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-500"
                    style={{ width: `${jogoAtual.casa.favorito}%` }}
                  />
                </div>
                <div className="text-sm font-bold text-white">
                  {jogoAtual.casa.favorito}% - {jogoAtual.visitante.favorito}%
                </div>
              </div>

              {/* Visitante */}
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">{jogoAtual.visitante.nome}</div>
                <div className="text-6xl font-bold text-white mb-4">{jogoAtual.visitante.gols}</div>

                {/* Últimos 5 Jogos */}
                <div className="flex justify-center gap-1 mb-3">
                  {jogoAtual.visitante.ultimos5.map((resultado, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${getResultadoColor(resultado)}`}
                    >
                      {resultado}
                    </div>
                  ))}
                </div>

                {/* Posição e Característica */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400">
                    <span className="text-green-400 font-bold">{jogoAtual.visitante.posicao}º</span> na tabela
                  </div>
                  <div className="text-slate-300 font-medium">{jogoAtual.visitante.caracteristica}</div>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">{jogoAtual.casa.cartoes}</div>
                <div className="text-xs text-slate-400">Cartões</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{jogoAtual.casa.escanteios}</div>
                <div className="text-xs text-slate-400">Escanteios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-300 mb-1">{jogoAtual.visitante.cartoes}</div>
                <div className="text-xs text-slate-400">Cartões</div>
              </div>
            </div>
          </div>

          {/* Gols Marcados */}
          {jogoAtual.gols.length > 0 && (
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>⚽</span> Gols Marcados
              </h3>
              <div className="space-y-3">
                {jogoAtual.gols.map((gol, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold px-2 py-1 rounded ${gol.time === 'casa' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                        {gol.time === 'casa' ? jogoAtual.casa.sigla : jogoAtual.visitante.sigla}
                      </span>
                      <span className="text-white font-medium">{gol.jogador}</span>
                    </div>
                    <span className="text-slate-400 text-sm">{gol.minuto}'</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
