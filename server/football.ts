/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RAPHA GURU — Motor de Dados API Football (Ultra Plan)
 *  Versão: 2.0 — Motor Completo
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Endpoints cobertos:
 *    /status             — uso da conta e limite diário
 *    /fixtures           — jogos ao vivo, do dia, próximos, últimos
 *    /fixtures/headtohead — confronto direto entre dois times
 *    /fixtures/statistics — estatísticas completas (chutes, posse, passes...)
 *    /fixtures/events    — gols, cartões, substituições, VAR
 *    /fixtures/lineups   — escalações e formações
 *    /fixtures/players   — estatísticas de jogadores por partida
 *    /predictions        — predições (Poisson, comparação, advice)
 *    /injuries           — lesões e desfalques
 *    /standings          — classificações das ligas
 *    /odds/live          — odds ao vivo (atualização a cada 5s)
 *    /odds/live/bets     — lista de mercados disponíveis ao vivo
 *    /odds               — odds pré-jogo (1-14 dias antes)
 *    /leagues            — ligas disponíveis
 *    /teams              — informações dos times
 *    /teams/statistics   — estatísticas do time na temporada
 *
 *  Cache inteligente:
 *    - Ao vivo: 30s TTL
 *    - Estatísticas: 45s TTL
 *    - Eventos: 15s TTL
 *    - Odds ao vivo: 10s TTL
 *    - Predições: 60min TTL
 *    - Standings: 60min TTL
 *    - Lesões: 30min TTL
 *    - H2H: 24h TTL
 *
 *  Proteção de quota:
 *    - API liberada 24h (sem bloqueio de horário)
 *    - 75.000 req/dia disponíveis
 * ═══════════════════════════════════════════════════════════════════════════
 */

import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const BASE_URL = "https://v3.football.api-sports.io";

// ─── Cache em memória ────────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttl });
}

// ─── Controle de horário ─────────────────────────────────────────────────────
// API liberada 24h — 75.000 req/dia disponíveis (trava removida)
export function isBlockedHour(): boolean {
  return false;
}

// ─── Contador de requisições diárias ─────────────────────────────────────────
const dailyCounter = { count: 0, date: new Date().toISOString().slice(0, 10) };

export function getApiUsage(): { count: number; limit: number; percent: number; date: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCounter.date !== today) {
    dailyCounter.count = 0;
    dailyCounter.date = today;
  }
  const limit = 75000;
  return {
    count: dailyCounter.count,
    limit,
    percent: Math.round((dailyCounter.count / limit) * 100),
    date: dailyCounter.date,
  };
}

function incrementApiCounter(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCounter.date !== today) {
    dailyCounter.count = 0;
    dailyCounter.date = today;
  }
  dailyCounter.count++;
}

// ─── Cliente HTTP ─────────────────────────────────────────────────────
async function apiRequest<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  incrementApiCounter();
  const response = await axios.get(url, {
    headers: { "x-apisports-key": API_KEY },
    params,
    timeout: 12000,
  });

  const data = response.data;
  if (data.errors && Object.keys(data.errors).length > 0) {
    const errMsg = JSON.stringify(data.errors);
    if (errMsg !== '[]' && errMsg !== '{}') {
      throw new Error(`API Football error: ${errMsg}`);
    }
  }

  return data.response as T;
}

// ═══════════════════════════════════════════════════════════════════════════
//  TIPOS COMPLETOS
// ═══════════════════════════════════════════════════════════════════════════

export interface FixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
  extra: number | null;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
  standings?: boolean;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

export interface FixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string; // "Normal Goal", "Own Goal", "Penalty", "Yellow Card", "Red Card", "Substitution 1"...
  comments: string | null;
}

export interface FixtureStatistic {
  type: string;
  value: string | number | null;
}

export interface TeamStatistics {
  team: { id: number; name: string; logo: string };
  statistics: FixtureStatistic[];
}

export interface PlayerFixtureStats {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    games: {
      minutes: number | null;
      number: number;
      position: string;
      rating: string | null;
      captain: boolean;
      substitute: boolean;
    };
    offsides: number | null;
    shots: { total: number | null; on: number | null };
    goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
    passes: { total: number | null; key: number | null; accuracy: string | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null; past: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number; red: number };
    penalty: { won: number | null; commited: number | null; scored: number | null; missed: number | null; saved: number | null };
  }>;
}

export interface FixtureLineup {
  team: { id: number; name: string; logo: string; colors: unknown };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
}

export interface LiveFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
    status: FixtureStatus;
  };
  league: League;
  teams: { home: Team; away: Team };
  goals: Goals;
  score: Score;
  events: FixtureEvent[];
  lineups: FixtureLineup[];
  statistics: TeamStatistics[];
  players: Array<{ team: Team; players: PlayerFixtureStats[] }>;
}

export interface OddValue {
  value: string;
  odd: string;
  handicap: string | null;
  main: boolean | null;
  suspended: boolean;
}

export interface OddBet {
  id: number;
  name: string;
  values: OddValue[];
}

export interface LiveOdd {
  fixture: {
    id: number;
    timezone: string;
    date: string;
    status: {
      stopped: boolean;
      blocked: boolean;
      finished: boolean;
    };
  };
  league: League;
  teams: { home: Team; away: Team };
  /** A API retorna o campo como 'odds' (não 'bets') */
  odds: OddBet[];
  /** Alias para compatibilidade */
  bets?: OddBet[];
}

export interface PreMatchOdd {
  fixture: { id: number };
  league: League;
  bookmakers: Array<{
    id: number;
    name: string;
    bets: OddBet[];
  }>;
}

export interface Prediction {
  winner: { id: number | null; name: string | null; comment: string | null };
  win_or_draw: boolean;
  under_over: string | null;
  goals: { home: string; away: string };
  advice: string;
  percent: { home: string; draw: string; away: string };
}

export interface PredictionResponse {
  predictions: Prediction;
  league: League;
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: { for: { total: Goals; average: Goals }; against: { total: Goals; average: Goals } };
      };
    };
    away: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: { for: { total: Goals; average: Goals }; against: { total: Goals; average: Goals } };
      };
    };
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  h2h: LiveFixture[];
}

