import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Trophy, Zap, Target, AlertTriangle, TrendingUp, Users, Star,
  ChevronRight, Flame, Calendar, RefreshCw, Shield, Sparkles, Crown
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

function PlayerPhoto({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=${size}&background=1e293b&color=94a3b8&bold=true`}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover bg-slate-800 border-2 border-slate-700 flex-shrink-0 ring-2 ring-slate-600"
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=${size}&background=1e293b&color=94a3b8&bold=true`;
      }}
    />
  );
}

function CountryFlag({ src, name }: { src?: string; name: string }) {
  if (!src) return <span className="text-xs text-slate-500">{name?.slice(0, 2)}</span>;
  return (
    <img
      src={src}
      alt={name}
      width={16}
      height={12}
      className="rounded-sm object-cover flex-shrink-0 ring-1 ring-slate-600"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg leading-none animate-bounce" style={{animationDelay: "0s"}}>🥇</span>;
  if (rank === 2) return <span className="text-lg leading-none animate-bounce" style={{animationDelay: "0.1s"}}>🥈</span>;
  if (rank === 3) return <span className="text-lg leading-none animate-bounce" style={{animationDelay: "0.2s"}}>🥉</span>;
  return <span className="text-sm font-bold text-slate-500 w-6 text-center">{rank}</span>;
}

function IndicadorBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden ring-1 ring-slate-600">
        <div
          className={`h-full rounded-full transition-all duration-700 shadow-lg ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white w-7 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DestaquesTime = {
  teamId: number; teamName: string; teamLogo?: string;
  leagueName: string; leagueLogo?: string; countryFlag?: string; countryName: string;
  fixtureId: number; opponent: string; opponentLogo?: string; matchTime: string;
  placar?: string; status?: string; minuto?: number;
  indicador: number;
};

type DestaquesJogador = {
  playerId: number; playerName: string; playerPhoto?: string;
  teamName: string; teamLogo?: string; leagueName: string; countryFlag?: string;
  fixtureId: number; matchTime: string; opponent: string;
  mediaGols: number; mediaAssistencias: number; mediaChutesGol: number;
  mediaCartoes: number;
};

type DestaquesPartida = {
  fixtureId: number; homeTeam: string; homeTeamLogo?: string;
  awayTeam: string; awayTeamLogo?: string; leagueName: string;
  countryFlag?: string; matchTime: string;
  palpite: string; confianca: "Alta" | "Media" | "Baixa"; motivo: string;
};

type DestaquesData = {
  totalJogos: number; totalLigas: number;
  timesEscanteios: DestaquesTime[];
  timesGols: DestaquesTime[];
  timesChutes: DestaquesTime[];
  timesCartoes: DestaquesTime[];
  jogadoresArtilheiros: DestaquesJogador[];
  jogadoresIndisciplinados: DestaquesJogador[];
  palpitesBTTS: DestaquesPartida[];
  palpitesGols: DestaquesPartida[];
  palpitesEscanteios: DestaquesPartida[];
};

// ─── Ranking de Times com Cards Premium ───────────────────────────────────────

function RankingTimes({
  times, colorClass, unidade, maxVal, onJogoClick
}: {
  times: DestaquesTime[];
  colorClass: string;
  unidade: string;
  maxVal: number;
  onJogoClick: (id: number) => void;
}) {
  if (!times.length) return (
    <div className="text-center py-12 text-slate-500 text-sm">
      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
      Nenhum dado disponível
    </div>
  );

  return (
    <div className="space-y-3">
      {times.map((time, idx) => {
        const isTop3 = idx < 3;
        return (
          <TooltipProvider key={`${time.teamId}-${idx}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer group ${
                    isTop3
                      ? "bg-gradient-to-r from-slate-800/80 to-slate-700/50 border border-slate-600/50 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-slate-900/70"
                      : "bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50"
                  }`}
                  onClick={() => onJogoClick(time.fixtureId)}
                >
                  <div className="w-8 flex justify-center flex-shrink-0">
                    <RankBadge rank={idx + 1} />
                  </div>
                  <TeamLogo src={time.teamLogo} name={time.teamName} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${isTop3 ? "text-white" : "text-slate-100"}`}>{time.teamName}</span>
                      {time.status && (time.status.includes("Live") || time.status.includes("First") || time.status.includes("Second")) && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 flex-shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {time.minuto ? `${time.minuto}'` : "AO VIVO"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CountryFlag src={time.countryFlag} name={time.countryName} />
                      <span className="truncate">{time.leagueName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="truncate">vs {time.opponent}</span>
                      {time.placar && <><span className="text-slate-600">·</span><span className="font-bold text-emerald-400">{time.placar}</span></>}
                    </div>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <IndicadorBar value={time.indicador} max={maxVal} colorClass={colorClass} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TeamLogo src={time.opponentLogo} name={time.opponent} size={28} />
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                <p className="font-bold">{time.teamName}</p>
                <p>Média: <span className="text-emerald-400 font-bold">{time.indicador.toFixed(1)} {unidade}</span></p>
                <p className="text-slate-400">Clique para ver ao vivo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ─── Ranking de Jogadores com Cards Premium ────────────────────────────────────

function RankingJogadores({
  jogadores, tipo, onJogoClick
}: {
  jogadores: DestaquesJogador[];
  tipo: "artilheiro" | "indisciplinado";
  onJogoClick: (id: number) => void;
}) {
  if (!jogadores.length) return (
    <div className="text-center py-12 text-slate-500 text-sm">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
      Nenhum jogador em destaque
    </div>
  );

  return (
    <div className="space-y-3">
      {jogadores.map((jogador, idx) => {
        const isTop3 = idx < 3;
        return (
          <div
            key={`${jogador.playerId}-${idx}`}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer group ${
              isTop3
                ? "bg-gradient-to-r from-slate-800/80 to-slate-700/50 border border-slate-600/50 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-slate-900/70"
                : "bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50"
            }`}
            onClick={() => onJogoClick(jogador.fixtureId)}
          >
            <div className="w-8 flex justify-center flex-shrink-0">
              <RankBadge rank={idx + 1} />
            </div>
            <div className="relative flex-shrink-0">
              <PlayerPhoto src={jogador.playerPhoto} name={jogador.playerName} size={48} />
              <div className="absolute -bottom-1 -right-1 ring-2 ring-slate-900">
                <TeamLogo src={jogador.teamLogo} name={jogador.teamName} size={20} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold ${isTop3 ? "text-white" : "text-slate-100"}`}>{jogador.playerName}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <CountryFlag src={jogador.countryFlag} name={jogador.leagueName} />
                <span className="truncate">{jogador.teamName}</span>
                <span className="text-slate-600">·</span>
                <span className="truncate">vs {jogador.opponent}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {tipo === "artilheiro" ? (
                <div className="flex items-center gap-2">
                  {jogador.mediaGols > 0 && (
                    <div className="flex flex-col items-center bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <span className="text-sm font-black text-emerald-400 leading-none">{jogador.mediaGols.toFixed(0)}</span>
                      <span className="text-[10px] text-emerald-600">gols</span>
                    </div>
                  )}
                  {jogador.mediaAssistencias > 0 && (
                    <div className="flex flex-col items-center bg-blue-500/10 px-2 py-1 rounded-lg">
                      <span className="text-sm font-black text-blue-400 leading-none">{jogador.mediaAssistencias.toFixed(0)}</span>
                      <span className="text-[10px] text-blue-600">assist</span>
                    </div>
                  )}
                  {jogador.mediaChutesGol > 0 && (
                    <div className="flex flex-col items-center bg-yellow-500/10 px-2 py-1 rounded-lg">
                      <span className="text-sm font-black text-yellow-400 leading-none">{jogador.mediaChutesGol.toFixed(0)}</span>
                      <span className="text-[10px] text-yellow-600">chutes</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                  {Array.from({ length: Math.min(Math.round(jogador.mediaCartoes), 4) }).map((_, i) => (
                    <div key={i} className="w-3 h-4 bg-yellow-400 rounded-sm shadow-sm" />
                  ))}
                  <span className="text-sm font-bold text-yellow-400 ml-1">{jogador.mediaCartoes.toFixed(0)}</span>
                </div>
              )}
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Palpites com Cards Premium ────────────────────────────────────────────────

function PalpitesLista({ partidas, corClass, onJogoClick }: {
  partidas: DestaquesPartida[];
  corClass: string;
  onJogoClick: (id: number) => void;
}) {
  if (!partidas.length) return (
    <div className="text-center py-12 text-slate-500 text-sm">
      <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
      Nenhum palpite disponível
    </div>
  );
  
  return (
    <div className="space-y-3">
      {partidas.map((p, idx) => (
        <div
          key={`${p.fixtureId}-${idx}`}
          className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50 cursor-pointer transition-all group"
          onClick={() => onJogoClick(p.fixtureId)}
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TeamLogo src={p.homeTeamLogo} name={p.homeTeam} size={32} />
            <span className="text-slate-600 text-xs font-bold">vs</span>
            <TeamLogo src={p.awayTeamLogo} name={p.awayTeam} size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{p.homeTeam} vs {p.awayTeam}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <CountryFlag src={p.countryFlag} name={p.leagueName} />
              <span className="truncate">{p.leagueName}</span>
              <span className="text-slate-600">·</span>
              <span>{p.matchTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${corClass} shadow-lg`}>{p.palpite}</div>
            <Badge
              variant="outline"
              className={`text-xs font-bold ${
                p.confianca === "Alta" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" :
                p.confianca === "Media" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" :
                "border-slate-500/50 bg-slate-500/10 text-slate-400"
              }`}
            >
              {p.confianca}
            </Badge>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Destaques() {
  const [, setLocation] = useLocation();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [tabTimes, setTabTimes] = useState<"escanteios" | "gols" | "chutes" | "cartoes">("gols");

  const { data, isLoading, refetch, isFetching } = trpc.destaques.hoje.useQuery(
    { date: selectedDate },
    { refetchInterval: 3 * 60 * 1000, staleTime: 2 * 60 * 1000 }
  ) as { data: DestaquesData | undefined; isLoading: boolean; refetch: () => void; isFetching: boolean };

  const handleJogoClick = (fixtureId: number) => {
    setLocation(`/ao-vivo?fixture=${fixtureId}`);
  };

  const timesAtivos = {
    escanteios: data?.timesEscanteios ?? [],
    gols: data?.timesGols ?? [],
    chutes: data?.timesChutes ?? [],
    cartoes: data?.timesCartoes ?? [],
  };

  const maxIndicadores = {
    escanteios: Math.max(...(data?.timesEscanteios?.map(t => t.indicador) ?? [1]), 1),
    gols: Math.max(...(data?.timesGols?.map(t => t.indicador) ?? [1]), 1),
    chutes: Math.max(...(data?.timesChutes?.map(t => t.indicador) ?? [1]), 1),
    cartoes: Math.max(...(data?.timesCartoes?.map(t => t.indicador) ?? [1]), 1),
  };

  const tabsConfig = {
    escanteios: { label: "Escanteios", emoji: "🚩", colorClass: "bg-blue-500", unidade: "esc", count: timesAtivos.escanteios.length },
    gols: { label: "Gols", emoji: "⚽", colorClass: "bg-emerald-500", unidade: "gols", count: timesAtivos.gols.length },
    chutes: { label: "Chutes", emoji: "🎯", colorClass: "bg-yellow-500", unidade: "chutes", count: timesAtivos.chutes.length },
    cartoes: { label: "Cartões", emoji: "🟨", colorClass: "bg-red-500", unidade: "cartões", count: timesAtivos.cartoes.length },
  };

  const totalPalpites = (data?.palpitesBTTS?.length ?? 0) + (data?.palpitesGols?.length ?? 0) + (data?.palpitesEscanteios?.length ?? 0);

  return (
    <RaphaLayout title="Destaques">
      {/* Header Premium com Seletor de data */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-950/95 to-slate-950/80 backdrop-blur-sm border-b border-slate-800/50 px-0 py-4 -mx-4 px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Destaques do Dia</h1>
              {data && (
                <p className="text-xs text-slate-400">{data.totalJogos} jogos · {data.totalLigas} ligas</p>
              )}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
      </div>

      <div className="space-y-8 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-700/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Palpites da IA Premium ────────────────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Palpites Automáticos da IA</h2>
                  {totalPalpites > 0 && (
                    <p className="text-xs text-slate-400">Análise em tempo real dos melhores mercados</p>
                  )}
                </div>
                {totalPalpites > 0 && (
                  <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                    {totalPalpites} palpites
                  </Badge>
                )}
              </div>
              <Tabs defaultValue="btts" className="w-full">
                <TabsList className="grid grid-cols-3 bg-slate-800/50 border border-slate-700/30 mb-4 h-9 rounded-lg p-1">
                  <TabsTrigger value="btts" className="text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md">
                    🎯 Ambas Marcam
                  </TabsTrigger>
                  <TabsTrigger value="gols" className="text-xs font-semibold data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md">
                    ⚽ Gols
                  </TabsTrigger>
                  <TabsTrigger value="escanteios" className="text-xs font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md">
                    🚩 Escanteios
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="btts">
                  <PalpitesLista partidas={data?.palpitesBTTS ?? []} corClass="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" onJogoClick={handleJogoClick} />
                </TabsContent>
                <TabsContent value="gols">
                  <PalpitesLista partidas={data?.palpitesGols ?? []} corClass="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" onJogoClick={handleJogoClick} />
                </TabsContent>
                <TabsContent value="escanteios">
                  <PalpitesLista partidas={data?.palpitesEscanteios ?? []} corClass="bg-blue-500/20 text-blue-400 border border-blue-500/30" onJogoClick={handleJogoClick} />
                </TabsContent>
              </Tabs>
            </section>

            {/* ── Rankings de Times Premium ──────────────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Rankings de Times — Jogos de Hoje</h2>
                  <p className="text-xs text-slate-400">Estatísticas da temporada em tempo real</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                {(Object.keys(tabsConfig) as Array<keyof typeof tabsConfig>).map(tab => {
                  const cfg = tabsConfig[tab];
                  const isActive = tabTimes === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setTabTimes(tab)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all border flex-shrink-0 ${
                        isActive
                          ? `${cfg.colorClass} text-white border-transparent shadow-lg`
                          : "bg-slate-800/40 text-slate-400 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{cfg.emoji}</span>
                      {cfg.label}
                      <Badge className={`text-xs font-bold ml-1 ${isActive ? "bg-white/20 text-white" : "bg-slate-700/50 text-slate-300"}`}>
                        {cfg.count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <RankingTimes
                times={timesAtivos[tabTimes]}
                colorClass={tabsConfig[tabTimes].colorClass}
                unidade={tabsConfig[tabTimes].unidade}
                maxVal={maxIndicadores[tabTimes]}
                onJogoClick={handleJogoClick}
              />
            </section>

            {/* ── Jogadores em Forma Premium ────────────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Jogadores em Destaque — Hoje</h2>
                  <p className="text-xs text-slate-400">Melhores performances da rodada</p>
                </div>
              </div>
              <Tabs defaultValue="artilheiros" className="w-full">
                <TabsList className="grid grid-cols-2 bg-slate-800/50 border border-slate-700/30 mb-4 h-9 rounded-lg p-1">
                  <TabsTrigger value="artilheiros" className="text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md">
                    ⚽ Artilheiros
                  </TabsTrigger>
                  <TabsTrigger value="indisciplinados" className="text-xs font-semibold data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md">
                    🟨 Indisciplinados
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="artilheiros">
                  <RankingJogadores jogadores={data?.jogadoresArtilheiros ?? []} tipo="artilheiro" onJogoClick={handleJogoClick} />
                </TabsContent>
                <TabsContent value="indisciplinados">
                  <RankingJogadores jogadores={data?.jogadoresIndisciplinados ?? []} tipo="indisciplinado" onJogoClick={handleJogoClick} />
                </TabsContent>
              </Tabs>
            </section>

            {/* ── Estado vazio ─────────────────────────────────────────────── */}
            {!data?.timesEscanteios?.length && !data?.timesGols?.length && !totalPalpites && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                  <Calendar className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Dados em processamento</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                  Os destaques são gerados a partir dos jogos do dia. Volte quando houver partidas em andamento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setLocation("/ao-vivo")}
                >
                  Ver Radar Esportivo
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </RaphaLayout>
  );
}
