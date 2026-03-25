import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Clock3, Flame, Sparkles, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";

type Match = {
  id: number;
  league?: { id?: number; name?: string; logo?: string };
  homeTeam?: { name?: string; logo?: string };
  awayTeam?: { name?: string; logo?: string };
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  minute?: number;
  stadium?: string;
  startTime?: string;
  events?: Array<{ type?: string; minute?: number; player?: string }>;
};

const statusMap: Record<string, string> = {
  NS: "Agendado",
  "1H": "1º Tempo",
  "2H": "2º Tempo",
  HT: "Intervalo",
  FT: "Encerrado",
};

function formatClock(iso?: string) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function matchHeat(match: Match) {
  let score = 40;
  if (match.status === "1H" || match.status === "2H" || match.status === "HT") score += 25;
  if ((match.homeScore ?? 0) + (match.awayScore ?? 0) >= 3) score += 18;
  if ((match.events?.length ?? 0) >= 3) score += 12;
  if ((match.minute ?? 0) >= 60) score += 8;
  return Math.min(score, 98);
}

function MatchTile({ match, onSelect, active }: { match: Match; onSelect: () => void; active: boolean }) {
  const live = match.status === "1H" || match.status === "2H" || match.status === "HT";
  const heat = matchHeat(match);
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-[26px] border p-4 text-left transition-all ${
        active
          ? "border-primary/30 bg-primary/10 shadow-[0_18px_42px_rgba(124,255,93,0.1)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {match.league?.name ?? "Liga"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{match.stadium ?? "Estádio não informado"}</p>
        </div>
        <span className={`chip ${live ? "chip-live" : "chip-info"}`}>
          {live ? `${match.minute ?? 0}'` : statusMap[match.status ?? "NS"] ?? (match.status ?? "Status")}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <div className="space-y-2">
          {[
            { team: match.homeTeam, score: match.homeScore },
            { team: match.awayTeam, score: match.awayScore },
          ].map(({ team, score }, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {team?.logo ? <img src={team.logo} alt="" className="size-7 rounded-full bg-white/5 p-0.5" /> : <div className="size-7 rounded-full bg-white/8" />}
              <span className="line-clamp-1 flex-1 text-sm font-semibold">{team?.name ?? "Time"}</span>
              <span className="text-xl font-black">{score ?? 0}</span>
            </div>
          ))}
        </div>

        <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-4 text-center md:block">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Heat</div>
          <div className="mt-2 text-2xl font-black text-primary">{heat}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>Intensidade</span>
          <span>{heat}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-primary to-yellow-300" style={{ width: `${heat}%` }} />
        </div>
      </div>
    </button>
  );
}

