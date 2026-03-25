
import { useMemo, useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { trpc } from "@/lib/trpc";
import CompactMatchCard from "@/components/live/CompactMatchCard";
import { Activity, BellRing, CalendarDays, Flame, Radar, Sparkles, TrendingUp, Trophy } from "lucide-react";

type MiniEvento = { jogador: string; minuto: string; tipo?: string };

function numeroStat(stats: any[] | undefined, teamIndex: number, type: string) {
  const raw = stats?.[teamIndex]?.statistics?.find((s: any) => s.type === type)?.value;
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === "string") return parseFloat(raw.replace("%", "")) || 0;
  return typeof raw === "number" ? raw : 0;
}

function resumirEventos(fixture: any) {
  const eventos = Array.isArray(fixture?.events) ? fixture.events : [];
  const golsCasa: MiniEvento[] = [];
  const golsFora: MiniEvento[] = [];
  let amarelosCasa = 0;
  let amarelosFora = 0;
  let vermelhosCasa = 0;
  let vermelhosFora = 0;

  for (const evento of eventos) {
    const ehCasa = evento.team?.id === fixture?.teams?.home?.id;
    if (evento.type === "Goal") {
      const payload = {
        jogador: evento.player?.name || "Gol",
        minuto: `${evento.time?.elapsed || 0}'`,
        tipo: evento.detail || "Gol",
      };
      if (ehCasa) golsCasa.push(payload);
      else golsFora.push(payload);
    }
    if (evento.type === "Card") {
      const red = String(evento.detail || "").toLowerCase().includes("red");
      if (ehCasa) red ? vermelhosCasa++ : amarelosCasa++;
      else red ? vermelhosFora++ : amarelosFora++;
    }
  }

  return { golsCasa, golsFora, amarelosCasa, amarelosFora, vermelhosCasa, vermelhosFora };
}

function resumirStats(fixture: any) {
  const stats = fixture?.statistics || [];
  const escanteiosCasa = numeroStat(stats, 0, "Corner Kicks");
  const escanteiosFora = numeroStat(stats, 1, "Corner Kicks");
  const posseCasa = numeroStat(stats, 0, "Ball Possession");
  const posseFora = numeroStat(stats, 1, "Ball Possession");
  const chutesGolCasa = numeroStat(stats, 0, "Shots on Goal");
  const chutesGolFora = numeroStat(stats, 1, "Shots on Goal");
  const ataquesCasa = numeroStat(stats, 0, "Dangerous Attacks");
  const ataquesFora = numeroStat(stats, 1, "Dangerous Attacks");
  return {
    escanteiosCasa,
    escanteiosFora,
    posseCasa,
    posseFora,
    chutesGolCasa,
    chutesGolFora,
    pressaoCasa: ataquesCasa || chutesGolCasa * 8 || posseCasa,
    pressaoFora: ataquesFora || chutesGolFora * 8 || posseFora,
  };
}

function traduzirMercado(texto?: string) {
  if (!texto) return "Sinal detectado";
  return texto
    .replace(/over/ig, "Mais de")
    .replace(/under/ig, "Menos de")
    .replace(/btts/ig, "Ambas marcam")
    .replace(/corners/ig, "escanteios")
    .replace(/cards/ig, "cartões");
}

