import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Radio,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import RaphaLayout from "@/components/RaphaLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

function formatStatus(status?: string, minute?: number | null) {
  if (status === "1H") return `${minute ?? 0}' · 1º tempo`;
  if (status === "2H") return `${minute ?? 0}' · 2º tempo`;
  if (status === "HT") return "Intervalo";
  if (status === "FT") return "Encerrado";
  if (status === "NS") return "Não iniciado";
  return status || "Status";
}

function safeDateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

export function Home() {
  const [jogoSelecionado, setJogoSelecionado] = useState<any>(null);
  const [filtroLiga, setFiltroLiga] = useState<string>("todas");
  const [dataAtual, setDataAtual] = useState(new Date().toISOString().split("T")[0]);
  const [tickerIndex, setTickerIndex] = useState(0);

  const { data: jogosAoVivo = [] } = trpc.matches.getLive.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const { data: jogosDia = [] } = trpc.matches.getByDate.useQuery(
    { date: dataAtual },
    { refetchInterval: 20000 },
  );

  const todosJogos = useMemo(() => {
    const vistos = new Set<number>();
    return [...jogosAoVivo, ...jogosDia]
      .filter((jogo) => {
        if (vistos.has(jogo.id)) return false;
        vistos.add(jogo.id);
        return true;
      })
      .sort((a, b) => {
        const ordem = { "1H": 0, "2H": 0, HT: 1, NS: 2, FT: 3 } as Record<string, number>;
        const statusA = ordem[a.status] ?? 4;
        const statusB = ordem[b.status] ?? 4;
        if (statusA !== statusB) return statusA - statusB;
        return new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
      });
  }, [jogosAoVivo, jogosDia]);

  const ligas = useMemo(() => {
    return Array.from(new Set(todosJogos.map((jogo) => jogo.league?.name).filter(Boolean))).sort();
  }, [todosJogos]);

  const jogosFiltrados = useMemo(() => {
    if (filtroLiga === "todas") return todosJogos;
    return todosJogos.filter((jogo) => jogo.league?.name === filtroLiga);
  }, [todosJogos, filtroLiga]);

  const aoVivo = useMemo(
    () => jogosFiltrados.filter((jogo) => ["1H", "2H", "HT"].includes(jogo.status)),
    [jogosFiltrados],
  );

  const destaques = useMemo(() => {
    return [...jogosFiltrados]
      .sort((a, b) => (b.minute || 0) - (a.minute || 0))
      .slice(0, 3);
  }, [jogosFiltrados]);

  useEffect(() => {
    if (!jogoSelecionado && jogosFiltrados[0]) {
      setJogoSelecionado(jogosFiltrados[0]);
    }
  }, [jogosFiltrados, jogoSelecionado]);

  useEffect(() => {
    if (!aoVivo.length) return;
    const timer = setInterval(() => {
      setTickerIndex((current) => (current + 1) % aoVivo.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [aoVivo.length]);

  const jogoTicker = aoVivo[tickerIndex] || jogosFiltrados[0];

  const mudarData = (dias: number) => {
    const next = new Date(`${dataAtual}T12:00:00`);
    next.setDate(next.getDate() + dias);
    setDataAtual(next.toISOString().split("T")[0]);
  };

  const metricas = [
    {
      label: "Jogos monitorados",
      value: jogosFiltrados.length,
      icon: CalendarDays,
      tone: "text-cyan-300",
    },
    {
      label: "Ao vivo",
      value: aoVivo.length,
      icon: Radio,
      tone: "text-red-300",
    },
    {
      label: "Ligas",
      value: ligas.length,
      icon: Trophy,
      tone: "text-lime-300",
    },
    {
      label: "Destaques",
      value: destaques.length,
      icon: Sparkles,
      tone: "text-amber-300",
    },
  ];

  return (
    <RaphaLayout title="Painel" eyebrow="Visão geral esportiva">
      <div className="panel-grid xl:grid-cols-[1.35fr_0.95fr]">
        <section className="glass-card-strong gradient-outline relative overflow-hidden rounded-[32px] p-5 md:p-6">
          <div className="pointer-events-none absolute inset-0 field-lines opacity-[0.08]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-lime-400/8 to-transparent" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-3">
                <span className="sport-chip sport-chip-active">
                  <span className="live-dot" />
                  Match hub redesenhado
                </span>
                <div>
                  <h3 className="sport-title max-w-2xl">Seu sistema com cara de produto esportivo premium.</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                    Mais contraste, cards melhores, leitura instantânea, sensação de velocidade e foco total no que importa.
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-[26px] p-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl border border-white/10 bg-white/5"
                    onClick={() => mudarData(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[170px] text-center">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Data ativa</p>
                    <p className="mt-1 text-sm font-bold text-white">{safeDateLabel(dataAtual)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl border border-white/10 bg-white/5"
                    onClick={() => mudarData(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricas.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2 }}
                    className="glass-card card-hover-lift rounded-[26px] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-2xl border border-white/10 bg-white/5 p-3", item.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={cn("metric-value score-glow", item.tone)}>{item.value}</span>
                    </div>
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {jogoTicker && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={jogoTicker.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.28 }}
                  className="gradient-outline glass-card rounded-[28px] overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-3">
                    <span className="sport-chip border-red-400/25 bg-red-500/10 text-red-200">
                      <span className="live-dot" />
                      acompanhamento
                    </span>
                    <span className="text-sm text-slate-300">{jogoTicker.league?.name || "Competição"}</span>
                    <span className="ml-auto text-xs text-slate-500">{formatStatus(jogoTicker.status, jogoTicker.minute)}</span>
                  </div>

                  <div className="grid gap-4 p-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <TeamColumn side="home" team={jogoTicker.homeTeam} score={jogoTicker.homeScore} />
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Placar</p>
                          <p className="mt-2 text-4xl font-black tracking-[-0.08em] text-white md:text-5xl">
                            <span className="score-glow text-lime-300">{jogoTicker.homeScore ?? 0}</span>
                            <span className="mx-2 text-slate-600">:</span>
                            <span className="text-cyan-300">{jogoTicker.awayScore ?? 0}</span>
                          </p>
                        </div>
                        <TeamColumn side="away" team={jogoTicker.awayTeam} score={jogoTicker.awayScore} alignRight />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <MiniInsight label="Hora" value={jogoTicker.startTime ? new Date(jogoTicker.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"} />
                        <MiniInsight label="Status" value={formatStatus(jogoTicker.status, jogoTicker.minute)} />
                        <MiniInsight label="Liga" value={jogoTicker.league?.name || "-"} />
                      </div>
                    </div>

                    <div className="glass-card rounded-[24px] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Pulso da partida</p>
                      <div className="mt-4 space-y-4">
                        <PulseBar label="Momento" value={Math.min(100, 28 + ((jogoTicker.minute || 0) * 1.1))} />
                        <PulseBar label="Ritmo" value={Math.min(100, 36 + ((jogoTicker.homeScore || 0) + (jogoTicker.awayScore || 0)) * 18)} color="cyan" />
                        <PulseBar label="Atenção" value={["1H", "2H", "HT"].includes(jogoTicker.status) ? 88 : 42} color="amber" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="glass-card-strong rounded-[30px] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Filtro rápido</p>
                <h4 className="mt-1 text-lg font-black tracking-[-0.04em] text-white">Ligas e jogos</h4>
              </div>
              <div className="sport-chip border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <Target className="h-3.5 w-3.5" />
                seleção dinâmica
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroLiga("todas")}
                className={cn("sport-chip", filtroLiga === "todas" && "sport-chip-active")}
              >
                Todas
              </button>
              {ligas.slice(0, 10).map((liga) => (
                <button
                  key={liga}
                  onClick={() => setFiltroLiga(liga)}
                  className={cn("sport-chip normal-case tracking-normal", filtroLiga === liga && "sport-chip-active")}
                >
                  {liga}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card-strong rounded-[30px] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Board</p>
                <h4 className="mt-1 text-lg font-black tracking-[-0.04em] text-white">Jogos do dia</h4>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                {jogosFiltrados.length} partidas
              </span>
            </div>

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {jogosFiltrados.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                  Nenhum jogo encontrado para esta combinação.
                </div>
              )}

              {jogosFiltrados.map((jogo) => {
                const ativo = jogoSelecionado?.id === jogo.id;
                const aoVivoJogo = ["1H", "2H", "HT"].includes(jogo.status);
                return (
                  <button
                    key={jogo.id}
                    onClick={() => setJogoSelecionado(jogo)}
                    className={cn(
                      "gradient-outline w-full rounded-[24px] border p-4 text-left transition-all",
                      ativo
                        ? "border-lime-400/30 bg-lime-400/10 shadow-[0_0_40px_rgba(163,230,53,0.10)]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs uppercase tracking-[0.18em] text-slate-500">{jogo.league?.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                          aoVivoJogo ? "bg-red-500/10 text-red-200" : "bg-white/6 text-slate-400",
                        )}
                      >
                        {formatStatus(jogo.status, jogo.minute)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <CompactTeam team={jogo.homeTeam} />
                      <div className="text-center">
                        <p className="text-2xl font-black tracking-[-0.06em] text-white">
                          <span className="text-lime-300">{jogo.homeScore ?? 0}</span>
                          <span className="mx-1.5 text-slate-600">:</span>
                          <span className="text-cyan-300">{jogo.awayScore ?? 0}</span>
                        </p>
                      </div>
                      <CompactTeam team={jogo.awayTeam} alignRight />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{jogo.startTime ? new Date(jogo.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
                      <span>{jogo.minute ? `${jogo.minute}'` : "pré-jogo"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </RaphaLayout>
  );
}

function TeamColumn({
  team,
  score,
  alignRight = false,
}: {
  side: "home" | "away";
  team?: any;
  score?: number | null;
  alignRight?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", alignRight && "justify-end text-right")}>
      {team?.logo && <img src={team.logo} alt={team?.name || "Time"} className="h-12 w-12 rounded-2xl object-contain bg-white/95 p-2" />}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{alignRight ? "Visitante" : "Mandante"}</p>
        <p className="mt-1 text-lg font-bold text-white">{team?.name || "Time"}</p>
        <p className="mt-1 text-xs text-slate-400">Gols: {score ?? 0}</p>
      </div>
    </div>
  );
}

function CompactTeam({ team, alignRight = false }: { team?: any; alignRight?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", alignRight && "flex-row-reverse text-right")}>
      {team?.logo && <img src={team.logo} alt={team?.name || "Time"} className="h-9 w-9 rounded-xl bg-white/95 p-1.5 object-contain" />}
      <p className="truncate text-sm font-semibold text-white">{team?.name || "Time"}</p>
    </div>
  );
}

function MiniInsight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function PulseBar({
  label,
  value,
  color = "lime",
}: {
  label: string;
  value: number;
  color?: "lime" | "cyan" | "amber";
}) {
  const tone =
    color === "cyan"
      ? "from-cyan-400 to-blue-500"
      : color === "amber"
      ? "from-amber-300 to-orange-500"
      : "from-lime-300 to-emerald-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-bold text-white">{Math.round(value)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/6">
        <div className={cn("h-2.5 rounded-full bg-gradient-to-r transition-all duration-500", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
