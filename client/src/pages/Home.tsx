
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  CalendarDays,
  Clock3,
  Flame,
  ShieldAlert,
  Sparkles,
  Timer,
  Trophy,
  Wallet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";

type Match = {
  id: number;
  league?: { id?: number; name?: string; logo?: string };
  homeTeam?: { id?: number; name?: string; logo?: string };
  awayTeam?: { id?: number; name?: string; logo?: string };
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  minute?: number;
  stadium?: string;
  startTime?: string;
  events?: Array<{ type?: string; minute?: number; player?: string; detail?: string; team?: string }>;
};

const statusMap: Record<string, string> = {
  NS: "Agendado",
  "1H": "1º Tempo",
  "2H": "2º Tempo",
  HT: "Intervalo",
  FT: "Encerrado",
  ET: "Prorrogação",
  PST: "Adiado",
};

function formatClock(iso?: string) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function parseStatValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value.replace("%", "")) || 0;
  return 0;
}

function getStatValue(statistics: any[] | undefined, teamName: string | undefined, type: string) {
  if (!statistics?.length || !teamName) return 0;
  const teamStats = statistics.find((item: any) => item.team === teamName || item.team?.name === teamName);
  const stat = teamStats?.stats?.find((entry: any) => entry.type === type) ?? teamStats?.statistics?.find((entry: any) => entry.type === type);
  return parseStatValue(stat?.value);
}

function getEventsByType(events: any[] | undefined, kind: "Goal" | "Card") {
  return (events ?? []).filter((event: any) => event.type === kind);
}

function eventLabel(event: any) {
  const detail = String(event?.detail ?? "");
  if (event?.type === "Goal") {
    if (detail.includes("Own")) return "Gol contra";
    if (detail.includes("Penalty")) return "Gol de pênalti";
    return "Gol";
  }
  if (event?.type === "Card") {
    if (detail.includes("Red")) return "Cartão vermelho";
    return "Cartão amarelo";
  }
  return detail || event?.type || "Evento";
}

function eventTone(event: any) {
  const detail = String(event?.detail ?? "");
  if (event?.type === "Goal") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (event?.type === "Card" && detail.includes("Red")) return "border-red-500/30 bg-red-500/10 text-red-200";
  if (event?.type === "Card") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-white/10 bg-white/[0.03] text-white";
}

function matchHeat(match: Match) {
  let score = 35;
  if (["1H", "2H", "HT"].includes(match.status ?? "")) score += 28;
  if (((match.homeScore ?? 0) + (match.awayScore ?? 0)) >= 3) score += 18;
  if ((match.events?.length ?? 0) >= 3) score += 12;
  if ((match.minute ?? 0) >= 60) score += 8;
  return Math.min(score, 98);
}

function NavigationCard({
  title,
  subtitle,
  metric,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  metric: string | number;
  icon: any;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="sports-surface surface-hover rounded-[28px] p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-xl font-black">{metric}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </button>
  );
}

function MatchTile({ match, active, onClick }: { match: Match; active: boolean; onClick: () => void }) {
  const live = ["1H", "2H", "HT"].includes(match.status ?? "");
  const heat = matchHeat(match);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
        active
          ? "border-primary/30 bg-primary/10 shadow-[0_18px_42px_rgba(124,255,93,0.1)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{match.stadium ?? "Estádio"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{live ? "Ao vivo" : formatClock(match.startTime)}</p>
        </div>
        <span className={`chip ${live ? "chip-live" : "chip-info"}`}>
          {live ? `${match.minute ?? 0}'` : statusMap[match.status ?? "NS"] ?? (match.status ?? "Status")}
        </span>
      </div>

      {[
        { team: match.homeTeam, score: match.homeScore },
        { team: match.awayTeam, score: match.awayScore },
      ].map((entry, index) => (
        <div key={index} className="flex items-center gap-3 py-1.5">
          {entry.team?.logo ? <img src={entry.team.logo} alt="" className="size-8 rounded-full bg-white/5 p-0.5" /> : <div className="size-8 rounded-full bg-white/8" />}
          <span className="flex-1 text-sm font-semibold">{entry.team?.name ?? "Time"}</span>
          <span className="text-2xl font-black">{entry.score ?? 0}</span>
        </div>
      ))}

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>Heat</span>
          <span>{heat}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-primary to-red-400" style={{ width: `${heat}%` }} />
        </div>
      </div>
    </button>
  );
}

