import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Zap, Target, AlertTriangle, TrendingUp, BarChart3, Flame,
  ChevronRight, Calendar, RefreshCw, Sparkles, Filter, X,
  LineChart, PieChart, Activity
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
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSelected
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TeamLogo({ src, name, size = 32 }: { src?: string; name: string; size?: number }) {
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=${size}&background=1e293b&color=94a3b8&bold=true`}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-contain bg-slate-800 p-0.5 flex-shrink-0 ring-1 ring-slate-700"
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=${size}&background=1e293b&color=94a3b8&bold=true`;
      }}
    />
  );
}

// ─── Card Premium de Palpite ──────────────────────────────────────────────────

function PalpiteCard({ palpite, onClickDetalhes }: { palpite: PalpiteAvancado; onClickDetalhes: (p: PalpiteAvancado) => void }) {
  const coresConfig = {
    Alta: { bg: "bg-emerald-950/40", border: "border-emerald-500/50", text: "text-emerald-300", badge: "bg-emerald-500/25 border-emerald-500/60 text-emerald-200", line: "from-emerald-500 to-emerald-600" },
    Media: { bg: "bg-yellow-950/40", border: "border-yellow-500/50", text: "text-yellow-300", badge: "bg-yellow-500/25 border-yellow-500/60 text-yellow-200", line: "from-yellow-500 to-yellow-600" },
    Baixa: { bg: "bg-orange-950/40", border: "border-orange-500/50", text: "text-orange-300", badge: "bg-orange-500/25 border-orange-500/60 text-orange-200", line: "from-orange-500 to-orange-600" },
  };

  const cores = coresConfig[palpite.confianca];

  return (
    <button
      onClick={() => onClickDetalhes(palpite)}
      className={`group relative overflow-hidden rounded-xl border ${cores.bg} ${cores.border} transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/60 hover:-translate-y-2 cursor-pointer backdrop-blur-sm text-left w-full`}
    >
      {/* Linha de destaque no topo */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cores.line}`} />

      <div className="p-5 relative z-10 space-y-4">
        {/* Header com times */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamLogo src={palpite.homeTeamLogo} name={palpite.homeTeam} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{palpite.homeTeam}</p>
              <p className="text-xs text-slate-400 truncate">{palpite.leagueName}</p>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-xs text-slate-500 mb-1 font-medium">vs</p>
            <p className="text-sm font-bold text-slate-300">{palpite.matchTime}</p>
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-bold text-white truncate">{palpite.awayTeam}</p>
              <p className="text-xs text-slate-400 truncate">{palpite.countryFlag}</p>
            </div>
            <TeamLogo src={palpite.awayTeamLogo} name={palpite.awayTeam} size={36} />
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />

        {/* Palpite em destaque */}
        <div className={`p-4 rounded-lg border ${cores.badge} bg-opacity-40 backdrop-blur-sm`}>
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Palpite</p>
          <p className={`text-base font-bold ${cores.text}`}>{palpite.palpite}</p>
        </div>

        {/* Probabilidade e Motivo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Probabilidade</span>
            <span className={`text-sm font-bold ${cores.text}`}>{palpite.probabilidade}%</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{palpite.motivo}</p>
        </div>

        {/* Footer com Badge e CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
          <Badge className={`${cores.badge} border font-semibold text-xs`}>
            {palpite.confianca === "Alta" && <Zap className="w-3 h-3 mr-1.5" />}
            {palpite.confianca === "Media" && <Target className="w-3 h-3 mr-1.5" />}
            {palpite.confianca === "Baixa" && <AlertTriangle className="w-3 h-3 mr-1.5" />}
            {palpite.confianca}
          </Badge>
          <div className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-400 transition-colors">
            <BarChart3 className="w-3 h-3" />
            Análise
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Modal de Análise Detalhada ───────────────────────────────────────────────

function AnaliseModal({ palpite, open, onOpenChange }: { palpite: PalpiteAvancado | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!palpite) return null;

  const analise = palpite.analiseDetalhada;
  const homeStats = analise.homeTeamStats;
  const awayStats = analise.awayTeamStats;
  const h2h = analise.h2h;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Análise Detalhada: {palpite.homeTeam} vs {palpite.awayTeam}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {palpite.leagueName} • {palpite.matchTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Palpite Principal */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Palpite</p>
                <p className="text-2xl font-bold text-white">{palpite.palpite}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 mb-1">Probabilidade</p>
                <p className="text-3xl font-bold text-emerald-400">{palpite.probabilidade}%</p>
              </div>
              <Badge className="bg-emerald-500/20 border-emerald-500/60 text-emerald-200">
                <Zap className="w-3 h-3 mr-1.5" />
                {palpite.confianca}
              </Badge>
            </div>
          </div>

          {/* Estatísticas dos Times */}
          <div className="grid grid-cols-2 gap-4">
            {/* Home Team */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <TeamLogo src={palpite.homeTeamLogo} name={palpite.homeTeam} size={24} />
                {palpite.homeTeam}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Média de Gols</span>
                  <span className="text-white font-bold">{homeStats.mediaGolsForaEmCasa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gols Sofridos</span>
                  <span className="text-white font-bold">{homeStats.mediaGolsSofridos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma</span>
                  <span className="text-white font-bold">{homeStats.forma}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Aproveitamento</span>
                  <span className="text-white font-bold">{homeStats.aproveitamento}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registro</span>
                  <span className="text-white font-bold">{homeStats.vitorias}V {homeStats.empates}E {homeStats.derrotas}D</span>
                </div>
              </div>
            </div>

            {/* Away Team */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <TeamLogo src={palpite.awayTeamLogo} name={palpite.awayTeam} size={24} />
                {palpite.awayTeam}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Média de Gols</span>
                  <span className="text-white font-bold">{awayStats.mediaGolsForaEmCasa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gols Sofridos</span>
                  <span className="text-white font-bold">{awayStats.mediaGolsSofridos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma</span>
                  <span className="text-white font-bold">{awayStats.forma}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Aproveitamento</span>
                  <span className="text-white font-bold">{awayStats.aproveitamento}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registro</span>
                  <span className="text-white font-bold">{awayStats.vitorias}V {awayStats.empates}E {awayStats.derrotas}D</span>
                </div>
              </div>
            </div>
          </div>

          {/* H2H */}
          {h2h.ultimosJogos.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">Confrontos Diretos (Últimos 5)</h3>
              <div className="space-y-2">
                {h2h.ultimosJogos.map((jogo, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{jogo.data}</span>
                    <span className="text-white font-bold">{jogo.placar}</span>
                    <Badge variant="outline" className="text-xs">
                      {jogo.resultado === "V" ? "Vitória" : jogo.resultado === "D" ? "Derrota" : "Empate"}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <div className="text-center">
                  <p className="text-slate-400">Vitórias</p>
                  <p className="text-white font-bold">{h2h.estatisticas.vitoriasHome}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400">Empates</p>
                  <p className="text-white font-bold">{h2h.estatisticas.empates}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400">Derrotas</p>
                  <p className="text-white font-bold">{h2h.estatisticas.vitoriasAway}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fatores de Influência */}
          {analise.fatoresInfluencia.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">Fatores de Influência</h3>
              <div className="space-y-2">
                {analise.fatoresInfluencia.map((fator, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-400">{fator.fator}</p>
                      <p className="text-slate-300">{fator.impacto}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{(fator.peso * 100 - 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modelo Poisson */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Modelo de Projeção (Poisson)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-2">Probabilidade BTTS</p>
                <p className="text-2xl font-bold text-emerald-400">{(analise.modeloPoisson.probabilidadeBTTS * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">Probabilidade Over 2.5</p>
                <p className="text-2xl font-bold text-blue-400">{(analise.modeloPoisson.probabilidadeOver25 * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Destaques() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedPalpite, setSelectedPalpite] = useState<PalpiteAvancado | null>(null);
  const [showAnaliseModal, setShowAnaliseModal] = useState(false);

  const destaquesQuery = trpc.destaques.avancado.useQuery({ date });
  const data = destaquesQuery.data as any | undefined;

  // Extrair ligas únicas
  const uniqueLeagues = useMemo(() => {
    if (!data) return [];
    const ligas = new Set<string>();
    [...data.palpitesBTTS, ...data.palpitesGols, ...data.palpitesEscanteios, ...data.palpitesCartoes].forEach((p: any) => {
      ligas.add(p.leagueName);
    });
    return Array.from(ligas).sort();
  }, [data]);

  // Filtrar palpites
  const palpitesFiltrados = useMemo(() => {
    if (!data) return { btts: [], gols: [], escanteios: [], cartoes: [] };
    const filtrar = (arr: any[]) =>
      selectedLeague === null ? arr : arr.filter(p => p.leagueName === uniqueLeagues[selectedLeague]);
    return {
      btts: filtrar(data.palpitesBTTS),
      gols: filtrar(data.palpitesGols),
      escanteios: filtrar(data.palpitesEscanteios),
      cartoes: filtrar(data.palpitesCartoes),
    };
  }, [data, selectedLeague, uniqueLeagues]);

  const isLoading = destaquesQuery.isLoading;

  return (
    <RaphaLayout title="Destaques">
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Destaques do Dia
            </h1>
            <div className="text-sm text-slate-400">
              {data?.totalJogos || 0} jogos · {data?.totalLigas || 0} ligas
            </div>
          </div>

          {/* Date Picker */}
          <DatePicker value={date} onChange={setDate} />

          {/* Liga Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <button
              onClick={() => setSelectedLeague(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedLeague === null
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
              }`}
            >
              Todas as Ligas
            </button>
            {uniqueLeagues.map((liga, idx) => (
              <button
                key={liga}
                onClick={() => setSelectedLeague(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
                  selectedLeague === idx
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                {liga}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
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

            {/* Grid de Cards */}
            <TabsContent value="btts" className="mt-4">
              {palpitesFiltrados.btts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhum palpite disponível
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {palpitesFiltrados.btts.map(p => (
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
                  {palpitesFiltrados.gols.map(p => (
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
                  {palpitesFiltrados.escanteios.map(p => (
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
                  {palpitesFiltrados.cartoes.map(p => (
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

      {/* Modal de Análise */}
      <AnaliseModal
        palpite={selectedPalpite}
        open={showAnaliseModal}
        onOpenChange={setShowAnaliseModal}
      />
    </RaphaLayout>
  );
}
