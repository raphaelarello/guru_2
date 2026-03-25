import { useState, useCallback, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Activity, RefreshCw, TrendingUp, Zap,
  ChevronRight, Circle, Flame, Thermometer, Timer,
  AlertCircle, CornerDownRight
} from "lucide-react";
import { toast } from "sonner";
import RaphaLayout from "@/components/RaphaLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusLabel(short: string, elapsed: number | null, extra?: number | null): string {
  if (short === "HT") return "Intervalo";
  if (short === "FT") return "Encerrado";
  if (short === "NS") return "Não iniciado";
  if (short === "PST") return "Adiado";
  if (short === "CANC") return "Cancelado";
  if (short === "SUSP") return "Suspenso";
  if (elapsed !== null) {
    if (extra && extra > 0) return `${elapsed}+${extra}'`;
    return `${elapsed}'`;
  }
  return short;
}

function calcularCalor(fixture: any, oportunidades: any[]): {
  score: number;
  nivel: "gelado" | "morno" | "quente" | "vulcao";
  label: string;
  cor: string;
  bgCor: string;
  fatores: string[];
} {
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
  const redCards = events.filter((e: any) => e.type === "Card" && (e.detail?.includes("Red Card") || e.detail?.includes("Yellow Red"))).length;
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

  if (score >= 70) return { score, nivel: "vulcao", label: "🌋 Vulcão", cor: "text-red-400", bgCor: "bg-red-500", fatores };
  if (score >= 45) return { score, nivel: "quente", label: "🔥 Quente", cor: "text-orange-400", bgCor: "bg-orange-500", fatores };
  if (score >= 20) return { score, nivel: "morno", label: "🌡️ Morno", cor: "text-yellow-400", bgCor: "bg-yellow-500", fatores };
  return { score, nivel: "gelado", label: "❄️ Gelado", cor: "text-blue-400", bgCor: "bg-blue-500", fatores };
}

// ─── Barra do Termômetro ──────────────────────────────────────────────────────
function TermometroBar({ score, nivel, showLabel = false }: { score: number; nivel: string; showLabel?: boolean }) {
  const bgCor =
    nivel === "vulcao" ? "bg-gradient-to-r from-red-600 to-pink-500" :
    nivel === "quente" ? "bg-gradient-to-r from-orange-500 to-red-500" :
    nivel === "morno" ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
    "bg-gradient-to-r from-blue-500 to-cyan-400";
  const textCor =
    nivel === "vulcao" ? "text-red-400" :
    nivel === "quente" ? "text-orange-400" :
    nivel === "morno" ? "text-yellow-400" : "text-blue-400";

  return (
    <div className="flex items-center gap-1.5 flex-1">
      <div className="flex-1 h-2 bg-gray-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bgCor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold tabular-nums w-6 text-right ${textCor}`}>{score}</span>
      {showLabel && (
        <span className={`text-[10px] font-bold ${textCor}`}>{
          nivel === "vulcao" ? "Vulcão" :
          nivel === "quente" ? "Quente" :
          nivel === "morno" ? "Morno" : "Gelado"
        }</span>
      )}
    </div>
  );
}

