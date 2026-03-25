"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { LIGAS } from "@shared/ligas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Search, TrendingUp, Zap, Target, ArrowUp, ArrowDown,
  BarChart3, Calendar, Users, Award, Flame, Percent
} from "lucide-react";

const TEMPORADA_ATUAL = 2024;

export default function Artilheiros() {
  const [ligaSelecionada, setLigaSelecionada] = useState<number>(71);
  const [temporada, setTemporada] = useState(TEMPORADA_ATUAL);
  const [buscaNome, setBuscaNome] = useState("");
  const [ordenacao, setOrdenacao] = useState<"gols" | "media" | "consistencia" | "forma">("gols");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const ligaAtual = LIGAS[ligaSelecionada];
  const ligas = Object.values(LIGAS).sort((a: any, b: any) => {
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return 1;
    return a.nome.localeCompare(b.nome);
  });

  // Query de artilheiros
  const { data: artilheiros, isLoading } = trpc.ligasRouter.artilheiros.useQuery(
    { ligaId: ligaSelecionada, season: temporada },
    { enabled: !!ligaSelecionada }
  );

  // Calcular estatísticas da liga
  const estatisticasLiga = useMemo(() => {
    if (!artilheiros || artilheiros.length === 0) {
      return {
        mediaGols: 0,
        medianGols: 0,
        maxGols: 0,
        minGols: 0,
        desvio: 0,
      };
    }

    const gols = artilheiros.map((p: any) => p.gols || 0);
    const media = gols.reduce((a: number, b: number) => a + b, 0) / gols.length;
    const sorted = [...gols].sort((a: number, b: number) => a - b);
    const mediana = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const desvio = Math.sqrt(
      gols.reduce((sum: number, g: number) => sum + Math.pow(g - media, 2), 0) / gols.length
    );

    return {
      mediaGols: media,
      medianGols: mediana,
      maxGols: Math.max(...gols),
      minGols: Math.min(...gols),
      desvio,
    };
  }, [artilheiros]);

  // Filtrar e ordenar artilheiros
  const artilheirosFiltrados = useMemo(() => {
    let resultado = artilheiros || [];

    // Filtrar por nome
    if (buscaNome.trim()) {
      const busca = buscaNome.toLowerCase();
      resultado = resultado.filter((p: any) =>
        p.nome?.toLowerCase().includes(busca) ||
        p.time?.toLowerCase().includes(busca)
      );
    }

    // Calcular métricas adicionais
    resultado = resultado.map((p: any): any => {
      const gols = p.gols || 0;
      const media = estatisticasLiga.mediaGols;
      const desvio = estatisticasLiga.desvio;

      // Percentil (0-100)
      const percentil = artilheiros
        ? Math.round(
            ((artilheiros.filter((a: any) => (a.gols || 0) <= gols).length) /
              artilheiros.length) *
              100
          )
        : 0;

      // Forma (últimos 5 jogos - simulado)
      const forma = Math.max(0, Math.min(5, Math.floor(gols / 3)));

      // Consistência (desvio padrão normalizado)
      const consistencia = desvio > 0 ? Math.max(0, 100 - (desvio / media) * 50) : 100;

      // Score de eficiência
      const eficiencia = gols > 0 && p.jogos ? ((gols / p.jogos) * 100).toFixed(1) : "0";

      return {
        ...p,
        percentil,
        forma,
        consistencia: Math.round(consistencia),
        eficiencia,
      };
    });

    // Ordenar
    switch (ordenacao) {
      case "media":
        resultado.sort((a: any, b: any) => {
          const mediaA = a.gols / (a.jogos || 1);
          const mediaB = b.gols / (b.jogos || 1);
          return mediaB - mediaA;
        });
        break;
      case "consistencia":
        resultado.sort((a: any, b: any) => b.consistencia - a.consistencia);
        break;
      case "forma":
        resultado.sort((a: any, b: any) => b.forma - a.forma);
        break;
      case "gols":
      default:
        resultado.sort((a: any, b: any) => (b.gols || 0) - (a.gols || 0));
    }

    return resultado;
  }, [artilheiros, buscaNome, ordenacao, estatisticasLiga]);

  // Card de artilheiro
  const ArtilheiroCard = ({ player, index }: { player: any; index: number }) => {
    const gols = player.gols || 0;
    const media = estatisticasLiga.mediaGols;
    const percentualMedia = media > 0 ? ((gols / media) * 100).toFixed(0) : "0";
    const estaAcimaMedia = gols > media;

    return (
      <div
        onClick={() => setSelectedPlayer(player)}
        className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/20 hover:-translate-y-1 backdrop-blur-sm overflow-hidden"
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
              {player.foto && (
                <img
                  src={player.foto}
                  alt={player.nome}
                  className="w-10 h-10 rounded-full object-cover border border-yellow-500/30"
                />
              )}
            </div>
            <Badge className={`${estaAcimaMedia ? "bg-green-500/30 border-green-500 text-green-300" : "bg-gray-500/30 border-gray-500 text-gray-300"}`}>
              {estaAcimaMedia ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {percentualMedia}% média
            </Badge>
          </div>

          {/* Nome e time */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-white truncate">{player.nome}</p>
            <div className="flex items-center gap-1 mt-1">
              {player.timeLogo && (
                <img src={player.timeLogo} alt="" className="w-4 h-4 object-contain" />
              )}
              <p className="text-xs text-gray-500 truncate">{player.time}</p>
            </div>
          </div>

          {/* Estatísticas principais */}
          <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-slate-700/30">
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-400">{gols}</p>
              <p className="text-xs text-gray-600">Gols</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{player.assistencias || 0}</p>
              <p className="text-xs text-gray-600">Assist.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{player.eficiencia}%</p>
              <p className="text-xs text-gray-600">Efic.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-400">{player.percentil}%</p>
              <p className="text-xs text-gray-600">Percentil</p>
            </div>
          </div>

          {/* Indicadores de forma e consistência */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Forma</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < player.forma ? "bg-red-500" : "bg-slate-700/50"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Consistência</span>
              <span className="text-xs font-semibold text-white">{player.consistencia}%</span>
            </div>
            <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${player.consistencia}%` }}
              />
            </div>
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
          <h1 className="text-3xl font-bold text-white">Artilheiros</h1>
        </div>
        <p className="text-sm text-gray-400">
          {artilheirosFiltrados.length} artilheiros • Liga: {ligaAtual?.nome} • Temporada {temporada}
        </p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-semibold">Liga</label>
          <Select value={String(ligaSelecionada)} onValueChange={(v) => setLigaSelecionada(Number(v))}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ligas.map((liga: any) => (
                <SelectItem key={liga.id} value={String(liga.id)}>
                  {liga.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-semibold">Temporada</label>
          <Select value={String(temporada)} onValueChange={(v) => setTemporada(Number(v))}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022].map(t => (
                <SelectItem key={t} value={String(t)}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-semibold">Ordenar por</label>
          <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gols">Gols (Total)</SelectItem>
              <SelectItem value="media">Média por Jogo</SelectItem>
              <SelectItem value="consistencia">Consistência</SelectItem>
              <SelectItem value="forma">Forma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-semibold">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Nome ou time..."
              value={buscaNome}
              onChange={(e) => setBuscaNome(e.target.value)}
              className="pl-8 bg-slate-800/50 border-slate-700/50"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas da Liga */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-yellow-900/20 to-slate-900/40 border-yellow-700/30">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Média</p>
              <p className="text-2xl font-bold text-yellow-400">{estatisticasLiga.mediaGols.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border-blue-700/30">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Mediana</p>
              <p className="text-2xl font-bold text-blue-400">{estatisticasLiga.medianGols.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/20 to-slate-900/40 border-green-700/30">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Máximo</p>
              <p className="text-2xl font-bold text-green-400">{estatisticasLiga.maxGols}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/20 to-slate-900/40 border-red-700/30">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Mínimo</p>
              <p className="text-2xl font-bold text-red-400">{estatisticasLiga.minGols}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border-purple-700/30">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Desvio</p>
              <p className="text-2xl font-bold text-purple-400">{estatisticasLiga.desvio.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Artilheiros */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Carregando artilheiros...
        </div>
      ) : artilheirosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Nenhum artilheiro encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {(artilheirosFiltrados as any[]).map((player: any, idx: number) => (
            <ArtilheiroCard key={player.id} player={player} index={idx} />
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              {selectedPlayer?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
              {selectedPlayer?.foto && (
                <img
                  src={selectedPlayer.foto}
                  alt={selectedPlayer.nome}
                  className="w-16 h-16 rounded-full object-cover border border-yellow-500/30"
                />
              )}
              <div>
                <p className="text-white font-semibold">{selectedPlayer?.nome}</p>
                <p className="text-gray-400 text-sm">{selectedPlayer?.time}</p>
                <p className="text-gray-500 text-xs mt-1">Temporada {temporada}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Gols</p>
                <p className="text-3xl font-bold text-yellow-400">{selectedPlayer?.gols}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Média/Jogo</p>
                <p className="text-3xl font-bold text-blue-400">
                  {selectedPlayer?.gols && selectedPlayer?.jogos
                    ? (selectedPlayer.gols / selectedPlayer.jogos).toFixed(2)
                    : "0"}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Percentil</p>
                <p className="text-3xl font-bold text-green-400">{selectedPlayer?.percentil}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-2">Assistências</p>
                <p className="text-2xl font-bold text-blue-400">{selectedPlayer?.assistencias || 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-2">Jogos</p>
                <p className="text-2xl font-bold text-white">{selectedPlayer?.jogos}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-2">Consistência</p>
                <p className="text-2xl font-bold text-purple-400">{selectedPlayer?.consistencia}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-2">Eficiência</p>
                <p className="text-2xl font-bold text-green-400">{selectedPlayer?.eficiencia}%</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-2">Comparação com Média da Liga</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (selectedPlayer?.gols / estatisticasLiga.mediaGols) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  {((selectedPlayer?.gols / estatisticasLiga.mediaGols) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Média da liga: {estatisticasLiga.mediaGols.toFixed(1)} gols
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
