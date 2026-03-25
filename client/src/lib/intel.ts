import type { LiveMatchData } from '@/hooks/useLiveMatch';
import type { PlayerData } from '@/hooks/useMatchPlayers';
import type { RoundScanEntry } from '@/hooks/useRoundScanner';
import type { Tip } from '@/lib/types';

export function impliedProbability(decimalOdd: number | null | undefined): number | null {
  if (!decimalOdd || !Number.isFinite(decimalOdd) || decimalOdd <= 1) return null;
  return Number(((1 / decimalOdd) * 100).toFixed(1));
}

export function fairOdds(probabilityPct: number | null | undefined): number | null {
  if (probabilityPct == null || !Number.isFinite(probabilityPct) || probabilityPct <= 0 || probabilityPct >= 100) return null;
  return Number((100 / probabilityPct).toFixed(2));
}

export function edgeFromMarket(modelProbabilityPct: number | null | undefined, marketOdd: number | null | undefined) {
  const implied = impliedProbability(marketOdd);
  if (modelProbabilityPct == null || implied == null) return null;
  const edgePct = Number((modelProbabilityPct - implied).toFixed(1));
  const fair = fairOdds(modelProbabilityPct);
  const marketGap = fair && marketOdd ? Number((((marketOdd - fair) / fair) * 100).toFixed(1)) : null;
  let band: 'elite' | 'forte' | 'leve' | 'neutro' | 'ruim' = 'neutro';
  if (edgePct >= 8) band = 'elite';
  else if (edgePct >= 4) band = 'forte';
  else if (edgePct >= 1.5) band = 'leve';
  else if (edgePct <= -4) band = 'ruim';
  return { implied, fair, edgePct, marketGap, band };
}

export function buildMomentumSummary(liveData: LiveMatchData | null, homeTeam: string, awayTeam: string) {
  if (!liveData?.isLive) {
    return { leader: 'none' as const, label: 'Aguardando jogo ao vivo', confidence: 0, homePressure: 0, awayPressure: 0, pressureGap: 0 };
  }
  const home = liveData.homeStats;
  const away = liveData.awayStats;
  const homePressure = Math.round(home.shots * 4 + home.shotsOnTarget * 7 + home.corners * 3 + home.possession * 0.35 + Number(liveData.homeScore || 0) * 8);
  const awayPressure = Math.round(away.shots * 4 + away.shotsOnTarget * 7 + away.corners * 3 + away.possession * 0.35 + Number(liveData.awayScore || 0) * 8);
  const pressureGap = homePressure - awayPressure;
  const absoluteGap = Math.abs(pressureGap);
  const confidence = Math.min(100, Math.max(10, absoluteGap + Math.round((home.shotsOnTarget + away.shotsOnTarget) * 3)));
  if (absoluteGap < 8) return { leader: 'none' as const, label: 'Jogo equilibrado no momento', confidence, homePressure, awayPressure, pressureGap };
  return { leader: pressureGap > 0 ? 'home' as const : 'away' as const, label: pressureGap > 0 ? `${homeTeam} pressiona mais agora` : `${awayTeam} pressiona mais agora`, confidence, homePressure, awayPressure, pressureGap };
}

export function getTopPropsPlayers(players: PlayerData[]) {
  const goal = [...players].filter((player) => player.goalProbability > 0).sort((a, b) => b.goalProbability - a.goalProbability || b.next15GoalProbability - a.next15GoalProbability).slice(0, 5);
  const cards = [...players].filter((player) => player.cardProbability > 0).sort((a, b) => b.cardProbability - a.cardProbability || b.foulsCommittedInGame - a.foulsCommittedInGame).slice(0, 5);
  const impact = [...players].sort((a, b) => b.liveImpactScore - a.liveImpactScore || b.involvementIndex - a.involvementIndex).slice(0, 5);
  return { goal, cards, impact };
}

export type OpportunityFilter = 'all' | 'goals' | 'ht' | 'corners' | 'cards' | 'btts' | 'value' | 'live';

export interface TopOpportunity {
  id: string;
  category: Tip['category'];
  filter: Exclude<OpportunityFilter, 'all'>;
  matchId: string;
  matchLabel: string;
  league: string;
  title: string;
  marketLabel: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  edge: number | null;
  marketOdd: number | null;
  fairOdd: number | null;
  score: number;
  reasonTags: string[];
  entry: RoundScanEntry;
}

export interface TeamTrendItem {
  id: string;
  teamName: string;
  league: string;
  metric: number;
  secondary: string;
  tag: string;
  matchId: string;
  entry: RoundScanEntry;
}

export interface TrendBoards {
  firstHalfScorers: TeamTrendItem[];
  goalsOverall: TeamTrendItem[];
  cornersFor: TeamTrendItem[];
  cornersAgainst: TeamTrendItem[];
  cardsTeams: TeamTrendItem[];
  bttsTeams: TeamTrendItem[];
}

