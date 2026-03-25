import { useState, useCallback, useMemo } from "react";
import { FiltroAvancado, FILTROS_PADRAO, type FiltrosState } from "@/components/FiltroAvancado";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, RefreshCw, Target, TrendingUp, Zap,
  AlertCircle, ChevronRight, Circle, ArrowRight, Swords, Star, Flag,
  Flame, Thermometer, Timer, Wind
} from "lucide-react";
import { toast } from "sonner";
import RaphaLayout from "@/components/RaphaLayout";

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

// ─── Termômetro de Calor ──────────────────────────────────────────────────────
function calcularCalor(fixture: any, oportunidades: any[]): { score: number; nivel: "gelado" | "morno" | "quente" | "vulcao"; label: string; fatores: string[] } {
  const stats = fixture.statistics || [];
  const events = fixture.events || [];
  const st = fixture.fixture?.status;
  const elapsed = st?.elapsed ?? 0;
  const goals = (fixture.goals?.home ?? 0) + (fixture.goals?.away ?? 0);

  const getStat = (teamIdx: number, type: string): number => {
    const v = stats[teamIdx]?.statistics?.find((s: any) => s.type === type)?.value;
    if (!v) return 0;
    if (typeof v === "string" && v.includes("%")) return parseFloat(v);
    return typeof v === "number" ? v : parseFloat(v) || 0;
  };

  const totalShots = getStat(0, "Total Shots") + getStat(1, "Total Shots");
  const shotsOnGoal = getStat(0, "Shots on Goal") + getStat(1, "Shots on Goal");
  const corners = getStat(0, "Corner Kicks") + getStat(1, "Corner Kicks");
  const yellowCards = events.filter((e: any) => e.type === "Card" && e.detail?.includes("Yellow")).length;
  const redCards = events.filter((e: any) => e.type === "Card" && e.detail?.includes("Red")).length;
  const recentGoals = events.filter((e: any) => e.type === "Goal" && e.time?.elapsed >= Math.max(0, elapsed - 15)).length;

  let score = 0;
  const fatores: string[] = [];

  if (shotsOnGoal >= 8) { score += 30; fatores.push(`${shotsOnGoal} chutes no gol`); }
  else if (shotsOnGoal >= 4) { score += 15; fatores.push(`${shotsOnGoal} chutes no gol`); }
  else if (shotsOnGoal >= 2) { score += 8; }

  if (totalShots >= 15) { score += 15; fatores.push(`${totalShots} chutes totais`); }
  else if (totalShots >= 8) { score += 8; }

  if (corners >= 8) { score += 15; fatores.push(`${corners} escanteios`); }
  else if (corners >= 5) { score += 8; fatores.push(`${corners} escanteios`); }
  else if (corners >= 3) { score += 4; }

  if (recentGoals >= 2) { score += 20; fatores.push(`${recentGoals} gols recentes`); }
  else if (recentGoals >= 1) { score += 12; fatores.push("gol recente"); }

  if (goals >= 4) { score += 15; fatores.push(`${goals} gols`); }
  else if (goals >= 2) { score += 8; }

  if (redCards >= 1) { score += 10; fatores.push(`${redCards} vermelho`); }
  if (yellowCards >= 4) { score += 8; fatores.push(`${yellowCards} amarelos`); }

  if (elapsed >= 75) { score += 10; fatores.push("reta final"); }
  else if (elapsed >= 60) { score += 5; }

  if (oportunidades.length >= 3) { score += 10; fatores.push(`${oportunidades.length} sinais IA`); }
  else if (oportunidades.length >= 1) { score += 5; }

  score = Math.min(100, score);

  let nivel: "gelado" | "morno" | "quente" | "vulcao";
  let label: string;
  if (score >= 75) { nivel = "vulcao"; label = "🌋 Vulcão"; }
  else if (score >= 50) { nivel = "quente"; label = "🔥 Quente"; }
  else if (score >= 25) { nivel = "morno"; label = "🌡️ Morno"; }
  else { nivel = "gelado"; label = "❄️ Gelado"; }

  return { score, nivel, label, fatores };
}

