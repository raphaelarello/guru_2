
import { Activity, Flag, ShieldAlert, Timer, Flame, ChevronRight } from "lucide-react";

type TeamMini = { name?: string | null; logo?: string | null };
type MatchLike = {
  id: number;
  homeTeam?: TeamMini | null;
  awayTeam?: TeamMini | null;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
  status?: string | null;
  stadium?: string | null;
  eventosResumo?: {
    golsCasa: Array<{ jogador: string; minuto: string; tipo?: string }>;
    golsFora: Array<{ jogador: string; minuto: string; tipo?: string }>;
    amarelosCasa: number;
    amarelosFora: number;
    vermelhosCasa: number;
    vermelhosFora: number;
  };
  estatisticasResumo?: {
    escanteiosCasa: number;
    escanteiosFora: number;
    posseCasa: number;
    posseFora: number;
    chutesGolCasa: number;
    chutesGolFora: number;
    pressaoCasa: number;
    pressaoFora: number;
  };
  oportunidadesResumo?: {
    titulo?: string;
    confianca?: number;
    urgencia?: string;
  }[];
};

function bolinhas(total: number, tipo: "cartao" | "escanteio" | "gol", destaque = false) {
  const capped = Math.max(0, Math.min(total, 6));
  return Array.from({ length: capped }).map((_, index) => (
    <span
      key={`${tipo}-${index}`}
      className={[
        "inline-block h-1.5 w-1.5 rounded-full",
        tipo === "cartao" ? "bg-amber-400" : "",
        tipo === "escanteio" ? "bg-cyan-400" : "",
        tipo === "gol" ? "bg-emerald-400" : "",
        destaque ? "shadow-[0_0_8px_rgba(34,197,94,0.55)]" : "",
      ].join(" ")}
    />
  ));
}

function miniTextoGol(item?: { jogador: string; minuto: string; tipo?: string }) {
  if (!item) return "Sem gol";
  const nome = item.jogador.split(" ").slice(-1)[0];
  return `${nome} ${item.minuto}`;
}

function statusLegivel(status?: string | null, minute?: number | null) {
  if (status === "HT") return "Intervalo";
  if (status === "FT") return "Encerrado";
  if (status === "NS") return "Agendado";
  if (minute) return `${minute}'`;
  return status || "—";
}

export default function CompactMatchCard({
  match,
  ativo = false,
  onClick,
  compact = false,
}: {
  match: MatchLike;
  ativo?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const stats = match.estatisticasResumo;
  const resumo = match.eventosResumo;
  const pressaoCasa = stats?.pressaoCasa ?? 50;
  const pressaoFora = stats?.pressaoFora ?? 50;
  const totalPressao = Math.max(1, pressaoCasa + pressaoFora);
  const pressaoCasaPct = Math.round((pressaoCasa / totalPressao) * 100);
  const pressaoForaPct = 100 - pressaoCasaPct;
  const topSignal = match.oportunidadesResumo?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-2xl border text-left transition-all duration-200",
        "bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(7,11,22,0.96))]",
        "border-white/10 hover:border-emerald-400/30 hover:-translate-y-0.5",
        "shadow-[0_12px_32px_rgba(0,0,0,0.22)]",
        compact ? "p-3" : "p-4",
        ativo ? "ring-1 ring-emerald-400/45 border-emerald-400/40" : "",
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-400">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="truncate">{match.stadium || "Centro de jogo"}</span>
          </div>
          <div className="text-[11px] font-medium text-slate-300">
            {statusLegivel(match.status, match.minute)}
          </div>
        </div>

        <div className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-200">
          <Timer className="mr-1 inline h-3.5 w-3.5" />
          {statusLegivel(match.status, match.minute)}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {match.homeTeam?.logo ? <img src={match.homeTeam.logo} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" /> : <div className="h-8 w-8 rounded-full bg-white/5" />}
            <div className="truncate">
              <div className="truncate text-base font-semibold text-white">{match.homeTeam?.name || "Mandante"}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
                {bolinhas((resumo?.amarelosCasa ?? 0) + (resumo?.vermelhosCasa ?? 0), "cartao")}
                <span>{stats?.escanteiosCasa ?? 0} esc.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-mono text-4xl font-black tracking-tight text-white">
            {match.homeScore ?? 0}
            <span className="mx-1 text-slate-500">×</span>
            {match.awayScore ?? 0}
          </div>
          {topSignal ? (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
              <Flame className="h-3 w-3" />
              {topSignal.titulo || "Oportunidade"}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-end gap-2">
            <div className="truncate text-right">
              <div className="truncate text-base font-semibold text-white">{match.awayTeam?.name || "Visitante"}</div>
              <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-slate-300">
                <span>{stats?.escanteiosFora ?? 0} esc.</span>
                {bolinhas((resumo?.amarelosFora ?? 0) + (resumo?.vermelhosFora ?? 0), "cartao")}
              </div>
            </div>
            {match.awayTeam?.logo ? <img src={match.awayTeam.logo} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" /> : <div className="h-8 w-8 rounded-full bg-white/5" />}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">Quem marcou</div>
          <div className="space-y-1">
            <div className="truncate text-white">{miniTextoGol(resumo?.golsCasa?.[0])}</div>
            <div className="truncate text-slate-400">{miniTextoGol(resumo?.golsFora?.[0])}</div>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500">
            <span>Pressão</span>
            <span>{pressaoCasaPct}% × {pressaoForaPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div className="flex h-full">
              <div className="bg-[linear-gradient(90deg,#22c55e,#22d3ee)]" style={{ width: `${pressaoCasaPct}%` }} />
              <div className="bg-[linear-gradient(90deg,#f59e0b,#ef4444)]" style={{ width: `${pressaoForaPct}%` }} />
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>{stats?.chutesGolCasa ?? 0} ch. gol</span>
            <span>{stats?.chutesGolFora ?? 0} ch. gol</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-slate-400">
          <Flag className="h-3.5 w-3.5 text-cyan-300" />
          <div className="flex items-center gap-1">{bolinhas(stats?.escanteiosCasa ?? 0, "escanteio", true)}</div>
          <span>{stats?.escanteiosCasa ?? 0}</span>
          <span className="text-slate-600">|</span>
          <span>{stats?.escanteiosFora ?? 0}</span>
          <div className="flex items-center gap-1">{bolinhas(stats?.escanteiosFora ?? 0, "escanteio", true)}</div>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
          <span>{(resumo?.amarelosCasa ?? 0) + (resumo?.vermelhosCasa ?? 0)}</span>
          <span className="text-slate-600">×</span>
          <span>{(resumo?.amarelosFora ?? 0) + (resumo?.vermelhosFora ?? 0)}</span>
          <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}
