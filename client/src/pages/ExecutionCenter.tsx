import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import PlatformHeader, { type PlatformNavAction } from '@/components/navigation/PlatformHeader';
import BottomModeDock, { type DockMode } from '@/components/navigation/BottomModeDock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDecimal, formatPercent, traduzirTextoMercado } from '@/lib/utils';
import { useBetslip } from '@/contexts/BetslipContext';
import { useMatches } from '@/hooks/useMatches';
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis';
import { useLiveMatch } from '@/hooks/useLiveMatch';
import { useMatchPlayers } from '@/hooks/useMatchPlayers';
import { useLeaguePlayerRankings } from '@/hooks/useLeaguePlayerRankings';
import { useRoundScanner } from '@/hooks/useRoundScanner';
import { OddsComparisonPanel } from '@/components/OddsComparisonPanel';
import { PressureFlowChart } from '@/components/PressureFlowChart';
import { getToday } from '@/lib/footballApi';
import {
  buildMomentumSummary,
  buildTopOpportunityBoard,
  buildTrendBoards,
  edgeFromMarket,
  getTopPropsPlayers,
  type OpportunityFilter,
  type TeamTrendItem,
  type TopOpportunity,
} from '@/lib/intel';
import { useOddsHistory } from '@/hooks/useOddsHistory';
import type { Match, MatchAnalysis, Tip } from '@/lib/types';
import type { LiveEvent } from '@/hooks/useLiveMatch';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  BrainCircuit,
  Clock3,
  Copy,
  ExternalLink,
  Flame,
  Landmark,
  LineChart,
  Lock,
  Radar,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Users,
  Flag,
  CreditCard,
  TrendingUp,
  Siren,
  Zap,
  Target,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const BOOKMAKERS = [
  { id: 'seubet', name: 'SeuBet', url: 'https://www.seu.bet.br/', accent: 'from-emerald-500/20 to-emerald-700/10', border: 'border-emerald-500/30', text: 'text-emerald-300', note: 'Fluxo manual recomendado: copie o cupom e finalize no site oficial.' },
  { id: 'bet365', name: 'bet365', url: 'https://www.bet365.bet.br/', accent: 'from-yellow-500/20 to-green-700/10', border: 'border-yellow-500/30', text: 'text-yellow-200', note: 'Use o sistema para decidir e a casa oficial para autenticação e confirmação final.' },
] as const;

type ToolTab = 'tops' | 'odds' | 'timeline' | 'props' | 'manual';

function Surface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-3xl border border-slate-700/50 bg-slate-900/35 p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.9)]', className)}>
      {children}
    </div>
  );
}

function StatPill({ label, value, tone = 'text-white' }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={cn('mt-1 text-sm font-black', tone)}>{value}</div>
    </div>
  );
}

function MatchPickerCard({ match, selected, onSelect }: { match: Match; selected: boolean; onSelect: () => void }) {
  const isLive = match.strStatus === 'In Progress';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border px-4 py-3 text-left transition-all',
        selected
          ? 'border-cyan-400/35 bg-cyan-500/12 shadow-[0_18px_40px_-32px_rgba(34,211,238,0.65)]'
          : 'border-slate-700/50 bg-slate-950/35 hover:border-slate-600/60 hover:bg-slate-900/70'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{match.strHomeTeam} x {match.strAwayTeam}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{match.strLeague}</div>
        </div>
        <div className="text-right">
          <div className={cn('text-[11px] font-black uppercase tracking-[0.16em]', isLive ? 'text-red-300' : 'text-slate-500')}>
            {isLive ? 'Ao vivo' : match.strTime?.slice(0, 5) || 'Pré-jogo'}
          </div>
          <div className="mt-1 text-xs text-slate-400">{match.dateEvent}</div>
        </div>
      </div>
    </button>
  );
}

function EdgeCard({ title, modelProbability, marketOdd, description }: { title: string; modelProbability: number | null; marketOdd: number | null; description: string }) {
  const edge = edgeFromMarket(modelProbability, marketOdd);
  if (!edge) {
    return (
      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="mt-2 text-sm text-slate-500">Mercado ainda sem linha comparável para esse ângulo.</div>
      </div>
    );
  }
  const tone = edge.band === 'elite' ? 'text-emerald-300' : edge.band === 'forte' ? 'text-cyan-300' : edge.band === 'leve' ? 'text-amber-300' : edge.band === 'ruim' ? 'text-red-300' : 'text-slate-300';
  const badge = edge.band === 'elite' ? 'Elite value' : edge.band === 'forte' ? 'Valor forte' : edge.band === 'leve' ? 'Valor leve' : edge.band === 'ruim' ? 'Mercado caro' : 'Preço justo';
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{description}</div>
        </div>
        <div className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', edge.band === 'elite' ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200' : edge.band === 'forte' ? 'border-cyan-500/30 bg-cyan-500/12 text-cyan-200' : edge.band === 'leve' ? 'border-amber-500/30 bg-amber-500/12 text-amber-200' : edge.band === 'ruim' ? 'border-red-500/30 bg-red-500/12 text-red-200' : 'border-slate-700/50 bg-slate-900/60 text-slate-300')}>
          {badge}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Modelo" value={`${modelProbability?.toFixed(1) ?? '--'}%`} tone={tone} />
        <StatPill label="Implícita" value={`${edge.implied.toFixed(1)}%`} />
        <StatPill label="Odd justa" value={edge.fair ? edge.fair.toFixed(2) : '--'} />
        <StatPill label="Edge" value={`${edge.edgePct > 0 ? '+' : ''}${edge.edgePct.toFixed(1)}%`} tone={tone} />
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Linha atual em <span className="font-semibold text-slate-300">{marketOdd?.toFixed(2) ?? '--'}</span>
        {edge.marketGap != null ? <> · gap de preço <span className={tone}>{edge.marketGap > 0 ? '+' : ''}{edge.marketGap}%</span> versus odd justa</> : null}
      </div>
    </div>
  );
}

