"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Target, TrendingUp, AlertCircle, Users, Award, Flame } from "lucide-react";

export default function Destaques() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedLeague, setSelectedLeague] = useState<string>("todas");
  const [selectedTime, setSelectedTime] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const { data, isLoading } = trpc.destaques.hoje.useQuery({ date: selectedDate });

  // Combinar todos os times destacados
  const allTimes = [
    ...(data?.timesEscanteios || []),
    ...(data?.timesGols || []),
    ...(data?.timesChutes || []),
    ...(data?.timesCartoes || [])
  ];

  // Ligas únicas
  const ligas = Array.from(new Set(allTimes.map((t: any) => t.leagueName)));

  // Filtrar por liga
  const filterByLeague = (times: any[]) => {
    if (selectedLeague === "todas") return times;
    return times.filter((t: any) => t.leagueName === selectedLeague);
  };

  // Card compacto para times
  const TimeCard = ({ time }: { time: any }) => (
    <div
      onClick={() => setSelectedTime(time)}
      className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-lg p-3 cursor-pointer transition-all duration-300 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
    >
      {/* Fundo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:via-green-500/5 group-hover:to-green-500/0 transition-all duration-300" />
      
      <div className="relative z-10">
        {/* Header compacto */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{time.leagueName}</p>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5 truncate">
              <img src={time.teamLogo} alt={time.teamName} className="w-4 h-4 rounded-full flex-shrink-0" />
              <span className="truncate">{time.teamName}</span>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">vs {time.opponent?.substring(0, 12) || "?"}</p>
          </div>
          <Badge className="bg-green-500/30 border-green-500/60 text-green-300 text-xs flex-shrink-0 whitespace-nowrap">
            {time.tipo}
          </Badge>
        </div>

        {/* Indicador com barra */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Indicador</span>
            <span className="text-sm font-bold text-green-400">{time.indicador?.toFixed(1) || 0}</span>
          </div>
          <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (time.indicador || 0) / 2)}%` }}
            />
          </div>
          
          {/* Métricas em grid compacto */}
          <div className="grid grid-cols-2 gap-1.5 text-xs mt-2 pt-1 border-t border-slate-700/30">
            <div className="flex justify-between">
              <span className="text-gray-600">Gols:</span>
              <span className="text-white font-semibold">{time.mediaGols?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forma:</span>
              <span className="text-white font-semibold">{time.forma}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Card compacto para artilheiros
  const ArtilheiroCard = ({ player }: { player: any }) => (
    <div
      onClick={() => setSelectedPlayer(player)}
      className="group relative bg-gradient-to-br from-yellow-900/20 to-slate-900/40 border border-yellow-700/30 rounded-lg p-3 cursor-pointer transition-all duration-300 hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/15 hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:via-yellow-500/5 group-hover:to-yellow-500/0 transition-all duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-2 mb-2">
          <img 
            src={player.playerPhoto || "https://via.placeholder.com/40"} 
            alt={player.playerName} 
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-yellow-500/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{player.playerName}</p>
            <p className="text-xs text-gray-500 truncate">{player.teamName}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Gols</span>
            <span className="text-lg font-bold text-yellow-400">{player.gols || 0}</span>
          </div>
          <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((player.gols || 0) / 20) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 text-xs mt-2 pt-1 border-t border-yellow-700/20">
            <div className="text-center">
              <span className="text-gray-600 block">Média</span>
              <span className="text-white font-semibold">{player.mediaGols?.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="text-gray-600 block">Percentil</span>
              <span className="text-yellow-400 font-semibold">{player.percentil || 0}%</span>
            </div>
            <div className="text-center">
              <span className="text-gray-600 block">Forma</span>
              <span className={`font-semibold ${player.forma === "🔥" ? "text-red-400" : "text-gray-400"}`}>
                {player.forma || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Card compacto para indisciplinados
  const IndisciplinadoCard = ({ player }: { player: any }) => (
    <div className="group relative bg-gradient-to-br from-red-900/20 to-slate-900/40 border border-red-700/30 rounded-lg p-3 cursor-pointer transition-all duration-300 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/15 hover:-translate-y-1 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:via-red-500/5 group-hover:to-red-500/0 transition-all duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-2 mb-2">
          <img 
            src={player.playerPhoto || "https://via.placeholder.com/40"} 
            alt={player.playerName} 
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-red-500/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{player.playerName}</p>
            <p className="text-xs text-gray-500 truncate">{player.teamName}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Cartões</span>
            <span className="text-lg font-bold text-red-400">{player.cartoes || 0}</span>
          </div>
          <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-500 to-red-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((player.cartoes || 0) / 10) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 text-xs mt-2 pt-1 border-t border-red-700/20">
            <div className="text-center">
              <span className="text-gray-600 block text-xs">Amarelos</span>
              <span className="text-yellow-400 font-semibold">{player.amarelos || 0}</span>
            </div>
            <div className="text-center">
              <span className="text-gray-600 block text-xs">Vermelhos</span>
              <span className="text-red-400 font-semibold">{player.vermelhos || 0}</span>
            </div>
            <div className="text-center">
              <span className="text-gray-600 block text-xs">Média</span>
              <span className="text-white font-semibold">{player.mediaCartoes?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 pb-32">
      {/* Header Compacto */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-6 h-6 text-green-400" />
          <h1 className="text-3xl font-bold text-white">Destaques</h1>
        </div>
        <p className="text-sm text-gray-400">
          {data?.totalJogos || 0} jogos • {data?.totalLigas || 0} ligas • {allTimes.length} destaques
        </p>
      </div>

      {/* Filtros Compactos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-semibold">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:border-green-500 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-semibold">Liga</label>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:border-green-500 outline-none transition-colors"
          >
            <option value="todas">Todas as Ligas</option>
            {ligas.map(liga => (
              <option key={liga} value={liga}>{liga}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold h-10 transition-all duration-300"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais - Compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-900/20 to-slate-900/40 border border-green-700/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Destaques</p>
              <p className="text-2xl font-bold text-green-400">{allTimes.length}</p>
            </div>
            <Target className="w-5 h-5 text-green-500/60" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/20 to-slate-900/40 border border-yellow-700/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Gols</p>
              <p className="text-2xl font-bold text-yellow-400">{(data?.timesGols || []).length}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-yellow-500/60" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-blue-700/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Escanteios</p>
              <p className="text-2xl font-bold text-blue-400">{(data?.timesEscanteios || []).length}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-blue-500/60" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border border-purple-700/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Cartões</p>
              <p className="text-2xl font-bold text-purple-400">{(data?.timesCartoes || []).length}</p>
            </div>
            <Flame className="w-5 h-5 text-purple-500/60" />
          </div>
        </div>
      </div>

      {/* Tabs de Destaques */}
      <div className="mb-8">
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/30 border border-slate-700/50 p-1 rounded-lg mb-4 h-auto">
            <TabsTrigger value="todos" className="text-xs py-2">
              Todos <span className="ml-1 text-gray-500">({allTimes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="gols" className="text-xs py-2">
              Gols <span className="ml-1 text-gray-500">({(data?.timesGols || []).length})</span>
            </TabsTrigger>
            <TabsTrigger value="escanteios" className="text-xs py-2">
              Escanteios <span className="ml-1 text-gray-500">({(data?.timesEscanteios || []).length})</span>
            </TabsTrigger>
            <TabsTrigger value="chutes" className="text-xs py-2">
              Chutes <span className="ml-1 text-gray-500">({(data?.timesChutes || []).length})</span>
            </TabsTrigger>
            <TabsTrigger value="cartoes" className="text-xs py-2">
              Cartões <span className="ml-1 text-gray-500">({(data?.timesCartoes || []).length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Todos */}
          <TabsContent value="todos" className="mt-0">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Carregando destaques...</div>
            ) : allTimes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhum destaque disponível</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterByLeague(allTimes).map((time: any, idx: number) => (
                  <TimeCard key={idx} time={time} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Gols */}
          <TabsContent value="gols" className="mt-0">
            {filterByLeague(data?.timesGols || []).length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhum destaque de Gols</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterByLeague(data?.timesGols || []).map((time: any, idx: number) => (
                  <TimeCard key={idx} time={time} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Escanteios */}
          <TabsContent value="escanteios" className="mt-0">
            {filterByLeague(data?.timesEscanteios || []).length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhum destaque de Escanteios</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterByLeague(data?.timesEscanteios || []).map((time: any, idx: number) => (
                  <TimeCard key={idx} time={time} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Chutes */}
          <TabsContent value="chutes" className="mt-0">
            {filterByLeague(data?.timesChutes || []).length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhum destaque de Chutes</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterByLeague(data?.timesChutes || []).map((time: any, idx: number) => (
                  <TimeCard key={idx} time={time} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Cartões */}
          <TabsContent value="cartoes" className="mt-0">
            {filterByLeague(data?.timesCartoes || []).length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhum destaque de Cartões</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterByLeague(data?.timesCartoes || []).map((time: any, idx: number) => (
                  <TimeCard key={idx} time={time} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Seção Artilheiros */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Artilheiros</h2>
          <span className="text-sm text-gray-500 ml-auto">{(data?.jogadoresArtilheiros || []).length} jogadores</span>
        </div>
        {(data?.jogadoresArtilheiros || []).length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhum artilheiro disponível</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(data?.jogadoresArtilheiros || []).slice(0, 12).map((player: any, idx: number) => (
              <ArtilheiroCard key={idx} player={player} />
            ))}
          </div>
        )}
      </div>

      {/* Seção Indisciplinados */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Indisciplinados</h2>
          <span className="text-sm text-gray-500 ml-auto">{(data?.jogadoresIndisciplinados || []).length} jogadores</span>
        </div>
        {(data?.jogadoresIndisciplinados || []).length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhum indisciplinado disponível</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(data?.jogadoresIndisciplinados || []).slice(0, 12).map((player: any, idx: number) => (
              <IndisciplinadoCard key={idx} player={player} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes - Time */}
      <Dialog open={!!selectedTime} onOpenChange={() => setSelectedTime(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {selectedTime?.teamName} - {selectedTime?.tipo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              <img src={selectedTime?.teamLogo} alt={selectedTime?.teamName} className="w-12 h-12 rounded-full" />
              <div>
                <p className="text-white font-semibold">{selectedTime?.teamName}</p>
                <p className="text-gray-400 text-sm">{selectedTime?.leagueName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Indicador</p>
                <p className="text-3xl font-bold text-green-400">{selectedTime?.indicador?.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Tipo</p>
                <Badge className="bg-green-500/20 border-green-500 text-green-400">{selectedTime?.tipo}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-gray-500 text-xs mb-1">Gols/Jogo</p>
                <p className="text-2xl font-bold text-white">{selectedTime?.mediaGols?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Forma</p>
                <p className="text-2xl font-bold text-white">{selectedTime?.forma}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Próximo Jogo</p>
                <p className="text-sm text-white">{selectedTime?.matchTime}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes - Jogador */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {selectedPlayer?.playerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              <img 
                src={selectedPlayer?.playerPhoto || "https://via.placeholder.com/50"} 
                alt={selectedPlayer?.playerName} 
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="text-white font-semibold">{selectedPlayer?.playerName}</p>
                <p className="text-gray-400 text-sm">{selectedPlayer?.teamName}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Gols</p>
                <p className="text-3xl font-bold text-yellow-400">{selectedPlayer?.gols || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Média</p>
                <p className="text-2xl font-bold text-white">{selectedPlayer?.mediaGols?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Percentil</p>
                <p className="text-2xl font-bold text-green-400">{selectedPlayer?.percentil || 0}%</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