export function Home() {
  const [, navigate] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [leagueFilter, setLeagueFilter] = useState("todas");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: liveMatches = [] } = trpc.matches.getLive.useQuery(undefined, { refetchInterval: 10000 });
  const { data: dayMatches = [] } = trpc.matches.getByDate.useQuery({ date }, { refetchInterval: 15000 });
  const { data: selectedDetails } = trpc.matches.getDetails.useQuery(
    { fixtureId: selectedId ?? 0 },
    { enabled: !!selectedId, refetchInterval: 10000 }
  );

  const matches = useMemo<Match[]>(() => {
    const merged = [...liveMatches, ...dayMatches] as Match[];
    const seen = new Set<number>();
    return merged
      .filter(match => {
        if (seen.has(match.id)) return false;
        seen.add(match.id);
        return true;
      })
      .sort((a, b) => {
        const order = { "1H": 0, "2H": 0, HT: 1, NS: 2, FT: 3 } as Record<string, number>;
        const aOrder = order[a.status ?? ""] ?? 9;
        const bOrder = order[b.status ?? ""] ?? 9;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime();
      });
  }, [dayMatches, liveMatches]);

  const leagueOptions = useMemo(() => {
    const unique = new Map<string, string>();
    matches.forEach(match => {
      if (match.league?.name) unique.set(match.league.name, match.league.name);
    });
    return Array.from(unique.values()).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (leagueFilter === "todas") return matches;
    return matches.filter(match => match.league?.name === leagueFilter);
  }, [leagueFilter, matches]);

  const selectedMatch = filteredMatches.find(match => match.id === selectedId) ?? filteredMatches[0] ?? null;
  const details = selectedDetails ?? selectedMatch ?? null;

  useEffect(() => {
    if (!filteredMatches.length) return;
    if (!selectedId || !filteredMatches.some(match => match.id === selectedId)) {
      setSelectedId(filteredMatches[0].id);
    }
  }, [filteredMatches, selectedId]);

  const metrics = useMemo(() => {
    const live = filteredMatches.filter(match => ["1H", "2H", "HT"].includes(match.status ?? "")).length;
    const scheduled = filteredMatches.filter(match => (match.status ?? "") === "NS").length;
    const finished = filteredMatches.filter(match => (match.status ?? "") === "FT").length;
    const goals = filteredMatches.reduce((sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0);
    return { live, scheduled, finished, goals };
  }, [filteredMatches]);

  const detailEvents = (details as any)?.events ?? [];
  const goals = getEventsByType(detailEvents, "Goal");
  const cards = getEventsByType(detailEvents, "Card");
  const homeName = (details as any)?.homeTeam?.name ?? (details as any)?.teams?.home?.name;
  const awayName = (details as any)?.awayTeam?.name ?? (details as any)?.teams?.away?.name;
  const statistics = (details as any)?.statistics;
  const cornersHome = getStatValue(statistics, homeName, "Corner Kicks");
  const cornersAway = getStatValue(statistics, awayName, "Corner Kicks");
  const shotsHome = getStatValue(statistics, homeName, "Shots on Goal");
  const shotsAway = getStatValue(statistics, awayName, "Shots on Goal");
  const possessionHome = getStatValue(statistics, homeName, "Ball Possession");
  const possessionAway = getStatValue(statistics, awayName, "Ball Possession");

  return (
    <RaphaLayout title="Painel" subtitle="Tela inicial mais limpa, mais clicável e com detalhe útil para decisão em segundos.">
      <div className="space-y-4">
        <section className="glass-panel hero-glow rounded-[30px] border p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="chip chip-live">
                  <Activity className="size-3.5" />
                  Radar ativo
                </span>
                <span className="chip chip-success">
                  <Sparkles className="size-3.5" />
                  Interface operacional
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">Centro de comando esportivo</h1>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground">
                Menos ruído, mais informação acionável. Os atalhos abaixo são clicáveis e levam direto para cada área principal do sistema.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-4">
              <NavigationCard title="Ao Vivo" subtitle="Partidas em tempo real" metric={metrics.live} icon={Flame} tone="bg-red-500/10 text-red-300" onClick={() => navigate("/ao-vivo")} />
              <NavigationCard title="Jogos" subtitle="Calendário do dia" metric={filteredMatches.length} icon={CalendarDays} tone="bg-cyan-500/10 text-cyan-300" onClick={() => navigate("/jogos-hoje")} />
              <NavigationCard title="Apostas" subtitle="Kelly e valor" metric={metrics.goals} icon={Wallet} tone="bg-primary/10 text-primary" onClick={() => navigate("/apostas")} />
              <NavigationCard title="Estatísticas" subtitle="Dados e tendências" metric={metrics.finished} icon={Trophy} tone="bg-amber-500/10 text-amber-300" onClick={() => navigate("/estatisticas")} />
            </div>
          </div>
        </section>

        <section className="section-shell space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
                <span className="mr-2 text-muted-foreground">Data</span>
                <input
                  type="date"
                  value={date}
                  onChange={event => setDate(event.target.value)}
                  className="bg-transparent outline-none"
                />
              </label>

              <select
                value={leagueFilter}
                onChange={event => setLeagueFilter(event.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm outline-none"
              >
                <option value="todas">Todas as ligas</option>
                {leagueOptions.map(league => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Ao vivo", value: metrics.live, tone: "text-red-300" },
                { label: "Agendados", value: metrics.scheduled, tone: "text-cyan-300" },
                { label: "Encerrados", value: metrics.finished, tone: "text-amber-300" },
                { label: "Gols", value: metrics.goals, tone: "text-primary" },
              ].map(item => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className={`mt-2 text-2xl font-black ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-3">
              {filteredMatches.length ? (
                filteredMatches.slice(0, 14).map(match => (
                  <MatchTile key={match.id} match={match} active={selectedMatch?.id === match.id} onClick={() => setSelectedId(match.id)} />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/12 p-8 text-center text-muted-foreground">
                  Nenhum jogo encontrado para os filtros atuais.
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedMatch ? (
                <>
                  <div className="glass-panel overflow-hidden rounded-[30px] border p-5 md:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {selectedMatch.status && ["1H", "2H", "HT"].includes(selectedMatch.status) ? (
                            <span className="chip chip-live">
                              <Timer className="size-3.5" />
                              {selectedMatch.minute ?? 0}'
                            </span>
                          ) : (
                            <span className="chip chip-info">
                              <Clock3 className="size-3.5" />
                              {formatClock(selectedMatch.startTime)}
                            </span>
                          )}
                          <span className="chip">
                            <Trophy className="size-3.5" />
                            {selectedMatch.league?.name ?? "Liga"}
                          </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                          {selectedMatch.homeTeam?.name} <span className="text-primary">vs</span> {selectedMatch.awayTeam?.name}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">{selectedMatch.stadium ?? "Estádio não informado"}</p>
                      </div>

                      <div className="sports-surface grid min-w-[280px] grid-cols-3 items-center gap-3 rounded-[28px] p-4 md:min-w-[360px]">
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Casa</p>
                          <div className="score-text mt-2 text-primary">{selectedMatch.homeScore ?? 0}</div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                          <div className="mt-2 text-xl font-black">
                            {["1H", "2H", "HT"].includes(selectedMatch.status ?? "") ? `${selectedMatch.minute ?? 0}'` : statusMap[selectedMatch.status ?? "NS"] ?? formatClock(selectedMatch.startTime)}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Fora</p>
                          <div className="score-text mt-2 text-cyan-300">{selectedMatch.awayScore ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                    <div className="space-y-4">
                      <div className="sports-surface rounded-[28px] p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Resumo operacional</p>
                            <h3 className="mt-2 text-2xl font-black">Gols, cartões e pressão</h3>
                          </div>
                          <button onClick={() => navigate(`/ao-vivo?fixture=${selectedMatch.id}`)} className="chip chip-success">
                            <Sparkles className="size-3.5" />
                            Abrir match center
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Escanteios</p>
                            <p className="mt-2 text-2xl font-black text-primary">{cornersHome}–{cornersAway}</p>
                          </div>
                          <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Chutes no gol</p>
                            <p className="mt-2 text-2xl font-black text-cyan-300">{shotsHome}–{shotsAway}</p>
                          </div>
                          <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Cartões</p>
                            <p className="mt-2 text-2xl font-black text-amber-300">{cards.length}</p>
                          </div>
                          <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Heat</p>
                            <p className="mt-2 text-2xl font-black text-red-300">{matchHeat(selectedMatch)}%</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-semibold">{homeName ?? "Casa"}</span>
                              <span className="text-primary">{possessionHome}% posse</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10">
                              <div className="h-2 rounded-full bg-gradient-to-r from-primary to-cyan-300" style={{ width: `${Math.min(100, possessionHome || 50)}%` }} />
                            </div>
                          </div>
                          <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-semibold">{awayName ?? "Fora"}</span>
                              <span className="text-cyan-300">{possessionAway}% posse</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10">
                              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" style={{ width: `${Math.min(100, possessionAway || 50)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sports-surface rounded-[28px] p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Linha do jogo</p>
                        <h3 className="mt-2 text-2xl font-black">Eventos recentes</h3>
                        <div className="mt-4 space-y-3">
                          {detailEvents.length ? (
                            detailEvents.slice().reverse().slice(0, 10).map((event: any, index: number) => (
                              <div key={`${event.type}-${event.minute}-${index}`} className={`flex items-center justify-between gap-3 rounded-[22px] border px-4 py-3 ${eventTone(event)}`}>
                                <div className="min-w-0">
                                  <p className="font-semibold">{event.player ?? event.team ?? "Evento"}</p>
                                  <p className="text-sm opacity-80">{eventLabel(event)}{event.team ? ` · ${event.team}` : ""}</p>
                                </div>
                                <span className="shrink-0 text-sm font-bold">{event.minute ?? 0}'</span>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[22px] border border-dashed border-white/12 p-6 text-sm text-muted-foreground">
                              Sem eventos detalhados para esta partida no momento.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="sports-surface rounded-[28px] p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Momentos decisivos</p>
                        <h3 className="mt-2 text-2xl font-black">Quem marcou e quando</h3>
                        <div className="mt-4 space-y-3">
                          {goals.length ? (
                            goals.map((goal: any, index: number) => (
                              <div key={`${goal.player}-${goal.minute}-${index}`} className="rounded-[22px] border border-emerald-500/25 bg-emerald-500/10 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-emerald-100">{goal.player ?? "Jogador"}</p>
                                    <p className="text-sm text-emerald-200/80">{goal.team ?? "Time"} · {eventLabel(goal)}</p>
                                  </div>
                                  <span className="text-lg font-black text-emerald-200">{goal.minute ?? 0}'</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[22px] border border-dashed border-white/12 p-6 text-sm text-muted-foreground">
                              Nenhum gol detalhado ainda.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sports-surface rounded-[28px] p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Alertas disciplinares</p>
                        <h3 className="mt-2 text-2xl font-black">Cartões na partida</h3>
                        <div className="mt-4 space-y-3">
                          {cards.length ? (
                            cards.map((card: any, index: number) => (
                              <div key={`${card.player}-${card.minute}-${index}`} className={`rounded-[22px] border p-4 ${eventTone(card)}`}>
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{card.player ?? "Jogador"}</p>
                                    <p className="text-sm opacity-80">{card.team ?? "Time"} · {eventLabel(card)}</p>
                                  </div>
                                  <span className="text-lg font-black">{card.minute ?? 0}'</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[22px] border border-dashed border-white/12 p-6 text-sm text-muted-foreground">
                              Nenhum cartão detalhado disponível.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sports-surface rounded-[28px] p-5">
                        <div className="flex items-center gap-3">
                          <ShieldAlert className="size-5 text-amber-300" />
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Atalho rápido</p>
                            <h3 className="text-xl font-black">Levar a análise para a tela certa</h3>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button onClick={() => navigate("/ao-vivo")} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]">
                            <p className="text-sm font-semibold">Abrir Ao Vivo</p>
                            <p className="mt-1 text-sm text-muted-foreground">Com radar, sinais e detalhe realtime.</p>
                          </button>
                          <button onClick={() => navigate("/jogos-hoje")} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]">
                            <p className="text-sm font-semibold">Abrir Jogos</p>
                            <p className="mt-1 text-sm text-muted-foreground">Com data, filtros, encerrados e próximos.</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/12 p-10 text-center text-muted-foreground">
                  Selecione um jogo para abrir o painel de detalhe.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </RaphaLayout>
  );
}