function PlayersTable({
  title,
  subtitle,
  players,
  metricLabel,
  metricValue,
}: {
  title: string;
  subtitle: string;
  players: Array<Record<string, unknown>>;
  metricLabel: string;
  metricValue: (player: Record<string, unknown>) => React.ReactNode;
}) {
  return (
    <Surface>
      <div>
        <div className="text-lg font-black text-white">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      </div>
      <div className="mt-4 space-y-2">
        {players.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Sem dados suficientes para montar este ranking agora.</div>
        ) : players.map((player, index) => (
          <div key={String(player.id ?? `${title}-${index}`)} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-950/30 px-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 text-xs font-black text-slate-300">{index + 1}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{String(player.name ?? player.shortName ?? '--')}</div>
              <div className="truncate text-xs text-slate-500">{String(player.teamName ?? player.position ?? '')}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{metricLabel}</div>
              <div className="mt-1 text-sm font-black text-cyan-300">{metricValue(player)}</div>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function LiveTimeline({ events }: { events: LiveEvent[] }) {
  const safeEvents = Array.isArray(events) ? [...events].slice(0, 12) : [];
  return (
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black text-white">Timeline do jogo</div>
          <div className="mt-1 text-sm text-slate-500">Eventos relevantes para leitura ao vivo, pressão e gatilhos de entrada.</div>
        </div>
        <Clock3 className="h-5 w-5 text-slate-500" />
      </div>
      <div className="mt-4 space-y-3">
        {safeEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Sem eventos ricos no momento. Quando a fonte enviar gols, cartões, VAR e substituições, eles aparecem aqui.</div>
        ) : safeEvents.map((event, index) => (
          <div key={`${event.id}-${index}`} className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-slate-700/40 bg-slate-950/30 px-3 py-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl border text-xs font-black', event.type === 'goal' || event.type === 'penalty' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : event.type === 'yellow_card' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : event.type === 'red_card' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-slate-700/50 bg-slate-900/70 text-slate-300')}>
              {event.minute}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{event.description}</div>
              <div className="mt-1 text-xs text-slate-500">{event.playerName}{event.playerName2 ? ` → ${event.playerName2}` : ''} · {event.teamSide === 'home' ? 'Mandante' : 'Visitante'}</div>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function MarketCards({ analysis }: { analysis: MatchAnalysis | null }) {
  if (!analysis) {
    return <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Selecione uma partida para abrir os ângulos de odds.</div>;
  }
  const predictions = analysis.predictions;
  const totalLine = analysis.marketOdds?.totalLine ?? 2.5;
  const overProb = totalLine <= 0.5 ? predictions.over05Prob : totalLine <= 1.5 ? predictions.over15Prob : totalLine <= 2.5 ? predictions.over25Prob : totalLine <= 3.5 ? predictions.over35Prob : predictions.over45Prob;
  const underProb = totalLine <= 1.5 ? predictions.under15Prob : totalLine <= 2.5 ? predictions.under25Prob : predictions.under35Prob;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <EdgeCard title={`${analysis.match.strHomeTeam} vence`} modelProbability={predictions.homeWinProb} marketOdd={analysis.marketOdds?.homeWinOdds ?? null} description="Leitura do modelo contra a linha 1X2 para o mandante." />
      <EdgeCard title={`${analysis.match.strAwayTeam} vence`} modelProbability={predictions.awayWinProb} marketOdd={analysis.marketOdds?.awayWinOdds ?? null} description="Leitura do modelo contra a linha 1X2 para o visitante." />
      <EdgeCard title={`Mais de ${totalLine.toFixed(1)} gols`} modelProbability={overProb} marketOdd={analysis.marketOdds?.overOdds ?? null} description="Comparação entre total esperado e preço monitorado no mercado." />
      <EdgeCard title={`Menos de ${totalLine.toFixed(1)} gols`} modelProbability={underProb} marketOdd={analysis.marketOdds?.underOdds ?? null} description="Ângulo defensivo / under com odd atual versus preço justo do modelo." />
      <EdgeCard title="Ambas marcam — Sim" modelProbability={predictions.bttsYesProb} marketOdd={null} description="Sem linha oficial nesta tela, mas a odd justa já sai do modelo para priorização." />
      <EdgeCard title="Gol no 1º tempo" modelProbability={predictions.firstHalfOver05Prob} marketOdd={null} description="Muito útil para montar top palpites HT e leitura de agressividade inicial." />
    </div>
  );
}

function TopOpportunityCard({
  item,
  onOpen,
  onToggleBet,
  inSlip,
}: {
  item: TopOpportunity;
  onOpen: (item: TopOpportunity) => void;
  onToggleBet: (item: TopOpportunity) => void;
  inSlip: boolean;
}) {
  const edgeTone = item.edge != null ? (item.edge >= 8 ? 'text-emerald-300' : item.edge >= 4 ? 'text-cyan-300' : item.edge >= 1.5 ? 'text-amber-300' : item.edge <= -4 ? 'text-red-300' : 'text-slate-300') : 'text-slate-300';
  return (
    <div className="rounded-3xl border border-slate-700/40 bg-slate-950/35 p-4 shadow-[0_18px_50px_-36px_rgba(0,0,0,0.9)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            {item.title}
          </div>
          <div className="mt-2 text-base font-black text-white">{item.matchLabel}</div>
          <div className="mt-1 text-xs text-slate-500">{item.league}</div>
        </div>
        <div className="rounded-full border border-slate-700/50 bg-slate-900/70 px-2.5 py-1 text-[11px] font-bold text-slate-300">
          {item.confidence === 'high' ? 'Alta' : item.confidence === 'medium' ? 'Média' : 'Baixa'}
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-700/40 bg-slate-900/45 p-3">
        <div className="text-sm font-bold text-slate-100">{traduzirTextoMercado(item.marketLabel)}</div>
        <div className="mt-1 text-xs text-slate-500">Sinal priorizado pela central de oportunidades.</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatPill label="Prob." value={formatPercent(item.probability, { digits: 0 })} tone="text-emerald-300" />
        <StatPill label="Odd atual" value={item.marketOdd ? formatDecimal(item.marketOdd, 2) : '—'} />
        <StatPill label="Odd justa" value={item.fairOdd ? formatDecimal(item.fairOdd, 2) : '—'} />
        <StatPill label="Edge" value={item.edge != null ? formatPercent(item.edge, { digits: 1, signed: true }) : '—'} tone={edgeTone} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.reasonTags.map((reason) => (
          <span key={reason} className="rounded-full border border-slate-700/50 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">{reason}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => onOpen(item)}>
          <Target className="mr-2 h-4 w-4" />Abrir confronto
        </Button>
        <Button variant="outline" className={cn('border-slate-600/60 bg-slate-950/20 text-slate-200 hover:bg-slate-800/60', inSlip && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200')} onClick={() => onToggleBet(item)}>
          <Star className="mr-2 h-4 w-4" />{inSlip ? 'No bilhete' : 'Adicionar ao bilhete'}
        </Button>
      </div>
    </div>
  );
}

function TrendTable({
  title,
  subtitle,
  icon: Icon,
  rows,
  metricFormatter,
  onOpen,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  rows: TeamTrendItem[];
  metricFormatter: (value: number) => string;
  onOpen: (row: TeamTrendItem) => void;
}) {
  return (
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black text-white">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        </div>
        <Icon className="h-5 w-5 text-emerald-300" />
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((row, index) => (
          <button key={row.id} type="button" onClick={() => onOpen(row)} className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-950/30 px-3 py-3 text-left transition-all hover:border-slate-600/60 hover:bg-slate-900/70">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 text-xs font-black text-slate-300">{index + 1}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{row.teamName}</div>
              <div className="truncate text-xs text-slate-500">{row.league}</div>
              <div className="mt-1 truncate text-xs text-slate-400">{row.secondary}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{row.tag}</div>
              <div className="mt-1 text-sm font-black text-cyan-300">{metricFormatter(row.metric)}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        ))}
      </div>
    </Surface>
  );
}

function filterLabel(filter: OpportunityFilter) {
  switch (filter) {
    case 'all': return 'Tudo';
    case 'ht': return '1º tempo';
    case 'goals': return 'Gols';
    case 'corners': return 'Escanteios';
    case 'cards': return 'Cartões';
    case 'btts': return 'BTTS';
    case 'value': return 'Value';
    case 'live': return 'Ao vivo';
  }
}

export default function ExecutionCenter() {
  const today = getToday();
  const [, setLocation] = useLocation();
  const { matches, loading: matchesLoading, refetch } = useMatches(today);
  const { entries: roundEntries, loading: roundLoading, completed: roundCompleted, total: roundTotal } = useRoundScanner(matches);
  const { analysis, loading: analysisLoading, analyzeMatch, clearAnalysis } = useMatchAnalysis();
  const [search, setSearch] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [topFilter, setTopFilter] = useState<OpportunityFilter>('all');
  const { items, stake, setStake, addBet, removeBet, hasBet, totalOdds, potentialReturn } = useBetslip();

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((match) =>
      `${match.strHomeTeam} ${match.strAwayTeam} ${match.strLeague}`.toLowerCase().includes(q)
    );
  }, [matches, search]);

  useEffect(() => {
    if (!selectedMatchId && filteredMatches[0]) {
      setSelectedMatchId(filteredMatches[0].idEvent);
      return;
    }
    if (selectedMatchId && filteredMatches.length > 0 && !filteredMatches.some((match) => match.idEvent === selectedMatchId)) {
      setSelectedMatchId(filteredMatches[0].idEvent);
    }
  }, [filteredMatches, selectedMatchId]);

  const selectedMatch = useMemo(
    () => filteredMatches.find((match) => match.idEvent === selectedMatchId) ?? matches.find((match) => match.idEvent === selectedMatchId) ?? null,
    [filteredMatches, matches, selectedMatchId]
  );

  useEffect(() => {
    if (!selectedMatch) {
      clearAnalysis();
      return;
    }
    void analyzeMatch(selectedMatch);
  }, [selectedMatch, analyzeMatch, clearAnalysis]);

  const { liveData, loading: liveLoading } = useLiveMatch(selectedMatch?.idEvent ?? null, selectedMatch?.strStatus === 'In Progress');
  const { playersData, loading: playersLoading } = useMatchPlayers(selectedMatch?.idEvent ?? null, Boolean(selectedMatch));
  const { rankings: leagueRankings, loading: rankingsLoading } = useLeaguePlayerRankings(selectedMatch?.idLeague ?? null);
  const { currentEntry: oddsHistoryEntry, snapshotCount } = useOddsHistory(selectedMatch?.idEvent ?? null, playersData?.odds ?? null);

  const allPlayers = useMemo(() => playersData ? [...playersData.homePlayers, ...playersData.awayPlayers] : [], [playersData]);
  const topProps = useMemo(() => getTopPropsPlayers(allPlayers), [allPlayers]);
  const topBoard = useMemo(() => buildTopOpportunityBoard(roundEntries, topFilter, 8), [roundEntries, topFilter]);
  const trendBoards = useMemo(() => buildTrendBoards(roundEntries), [roundEntries]);

  const currentRoundEntry = useMemo(() => roundEntries.find((entry) => entry.match.idEvent === selectedMatch?.idEvent) ?? null, [roundEntries, selectedMatch]);
  const momentum = useMemo(() => buildMomentumSummary(liveData, selectedMatch?.strHomeTeam ?? 'Mandante', selectedMatch?.strAwayTeam ?? 'Visitante'), [liveData, selectedMatch]);

  const handleTopNavAction = useCallback((action: PlatformNavAction) => {
    if (action === 'ferramentas') { setLocation('/executor'); return; }
    if (action === 'bots') { setLocation('/automacao'); return; }
    setLocation('/');
  }, [setLocation]);

  const handleDock = useCallback((mode: DockMode) => {
    if (mode === 'bots') { setLocation('/automacao'); return; }
    if (mode === 'conta') { setLocation('/executor'); return; }
    setLocation('/');
  }, [setLocation]);

  const openOpportunity = useCallback((item: TopOpportunity) => {
    setSelectedMatchId(item.matchId);
  }, []);

  const openTrend = useCallback((row: TeamTrendItem) => {
    setSelectedMatchId(row.matchId);
  }, []);

  const toggleOpportunityBet = useCallback((item: TopOpportunity) => {
    const betId = `${item.id}-bet`;
    if (hasBet(betId)) {
      removeBet(betId);
      toast.success('Seleção removida do bilhete.');
      return;
    }
    addBet({
      id: betId,
      matchId: item.matchId,
      matchLabel: item.matchLabel,
      tipLabel: traduzirTextoMercado(item.marketLabel),
      probability: Math.round(item.probability),
      odds: Math.max(1.1, item.marketOdd ?? item.fairOdd ?? 1.5),
      category: item.category,
      confidence: item.confidence,
      addedAt: Date.now(),
    });
    toast.success('Top palpite adicionado ao bilhete.');
  }, [addBet, hasBet, removeBet]);

  const copySlip = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos uma seleção ao bilhete.');
      return;
    }
    const text = items.map((item, index) => `${index + 1}. ${item.matchLabel} — ${traduzirTextoMercado(item.tipLabel)} @ ${item.odds.toFixed(2)} (${item.probability}%)`).join('\n');
    try {
      await navigator.clipboard.writeText(`${text}\n\nStake: R$ ${stake.toFixed(2)}\nOdd total: ${totalOdds.toFixed(2)}x\nRetorno potencial: R$ ${potentialReturn.toFixed(2)}`);
      toast.success('Cupom completo copiado!');
    } catch {
      toast.error('Não foi possível copiar o cupom.');
    }
  }, [items, potentialReturn, stake, totalOdds]);

  const copyTopSelection = useCallback(async () => {
    const first = topBoard[0];
    if (!first) {
      toast.error('Sem top palpite pronto agora.');
      return;
    }
    const text = `${first.matchLabel} — ${traduzirTextoMercado(first.marketLabel)} | Prob. ${Math.round(first.probability)}% | Odd ${first.marketOdd?.toFixed(2) ?? first.fairOdd?.toFixed(2) ?? '--'}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Top seleção copiada!');
    } catch {
      toast.error('Não foi possível copiar a seleção principal.');
    }
  }, [topBoard]);

  const liveCount = useMemo(() => matches.filter((match) => match.strStatus === 'In Progress').length, [matches]);

  const deepDiveCards = useMemo(() => {
    if (!analysis) return [];
    return [
      { label: 'Forma ofensiva', home: `${analysis.homeTeamStats.avgGoalsScored.toFixed(2)} gols pró · ataque ${(analysis.homeTeamStats.attackStrength * 100).toFixed(0)}%`, away: `${analysis.awayTeamStats.avgGoalsScored.toFixed(2)} gols pró · ataque ${(analysis.awayTeamStats.attackStrength * 100).toFixed(0)}%`, homeTone: 'text-emerald-300', awayTone: 'text-emerald-300' },
      { label: 'Pressão de corners', home: `${analysis.homeTeamStats.avgCornersFor.toFixed(1)} pró · ${analysis.homeTeamStats.avgCornersAgainst.toFixed(1)} contra`, away: `${analysis.awayTeamStats.avgCornersFor.toFixed(1)} pró · ${analysis.awayTeamStats.avgCornersAgainst.toFixed(1)} contra`, homeTone: 'text-cyan-300', awayTone: 'text-cyan-300' },
      { label: 'Cartões / agressividade', home: `${analysis.homeTeamStats.avgTotalCardsPerGame.toFixed(2)} média · índice ${(analysis.homeTeamStats.aggressionIndex * 100).toFixed(0)}%`, away: `${analysis.awayTeamStats.avgTotalCardsPerGame.toFixed(2)} média · índice ${(analysis.awayTeamStats.aggressionIndex * 100).toFixed(0)}%`, homeTone: 'text-amber-300', awayTone: 'text-amber-300' },
      { label: 'Gatilho 1º tempo', home: `${Math.round(analysis.homeTeamStats.goalsFirstHalfRate * 100)}% dos jogos com gol HT`, away: `${Math.round(analysis.awayTeamStats.goalsFirstHalfRate * 100)}% dos jogos com gol HT`, homeTone: 'text-violet-300', awayTone: 'text-violet-300' },
    ];
  }, [analysis]);

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200">
      <PlatformHeader active="ferramentas" liveCount={liveCount} subtitle="Futebol / Ferramentas / Top Palpites + Odds Intelligence + Props Lab + Timeline" onAction={handleTopNavAction} onOpenSearch={() => setLocation('/')} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-slate-700/50 bg-slate-900/40 text-slate-300 hover:bg-slate-800/70" onClick={() => setLocation('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Voltar ao sistema
            </Button>
            <div>
              <h1 className="text-2xl font-black text-white">Centro competitivo</h1>
              <p className="text-sm text-slate-500">Top palpites, inteligência de odds, timeline, momentum, props e leitura profunda por time e jogador no mesmo workspace.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />Atualizar jogos
            </Button>
            <Button variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" onClick={() => setLocation('/automacao')}>
              <Bot className="mr-2 h-4 w-4" />Ir para bots
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Surface className="sticky top-[110px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-white">Radar de partidas</div>
                  <div className="mt-1 text-sm text-slate-500">Escolha um jogo para abrir as ferramentas premium abaixo.</div>
                </div>
                <Radar className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-950/35 px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar time, liga ou duelo" className="border-0 bg-transparent px-0 text-slate-100 shadow-none focus-visible:ring-0" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatPill label="Escaneados" value={`${roundCompleted}/${roundTotal || 0}`} tone="text-cyan-300" />
                <StatPill label="Ao vivo" value={liveCount} tone={liveCount > 0 ? 'text-red-300' : 'text-slate-300'} />
              </div>
              <div className="mt-4 max-h-[62vh] space-y-2 overflow-auto pr-1">
                {matchesLoading ? (
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Carregando partidas do dia...</div>
                ) : filteredMatches.length === 0 ? (
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Nenhuma partida encontrada com esse filtro.</div>
                ) : filteredMatches.map((match) => (
                  <MatchPickerCard key={match.idEvent} match={match} selected={selectedMatch?.idEvent === match.idEvent} onSelect={() => setSelectedMatchId(match.idEvent)} />
                ))}
              </div>
            </Surface>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Surface className="bg-[linear-gradient(145deg,rgba(8,47,73,0.38),rgba(15,23,42,0.94))]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Workspace premium</div>
                    <h2 className="mt-2 text-2xl font-black text-white">{selectedMatch ? `${selectedMatch.strHomeTeam} x ${selectedMatch.strAwayTeam}` : 'Selecione uma partida'}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-400">Top palpites do dia, leitura de mercado, movimentação de linha, pressão ao vivo, props e dados profundos de time e jogador em um só lugar.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <StatPill label="Liga" value={selectedMatch?.strLeague ?? '--'} />
                    <StatPill label="Status" value={selectedMatch?.strStatus === 'In Progress' ? 'Ao vivo' : selectedMatch?.strTime?.slice(0, 5) || '--'} tone={selectedMatch?.strStatus === 'In Progress' ? 'text-red-300' : 'text-white'} />
                    <StatPill label="Análise" value={analysisLoading ? 'Processando...' : analysis?.confidence === 'high' ? 'Alta' : analysis?.confidence === 'medium' ? 'Média' : analysis ? 'Baixa' : '--'} tone={analysis?.confidence === 'high' ? 'text-emerald-300' : analysis?.confidence === 'medium' ? 'text-amber-300' : 'text-slate-300'} />
                    <StatPill label="Snapshots" value={snapshotCount || '--'} tone={snapshotCount >= 3 ? 'text-cyan-300' : 'text-slate-300'} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4"><div className="flex items-center gap-2 text-emerald-300"><Sparkles className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Top Palpites</span></div><div className="mt-2 text-sm text-slate-400">Central de oportunidades com gols, HT, escanteios, cartões e value.</div></div>
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4"><div className="flex items-center gap-2 text-cyan-300"><LineChart className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Odds Intelligence</span></div><div className="mt-2 text-sm text-slate-400">Preço justo, edge, gap de linha e leitura de valor.</div></div>
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4"><div className="flex items-center gap-2 text-orange-300"><Activity className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Timeline & Momentum</span></div><div className="mt-2 text-sm text-slate-400">Timeline ao vivo com pressão, posse, chutes e corners.</div></div>
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4"><div className="flex items-center gap-2 text-violet-300"><BrainCircuit className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Props Lab</span></div><div className="mt-2 text-sm text-slate-400">Artilheiros, risco de cartão, impacto live e ranking da liga.</div></div>
                </div>
              </Surface>

              <Surface>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                    <Siren className="h-5 w-5 text-red-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-black text-white">Radar da rodada</div>
                    <div className="mt-1 text-sm text-slate-500">Escaneia automaticamente jogos fortes para gols, HT, corners, cartões, value e pressão live.</div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <StatPill label="Processo" value={roundLoading ? 'Escaneando...' : 'Pronto'} tone={roundLoading ? 'text-amber-300' : 'text-emerald-300'} />
                      <StatPill label="Top do dia" value={topBoard[0] ? formatPercent(topBoard[0].probability) : '--'} tone="text-cyan-300" />
                      <StatPill label="Mercado" value={currentRoundEntry?.oddsMovement?.strongestLabel ?? 'Estável'} tone={currentRoundEntry?.oddsMovement?.strength === 'strong' ? 'text-red-300' : 'text-slate-300'} />
                      <StatPill label="Pressão" value={currentRoundEntry?.livePressureScore ?? '--'} tone={(currentRoundEntry?.livePressureScore ?? 0) >= 65 ? 'text-red-300' : 'text-slate-300'} />
                    </div>
                  </div>
                </div>
              </Surface>
            </div>

            <Tabs defaultValue="tops" className="space-y-5">
              <TabsList className="grid w-full grid-cols-5 rounded-2xl border border-slate-700/50 bg-slate-950/40 p-1">
                <TabsTrigger value="tops" className="rounded-xl data-[state=active]:bg-emerald-500/12 data-[state=active]:text-white"><Sparkles className="mr-2 h-4 w-4" />Top palpites</TabsTrigger>
                <TabsTrigger value="odds" className="rounded-xl data-[state=active]:bg-cyan-500/12 data-[state=active]:text-white"><LineChart className="mr-2 h-4 w-4" />Odds</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-xl data-[state=active]:bg-orange-500/12 data-[state=active]:text-white"><Activity className="mr-2 h-4 w-4" />Timeline</TabsTrigger>
                <TabsTrigger value="props" className="rounded-xl data-[state=active]:bg-violet-500/12 data-[state=active]:text-white"><BrainCircuit className="mr-2 h-4 w-4" />Props Lab</TabsTrigger>
                <TabsTrigger value="manual" className="rounded-xl data-[state=active]:bg-amber-500/12 data-[state=active]:text-white"><Landmark className="mr-2 h-4 w-4" />Execução</TabsTrigger>
              </TabsList>

              <TabsContent value="tops" className="space-y-5">
                <Surface>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">Central de oportunidades</div>
                      <div className="mt-1 text-sm text-slate-500">Destaques prontos por mercado, com foco em gol HT, gols, escanteios, cartões, BTTS e valor.</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'ht', 'goals', 'corners', 'cards', 'btts', 'value', 'live'] as OpportunityFilter[]).map((filter) => (
                        <button key={filter} type="button" onClick={() => setTopFilter(filter)} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all', topFilter === filter ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200' : 'border-slate-700/50 bg-slate-950/35 text-slate-400 hover:border-slate-600/60 hover:text-slate-200')}>
                          {filterLabel(filter)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <StatPill label="Jogos fortes" value={topBoard.length} tone="text-emerald-300" />
                    <StatPill label="Ao vivo fortes" value={roundEntries.filter((entry) => entry.liveState === 'live' && entry.livePressureScore >= 65).length} tone="text-red-300" />
                    <StatPill label="Alta confiança" value={roundEntries.filter((entry) => entry.confidence === 'high').length} tone="text-cyan-300" />
                    <StatPill label="Bilhete" value={items.length} tone={items.length > 0 ? 'text-amber-300' : 'text-slate-300'} />
                  </div>
                </Surface>

                <div className="grid gap-4 xl:grid-cols-2">
                  {topBoard.map((item) => (
                    <TopOpportunityCard key={item.id} item={item} onOpen={openOpportunity} onToggleBet={toggleOpportunityBet} inSlip={hasBet(`${item.id}-bet`)} />
                  ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <TrendTable title="Top equipes que mais marcam no 1º tempo" subtitle="Ranking entre os jogos escaneados na rodada." icon={Timer} rows={trendBoards.firstHalfScorers} metricFormatter={(value) => formatPercent(value, { digits: 0 })} onOpen={openTrend} />
                  <TrendTable title="Top equipes com mais gols no geral" subtitle="Ataque, BTTS e perfil agressivo." icon={Flame} rows={trendBoards.goalsOverall} metricFormatter={(value) => formatDecimal(value / 28, 2)} onOpen={openTrend} />
                  <TrendTable title="Top equipes com mais escanteios" subtitle="Times que mais produzem pressão ofensiva e corners." icon={Flag} rows={trendBoards.cornersFor} metricFormatter={(value) => formatDecimal(value, 1)} onOpen={openTrend} />
                  <TrendTable title="Top equipes que mais cedem escanteios" subtitle="Ótimo para linhas de corners por equipe e total." icon={TrendingUp} rows={trendBoards.cornersAgainst} metricFormatter={(value) => formatDecimal(value, 1)} onOpen={openTrend} />
                  <TrendTable title="Top equipes com mais cartões" subtitle="Agressividade, disciplina e jogos físicos." icon={CreditCard} rows={trendBoards.cardsTeams} metricFormatter={(value) => formatDecimal(value, 2)} onOpen={openTrend} />
                  <TrendTable title="Top equipes para BTTS" subtitle="Perfil de times que marcam e concedem com frequência." icon={Users} rows={trendBoards.bttsTeams} metricFormatter={(value) => formatPercent(value, { digits: 0 })} onOpen={openTrend} />
                </div>
              </TabsContent>

              <TabsContent value="odds" className="space-y-5">
                {analysis && playersData?.odds ? (
                  <OddsComparisonPanel odds={playersData.odds} analysis={analysis} isLive={selectedMatch?.strStatus === 'In Progress'} />
                ) : null}
                <MarketCards analysis={analysis} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Surface>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">CLV / movimento da linha</div>
                        <div className="mt-1 text-sm text-slate-500">Snapshots de odds e movimento detectado ao longo do dia.</div>
                      </div>
                      <BarChart3 className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <StatPill label="Snapshots" value={snapshotCount} tone="text-cyan-300" />
                      <StatPill label="Home" value={oddsHistoryEntry?.movements.home.changePct ? formatPercent(oddsHistoryEntry.movements.home.changePct, { digits: 1, signed: true }) : '—'} tone={oddsHistoryEntry?.movements.home.isSignificant ? 'text-red-300' : 'text-slate-300'} />
                      <StatPill label="Over" value={oddsHistoryEntry?.movements.over.changePct ? formatPercent(oddsHistoryEntry.movements.over.changePct, { digits: 1, signed: true }) : '—'} tone={oddsHistoryEntry?.movements.over.isSignificant ? 'text-amber-300' : 'text-slate-300'} />
                      <StatPill label="Leitura" value={currentRoundEntry?.oddsMovement?.strongestLabel ?? 'Estável'} tone={currentRoundEntry?.oddsMovement?.strength === 'strong' ? 'text-red-300' : 'text-slate-300'} />
                    </div>
                  </Surface>
                  <Surface>
                    <div className="text-lg font-black text-white">Resumo do mercado</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-400">
                      <p>• Quando a odd de mercado fica acima da odd justa do modelo, a central sobe o sinal na área de Top Palpites.</p>
                      <p>• Value forte prioriza edge, confiança e score de decisão.</p>
                      <p>• Em jogos ao vivo, pressão + movimento de linha ajudam a detectar janelas de entrada.</p>
                    </div>
                  </Surface>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <Surface>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">Pressão & Momentum</div>
                        <div className="mt-1 text-sm text-slate-500">Leitura operacional do momento da partida para entradas ao vivo.</div>
                      </div>
                      <Flame className="h-5 w-5 text-orange-300" />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <StatPill label="Mandante" value={momentum.homePressure} tone={momentum.leader === 'home' ? 'text-emerald-300' : 'text-slate-300'} />
                      <StatPill label="Visitante" value={momentum.awayPressure} tone={momentum.leader === 'away' ? 'text-cyan-300' : 'text-slate-300'} />
                      <StatPill label="Gap" value={momentum.pressureGap > 0 ? `+${momentum.pressureGap}` : momentum.pressureGap} tone={Math.abs(momentum.pressureGap) >= 8 ? 'text-amber-300' : 'text-slate-300'} />
                      <StatPill label="Confiança" value={formatPercent(momentum.confidence, { digits: 0 })} tone="text-orange-300" />
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-300">{momentum.label}</div>
                    {selectedMatch ? (
                      <div className="mt-4">
                        <PressureFlowChart predictions={analysis.predictions} liveData={liveData ?? null} homeTeam={selectedMatch.strHomeTeam} awayTeam={selectedMatch.strAwayTeam} />
                      </div>
                    ) : null}
                  </Surface>
                  <Surface>
                    <div className="text-lg font-black text-white">Painel live</div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <StatPill label="Posse casa" value={`${liveData?.homeStats.possession ?? 0}%`} />
                      <StatPill label="Posse fora" value={`${liveData?.awayStats.possession ?? 0}%`} />
                      <StatPill label="Chutes no alvo" value={`${liveData?.homeStats.shotsOnTarget ?? 0} x ${liveData?.awayStats.shotsOnTarget ?? 0}`} tone="text-emerald-300" />
                      <StatPill label="Corners" value={`${liveData?.homeStats.corners ?? 0} x ${liveData?.awayStats.corners ?? 0}`} tone="text-cyan-300" />
                      <StatPill label="Cartões" value={`${liveData?.homeStats.yellowCards ?? 0} x ${liveData?.awayStats.yellowCards ?? 0}`} tone="text-amber-300" />
                      <StatPill label="Fonte" value={liveLoading ? 'Atualizando...' : liveData?.provider ?? 'Pré-jogo'} tone="text-slate-300" />
                    </div>
                  </Surface>
                </div>
                <LiveTimeline events={liveData?.events ?? []} />
              </TabsContent>

              <TabsContent value="props" className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-2">
                  <PlayersTable title="Artilheiros do jogo" subtitle="Quem mais ameaça participação em gol agora." players={topProps.goal as unknown as Array<Record<string, unknown>>} metricLabel="Gol" metricValue={(player) => formatPercent(Number(player.goalProbability ?? 0), { digits: 0 })} />
                  <PlayersTable title="Risco de cartão" subtitle="Props disciplinares e jogadores mais faltosos." players={topProps.cards as unknown as Array<Record<string, unknown>>} metricLabel="Cartão" metricValue={(player) => formatPercent(Number(player.cardProbability ?? 0), { digits: 0 })} />
                  <PlayersTable title="Impacto live" subtitle="Quem mais pesa no ritmo do jogo ao vivo." players={topProps.impact as unknown as Array<Record<string, unknown>>} metricLabel="Impacto" metricValue={(player) => formatDecimal(Number(player.liveImpactScore ?? 0), 1)} />
                  <Surface>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">Ranking da liga</div>
                        <div className="mt-1 text-sm text-slate-500">Top artilheiros e mais advertidos na competição selecionada.</div>
                      </div>
                      <Trophy className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Top artilheiros</div>
                        <div className="mt-3 space-y-2">
                          {(leagueRankings?.topScorers ?? []).slice(0, 5).map((player) => (
                            <div key={`${player.id}-${player.scorerRank}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/55 px-3 py-2">
                              <div className="min-w-0"><div className="truncate text-sm font-bold text-white">{player.name}</div><div className="truncate text-xs text-slate-500">{player.teamName}</div></div>
                              <div className="text-sm font-black text-emerald-300">{player.goals}</div>
                            </div>
                          ))}
                          {rankingsLoading && <div className="text-sm text-slate-500">Carregando ranking...</div>}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Mais cartões</div>
                        <div className="mt-3 space-y-2">
                          {(leagueRankings?.mostYellowCards ?? []).slice(0, 5).map((player) => (
                            <div key={`${player.id}-${player.scorerRank}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/55 px-3 py-2">
                              <div className="min-w-0"><div className="truncate text-sm font-bold text-white">{player.name}</div><div className="truncate text-xs text-slate-500">{player.teamName}</div></div>
                              <div className="text-sm font-black text-amber-300">{player.yellowCards}</div>
                            </div>
                          ))}
                          {rankingsLoading && <div className="text-sm text-slate-500">Carregando ranking...</div>}
                        </div>
                      </div>
                    </div>
                  </Surface>
                </div>

                <Surface>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">Time & Team Intel</div>
                      <div className="mt-1 text-sm text-slate-500">Comparação rápida de forma, ataque, defesa, corners e disciplina.</div>
                    </div>
                    <Trophy className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {deepDiveCards.length === 0 ? (
                      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Carregando dados profundos do confronto...</div>
                    ) : deepDiveCards.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div><div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{analysis?.match.strHomeTeam ?? 'Mandante'}</div><div className={cn('mt-1 text-sm font-bold', item.homeTone)}>{item.home}</div></div>
                          <div><div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{analysis?.match.strAwayTeam ?? 'Visitante'}</div><div className={cn('mt-1 text-sm font-bold', item.awayTone)}>{item.away}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-400">
                    {playersLoading ? 'Carregando dados individuais do jogo...' : allPlayers.length > 0 ? `Jogadores monitorados agora: ${allPlayers.length}. Use esse bloco para cruzar props com momentum, odds e contexto da liga.` : 'Sem elenco detalhado disponível para esta partida no momento.'}
                  </div>
                </Surface>
              </TabsContent>

              <TabsContent value="manual" className="space-y-5">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                  <div className="space-y-6">
                    <Surface>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10"><Send className="h-5 w-5 text-blue-300" /></div>
                        <div>
                          <h2 className="text-lg font-bold text-white">Fluxo prático</h2>
                          <div className="mt-3 space-y-2 text-sm text-slate-400">
                            <p><span className="font-semibold text-slate-200">1.</span> Monte o bilhete com as seleções aprovadas pela análise.</p>
                            <p><span className="font-semibold text-slate-200">2.</span> Copie o cupom resumido ou a seleção principal.</p>
                            <p><span className="font-semibold text-slate-200">3.</span> Abra a casa oficial desejada e faça login diretamente lá.</p>
                            <p><span className="font-semibold text-slate-200">4.</span> Reproduza a aposta manualmente e confirme no ambiente oficial.</p>
                          </div>
                        </div>
                      </div>
                    </Surface>

                    <div className="grid gap-4 md:grid-cols-2">
                      {BOOKMAKERS.map((bookmaker) => (
                        <div key={bookmaker.id} className={`rounded-3xl border ${bookmaker.border} bg-gradient-to-br ${bookmaker.accent} p-5`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={cn('text-sm font-semibold', bookmaker.text)}>Casa suportada no fluxo manual</p>
                              <h3 className="mt-1 text-xl font-black text-white">{bookmaker.name}</h3>
                              <p className="mt-2 text-sm text-slate-400">{bookmaker.note}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20"><Shield className={cn('h-5 w-5', bookmaker.text)} /></div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <a href={bookmaker.url} target="_blank" rel="noopener noreferrer"><Button className="border border-white/10 bg-white/10 text-white hover:bg-white/15"><ExternalLink className="mr-2 h-4 w-4" />Abrir {bookmaker.name}</Button></a>
                            <Button variant="outline" className="border-slate-600/60 bg-slate-950/20 text-slate-200 hover:bg-slate-800/60" onClick={copySlip}><Copy className="mr-2 h-4 w-4" />Copiar cupom</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Surface className="border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10"><AlertTriangle className="h-5 w-5 text-amber-300" /></div>
                        <div>
                          <h2 className="text-lg font-bold text-white">Limite desta tela</h2>
                          <p className="mt-2 text-sm text-slate-400">Esta central foi desenhada para <span className="font-semibold text-slate-200">execução manual assistida</span>: copiar o cupom, abrir a casa correta e finalizar no site oficial. Não há captura de usuário/senha nem confirmação automática de aposta dentro do sistema.</p>
                        </div>
                      </div>
                    </Surface>
                  </div>

                  <div className="space-y-4">
                    <Surface>
                      <div className="mb-3 flex items-center gap-2"><ReceiptText className="h-4 w-4 text-emerald-300" /><h2 className="text-lg font-bold text-white">Cupom pronto para copiar</h2></div>
                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-4 text-sm text-slate-500">Nenhuma seleção no bilhete ainda. Use Top Palpites para adicionar sinais fortes da rodada.</div>
                      ) : (
                        <>
                          <div className="mb-4 space-y-2">{items.map((item, index) => <div key={item.id} className="rounded-2xl border border-slate-700/40 bg-slate-950/30 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">{index + 1}. {item.matchLabel}</p><p className="mt-1 text-xs text-slate-400">{traduzirTextoMercado(item.tipLabel)}</p></div><div className="text-right"><p className="text-sm font-black text-emerald-300">cotação {item.odds.toFixed(2)}</p><p className="text-xs text-slate-500">Prob. {item.probability}%</p></div></div></div>)}</div>
                          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                            <StatPill label="Entrada" value={`R$ ${stake.toFixed(2)}`} />
                            <StatPill label="Cotações" value={`${totalOdds.toFixed(2)}x`} />
                            <StatPill label="Retorno" value={`R$ ${potentialReturn.toFixed(2)}`} tone="text-emerald-300" />
                          </div>
                          <div className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-950/30 p-3">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Stake</div>
                            <div className="mt-2 flex items-center gap-3"><Input type="number" value={stake} onChange={(event) => setStake(Number(event.target.value || 0))} className="border-slate-700/60 bg-slate-900/50 text-white" /><span className="text-sm text-slate-500">R$</span></div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <Button className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={copySlip}><Copy className="mr-2 h-4 w-4" />Copiar cupom completo</Button>
                            <Button variant="outline" className="border-slate-600/60 bg-slate-950/20 text-slate-200 hover:bg-slate-800/60" onClick={copyTopSelection}><Star className="mr-2 h-4 w-4" />Copiar seleção principal</Button>
                          </div>
                        </>
                      )}
                    </Surface>

                    <Surface>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10"><Lock className="h-5 w-5 text-violet-300" /></div>
                        <div>
                          <div className="text-lg font-bold text-white">Governança do fluxo</div>
                          <div className="mt-2 text-sm text-slate-400">Decisão e montagem no sistema, autenticação e confirmação final na casa oficial. Mantém controle, rastreio e conformidade do operador.</div>
                        </div>
                      </div>
                    </Surface>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <BottomModeDock active="conta" onSelect={handleDock} />
    </div>
  );
}
