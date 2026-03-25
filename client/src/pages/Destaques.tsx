import React from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Zap, Target, AlertTriangle, TrendingUp, BarChart3, Flame,
  ChevronRight, Calendar, RefreshCw, Sparkles, Filter, X,
  LineChart, PieChart, Activity, Trophy, AlertCircle, Users
} from "lucide-react";
import RaphaLayout from "@/components/RaphaLayout";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PalpiteAvancado = {
  fixtureId: number;
  homeTeam: string;
  homeTeamLogo: string;
  awayTeam: string;
  awayTeamLogo: string;
  leagueName: string;
  leagueLogo: string;
  countryFlag: string;
  matchTime: string;
  mercado: "BTTS" | "Gols" | "Escanteios" | "Cartões";
  palpite: string;
  confianca: "Alta" | "Media" | "Baixa";
  probabilidade: number;
  motivo: string;
  analiseDetalhada: {
    homeTeamStats: {
      mediaGols: number;
      mediaGolsForaEmCasa: number;
      mediaGolsSofridos: number;
      forma: string;
      ultimosJogos: string[];
      vitorias: number;
      empates: number;
      derrotas: number;
      aproveitamento: number;
    };
    awayTeamStats: {
      mediaGols: number;
      mediaGolsForaEmCasa: number;
      mediaGolsSofridos: number;
      forma: string;
      ultimosJogos: string[];
      vitorias: number;
      empates: number;
      derrotas: number;
      aproveitamento: number;
    };
    h2h: {
      ultimosJogos: Array<{
        data: string;
        resultado: string;
        placar: string;
      }>;
      estatisticas: {
        vitoriasHome: number;
        vitoriasAway: number;
        empates: number;
        mediaGolsHome: number;
        mediaGolsAway: number;
      };
    };
    modeloPoisson: {
      probabilidadeGolsHome: number[];
      probabilidadeGolsAway: number[];
      probabilidadeBTTS: number;
      probabilidadeOver25: number;
    };
    fatoresInfluencia: Array<{
      fator: string;
      impacto: string;
      peso: number;
    }>;
  };
};