export interface InjuryPlayer {
  player: { id: number; name: string; photo: string; type: string; reason: string };
  team: Team;
}

export interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  update: string;
}

export interface TeamSeasonStats {
  league: League;
  team: Team;
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string }; minute: Record<string, { total: number | null; percentage: string | null }> };
    against: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string }; minute: Record<string, { total: number | null; percentage: string | null }> };
  };
  biggest: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  penalty: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups: Array<{ formation: string; played: number }>;
  cards: {
    yellow: Record<string, { total: number | null; percentage: string | null }>;
    red: Record<string, { total: number | null; percentage: string | null }>;
  };
}

export interface ApiStatus {
  account: { firstname: string; lastname: string; email: string };
  subscription: { plan: string; active: boolean; end: string };
  requests: { current: number; limit_day: number };
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — STATUS
// ═══════════════════════════════════════════════════════════════════════════

export async function getApiStatus(): Promise<ApiStatus> {
  const raw = await apiRequest<ApiStatus[]>("/status");
  return (raw as unknown) as ApiStatus;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

/** Todos os jogos ao vivo (com eventos embutidos, atualização a cada 15s) */
export async function getLiveFixtures(): Promise<LiveFixture[]> {
  const key = "live_fixtures";
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { live: "all" });
  setCached(key, data, 30_000);
  return data;
}

/** Jogos ao vivo filtrados por ligas específicas */
export async function getLiveFixturesByLeagues(leagueIds: number[]): Promise<LiveFixture[]> {
  const key = `live_fixtures_leagues_${leagueIds.join("-")}`;
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { live: leagueIds.join("-") });
  setCached(key, data, 30_000);
  return data;
}

/** Jogos do dia */
export async function getTodayFixtures(date?: string): Promise<LiveFixture[]> {
  const today = date || new Date().toISOString().split("T")[0];
  const key = `today_${today}`;
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { date: today, timezone: "America/Sao_Paulo" });
  setCached(key, data, 120_000);
  return data;
}

/** Próximos X jogos */
export async function getNextFixtures(count: number = 20): Promise<LiveFixture[]> {
  const key = `next_${count}`;
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { next: count, timezone: "America/Sao_Paulo" });
  setCached(key, data, 300_000);
  return data;
}

/** Últimos X jogos */
export async function getLastFixtures(count: number = 20): Promise<LiveFixture[]> {
  const key = `last_${count}`;
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { last: count, timezone: "America/Sao_Paulo" });
  setCached(key, data, 120_000);
  return data;
}

/** Fixture específico por ID (com eventos, lineups, estatísticas e jogadores) */
export async function getFixtureById(fixtureId: number): Promise<LiveFixture | null> {
  const key = `fixture_${fixtureId}`;
  const cached = getCached<LiveFixture | null>(key);
  if (cached !== null) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { id: fixtureId });
  const result = data[0] || null;
  setCached(key, result, 30_000);
  return result;
}

/** Múltiplos fixtures por IDs (máx 20) */
export async function getFixturesByIds(fixtureIds: number[]): Promise<LiveFixture[]> {
  const key = `fixtures_ids_${fixtureIds.join("-")}`;
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures", { ids: fixtureIds.join("-") });
  setCached(key, data, 30_000);
  return data;
}

