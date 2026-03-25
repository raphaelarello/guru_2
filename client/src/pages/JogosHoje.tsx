import { useState } from "react";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, Clock, Trophy, TrendingUp, Target, ChevronDown, ChevronUp,
  RefreshCw, Loader2, AlertCircle, BarChart2, Zap
} from "lucide-react";
import type { PreMatchOdd } from "../../../server/football";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHora(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
    });
  } catch {
    return "--:--";
  }
}

function getOddPrincipal(odds: PreMatchOdd | null, betName: string, value: string): string {
  if (!odds) return "—";
  for (const bk of odds.bookmakers || []) {
    const bet = bk.bets?.find((b) => b.name.toLowerCase().includes(betName.toLowerCase()));
    if (bet) {
      const v = bet.values?.find((x) => x.value.toLowerCase().includes(value.toLowerCase()) && !x.suspended);
      if (v) return parseFloat(v.odd).toFixed(2);
    }
  }
  return "—";
}

function StatusBadge({ status }: { status: { short: string; elapsed?: number | null } }) {
  const s = status.short;
  if (s === "NS") return <Badge className="bg-slate-700 text-slate-300 text-xs">Não iniciado</Badge>;
  if (s === "FT") return <Badge className="bg-slate-600 text-slate-300 text-xs">Encerrado</Badge>;
  if (s === "HT") return <Badge className="bg-yellow-600 text-yellow-100 text-xs">Intervalo</Badge>;
  if (["1H", "2H", "ET", "P"].includes(s)) {
    return <Badge className="bg-green-600 text-white text-xs animate-pulse">{status.elapsed ?? s}'</Badge>;
  }
  return <Badge className="bg-slate-700 text-slate-300 text-xs">{s}</Badge>;
}

// ─── Modal de detalhes do jogo ────────────────────────────────────────────────

