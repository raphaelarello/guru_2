import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Zap, Target, AlertTriangle, TrendingUp, Users, Star,
  ChevronRight, Flame, Calendar, RefreshCw, Shield, Sparkles, Crown,
  Filter
} from "lucide-react";
import RaphaLayout from "@/components/RaphaLayout";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 1);
    return d;
  });
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {days.map(d => {
        const iso = d.toISOString().slice(0, 10);
        const isToday = iso === new Date().toISOString().slice(0, 10);
        const isSelected = iso === value;
        const label = isToday ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
        return (
          <button
            key={iso}
            onClick={() => onChange(iso)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSelected
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TeamLogo({ src, name, size = 32 }: { src?: string; name: string; size?: number }) {
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=${size}&background=1e293b&color=94a3b8&bold=true`}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-contain bg-slate-800 p-0.5 flex-shrink-0 ring-1 ring-slate-700"
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=${size}&background=1e293b&color=94a3b8&bold=true`;
      }}
    />
  );
}

type DestaquesPartida = {
  fixtureId: number; homeTeam: string; homeTeamLogo?: string;
  awayTeam: string; awayTeamLogo?: string; leagueName: string;
  countryFlag?: string; matchTime: string;
  palpite: string; confianca: "Alta" | "Media" | "Baixa"; motivo: string;
};

type DestaquesData = {
  totalJogos: number; totalLigas: number;
  palpitesBTTS: DestaquesPartida[];
  palpitesGols: DestaquesPartida[];
  palpitesEscanteios: DestaquesPartida[];
};

// ─── Card Premium de Palpite ──────────────────────────────────────────────────

function PalpiteCard({ palpite }: { palpite: DestaquesPartida }) {
  const coresConfig = {
    Alta: { bg: "bg-emerald-950/40", border: "border-emerald-500/50", text: "text-emerald-300", badge: "bg-emerald-500/25 border-emerald-500/60 text-emerald-200", line: "from-emerald-500 to-emerald-600" },
    Media: { bg: "bg-yellow-950/40", border: "border-yellow-500/50", text: "text-yellow-300", badge: "bg-yellow-500/25 border-yellow-500/60 text-yellow-200", line: "from-yellow-500 to-yellow-600" },
    Baixa: { bg: "bg-orange-950/40", border: "border-orange-500/50", text: "text-orange-300", badge: "bg-orange-500/25 border-orange-500/60 text-orange-200", line: "from-orange-500 to-orange-600" },
  };

  const cores = coresConfig[palpite.confianca];

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${cores.bg} ${cores.border} transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/60 hover:-translate-y-2 cursor-pointer backdrop-blur-sm`}>
      {/* Linha de destaque no topo */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cores.line}`} />

      <div className="p-5 relative z-10 space-y-4">
        {/* Header com times - Layout melhorado */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamLogo src={palpite.homeTeamLogo} name={palpite.homeTeam} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{palpite.homeTeam}</p>
              <p className="text-xs text-slate-400 truncate">{palpite.leagueName}</p>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-xs text-slate-500 mb-1 font-medium">vs</p>
            <p className="text-sm font-bold text-slate-300">{palpite.matchTime}</p>
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-bold text-white truncate">{palpite.awayTeam}</p>
              <p className="text-xs text-slate-400 truncate">{palpite.countryFlag}</p>
            </div>
            <TeamLogo src={palpite.awayTeamLogo} name={palpite.awayTeam} size={36} />
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />

        {/* Palpite em destaque - Design premium */}
        <div className={`p-4 rounded-lg border ${cores.badge} bg-opacity-40 backdrop-blur-sm`}>
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Palpite</p>
          <p className={`text-base font-bold ${cores.text}`}>{palpite.palpite}</p>
        </div>

        {/* Motivo em texto pequeno */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{palpite.motivo}</p>

        {/* Footer com Badge de confiança */}
        <div className="flex items-center justify-between pt-2">
          <Badge className={`${cores.badge} border font-semibold text-xs`}>
            {palpite.confianca === "Alta" && <Zap className="w-3 h-3 mr-1.5" />}
            {palpite.confianca === "Media" && <Target className="w-3 h-3 mr-1.5" />}
            {palpite.confianca === "Baixa" && <AlertTriangle className="w-3 h-3 mr-1.5" />}
            {palpite.confianca}
          </Badge>
          <div className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-400 transition-colors">
            <ChevronRight className="w-3 h-3" />
            Ver
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Destaques() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const destaquesQuery = trpc.destaques.hoje.useQuery({ date });
  const data = destaquesQuery.data as any | undefined;

  // Extrair ligas únicas dos dados
  const uniqueLeagues = useMemo(() => {
    if (!data) return [];
    const ligas = new Set<string>();
    [...data.palpitesBTTS, ...data.palpitesGols, ...data.palpitesEscanteios].forEach((p: any) => {
      ligas.add(p.leagueName);
    });
    return Array.from(ligas).sort();
  }, [data]);

  // Filtrar palpites por liga selecionada
  const palpitesFiltrados = useMemo(() => {
    if (!data) return { btts: [], gols: [], escanteios: [] };
    const filtrar = (arr: any[]) =>
      selectedLeague === null ? arr : arr.filter(p => p.leagueName === uniqueLeagues[selectedLeague]);
    return {
      btts: filtrar(data.palpitesBTTS),
      gols: filtrar(data.palpitesGols),
      escanteios: filtrar(data.palpitesEscanteios),
    };
  }, [data, selectedLeague, uniqueLeagues]);

  const isLoading = destaquesQuery.isLoading;

  return (
    <RaphaLayout title="Destaques">
      <div className="space-y-5">
        {/* Header com Data e Filtro */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Destaques do Dia
            </h1>
            <div className="text-sm text-slate-400">
              {data?.totalJogos || 0} jogos · {data?.totalLigas || 0} ligas
            </div>
          </div>

          {/* Seletor de Datas */}
          <DatePicker value={date} onChange={setDate} />

          {/* Filtro de Ligas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <button
              onClick={() => setSelectedLeague(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedLeague === null
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
              }`}
            >
              Todas as Ligas
            </button>
            {uniqueLeagues.map((liga, idx) => (
              <button
                key={liga}
                onClick={() => setSelectedLeague(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
                  selectedLeague === idx
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                {liga}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs de Palpites */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Carregando destaques...
          </div>
        ) : (
          <Tabs defaultValue="btts" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
              <TabsTrigger value="btts" className="text-xs">
                🎯 Ambas Marcam ({palpitesFiltrados.btts.length})
              </TabsTrigger>
              <TabsTrigger value="gols" className="text-xs">
                ⚽ Gols ({palpitesFiltrados.gols.length})
              </TabsTrigger>
              <TabsTrigger value="escanteios" className="text-xs">
                🚩 Escanteios ({palpitesFiltrados.escanteios.length})
              </TabsTrigger>
            </TabsList>

            {/* Grid de Cards Premium */}
            <TabsContent value="btts" className="mt-4">
              {palpitesFiltrados.btts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhum palpite disponível
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {palpitesFiltrados.btts.map(p => (
                    <PalpiteCard key={p.fixtureId} palpite={p} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="gols" className="mt-4">
              {palpitesFiltrados.gols.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhum palpite disponível
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {palpitesFiltrados.gols.map(p => (
                    <PalpiteCard key={p.fixtureId} palpite={p} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="escanteios" className="mt-4">
              {palpitesFiltrados.escanteios.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhum palpite disponível
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {palpitesFiltrados.escanteios.map(p => (
                    <PalpiteCard key={p.fixtureId} palpite={p} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </RaphaLayout>
  );
}
