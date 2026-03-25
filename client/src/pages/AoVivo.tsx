
import { useEffect, useMemo, useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { trpc } from "@/lib/trpc";
import CompactMatchCard from "@/components/live/CompactMatchCard";
import {
  Activity, ArrowRight, BellRing, ChevronRight, Flag, ShieldAlert, Sparkles, Target, X
} from "lucide-react";

function numeroStat(stats: any[] | undefined, teamIndex: number, type: string) {
  const raw = stats?.[teamIndex]?.statistics?.find((s: any) => s.type === type)?.value;
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === "string") return parseFloat(raw.replace("%", "")) || 0;
  return typeof raw === "number" ? raw : 0;
}

function resumirFixture(fixture: any, oportunidades: any[] = []) {
  const events = fixture?.events || [];
  const homeId = fixture?.teams?.home?.id;
  const awayId = fixture?.teams?.away?.id;
  const golsCasa = [];
  const golsFora = [];
  let amarelosCasa = 0, amarelosFora = 0, vermelhosCasa = 0, vermelhosFora = 0;

  for (const event of events) {
    const home = event.team?.id === homeId;
    if (event.type === "Goal") {
      const item = { jogador: event.player?.name || "Gol", minuto: `${event.time?.elapsed || 0}'`, tipo: event.detail || "Gol" };
      if (home) golsCasa.push(item); else golsFora.push(item);
    }
    if (event.type === "Card") {
      const red = String(event.detail || "").toLowerCase().includes("red");
      if (home) red ? vermelhosCasa++ : amarelosCasa++;
      else red ? vermelhosFora++ : amarelosFora++;
    }
  }

  const escanteiosCasa = numeroStat(fixture.statistics, 0, "Corner Kicks");
  const escanteiosFora = numeroStat(fixture.statistics, 1, "Corner Kicks");
  const posseCasa = numeroStat(fixture.statistics, 0, "Ball Possession");
  const posseFora = numeroStat(fixture.statistics, 1, "Ball Possession");
  const chutesGolCasa = numeroStat(fixture.statistics, 0, "Shots on Goal");
  const chutesGolFora = numeroStat(fixture.statistics, 1, "Shots on Goal");
  const ataquesCasa = numeroStat(fixture.statistics, 0, "Dangerous Attacks");
  const ataquesFora = numeroStat(fixture.statistics, 1, "Dangerous Attacks");

  return {
    id: fixture.fixture.id,
    homeTeam: fixture.teams.home,
    awayTeam: fixture.teams.away,
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    minute: fixture.fixture.status.elapsed,
    status: fixture.fixture.status.short,
    stadium: fixture.fixture.venue?.name || fixture.league?.name,
    eventosResumo: { golsCasa, golsFora, amarelosCasa, amarelosFora, vermelhosCasa, vermelhosFora },
    estatisticasResumo: {
      escanteiosCasa,
      escanteiosFora,
      posseCasa,
      posseFora,
      chutesGolCasa,
      chutesGolFora,
      pressaoCasa: ataquesCasa || chutesGolCasa * 8 || posseCasa,
      pressaoFora: ataquesFora || chutesGolFora * 8 || posseFora,
    },
    oportunidadesResumo: oportunidades.slice(0, 2).map((o: any) => ({
      titulo: String(o.mercado || "Sinal").replace(/over/ig, "Mais de").replace(/under/ig, "Menos de"),
      confianca: o.confianca,
      urgencia: o.urgencia,
    })),
  };
}

function corUrgencia(urgencia?: string) {
  if (urgencia === "alta") return "border-red-500/20 bg-red-500/10 text-red-100";
  if (urgencia === "media") return "border-amber-500/20 bg-amber-500/10 text-amber-100";
  return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
}

