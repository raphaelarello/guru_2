
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Activity,
  AlertCircle,
  Flame,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Timer,
  Trophy,
  Waves,
} from "lucide-react";

type Filtro = "todos" | "quentes" | "sinal";

function statusLabel(short?: string, elapsed?: number | null, extra?: number | null) {
  if (short === "HT") return "Intervalo";
  if (short === "FT") return "Encerrado";
  if (short === "NS") return "Agendado";
  if (short === "PST") return "Adiado";
  if (elapsed != null) return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
  return short ?? "-";
}

function safeText(value: any, fallback = "—") {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if (typeof value.name === "string") return value.name;
    if (typeof value.label === "string") return value.label;
    if (typeof value.title === "string") return value.title;
  }
  return fallback;
}

function parseStatValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value.replace("%", "")) || 0;
  return 0;
}

function getFixtureStatsList(fixture: any) {
  return Array.isArray(fixture?.statistics) ? fixture.statistics : [];
}

function getStat(fixture: any, type: string, teamIndex: 0 | 1) {
  const stats = getFixtureStatsList(fixture);
  const value = stats?.[teamIndex]?.statistics?.find((item: any) => item.type === type)?.value;
  return parseStatValue(value);
}

function getCards(events: any[]) {
  return events.filter((event: any) => event?.type === "Card");
}

function getGoals(events: any[]) {
  return events.filter((event: any) => event?.type === "Goal");
}

function getHeat(jogo: any) {
  const fixture = jogo?.fixture;
  const events = fixture?.events ?? [];
  const totalGoals = (fixture?.goals?.home ?? 0) + (fixture?.goals?.away ?? 0);
  const shots = getStat(fixture, "Shots on Goal", 0) + getStat(fixture, "Shots on Goal", 1);
  const corners = getStat(fixture, "Corner Kicks", 0) + getStat(fixture, "Corner Kicks", 1);

  let score = 28;
  if (jogo?.totalOportunidades) score += Math.min(34, jogo.totalOportunidades * 12);
  if (totalGoals >= 3) score += 16;
  if (events.length >= 6) score += 10;
  if (shots >= 5) score += 12;
  if (corners >= 8) score += 8;
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
      <span className="flex-1 text-sm font-semibold">{safeText(team?.name, "Time")}</span>
      <span className="text-2xl font-black">{score ?? 0}</span>
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const detail = safeText(event?.detail, safeText(event?.type, "Evento"));
  const actor = safeText(event?.player, safeText(event?.team, "Jogador"));
  const minute = event?.time?.elapsed ?? event?.minute ?? 0;
  const isGoal = safeText(event?.type) === "Goal";
  const isCard = safeText(event?.type) === "Card";
  const isRed = detail.toLowerCase().includes("red");

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm ${
        isGoal
          ? "border-emerald-500/25 bg-emerald-500/10"
          : isCard && isRed
          ? "border-red-500/25 bg-red-500/10"
          : isCard
          ? "border-amber-500/25 bg-amber-500/10"
          : "border-white/8 bg-black/15"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold">{actor}</p>
        <p className="truncate text-muted-foreground">{detail}</p>
      </div>
      <span className="shrink-0 font-bold">{minute}'</span>
    </div>
  );
}