function confidenceScore(confidence: RoundScanEntry['confidence']) {
  return confidence === 'high' ? 12 : confidence === 'medium' ? 6 : 0;
}

function normalizeProbability(probability: number | null | undefined) {
  if (!Number.isFinite(probability ?? NaN)) return 0;
  return Math.max(0, Math.min(100, Number(probability)));
}

function createOpportunityFromEntry(entry: RoundScanEntry, filter: Exclude<OpportunityFilter, 'all'>): TopOpportunity | null {
  const p = entry.predictions;
  const matchLabel = `${entry.match.strHomeTeam} x ${entry.match.strAwayTeam}`;
  const confidence = entry.confidence;

  if (filter === 'value') {
    const value = [...entry.valueBets].sort((a, b) => b.edge - a.edge)[0];
    if (!value) return null;
    return {
      id: `${entry.match.idEvent}-value`,
      category: 'special',
      filter,
      matchId: entry.match.idEvent,
      matchLabel,
      league: entry.match.strLeague,
      title: 'Top value da rodada',
      marketLabel: value.market,
      probability: normalizeProbability(value.ourProb),
      confidence,
      edge: value.edge,
      marketOdd: value.marketOdds,
      fairOdd: value.ourOdds,
      score: value.edge * 4 + entry.summary.decisionScore + confidenceScore(confidence),
      reasonTags: [
        `Modelo ${Math.round(value.ourProb)}%`,
        `Mercado ${Math.round(value.impliedProb)}%`,
        `Edge ${value.edge > 0 ? '+' : ''}${value.edge.toFixed(1)}%`,
      ],
      entry,
    };
  }

  if (filter === 'live') {
    if (entry.liveState !== 'live') return null;
    const pressure = entry.livePressureScore;
    return {
      id: `${entry.match.idEvent}-live`,
      category: 'special',
      filter,
      matchId: entry.match.idEvent,
      matchLabel,
      league: entry.match.strLeague,
      title: 'Radar ao vivo',
      marketLabel: 'Janela de pressão / gatilho live',
      probability: pressure,
      confidence,
      edge: entry.topValueEdge > 0 ? entry.topValueEdge : null,
      marketOdd: null,
      fairOdd: null,
      score: pressure + entry.summary.decisionScore * 0.4 + confidenceScore(confidence),
      reasonTags: [
        `Pressão ${pressure}/100`,
        `${Math.round(p.firstHalfOver05Prob)}% gol 1ºT`,
        `${Math.round(p.over85CornersProb)}% +8.5 esc.`,
      ],
      entry,
    };
  }

  const mapping = {
    goals: {
      category: 'goals' as const,
      title: 'Top gols no geral',
      marketLabel: 'Mais de 2.5 gols',
      probability: p.over25Prob,
      marketOdd: entry.marketOdds?.totalLine && Math.abs(entry.marketOdds.totalLine - 2.5) < 0.15 ? entry.marketOdds.overOdds : null,
      score: p.over25Prob * 0.82 + entry.summary.decisionScore * 0.22 + p.expectedTotalGoals * 3.2,
      reasons: [`xG ${p.expectedTotalGoals.toFixed(2)}`, `${Math.round(p.bttsYesProb)}% BTTS`, `${Math.round(p.homeToScoreProb)}% casa marca`],
    },
    ht: {
      category: 'halftime' as const,
      title: 'Top gol no 1º tempo',
      marketLabel: 'Gol no 1º tempo',
      probability: p.firstHalfOver05Prob,
      marketOdd: null,
      score: p.firstHalfOver05Prob * 0.86 + entry.summary.decisionScore * 0.18 + p.expectedFirstHalfGoals * 6.5,
      reasons: [`${Math.round(p.firstHalfOver15Prob)}% over 1.5 HT`, `${p.expectedFirstHalfGoals.toFixed(2)} gols HT`, `${Math.round(p.homeToScoreProb)}% casa marca`],
    },
    corners: {
      category: 'corners' as const,
      title: 'Top escanteios',
      marketLabel: 'Mais de 8.5 escanteios',
      probability: p.over85CornersProb,
      marketOdd: null,
      score: p.over85CornersProb * 0.8 + entry.summary.stabilityScore * 0.22 + p.expectedCorners * 2.4,
      reasons: [`${p.expectedCorners.toFixed(1)} esc. esperados`, `${entry.homeTeamStats.avgCornersFor.toFixed(1)} pró casa`, `${entry.awayTeamStats.avgCornersFor.toFixed(1)} pró fora`],
    },
    cards: {
      category: 'cards' as const,
      title: 'Top cartões',
      marketLabel: 'Mais de 3.5 cartões',
      probability: p.over35CardsProb,
      marketOdd: null,
      score: p.over35CardsProb * 0.84 + entry.summary.marketAlignmentScore * 0.18 + p.expectedCards * 5.2,
      reasons: [`${p.expectedCards.toFixed(1)} cartões esperados`, `${entry.homeTeamStats.avgTotalCardsPerGame.toFixed(1)} média casa`, `${entry.awayTeamStats.avgTotalCardsPerGame.toFixed(1)} média fora`],
    },
    btts: {
      category: 'btts' as const,
      title: 'Top ambas marcam',
      marketLabel: 'Ambas marcam — Sim',
      probability: p.bttsYesProb,
      marketOdd: null,
      score: p.bttsYesProb * 0.82 + entry.summary.decisionScore * 0.2 + p.expectedTotalGoals * 2.6,
      reasons: [`${Math.round(p.homeToScoreProb)}% casa marca`, `${Math.round(p.awayToScoreProb)}% fora marca`, `${Math.round(p.over25Prob)}% over 2.5`],
    },
  } as const;

  const config = mapping[filter as keyof typeof mapping];
  if (!config) return null;
  const edge = edgeFromMarket(config.probability, config.marketOdd)?.edgePct ?? null;
  return {
    id: `${entry.match.idEvent}-${filter}`,
    category: config.category,
    filter,
    matchId: entry.match.idEvent,
    matchLabel,
    league: entry.match.strLeague,
    title: config.title,
    marketLabel: config.marketLabel,
    probability: normalizeProbability(config.probability),
    confidence,
    edge,
    marketOdd: config.marketOdd,
    fairOdd: fairOdds(config.probability),
    score: config.score + confidenceScore(confidence) + (entry.liveState === 'live' ? 5 : 0),
    reasonTags: config.reasons,
    entry,
  };
}

