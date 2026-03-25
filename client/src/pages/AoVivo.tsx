import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, RefreshCw, Clock, Target, TrendingUp, Zap,
  AlertCircle, ChevronRight, Circle, ArrowRight, Swords, Star, Flag
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusLabel(short: string, elapsed: number | null): string {
  if (short === "HT") return "Intervalo";
  if (short === "FT") return "Encerrado";
  if (short === "NS") return "Não iniciado";
  if (short === "PST") return "Adiado";
  if (short === "CANC") return "Cancelado";
  if (short === "SUSP") return "Suspenso";
  if (elapsed !== null) return `${elapsed}'`;
  return short;
}

function statusColor(short: string): string {
  if (["1H", "2H", "ET", "P"].includes(short)) return "text-green-400";
  if (short === "HT") return "text-yellow-400";
  if (["FT", "AET", "PEN"].includes(short)) return "text-gray-400";
  return "text-blue-400";
}

function urgenciaStyle(urgencia: string): string {
  if (urgencia === "alta") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (urgencia === "media") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  return "text-blue-400 bg-blue-400/10 border-blue-400/30";
}

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === "over" || tipo === "under") return <Target className="w-3 h-3" />;
  if (tipo === "btts") return <Swords className="w-3 h-3" />;
  if (tipo === "resultado") return <Star className="w-3 h-3" />;
  if (tipo === "cartao") return <Flag className="w-3 h-3" />;
  if (tipo === "escanteio") return <ArrowRight className="w-3 h-3" />;
  return <Zap className="w-3 h-3" />;
}

