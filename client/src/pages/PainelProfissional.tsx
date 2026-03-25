import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, TrendingUp, AlertCircle, Zap } from "lucide-react";

interface Jogo {
  id: string;
  time1: string;
  time2: string;
  placar1: number;
  placar2: number;
  minuto: number;
  status: "ao-vivo" | "finalizado" | "proximo";
  competicao: string;
  artilheiros: string[];
}

const jogos: Jogo[] = [
  {
    id: "1",
    time1: "Manchester City",
    time2: "Liverpool",
    placar1: 2,
    placar2: 1,
    minuto: 67,
    status: "ao-vivo",
    competicao: "Premier League",
    artilheiros: ["Haaland", "Vinícius"],
  },
  {
    id: "2",
    time1: "Real Madrid",
    time2: "Barcelona",
    placar1: 1,
    placar2: 0,
    minuto: 45,
    status: "ao-vivo",
    competicao: "La Liga",
    artilheiros: ["Vinícius"],
  },
  {
    id: "3",
    time1: "PSG",
    time2: "Marseille",
    placar1: 3,
    placar2: 2,
    minuto: 90,
    status: "finalizado",
    competicao: "Ligue 1",
    artilheiros: ["Mbappé", "Neymar"],
  },
  {
    id: "4",
    time1: "Bayern Munich",
    time2: "Borussia Dortmund",
    placar1: 0,
    placar2: 0,
    minuto: 0,
    status: "proximo",
    competicao: "Bundesliga",
    artilheiros: [],
  },
  {
    id: "5",
    time1: "Juventus",
    time2: "AC Milan",
    placar1: 0,
    placar2: 0,
    minuto: 0,
    status: "proximo",
    competicao: "Serie A",
    artilheiros: [],
  },
  {
    id: "6",
    time1: "Chelsea",
    time2: "Arsenal",
    placar1: 2,
    placar2: 2,
    minuto: 88,
    status: "ao-vivo",
    competicao: "Premier League",
    artilheiros: ["Saka", "Sterling"],
  },
];

export default function PainelProfissional() {
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ao-vivo" | "finalizado" | "proximo">("todos");
  const [busca, setBusca] = useState("");
  const [favoritos, setFavoritos] = useState<string[]>([]);

  const jogosFiltrados = useMemo(() => {
    return jogos.filter((jogo) => {
      const matchStatus = filtroStatus === "todos" || jogo.status === filtroStatus;
      const matchBusca =
        busca === "" ||
        jogo.time1.toLowerCase().includes(busca.toLowerCase()) ||
        jogo.time2.toLowerCase().includes(busca.toLowerCase()) ||
        jogo.competicao.toLowerCase().includes(busca.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [filtroStatus, busca]);

  const toggleFavorito = (id: string) => {
    setFavoritos((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ao-vivo":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "finalizado":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "proximo":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ao-vivo":
        return "🔴 AO VIVO";
      case "finalizado":
        return "✓ FINALIZADO";
      case "proximo":
        return "⏱ PRÓXIMO";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-400" />
            <h1 className="text-2xl font-bold text-white">RaphaGuru</h1>
          </div>

          {/* Busca */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Pesquise times, competições..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Esquerdo */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filtros */}
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Status</h3>
              <div className="space-y-2">
                {[
                  { label: "Todos", value: "todos" },
                  { label: "🔴 Ao Vivo", value: "ao-vivo" },
                  { label: "✓ Finalizado", value: "finalizado" },
                  { label: "⏱ Próximo", value: "proximo" },
                ].map((filtro) => (
                  <Button
                    key={filtro.value}
                    variant={filtroStatus === filtro.value ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFiltroStatus(filtro.value as any)}
                  >
                    {filtro.label}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Stats */}
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Estatísticas</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Jogos Hoje</p>
                  <p className="text-2xl font-bold text-green-400">{jogosFiltrados.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Ao Vivo</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {jogosFiltrados.filter((j) => j.status === "ao-vivo").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Favoritos</p>
                  <p className="text-2xl font-bold text-yellow-400">{favoritos.length}</p>
                </div>
              </div>
            </Card>

            {/* Alertas */}
            <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-yellow-400">Alerta Value Betting</p>
                  <p className="text-xs text-yellow-300/80 mt-1">
                    Haaland marcando gol com odds 2.5 (esperado 1.8)
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { label: "Todos", value: "todos" },
                { label: "Ao Vivo", value: "ao-vivo" },
                { label: "Finalizado", value: "finalizado" },
                { label: "Próximo", value: "proximo" },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={filtroStatus === tab.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroStatus(tab.value as any)}
                  className="whitespace-nowrap"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Grid de Jogos */}
            {jogosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jogosFiltrados.map((jogo) => (
                  <Card
                    key={jogo.id}
                    className="bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer group"
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className={`${getStatusColor(jogo.status)} border`}>
                          {getStatusLabel(jogo.status)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorito(jogo.id)}
                          className="text-slate-400 hover:text-yellow-400"
                        >
                          <Star
                            className="w-4 h-4"
                            fill={favoritos.includes(jogo.id) ? "currentColor" : "none"}
                          />
                        </Button>
                      </div>

                      {/* Competição */}
                      <p className="text-xs text-slate-400 mb-3">{jogo.competicao}</p>

                      {/* Placar */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-white">{jogo.time1}</p>
                          <p className="text-2xl font-bold text-green-400">{jogo.placar1}</p>
                        </div>

                        <div className="px-4 text-center">
                          <p className="text-xs text-slate-400">
                            {jogo.status === "ao-vivo" ? `${jogo.minuto}'` : ""}
                          </p>
                          <p className="text-lg font-bold text-slate-300">vs</p>
                        </div>

                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-white">{jogo.time2}</p>
                          <p className="text-2xl font-bold text-blue-400">{jogo.placar2}</p>
                        </div>
                      </div>

                      {/* Artilheiros */}
                      {jogo.artilheiros.length > 0 && (
                        <div className="pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">Marcadores</p>
                          <div className="flex flex-wrap gap-1">
                            {jogo.artilheiros.map((art, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                ⚽ {art}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-700 flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 text-xs text-slate-400 hover:text-white">
                          📊 Estatísticas
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-xs text-slate-400 hover:text-white">
                          💬 Comentários
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <p className="text-slate-400">Nenhum jogo encontrado com os filtros selecionados</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