export function buildTopOpportunityBoard(entries: RoundScanEntry[], filter: OpportunityFilter = 'all', limit = 8) {
  const filters: Exclude<OpportunityFilter, 'all'>[] = filter === 'all'
    ? ['value', 'ht', 'goals', 'corners', 'cards', 'btts', 'live']
    : [filter];

  return entries
    .flatMap((entry) => filters.map((current) => createOpportunityFromEntry(entry, current)))
    .filter((item): item is TopOpportunity => Boolean(item))
    .sort((a, b) => b.score - a.score || b.probability - a.probability)
    .slice(0, limit);
}

function pickTeams(entries: RoundScanEntry[]) {
  return entries.flatMap((entry) => ([
    { entry, teamName: entry.match.strHomeTeam, league: entry.match.strLeague, matchId: entry.match.idEvent, stats: entry.homeTeamStats },
    { entry, teamName: entry.match.strAwayTeam, league: entry.match.strLeague, matchId: entry.match.idEvent, stats: entry.awayTeamStats },
  ]));
}

export function buildTrendBoards(entries: RoundScanEntry[]): TrendBoards {
  const teams = pickTeams(entries);
  const build = (
    selector: (item: (typeof teams)[number]) => number,
    secondary: (item: (typeof teams)[number]) => string,
    tag: string,
    limit = 8,
  ) => teams
    .map((item) => ({
      id: `${item.matchId}-${item.teamName}-${tag}`,
      teamName: item.teamName,
      league: item.league,
      metric: selector(item),
      secondary: secondary(item),
      tag,
      matchId: item.matchId,
      entry: item.entry,
    }))
    .sort((a, b) => b.metric - a.metric)
    .slice(0, limit);

  return {
    firstHalfScorers: build(
      ({ stats }) => stats.goalsFirstHalfRate * 100,
      ({ stats }) => `${stats.avgGoalsScored.toFixed(2)} gols pró · ${Math.round(stats.over15Rate)}% over 1.5`,
      'Gol HT',
    ),
    goalsOverall: build(
      ({ stats }) => stats.avgGoalsScored * 28 + stats.over25Rate * 0.6,
      ({ stats }) => `${stats.avgGoalsScored.toFixed(2)} gols pró · BTTS ${Math.round(stats.bttsRate)}%`,
      'Gols',
    ),
    cornersFor: build(
      ({ stats }) => stats.avgCornersFor,
      ({ stats }) => `${stats.avgCornersFor.toFixed(1)} pró · ${stats.avgCornersAgainst.toFixed(1)} contra`,
      'Esc. pró',
    ),
    cornersAgainst: build(
      ({ stats }) => stats.avgCornersAgainst,
      ({ stats }) => `${stats.avgCornersAgainst.toFixed(1)} cedidos · ${stats.avgCornersFor.toFixed(1)} pró`,
      'Esc. contra',
    ),
    cardsTeams: build(
      ({ stats }) => stats.avgTotalCardsPerGame,
      ({ stats }) => `${stats.avgTotalCardsPerGame.toFixed(2)} média · agressividade ${(stats.aggressionIndex * 100).toFixed(0)}%`,
      'Cartões',
    ),
    bttsTeams: build(
      ({ stats }) => stats.bttsRate,
      ({ stats }) => `${Math.round(stats.bttsRate)}% BTTS · clean sheet ${Math.round(stats.cleanSheetRate)}%`,
      'BTTS',
    ),
  };
}
