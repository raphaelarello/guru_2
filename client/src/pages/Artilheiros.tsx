'use client';

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExportarRelatorio } from "@/components/ExportarRelatorio";
import { useInterval } from "@/hooks/useInterval";
import {
  Trophy, Search, TrendingUp, ArrowUp, ArrowDown,
  BarChart3, Users, Award, Flame, AlertTriangle, Settings, X, Zap
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, ComposedChart
} from "recharts";

export default function Artilheiros() {
  const [buscaNome, setBuscaNome] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // Filtros avançados
  const [filtroLiga, setFiltroLiga] = useState<string>("todas");
  const [filtroTime, setFiltroTime] = useState<string>("todos");
  const [filtroGolsMin, setFiltroGolsMin] = useState(0);
  const [filtroGolsMax, setFiltroGolsMax] = useState(25);
  const [ordenacao, setOrdenacao] = useState<"gols" | "assistencias" | "eficiencia" | "consistencia">("gols");
  const [showFiltros, setShowFiltros] = useState(false);

  // Estado para controlar atualização automática
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dataAtual] = useState(() => new Date().toISOString().split('T')[0]);

  // Query de artilheiros do dia
  const { data: destaquesData, isLoading, refetch } = trpc.destaques.artilheiros.useQuery({
    date: dataAtual
  });

  // Atualização automática a cada 30 segundos
  useInterval(() => {
    if (autoRefresh && !isLoading) {
      console.log("[Artilheiros] Atualizando dados...");
      refetch();
      setLastUpdate(new Date());
    }
  }, autoRefresh ? 30000 : null);

  // Extrair dados de artilheiros e indisciplinados
  const artilheiros = useMemo(() => {
    if (!destaquesData?.topGols) return [];
    return destaquesData.topGols.slice(0, 20);
  }, [destaquesData]);

  const indisciplinados = useMemo(() => {
    if (!destaquesData?.topCartoes) return [];
    return destaquesData.topCartoes.slice(0, 20);
  }, [destaquesData]);

  // Obter ligas e times únicos para filtros
  const ligas = useMemo(() => {
    const set = new Set(artilheiros.map(p => p.leagueName));
    return Array.from(set).sort();
  }, [artilheiros]);

  const times = useMemo(() => {
    const set = new Set(artilheiros.map(p => p.teamName));
    return Array.from(set).sort();
  }, [artilheiros]);

  // Aplicar filtros
  const artilheirosFiltrados = useMemo(() => {
    let filtered = artilheiros;

    // Filtro por nome
    if (buscaNome) {
      filtered = filtered.filter(p =>
        p.playerName.toLowerCase().includes(buscaNome.toLowerCase()) ||
        p.teamName.toLowerCase().includes(buscaNome.toLowerCase())
      );
    }

    // Filtro por liga
    if (filtroLiga !== "todas") {
      filtered = filtered.filter(p => p.leagueName === filtroLiga);
    }

    // Filtro por time
    if (filtroTime !== "todos") {
      filtered = filtered.filter(p => p.teamName === filtroTime);
    }

    // Filtro por faixa de gols
    filtered = filtered.filter(p => p.gols >= filtroGolsMin && p.gols <= filtroGolsMax);

    // Ordenação
    filtered.sort((a, b) => {
      switch (ordenacao) {
        case "gols":
          return b.gols - a.gols;
        case "assistencias":
          return (b.assistencias || 0) - (a.assistencias || 0);
        case "eficiencia":
          return (b.eficiencia || 0) - (a.eficiencia || 0);
        case "consistencia":
          return (b.consistencia || 0) - (a.consistencia || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [artilheiros, buscaNome, filtroLiga, filtroTime, filtroGolsMin, filtroGolsMax, ordenacao]);

  const indisciplinadosFiltrados = useMemo(() => {
    let filtered = indisciplinados;

    if (buscaNome) {
      filtered = filtered.filter(p =>
        p.playerName.toLowerCase().includes(buscaNome.toLowerCase()) ||
        p.teamName.toLowerCase().includes(buscaNome.toLowerCase())
      );
    }

    if (filtroLiga !== "todas") {
      filtered = filtered.filter(p => p.leagueName === filtroLiga);
    }

    if (filtroTime !== "todos") {
      filtered = filtered.filter(p => p.teamName === filtroTime);
    }

    return filtered.sort((a, b) => (b.cartoes || 0) - (a.cartoes || 0));
  }, [indisciplinados, buscaNome, filtroLiga, filtroTime]);

  // Card de artilheiro
  const ArtilheiroCard = ({ player, index }: { player: any; index: number }) => {
    const estaAcimaMedia = player.acimaDaMedia;
    
    return (
      <div
        onClick={() => setSelectedPlayer({ ...player, tipo: 'artilheiro' })}
        className="group relative bg-gradient-to-br from-yellow-900/30 to-slate-900/40 border border-yellow-700/40 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/20 hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:via-yellow-500/5 group-hover:to-yellow-500/0 transition-all duration-300" />

        <div className="relative z-10">
          {/* Header com ranking */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                index === 0 ? "bg-yellow-600 text-white" :
                index === 1 ? "bg-gray-400 text-white" :
                index === 2 ? "bg-orange-600 text-white" :
                "bg-slate-700 text-gray-300"
              }`}>
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
              </div>
              {player.playerPhoto && (
                <img
                  src={player.playerPhoto}
                  alt={player.playerName}
                  className="w-10 h-10 rounded-full object-cover border border-yellow-500/30"
                />
              )}
            </div>
            <Badge className={`${estaAcimaMedia ? "bg-green-500/30 border-green-500 text-green-300" : "bg-gray-500/30 border-gray-500 text-gray-300"}`}>
              {estaAcimaMedia ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {player.percentilLiga}%
            </Badge>
          </div>

          {/* Nome e time */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-white truncate">{player.playerName}</p>
            <div className="flex items-center gap-1 mt-1">
              {player.teamLogo && (
                <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain" />
              )}
              <p className="text-xs text-gray-500 truncate">{player.teamName}</p>
            </div>
          </div>

          {/* Estatísticas principais */}
          <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-slate-700/30">
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-400">{player.gols}</p>
              <p className="text-xs text-gray-600">Gols</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{player.assistencias || 0}</p>
              <p className="text-xs text-gray-600">Assist.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{player.eficiencia?.toFixed(1) || "0"}%</p>
              <p className="text-xs text-gray-600">Efic.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-400">{player.consistencia || 0}%</p>
              <p className="text-xs text-gray-600">Consist.</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (player.gols / 15) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Card de indisciplinado
  const IndisciplinadoCard = ({ player, index }: { player: any; index: number }) => {
    return (
      <div
        onClick={() => setSelectedPlayer({ ...player, tipo: 'indisciplinado' })}
        className="group relative bg-gradient-to-br from-red-900/30 to-slate-900/40 border border-red-700/40 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:via-red-500/5 group-hover:to-red-500/0 transition-all duration-300" />

        <div className="relative z-10">
          {/* Header com ranking */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                index === 0 ? "bg-red-600 text-white" : "bg-slate-700 text-gray-300"
              }`}>
                {index + 1}
              </div>
              {player.playerPhoto && (
                <img
                  src={player.playerPhoto}
                  alt={player.playerName}
                  className="w-10 h-10 rounded-full object-cover border border-red-500/30"
                />
              )}
            </div>
            <Badge className="bg-red-500/30 border-red-500 text-red-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Indisciplina
            </Badge>
          </div>

          {/* Nome e time */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-white truncate">{player.playerName}</p>
            <div className="flex items-center gap-1 mt-1">
              {player.teamLogo && (
                <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain" />
              )}
              <p className="text-xs text-gray-500 truncate">{player.teamName}</p>
            </div>
          </div>

          {/* Estatísticas de cartões */}
          <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-slate-700/30">
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{player.cartoes || 0}</p>
              <p className="text-xs text-gray-600">Cartões</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-400">{player.amarelos || 0}</p>
              <p className="text-xs text-gray-600">Amarelos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{player.vermelhos || 0}</p>
              <p className="text-xs text-gray-600">Vermelhos</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-600 to-red-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (player.cartoes / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Artilheiros & Indisciplinados</h1>
              <p className="text-sm text-gray-400 mt-1">Análise completa de artilheiros e jogadores indisciplinados de hoje</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Zap className="w-4 h-4 mr-2" />
              {autoRefresh ? "Atualização Ativa" : "Atualização Pausada"}
            </Button>
            <ExportarRelatorio
              artilheiros={artilheirosFiltrados}
              indisciplinados={indisciplinadosFiltrados}
              data={dataAtual}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Análise completa de artilheiros e jogadores indisciplinados de hoje
          </p>
          <p className="text-xs text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar jogador ou time..."
              value={buscaNome}
              onChange={(e) => setBuscaNome(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50"
            />
          </div>
          <Button
            onClick={() => setShowFiltros(!showFiltros)}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-slate-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Painel de Filtros */}
        {showFiltros && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro Liga */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-2 block">Liga</label>
                <select
                  value={filtroLiga}
                  onChange={(e) => setFiltroLiga(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="todas">Todas as Ligas</option>
                  {ligas.map(liga => (
                    <option key={liga} value={liga}>{liga}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Time */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-2 block">Time</label>
                <select
                  value={filtroTime}
                  onChange={(e) => setFiltroTime(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="todos">Todos os Times</option>
                  {times.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-2 block">Ordenar por</label>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="gols">Gols</option>
                  <option value="assistencias">Assistências</option>
                  <option value="eficiencia">Eficiência</option>
                  <option value="consistencia">Consistência</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Carregando dados...
        </div>
      ) : (
        <>
          {/* SEÇÃO ARTILHEIROS */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-400 rounded-full" />
              <h2 className="text-2xl font-bold text-white">🏆 Artilheiros</h2>
              <Badge className="bg-yellow-500/20 border-yellow-500 text-yellow-300">
                {artilheirosFiltrados.length} jogadores
              </Badge>
            </div>

            {artilheirosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Nenhum artilheiro encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {artilheirosFiltrados.map((player: any, idx: number) => (
                  <ArtilheiroCard key={player.playerId} player={player} index={idx} />
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO INDISCIPLINADOS */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-red-500 rounded-full" />
              <h2 className="text-2xl font-bold text-white">⚠️ Indisciplinados</h2>
              <Badge className="bg-red-500/20 border-red-500 text-red-300">
                {indisciplinadosFiltrados.length} jogadores
              </Badge>
            </div>

            {indisciplinadosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Nenhum indisciplinado encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {indisciplinadosFiltrados.map((player: any, idx: number) => (
                  <IndisciplinadoCard key={player.playerId} player={player} index={idx} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL ARTILHEIRO COM GRÁFICO DE EVOLUÇÃO */}
      <Dialog open={!!selectedPlayer && selectedPlayer.tipo === 'artilheiro'} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              {selectedPlayer?.playerName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPlayer(null)}>
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-6">
              {/* Info do jogador */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Gols</p>
                  <p className="text-2xl font-bold text-yellow-400">{selectedPlayer.gols}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Assistências</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedPlayer.assistencias || 0}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Eficiência</p>
                  <p className="text-2xl font-bold text-green-400">{selectedPlayer.eficiencia?.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Consistência</p>
                  <p className="text-2xl font-bold text-purple-400">{selectedPlayer.consistencia}%</p>
                </div>
              </div>

              {/* Gráfico de Evolução */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4">Evolução dos Últimos 5 Jogos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedPlayer.historicoGols.map((gol: number, idx: number) => ({
                    jogo: `Jogo ${idx + 1}`,
                    gols: gol,
                    assistencias: selectedPlayer.historicoAssistencias[idx] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="jogo" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="gols" stroke="#fbbf24" strokeWidth={2} />
                    <Line type="monotone" dataKey="assistencias" stroke="#60a5fa" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Comparação com Liga */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4">Comparação com Média da Liga</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-300">{selectedPlayer.playerName}</span>
                      <span className="text-sm font-bold text-yellow-400">{selectedPlayer.gols} gols</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(100, (selectedPlayer.gols / 20) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-300">Média da Liga</span>
                      <span className="text-sm font-bold text-gray-400">{selectedPlayer.mediaLiga} gols</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${Math.min(100, (selectedPlayer.mediaLiga / 20) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Comparação */}
              <Button
                onClick={() => {
                  setSelectedPlayer2(selectedPlayer);
                  setShowComparison(true);
                  setSelectedPlayer(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Comparar com Outro Jogador
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL INDISCIPLINADO */}
      <Dialog open={!!selectedPlayer && selectedPlayer.tipo === 'indisciplinado'} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              {selectedPlayer?.playerName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPlayer(null)}>
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-6">
              {/* Info do jogador */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Total Cartões</p>
                  <p className="text-2xl font-bold text-red-400">{selectedPlayer.cartoes}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Amarelos</p>
                  <p className="text-2xl font-bold text-yellow-400">{selectedPlayer.amarelos || 0}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Vermelhos</p>
                  <p className="text-2xl font-bold text-red-600">{selectedPlayer.vermelhos || 0}</p>
                </div>
              </div>

              {/* Gráfico de Cartões */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4">Histórico de Cartões (Últimos 5 Jogos)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Array.from({ length: 5 }, (_, i) => ({
                    jogo: `Jogo ${i + 1}`,
                    cartoes: Math.floor(Math.random() * 3)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="jogo" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Bar dataKey="cartoes" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE COMPARAÇÃO HEAD-TO-HEAD */}
      <Dialog open={showComparison && !!selectedPlayer2} onOpenChange={() => setShowComparison(false)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Comparação Head-to-Head
            </DialogTitle>
          </DialogHeader>

          {selectedPlayer2 && (
            <div className="space-y-6">
              {/* Seletor de segundo jogador */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Selecione um jogador para comparar:</label>
                <select
                  onChange={(e) => {
                  const player = artilheiros.find(p => p.playerId === parseInt(e.target.value));
                  if (player) setSelectedPlayer(player);
                }}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">-- Selecione um jogador --</option>
                  {artilheiros.map(p => (
                    <option key={p.playerId} value={p.playerId}>{p.playerName} ({p.teamName})</option>
                  ))}
                </select>
              </div>

              {selectedPlayer && (
                <>
                  {/* Comparação Visual */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Jogador 1 */}
                    <div className="bg-gradient-to-br from-yellow-900/30 to-slate-900/40 border border-yellow-700/40 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        {selectedPlayer2.playerPhoto && (
                          <img src={selectedPlayer2.playerPhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-white">{selectedPlayer2.playerName}</p>
                          <p className="text-xs text-gray-400">{selectedPlayer2.teamName}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div><p className="text-sm text-gray-300">Gols: <span className="font-bold text-yellow-400">{selectedPlayer2.gols}</span></p></div>
                        <div><p className="text-sm text-gray-300">Assist.: <span className="font-bold text-blue-400">{selectedPlayer2.assistencias}</span></p></div>
                        <div><p className="text-sm text-gray-300">Eficiência: <span className="font-bold text-green-400">{selectedPlayer2.eficiencia?.toFixed(1)}%</span></p></div>
                      </div>
                    </div>

                    {/* Jogador 2 */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/40 border border-blue-700/40 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        {selectedPlayer.playerPhoto && (
                          <img src={selectedPlayer.playerPhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-white">{selectedPlayer.playerName}</p>
                          <p className="text-xs text-gray-400">{selectedPlayer.teamName}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div><p className="text-sm text-gray-300">Gols: <span className="font-bold text-yellow-400">{selectedPlayer.gols}</span></p></div>
                        <div><p className="text-sm text-gray-300">Assist.: <span className="font-bold text-blue-400">{selectedPlayer.assistencias}</span></p></div>
                        <div><p className="text-sm text-gray-300">Eficiência: <span className="font-bold text-green-400">{selectedPlayer.eficiencia?.toFixed(1)}%</span></p></div>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Comparação */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-4">Comparação de Estatísticas</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        {
                          stat: 'Gols',
                          [selectedPlayer2.playerName]: selectedPlayer2.gols,
                          [selectedPlayer.playerName]: selectedPlayer.gols
                        },
                        {
                          stat: 'Assist.',
                          [selectedPlayer2.playerName]: selectedPlayer2.assistencias || 0,
                          [selectedPlayer.playerName]: selectedPlayer.assistencias || 0
                        },
                        {
                          stat: 'Eficiência',
                          [selectedPlayer2.playerName]: selectedPlayer2.eficiencia || 0,
                          [selectedPlayer.playerName]: selectedPlayer.eficiencia || 0
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="stat" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                          labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend />
                        <Bar dataKey={selectedPlayer2.playerName} fill="#fbbf24" />
                        <Bar dataKey={selectedPlayer.playerName} fill="#60a5fa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