// ─── Evento badge ─────────────────────────────────────────────────────────────
function EventoBadge({ ev }: { ev: { type: string; detail: string; time: { elapsed: number }; player: { name: string | null }; team: { name: string } } }) {
  const isGoal = ev.type === "Goal";
  const isYellow = ev.type === "Card" && ev.detail.includes("Yellow");
  const isRed = ev.type === "Card" && ev.detail.includes("Red");
  const isSubst = ev.type === "subst";
  const isVar = ev.type === "Var";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
      isGoal ? "bg-green-500/20 text-green-300" :
      isYellow ? "bg-yellow-500/20 text-yellow-300" :
      isRed ? "bg-red-500/20 text-red-300" :
      isSubst ? "bg-blue-500/20 text-blue-300" :
      isVar ? "bg-purple-500/20 text-purple-300" : "bg-gray-500/20 text-gray-300"
    }`}>
      <span className="font-bold">{ev.time.elapsed}'</span>
      <span>{isGoal ? "⚽" : isYellow ? "🟨" : isRed ? "🟥" : isSubst ? "🔄" : isVar ? "📺" : "•"}</span>
      <span className="max-w-[80px] truncate">{ev.player.name || ev.team.name}</span>
    </span>
  );
}

// ─── Barra de estatística ─────────────────────────────────────────────────────
function StatBar({ label, home, away }: { label: string; home: string | number | null; away: string | number | null }) {
  const h = typeof home === "string" ? parseFloat(home) || 0 : home || 0;
  const a = typeof away === "string" ? parseFloat(away) || 0 : away || 0;
  const total = h + a;
  const pct = total > 0 ? (h / total) * 100 : 50;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-white">{home ?? 0}</span>
        <span className="text-gray-400 text-[10px]">{label}</span>
        <span className="font-semibold text-white">{away ?? 0}</span>
      </div>
      <div className="flex h-1 rounded-full overflow-hidden bg-gray-700">
        <div className="bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        <div className="bg-blue-500 flex-1" />
      </div>
    </div>
  );
}

// ─── Modal de detalhes ────────────────────────────────────────────────────────
function ModalJogo({ fixtureId, open, onClose }: { fixtureId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = trpc.football.analisarJogo.useQuery(
    { fixtureId: fixtureId! },
    { enabled: !!fixtureId && open, refetchInterval: 30_000 }
  );

  if (!open || !fixtureId) return null;

  const fixture = data?.fixture;
  const stats = data?.stats || [];
  const ops = data?.oportunidades || [];
  const pred = data?.prediction;
  const statsH = stats[0]?.statistics || [];
  const statsA = stats[1]?.statistics || [];
  const getStat = (arr: typeof statsH, type: string) => arr.find(s => s.type === type)?.value ?? null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-green-400" />
          </div>
        ) : fixture ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">
                <div className="flex items-center justify-center gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <img src={fixture.teams.home.logo} alt="" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-semibold">{fixture.teams.home.name}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{fixture.goals.home ?? 0} — {fixture.goals.away ?? 0}</div>
                    <div className={`text-xs font-bold ${statusColor(fixture.fixture.status.short)}`}>
                      {statusLabel(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{fixture.teams.away.name}</span>
                    <img src={fixture.teams.away.logo} alt="" className="w-8 h-8 object-contain" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-center">{fixture.league.name} — {fixture.league.round}</div>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="oportunidades">
              <TabsList className="bg-gray-800 w-full grid grid-cols-4">
                <TabsTrigger value="oportunidades" className="text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                  Sinais ({ops.length})
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                  Estatísticas
                </TabsTrigger>
                <TabsTrigger value="eventos" className="text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                  Eventos ({fixture.events?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="predicao" className="text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                  Predição
                </TabsTrigger>
              </TabsList>

              <TabsContent value="oportunidades" className="space-y-2 mt-3">
                {ops.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Nenhuma oportunidade detectada no momento.</p>
                ) : ops.map((op, i) => (
                  <div key={i} className={`border rounded-lg p-3 ${urgenciaStyle(op.urgencia)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <TipoIcon tipo={op.tipo} />
                        <span className="font-bold text-sm">{op.mercado}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs border-current px-1.5">Odd {op.odd.toFixed(2)}</Badge>
                        <Badge className={`text-xs px-1.5 ${op.ev > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          EV {op.ev > 0 ? "+" : ""}{op.ev.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">Confiança:</span>
                      <Progress value={op.confianca} className="flex-1 h-1" />
                      <span className="text-xs font-bold">{op.confianca}%</span>
                    </div>
                    <ul className="space-y-0.5">
                      {op.motivos.map((m, j) => (
                        <li key={j} className="text-xs flex items-start gap-1 opacity-90">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="stats" className="space-y-1.5 mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span className="font-semibold text-green-400">{fixture.teams.home.name}</span>
                  <span className="font-semibold text-blue-400">{fixture.teams.away.name}</span>
                </div>
                {["Ball Possession","Total Shots","Shots on Goal","Shots off Goal","Corner Kicks","Fouls","Yellow Cards","Red Cards","Offsides","Total passes","Passes accurate","Goalkeeper Saves"].map(type => (
                  <StatBar key={type} label={type} home={getStat(statsH, type)} away={getStat(statsA, type)} />
                ))}
              </TabsContent>

              <TabsContent value="eventos" className="mt-3">
                {!fixture.events || fixture.events.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Nenhum evento registrado ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...fixture.events].reverse().map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <EventoBadge ev={ev} />
                        <span className="text-gray-400 text-[10px]">{ev.detail}</span>
                        {ev.assist?.name && <span className="text-gray-500 text-[10px]">(assist: {ev.assist.name})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="predicao" className="space-y-3 mt-3">
                {!pred ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Predição não disponível para este jogo.</p>
                ) : (
                  <>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-green-400 font-semibold mb-3">💡 {pred.predictions.advice}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: fixture.teams.home.name, val: pred.predictions.percent.home },
                          { label: "Empate", val: pred.predictions.percent.draw },
                          { label: fixture.teams.away.name, val: pred.predictions.percent.away },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <div className="text-xl font-bold text-white">{val}</div>
                            <div className="text-xs text-gray-400 truncate">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(pred.comparison).map(([key, val]) => (
                        <div key={key} className="bg-gray-800 rounded p-2 text-xs">
                          <div className="text-gray-400 capitalize mb-1">{key.replace(/_/g, " ")}</div>
                          <div className="flex justify-between">
                            <span className="text-green-400 font-semibold">{(val as { home: string }).home}</span>
                            <span className="text-blue-400 font-semibold">{(val as { away: string }).away}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800 rounded p-2">
                        <div className="text-gray-400 mb-1">Forma {fixture.teams.home.name}</div>
                        <div className="font-mono font-bold text-white">{pred.teams.home.last_5.form}</div>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <div className="text-gray-400 mb-1">Forma {fixture.teams.away.name}</div>
                        <div className="font-mono font-bold text-white">{pred.teams.away.last_5.form}</div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <p className="text-gray-400 text-center py-8">Dados não disponíveis.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AoVivo() {
  const [jogoSelecionado, setJogoSelecionado] = useState<number | null>(null);
  const [filtroLiga, setFiltroLiga] = useState("todas");
  const [apenasComSinal, setApenasComSinal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [ultimaAtt, setUltimaAtt] = useState(new Date());

  const { data: dashboard, isLoading, refetch, error } = trpc.football.dashboardAoVivo.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  // Atualizar timestamp quando novos dados chegam
  useEffect(() => { if (dashboard?.timestamp) setUltimaAtt(new Date()); }, [dashboard?.timestamp]);

  const { data: blockStatus } = trpc.football.blockStatus.useQuery(undefined, { refetchInterval: 60_000 });

  const handleRefresh = useCallback(async () => {
    await refetch();
    setUltimaAtt(new Date());
    toast.success("Dados atualizados!");
  }, [refetch]);

  const ligas = dashboard?.jogos
    ? Array.from(new Set(dashboard.jogos.map(j => j.fixture.league.name))).sort()
    : [];

  const jogosFiltrados = (dashboard?.jogos || []).filter(j => {
    if (filtroLiga !== "todas" && j.fixture.league.name !== filtroLiga) return false;
    if (apenasComSinal && j.totalOportunidades === 0) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Jogos Ao Vivo
            {dashboard && (
              <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-xs ml-1">
                {dashboard.totalJogos} jogos
              </Badge>
            )}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">API Football — dados reais, atualização automática a cada 30s</p>
        </div>
        <div className="flex items-center gap-2">
          {blockStatus?.blocked && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30 text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Quota pausada ({blockStatus.brasiliaHour}h)
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-gray-600 text-xs h-8 ${autoRefresh ? "text-green-400 border-green-400/50" : "text-gray-400"}`}
          >
            <Circle className={`w-1.5 h-1.5 mr-1 ${autoRefresh ? "fill-green-400" : "fill-gray-400"}`} />
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:text-white h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: Activity, color: "text-green-400", value: dashboard?.totalJogos ?? 0, label: "Jogos ao vivo" },
          { icon: Zap, color: "text-yellow-400", value: dashboard?.totalOportunidades ?? 0, label: "Oportunidades" },
          { icon: TrendingUp, color: "text-blue-400", value: (dashboard?.jogos || []).filter(j => j.totalOportunidades > 0).length, label: "Jogos c/ sinal" },
          { icon: Clock, color: "text-purple-400", value: ultimaAtt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), label: "Atualizado" },
        ].map(({ icon: Icon, color, value, label }, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-3 flex items-center gap-2">
              <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
              <div>
                <div className="text-base font-bold text-white leading-tight">{value}</div>
                <div className="text-[10px] text-gray-400">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={apenasComSinal ? "default" : "outline"}
          onClick={() => setApenasComSinal(!apenasComSinal)}
          className={`h-7 text-xs ${apenasComSinal ? "bg-green-500 text-black hover:bg-green-400" : "border-gray-600 text-gray-300"}`}
        >
          <Zap className="w-3 h-3 mr-1" />
          Só com sinais
        </Button>
        <select
          value={filtroLiga}
          onChange={e => setFiltroLiga(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-gray-300 text-xs rounded px-2 py-1 h-7"
        >
          <option value="todas">Todas as ligas</option>
          {ligas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-xs text-gray-500">{jogosFiltrados.length} jogo(s)</span>
      </div>

      {/* Erro */}
      {error && (
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-semibold text-sm">Erro ao carregar dados</p>
              <p className="text-red-300/70 text-xs">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skeleton */}
      {isLoading && !dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Sem jogos */}
      {!isLoading && jogosFiltrados.length === 0 && !error && (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-10 text-center">
            <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">Nenhum jogo ao vivo no momento</p>
            <p className="text-gray-500 text-sm mt-1">
              {blockStatus?.blocked
                ? `API em modo de proteção de quota (${blockStatus.brasiliaHour}h Brasília — ativa das 7h às 1h)`
                : "Aguarde o início das partidas ou ajuste os filtros"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid de jogos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {jogosFiltrados.map(({ fixture, oportunidades }) => {
          const st = fixture.fixture.status;
          const isLive = ["1H", "2H", "ET", "P", "HT"].includes(st.short);
          const melhorOp = oportunidades[0];

          return (
            <Card
              key={fixture.fixture.id}
              className={`bg-gray-800/50 border-gray-700 cursor-pointer hover:border-green-400/40 transition-all ${
                oportunidades.length > 0 ? "border-green-400/20" : ""
              }`}
              onClick={() => setJogoSelecionado(fixture.fixture.id)}
            >
              <CardContent className="p-3">
                {/* Liga + status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {fixture.league.flag && (
                      <img src={fixture.league.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
                    )}
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">{fixture.league.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLive && (
                      <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                        <Circle className="w-1.5 h-1.5 fill-green-400 animate-pulse" />
                        AO VIVO
                      </span>
                    )}
                    <span className={`text-xs font-bold ${statusColor(st.short)}`}>
                      {statusLabel(st.short, st.elapsed)}
                    </span>
                  </div>
                </div>

                {/* Times + placar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <img src={fixture.teams.home.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                    <span className="text-sm font-semibold text-white truncate">{fixture.teams.home.name}</span>
                  </div>
                  <div className="text-center px-3 flex-shrink-0">
                    <div className="text-xl font-bold text-white">{fixture.goals.home ?? 0}–{fixture.goals.away ?? 0}</div>
                    {fixture.score.halftime.home !== null && (
                      <div className="text-[10px] text-gray-500">HT {fixture.score.halftime.home}-{fixture.score.halftime.away}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-semibold text-white truncate text-right">{fixture.teams.away.name}</span>
                    <img src={fixture.teams.away.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                  </div>
                </div>

                {/* Últimos eventos */}
                {fixture.events && fixture.events.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {fixture.events.slice(-4).map((ev, i) => <EventoBadge key={i} ev={ev} />)}
                  </div>
                )}

                {/* Melhor oportunidade */}
                {melhorOp && (
                  <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border mt-1 ${urgenciaStyle(melhorOp.urgencia)}`}>
                    <div className="flex items-center gap-1.5">
                      <TipoIcon tipo={melhorOp.tipo} />
                      <span className="font-semibold truncate max-w-[120px]">{melhorOp.mercado}</span>
                      {oportunidades.length > 1 && (
                        <Badge className="text-[9px] bg-current/20 px-1 h-4">{oportunidades.length}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span>@{melhorOp.odd.toFixed(2)}</span>
                      <span className={melhorOp.ev > 0 ? "text-green-400 font-bold" : "text-red-400"}>
                        EV {melhorOp.ev > 0 ? "+" : ""}{melhorOp.ev.toFixed(1)}%
                      </span>
                      <span className="text-gray-400">{melhorOp.confianca}%</span>
                    </div>
                  </div>
                )}

                {/* Stats resumidas */}
                {fixture.statistics && fixture.statistics.length >= 2 && (
                  <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-gray-700/50 text-center">
                    {[
                      { type: "Total Shots", label: "Chutes" },
                      { type: "Corner Kicks", label: "Escanteios" },
                      { type: "Ball Possession", label: "Posse" },
                    ].map(({ type, label }) => {
                      const h = fixture.statistics![0]?.statistics.find(s => s.type === type)?.value ?? 0;
                      const a = fixture.statistics![1]?.statistics.find(s => s.type === type)?.value ?? 0;
                      return (
                        <div key={type}>
                          <div className="text-xs font-semibold text-white">{h}–{a}</div>
                          <div className="text-[10px] text-gray-500">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ModalJogo fixtureId={jogoSelecionado} open={!!jogoSelecionado} onClose={() => setJogoSelecionado(null)} />
    </div>
  );
}