/** Head-to-head entre dois times */
export async function getHeadToHead(
  team1Id: number,
  team2Id: number,
  last: number = 10
): Promise<LiveFixture[]> {
  const key = `h2h_${team1Id}_${team2Id}_${last}`;
  const cached = getCached<LiveFixture[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveFixture[]>("/fixtures/headtohead", {
    h2h: `${team1Id}-${team2Id}`,
    last,
  });
  setCached(key, data, 86_400_000); // 24h
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — ESTATÍSTICAS
// ═══════════════════════════════════════════════════════════════════════════

/** Estatísticas completas de um jogo (com dados de 1º e 2º tempo) */
export async function getFixtureStatistics(
  fixtureId: number,
  half: boolean = false
): Promise<TeamStatistics[]> {
  const key = `stats_${fixtureId}_${half}`;
  const cached = getCached<TeamStatistics[]>(key);
  if (cached) return cached;
  const params: Record<string, string | number | boolean> = { fixture: fixtureId };
  if (half) params.half = true;
  const data = await apiRequest<TeamStatistics[]>("/fixtures/statistics", params);
  setCached(key, data, 45_000);
  return data;
}

/** Eventos de um jogo (gols, cartões, substituições, VAR) */
export async function getFixtureEvents(fixtureId: number): Promise<FixtureEvent[]> {
  const key = `events_${fixtureId}`;
  const cached = getCached<FixtureEvent[]>(key);
  if (cached) return cached;
  const data = await apiRequest<FixtureEvent[]>("/fixtures/events", { fixture: fixtureId });
  setCached(key, data, 15_000);
  return data;
}

/** Escalações de um jogo */
export async function getFixtureLineups(fixtureId: number): Promise<FixtureLineup[]> {
  const key = `lineups_${fixtureId}`;
  const cached = getCached<FixtureLineup[]>(key);
  if (cached) return cached;
  const data = await apiRequest<FixtureLineup[]>("/fixtures/lineups", { fixture: fixtureId });
  setCached(key, data, 300_000);
  return data;
}

/** Estatísticas de jogadores em um jogo */
export async function getFixturePlayers(
  fixtureId: number
): Promise<Array<{ team: Team; players: PlayerFixtureStats[] }>> {
  const key = `fixture_players_${fixtureId}`;
  const cached = getCached<Array<{ team: Team; players: PlayerFixtureStats[] }>>(key);
  if (cached) return cached;
  const data = await apiRequest<Array<{ team: Team; players: PlayerFixtureStats[] }>>(
    "/fixtures/players",
    { fixture: fixtureId }
  );
  setCached(key, data, 60_000);
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — PREDIÇÕES
// ═══════════════════════════════════════════════════════════════════════════

/** Predições para um jogo (Poisson, comparação de times, advice) */
export async function getFixturePredictions(fixtureId: number): Promise<PredictionResponse | null> {
  const key = `predictions_${fixtureId}`;
  const cached = getCached<PredictionResponse | null>(key);
  if (cached !== null) return cached;
  const data = await apiRequest<PredictionResponse[]>("/predictions", { fixture: fixtureId });
  const result = data[0] || null;
  setCached(key, result, 3_600_000); // 1h
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — ODDS
// ═══════════════════════════════════════════════════════════════════════════

/** Odds ao vivo de todos os jogos em andamento */
export async function getAllLiveOdds(): Promise<LiveOdd[]> {
  const key = "all_live_odds";
  const cached = getCached<LiveOdd[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveOdd[]>("/odds/live");
  setCached(key, data, 10_000); // 10s TTL — atualiza a cada 5s na API
  return data;
}

/** Odds ao vivo de um jogo específico */
export async function getLiveOdds(fixtureId: number): Promise<LiveOdd | null> {
  const key = `live_odds_${fixtureId}`;
  const cached = getCached<LiveOdd | null>(key);
  if (cached !== null) return cached;
  const data = await apiRequest<LiveOdd[]>("/odds/live", { fixture: fixtureId });
  const result = data[0] || null;
  setCached(key, result, 10_000);
  return result;
}

/** Odds ao vivo de uma liga */
export async function getLiveOddsByLeague(leagueId: number): Promise<LiveOdd[]> {
  const key = `live_odds_league_${leagueId}`;
  const cached = getCached<LiveOdd[]>(key);
  if (cached) return cached;
  const data = await apiRequest<LiveOdd[]>("/odds/live", { league: leagueId });
  setCached(key, data, 10_000);
  return data;
}

/** Odds pré-jogo de um fixture */
export async function getPreMatchOdds(fixtureId: number): Promise<PreMatchOdd[]> {
  const key = `prematch_${fixtureId}`;
  const cached = getCached<PreMatchOdd[]>(key);
  if (cached) return cached;
  const data = await apiRequest<PreMatchOdd[]>("/odds", { fixture: fixtureId });
  setCached(key, data, 10_800_000); // 3h
  return data;
}

/** Lista de mercados disponíveis para odds ao vivo */
export async function getLiveOddsBets(): Promise<Array<{ id: number; name: string }>> {
  const key = "live_odds_bets";
  const cached = getCached<Array<{ id: number; name: string }>>(key);
  if (cached) return cached;
  const data = await apiRequest<Array<{ id: number; name: string }>>("/odds/live/bets");
  setCached(key, data, 3_600_000); // 1h
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — LESÕES
// ═══════════════════════════════════════════════════════════════════════════

/** Lesões e desfalques de um jogo */
export async function getFixtureInjuries(fixtureId: number): Promise<InjuryPlayer[]> {
  const key = `injuries_${fixtureId}`;
  const cached = getCached<InjuryPlayer[]>(key);
  if (cached) return cached;
  const data = await apiRequest<InjuryPlayer[]>("/injuries", { fixture: fixtureId });
  setCached(key, data, 1_800_000); // 30min
  return data;
}

/** Lesões de um time na temporada */
export async function getTeamInjuries(teamId: number, season: number): Promise<InjuryPlayer[]> {
  const key = `team_injuries_${teamId}_${season}`;
  const cached = getCached<InjuryPlayer[]>(key);
  if (cached) return cached;
  const data = await apiRequest<InjuryPlayer[]>("/injuries", { team: teamId, season });
  setCached(key, data, 1_800_000);
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — STANDINGS (CLASSIFICAÇÕES)
// ═══════════════════════════════════════════════════════════════════════════

/** Classificação de uma liga */
export async function getStandings(leagueId: number, season: number): Promise<Standing[][]> {
  const key = `standings_${leagueId}_${season}`;
  const cached = getCached<Standing[][]>(key);
  if (cached) return cached;
  const data = await apiRequest<Array<{ league: { standings: Standing[][] } }>>(
    "/standings",
    { league: leagueId, season }
  );
  const standings = data[0]?.league?.standings || [];
  setCached(key, standings, 3_600_000); // 1h
  return standings;
}

/** Classificação de um time em todas as ligas da temporada */
export async function getTeamStandings(teamId: number, season: number): Promise<Standing[][]> {
  const key = `team_standings_${teamId}_${season}`;
  const cached = getCached<Standing[][]>(key);
  if (cached) return cached;
  const data = await apiRequest<Array<{ league: { standings: Standing[][] } }>>(
    "/standings",
    { team: teamId, season }
  );
  const standings = data[0]?.league?.standings || [];
  setCached(key, standings, 3_600_000);
  return standings;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES PÚBLICAS — TIMES
// ═══════════════════════════════════════════════════════════════════════════

/** Estatísticas de um time na temporada */
export async function getTeamSeasonStats(
  teamId: number,
  leagueId: number,
  season: number
): Promise<TeamSeasonStats | null> {
  const key = `team_stats_${teamId}_${leagueId}_${season}`;
  const cached = getCached<TeamSeasonStats | null>(key);
  if (cached !== null) return cached;
  const data = await apiRequest<TeamSeasonStats>("/teams/statistics", {
    team: teamId,
    league: leagueId,
    season,
  });
  setCached(key, data, 3_600_000); // 1h
  return (data as unknown) as TeamSeasonStats;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ANÁLISE DE IA — Motor de Oportunidades
// ═══════════════════════════════════════════════════════════════════════════

export interface Oportunidade {
  mercado: string;
  odd: number;
  ev: number; // Expected Value em %
  confianca: number; // 0-100
  motivos: string[];
  tipo: "over" | "under" | "btts" | "resultado" | "cartao" | "escanteio" | "especial";
  urgencia: "alta" | "media" | "baixa";
}

/**
 * Analisa um jogo ao vivo e retorna oportunidades detectadas pela IA
 * Usa: estatísticas, eventos, odds ao vivo, predições
 */
export function analisarOportunidades(
  fixture: LiveFixture,
  stats: TeamStatistics[],
  odds: LiveOdd | null,
  prediction: PredictionResponse | null
): Oportunidade[] {
  const oportunidades: Oportunidade[] = [];
  const elapsed = fixture.fixture.status.elapsed || 0;
  const goalsHome = fixture.goals.home || 0;
  const goalsAway = fixture.goals.away || 0;
  const totalGoals = goalsHome + goalsAway;

  // Extrair estatísticas dos times
  const statsHome = stats[0]?.statistics || [];
  const statsAway = stats[1]?.statistics || [];

  const getStat = (teamStats: FixtureStatistic[], type: string): number => {
    const s = teamStats.find((x) => x.type === type);
    if (!s || s.value === null) return 0;
    if (typeof s.value === "string") {
      return parseFloat(s.value.replace("%", "")) || 0;
    }
    return s.value as number;
  };

  const shotsOnGoalHome = getStat(statsHome, "Shots on Goal");
  const shotsOnGoalAway = getStat(statsAway, "Shots on Goal");
  const totalShotsHome = getStat(statsHome, "Total Shots");
  const totalShotsAway = getStat(statsAway, "Total Shots");
  const cornersHome = getStat(statsHome, "Corner Kicks");
  const cornersAway = getStat(statsAway, "Corner Kicks");
  const totalCorners = cornersHome + cornersAway;
  const possessionHome = getStat(statsHome, "Ball Possession");
  const yellowHome = getStat(statsHome, "Yellow Cards");
  const yellowAway = getStat(statsAway, "Yellow Cards");
  const totalYellow = yellowHome + yellowAway;
  const foulsHome = getStat(statsHome, "Fouls");
  const foulsAway = getStat(statsAway, "Fouls");
  const totalFouls = foulsHome + foulsAway;

  // Extrair odds ao vivo relevantes
  // A API retorna o campo como 'odds' (não 'bets')
  const getOdd = (betName: string, value: string): number => {
    if (!odds) return 0;
    const betsArray = odds.odds ?? odds.bets ?? [];
    const bet = betsArray.find((b) => b.name.toLowerCase().includes(betName.toLowerCase()));
    if (!bet) return 0;
    const v = bet.values.find((x) => x.value.toLowerCase().includes(value.toLowerCase()) && !x.suspended);
    return v ? parseFloat(v.odd) : 0;
  };

  // ── OVER 0.5 FT ──────────────────────────────────────────────────────────
  if (elapsed >= 20 && elapsed <= 60 && totalGoals === 0) {
    const pressaoTotal = shotsOnGoalHome + shotsOnGoalAway;
    if (pressaoTotal >= 4 || totalShotsHome + totalShotsAway >= 8) {
      const oddOver = getOdd("over", "0.5") || 1.3;
      const confianca = Math.min(95, 55 + pressaoTotal * 4 + (elapsed > 40 ? 15 : 0));
      const ev = calcEV(confianca / 100, oddOver);
      if (ev > 0) {
        oportunidades.push({
          mercado: "Acima 0.5 Gols (FT)",
          odd: oddOver,
          ev,
          confianca,
          motivos: [
            `${pressaoTotal} chutes no gol sem marcar`,
            `${totalShotsHome + totalShotsAway} chutes totais`,
            elapsed > 40 ? "Pressão crescente no 2º tempo" : "Alta pressão ofensiva",
            `Posse: ${possessionHome}% vs ${100 - possessionHome}%`,
          ],
          tipo: "over",
          urgencia: confianca > 80 ? "alta" : "media",
        });
      }
    }
  }

  // ── OVER 1.5 FT ──────────────────────────────────────────────────────────
  if (elapsed >= 30 && elapsed <= 75 && totalGoals <= 1) {
    const pressao = shotsOnGoalHome + shotsOnGoalAway;
    if (pressao >= 6 || (totalGoals === 1 && pressao >= 3)) {
      const oddOver = getOdd("over", "1.5") || 1.8;
      const confianca = Math.min(90, 45 + pressao * 3 + totalGoals * 10);
      const ev = calcEV(confianca / 100, oddOver);
      if (ev > 0) {
        oportunidades.push({
          mercado: "Acima 1.5 Gols (FT)",
          odd: oddOver,
          ev,
          confianca,
          motivos: [
            `${pressao} chutes no gol`,
            `Placar atual: ${goalsHome}-${goalsAway}`,
            `${totalShotsHome + totalShotsAway} chutes totais`,
            prediction ? `Conselho: ${prediction.predictions.advice}` : "Alta pressão ofensiva",
          ],
          tipo: "over",
          urgencia: confianca > 75 ? "alta" : "media",
        });
      }
    }
  }

  // ── OVER 2.5 FT ──────────────────────────────────────────────────────────
  if (elapsed >= 45 && elapsed <= 70 && totalGoals >= 2) {
    const oddOver = getOdd("over", "2.5") || 2.1;
    const confianca = Math.min(88, 50 + totalGoals * 12 + (shotsOnGoalHome + shotsOnGoalAway) * 2);
    const ev = calcEV(confianca / 100, oddOver);
    if (ev > 0) {
      oportunidades.push({
          mercado: "Acima 2.5 Gols (FT)",
        odd: oddOver,
        ev,
        confianca,
        motivos: [
          `Já ${totalGoals} gols marcados`,
          `${shotsOnGoalHome + shotsOnGoalAway} chutes no gol`,
          "Jogo aberto com alta taxa de gols",
            prediction ? `Tendência: ${prediction.predictions.under_over}` : "Tendência de gols",
        ],
        tipo: "over",
        urgencia: "alta",
      });
    }
  }

  // ── BTTS (Ambas Marcam) ───────────────────────────────────────────────────
  if (elapsed >= 30 && elapsed <= 75 && (goalsHome === 0 || goalsAway === 0)) {
    if (shotsOnGoalHome >= 2 && shotsOnGoalAway >= 2) {
      const oddBTTS = getOdd("btts", "yes") || getOdd("both teams", "yes") || 1.9;
      const confianca = Math.min(85, 40 + shotsOnGoalHome * 5 + shotsOnGoalAway * 5);
      const ev = calcEV(confianca / 100, oddBTTS);
      if (ev > 0) {
        oportunidades.push({
          mercado: "Ambas Marcam — Sim",
          odd: oddBTTS,
          ev,
          confianca,
          motivos: [
            `Casa: ${shotsOnGoalHome} chutes no gol`,
            `Fora: ${shotsOnGoalAway} chutes no gol`,
            `Time sem gol ainda: ${goalsHome === 0 ? fixture.teams.home.name : fixture.teams.away.name}`,
            prediction ? `Gols casa: ${prediction.predictions.goals.home} | fora: ${prediction.predictions.goals.away}` : "Ambos atacando",
          ],
          tipo: "btts",
          urgencia: confianca > 70 ? "media" : "baixa",
        });
      }
    }
  }

  // ── GOLEADA DETECTADA ─────────────────────────────────────────────────────
  if (elapsed >= 20 && elapsed <= 65) {
    const dominancia = Math.abs(shotsOnGoalHome - shotsOnGoalAway);
    const dominanciaTotal = Math.abs(totalShotsHome - totalShotsAway);
    if (dominancia >= 4 || dominanciaTotal >= 8) {
      const timeForte = shotsOnGoalHome > shotsOnGoalAway ? "casa" : "fora";
      const oddGoleada = getOdd("over", "3.5") || 3.2;
      const confianca = Math.min(82, 35 + dominancia * 6 + (totalGoals >= 1 ? 15 : 0));
      const ev = calcEV(confianca / 100, oddGoleada);
      if (ev > 0) {
        oportunidades.push({
          mercado: "Acima 3.5 Gols (Goleada)",
          odd: oddGoleada,
          ev,
          confianca,
          motivos: [
            `Time da ${timeForte} domina: ${Math.max(shotsOnGoalHome, shotsOnGoalAway)} vs ${Math.min(shotsOnGoalHome, shotsOnGoalAway)} chutes no gol`,
            `Dominância total: ${dominanciaTotal} chutes a mais`,
            `Placar: ${goalsHome}-${goalsAway}`,
            "Desequilíbrio técnico evidente",
          ],
          tipo: "over",
          urgencia: confianca > 70 ? "alta" : "media",
        });
      }
    }
  }

  // ── ESCANTEIOS ────────────────────────────────────────────────────────────
  if (elapsed >= 30 && elapsed <= 80 && totalCorners >= 5) {
    const ritmoEscanteios = (totalCorners / elapsed) * 90;
    if (ritmoEscanteios >= 9) {
      const oddCorners = getOdd("corner", "over") || 1.85;
      const confianca = Math.min(88, 50 + totalCorners * 4);
      const ev = calcEV(confianca / 100, oddCorners);
      if (ev > 0) {
        oportunidades.push({
          mercado: `Acima ${Math.floor(ritmoEscanteios) - 1}.5 Escanteios`,
          odd: oddCorners,
          ev,
          confianca,
          motivos: [
            `${totalCorners} escanteios em ${elapsed} minutos`,
            `Ritmo projetado: ${ritmoEscanteios.toFixed(1)} escanteios/jogo`,
            `Casa: ${cornersHome} | Fora: ${cornersAway}`,
            "Alta pressão nas laterais",
          ],
          tipo: "escanteio",
          urgencia: "media",
        });
      }
    }
  }

  // ── CARTÕES ───────────────────────────────────────────────────────────────
  if (elapsed >= 20 && totalFouls >= 15 && totalYellow >= 2) {
    const ritmoCartoes = (totalYellow / elapsed) * 90;
    if (ritmoCartoes >= 4) {
      const oddCards = getOdd("card", "over") || 1.75;
      const confianca = Math.min(85, 40 + totalYellow * 8 + (totalFouls > 20 ? 10 : 0));
      const ev = calcEV(confianca / 100, oddCards);
      if (ev > 0) {
        oportunidades.push({
          mercado: `Acima ${totalYellow + 1}.5 Cartões`,
          odd: oddCards,
          ev,
          confianca,
          motivos: [
            `${totalYellow} cartões amarelos até agora`,
            `${totalFouls} faltas cometidas`,
            `Ritmo: ${ritmoCartoes.toFixed(1)} cartões/jogo`,
            "Jogo físico e disputado",
          ],
          tipo: "cartao",
          urgencia: totalYellow >= 4 ? "alta" : "media",
        });
      }
    }
  }

  // ── RESULTADO (usando predições da API) ───────────────────────────────────
  if (prediction && elapsed >= 30 && elapsed <= 70) {
    const pred = prediction.predictions;
    const homePercent = parseFloat(pred.percent.home.replace("%", ""));
    const awayPercent = parseFloat(pred.percent.away.replace("%", ""));

    if (homePercent >= 65) {
      const oddHome = getOdd("match winner", "home") || getOdd("1x2", "home") || 1.6;
      const confianca = Math.min(90, homePercent);
      const ev = calcEV(confianca / 100, oddHome);
      if (ev > 0 && oddHome > 1.2) {
        oportunidades.push({
          mercado: `Vitória ${fixture.teams.home.name}`,
          odd: oddHome,
          ev,
          confianca,
          motivos: [
            `Predição: ${pred.percent.home} de chance`,
            `Forma: ${prediction.teams.home.last_5.form}`,
            pred.advice,
            `Comparação: ${prediction.comparison.total.home} vs ${prediction.comparison.total.away}`,
          ],
          tipo: "resultado",
          urgencia: homePercent > 75 ? "alta" : "media",
        });
      }
    } else if (awayPercent >= 65) {
      const oddAway = getOdd("match winner", "away") || getOdd("1x2", "away") || 1.8;
      const confianca = Math.min(90, awayPercent);
      const ev = calcEV(confianca / 100, oddAway);
      if (ev > 0 && oddAway > 1.2) {
        oportunidades.push({
          mercado: `Vitória ${fixture.teams.away.name}`,
          odd: oddAway,
          ev,
          confianca,
          motivos: [
            `Predição: ${pred.percent.away} de chance`,
            `Forma: ${prediction.teams.away.last_5.form}`,
            pred.advice,
            `Comparação: ${prediction.comparison.total.away} vs ${prediction.comparison.total.home}`,
          ],
          tipo: "resultado",
          urgencia: awayPercent > 75 ? "alta" : "media",
        });
      }
    }
  }

  // Ordenar por EV decrescente
  return oportunidades.sort((a, b) => b.ev - a.ev);
}

/** Calcula Expected Value dado probabilidade e odd */
function calcEV(prob: number, odd: number): number {
  if (odd <= 1) return -100;
  const ev = prob * (odd - 1) - (1 - prob);
  return Math.round(ev * 1000) / 10; // retorna em %
}

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════

/** Limpa todo o cache */
export function clearCache(): void {
  cache.clear();
}

/** Estatísticas do cache */
export function getCacheStats(): { size: number; keys: string[] } {
  return { size: cache.size, keys: Array.from(cache.keys()) };
}

/** Retorna o status do bloqueio horário */
export function getBlockStatus(): { blocked: boolean; brasiliaHour: number } {
  const now = new Date();
  const brasiliaHour = (now.getUTCHours() - 3 + 24) % 24;
  return { blocked: isBlockedHour(), brasiliaHour };
}

// ─── Calcular Score de Calor (termômetro) ────────────────────────────────────
/**
 * Calcula o score de calor de um jogo ao vivo (0–100)
 * Usado pelo cronService para salvar no histórico automaticamente
 */
export function calcularScoreCalor(
  fixture: LiveFixture,
  stats: TeamStatistics[]
): { score: number; nivel: string } {
  let score = 0;
  const elapsed = fixture.fixture.status.elapsed || 0;
  const goalsHome = fixture.goals.home || 0;
  const goalsAway = fixture.goals.away || 0;
  const totalGoals = goalsHome + goalsAway;

  const getStat = (teamStats: FixtureStatistic[], type: string): number => {
    const s = teamStats.find((x) => x.type === type);
    if (!s || s.value === null) return 0;
    if (typeof s.value === "string") return parseFloat(s.value.replace("%", "")) || 0;
    return typeof s.value === "number" ? s.value : 0;
  };

  const statsHome = stats[0]?.statistics || [];
  const statsAway = stats[1]?.statistics || [];

  const shotsOnHome = getStat(statsHome, "Shots on Goal");
  const shotsOnAway = getStat(statsAway, "Shots on Goal");
  const shotsTotal = getStat(statsHome, "Total Shots") + getStat(statsAway, "Total Shots");
  const cornersHome = getStat(statsHome, "Corner Kicks");
  const cornersAway = getStat(statsAway, "Corner Kicks");
  const totalCorners = cornersHome + cornersAway;
  const dangerousAttHome = getStat(statsHome, "Dangerous Attacks");
  const dangerousAttAway = getStat(statsAway, "Dangerous Attacks");
  const totalDangerous = dangerousAttHome + dangerousAttAway;

  // Gols recentes (últimos 15 min)
  const golsRecentes = fixture.events?.filter(
    (e) => e.type === "Goal" && e.time.elapsed >= elapsed - 15
  ).length || 0;

  // Pontuação por fator
  if (elapsed >= 75) score += 15; // Reta final
  else if (elapsed >= 60) score += 10;
  else if (elapsed >= 45) score += 5;

  score += Math.min(totalGoals * 12, 20); // Gols já marcados
  score += Math.min(golsRecentes * 15, 20); // Gols recentes
  score += Math.min((shotsOnHome + shotsOnAway) * 2, 15); // Chutes a gol
  score += Math.min(shotsTotal * 0.5, 8); // Chutes totais
  score += Math.min(totalCorners * 1.5, 10); // Escanteios
  score += Math.min(totalDangerous * 0.1, 8); // Ataques perigosos

  // Empate na reta final = mais quente
  if (elapsed >= 70 && goalsHome === goalsAway) score += 10;

  score = Math.min(Math.round(score), 100);

  const nivel = score >= 75 ? "Vulcão" : score >= 50 ? "Quente" : score >= 25 ? "Morno" : "Gelado";
  return { score, nivel };
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESTAQUES DO DIA — Rankings e Estatísticas
// ═══════════════════════════════════════════════════════════════════════════

export interface DestaquesTime {
  teamId: number;
  teamName: string;
  teamLogo: string;
  leagueName: string;
  leagueLogo: string;
  countryFlag: string;
  countryName: string;
  fixtureId: number;
  opponent: string;
  opponentLogo: string;
  matchTime: string;
  placar?: string;
  status?: string;
  minuto?: number;
  mediaGols: number;
  mediaEscanteios: number;
  mediaChutes: number;
  mediaChutesGol: number;
  mediaCartoes: number;
  forma: string;
  sequencia: string[];
  indicador: number;
  tipo: "escanteios" | "gols" | "chutes" | "cartoes" | "chutes_gol";
}

export interface DestaquesJogador {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  teamName: string;
  teamLogo: string;
  leagueName: string;
  countryFlag: string;
  fixtureId: number;
  matchTime: string;
  opponent: string;
  mediaGols: number;
  mediaAssistencias: number;
  mediaChutesGol: number;
  mediaCartoes: number;
  totalGols: number;
  totalCartoes: number;
  sequenciaGols: number[];
  tipo: "artilheiro" | "indisciplinado" | "assistencias";
  indicador: number;
}

export interface DestaquesPartida {
  fixtureId: number;
  homeTeam: string;
  homeTeamLogo: string;
  awayTeam: string;
  awayTeamLogo: string;
  leagueName: string;
  leagueLogo: string;
  countryFlag: string;
  matchTime: string;
  mercado: string;
  palpite: string;
  confianca: "Alta" | "Media" | "Baixa";
  odd?: number;
  motivo: string;
}

/** Busca dados de destaques do dia: rankings de times e jogadores */
export async function getDestaquesHoje(date?: string): Promise<{
  timesEscanteios: DestaquesTime[];
  timesGols: DestaquesTime[];
  timesChutes: DestaquesTime[];
  timesCartoes: DestaquesTime[];
  jogadoresArtilheiros: DestaquesJogador[];
  jogadoresIndisciplinados: DestaquesJogador[];
  palpitesBTTS: DestaquesPartida[];
  palpitesEscanteios: DestaquesPartida[];
  palpitesGols: DestaquesPartida[];
  totalJogos: number;
  totalLigas: number;
}> {
  const cacheKey = `destaques_hoje_${date ?? "today"}`;
  type DestaquesResult = {
    timesEscanteios: DestaquesTime[];
    timesGols: DestaquesTime[];
    timesChutes: DestaquesTime[];
    timesCartoes: DestaquesTime[];
    jogadoresArtilheiros: DestaquesJogador[];
    jogadoresIndisciplinados: DestaquesJogador[];
    palpitesBTTS: DestaquesPartida[];
    palpitesEscanteios: DestaquesPartida[];
    palpitesGols: DestaquesPartida[];
    totalJogos: number;
    totalLigas: number;
  };
  const cached = getCached<DestaquesResult>(cacheKey);
  if (cached) return cached;

  const fixtures = await getTodayFixtures(date);
  if (!fixtures.length) {
    return {
      timesEscanteios: [], timesGols: [], timesChutes: [], timesCartoes: [],
      jogadoresArtilheiros: [], jogadoresIndisciplinados: [],
      palpitesBTTS: [], palpitesEscanteios: [], palpitesGols: [],
      totalJogos: 0, totalLigas: 0,
    };
  }

  const timesEscanteiosMap = new Map<number, DestaquesTime>();
  const timesGolsMap = new Map<number, DestaquesTime>();
  const timesChutesMap = new Map<number, DestaquesTime>();
  const timesCartoesMap = new Map<number, DestaquesTime>();
  const jogadoresMap = new Map<number, DestaquesJogador>();
  const palpitesBTTS: DestaquesPartida[] = [];
  const palpitesEscanteios: DestaquesPartida[] = [];
  const palpitesGols: DestaquesPartida[] = [];

  // Processar apenas jogos que já começaram (com estatísticas disponíveis)
  const fixturesToProcess = fixtures
    .filter(f => f.fixture.status.short !== "NS" && f.fixture.status.short !== "TBD")
    .slice(0, 25);

  for (const fixture of fixturesToProcess) {
    const fixtureId = fixture.fixture.id;
    const homeTeam = fixture.teams.home;
    const awayTeam = fixture.teams.away;
    const league = fixture.league;
    const matchTime = new Date(fixture.fixture.date).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
    });
    const countryFlag = league.flag || "";
    const placar = `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`;

    let stats: TeamStatistics[] = [];
    try {
      stats = await getFixtureStatistics(fixtureId);
    } catch { /* sem stats */ }

    let players: Array<{ team: Team; players: PlayerFixtureStats[] }> = [];
    try {
      players = await getFixturePlayers(fixtureId);
    } catch { /* sem jogadores */ }

    const getStat = (teamStats: FixtureStatistic[], type: string): number => {
      const s = teamStats.find(x => x.type === type);
      if (!s || s.value === null) return 0;
      if (typeof s.value === "string") return parseFloat(s.value.replace("%", "")) || 0;
      return typeof s.value === "number" ? s.value : 0;
    };

    for (const teamStats of stats) {
      const team = teamStats.team;
      const opponent = team.id === homeTeam.id ? awayTeam : homeTeam;
      const escanteios = getStat(teamStats.statistics, "Corner Kicks");
      const gols = (team.id === homeTeam.id ? fixture.goals.home : fixture.goals.away) || 0;
      const chutesTotais = getStat(teamStats.statistics, "Total Shots");
      const chutesGol = getStat(teamStats.statistics, "Shots on Goal");
      const cartoesAmarelos = getStat(teamStats.statistics, "Yellow Cards");
      const cartoesVermelhos = getStat(teamStats.statistics, "Red Cards");
      const totalCartoes = cartoesAmarelos + cartoesVermelhos;

      const base = {
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logo,
        leagueName: league.name,
        leagueLogo: league.logo,
        countryFlag,
        countryName: league.country,
        fixtureId,
        opponent: opponent.name,
        opponentLogo: opponent.logo,
        matchTime,
        placar,
        status: fixture.fixture.status.long,
        minuto: fixture.fixture.status.elapsed || undefined,
        mediaGols: gols,
        mediaEscanteios: escanteios,
        mediaChutes: chutesTotais,
        mediaChutesGol: chutesGol,
        mediaCartoes: totalCartoes,
        forma: fixture.teams.home.winner === true ? "V" : fixture.teams.home.winner === false ? "D" : "E",
        sequencia: ["V", "V", "D", "E", "V"],
      };

      if (escanteios > 0) {
        const existing = timesEscanteiosMap.get(team.id);
        if (!existing || escanteios > existing.indicador) {
          timesEscanteiosMap.set(team.id, { ...base, indicador: escanteios, tipo: "escanteios" });
        }
      }
      if (gols > 0) {
        const existing = timesGolsMap.get(team.id);
        if (!existing || gols > existing.indicador) {
          timesGolsMap.set(team.id, { ...base, indicador: gols, tipo: "gols" });
        }
      }
      if (chutesTotais > 0) {
        const existing = timesChutesMap.get(team.id);
        if (!existing || chutesTotais > existing.indicador) {
          timesChutesMap.set(team.id, { ...base, indicador: chutesTotais, tipo: "chutes" });
        }
      }
      if (totalCartoes > 0) {
        const existing = timesCartoesMap.get(team.id);
        if (!existing || totalCartoes > existing.indicador) {
          timesCartoesMap.set(team.id, { ...base, indicador: totalCartoes, tipo: "cartoes" });
        }
      }
    }

    // Processar jogadores
    for (const teamData of players) {
      for (const playerData of teamData.players) {
        const player = playerData.player;
        const stat = playerData.statistics[0];
        if (!stat) continue;

        const gols = stat.goals.total || 0;
        const assistencias = stat.goals.assists || 0;
        const chutesGol = stat.shots.on || 0;
        const cartoesAmarelos = stat.cards.yellow || 0;
        const cartoesVermelhos = stat.cards.red || 0;
        const totalCartoes = cartoesAmarelos + cartoesVermelhos;

        if (gols > 0 || assistencias > 0) {
          const indicador = gols + assistencias * 0.5;
          const existing = jogadoresMap.get(player.id);
          if (!existing || indicador > existing.indicador) {
            jogadoresMap.set(player.id, {
              playerId: player.id,
              playerName: player.name,
              playerPhoto: player.photo,
              teamName: teamData.team.name,
              teamLogo: teamData.team.logo,
              leagueName: league.name,
              countryFlag,
              fixtureId,
              matchTime,
              opponent: teamData.team.id === homeTeam.id ? awayTeam.name : homeTeam.name,
              mediaGols: gols,
              mediaAssistencias: assistencias,
              mediaChutesGol: chutesGol,
              mediaCartoes: totalCartoes,
              totalGols: gols,
              totalCartoes,
              sequenciaGols: [gols],
              tipo: gols > 0 ? "artilheiro" : "assistencias",
              indicador,
            });
          }
        }

        if (totalCartoes > 0) {
          const key = player.id * -1;
          const existing = jogadoresMap.get(key);
          if (!existing || totalCartoes > existing.indicador) {
            jogadoresMap.set(key, {
              playerId: player.id,
              playerName: player.name,
              playerPhoto: player.photo,
              teamName: teamData.team.name,
              teamLogo: teamData.team.logo,
              leagueName: league.name,
              countryFlag,
              fixtureId,
              matchTime,
              opponent: teamData.team.id === homeTeam.id ? awayTeam.name : homeTeam.name,
              mediaGols: gols,
              mediaAssistencias: assistencias,
              mediaChutesGol: chutesGol,
              mediaCartoes: totalCartoes,
              totalGols: gols,
              totalCartoes,
              sequenciaGols: [gols],
              tipo: "indisciplinado",
              indicador: totalCartoes,
            });
          }
        }
      }
    }

    // Palpites automáticos
    if (stats.length >= 2) {
      const getStat0 = (type: string) => getStat(stats[0].statistics, type);
      const getStat1 = (type: string) => getStat(stats[1].statistics, type);
      const totalEscanteios = getStat0("Corner Kicks") + getStat1("Corner Kicks");
      const totalChutes = getStat0("Total Shots") + getStat1("Total Shots");
      const totalGols = (fixture.goals.home || 0) + (fixture.goals.away || 0);
      const ambosGolaram = (fixture.goals.home || 0) > 0 && (fixture.goals.away || 0) > 0;

      if (ambosGolaram && palpitesBTTS.length < 8) {
        palpitesBTTS.push({
          fixtureId,
          homeTeam: homeTeam.name,
          homeTeamLogo: homeTeam.logo,
          awayTeam: awayTeam.name,
          awayTeamLogo: awayTeam.logo,
          leagueName: league.name,
          leagueLogo: league.logo,
          countryFlag,
          matchTime,
          mercado: "Ambas Marcam",
          palpite: "Sim",
          confianca: "Alta",
          motivo: `Ambos já marcaram (${fixture.goals.home}-${fixture.goals.away})`,
        });
      }
      if (totalEscanteios >= 6 && palpitesEscanteios.length < 8) {
        palpitesEscanteios.push({
          fixtureId,
          homeTeam: homeTeam.name,
          homeTeamLogo: homeTeam.logo,
          awayTeam: awayTeam.name,
          awayTeamLogo: awayTeam.logo,
          leagueName: league.name,
          leagueLogo: league.logo,
          countryFlag,
          matchTime,
          mercado: "Escanteios",
          palpite: `Over ${totalEscanteios >= 8 ? "7.5" : "5.5"} Escanteios`,
          confianca: totalEscanteios >= 10 ? "Alta" : "Media",
          motivo: `${totalEscanteios} escanteios até o momento`,
        });
      }
      if (totalGols >= 2 && palpitesGols.length < 8) {
        palpitesGols.push({
          fixtureId,
          homeTeam: homeTeam.name,
          homeTeamLogo: homeTeam.logo,
          awayTeam: awayTeam.name,
          awayTeamLogo: awayTeam.logo,
          leagueName: league.name,
          leagueLogo: league.logo,
          countryFlag,
          matchTime,
          mercado: "Gols",
          palpite: `Over ${totalGols >= 3 ? "2.5" : "1.5"} Gols`,
          confianca: totalGols >= 3 ? "Alta" : "Media",
          motivo: `${totalGols} gols marcados, ${totalChutes} chutes totais`,
        });
      }
    }
  }

  const sortByIndicador = (arr: DestaquesTime[]) =>
    arr.sort((a, b) => b.indicador - a.indicador).slice(0, 10);

  const result: DestaquesResult = {
    timesEscanteios: sortByIndicador(Array.from(timesEscanteiosMap.values())),
    timesGols: sortByIndicador(Array.from(timesGolsMap.values())),
    timesChutes: sortByIndicador(Array.from(timesChutesMap.values())),
    timesCartoes: sortByIndicador(Array.from(timesCartoesMap.values())),
    jogadoresArtilheiros: Array.from(jogadoresMap.values())
      .filter(j => j.tipo === "artilheiro" || j.tipo === "assistencias")
      .sort((a, b) => b.indicador - a.indicador)
      .slice(0, 10),
    jogadoresIndisciplinados: Array.from(jogadoresMap.values())
      .filter(j => j.tipo === "indisciplinado")
      .sort((a, b) => b.indicador - a.indicador)
      .slice(0, 10),
    palpitesBTTS,
    palpitesEscanteios,
    palpitesGols,
    totalJogos: fixtures.length,
    totalLigas: new Set(fixtures.map(f => f.league.id)).size,
  };

  setCached(cacheKey, result, 5 * 60 * 1000);
  return result;
}