// ─── Mini cartão colorido ─────────────────────────────────────────────────────
function MiniCard({ cor, count = 1 }: { cor: "yellow" | "red"; count?: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-2 h-3 rounded-[2px] shadow-sm ${
            cor === "yellow" ? "bg-yellow-400 shadow-yellow-400/50" : "bg-red-500 shadow-red-500/50"
          }`}
        />
      ))}
    </span>
  );
}

// ─── Timeline de gols ─────────────────────────────────────────────────────────
function GolsTimeline({ events, homeTeamId }: { events: any[]; homeTeamId: number }) {
  const gols = events.filter((e: any) => e.type === "Goal");
  if (gols.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {gols.map((g: any, i: number) => {
        const isHome = g.team?.id === homeTeamId;
        const isOwnGoal = g.detail?.includes("Own Goal");
        const isPenalty = g.detail?.includes("Penalty");
        const playerName = g.player?.name;
        const lastName = playerName ? playerName.split(" ").slice(-1)[0] : null;
        return (
          <span
            key={i}
            title={`${playerName || "Jogador"} — ${g.team?.name} — ${g.time?.elapsed}'${g.time?.extra ? `+${g.time.extra}` : ""}${isOwnGoal ? " (contra)" : isPenalty ? " (pênalti)" : ""}`}
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              isHome
                ? "bg-green-500/15 border-green-500/40 text-green-300"
                : "bg-blue-500/15 border-blue-500/40 text-blue-300"
            }`}
          >
            <span className="text-xs">{isOwnGoal ? "⚽🔴" : isPenalty ? "⚽🥅" : "⚽"}</span>
            {lastName ? (
              <span>{lastName}</span>
            ) : (
              <span className="text-gray-400 italic text-[9px]">{g.team?.name?.split(" ")[0]}</span>
            )}
            <span className="opacity-50 text-[9px]">{g.time?.elapsed}'{g.time?.extra ? `+${g.time.extra}` : ""}</span>
          </span>
        );
      })}
    </div>
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

  const borderGlow =
    calor.nivel === "vulcao" ? "border-red-500/60 shadow-lg shadow-red-500/15" :
    calor.nivel === "quente" ? "border-orange-500/50 shadow-md shadow-orange-500/10" :
    calor.nivel === "morno" ? "border-yellow-500/40" :
    oportunidades.length > 0 ? "border-green-500/30" :
    "border-gray-700/50";

  const bgCard =
    calor.nivel === "vulcao" ? "bg-gradient-to-br from-red-950/50 via-gray-900/95 to-gray-900" :
    calor.nivel === "quente" ? "bg-gradient-to-br from-orange-950/40 via-gray-900/95 to-gray-900" :
    calor.nivel === "morno" ? "bg-gradient-to-br from-yellow-950/30 via-gray-900/95 to-gray-900" :
    "bg-gray-900/80";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] ${borderGlow} ${bgCard}`}
    >
      {/* Liga + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {fixture.league.flag && (
            <img src={fixture.league.flag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
          )}
          <span className="text-[11px] text-gray-400 truncate font-medium">{fixture.league.name}</span>
          {fixture.league.round && (
            <span className="text-[10px] text-gray-600 truncate hidden sm:inline">· {fixture.league.round}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLive ? (
            <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              <Circle className="w-1.5 h-1.5 fill-green-400 animate-pulse" />
              AO VIVO
            </span>
          ) : null}
          <span className={`text-xs font-bold ${
            isLive ? "text-green-400" : st.short === "HT" ? "text-yellow-400" : "text-gray-400"
          }`}>
            {statusLabel(st.short, st.elapsed, st.extra)}
          </span>
        </div>
      </div>

      {/* Times + placar */}
      <div className="flex items-center gap-3 mb-1">
        {/* Casa */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src={fixture.teams.home.logo} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{fixture.teams.home.name}</p>
            {(yellowHome > 0 || redHome > 0) && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <MiniCard cor="yellow" count={yellowHome} />
                <MiniCard cor="red" count={redHome} />
              </div>
            )}
          </div>
        </div>

        {/* Placar central */}
        <div className="text-center flex-shrink-0 px-2">
          <div className={`text-3xl font-black leading-none tracking-tight ${isLive ? "text-green-400" : "text-white"}`}>
            {fixture.goals.home ?? 0}–{fixture.goals.away ?? 0}
          </div>
          {fixture.score.halftime.home !== null && (
            <div className="text-[10px] text-gray-600 mt-0.5">HT {fixture.score.halftime.home}-{fixture.score.halftime.away}</div>
          )}
        </div>

        {/* Visitante */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold text-white truncate leading-tight">{fixture.teams.away.name}</p>
            {(yellowAway > 0 || redAway > 0) && (
              <div className="flex items-center gap-0.5 mt-0.5 justify-end">
                <MiniCard cor="yellow" count={yellowAway} />
                <MiniCard cor="red" count={redAway} />
              </div>
            )}
          </div>
          <img src={fixture.teams.away.logo} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
        </div>
      </div>

      {/* Gols com nomes dos jogadores */}
      <GolsTimeline events={events} homeTeamId={homeTeamId} />

      {/* Barra de dados interativos */}
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-700/30 flex-wrap">
        {/* Minuto */}
        {isLive && st.elapsed && (
          <div className="flex items-center gap-1 text-[11px] bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-lg">
            <Timer className="w-3 h-3 text-green-400" />
            <span className="font-bold text-green-400">{statusLabel(st.short, st.elapsed, st.extra)}</span>
          </div>
        )}

        {/* Escanteios */}
        {corners > 0 && (
          <div className="flex items-center gap-1 text-[11px] bg-blue-400/10 border border-blue-400/20 px-2 py-1 rounded-lg">
            <CornerDownRight className="w-3 h-3 text-blue-400" />
            <span className="text-green-300 font-semibold">{cornersHome}</span>
            <span className="text-gray-500 text-[9px]">–</span>
            <span className="text-blue-300 font-semibold">{cornersAway}</span>
            <span className="text-gray-500 text-[9px] ml-0.5">cant.</span>
          </div>
        )}

        {/* Termômetro */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
          <Thermometer className={`w-3 h-3 flex-shrink-0 ${calor.cor}`} />
          <TermometroBar score={calor.score} nivel={calor.nivel} />
          <span className={`text-[10px] font-bold flex-shrink-0 ${calor.cor}`}>
            {calor.nivel === "vulcao" ? "Vulcão" : calor.nivel === "quente" ? "Quente" : calor.nivel === "morno" ? "Morno" : "Gelado"}
          </span>
        </div>
      </div>

      {/* Melhor oportunidade */}
      {melhorOp && (
        <div className={`flex items-center justify-between text-xs px-2.5 py-2 rounded-xl border mt-2.5 ${
          melhorOp.urgencia === "alta" ? "text-red-400 bg-red-400/10 border-red-400/30" :
          melhorOp.urgencia === "media" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
          "text-blue-400 bg-blue-400/10 border-blue-400/30"
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span className="font-semibold truncate">{melhorOp.mercado}</span>
            {oportunidades.length > 1 && (
              <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full flex-shrink-0">+{oportunidades.length - 1}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono">@{melhorOp.odd.toFixed(2)}</span>
            <span className={`font-bold ${melhorOp.ev > 0 ? "text-green-400" : "text-red-400"}`}>
              EV {melhorOp.ev > 0 ? "+" : ""}{melhorOp.ev.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end mt-2">
        <span className="text-[10px] text-gray-600 flex items-center gap-0.5 hover:text-gray-400 transition-colors">
          Ver análise completa <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

// ─── Modal de Análise Completa ────────────────────────────────────────────────
const DETALHES_PT: Record<string, string> = {
  "Normal Goal": "Gol", "Own Goal": "Gol Contra", "Penalty": "Pênalti",
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

  const getStat = (arr: any[], type: string): number => {
    const v = arr.find((s: any) => s.type === type)?.value;
    if (!v) return 0;
    if (typeof v === "string" && v.includes("%")) return parseFloat(v);
    return typeof v === "number" ? v : parseFloat(v) || 0;
  };

  const statsConfig = [
    { api: "Shots on Goal", pt: "Chutes no Gol", icon: "🎯" },
    { api: "Total Shots", pt: "Chutes Totais", icon: "⚡" },
    { api: "Corner Kicks", pt: "Escanteios", icon: "🚩" },
    { api: "Ball Possession", pt: "Posse de Bola", icon: "⚽" },
    { api: "Yellow Cards", pt: "Cartões Amarelos", icon: "🟨" },
    { api: "Red Cards", pt: "Cartões Vermelhos", icon: "🟥" },
    { api: "Fouls", pt: "Faltas", icon: "⚠️" },
    { api: "Goalkeeper Saves", pt: "Defesas do Goleiro", icon: "🧤" },
    { api: "Offsides", pt: "Impedimentos", icon: "🚫" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0a0f1a] border-[#1e2533] text-white max-h-[90vh] overflow-y-auto">
        {isLoading || !fixture ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Carregando análise...</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">
                <div className="flex items-center gap-2">
                  {fixture.league.flag && <img src={fixture.league.flag} alt="" className="w-5 h-4 object-cover rounded" />}
                  <span className="text-sm font-semibold text-gray-300">{fixture.league.name}</span>
                  {["1H", "2H", "ET", "P", "HT"].includes(fixture.fixture.status.short) && (
                    <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full ml-auto">
                      <Circle className="w-1.5 h-1.5 fill-green-400 animate-pulse" />
                      AO VIVO {statusLabel(fixture.fixture.status.short, fixture.fixture.status.elapsed, fixture.fixture.status.extra)}
                    </span>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Placar principal */}
            <div className={`rounded-2xl p-5 border ${
              calor?.nivel === "vulcao" ? "bg-red-950/40 border-red-500/40" :
              calor?.nivel === "quente" ? "bg-orange-950/30 border-orange-500/30" :
              "bg-gray-800/60 border-gray-700/50"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <img src={fixture.teams.home.logo} alt="" className="w-14 h-14 object-contain" />
                  <p className="text-sm font-bold text-white text-center leading-tight">{fixture.teams.home.name}</p>
                </div>
                <div className="text-center px-4">
                  <div className={`text-5xl font-black leading-none tracking-tight ${
                    ["1H", "2H", "ET", "P"].includes(fixture.fixture.status.short) ? "text-green-400" : "text-white"
                  }`}>
                    {fixture.goals.home ?? 0}–{fixture.goals.away ?? 0}
                  </div>
                  {fixture.score.halftime.home !== null && (
                    <div className="text-xs text-gray-500 mt-1">HT {fixture.score.halftime.home}-{fixture.score.halftime.away}</div>
                  )}
                  {calor && (
                    <div className="mt-3">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Thermometer className={`w-4 h-4 ${calor.cor}`} />
                        <span className={`text-sm font-bold ${calor.cor}`}>{calor.label}</span>
                      </div>
                      <div className="w-32 mx-auto">
                        <TermometroBar score={calor.score} nivel={calor.nivel} />
                      </div>
                      {calor.fatores.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {calor.fatores.map((f, i) => (
                            <span key={i} className="text-[9px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded-full">• {f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <img src={fixture.teams.away.logo} alt="" className="w-14 h-14 object-contain" />
                  <p className="text-sm font-bold text-white text-center leading-tight">{fixture.teams.away.name}</p>
                </div>
              </div>
            </div>

            {/* Eventos */}
            {events.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-gray-600 rounded" />
                  Eventos da Partida
                  <span className="w-4 h-0.5 bg-gray-600 rounded" />
                </h4>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {events.map((ev: any, i: number) => {
                    const isHome = ev.team?.id === fixture.teams.home.id;
                    const isGoal = ev.type === "Goal";
                    const isYellow = ev.type === "Card" && ev.detail?.includes("Yellow") && !ev.detail?.includes("Red");
                    const isRed = ev.type === "Card" && (ev.detail?.includes("Red Card") || ev.detail?.includes("Yellow Red"));
                    const isSubst = ev.type === "subst";
                    const playerName = ev.player?.name;
                    const assistName = ev.assist?.name;
                    const detailPt = DETALHES_PT[ev.detail] || ev.detail;

                    return (
                      <div key={i} className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs ${
                        isGoal ? "bg-green-500/10 border border-green-500/20" :
                        isRed ? "bg-red-500/10 border border-red-500/20" :
                        isYellow ? "bg-yellow-500/10 border border-yellow-500/20" :
                        "bg-gray-800/40 border border-gray-700/30"
                      } ${isHome ? "" : "flex-row-reverse"}`}>
                        <span className="text-base flex-shrink-0">
                          {isGoal ? (ev.detail?.includes("Own Goal") ? "⚽🔴" : ev.detail?.includes("Penalty") ? "⚽🥅" : "⚽") :
                           isYellow ? "🟨" : isRed ? "🟥" : isSubst ? "🔄" : ev.type === "Var" ? "📺" : "📋"}
                        </span>
                        <div className={`flex-1 min-w-0 ${isHome ? "" : "text-right"}`}>
                          <span className="font-semibold text-white">
                            {playerName || ev.team?.name || "—"}
                          </span>
                          {isGoal && assistName && (
                            <span className="text-gray-400 ml-1 text-[10px]">(assist: {assistName})</span>
                          )}
                          {isSubst && assistName && (
                            <span className="text-gray-400 ml-1 text-[10px]">↔ {assistName}</span>
                          )}
                          <span className="text-gray-500 ml-1">— {detailPt}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                          {ev.time?.elapsed}'{ev.time?.extra ? `+${ev.time.extra}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estatísticas */}
            {(statsH.length > 0 || statsA.length > 0) && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-gray-600 rounded" />
                  Estatísticas
                  <span className="w-4 h-0.5 bg-gray-600 rounded" />
                </h4>
                <div className="space-y-2.5">
                  {statsConfig.map(({ api, pt, icon }) => {
                    const hVal = getStat(statsH, api);
                    const aVal = getStat(statsA, api);
                    if (hVal === 0 && aVal === 0) return null;
                    const total = hVal + aVal;
                    const hPct = total > 0 ? (hVal / total) * 100 : 50;
                    const isPct = api === "Ball Possession";
                    return (
                      <div key={api}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-green-300">{hVal}{isPct ? "%" : ""}</span>
                          <span className="text-gray-400 flex items-center gap-1">{icon} {pt}</span>
                          <span className="font-bold text-blue-300">{aVal}{isPct ? "%" : ""}</span>
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-700/60">
                          <div className="bg-green-500 transition-all duration-500 rounded-l-full" style={{ width: `${hPct}%` }} />
                          <div className="bg-blue-500 transition-all duration-500 rounded-r-full" style={{ width: `${100 - hPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    {fixture.teams.home.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {fixture.teams.away.name}
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  </span>
                </div>
              </div>
            )}

            {/* Oportunidades */}
            {ops.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-gray-600 rounded" />
                  Sinais Detectados pela IA ({ops.length})
                  <span className="w-4 h-0.5 bg-gray-600 rounded" />
                </h4>
                <div className="space-y-2">
                  {ops.map((op: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl border ${
                      op.urgencia === "alta" ? "bg-red-500/10 border-red-500/30" :
                      op.urgencia === "media" ? "bg-yellow-500/10 border-yellow-500/30" :
                      "bg-blue-500/10 border-blue-500/30"
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">{op.mercado}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-300">@{op.odd?.toFixed(2)}</span>
                          <span className={`text-xs font-bold ${op.ev > 0 ? "text-green-400" : "text-red-400"}`}>
                            EV {op.ev > 0 ? "+" : ""}{op.ev?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Progress value={op.confianca} className="flex-1 h-1.5" />
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{op.confianca}% conf.</span>
                      </div>
                      {op.motivos?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {op.motivos.slice(0, 3).map((m: string, j: number) => (
                            <span key={j} className="text-[9px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded-full">• {m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
                <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                Atualizando dados...
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Card de Estatística Clicável ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  bgColor,
  active,
  onClick,
}: {
  icon: any;
  value: number | string;
  label: string;
  color: string;
  bgColor: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] ${
        active
          ? `border-current/50 shadow-md ${bgColor}/10`
          : "border-gray-700/60 bg-gray-900/60 hover:border-gray-600"
      }`}
      style={active ? { borderColor: "currentColor" } : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? `${bgColor}/20` : "bg-gray-800"}`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        {active && (
          <span className="text-[9px] text-green-400 font-bold bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full">ATIVO</span>
        )}
      </div>
      <div className={`text-2xl font-black leading-none mb-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-400 font-medium">{label}</div>
    </button>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
type FiltroAtivo = "todos" | "quentes" | "sinal";

export default function AoVivo() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [ultimaAtt, setUltimaAtt] = useState(new Date());

  // Deep link: abrir modal automaticamente via ?fixture=ID na URL (ex: notificação push)
  const fixtureIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("fixture");
    return id ? parseInt(id, 10) : null;
  }, []);
  const [jogoSelecionado, setJogoSelecionado] = useState<number | null>(fixtureIdFromUrl);

  // Limpar o parâmetro da URL após abrir o modal (sem recarregar a página)
  useEffect(() => {
    if (fixtureIdFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("fixture");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fixtureIdFromUrl]);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>("todos");
  const [ligaSelecionada, setLigaSelecionada] = useState<number | null>(null);
  const [ordenacao, setOrdenacao] = useState<"calor" | "oportunidades" | "minuto" | "gols">("calor");

  const { data: dashboard, isLoading, error, refetch } = trpc.football.dashboardAoVivo.useQuery(undefined, {
    refetchInterval: autoRefresh ? 15000 : false,
    onSuccess: () => setUltimaAtt(new Date()),
  } as any);

  const handleRefresh = useCallback(async () => {
    await refetch();
    setUltimaAtt(new Date());
    toast.success("Dados atualizados!");
  }, [refetch]);

  // Enriquecer jogos com calor calculado
  const jogosEnriquecidos = useMemo(() => {
    return (dashboard?.jogos || []).map((j: any) => ({
      ...j,
      calor: calcularCalor(j.fixture, j.oportunidades),
    }));
  }, [dashboard?.jogos]);

  // Ligas disponíveis
  const ligasDisponiveis = useMemo(() => {
    const seen = new Set<number>();
    return jogosEnriquecidos
      .filter((j: any) => {
        if (seen.has(j.fixture.league.id)) return false;
        seen.add(j.fixture.league.id);
        return true;
      })
      .map((j: any) => ({ id: j.fixture.league.id, name: j.fixture.league.name, flag: j.fixture.league.flag }));
  }, [jogosEnriquecidos]);

  // Filtrar e ordenar
  const jogosFiltrados = useMemo(() => {
    let jogos = jogosEnriquecidos;
    if (ligaSelecionada) jogos = jogos.filter((j: any) => j.fixture.league.id === ligaSelecionada);
    if (filtroAtivo === "quentes") jogos = jogos.filter((j: any) => j.calor.nivel === "quente" || j.calor.nivel === "vulcao");
    else if (filtroAtivo === "sinal") jogos = jogos.filter((j: any) => j.totalOportunidades > 0);

    return [...jogos].sort((a: any, b: any) => {
      if (ordenacao === "calor") return b.calor.score - a.calor.score;
      if (ordenacao === "oportunidades") return b.totalOportunidades - a.totalOportunidades;
      if (ordenacao === "gols") return ((b.fixture.goals.home ?? 0) + (b.fixture.goals.away ?? 0)) - ((a.fixture.goals.home ?? 0) + (a.fixture.goals.away ?? 0));
      if (ordenacao === "minuto") return (b.fixture.fixture.status.elapsed ?? 0) - (a.fixture.fixture.status.elapsed ?? 0);
      return 0;
    });
  }, [jogosEnriquecidos, filtroAtivo, ligaSelecionada, ordenacao]);

  // Métricas
  const totalJogos = jogosEnriquecidos.length;
  const totalOportunidades = jogosEnriquecidos.reduce((s: number, j: any) => s + j.totalOportunidades, 0);
  const jogosQuentes = jogosEnriquecidos.filter((j: any) => j.calor.nivel === "quente" || j.calor.nivel === "vulcao").length;
  const jogosComSinal = jogosEnriquecidos.filter((j: any) => j.totalOportunidades > 0).length;

  // Top 3 mais quentes
  const topQuentes = useMemo(() =>
    [...jogosEnriquecidos].sort((a: any, b: any) => b.calor.score - a.calor.score).slice(0, 3),
  [jogosEnriquecidos]);

  return (
    <RaphaLayout title="Ao Vivo">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Circle className="w-3 h-3 fill-green-400 text-green-400 animate-pulse" />
              Jogos Ao Vivo
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalJogos} jogo{totalJogos !== 1 ? "s" : ""} · Atualizado às {ultimaAtt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                autoRefresh
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-gray-800 border-gray-700 text-gray-400"
              }`}
            >
              <Circle className={`w-1.5 h-1.5 ${autoRefresh ? "fill-green-400" : "fill-gray-500"}`} />
              {autoRefresh ? "Auto ON" : "Auto OFF"}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de estatísticas — TODOS CLICÁVEIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Activity}
            value={totalJogos}
            label="Jogos ao vivo"
            color="text-green-400"
            bgColor="bg-green-500"
            active={filtroAtivo === "todos"}
            onClick={() => setFiltroAtivo("todos")}
          />
          <StatCard
            icon={Zap}
            value={totalOportunidades}
            label="Oportunidades"
            color="text-yellow-400"
            bgColor="bg-yellow-500"
            active={filtroAtivo === "sinal" && false}
            onClick={() => {
              setFiltroAtivo("sinal");
              toast.info("Filtrando jogos com sinais da IA");
            }}
          />
          <StatCard
            icon={Flame}
            value={jogosQuentes}
            label="Jogos quentes"
            color="text-orange-400"
            bgColor="bg-orange-500"
            active={filtroAtivo === "quentes"}
            onClick={() => {
              setFiltroAtivo(filtroAtivo === "quentes" ? "todos" : "quentes");
              if (filtroAtivo !== "quentes") toast.info("Filtrando jogos quentes e vulcão");
            }}
          />
          <StatCard
            icon={TrendingUp}
            value={jogosComSinal}
            label="Jogos c/ sinal"
            color="text-blue-400"
            bgColor="bg-blue-500"
            active={filtroAtivo === "sinal"}
            onClick={() => {
              setFiltroAtivo(filtroAtivo === "sinal" ? "todos" : "sinal");
              if (filtroAtivo !== "sinal") toast.info("Filtrando jogos com sinal da IA");
            }}
          />
        </div>

        {/* Top 3 Mais Quentes */}
        {topQuentes.length > 0 && topQuentes.some((j: any) => j.calor.score > 5) && (
          <div>
            <h3 className="text-xs font-bold text-orange-400 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              Jogos Mais Quentes — Maior Chance de Gol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topQuentes.map((j: any, idx: number) => {
                const calor = j.calor;
                const st = j.fixture.fixture.status;
                const events = j.fixture.events || [];
                const gols = events.filter((e: any) => e.type === "Goal");
                const homeTeamId = j.fixture.teams.home.id;
                return (
                  <button
                    key={j.fixture.fixture.id}
                    onClick={() => setJogoSelecionado(j.fixture.fixture.id)}
                    className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.99] ${
                      idx === 0 ? "bg-gradient-to-br from-red-950/60 to-gray-900/90 border-red-500/50 shadow-lg shadow-red-500/10" :
                      idx === 1 ? "bg-gradient-to-br from-orange-950/50 to-gray-900/90 border-orange-500/40" :
                      "bg-gradient-to-br from-yellow-950/40 to-gray-900/90 border-yellow-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        idx === 0 ? "text-red-400 bg-red-400/10" :
                        idx === 1 ? "text-orange-400 bg-orange-400/10" :
                        "text-yellow-400 bg-yellow-400/10"
                      }`}>{calor.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <img src={j.fixture.teams.home.logo} alt="" className="w-6 h-6 object-contain" />
                      <span className={`text-lg font-black ${["1H","2H","ET","P"].includes(st.short) ? "text-green-400" : "text-white"}`}>
                        {j.fixture.goals.home ?? 0}–{j.fixture.goals.away ?? 0}
                      </span>
                      <img src={j.fixture.teams.away.logo} alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <p className="text-xs text-gray-300 truncate mb-2">
                      {j.fixture.teams.home.name} vs {j.fixture.teams.away.name}
                    </p>
                    {/* Gols com nomes no card quente */}
                    {gols.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {gols.map((g: any, i: number) => {
                          const isHome = g.team?.id === homeTeamId;
                          const lastName = g.player?.name ? g.player.name.split(" ").slice(-1)[0] : g.team?.name?.split(" ")[0];
                          return (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                              isHome ? "text-green-300 bg-green-500/10 border-green-500/20" : "text-blue-300 bg-blue-500/10 border-blue-500/20"
                            }`}>
                              ⚽ {lastName} {g.time?.elapsed}'
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <TermometroBar score={calor.score} nivel={calor.nivel} />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {calor.fatores.slice(0, 3).map((f: string, i: number) => (
                        <span key={i} className="text-[9px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">• {f}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                      <Timer className="w-3 h-3" />
                      <span>{statusLabel(st.short, st.elapsed, st.extra)}</span>
                      {j.totalOportunidades > 0 && (
                        <span className="ml-auto text-green-400 font-bold">{j.totalOportunidades} sinal{j.totalOportunidades !== 1 ? "is" : ""}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtros e ordenação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de liga */}
          <select
            value={ligaSelecionada ?? ""}
            onChange={e => setLigaSelecionada(e.target.value ? Number(e.target.value) : null)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 transition-colors"
          >
            <option value="">🌐 Todas as ligas</option>
            {ligasDisponiveis.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          {/* Filtros rápidos */}
          {(["todos", "quentes", "sinal"] as FiltroAtivo[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltroAtivo(f)}
              className={`text-xs px-3 py-2 rounded-xl border transition-all ${
                filtroAtivo === f
                  ? "bg-green-500/20 border-green-500/50 text-green-400 font-bold"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {f === "todos" ? "⚡ Todos" : f === "quentes" ? "🔥 Quentes" : "🎯 Com sinal"}
            </button>
          ))}

          {/* Ordenação */}
          <select
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value as any)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 transition-colors ml-auto"
          >
            <option value="calor">🌡️ Por calor</option>
            <option value="oportunidades">⚡ Por sinais</option>
            <option value="gols">⚽ Por gols</option>
            <option value="minuto">⏱️ Por minuto</option>
          </select>
        </div>

        {/* Contagem */}
        <p className="text-xs text-gray-500 -mt-2">
          {jogosFiltrados.length} jogo{jogosFiltrados.length !== 1 ? "s" : ""} encontrado{jogosFiltrados.length !== 1 ? "s" : ""}
          {filtroAtivo !== "todos" && ` · filtro: ${filtroAtivo === "quentes" ? "quentes" : "com sinal"}`}
        </p>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar dados. Verifique a chave da API Football.
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Carregando jogos ao vivo...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && jogosFiltrados.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Activity className="w-12 h-12 text-gray-700" />
            <p className="text-sm text-gray-400 font-medium">
              {totalJogos === 0 ? "Nenhum jogo ao vivo no momento" : "Nenhum jogo com os filtros aplicados"}
            </p>
            {filtroAtivo !== "todos" && (
              <button onClick={() => setFiltroAtivo("todos")} className="text-xs text-green-400 hover:underline">
                Remover filtros
              </button>
            )}
          </div>
        )}

        {/* Lista de jogos */}
        {!isLoading && jogosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jogosFiltrados.map((j: any) => (
              <CardJogo
                key={j.fixture.fixture.id}
                jogo={j}
                onClick={() => setJogoSelecionado(j.fixture.fixture.id)}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <ModalJogo fixtureId={jogoSelecionado} open={!!jogoSelecionado} onClose={() => setJogoSelecionado(null)} />
      </div>
    </RaphaLayout>
  );
}
