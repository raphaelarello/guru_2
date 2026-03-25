"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Trophy, Search, TrendingUp, ArrowUp, ArrowDown,
  BarChart3, Users, Award, Flame, AlertTriangle
} from "lucide-react";

export default function Artilheiros() {
  const [buscaNome, setBuscaNome] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Query de artilheiros do dia
  const { data: destaquesData, isLoading } = trpc.destaques.artilheiros.useQuery({
    date: new Date().toISOString().split('T')[0]
  });

  // Extrair dados de artilheiros e indisciplinados
  const artilheiros = useMemo(() => {
    if (!destaquesData?.topGols) return [];
    return destaquesData.topGols.slice(0, 20);
  }, [destaquesData]);

  const indisciplinados = useMemo(() => {
    if (!destaquesData?.topCartoes) return [];
    return destaquesData.topCartoes.slice(0, 20);
  }, [destaquesData]);

  // Filtrar artilheiros por nome
  const artilheirosFiltrados = useMemo(() => {
    if (!buscaNome.trim()) return artilheiros;
    const busca = buscaNome.toLowerCase();
    return artilheiros.filter(p =>
      p.playerName?.toLowerCase().includes(busca) ||
      p.teamName?.toLowerCase().includes(busca)
    );
  }, [artilheiros, buscaNome]);

  // Filtrar indisciplinados por nome
  const indisciplinadosFiltrados = useMemo(() => {
    if (!buscaNome.trim()) return indisciplinados;
    const busca = buscaNome.toLowerCase();
    return indisciplinados.filter(p =>
      p.playerName?.toLowerCase().includes(busca) ||
      p.teamName?.toLowerCase().includes(busca)
    );
  }, [indisciplinados, buscaNome]);

  // Card de artilheiro
  const ArtilheiroCard = ({ player, index }: { player: any; index: number }) => {
    const estaAcimaMedia = player.acimaDaMedia;

    return (
      <div
        onClick={() => setSelectedPlayer({ ...player, tipo: 'artilheiro' })}
        className="group relative bg-gradient-to-br from-amber-900/30 to-slate-900/40 border border-amber-700/40 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/20 hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:via-yellow-500/5 group-hover:to-yellow-500/0 transition-all duration-300" />

        <div className="relative z-10">
          {/* Header com ranking */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                index === 0 ? "bg-yellow-500 text-black" :
                index === 1 ? "bg-gray-400 text-black" :
                index === 2 ? "bg-amber-700 text-white" :
                "bg-slate-700 text-white"
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
                index === 0 ? "bg-red-600 text-white" :
                index === 1 ? "bg-red-500 text-white" :
                index === 2 ? "bg-red-400 text-white" :
                "bg-slate-700 text-white"
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
              <p className="text-lg font-bold text-yellow-500">{player.amarelos || 0}</p>
              <p className="text-xs text-gray-600">Amarelos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{player.vermelhos || 0}</p>
              <p className="text-xs text-gray-600">Vermelhos</p>
            </div>
          </div>

          {/* Barra de risco */}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 pb-32">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Artilheiros & Indisciplinados</h1>
        </div>
        <p className="text-sm text-gray-400">
          Análise completa de artilheiros e jogadores indisciplinados de hoje
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar jogador ou time..."
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700/50"
          />
        </div>
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

      {/* Modal de Detalhes - Artilheiro */}
      <Dialog open={!!selectedPlayer && selectedPlayer.tipo === 'artilheiro'} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              {selectedPlayer?.playerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
              {selectedPlayer?.playerPhoto && (
                <img
                  src={selectedPlayer.playerPhoto}
                  alt={selectedPlayer.playerName}
                  className="w-16 h-16 rounded-full object-cover border border-yellow-500/30"
                />
              )}
              <div>
                <p className="text-white font-semibold">{selectedPlayer?.playerName}</p>
                <p className="text-gray-400 text-sm">{selectedPlayer?.teamName}</p>
                <p className="text-gray-500 text-xs mt-1">Liga: {selectedPlayer?.leagueName}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Gols</p>
                <p className="text-3xl font-bold text-yellow-400">{selectedPlayer?.gols}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Eficiência</p>
                <p className="text-3xl font-bold text-blue-400">{selectedPlayer?.eficiencia?.toFixed(1) || "0"}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Percentil</p>
                <p className="text-3xl font-bold text-green-400">{selectedPlayer?.percentilLiga}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-2">Assistências</p>
                <p className="text-2xl font-bold text-blue-400">{selectedPlayer?.assistencias || 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-2">Consistência</p>
                <p className="text-2xl font-bold text-purple-400">{selectedPlayer?.consistencia || 0}%</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-2">Comparação com Média da Liga</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (selectedPlayer?.gols / (selectedPlayer?.mediaLiga || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  {((selectedPlayer?.gols / (selectedPlayer?.mediaLiga || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Média da liga: {selectedPlayer?.mediaLiga?.toFixed(1) || "0"} gols
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes - Indisciplinado */}
      <Dialog open={!!selectedPlayer && selectedPlayer.tipo === 'indisciplinado'} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {selectedPlayer?.playerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
              {selectedPlayer?.playerPhoto && (
                <img
                  src={selectedPlayer.playerPhoto}
                  alt={selectedPlayer.playerName}
                  className="w-16 h-16 rounded-full object-cover border border-red-500/30"
                />
              )}
              <div>
                <p className="text-white font-semibold">{selectedPlayer?.playerName}</p>
                <p className="text-gray-400 text-sm">{selectedPlayer?.teamName}</p>
                <p className="text-gray-500 text-xs mt-1">Liga: {selectedPlayer?.leagueName}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Cartões</p>
                <p className="text-3xl font-bold text-red-400">{selectedPlayer?.cartoes || 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Amarelos</p>
                <p className="text-3xl font-bold text-yellow-500">{selectedPlayer?.amarelos || 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Vermelhos</p>
                <p className="text-3xl font-bold text-red-600">{selectedPlayer?.vermelhos || 0}</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-2">Nível de Risco</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (selectedPlayer?.cartoes / 10) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  {Math.min(100, (selectedPlayer?.cartoes / 10) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