export function Home() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [leagueFilter, setLeagueFilter] = useState("todas");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tickerIndex, setTickerIndex] = useState(0);

  const { data: liveMatches = [] } = trpc.matches.getLive.useQuery(undefined, { refetchInterval: 10000 });
  const { data: dayMatches = [] } = trpc.matches.getByDate.useQuery({ date }, { refetchInterval: 10000 });

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

  const leagues = useMemo(() => {
    return Array.from(new Set(matches.map(match => match.league?.name).filter(Boolean) as string[])).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (leagueFilter === "todas") return matches;
    return matches.filter(match => match.league?.name === leagueFilter);
  }, [leagueFilter, matches]);

  const selectedMatch = filteredMatches.find(match => match.id === selectedId) ?? filteredMatches[0] ?? null;

  useEffect(() => {
    if (!filteredMatches.length) return;
    if (!selectedId) setSelectedId(filteredMatches[0].id);
  }, [filteredMatches, selectedId]);

  useEffect(() => {
    if (!filteredMatches.length) return;
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % filteredMatches.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [filteredMatches.length]);

  const tickerMatch = filteredMatches[tickerIndex] ?? null;
  const metrics = useMemo(() => {
    const live = filteredMatches.filter(match => ["1H", "2H", "HT"].includes(match.status ?? "")).length;
    const scheduled = filteredMatches.filter(match => (match.status ?? "") === "NS").length;
    const totalGoals = filteredMatches.reduce((sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0);
    return { live, scheduled, totalGoals, leagues: leagues.length };
  }, [filteredMatches, leagues.length]);

  return (
    <RaphaLayout title="Painel" subtitle="Cockpit esportivo moderno com placares, highlights e leitura rápida de oportunidade.">
      <div className="space-y-4">
        {tickerMatch && (
          <div className="glass-panel hero-glow overflow-hidden rounded-[30px] border p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="chip chip-live">
                    <Activity className="size-3.5" />
                    Radar ativo
                  </span>
                  <span className="chip">
                    <Sparkles className="size-3.5" />
                    Destaque rotativo
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  {tickerMatch.homeTeam?.name} <span className="text-primary">vs</span> {tickerMatch.awayTeam?.name}
                </h1>
                <p className="mt-3 text-base text-muted-foreground">
                  {tickerMatch.league?.name} · {tickerMatch.stadium} · {statusMap[tickerMatch.status ?? "NS"] ?? tickerMatch.status}
                </p>
              </div>

              <div className="sports-surface grid min-w-[280px] grid-cols-3 items-center gap-3 rounded-[28px] p-4 md:min-w-[340px]">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Casa</p>
                  <div className="score-text mt-2 text-primary">{tickerMatch.homeScore ?? 0}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                  <div className="mt-2 text-xl font-black">{tickerMatch.minute ? `${tickerMatch.minute}'` : formatClock(tickerMatch.startTime)}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Fora</p>
                  <div className="score-text mt-2 text-cyan-300">{tickerMatch.awayScore ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="section-shell sports-grid space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Visão do dia</p>
                <h2 className="mt-1 text-2xl font-black">Agenda inteligente</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setDate(prev => {
                  const d = new Date(prev); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0];
                })} className="chip hover:border-white/20">
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="chip">
                  <CalendarDays className="size-3.5" />
                  {new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
                <button onClick={() => setDate(prev => {
                  const d = new Date(prev); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0];
                })} className="chip hover:border-white/20">
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: "Ao vivo", value: metrics.live, icon: Activity, color: "text-red-300" },
                { label: "Agendados", value: metrics.scheduled, icon: Clock3, color: "text-cyan-300" },
                { label: "Gols", value: metrics.totalGoals, icon: Flame, color: "text-primary" },
                { label: "Ligas", value: metrics.leagues, icon: Trophy, color: "text-amber-300" },
              ].map(item => (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <item.icon className={`size-4 ${item.color}`} />
                  </div>
                  <div className="metric-number mt-3">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLeagueFilter("todas")}
                className={`chip transition-colors ${leagueFilter === "todas" ? "chip-success" : "hover:border-white/20"}`}
              >
                Todas
              </button>
              {leagues.map(league => (
                <button
                  key={league}
                  onClick={() => setLeagueFilter(league)}
                  className={`chip transition-colors ${leagueFilter === league ? "chip-success" : "hover:border-white/20"}`}
                >
                  {league}
                </button>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {filteredMatches.length ? (
                filteredMatches.map(match => (
                  <MatchTile
                    key={match.id}
                    match={match}
                    active={selectedMatch?.id === match.id}
                    onSelect={() => setSelectedId(match.id)}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-10 text-center text-muted-foreground">
                  Nenhum jogo encontrado para o filtro aplicado.
                </div>
              )}
            </div>
          </section>

          <aside className="section-shell space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Match center</p>
              <h2 className="mt-1 text-2xl font-black">Foco do operador</h2>
            </div>

            {selectedMatch ? (
              <div className="space-y-4">
                <div className="hero-glow sports-surface rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{selectedMatch.league?.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedMatch.stadium}</p>
                    </div>
                    <span className={`chip ${["1H","2H","HT"].includes(selectedMatch.status ?? "") ? "chip-live" : "chip-info"}`}>
                      {["1H","2H","HT"].includes(selectedMatch.status ?? "") ? `${selectedMatch.minute ?? 0}'` : formatClock(selectedMatch.startTime)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { team: selectedMatch.homeTeam, score: selectedMatch.homeScore, color: "text-primary" },
                      { team: selectedMatch.awayTeam, score: selectedMatch.awayScore, color: "text-cyan-300" },
                    ].map(({ team, score, color }, idx) => (
                      <div key={idx} className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                        {team?.logo ? <img src={team.logo} alt="" className="size-10 rounded-full bg-white/5 p-0.5" /> : <div className="size-10 rounded-full bg-white/8" />}
                        <span className="flex-1 font-semibold">{team?.name ?? "Time"}</span>
                        <span className={`text-4xl font-black ${color}`}>{score ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      <li>• Status: {statusMap[selectedMatch.status ?? "NS"] ?? selectedMatch.status}</li>
                      <li>• Horário: {formatClock(selectedMatch.startTime)}</li>
                      <li>• Eventos: {selectedMatch.events?.length ?? 0}</li>
                    </ul>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Temperatura</p>
                    <div className="mt-3 text-4xl font-black text-primary">{matchHeat(selectedMatch)}</div>
                    <div className="mt-3 h-2 rounded-full bg-white/8">
                      <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-primary to-yellow-300" style={{ width: `${matchHeat(selectedMatch)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Eventos recentes</p>
                  <div className="mt-3 space-y-2">
                    {selectedMatch.events?.length ? selectedMatch.events.slice(-5).reverse().map((event, index) => (
                      <div key={index} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/15 px-3 py-2 text-sm">
                        <span>{event.type ?? "Evento"} · {event.player ?? "Jogador"}</span>
                        <span className="text-muted-foreground">{event.minute ?? "-"}'</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">Sem eventos detalhados para esta partida.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-10 text-center text-muted-foreground">
                Selecione um jogo para abrir o centro de detalhes.
              </div>
            )}
          </aside>
        </div>
      </div>
    </RaphaLayout>
  );
}