function MatchCard({ jogo, onOpen }: { jogo: any; onOpen: () => void }) {
  const fixture = jogo.fixture;
  const heat = getHeat(jogo);
  const tone = scoreTone(heat);
  const st = fixture?.fixture?.status;
  const events = fixture?.events ?? [];
  const goals = getGoals(events);
  const cards = getCards(events);
  const corners = getStat(fixture, "Corner Kicks", 0) + getStat(fixture, "Corner Kicks", 1);

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

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Heat</p>
          <p className="mt-2 text-2xl font-black text-primary">{heat}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sinais</p>
          <p className="mt-2 text-2xl font-black text-cyan-300">{jogo.totalOportunidades ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Cartões</p>
          <p className="mt-2 text-2xl font-black text-amber-300">{cards.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Escanteios</p>
          <p className="mt-2 text-2xl font-black text-red-300">{corners}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {goals.slice(-3).map((goal: any, index: number) => (
          <span key={`${goal?.player?.id ?? index}-${goal?.time?.elapsed ?? index}`} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
            ⚽ {safeText(goal?.player, "Gol")} · {goal?.time?.elapsed ?? 0}'
          </span>
        ))}
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
  const events = Array.isArray(fixture?.events) ? fixture.events : [];
  const goals = getGoals(events);
  const cards = getCards(events);
  const cornersHome = getStat(fixture, "Corner Kicks", 0);
  const cornersAway = getStat(fixture, "Corner Kicks", 1);
  const shotsHome = getStat(fixture, "Shots on Goal", 0);
  const shotsAway = getStat(fixture, "Shots on Goal", 1);
  const possessionHome = getStat(fixture, "Ball Possession", 0);
  const possessionAway = getStat(fixture, "Ball Possession", 1);

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-5xl border-white/10 bg-[#080c18] text-white">
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

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
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
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Gols</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300">{goals.length}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{safeText(fixture.teams?.home?.name, "Casa")}</span>
                    <span className="text-primary">{possessionHome}% posse</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary to-cyan-300" style={{ width: `${Math.min(100, possessionHome || 50)}%` }} />
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{safeText(fixture.teams?.away?.name, "Fora")}</span>
                    <span className="text-cyan-300">{possessionAway}% posse</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" style={{ width: `${Math.min(100, possessionAway || 50)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Oportunidades identificadas</p>
                  <div className="mt-3 space-y-3">
                    {data?.oportunidades?.length ? data.oportunidades.map((item: any, index: number) => (
                      <div key={index} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold">{safeText(item.mercado, safeText(item.label, "Sinal"))}</h4>
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
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Quem fez o gol e quando</p>
                  <div className="mt-3 space-y-2">
                    {goals.length ? goals.map((event: any, index: number) => <EventRow key={`goal-${index}`} event={event} />) : (
                      <p className="text-sm text-muted-foreground">Sem gols detalhados até agora.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Cartões e alertas</p>
                  <div className="mt-3 space-y-2">
                    {cards.length ? cards.map((event: any, index: number) => <EventRow key={`card-${index}`} event={event} />) : (
                      <p className="text-sm text-muted-foreground">Sem cartões até o momento.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Eventos recentes</p>
                  <div className="mt-3 space-y-2">
                    {events.length ? events.slice(-8).reverse().map((event: any, index: number) => (
                      <EventRow key={`event-${index}`} event={event} />
                    )) : (
                      <p className="text-sm text-muted-foreground">Sem eventos detalhados.</p>
                    )}
                  </div>
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
    refetchInterval: 12000,
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
    <RaphaLayout title="Ao Vivo" subtitle="Monitoramento pesado em tempo real com gols, cartões, escanteios, sinais e visão gráfica do jogo.">
      <div className="space-y-4">
        <div className="glass-panel hero-glow rounded-[30px] border p-4 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="chip chip-live"><Radar className="size-3.5" /> Radar ao vivo</span>
                <span className="chip chip-success"><Sparkles className="size-3.5" /> Detalhe operacional</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">Central de intensidade esportiva</h1>
              <p className="mt-3 text-base text-muted-foreground text-balance">
                Agora com muito mais detalhe útil para decisão: quem marcou, cartões, escanteios, pressão, sinais e leitura instantânea do momento do jogo.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 sm:grid-cols-4">
              {[
                { label: "Jogos", value: data?.totalJogos ?? 0, icon: Trophy, tone: "text-primary" },
                { label: "Sinais", value: data?.totalOportunidades ?? 0, icon: Activity, tone: "text-cyan-300" },
                { label: "Quentes", value: filtered.filter(item => getHeat(item) >= 62).length, icon: Flame, tone: "text-red-300" },
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

          {error ? (
            <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 text-red-200">
              <div className="flex items-center gap-2 font-semibold"><AlertCircle className="size-4" /> Erro ao carregar jogos ao vivo</div>
              <p className="mt-2 text-sm text-red-100/70">Confira a conectividade da API e tente novamente.</p>
            </div>
          ) : isLoading ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground">
              Carregando radar ao vivo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/12 p-8 text-center text-muted-foreground">
              Nenhuma partida encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((jogo: any) => (
                <MatchCard key={jogo.fixture?.fixture?.id ?? jogo.fixture?.id} jogo={jogo} onOpen={() => setSelectedFixtureId(jogo.fixture?.fixture?.id ?? jogo.fixture?.id ?? null)} />
              ))}
            </div>
          )}
        </section>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 text-amber-300" />
            <div>
              <p className="text-sm font-semibold">Sugestão para o próximo passo visual</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Com a quota de 75 mil requisições por 24h, vale trabalhar atualização em ciclos inteligentes: lista geral a cada 10–15s, detalhe do jogo aberto a cada 5–10s e estatísticas profundas sob demanda.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MatchModal fixtureId={selectedFixtureId} open={!!selectedFixtureId} onClose={() => setSelectedFixtureId(null)} />
    </RaphaLayout>
  );
}