export function Home() {
  const [fixtureAtivo, setFixtureAtivo] = useState<number | null>(null);
  const dashboard = trpc.football.dashboardAoVivo.useQuery(undefined, { refetchInterval: 15000 });
  const alertas = trpc.football.centralAlertas.useQuery(undefined, { refetchInterval: 20000 });
  const jogosHoje = trpc.football.jogosHoje.useQuery(undefined, { refetchInterval: 60000 });
  const apiUsage = trpc.football.apiUsage.useQuery();

  const liveGames = dashboard.data?.jogos || [];
  const cards = useMemo(() => liveGames.slice(0, 8).map((jogo: any) => ({
    id: jogo.fixture.fixture.id,
    homeTeam: jogo.fixture.teams.home,
    awayTeam: jogo.fixture.teams.away,
    homeScore: jogo.fixture.goals.home,
    awayScore: jogo.fixture.goals.away,
    minute: jogo.fixture.fixture.status.elapsed,
    status: jogo.fixture.fixture.status.short,
    stadium: jogo.fixture.fixture.venue?.name || jogo.fixture.league?.name,
    eventosResumo: resumirEventos(jogo.fixture),
    estatisticasResumo: resumirStats(jogo.fixture),
    oportunidadesResumo: (jogo.oportunidades || []).slice(0, 2).map((o: any) => ({
      titulo: traduzirMercado(o.mercado),
      confianca: o.confianca,
      urgencia: o.urgencia,
    })),
  })), [liveGames]);

  const heroMetrics = [
    { titulo: "Ao vivo agora", valor: dashboard.data?.totalJogos ?? 0, icone: Activity, destaque: "text-emerald-300" },
    { titulo: "Alertas ativos", valor: alertas.data?.length ?? 0, icone: BellRing, destaque: "text-cyan-300" },
    { titulo: "Sinais do motor", valor: dashboard.data?.totalOportunidades ?? 0, icone: Sparkles, destaque: "text-fuchsia-300" },
    { titulo: "Jogos do dia", valor: Array.isArray(jogosHoje.data) ? jogosHoje.data.length : 0, icone: CalendarDays, destaque: "text-amber-300" },
  ];

  const feedAlertas = (alertas.data || []).slice(0, 10);
  const destaques = cards.slice(0, 4);

  return (
    <RaphaLayout
      title="Painel"
      subtitle="Visão rápida para decisão. Mais informação útil por tela, sem poluição."
    >
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroMetrics.map((item) => {
              const Icon = item.icone;
              return (
                <a
                  key={item.titulo}
                  href={
                    item.titulo === "Ao vivo agora" ? "/ao-vivo" :
                    item.titulo === "Jogos do dia" ? "/jogos-hoje" :
                    item.titulo === "Sinais do motor" ? "/pitacos" : "/ao-vivo"
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/25 hover:bg-white/[0.05]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] ${item.destaque}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="text-3xl font-black text-white">{item.valor}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.titulo}</div>
                </a>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(8,16,28,0.75),rgba(14,165,233,0.08))] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-emerald-300">
                  <Flame className="h-3.5 w-3.5" /> Radar principal
                </div>
                <h2 className="mt-2 text-xl font-black text-white md:text-2xl">Jogos quentes e atalhos operacionais</h2>
              </div>
              <a href="/ao-vivo" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]">
                Abrir Ao Vivo
              </a>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {destaques.map((match) => (
                <CompactMatchCard
                  key={match.id}
                  match={match}
                  ativo={fixtureAtivo === match.id}
                  onClick={() => setFixtureAtivo(match.id)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-300">Monitor ao vivo</div>
                <h3 className="mt-2 text-lg font-black text-white">Mais jogos na tela inicial</h3>
              </div>
              <a href="/jogos-hoje" className="text-sm font-semibold text-slate-300 hover:text-white">Ver todos</a>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {cards.slice(0, 6).map((match) => (
                <CompactMatchCard
                  key={match.id}
                  match={match}
                  compact
                  ativo={fixtureAtivo === match.id}
                  onClick={() => setFixtureAtivo(match.id)}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-amber-300">
              <Radar className="h-3.5 w-3.5" /> Central de Alertas
            </div>
            <div className="space-y-2">
              {feedAlertas.length > 0 ? feedAlertas.map((alerta: any, idx: number) => (
                <a
                  key={`${alerta.fixtureId}-${idx}`}
                  href={alerta.fixtureId ? `/ao-vivo?jogo=${alerta.fixtureId}` : "/ao-vivo"}
                  className="block rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{alerta.titulo}</div>
                    <div className="text-xs text-slate-400">{alerta.minuto ? `${alerta.minuto}'` : "agora"}</div>
                  </div>
                  <div className="mt-1 text-sm text-slate-300">{alerta.resumo}</div>
                </a>
              )) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Sem alertas críticos neste momento.</div>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-fuchsia-300">
              <Trophy className="h-3.5 w-3.5" /> Uso inteligente da API
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Requisições usadas hoje</span>
                <span className="font-semibold text-white">{apiUsage.data?.count ?? 0} / {apiUsage.data?.limit ?? 75000}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full bg-[linear-gradient(90deg,#22c55e,#22d3ee)]" style={{ width: `${Math.min(apiUsage.data?.percent ?? 0, 100)}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Espaço suficiente para experiência em tempo real agressiva, alertas contínuos e radar ao vivo sem comprometer a cota.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </RaphaLayout>
  );
}
