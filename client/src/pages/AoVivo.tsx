import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, AlertCircle, Flame, Radar, RefreshCw, Sparkles, Timer, Trophy, Waves } from "lucide-react";

type Filtro = "todos" | "quentes" | "sinal";

function statusLabel(short?: string, elapsed?: number | null, extra?: number | null) {
  if (short === "HT") return "Intervalo";
  if (short === "FT") return "Encerrado";
  if (short === "NS") return "Agendado";
  if (short === "PST") return "Adiado";
  if (elapsed != null) return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
  return short ?? "-";
}

function getHeat(jogo: any) {
  const fixture = jogo?.fixture;
  const events = fixture?.events ?? [];
  const stats = fixture?.statistics ?? [];
  const totalGoals = (fixture?.goals?.home ?? 0) + (fixture?.goals?.away ?? 0);
  const shots = stats.reduce((sum: number, team: any) => {
    const stat = team.statistics?.find((item: any) => item.type === "Shots on Goal")?.value;
    const value = typeof stat === "number" ? stat : Number.parseFloat(String(stat ?? 0));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  let score = 28;
  if (jogo?.totalOportunidades) score += Math.min(34, jogo.totalOportunidades * 12);
  if (totalGoals >= 3) score += 18;
  if (events.length >= 6) score += 10;
  if (shots >= 5) score += 12;
  if ((fixture?.fixture?.status?.elapsed ?? 0) >= 60) score += 8;
  return Math.min(score, 99);
}

function scoreTone(score: number) {
  if (score >= 80) return { label: "Vulcão", className: "chip-live" };
  if (score >= 62) return { label: "Quente", className: "chip-success" };
  if (score >= 45) return { label: "Ativo", className: "chip-info" };
  return { label: "Morno", className: "" };
}

function TeamRow({ team, score }: { team: any; score: number | null | undefined }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-black/15 px-3 py-3">
      {team?.logo ? <img src={team.logo} alt="" className="size-8 rounded-full bg-white/5 p-0.5" /> : <div className="size-8 rounded-full bg-white/8" />}
      <span className="flex-1 text-sm font-semibold">{team?.name ?? "Time"}</span>
      <span className="text-2xl font-black">{score ?? 0}</span>
    </div>
  );
}

function MatchCard({ jogo, onOpen }: { jogo: any; onOpen: () => void }) {
  const fixture = jogo.fixture;
  const heat = getHeat(jogo);
  const tone = scoreTone(heat);
  const st = fixture?.fixture?.status;

  return (
    <button onClick={onOpen} className="sports-surface surface-hover w-full rounded-[28px] p-4 text-left">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{fixture?.league?.name ?? "Liga"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{fixture?.fixture?.venue?.name ?? "Ao vivo"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-live">{statusLabel(st?.short, st?.elapsed, st?.extra)}</span>
          <span className={`chip ${tone.className}`}>{tone.label}</span>
        </div>
      </div>

      <div className="space-y-2">
        <TeamRow team={fixture?.teams?.home} score={fixture?.goals?.home} />
        <TeamRow team={fixture?.teams?.away} score={fixture?.goals?.away} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Heat</p>
          <p className="mt-2 text-2xl font-black text-primary">{heat}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sinais</p>
          <p className="mt-2 text-2xl font-black text-cyan-300">{jogo.totalOportunidades ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">EV</p>
          <p className="mt-2 text-2xl font-black text-amber-300">{Number(jogo.melhorEV ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>Pressão do jogo</span>
          <span>{heat}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-primary to-red-400" style={{ width: `${heat}%` }} />
        </div>
      </div>
    </button>
  );
}

function MatchModal({ fixtureId, open, onClose }: { fixtureId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = trpc.football.analisarJogo.useQuery(
    { fixtureId: fixtureId ?? 0 },
    { enabled: open && !!fixtureId, refetchInterval: 10000 }
  );

  const fixture = data?.fixture;

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#080c18] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Match center ao vivo</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando análise ao vivo...</div>
        ) : !fixture ? (
          <div className="rounded-[24px] border border-dashed border-white/12 p-8 text-center text-muted-foreground">
            Não foi possível carregar os detalhes desta partida.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hero-glow sports-surface rounded-[28px] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{fixture.league?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fixture.fixture?.venue?.name ?? "Ao vivo agora"}</p>
                </div>
                <span className="chip chip-live">
                  <Timer className="size-3.5" />
                  {statusLabel(fixture.fixture?.status?.short, fixture.fixture?.status?.elapsed, fixture.fixture?.status?.extra)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TeamRow team={fixture.teams?.home} score={fixture.goals?.home} />
                <TeamRow team={fixture.teams?.away} score={fixture.goals?.away} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Oportunidades identificadas</p>
                <div className="mt-3 space-y-3">
                  {data?.oportunidades?.length ? data.oportunidades.map((item: any, index: number) => (
                    <div key={index} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold">{item.mercado ?? item.label ?? "Sinal"}</h4>
                        <span className="chip chip-success">EV {Number(item.ev ?? 0).toFixed(1)}%</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Probabilidade: {Number(item.probabilidade ?? item.prob ?? 0).toFixed(1)}% · Odd: {Number(item.odd ?? 0).toFixed(2)}
                      </p>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Nenhum sinal forte disponível agora.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Eventos recentes</p>
                <div className="mt-3 space-y-2">
                  {(fixture.events ?? []).length ? fixture.events.slice(-8).reverse().map((event: any, index: number) => (
                    <div key={index} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/15 px-3 py-2 text-sm">
                      <span>{event.type ?? "Evento"} · {event.player?.name ?? event.player ?? "Jogador"}</span>
                      <span className="text-muted-foreground">{event.time?.elapsed ?? event.minute ?? "-"}'</span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Sem eventos detalhados.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AoVivo() {
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [sort, setSort] = useState<"heat" | "signals" | "ev">("heat");

  const { data, isLoading, error, refetch, isRefetching } = trpc.football.dashboardAoVivo.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const jogos = data?.jogos ?? [];
  const leagues = useMemo(() => {
    const map = new Map<number, string>();
    jogos.forEach((jogo: any) => {
      const league = jogo.fixture?.league;
      if (league?.id && league?.name) map.set(league.id, league.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [jogos]);

  const filtered = useMemo(() => {
    let current = jogos.filter((jogo: any) => !leagueId || jogo.fixture?.league?.id === leagueId);
    if (filtro === "quentes") current = current.filter((jogo: any) => getHeat(jogo) >= 62);
    if (filtro === "sinal") current = current.filter((jogo: any) => (jogo.totalOportunidades ?? 0) > 0);

    return [...current].sort((a: any, b: any) => {
      if (sort === "signals") return (b.totalOportunidades ?? 0) - (a.totalOportunidades ?? 0);
      if (sort === "ev") return (b.melhorEV ?? 0) - (a.melhorEV ?? 0);
      return getHeat(b) - getHeat(a);
    });
  }, [filtro, jogos, leagueId, sort]);

  return (
    <RaphaLayout title="Ao Vivo" subtitle="Monitoramento de partidas com calor, sinais e match center premium em tempo real.">
      <div className="space-y-4">
        <div className="glass-panel hero-glow rounded-[30px] border p-4 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="chip chip-live"><Radar className="size-3.5" /> Radar ao vivo</span>
                <span className="chip chip-success"><Sparkles className="size-3.5" /> Interativo</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">Central de intensidade esportiva</h1>
              <p className="mt-3 text-base text-muted-foreground text-balance">
                Mais leitura de jogo, menos cara de planilha. Acompanhe calor, odds, eventos e sinais em uma interface muito mais viva.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 sm:grid-cols-3">
              {[
                { label: "Jogos", value: data?.totalJogos ?? 0, icon: Trophy, tone: "text-primary" },
                { label: "Sinais", value: data?.totalOportunidades ?? 0, icon: Activity, tone: "text-cyan-300" },
                { label: "Atualização", value: isRefetching ? "..." : "OK", icon: Waves, tone: "text-amber-300" },
              ].map(item => (
                <div key={item.label} className="sports-surface rounded-[24px] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <item.icon className={`size-4 ${item.tone}`} />
                  </div>
                  <div className="metric-number mt-3">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="section-shell space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
                <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              {(["todos", "quentes", "sinal"] as Filtro[]).map(item => (
                <button key={item} onClick={() => setFiltro(item)} className={`chip ${filtro === item ? "chip-success" : "hover:border-white/20"}`}>
                  {item === "todos" ? "Todos" : item === "quentes" ? "Só quentes" : "Com sinal"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={leagueId ?? ""}
                onChange={event => setLeagueId(event.target.value ? Number(event.target.value) : null)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm outline-none"
              >
                <option value="">Todas as ligas</option>
                {leagues.map(league => (
                  <option key={league.id} value={league.id}>{league.name}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={event => setSort(event.target.value as "heat" | "signals" | "ev")}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm outline-none"
              >
                <option value="heat">Ordenar por calor</option>
                <option value="signals">Ordenar por sinais</option>
                <option value="ev">Ordenar por EV</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-[24px] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="size-4" />
              Erro ao carregar o dashboard ao vivo.
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[260px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((jogo: any) => (
                <MatchCard key={jogo.fixture?.fixture?.id} jogo={jogo} onOpen={() => setSelectedFixtureId(jogo.fixture?.fixture?.id ?? null)} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-10 text-center text-muted-foreground">
              Nenhum jogo encontrado com os filtros atuais.
            </div>
          )}
        </section>

        <MatchModal fixtureId={selectedFixtureId} open={!!selectedFixtureId} onClose={() => setSelectedFixtureId(null)} />
      </div>
    </RaphaLayout>
  );
}