type ArtilheiroAvancado = {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  teamName: string;
  teamLogo: string;
  leagueName: string;
  countryFlag: string;
  matchTime: string;
  opponent: string;
  totalGols: number;
  totalAssistencias: number;
  totalChutesGol: number;
  totalCartoes: number;
  mediaGolsPorJogo: number;
  mediaAssistenciasPorJogo: number;
  mediaChutesGolPorJogo: number;
  mediaCartoesPorJogo: number;
  confianca: "Alta" | "Media" | "Baixa";
  motivo: string;
  posicaoRanking: number;
  ultimosJogos: Array<{
    data: string;
    adversario: string;
    gols: number;
    assistencias: number;
    cartoes: number;
  }>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 1);
    return d;
  });
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {days.map(d => {
        const iso = d.toISOString().slice(0, 10);
        const isToday = iso === new Date().toISOString().slice(0, 10);
        const isSelected = iso === value;
        const label = isToday ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
        return (
          <button
            key={iso}
            onClick={() => onChange(iso)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isSelected
                ? "bg-green-500/30 text-green-400 border border-green-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Componentes ──────────────────────────────────────────────────────────────

function PalpiteCard({ palpite, onClickDetalhes }: { palpite: PalpiteAvancado; onClickDetalhes: (p: PalpiteAvancado) => void }) {
  const confColor = palpite.confianca === "Alta" ? "bg-green-500/20 text-green-400" : palpite.confianca === "Media" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400";
  const borderColor = palpite.confianca === "Alta" ? "border-green-500/50" : palpite.confianca === "Media" ? "border-yellow-500/50" : "border-red-500/50";
  const lineColor = palpite.confianca === "Alta" ? "bg-green-500" : palpite.confianca === "Media" ? "bg-yellow-500" : "bg-red-500";

  return (
    <button
      onClick={() => onClickDetalhes(palpite)}
      className={`group relative bg-slate-900/50 border ${borderColor} rounded-xl p-4 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 text-left w-full backdrop-blur-sm`}
    >
      <div className={`absolute top-0 left-0 h-1 w-full ${lineColor} rounded-t-xl`} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img src={palpite.homeTeamLogo} alt="" className="w-5 h-5" />
          <span className="text-xs font-semibold text-slate-300">{palpite.homeTeam}</span>
        </div>
        <span className="text-xs text-slate-500">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">{palpite.awayTeam}</span>
          <img src={palpite.awayTeamLogo} alt="" className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{palpite.matchTime}</span>
        <span className="text-xs text-slate-500">{palpite.leagueName}</span>
      </div>

      <div className="border-t border-slate-700/50 pt-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-300">PALPITE</span>
          <span className="text-lg font-bold text-green-400">{palpite.palpite}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Probabilidade</span>
          <span className={`text-sm font-bold ${palpite.probabilidade >= 80 ? "text-green-400" : palpite.probabilidade >= 60 ? "text-yellow-400" : "text-red-400"}`}>
            {palpite.probabilidade}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge className={confColor}>{palpite.confianca}</Badge>
        <button className="text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </button>
  );
}

function ArtilheiroCard({ artilheiro, tipo }: { artilheiro: ArtilheiroAvancado; tipo: "artilheiro" | "indisciplinado" }) {
  const confColor = artilheiro.confianca === "Alta" ? "bg-green-500/20 text-green-400" : artilheiro.confianca === "Media" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400";
  const borderColor = artilheiro.confianca === "Alta" ? "border-green-500/50" : artilheiro.confianca === "Media" ? "border-yellow-500/50" : "border-red-500/50";
  const lineColor = artilheiro.confianca === "Alta" ? "bg-green-500" : artilheiro.confianca === "Media" ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={`group relative bg-slate-900/50 border ${borderColor} rounded-xl p-4 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-sm`}>
      <div className={`absolute top-0 left-0 h-1 w-full ${lineColor} rounded-t-xl`} />

      <div className="flex items-start gap-3 mb-3">
        <img src={artilheiro.playerPhoto} alt="" className="w-12 h-12 rounded-full border border-slate-700/50" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-200 truncate">{artilheiro.playerName}</h3>
            {artilheiro.posicaoRanking <= 3 && (
              <Trophy className={`w-4 h-4 ${artilheiro.posicaoRanking === 1 ? "text-yellow-400" : artilheiro.posicaoRanking === 2 ? "text-gray-400" : "text-orange-400"}`} />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <img src={artilheiro.teamLogo} alt="" className="w-4 h-4" />
            <span>{artilheiro.teamName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-slate-500">{artilheiro.matchTime}</span>
        <span className="text-slate-500">vs {artilheiro.opponent}</span>
      </div>

      <div className="border-t border-slate-700/50 pt-3 mb-3">
        {tipo === "artilheiro" ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <span className="text-xs text-slate-500">Gols</span>
                <div className="text-lg font-bold text-green-400">{artilheiro.totalGols}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Assistências</span>
                <div className="text-lg font-bold text-blue-400">{artilheiro.totalAssistencias}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-slate-500">Média/Jogo</span>
                <div className="text-sm font-semibold text-slate-300">{artilheiro.mediaGolsPorJogo.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Chutes a Gol</span>
                <div className="text-sm font-semibold text-slate-300">{artilheiro.totalChutesGol}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-slate-500">Cartões</span>
                <div className="text-lg font-bold text-red-400">{artilheiro.totalCartoes}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Média/Jogo</span>
                <div className="text-sm font-semibold text-slate-300">{artilheiro.mediaCartoesPorJogo.toFixed(2)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Badge className={confColor}>{artilheiro.confianca}</Badge>
        <span className="text-xs text-slate-500">#{artilheiro.posicaoRanking}</span>
      </div>
    </div>
  );
}

function AnaliseModal({ palpite, open, onOpenChange }: { palpite: PalpiteAvancado | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!palpite) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-900 border border-slate-700/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-200">
            Análise Detalhada: {palpite.homeTeam} vs {palpite.awayTeam}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {palpite.leagueName} • {palpite.matchTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Palpite Principal */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Palpite</span>
              <Badge className="bg-green-500/20 text-green-400">{palpite.confianca}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-200">{palpite.palpite}</span>
              <span className="text-3xl font-bold text-green-400">{palpite.probabilidade}%</span>
            </div>
          </div>

          {/* Estatísticas dos Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <img src={palpite.homeTeamLogo} alt="" className="w-5 h-5" />
                {palpite.homeTeam}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Média de Gols</span>
                  <span className="text-slate-200 font-semibold">{palpite.analiseDetalhada.homeTeamStats.mediaGols.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gols Sofridos</span>
                  <span className="text-slate-200 font-semibold">{palpite.analiseDetalhada.homeTeamStats.mediaGolsSofridos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aproveitamento</span>
                  <span className="text-slate-200 font-semibold">{palpite.analiseDetalhada.homeTeamStats.aproveitamento}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <img src={palpite.awayTeamLogo} alt="" className="w-5 h-5" />
                {palpite.awayTeam}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Média de Gols</span>
                  <span className="text-slate-200 font-semibold">{palpite.analiseDetalhada.awayTeamStats.mediaGols.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gols Sofridos</span>
                  <span className="text-slate-200 font-semibold">{palpite.analiseDetalhada.awayTeamStats.mediaGolsSofridos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aproveitamento</span>
                  <span className="text-slate-200 font-semibold">{palpite.analiseDetalhada.awayTeamStats.aproveitamento}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modelo de Projeção */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Modelo de Projeção (Poisson)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500">Probabilidade BTTS</span>
                <div className="text-2xl font-bold text-green-400">{(palpite.analiseDetalhada.modeloPoisson.probabilidadeBTTS * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Probabilidade Over 2.5</span>
                <div className="text-2xl font-bold text-blue-400">{(palpite.analiseDetalhada.modeloPoisson.probabilidadeOver25 * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Fatores de Influência */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Fatores de Influência
            </h3>
            <div className="space-y-2">
              {palpite.analiseDetalhada.fatoresInfluencia.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{f.fator}</span>
                  <span className="text-green-400 font-semibold">{f.impacto}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-200 mb-2">Motivo</h3>
            <p className="text-sm text-slate-300">{palpite.motivo}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Destaques() {
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [selectedLiga, setSelectedLiga] = React.useState<string | null>(null);
  const [selectedPalpite, setSelectedPalpite] = React.useState<PalpiteAvancado | null>(null);
  const [showAnaliseModal, setShowAnaliseModal] = React.useState(false);
  const [selectedArtilheiro, setSelectedArtilheiro] = React.useState<ArtilheiroAvancado | null>(null);
  const [showArtilheiroModal, setShowArtilheiroModal] = React.useState(false);

  const { data: destaquesData, isLoading } = trpc.destaques.avancado.useQuery({ date: selectedDate });
  const { data: artilheirosData } = trpc.destaques.artilheiros.useQuery({ date: selectedDate });

  // Filtrar palpites por liga
  const palpitesFiltrados = React.useMemo(() => {
    const palpites = (destaquesData as any)?.palpites || [];
    if (!palpites || palpites.length === 0) return { btts: [], gols: [], escanteios: [], cartoes: [] };

    let filtered = palpites;
    if (selectedLiga && selectedLiga !== "todas") {
      filtered = palpites.filter((p: PalpiteAvancado) => p.leagueName === selectedLiga);
    }

    return {
      btts: filtered.filter((p: PalpiteAvancado) => p.mercado === "BTTS"),
      gols: filtered.filter((p: PalpiteAvancado) => p.mercado === "Gols"),
      escanteios: filtered.filter((p: PalpiteAvancado) => p.mercado === "Escanteios"),
      cartoes: filtered.filter((p: PalpiteAvancado) => p.mercado === "Cartões"),
    };
  }, [destaquesData, selectedLiga]);

  // Extrair ligas únicas
  const ligas = React.useMemo(() => {
    if (!destaquesData) return [];
    const palpites = (destaquesData as any).palpites || [];
    const uniqueLigas = new Set(palpites.map((p: PalpiteAvancado) => p.leagueName));
    return Array.from(uniqueLigas).sort() as string[];
  }, [destaquesData]);

  return (
    <RaphaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-green-400" />
              Destaques do Dia
            </h1>
            <p className="text-slate-500 mt-1">
              {destaquesData?.totalJogos || 0} jogos · {destaquesData?.totalLigas || 0} ligas
            </p>
          </div>
          <RefreshCw className="w-6 h-6 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors" />
        </div>

        {/* Date Picker */}
        <div>
          <label className="text-sm font-semibold text-slate-400 mb-2 block">Selecione a Data</label>
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Liga Filter */}
        <div>
          <label className="text-sm font-semibold text-slate-400 mb-2 block flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar por Liga
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedLiga(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedLiga === null
                  ? "bg-green-500/30 text-green-400 border border-green-500/50"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50"
              }`}
            >
              Todas as Ligas
            </button>
            {(ligas as string[]).map((liga) => (
              <button
                key={liga}
                onClick={() => setSelectedLiga(liga)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedLiga === liga
                    ? "bg-green-500/30 text-green-400 border border-green-500/50"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50"
                }`}
              >
                {liga}
              </button>
            ))}
          </div>
        </div>

        {/* Palpites */}
        <div>
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Palpites Automáticos da IA
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              Carregando análises avançadas...
            </div>
          ) : (
            <Tabs defaultValue="btts" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
                <TabsTrigger value="btts" className="text-xs">
                  🎯 BTTS ({palpitesFiltrados.btts.length})
                </TabsTrigger>
                <TabsTrigger value="gols" className="text-xs">
                  ⚽ Gols ({palpitesFiltrados.gols.length})
                </TabsTrigger>
                <TabsTrigger value="escanteios" className="text-xs">
                  🚩 Escanteios ({palpitesFiltrados.escanteios.length})
                </TabsTrigger>
                <TabsTrigger value="cartoes" className="text-xs">
                  🟨 Cartões ({palpitesFiltrados.cartoes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="btts" className="mt-4">
                {palpitesFiltrados.btts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum palpite disponível
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {palpitesFiltrados.btts.map((p: PalpiteAvancado) => (
                      <PalpiteCard
                        key={p.fixtureId}
                        palpite={p}
                        onClickDetalhes={(palpite) => {
                          setSelectedPalpite(palpite);
                          setShowAnaliseModal(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gols" className="mt-4">
                {palpitesFiltrados.gols.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum palpite disponível
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {palpitesFiltrados.gols.map((p: PalpiteAvancado) => (
                      <PalpiteCard
                        key={p.fixtureId}
                        palpite={p}
                        onClickDetalhes={(palpite) => {
                          setSelectedPalpite(palpite);
                          setShowAnaliseModal(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="escanteios" className="mt-4">
                {palpitesFiltrados.escanteios.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum palpite disponível
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {palpitesFiltrados.escanteios.map((p: PalpiteAvancado) => (
                      <PalpiteCard
                        key={p.fixtureId}
                        palpite={p}
                        onClickDetalhes={(palpite) => {
                          setSelectedPalpite(palpite);
                          setShowAnaliseModal(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cartoes" className="mt-4">
                {palpitesFiltrados.cartoes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum palpite disponível
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {palpitesFiltrados.cartoes.map((p: PalpiteAvancado) => (
                      <PalpiteCard
                        key={p.fixtureId}
                        palpite={p}
                        onClickDetalhes={(palpite) => {
                          setSelectedPalpite(palpite);
                          setShowAnaliseModal(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Artilheiros */}
        {artilheirosData && (artilheirosData.artilheiros.length > 0 || artilheirosData.indisciplinados.length > 0) && (
          <div>
            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Artilheiros e Indisciplinados
            </h2>

            <Tabs defaultValue="artilheiros" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
                <TabsTrigger value="artilheiros" className="text-xs">
                  ⚽ Artilheiros ({artilheirosData.artilheiros.length})
                </TabsTrigger>
                <TabsTrigger value="indisciplinados" className="text-xs">
                  🟨 Indisciplinados ({artilheirosData.indisciplinados.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="artilheiros" className="mt-4">
                {artilheirosData.artilheiros.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum artilheiro disponível
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {artilheirosData.artilheiros.map(a => (
                      <ArtilheiroCard key={a.playerId} artilheiro={a} tipo="artilheiro" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="indisciplinados" className="mt-4">
                {artilheirosData.indisciplinados.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum indisciplinado disponível
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {artilheirosData.indisciplinados.map(a => (
                      <ArtilheiroCard key={a.playerId} artilheiro={a} tipo="indisciplinado" />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Modal de Análise */}
      <AnaliseModal
        palpite={selectedPalpite}
        open={showAnaliseModal}
        onOpenChange={setShowAnaliseModal}
      />
    </RaphaLayout>
  );
}