function ModalJogoHoje({
  fixtureId,
  titulo,
  onClose,
}: {
  fixtureId: number;
  titulo: string;
  onClose: () => void;
}) {
  const { data: pred, isLoading: loadPred } = trpc.football.predictions.useQuery({ fixtureId });
  const { data: odds, isLoading: loadOdds } = trpc.football.preMatchOdds.useQuery({ fixtureId });

  const oddsData = Array.isArray(odds) ? odds[0] : odds;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0f1117] border-[#1e2533] text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#00ff88] flex items-center gap-2">
            <Calendar className="w-5 h-5" /> {titulo}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="predicao">
          <TabsList className="bg-[#1a1f2e] w-full">
            <TabsTrigger value="predicao" className="flex-1 data-[state=active]:bg-[#00ff88] data-[state=active]:text-black">
              Predição IA
            </TabsTrigger>
            <TabsTrigger value="odds" className="flex-1 data-[state=active]:bg-[#00ff88] data-[state=active]:text-black">
              Odds
            </TabsTrigger>
          </TabsList>

          {/* Predição */}
          <TabsContent value="predicao" className="mt-4 space-y-4">
            {loadPred ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#00ff88]" /></div>
            ) : pred ? (
              <>
                <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#00ff88]/20">
                  <p className="text-[#00ff88] font-semibold mb-1">Conselho da IA</p>
                  <p className="text-gray-300 text-sm">{pred.predictions?.advice || "Sem conselho disponível"}</p>
                </div>

                {/* Percentuais */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Casa", val: pred.predictions?.percent?.home, color: "#00ff88" },
                    { label: "Empate", val: pred.predictions?.percent?.draw, color: "#fbbf24" },
                    { label: "Fora", val: pred.predictions?.percent?.away, color: "#60a5fa" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-[#1a1f2e] rounded-lg p-3 text-center border border-[#2a3040]">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-2xl font-bold" style={{ color }}>{val || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Comparação */}
                {pred.comparison && (
                  <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2a3040]">
                    <p className="text-gray-400 text-xs mb-3 font-semibold uppercase tracking-wide">Comparação de Times</p>
                    <div className="space-y-2">
                      {Object.entries(pred.comparison).map(([key, val]) => {
                        const v = val as { home: string; away: string };
                        return (
                          <div key={key} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-24 capitalize">{key.replace(/_/g, " ")}</span>
                            <div className="flex-1 flex gap-1 items-center">
                              <span className="text-[#00ff88] w-10 text-right">{v.home}</span>
                              <div className="flex-1 h-1.5 bg-[#2a3040] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#00ff88] to-[#60a5fa] rounded-full"
                                  style={{ width: v.home }}
                                />
                              </div>
                              <span className="text-[#60a5fa] w-10">{v.away}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Últimos 5 jogos */}
                {(pred.teams?.home?.last_5 || pred.teams?.away?.last_5) && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { time: pred.teams?.home, label: "Casa" },
                      { time: pred.teams?.away, label: "Fora" },
                    ].map(({ time, label }) => (
                      <div key={label} className="bg-[#1a1f2e] rounded-lg p-3 border border-[#2a3040]">
                        <p className="text-xs text-gray-400 mb-2">{label} — Últimos 5</p>
                        <p className="text-lg font-bold text-white">{time?.last_5?.form || "—"}</p>
                        <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                          <p>Ataque: <span className="text-[#00ff88]">{time?.last_5?.att || "—"}</span></p>
                          <p>Defesa: <span className="text-red-400">{time?.last_5?.def || "—"}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Predição não disponível para este jogo</p>
              </div>
            )}
          </TabsContent>

          {/* Odds */}
          <TabsContent value="odds" className="mt-4 space-y-3">
            {loadOdds ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#00ff88]" /></div>
            ) : oddsData ? (
              <>
                {(oddsData.bookmakers || []).slice(0, 3).map((bk) => (
                  <div key={bk.id} className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2a3040]">
                    <p className="text-[#00ff88] text-sm font-semibold mb-3">{bk.name}</p>
                    <div className="space-y-2">
                      {(bk.bets || []).slice(0, 5).map((bet) => (
                        <div key={bet.id}>
                          <p className="text-xs text-gray-400 mb-1">{bet.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {(bet.values || []).map((v, i) => (
                              <div
                                key={i}
                                className={`px-2 py-1 rounded text-xs font-mono ${v.suspended ? "bg-red-900/30 text-red-400" : "bg-[#0f1117] text-[#00ff88] border border-[#00ff88]/30"}`}
                              >
                                {v.value}: <span className="font-bold">{parseFloat(v.odd).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Odds não disponíveis para este jogo</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Card de jogo ─────────────────────────────────────────────────────────────

function JogoCard({
  fixture,
  odds,
  onClick,
}: {
  fixture: {
    fixture: { id: number; date: string; status: { short: string; elapsed?: number | null } };
    league: { id: number; name: string; logo: string; country: string };
    teams: { home: { name: string; logo: string }; away: { name: string; logo: string } };
    goals?: { home: number | null; away: number | null };
  };
  odds: PreMatchOdd | null;
  onClick: () => void;
}) {
  const home1x2 = getOddPrincipal(odds, "Match Winner", "Home");
  const draw1x2 = getOddPrincipal(odds, "Match Winner", "Draw");
  const away1x2 = getOddPrincipal(odds, "Match Winner", "Away");
  const over25 = getOddPrincipal(odds, "Goals Over/Under", "Over 2.5");
  const btts = getOddPrincipal(odds, "Both Teams Score", "Yes");

  return (
    <div
      className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-4 hover:border-[#00ff88]/40 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img src={fixture.league.logo} alt={fixture.league.name} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-xs text-gray-400 truncate max-w-[140px]">{fixture.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={fixture.fixture.status} />
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatHora(fixture.fixture.date)}
          </span>
        </div>
      </div>

      {/* Times */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <img src={fixture.teams.home.logo} alt={fixture.teams.home.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-sm font-semibold text-white truncate">{fixture.teams.home.name}</span>
        </div>
        <div className="px-3 text-center">
          {fixture.fixture.status.short === "NS" ? (
            <span className="text-gray-500 text-sm font-mono">vs</span>
          ) : (
            <span className="text-white font-bold text-lg font-mono">
              {fixture.goals?.home ?? 0} — {fixture.goals?.away ?? 0}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold text-white truncate text-right">{fixture.teams.away.name}</span>
          <img src={fixture.teams.away.logo} alt={fixture.teams.away.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      </div>

      {/* Odds resumidas */}
      {odds && (
        <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
          {[
            { label: "1", val: home1x2, color: "#00ff88" },
            { label: "X", val: draw1x2, color: "#fbbf24" },
            { label: "2", val: away1x2, color: "#60a5fa" },
            { label: "O2.5", val: over25, color: "#a78bfa" },
            { label: "BTTS", val: btts, color: "#f472b6" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[#0f1117] rounded p-1.5 border border-[#2a3040] group-hover:border-[#00ff88]/20 transition-colors">
              <p className="text-gray-500 text-[10px] mb-0.5">{label}</p>
              <p className="font-mono font-bold" style={{ color: val !== "—" ? color : "#4b5563" }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {!odds && (
        <div className="text-center text-xs text-gray-600 py-1">Odds não disponíveis</div>
      )}

      <div className="mt-3 text-center">
        <span className="text-xs text-[#00ff88]/60 group-hover:text-[#00ff88] transition-colors">
          Ver predições e odds completas →
        </span>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function JogosHoje() {
  const [ligaFiltro, setLigaFiltro] = useState<string>("todas");
  const [ligasExpandidas, setLigasExpandidas] = useState<Set<number>>(new Set());
  const [jogoSelecionado, setJogoSelecionado] = useState<{ id: number; titulo: string } | null>(null);

  const { data, isLoading, error, refetch, isFetching } = trpc.football.jogosHoje.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );

  const todasLigas = data?.ligas ?? [];
  const ligasFiltradas = ligaFiltro === "todas"
    ? todasLigas
    : todasLigas.filter((l) => String(l.liga.id) === ligaFiltro);

  const toggleLiga = (id: number) => {
    setLigasExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <RaphaLayout title="Jogos de Hoje">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#00ff88]" />
            Jogos de Hoje
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {data ? `${data.total} jogos encontrados` : "Carregando partidas do dia..."}
            {data?.timestamp && (
              <span className="ml-2 text-gray-600">
                · Atualizado às {new Date(data.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {todasLigas.length > 0 && (
            <Select value={ligaFiltro} onValueChange={setLigaFiltro}>
              <SelectTrigger className="w-48 bg-[#1a1f2e] border-[#2a3040] text-white">
                <SelectValue placeholder="Todas as ligas" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3040]">
                <SelectItem value="todas" className="text-white">Todas as ligas</SelectItem>
                {todasLigas.map((l) => (
                  <SelectItem key={l.liga.id} value={String(l.liga.id)} className="text-white">
                    {l.liga.name} ({l.jogos.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-[#2a3040] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: <Trophy className="w-5 h-5" />, label: "Total de Jogos", val: data.total, color: "#00ff88" },
            { icon: <BarChart2 className="w-5 h-5" />, label: "Ligas", val: todasLigas.length, color: "#60a5fa" },
            { icon: <Target className="w-5 h-5" />, label: "Com Odds", val: Object.keys(data.oddsMap).length, color: "#a78bfa" },
            { icon: <Zap className="w-5 h-5" />, label: "Ao Vivo", val: todasLigas.reduce((acc, l) => acc + l.jogos.filter(j => ["1H","2H","HT","ET","P"].includes(j.fixture.status.short)).length, 0), color: "#fbbf24" },
          ].map(({ icon, label, val, color }) => (
            <Card key={label} className="bg-[#1a1f2e] border-[#2a3040]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-2xl font-bold" style={{ color }}>{val}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00ff88]" />
          <p className="text-gray-400">Buscando jogos do dia na API Football...</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-semibold">Erro ao carregar jogos</p>
          <p className="text-red-300/70 text-sm mt-1">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 border-red-500/30 text-red-400">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Jogos agrupados por liga */}
      {!isLoading && !error && ligasFiltradas.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Nenhum jogo encontrado para hoje</p>
          <p className="text-sm mt-1">Tente atualizar ou verificar outra data</p>
        </div>
      )}

      <div className="space-y-4">
        {ligasFiltradas.map(({ liga, jogos }) => {
          const expandida = ligasExpandidas.has(liga.id);
          const jogosVisiveis = expandida ? jogos : jogos.slice(0, 3);

          return (
            <Card key={liga.id} className="bg-[#1a1f2e] border-[#2a3040]">
              <CardHeader
                className="pb-3 cursor-pointer hover:bg-[#1e2533] rounded-t-xl transition-colors"
                onClick={() => toggleLiga(liga.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={liga.logo} alt={liga.name} className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div>
                      <CardTitle className="text-white text-base">{liga.name}</CardTitle>
                      <p className="text-xs text-gray-500">{liga.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#0f1117] text-[#00ff88] border border-[#00ff88]/30">
                      {jogos.length} jogo{jogos.length !== 1 ? "s" : ""}
                    </Badge>
                    {expandida ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {jogosVisiveis.map((fixture) => {
                    const oddsData = data?.oddsMap?.[fixture.fixture.id];
                    const odds = oddsData ?? null;
                    return (
                      <JogoCard
                        key={fixture.fixture.id}
                        fixture={fixture as Parameters<typeof JogoCard>[0]["fixture"]}
                        odds={odds}
                        onClick={() => setJogoSelecionado({
                          id: fixture.fixture.id,
                          titulo: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                        })}
                      />
                    );
                  })}
                </div>
                {jogos.length > 3 && (
                  <button
                    className="mt-3 w-full text-xs text-gray-500 hover:text-[#00ff88] transition-colors py-2"
                    onClick={() => toggleLiga(liga.id)}
                  >
                    {expandida ? "Mostrar menos" : `Ver mais ${jogos.length - 3} jogo(s)`}
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      {jogoSelecionado && (
        <ModalJogoHoje
          fixtureId={jogoSelecionado.id}
          titulo={jogoSelecionado.titulo}
          onClose={() => setJogoSelecionado(null)}
        />
      )}
    </RaphaLayout>
  );
}