function Termometro({ score, nivel }: { score: number; nivel: string }) {
  const gradient =
    nivel === "vulcao" ? "from-red-500 to-pink-500" :
    nivel === "quente" ? "from-orange-500 to-red-500" :
    nivel === "morno" ? "from-yellow-500 to-orange-400" :
    "from-blue-500 to-cyan-400";
  const textColor =
    nivel === "vulcao" ? "text-red-400" :
    nivel === "quente" ? "text-orange-400" :
    nivel === "morno" ? "text-yellow-400" : "text-cyan-400";

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold ${textColor}`}>{score}</span>
    </div>
  );
}

// ─── Gols com nomes ───────────────────────────────────────────────────────────
function GolsTimeline({ events, homeTeamId }: { events: any[]; homeTeamId: number }) {
  const gols = events.filter((e: any) => e.type === "Goal");
  if (gols.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {gols.map((g: any, i: number) => {
        const isHome = g.team?.id === homeTeamId;
        const isOwnGoal = g.detail?.includes("Own Goal");
        const isPenalty = g.detail?.includes("Penalty");
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              isHome ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}
            title={`${g.player?.name || "?"} ${g.time?.elapsed}'`}
          >
            <span>{isOwnGoal ? "⚽🔴" : isPenalty ? "⚽🥅" : "⚽"}</span>
            <span className="max-w-[70px] truncate">{g.player?.name?.split(" ").slice(-1)[0] || "?"}</span>
            <span className="opacity-60">{g.time?.elapsed}'</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── StatBar ──────────────────────────────────────────────────────────────────
function getStatVal(stats: any[], type: string): string | number {
  const v = stats.find((s: any) => s.type === type)?.value;
  return v ?? 0;
}
function StatBar({ label, home, away }: { label: string; home: string | number; away: string | number }) {
  const parseVal = (v: string | number): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.includes("%")) return parseFloat(v);
    return parseFloat(v as string) || 0;
  };
  const h = parseVal(home);
  const a = parseVal(away);
  const total = h + a;
  const pct = total > 0 ? (h / total) * 100 : 50;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-gray-400">
        <span className="font-medium text-green-400">{home}</span>
        <span>{label}</span>
        <span className="font-medium text-blue-400">{away}</span>
      </div>
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden flex">
        <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${pct}%` }} />
        <div className="h-full bg-blue-500 rounded-r-full transition-all" style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}

// ─── Modal de Jogo ────────────────────────────────────────────────────────────
const DETALHES_PT: Record<string, string> = {
  "Normal Goal": "Gol Normal", "Own Goal": "Gol Contra", "Penalty": "Pênalti",
  "Missed Penalty": "Pênalti Perdido", "Yellow Card": "Cartão Amarelo",
  "Red Card": "Cartão Vermelho", "Yellow Red Card": "Segundo Amarelo",
  "Substitution 1": "Substituição", "Substitution 2": "Substituição",
  "Substitution 3": "Substituição", "Substitution 4": "Substituição",
  "Substitution 5": "Substituição", "VAR - Goal cancelled": "VAR - Gol Anulado",
  "VAR - Penalty confirmed": "VAR - Pênalti Confirmado",
  "VAR - Penalty cancelled": "VAR - Pênalti Anulado",
  "VAR - Red card": "VAR - Cartão Vermelho", "Goal cancelled": "Gol Anulado",
};

function ModalJogo({ fixtureId, open, onClose }: { fixtureId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = trpc.football.analisarJogo.useQuery(
    { fixtureId: fixtureId! },
    { enabled: !!fixtureId && open, refetchInterval: 15000 }
  );
  if (!open || !fixtureId) return null;
  const fixture = data?.fixture;
  const ops = data?.oportunidades || [];
  const statsH = (data?.stats || [])[0]?.statistics || [];
  const statsA = (data?.stats || [])[1]?.statistics || [];
  const events = fixture?.events || [];
  const calor = fixture ? calcularCalor(fixture, ops) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0a0f1a] border-[#1e2533] text-white max-h-[90vh] overflow-y-auto">
        {isLoading || !fixture ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-green-400 animate-spin" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                {fixture.league.flag && <img src={fixture.league.flag} alt="" className="w-5 h-4 object-cover rounded-sm" />}
                <span className="text-xs text-gray-400">{fixture.league.name} — {fixture.league.round}</span>
              </div>
              <DialogTitle className="text-base font-bold text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={fixture.teams.home.logo} alt="" className="w-7 h-7 object-contain" />
                    <span className="text-sm">{fixture.teams.home.name}</span>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-2xl font-black text-green-400">{fixture.goals.home ?? 0}–{fixture.goals.away ?? 0}</div>
                    <div className={`text-xs font-bold ${statusColor(fixture.fixture.status.short)}`}>
                      {statusLabel(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{fixture.teams.away.name}</span>
                    <img src={fixture.teams.away.logo} alt="" className="w-7 h-7 object-contain" />
                  </div>
                </div>
              </DialogTitle>
              {calor && (
                <div className="flex items-center gap-3 mt-2 p-2 bg-gray-800/50 rounded-lg">
                  <Thermometer className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-orange-400">{calor.label}</span>
                      <span className="text-xs text-gray-400">{calor.score}/100</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          calor.nivel === "vulcao" ? "bg-gradient-to-r from-red-500 to-pink-500" :
                          calor.nivel === "quente" ? "bg-gradient-to-r from-orange-500 to-red-500" :
                          calor.nivel === "morno" ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
                          "bg-gradient-to-r from-blue-500 to-cyan-400"
                        }`}
                        style={{ width: `${calor.score}%` }}
                      />
                    </div>
                    {calor.fatores.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {calor.fatores.map((f, i) => (
                          <span key={i} className="text-[9px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-1.5 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                  Eventos ({events.length})
                </TabsTrigger>
                <TabsTrigger value="predicao" className="text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                  Predição
                </TabsTrigger>
              </TabsList>

              <TabsContent value="oportunidades" className="space-y-2 mt-3">
                {ops.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Nenhuma oportunidade detectada no momento.</p>
                ) : ops.map((op: any, i: number) => (
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
                      {op.motivos.map((m: string, j: number) => (
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
                {statsH.length === 0 && statsA.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Estatísticas não disponíveis para esta partida.</p>
                ) : (
                  [
                    { api: "Ball Possession", pt: "Posse de Bola" },
                    { api: "Total Shots", pt: "Chutes Totais" },
                    { api: "Shots on Goal", pt: "Chutes no Gol" },
                    { api: "Shots off Goal", pt: "Chutes Fora" },
                    { api: "Corner Kicks", pt: "Escanteios" },
                    { api: "Fouls", pt: "Faltas" },
                    { api: "Yellow Cards", pt: "Cartões Amarelos" },
                    { api: "Red Cards", pt: "Cartões Vermelhos" },
                    { api: "Offsides", pt: "Impedimentos" },
                    { api: "Total passes", pt: "Passes Totais" },
                    { api: "Passes accurate", pt: "Passes Certos" },
                    { api: "Goalkeeper Saves", pt: "Defesas do Goleiro" },
                  ].map(({ api, pt }) => (
                    <StatBar key={api} label={pt} home={getStatVal(statsH, api)} away={getStatVal(statsA, api)} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="eventos" className="mt-3">
                {events.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Nenhum evento registrado ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...events].reverse().map((ev: any, i: number) => {
                      const isGoal = ev.type === "Goal";
                      const isYellow = ev.type === "Card" && ev.detail?.includes("Yellow") && !ev.detail?.includes("Red");
                      const isRed = ev.type === "Card" && (ev.detail?.includes("Red Card") || ev.detail?.includes("Yellow Red"));
                      const isHome = ev.team?.id === fixture.teams.home.id;
                      return (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                          isGoal ? "bg-green-500/10 border border-green-500/20" :
                          isRed ? "bg-red-500/10 border border-red-500/20" :
                          isYellow ? "bg-yellow-500/10 border border-yellow-500/20" :
                          "bg-gray-800/50"
                        }`}>
                          <span className="w-8 text-center font-bold text-gray-400 flex-shrink-0">{ev.time?.elapsed}'</span>
                          <span className="text-base flex-shrink-0">
                            {isGoal ? "⚽" : isYellow ? "🟨" : isRed ? "🟥" : ev.type === "subst" ? "🔄" : ev.type === "Var" ? "📺" : "•"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className={`font-semibold truncate ${isHome ? "text-green-300" : "text-blue-300"}`}>
                                {ev.player?.name || ev.team?.name || "—"}
                              </span>
                              {ev.assist?.name && (
                                <span className="text-gray-500 text-[10px]">({ev.assist.name})</span>
                              )}
                            </div>
                            <span className="text-gray-500 text-[10px]">
                              {DETALHES_PT[ev.detail] ?? ev.detail} — {isHome ? fixture.teams.home.name : fixture.teams.away.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="predicao" className="mt-3">
                {(() => {
                  const pred = data?.prediction as any;
                  if (!pred) return <p className="text-gray-400 text-center py-8 text-sm">Predição não disponível.</p>;
                  const p = pred.predictions || pred;
                  return (
                    <div className="space-y-3">
                      {p.advice && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <p className="text-green-400 font-semibold text-sm">💡 {p.advice}</p>
                        </div>
                      )}
                      {p.winner?.name && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Favorito:</span>
                          <span className="font-bold text-white">{p.winner.name}</span>
                          {p.winner.comment && <span className="text-gray-400 text-xs">({p.winner.comment})</span>}
                        </div>
                      )}
                      {p.goals?.home !== undefined && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-green-400">{p.goals.home}</div>
                            <div className="text-[10px] text-gray-400">Gols esperados (casa)</div>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-blue-400">{p.goals.away}</div>
                            <div className="text-[10px] text-gray-400">Gols esperados (visit.)</div>
                          </div>
                        </div>
                      )}
                      {p.percent && (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Casa Vence", value: p.percent.home, color: "text-green-400" },
                            { label: "Empate", value: p.percent.draw, color: "text-yellow-400" },
                            { label: "Visit. Vence", value: p.percent.away, color: "text-blue-400" },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-gray-800/50 rounded-lg p-2 text-center">
                              <div className={`text-base font-bold ${color}`}>{value}</div>
                              <div className="text-[10px] text-gray-400">{label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Card de Jogo ─────────────────────────────────────────────────────────────
function CardJogo({ jogo, onClick }: { jogo: any; onClick: () => void }) {
  const { fixture, oportunidades } = jogo;
  const st = fixture.fixture.status;
  const isLive = ["1H", "2H", "ET", "P", "HT"].includes(st.short);
  const melhorOp = oportunidades[0];
  const events = fixture.events || [];
  const stats = fixture.statistics || [];
  const homeTeamId = fixture.teams.home.id;

  const calor = calcularCalor(fixture, oportunidades);

  const getStat = (teamIdx: number, type: string): number => {
    const v = stats[teamIdx]?.statistics?.find((s: any) => s.type === type)?.value;
    if (!v) return 0;
    if (typeof v === "string" && v.includes("%")) return parseFloat(v);
    return typeof v === "number" ? v : parseFloat(v) || 0;
  };

  const cornersHome = getStat(0, "Corner Kicks");
  const cornersAway = getStat(1, "Corner Kicks");
  const corners = cornersHome + cornersAway;
  const yellowHome = events.filter((e: any) => e.type === "Card" && e.detail?.includes("Yellow") && !e.detail?.includes("Red") && e.team?.id === homeTeamId).length;
  const yellowAway = events.filter((e: any) => e.type === "Card" && e.detail?.includes("Yellow") && !e.detail?.includes("Red") && e.team?.id !== homeTeamId).length;
  const redHome = events.filter((e: any) => e.type === "Card" && (e.detail?.includes("Red Card") || e.detail?.includes("Yellow Red")) && e.team?.id === homeTeamId).length;
  const redAway = events.filter((e: any) => e.type === "Card" && (e.detail?.includes("Red Card") || e.detail?.includes("Yellow Red")) && e.team?.id !== homeTeamId).length;
  const totalCards = yellowHome + yellowAway + redHome + redAway;

  const borderClass =
    calor.nivel === "vulcao" ? "border-red-500/60 shadow-red-500/20 shadow-lg" :
    calor.nivel === "quente" ? "border-orange-500/40 shadow-orange-500/10 shadow-md" :
    calor.nivel === "morno" ? "border-yellow-500/30" :
    oportunidades.length > 0 ? "border-green-400/20" : "border-gray-700";

  return (
    <Card
      className={`bg-gray-900/80 border cursor-pointer hover:scale-[1.01] transition-all duration-200 active:scale-[0.99] ${borderClass}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Liga + status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {fixture.league.flag && (
              <img src={fixture.league.flag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
            )}
            <span className="text-[10px] text-gray-400 truncate">{fixture.league.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <img src={fixture.teams.home.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">{fixture.teams.home.name}</span>
          </div>
          <div className="text-center px-3 flex-shrink-0">
            <div className={`text-2xl font-black ${isLive ? "text-green-400" : "text-white"}`}>
              {fixture.goals.home ?? 0}–{fixture.goals.away ?? 0}
            </div>
            {fixture.score.halftime.home !== null && (
              <div className="text-[10px] text-gray-500">HT {fixture.score.halftime.home}-{fixture.score.halftime.away}</div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className="text-sm font-semibold text-white truncate text-right">{fixture.teams.away.name}</span>
            <img src={fixture.teams.away.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
          </div>
        </div>

        {/* Gols com nomes dos jogadores */}
        <GolsTimeline events={events} homeTeamId={homeTeamId} />

        {/* Dados interativos: minuto, escanteios, cartões, termômetro */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50 flex-wrap gap-1">
          {isLive && st.elapsed && (
            <div className="flex items-center gap-1 text-[10px]">
              <Timer className="w-3 h-3 text-green-400" />
              <span className="font-bold text-green-400">{st.elapsed}'</span>
            </div>
          )}
          {corners > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-300">
              <Wind className="w-3 h-3 text-blue-400" />
              <span className="text-green-300 font-medium">{cornersHome}</span>
              <span className="text-gray-500">–</span>
              <span className="text-blue-300 font-medium">{cornersAway}</span>
              <span className="text-gray-500 ml-0.5">cant.</span>
            </div>
          )}
          {totalCards > 0 && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(yellowHome, 3) }).map((_, i) => (
                <span key={`yh${i}`} className="inline-block w-2 h-3 bg-yellow-400 rounded-[2px] shadow-sm shadow-yellow-400/50" title={`${yellowHome} amarelo(s) casa`} />
              ))}
              {Array.from({ length: Math.min(redHome, 2) }).map((_, i) => (
                <span key={`rh${i}`} className="inline-block w-2 h-3 bg-red-500 rounded-[2px] shadow-sm shadow-red-500/50" title={`${redHome} vermelho(s) casa`} />
              ))}
              {(yellowHome + redHome > 0 && yellowAway + redAway > 0) && <span className="text-gray-600 text-[10px] mx-0.5">|</span>}
              {Array.from({ length: Math.min(yellowAway, 3) }).map((_, i) => (
                <span key={`ya${i}`} className="inline-block w-2 h-3 bg-yellow-400 rounded-[2px] shadow-sm shadow-yellow-400/50" title={`${yellowAway} amarelo(s) visit.`} />
              ))}
              {Array.from({ length: Math.min(redAway, 2) }).map((_, i) => (
                <span key={`ra${i}`} className="inline-block w-2 h-3 bg-red-500 rounded-[2px] shadow-sm shadow-red-500/50" title={`${redAway} vermelho(s) visit.`} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-400" />
            <Termometro score={calor.score} nivel={calor.nivel} />
          </div>
        </div>

        {/* Melhor oportunidade */}
        {melhorOp && (
          <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border mt-2 ${urgenciaStyle(melhorOp.urgencia)}`}>
            <div className="flex items-center gap-1.5">
              <TipoIcon tipo={melhorOp.tipo} />
              <span className="font-semibold truncate max-w-[120px]">{melhorOp.mercado}</span>
              {oportunidades.length > 1 && (
                <span className="text-[9px] bg-current/20 px-1 rounded">{oportunidades.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span>@{melhorOp.odd.toFixed(2)}</span>
              <span className={melhorOp.ev > 0 ? "text-green-400 font-bold" : "text-red-400"}>
                EV {melhorOp.ev > 0 ? "+" : ""}{melhorOp.ev.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end mt-1.5">
          <span className="text-[9px] text-gray-600 flex items-center gap-0.5">
            Ver análise completa <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AoVivo() {
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_PADRAO);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [ultimaAtt, setUltimaAtt] = useState(new Date());
  const [jogoSelecionado, setJogoSelecionado] = useState<number | null>(null);
  const [ordenacao, setOrdenacao] = useState<"calor" | "oportunidades" | "minuto">("calor");

  const { data: dashboard, isLoading, error, refetch } = trpc.football.dashboardAoVivo.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
    onSuccess: () => setUltimaAtt(new Date()),
  } as any);
  const { data: blockStatus } = trpc.football.blockStatus.useQuery(undefined, { refetchInterval: 60000 });

  const handleRefresh = useCallback(async () => {
    await refetch();
    setUltimaAtt(new Date());
    toast.success("Dados atualizados!");
  }, [refetch]);

  const ligasDisponiveis = useMemo(() =>
    dashboard?.jogos ? Array.from(new Set(dashboard.jogos.map((j: any) => j.fixture.league.id))) : [],
  [dashboard?.jogos]);

  const jogosFiltradosOrdenados = useMemo(() => {
    let jogos = (dashboard?.jogos || []).filter((j: any) => {
      if (filtros.ligas.length > 0 && !filtros.ligas.includes(j.fixture.league.id)) return false;
      if (filtros.soComSinal && j.totalOportunidades === 0) return false;
      if (filtros.confiancaMin > 0) {
        const maxConf = Math.max(...(j.oportunidades || []).map((o: any) => o.confianca), 0);
        if (maxConf < filtros.confiancaMin) return false;
      }
      if (filtros.mercados.length > 0) {
        const temMercado = (j.oportunidades || []).some((o: any) => filtros.mercados.includes(o.tipo));
        if (!temMercado) return false;
      }
      if (filtros.urgencia.length > 0) {
        const temUrgencia = (j.oportunidades || []).some((o: any) => filtros.urgencia.includes(o.urgencia));
        if (!temUrgencia) return false;
      }
      return true;
    });

    jogos = jogos.sort((a: any, b: any) => {
      if (ordenacao === "calor") {
        const ca = calcularCalor(a.fixture, a.oportunidades);
        const cb = calcularCalor(b.fixture, b.oportunidades);
        return cb.score - ca.score;
      }
      if (ordenacao === "oportunidades") return b.totalOportunidades - a.totalOportunidades;
      if (ordenacao === "minuto") return (b.fixture.fixture.status.elapsed ?? 0) - (a.fixture.fixture.status.elapsed ?? 0);
      return 0;
    });

    return jogos;
  }, [dashboard?.jogos, filtros, ordenacao]);

  const topQuentes = useMemo(() => {
    if (!dashboard?.jogos) return [];
    return [...dashboard.jogos]
      .map((j: any) => ({ ...j, calor: calcularCalor(j.fixture, j.oportunidades) }))
      .sort((a: any, b: any) => b.calor.score - a.calor.score)
      .slice(0, 3);
  }, [dashboard?.jogos]);

  return (
    <RaphaLayout title="Ao Vivo">
      <div className="space-y-4">
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
            <p className="text-gray-400 text-xs mt-0.5">
              Dados reais em tempo real · Atualizado às {ultimaAtt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {blockStatus?.blocked && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Quota pausada ({(blockStatus as any).brasiliaHour}h)
              </Badge>
            )}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              {[
                { key: "calor", label: "🌡️ Calor" },
                { key: "oportunidades", label: "⚡ Sinais" },
                { key: "minuto", label: "⏱️ Minuto" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setOrdenacao(key as any)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    ordenacao === key ? "bg-green-500/20 text-green-400 font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
            { icon: Flame, color: "text-orange-400", value: topQuentes.filter((j: any) => j.calor.nivel === "quente" || j.calor.nivel === "vulcao").length, label: "Jogos quentes" },
            { icon: TrendingUp, color: "text-blue-400", value: (dashboard?.jogos || []).filter((j: any) => j.totalOportunidades > 0).length, label: "Jogos c/ sinal" },
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

        {/* Top 3 Mais Quentes */}
        {topQuentes.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-orange-400 flex items-center gap-1.5 mb-2">
              <Flame className="w-3.5 h-3.5" />
              Jogos Mais Quentes — Maior Chance de Gol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {topQuentes.map((j: any, idx: number) => (
                <button
                  key={j.fixture.fixture.id}
                  onClick={() => setJogoSelecionado(j.fixture.fixture.id)}
                  className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.99] ${
                    idx === 0 ? "bg-red-500/10 border-red-500/40" :
                    idx === 1 ? "bg-orange-500/10 border-orange-500/30" :
                    "bg-yellow-500/10 border-yellow-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                    <span className={`text-xs font-bold ${idx === 0 ? "text-red-400" : idx === 1 ? "text-orange-400" : "text-yellow-400"}`}>
                      {j.calor.label}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {j.fixture.teams.home.name} {j.fixture.goals.home ?? 0}–{j.fixture.goals.away ?? 0} {j.fixture.teams.away.name}
                  </div>
                  <div className="mt-1.5">
                    <Termometro score={j.calor.score} nivel={j.calor.nivel} />
                  </div>
                  <div className="mt-1">
                    {j.calor.fatores.slice(0, 2).map((f: string, i: number) => (
                      <span key={i} className="inline-block text-[9px] text-gray-400 mr-1">• {f}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtros Avançados */}
        <div className="space-y-2">
          <FiltroAvancado
            filtros={filtros}
            onChange={setFiltros}
            ligasDisponiveis={ligasDisponiveis}
            mostrarMercados
            mostrarUrgencia
            mostrarSoComSinal
          />
          <p className="text-xs text-gray-500">{jogosFiltradosOrdenados.length} jogo(s) encontrado(s)</p>
        </div>

        {/* Erro */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-300 text-sm">Erro ao carregar dados. Verifique a chave da API Football.</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
              <p className="text-gray-400 text-sm">Carregando jogos ao vivo...</p>
            </div>
          </div>
        )}

        {!isLoading && jogosFiltradosOrdenados.length === 0 && !error && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum jogo ao vivo no momento</p>
            <p className="text-gray-600 text-xs mt-1">Os dados são atualizados automaticamente a cada 10 segundos</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jogosFiltradosOrdenados.map((jogo: any) => (
            <CardJogo
              key={jogo.fixture.fixture.id}
              jogo={jogo}
              onClick={() => setJogoSelecionado(jogo.fixture.fixture.id)}
            />
          ))}
        </div>

        <ModalJogo fixtureId={jogoSelecionado} open={!!jogoSelecionado} onClose={() => setJogoSelecionado(null)} />
      </div>
    </RaphaLayout>
  );
}
