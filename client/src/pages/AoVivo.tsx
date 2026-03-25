import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Flame,
  RefreshCw,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import RaphaLayout from "@/components/RaphaLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

type FiltroAtivo = "todos" | "quentes" | "sinal";

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

function calcularCalor(fixture: any, oportunidades: any[]) {
  const stats = fixture.statistics || [];
  const events = fixture.events || [];
  const st = fixture.fixture?.status;
  const elapsed = st?.elapsed ?? 0;
  const goals = (fixture.goals?.home ?? 0) + (fixture.goals?.away ?? 0);

  const getStat = (teamIdx: number, type: string) => {
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

  if (shotsOnGoal >= 8) { score += 30; fatores.push(`${shotsOnGoal} no alvo`); }
  else if (shotsOnGoal >= 4) { score += 15; fatores.push(`${shotsOnGoal} no alvo`); }
  else if (shotsOnGoal >= 2) score += 8;

  if (totalShots >= 15) { score += 15; fatores.push(`${totalShots} finalizações`); }
  else if (totalShots >= 8) score += 8;

  if (corners >= 8) { score += 15; fatores.push(`${corners} escanteios`); }
  else if (corners >= 5) { score += 8; fatores.push(`${corners} escanteios`); }

  if (recentGoals >= 2) { score += 20; fatores.push(`${recentGoals} gols recentes`); }
  else if (recentGoals >= 1) { score += 12; fatores.push("gol recente"); }

  if (goals >= 4) { score += 15; fatores.push(`${goals} gols`); }
  else if (goals >= 2) score += 8;

  if (redCards >= 1) { score += 10; fatores.push(`${redCards} vermelho`); }
  if (yellowCards >= 4) { score += 8; fatores.push(`${yellowCards} amarelos`); }

  if (elapsed >= 75) { score += 10; fatores.push("reta final"); }
  else if (elapsed >= 60) score += 5;

  if (oportunidades.length >= 3) { score += 10; fatores.push(`${oportunidades.length} sinais IA`); }
  else if (oportunidades.length >= 1) score += 5;

  score = Math.min(100, score);

  if (score >= 70) return { score, nivel: "vulcao", label: "Vulcão", tone: "text-red-300", bar: "from-red-500 via-orange-500 to-pink-500", badge: "bg-red-500/12 text-red-200" };
  if (score >= 45) return { score, nivel: "quente", label: "Quente", tone: "text-orange-300", bar: "from-orange-400 via-amber-400 to-red-500", badge: "bg-orange-500/12 text-orange-200" };
  if (score >= 20) return { score, nivel: "morno", label: "Morno", tone: "text-amber-300", bar: "from-amber-300 to-yellow-500", badge: "bg-amber-500/12 text-amber-200" };
  return { score, nivel: "gelado", label: "Gelado", tone: "text-cyan-300", bar: "from-cyan-300 to-blue-500", badge: "bg-cyan-500/12 text-cyan-200" };
}

export default function AoVivo() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>("todos");
  const [ligaSelecionada, setLigaSelecionada] = useState<number | null>(null);
  const [ordenacao, setOrdenacao] = useState<"calor" | "oportunidades" | "minuto" | "gols">("calor");
  const [jogoSelecionado, setJogoSelecionado] = useState<any>(null);
  const [ultimaAtt, setUltimaAtt] = useState(new Date());

  const { data: dashboard, isLoading, error, refetch } = trpc.football.dashboardAoVivo.useQuery(undefined, {
    refetchInterval: autoRefresh ? 15000 : false,
    onSuccess: () => setUltimaAtt(new Date()),
  } as any);

  const handleRefresh = useCallback(async () => {
    await refetch();
    setUltimaAtt(new Date());
    toast.success("Dados ao vivo atualizados");
  }, [refetch]);

  const jogosEnriquecidos = useMemo(() => {
    return (dashboard?.jogos || []).map((jogo: any) => ({
      ...jogo,
      calor: calcularCalor(jogo.fixture, jogo.oportunidades || []),
    }));
  }, [dashboard?.jogos]);

  const ligasDisponiveis = useMemo(() => {
    const ids = new Set<number>();
    return jogosEnriquecidos
      .filter((jogo: any) => {
        if (ids.has(jogo.fixture.league.id)) return false;
        ids.add(jogo.fixture.league.id);
        return true;
      })
      .map((jogo: any) => ({
        id: jogo.fixture.league.id,
        name: jogo.fixture.league.name,
        flag: jogo.fixture.league.flag,
      }));
  }, [jogosEnriquecidos]);

  const jogosFiltrados = useMemo(() => {
    let jogos = jogosEnriquecidos;
    if (ligaSelecionada) jogos = jogos.filter((jogo: any) => jogo.fixture.league.id === ligaSelecionada);
    if (filtroAtivo === "quentes") jogos = jogos.filter((jogo: any) => ["quente", "vulcao"].includes(jogo.calor.nivel));
    if (filtroAtivo === "sinal") jogos = jogos.filter((jogo: any) => jogo.totalOportunidades > 0);

    return [...jogos].sort((a: any, b: any) => {
      if (ordenacao === "calor") return b.calor.score - a.calor.score;
      if (ordenacao === "oportunidades") return b.totalOportunidades - a.totalOportunidades;
      if (ordenacao === "gols") return ((b.fixture.goals.home ?? 0) + (b.fixture.goals.away ?? 0)) - ((a.fixture.goals.home ?? 0) + (a.fixture.goals.away ?? 0));
      if (ordenacao === "minuto") return (b.fixture.fixture.status.elapsed ?? 0) - (a.fixture.fixture.status.elapsed ?? 0);
      return 0;
    });
  }, [jogosEnriquecidos, ligaSelecionada, filtroAtivo, ordenacao]);

  const totalJogos = jogosEnriquecidos.length;
  const totalOportunidades = jogosEnriquecidos.reduce((acc: number, jogo: any) => acc + (jogo.totalOportunidades || 0), 0);
  const jogosQuentes = jogosEnriquecidos.filter((jogo: any) => ["quente", "vulcao"].includes(jogo.calor.nivel)).length;
  const topQuentes = useMemo(() => [...jogosEnriquecidos].sort((a: any, b: any) => b.calor.score - a.calor.score).slice(0, 3), [jogosEnriquecidos]);

  const metricas = [
    { label: "Jogos ao vivo", value: totalJogos, icon: Activity, tone: "text-lime-300" },
    { label: "Sinais IA", value: totalOportunidades, icon: Sparkles, tone: "text-cyan-300" },
    { label: "Jogos quentes", value: jogosQuentes, icon: Flame, tone: "text-orange-300" },
    { label: "Ligas", value: ligasDisponiveis.length, icon: Trophy, tone: "text-amber-300" },
  ];

  return (
    <RaphaLayout
      title="Ao Vivo"
      eyebrow="Central de partidas em tempo real"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((current) => !current)}
            className={cn(
              "sport-chip h-11 rounded-2xl px-4",
              autoRefresh ? "sport-chip-active" : "border-white/8 bg-white/4 text-slate-300",
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", autoRefresh ? "bg-lime-300" : "bg-slate-500")} />
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </button>
          <Button
            variant="ghost"
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-200 hover:bg-white/10"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="panel-grid lg:grid-cols-[1.35fr_0.85fr]">
          <div className="glass-card-strong gradient-outline rounded-[32px] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="sport-chip sport-chip-active">
                  <span className="live-dot" />
                  radar de pressão
                </span>
                <div>
                  <h3 className="sport-title">Partidas com leitura instantânea e energia de produto esportivo.</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Os jogos mais quentes sobem, os sinais aparecem com destaque e as decisões ficam muito mais rápidas.
                  </p>
                </div>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Última atualização</p>
                <p className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  {ultimaAtt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricas.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    whileHover={{ y: -2 }}
                    className="glass-card card-hover-lift rounded-[26px] p-4 text-left"
                    onClick={() => {
                      if (item.label === "Jogos quentes") setFiltroAtivo("quentes");
                      if (item.label === "Sinais IA") setFiltroAtivo("sinal");
                      if (item.label === "Jogos ao vivo") setFiltroAtivo("todos");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-2xl border border-white/10 bg-white/5 p-3", item.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={cn("metric-value", item.tone)}>{item.value}</span>
                    </div>
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="glass-card-strong rounded-[32px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Top radar</p>
                <h4 className="mt-1 text-lg font-black tracking-[-0.04em] text-white">Mais quentes</h4>
              </div>
              <Flame className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-4 space-y-3">
              {topQuentes.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/10 p-4 text-sm text-slate-400">
                  Sem partidas para destacar agora.
                </div>
              )}

              {topQuentes.map((jogo: any, index: number) => (
                <button
                  key={jogo.fixture.fixture.id}
                  onClick={() => setJogoSelecionado(jogo)}
                  className="gradient-outline w-full rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-white/14 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black tracking-[-0.04em] text-white">#{index + 1}</span>
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", jogo.calor.badge)}>
                      {jogo.calor.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <img src={jogo.fixture.teams.home.logo} alt="" className="h-10 w-10 rounded-xl bg-white/95 p-1.5 object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {jogo.fixture.teams.home.name} x {jogo.fixture.teams.away.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{jogo.fixture.league.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black tracking-[-0.06em] text-white">
                        <span className="text-lime-300">{jogo.fixture.goals.home ?? 0}</span>
                        <span className="mx-1 text-slate-600">:</span>
                        <span className="text-cyan-300">{jogo.fixture.goals.away ?? 0}</span>
                      </p>
                      <p className="text-xs text-slate-500">{statusLabel(jogo.fixture.fixture.status.short, jogo.fixture.fixture.status.elapsed, jogo.fixture.fixture.status.extra)}</p>
                    </div>
                  </div>
                  <HeatBar value={jogo.calor.score} gradient={jogo.calor.bar} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card-strong rounded-[32px] p-5">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-wrap gap-2">
              {(["todos", "quentes", "sinal"] as FiltroAtivo[]).map((filtro) => (
                <button
                  key={filtro}
                  onClick={() => setFiltroAtivo(filtro)}
                  className={cn("sport-chip h-11 rounded-2xl px-4", filtroAtivo === filtro && "sport-chip-active")}
                >
                  {filtro === "todos" ? "Todos" : filtro === "quentes" ? "Quentes" : "Com sinal"}
                </button>
              ))}
            </div>

            <select
              value={ligaSelecionada ?? ""}
              onChange={(e) => setLigaSelecionada(e.target.value ? Number(e.target.value) : null)}
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 outline-none transition focus:border-lime-400/35"
            >
              <option value="">Todas as ligas</option>
              {ligasDisponiveis.map((liga) => (
                <option key={liga.id} value={liga.id}>
                  {liga.name}
                </option>
              ))}
            </select>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 outline-none transition focus:border-lime-400/35"
            >
              <option value="calor">Ordenar por calor</option>
              <option value="oportunidades">Ordenar por sinais</option>
              <option value="gols">Ordenar por gols</option>
              <option value="minuto">Ordenar por minuto</option>
            </select>
          </div>
        </section>

        {error && (
          <div className="glass-card rounded-[28px] border-red-500/25 bg-red-500/8 p-4 text-sm text-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Erro ao carregar partidas ao vivo. Verifique a integração da API.
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-card h-56 animate-pulse rounded-[30px] border-white/8 bg-white/[0.03]" />
            ))}
          </div>
        )}

        {!isLoading && !error && jogosFiltrados.length === 0 && (
          <div className="glass-card-strong rounded-[32px] border border-dashed border-white/10 px-4 py-14 text-center">
            <Activity className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-4 text-base font-semibold text-white">Nenhuma partida para os filtros atuais</p>
            <p className="mt-2 text-sm text-slate-400">Troque a liga, remova filtros ou aguarde novas partidas ao vivo.</p>
          </div>
        )}

        {!isLoading && jogosFiltrados.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {jogosFiltrados.map((jogo: any) => (
              <motion.button
                key={jogo.fixture.fixture.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setJogoSelecionado(jogo)}
                className="glass-card-strong gradient-outline rounded-[30px] p-5 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] uppercase tracking-[0.2em] text-slate-500">{jogo.fixture.league.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">{statusLabel(jogo.fixture.fixture.status.short, jogo.fixture.fixture.status.elapsed, jogo.fixture.fixture.status.extra)}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", jogo.calor.badge)}>
                    {jogo.calor.label}
                  </span>
                </div>

                <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <LiveTeam team={jogo.fixture.teams.home} />
                  <div className="text-center">
                    <p className="text-4xl font-black tracking-[-0.08em] text-white">
                      <span className="text-lime-300">{jogo.fixture.goals.home ?? 0}</span>
                      <span className="mx-2 text-slate-600">:</span>
                      <span className="text-cyan-300">{jogo.fixture.goals.away ?? 0}</span>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{jogo.fixture.fixture.status.elapsed ? `${jogo.fixture.fixture.status.elapsed}'` : "pré-jogo"}</p>
                  </div>
                  <LiveTeam team={jogo.fixture.teams.away} alignRight />
                </div>

                <div className="space-y-4">
                  <HeatBar value={jogo.calor.score} gradient={jogo.calor.bar} />

                  <div className="grid grid-cols-3 gap-2">
                    <MiniLiveStat icon={Sparkles} label="Sinais" value={jogo.totalOportunidades || 0} tone="text-cyan-300" />
                    <MiniLiveStat icon={Target} label="Calor" value={`${jogo.calor.score}%`} tone="text-orange-300" />
                    <MiniLiveStat icon={Waves} label="Fatores" value={jogo.calor.fatores.length} tone="text-lime-300" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {jogo.calor.fatores.slice(0, 3).map((fator: string, index: number) => (
                      <span key={index} className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300">
                        {fator}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <Dialog open={!!jogoSelecionado} onOpenChange={(open) => !open && setJogoSelecionado(null)}>
          <DialogContent className="max-w-4xl border-white/10 bg-[#08131f]/96 text-white backdrop-blur-2xl">
            {jogoSelecionado && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-left text-2xl font-black tracking-[-0.05em]">
                    {jogoSelecionado.fixture.teams.home.name} x {jogoSelecionado.fixture.teams.away.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="glass-card rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{jogoSelecionado.fixture.league.name}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {statusLabel(
                            jogoSelecionado.fixture.fixture.status.short,
                            jogoSelecionado.fixture.fixture.status.elapsed,
                            jogoSelecionado.fixture.fixture.status.extra,
                          )}
                        </p>
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", jogoSelecionado.calor.badge)}>
                        {jogoSelecionado.calor.label}
                      </span>
                    </div>

                    <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      <LiveTeam team={jogoSelecionado.fixture.teams.home} />
                      <div className="text-center">
                        <p className="text-5xl font-black tracking-[-0.08em] text-white">
                          <span className="text-lime-300">{jogoSelecionado.fixture.goals.home ?? 0}</span>
                          <span className="mx-2 text-slate-600">:</span>
                          <span className="text-cyan-300">{jogoSelecionado.fixture.goals.away ?? 0}</span>
                        </p>
                      </div>
                      <LiveTeam team={jogoSelecionado.fixture.teams.away} alignRight />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <MiniLiveStat icon={TimerReset} label="Minuto" value={jogoSelecionado.fixture.fixture.status.elapsed ? `${jogoSelecionado.fixture.fixture.status.elapsed}'` : "-"} tone="text-white" />
                      <MiniLiveStat icon={Sparkles} label="Sinais" value={jogoSelecionado.totalOportunidades || 0} tone="text-cyan-300" />
                      <MiniLiveStat icon={Zap} label="Pressão" value={`${jogoSelecionado.calor.score}%`} tone="text-orange-300" />
                    </div>
                  </div>

                  <div className="glass-card rounded-[28px] p-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Leitura rápida</p>
                    <div className="mt-4 space-y-4">
                      <HeatBar value={jogoSelecionado.calor.score} gradient={jogoSelecionado.calor.bar} />
                      <div className="space-y-2">
                        {jogoSelecionado.calor.fatores.map((fator: string, index: number) => (
                          <div key={index} className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                            • {fator}
                          </div>
                        ))}
                        {jogoSelecionado.calor.fatores.length === 0 && (
                          <div className="rounded-[18px] border border-dashed border-white/10 px-3 py-3 text-sm text-slate-400">
                            Sem fatores fortes detectados no momento.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RaphaLayout>
  );
}

function LiveTeam({ team, alignRight = false }: { team: any; alignRight?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", alignRight && "flex-row-reverse text-right")}>
      <img src={team.logo} alt={team.name} className="h-12 w-12 rounded-2xl bg-white/95 p-2 object-contain" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{team.name}</p>
        <p className="mt-1 text-xs text-slate-500">{alignRight ? "Visitante" : "Mandante"}</p>
      </div>
    </div>
  );
}

function MiniLiveStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", tone)} />
        <span className={cn("text-lg font-black tracking-[-0.04em]", tone)}>{value}</span>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </div>
  );
}

function HeatBar({ value, gradient }: { value: number; gradient: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>Termômetro da partida</span>
        <span className="font-bold text-white">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/6">
        <div className={cn("h-2.5 rounded-full bg-gradient-to-r transition-all duration-500", gradient)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
