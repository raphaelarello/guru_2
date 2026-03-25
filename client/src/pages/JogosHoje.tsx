
import { useMemo, useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { trpc } from "@/lib/trpc";
import CompactMatchCard from "@/components/live/CompactMatchCard";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Flag, Radio, TimerReset } from "lucide-react";

function isoAddDays(baseIso: string, delta: number) {
  const d = new Date(`${baseIso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function labelData(iso: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (iso === hoje) return "Hoje";
  const amanha = isoAddDays(hoje, 1);
  if (iso === amanha) return "Amanhã";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function getEventosResumo(match: any) {
  const eventos = Array.isArray(match.events) ? match.events : [];
  let amarelosCasa = 0, amarelosFora = 0, vermelhosCasa = 0, vermelhosFora = 0;
  const golsCasa = [], golsFora = [];
  for (const event of eventos) {
    const casa = event.team?.name === match.homeTeam?.name;
    if (event.type === "Goal") {
      const item = { jogador: event.player || "Gol", minuto: `${event.minute || 0}'`, tipo: event.detail || "Gol" };
      if (casa) golsCasa.push(item); else golsFora.push(item);
    }
    if (event.type === "Card") {
      const red = String(event.detail || "").toLowerCase().includes("red");
      if (casa) red ? vermelhosCasa++ : amarelosCasa++;
      else red ? vermelhosFora++ : amarelosFora++;
    }
  }
  return { golsCasa, golsFora, amarelosCasa, amarelosFora, vermelhosCasa, vermelhosFora };
}

export default function JogosHoje() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [filtro, setFiltro] = useState<"todos" | "ao-vivo" | "proximos" | "encerrados">("todos");
  const [ligaAtiva, setLigaAtiva] = useState<string>("todas");

  const query = trpc.matches.getByDate.useQuery({ date }, { refetchInterval: 30000 });
  const live = trpc.matches.getLive.useQuery(undefined, { refetchInterval: 15000 });

  const liveIds = useMemo(() => new Set((live.data || []).map((m: any) => m.id)), [live.data]);

  const jogos = useMemo(() => {
    const base = (query.data || []).map((match: any) => ({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      minute: match.minute,
      status: match.status,
      stadium: match.stadium,
      league: match.league,
      eventosResumo: getEventosResumo(match),
      estatisticasResumo: {
        escanteiosCasa: 0,
        escanteiosFora: 0,
        posseCasa: 0,
        posseFora: 0,
        chutesGolCasa: 0,
        chutesGolFora: 0,
        pressaoCasa: 50,
        pressaoFora: 50,
      },
      oportunidadesResumo: [],
    }));

    return base.filter((jogo: any) => {
      if (ligaAtiva !== "todas" && jogo.league?.name !== ligaAtiva) return false;
      if (filtro === "ao-vivo") return liveIds.has(jogo.id) || ["1H", "2H", "HT", "ET", "P"].includes(jogo.status);
      if (filtro === "proximos") return jogo.status === "NS";
      if (filtro === "encerrados") return jogo.status === "FT";
      return true;
    });
  }, [query.data, liveIds, filtro, ligaAtiva]);

  const ligas = useMemo(() => {
    const unique = new Set((query.data || []).map((m: any) => m.league?.name).filter(Boolean));
    return ["todas", ...Array.from(unique)];
  }, [query.data]);

  const tabs = [
    { key: "todos", label: "Todos", icon: Filter },
    { key: "ao-vivo", label: "Ao Vivo", icon: Radio },
    { key: "proximos", label: "Próximos", icon: CalendarDays },
    { key: "encerrados", label: "Encerrados", icon: TimerReset },
  ] as const;

  return (
    <RaphaLayout
      title="Jogos"
      subtitle="Filtros clicáveis, datas no topo e leitura rápida para navegar por dia, liga e status."
    >
      <div className="space-y-4">
        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDate((d) => isoAddDays(d, -1))} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white">
                {labelData(date)}
              </div>
              <button type="button" onClick={() => setDate((d) => isoAddDays(d, 1))} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]">
                <ChevronRight className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const ativo = filtro === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFiltro(tab.key)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                      ativo
                        ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                        : "border-white/8 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {ligas.map((liga) => (
              <button
                key={String(liga)}
                type="button"
                onClick={() => setLigaAtiva(String(liga))}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all",
                  ligaAtiva === liga
                    ? "border-cyan-400/30 bg-cyan-500/12 text-cyan-200"
                    : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <Flag className="h-3.5 w-3.5" />
                {liga === "todas" ? "Todas as ligas" : String(liga)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 2xl:grid-cols-2">
          {jogos.map((jogo: any) => (
            <CompactMatchCard
              key={jogo.id}
              match={jogo}
              compact
              onClick={() => {
                window.location.href = liveIds.has(jogo.id) ? `/ao-vivo?jogo=${jogo.id}` : `/ao-vivo?jogo=${jogo.id}`;
              }}
            />
          ))}
        </div>

        {jogos.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
            Nenhum jogo encontrado para os filtros escolhidos.
          </div>
        ) : null}
      </div>
    </RaphaLayout>
  );
}
