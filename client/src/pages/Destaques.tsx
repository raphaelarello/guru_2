import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Trophy, Zap, Target, AlertTriangle, TrendingUp, Users, Star,
  ChevronRight, Flame, Calendar, RefreshCw, Shield
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
      className="rounded-full object-contain bg-slate-800 p-0.5 flex-shrink-0"
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
      className="rounded-full object-cover bg-slate-800 border-2 border-slate-700 flex-shrink-0"
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
      className="rounded-sm object-cover flex-shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg leading-none">🥇</span>;
  if (rank === 2) return <span className="text-lg leading-none">🥈</span>;
  if (rank === 3) return <span className="text-lg leading-none">🥉</span>;
  return <span className="text-sm font-bold text-slate-500 w-6 text-center">{rank}</span>;
}

function IndicadorBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white w-7 text-right">{value}</span>
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

// ─── Ranking de Times ─────────────────────────────────────────────────────────

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
    <div className="text-center py-8 text-slate-500 text-sm">Nenhum dado disponível</div>
  );

  return (
    <div className="space-y-2">
      {times.map((time, idx) => (
        <TooltipProvider key={`${time.teamId}-${idx}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all group"
                onClick={() => onJogoClick(time.fixtureId)}
              >
                <div className="w-7 flex justify-center flex-shrink-0">
                  <RankBadge rank={idx + 1} />
                </div>
                <TeamLogo src={time.teamLogo} name={time.teamName} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-semibold text-white truncate">{time.teamName}</span>
                    {time.status && (time.status.includes("Live") || time.status.includes("First") || time.status.includes("Second")) && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {time.minuto ? `${time.minuto}'` : "AO VIVO"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CountryFlag src={time.countryFlag} name={time.countryName} />
                    <span className="truncate">{time.leagueName}</span>
                    <span>·</span>
                    <span>vs {time.opponent}</span>
                    {time.placar && <><span>·</span><span className="font-bold text-white">{time.placar}</span></>}
                  </div>
                </div>
                <div className="w-28 flex-shrink-0">
                  <IndicadorBar value={time.indicador} max={maxVal} colorClass={colorClass} />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <TeamLogo src={time.opponentLogo} name={time.opponent} size={22} />
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
              <p className="font-bold">{time.teamName}</p>
              <p>Média: <span className="text-emerald-400 font-bold">{time.indicador} {unidade}</span></p>
              <p className="text-slate-400">Clique para ver ao vivo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// ─── Ranking de Jogadores ─────────────────────────────────────────────────────

function RankingJogadores({
  jogadores, tipo, onJogoClick
}: {
  jogadores: DestaquesJogador[];
  tipo: "artilheiro" | "indisciplinado";
  onJogoClick: (id: number) => void;
}) {
  if (!jogadores.length) return (
    <div className="text-center py-8 text-slate-500 text-sm">Nenhum dado disponível</div>
  );

  return (
    <div className="space-y-2">
      {jogadores.map((jogador, idx) => (
        <div
          key={`${jogador.playerId}-${idx}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all group"
          onClick={() => onJogoClick(jogador.fixtureId)}
        >
          <div className="w-7 flex justify-center flex-shrink-0">
            <RankBadge rank={idx + 1} />
          </div>
          <div className="relative flex-shrink-0">
            <PlayerPhoto src={jogador.playerPhoto} name={jogador.playerName} size={40} />
            <div className="absolute -bottom-1 -right-1">
              <TeamLogo src={jogador.teamLogo} name={jogador.teamName} size={16} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{jogador.playerName}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CountryFlag src={jogador.countryFlag} name={jogador.leagueName} />
              <span className="truncate">{jogador.teamName}</span>
              <span>·</span>
              <span>vs {jogador.opponent}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {tipo === "artilheiro" ? (
              <>
                {jogador.mediaGols > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-emerald-400 leading-none">{jogador.mediaGols}</span>
                    <span className="text-[10px] text-slate-500">gols</span>
                  </div>
                )}
                {jogador.mediaAssistencias > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-blue-400 leading-none">{jogador.mediaAssistencias}</span>
                    <span className="text-[10px] text-slate-500">assist</span>
                  </div>
                )}
                {jogador.mediaChutesGol > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-yellow-400 leading-none">{jogador.mediaChutesGol}</span>
                    <span className="text-[10px] text-slate-500">chutes</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(Math.round(jogador.mediaCartoes), 4) }).map((_, i) => (
                  <div key={i} className="w-3 h-4 bg-yellow-400 rounded-sm shadow-sm" />
                ))}
                <span className="text-sm font-bold text-yellow-400 ml-1">{jogador.mediaCartoes}</span>
              </div>
            )}
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Palpites ─────────────────────────────────────────────────────────────────

function PalpitesLista({ partidas, corClass, onJogoClick }: {
  partidas: DestaquesPartida[];
  corClass: string;
  onJogoClick: (id: number) => void;
}) {
  if (!partidas.length) return (
    <div className="text-center py-6 text-slate-500 text-sm">Nenhum palpite disponível</div>
  );
  return (
    <div className="space-y-2">
      {partidas.map((p, idx) => (
        <div
          key={`${p.fixtureId}-${idx}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all group"
          onClick={() => onJogoClick(p.fixtureId)}
        >
          <div className="flex items-center gap-1 flex-shrink-0">
            <TeamLogo src={p.homeTeamLogo} name={p.homeTeam} size={24} />
            <span className="text-slate-600 text-xs">vs</span>
            <TeamLogo src={p.awayTeamLogo} name={p.awayTeam} size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{p.homeTeam} vs {p.awayTeam}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <CountryFlag src={p.countryFlag} name={p.leagueName} />
              <span className="truncate">{p.leagueName}</span>
              <span>· {p.matchTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${corClass}`}>{p.palpite}</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                p.confianca === "Alta" ? "border-emerald-500 text-emerald-400" :
                p.confianca === "Media" ? "border-yellow-500 text-yellow-400" :
                "border-slate-500 text-slate-400"
              }`}
            >
              {p.confianca}
            </Badge>
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
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
  const [tabTimes, setTabTimes] = useState<"escanteios" | "gols" | "chutes" | "cartoes">("escanteios");

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
      {/* Seletor de data */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-0 py-3 -mx-4 px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Destaques do Dia</h1>
              {data && (
                <p className="text-xs text-slate-400">{data.totalJogos} jogos · {data.totalLigas} ligas</p>
              )}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
      </div>

      <div className="space-y-6 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Palpites da IA ─────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-white">Palpites Automáticos da IA</h2>
                {totalPalpites > 0 && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    {totalPalpites} palpites
                  </Badge>
                )}
              </div>
              <Tabs defaultValue="btts" className="w-full">
                <TabsList className="grid grid-cols-3 bg-slate-800/80 mb-3 h-8">
                  <TabsTrigger value="btts" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    🎯 Ambas Marcam
                  </TabsTrigger>
                  <TabsTrigger value="gols" className="text-xs data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                    ⚽ Gols
                  </TabsTrigger>
                  <TabsTrigger value="escanteios" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    🚩 Escanteios
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="btts">
                  <PalpitesLista partidas={data?.palpitesBTTS ?? []} corClass="bg-emerald-500/20 text-emerald-400" onJogoClick={handleJogoClick} />
                </TabsContent>
                <TabsContent value="gols">
                  <PalpitesLista partidas={data?.palpitesGols ?? []} corClass="bg-yellow-500/20 text-yellow-400" onJogoClick={handleJogoClick} />
                </TabsContent>
                <TabsContent value="escanteios">
                  <PalpitesLista partidas={data?.palpitesEscanteios ?? []} corClass="bg-blue-500/20 text-blue-400" onJogoClick={handleJogoClick} />
                </TabsContent>
              </Tabs>
            </section>

            {/* ── Rankings de Times ────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-white">Rankings de Times — Jogos de Hoje</h2>
              </div>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {(Object.keys(tabsConfig) as Array<keyof typeof tabsConfig>).map(tab => {
                  const cfg = tabsConfig[tab];
                  const isActive = tabTimes === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setTabTimes(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex-shrink-0 ${
                        isActive
                          ? `${cfg.colorClass} text-white border-transparent`
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      <span>{cfg.emoji}</span>
                      {cfg.label}
                      <span className={`text-xs font-bold ${isActive ? "text-white/70" : "text-slate-500"}`}>
                        ({cfg.count})
                      </span>
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

            {/* ── Jogadores em Forma ───────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-white">Jogadores em Forma — Hoje</h2>
              </div>
              <Tabs defaultValue="artilheiros" className="w-full">
                <TabsList className="grid grid-cols-2 bg-slate-800/80 mb-3 h-8">
                  <TabsTrigger value="artilheiros" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    ⚽ Artilheiros / Assist.
                  </TabsTrigger>
                  <TabsTrigger value="indisciplinados" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    🟨 Mais Indisciplinados
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
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-300 mb-2">Dados em processamento</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Os destaques são gerados a partir dos jogos do dia. Volte quando houver partidas em andamento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-slate-700 text-slate-400 hover:text-white"
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