export default function AoVivo() {
  const dashboard = trpc.football.dashboardAoVivo.useQuery(undefined, { refetchInterval: 12000 });
  const alertas = trpc.football.centralAlertas.useQuery(undefined, { refetchInterval: 20000 });

  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const selectedQuery = trpc.football.radarJogo.useQuery(
    { fixtureId: selectedFixtureId || 0 },
    { enabled: !!selectedFixtureId, refetchInterval: 12000 }
  );

  const jogos = useMemo(() => (dashboard.data?.jogos || []).map((jogo: any) => ({
    raw: jogo,
    resumo: resumirFixture(jogo.fixture, jogo.oportunidades || []),
  })), [dashboard.data]);

  useEffect(() => {
    if (!selectedFixtureId && jogos[0]?.resumo?.id) setSelectedFixtureId(jogos[0].resumo.id);
  }, [jogos, selectedFixtureId]);

  const selecionado = selectedQuery.data?.fixture;
  const radar = selectedQuery.data?.radar || [];
  const oportunidades = selectedQuery.data?.oportunidades || [];
  const recenteAlertas = (alertas.data || []).slice(0, 6);

  return (
    <RaphaLayout
      title="Ao Vivo"
      subtitle="Leitura operacional. Mais contexto, menos cliques, painel lateral mais limpo."
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Partidas ativas</div>
              <div className="mt-2 text-3xl font-black text-white">{dashboard.data?.totalJogos ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Sinais do motor</div>
              <div className="mt-2 text-3xl font-black text-white">{dashboard.data?.totalOportunidades ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Alertas relevantes</div>
              <div className="mt-2 text-3xl font-black text-white">{alertas.data?.length ?? 0}</div>
            </div>
          </div>

          <div className="grid gap-3 2xl:grid-cols-2">
            {jogos.map(({ raw, resumo }: any) => (
              <CompactMatchCard
                key={resumo.id}
                match={resumo}
                ativo={selectedFixtureId === resumo.id}
                onClick={() => setSelectedFixtureId(resumo.id)}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-[112px] xl:h-[calc(100vh-130px)] xl:overflow-y-auto pr-1">
          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,30,0.96),rgba(7,11,22,0.98))] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-300">Centro do jogo</div>
                <h3 className="mt-2 text-xl font-black text-white">
                  {selecionado ? `${selecionado.teams.home.name} × ${selecionado.teams.away.name}` : "Selecione uma partida"}
                </h3>
              </div>
              {selectedFixtureId ? (
                <button
                  type="button"
                  onClick={() => setSelectedFixtureId(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {selecionado ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Placar</div>
                    <div className="mt-2 font-mono text-4xl font-black text-white">
                      {selecionado.goals.home ?? 0}<span className="mx-1 text-slate-500">×</span>{selecionado.goals.away ?? 0}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{selecionado.fixture.status.elapsed ?? 0}' • {selecionado.league.name}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Volume do jogo</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                      <div><Flag className="mr-1 inline h-3.5 w-3.5 text-cyan-300" /> {numeroStat(selecionado.statistics, 0, "Corner Kicks")} × {numeroStat(selecionado.statistics, 1, "Corner Kicks")}</div>
                      <div><ShieldAlert className="mr-1 inline h-3.5 w-3.5 text-amber-300" /> {selecionado.events?.filter((e: any) => e.type === "Card").length ?? 0} cartões</div>
                      <div><Target className="mr-1 inline h-3.5 w-3.5 text-emerald-300" /> {numeroStat(selecionado.statistics, 0, "Shots on Goal")} × {numeroStat(selecionado.statistics, 1, "Shots on Goal")}</div>
                      <div><Activity className="mr-1 inline h-3.5 w-3.5 text-fuchsia-300" /> {numeroStat(selecionado.statistics, 0, "Dangerous Attacks") + numeroStat(selecionado.statistics, 1, "Dangerous Attacks")} ataques</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">Radar Inteligente</div>
                    <div className="space-y-2">
                      {radar.length > 0 ? radar.map((item: any, index: number) => (
                        <div key={`${item.titulo}-${index}`} className={`rounded-2xl border p-3 ${corUrgencia(item.urgencia)}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold">{item.titulo}</div>
                            <div className="text-xs">{item.confianca}%</div>
                          </div>
                          <div className="mt-1 text-sm text-slate-200/90">{item.explicacao}</div>
                        </div>
                      )) : <div className="rounded-2xl border border-dashed border-white/10 p-3 text-sm text-slate-400">Sem radar calculado ainda.</div>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">Mercados encontrados</div>
                    <div className="space-y-2">
                      {oportunidades.slice(0, 5).map((op: any, index: number) => (
                        <div key={`${op.mercado}-${index}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-white">{String(op.mercado || "Sinal").replace(/over/ig, "Mais de").replace(/under/ig, "Menos de")}</div>
                            <div className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">{op.confianca}%</div>
                          </div>
                          <div className="mt-1 text-sm text-slate-300">{Array.isArray(op.motivos) ? op.motivos.join(" • ") : "Leitura do motor ao vivo"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      <BellRing className="h-3.5 w-3.5 text-cyan-300" /> Central de Alertas
                    </div>
                    <div className="space-y-2">
                      {recenteAlertas.map((alerta: any, idx: number) => (
                        <div key={`${alerta.fixtureId}-${idx}`} className={`rounded-2xl border p-3 ${corUrgencia(alerta.prioridade)}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold">{alerta.titulo}</div>
                            <div className="text-xs">{alerta.minuto ? `${alerta.minuto}'` : "agora"}</div>
                          </div>
                          <div className="mt-1 text-sm text-slate-200/90">{alerta.resumo}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">Linha de eventos</div>
                    <div className="space-y-2">
                      {(selecionado.events || []).slice(-8).reverse().map((event: any, idx: number) => (
                        <div key={`${event.type}-${idx}`} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                          <div className="mt-0.5 rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-slate-300">{event.time?.elapsed || 0}'</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white">{event.player?.name || event.team?.name || "Evento"}</div>
                            <div className="text-sm text-slate-400">{event.detail || event.type}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                Clique em um jogo para abrir o painel lateral compacto.
              </div>
            )}
          </div>
        </aside>
      </div>
    </RaphaLayout>
  );
}
