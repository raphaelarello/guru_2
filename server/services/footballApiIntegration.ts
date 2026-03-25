import { invokeLLM } from "../_core/llm";

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "ced3480ee75012136a1f2923619c8ef3";
const API_FOOTBALL_URL = "https://v3.football.api-sports.io";

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed?: number;
    };
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
}

interface LiveFixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  minute: number | null;
  status: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  leagueName: string;
  leagueFlag: string;
  timestamp: number;
}

// Cache de requisições para evitar exceder limite de 7500/dia
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let dailyRequestCount = 0;
const DAILY_LIMIT = 7500;
const QUIET_HOURS_START = 1; // 1h
const QUIET_HOURS_END = 7; // 7h

function isQuietHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END;
}

function canMakeRequest(): boolean {
  if (isQuietHours()) {
    console.log("[API Football] Fora do horário permitido (1h-7h). Usando cache.");
    return false;
  }
  if (dailyRequestCount >= DAILY_LIMIT) {
    console.log("[API Football] Limite diário atingido. Usando cache.");
    return false;
  }
  return true;
}

async function makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;

  // Verificar cache
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[API Football] Cache hit: ${cacheKey}`);
    return cached.data;
  }

  // Se não pode fazer requisição, retornar cache antigo ou null
  if (!canMakeRequest()) {
    if (cached) {
      console.log(`[API Football] Usando cache antigo: ${cacheKey}`);
      return cached.data;
    }
    console.log(`[API Football] Sem cache disponível: ${cacheKey}`);
    return null;
  }

  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_FOOTBALL_URL}${endpoint}?${queryString}`;

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_FOOTBALL_KEY,
      },
    });

    dailyRequestCount++;
    console.log(`[API Football] Requisição ${dailyRequestCount}/${DAILY_LIMIT}: ${endpoint}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Armazenar em cache
    requestCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error(`[API Football] Erro ao buscar ${endpoint}:`, error);

    // Retornar cache antigo em caso de erro
    if (cached) {
      console.log(`[API Football] Usando cache antigo após erro: ${cacheKey}`);
      return cached.data;
    }

    return null;
  }
}

export async function getLiveFixtures(): Promise<LiveFixture[]> {
  try {
    const response = await makeRequest("/fixtures", { live: "all" });

    if (!response?.response) {
      console.log("[API Football] Nenhum jogo ao vivo encontrado");
      return [];
    }

    const fixtures: LiveFixture[] = response.response.map((fixture: Fixture) => ({
      id: fixture.fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeGoals: fixture.goals.home,
      awayGoals: fixture.goals.away,
      minute: fixture.fixture.status.elapsed || 0,
      status: fixture.fixture.status.short,
      homeTeamLogo: fixture.teams.home.logo,
      awayTeamLogo: fixture.teams.away.logo,
      leagueName: fixture.league.name,
      leagueFlag: fixture.league.flag,
      timestamp: Date.now(),
    }));

    console.log(`[API Football] ${fixtures.length} jogos ao vivo encontrados`);
    return fixtures;
  } catch (error) {
    console.error("[API Football] Erro ao buscar jogos ao vivo:", error);
    return [];
  }
}

export async function getFixtureById(fixtureId: number): Promise<Fixture | null> {
  try {
    const response = await makeRequest("/fixtures", { id: fixtureId });

    if (!response?.response || response.response.length === 0) {
      return null;
    }

    return response.response[0];
  } catch (error) {
    console.error(`[API Football] Erro ao buscar fixture ${fixtureId}:`, error);
    return null;
  }
}

export async function getTeamStatistics(teamId: number, season: number): Promise<any> {
  try {
    const response = await makeRequest("/teams/statistics", { team: teamId, season });
    return response?.response || null;
  } catch (error) {
    console.error(`[API Football] Erro ao buscar estatísticas do time ${teamId}:`, error);
    return null;
  }
}

export async function getPlayerStatistics(playerId: number, season: number): Promise<any> {
  try {
    const response = await makeRequest("/players", { id: playerId, season });
    return response?.response || null;
  } catch (error) {
    console.error(`[API Football] Erro ao buscar estatísticas do jogador ${playerId}:`, error);
    return null;
  }
}

export async function getTopScorers(leagueId: number, season: number): Promise<any[]> {
  try {
    const response = await makeRequest("/players/topscorers", { league: leagueId, season });
    return response?.response || [];
  } catch (error) {
    console.error(`[API Football] Erro ao buscar artilheiros da liga ${leagueId}:`, error);
    return [];
  }
}

export async function getLeagueStandings(leagueId: number, season: number): Promise<any> {
  try {
    const response = await makeRequest("/standings", { league: leagueId, season });
    return response?.response || null;
  } catch (error) {
    console.error(`[API Football] Erro ao buscar classificação da liga ${leagueId}:`, error);
    return null;
  }
}

export function getRequestStats(): {
  dailyRequestCount: number;
  dailyLimit: number;
  remainingRequests: number;
  percentageUsed: number;
  isQuietHours: boolean;
} {
  return {
    dailyRequestCount,
    dailyLimit: DAILY_LIMIT,
    remainingRequests: DAILY_LIMIT - dailyRequestCount,
    percentageUsed: Math.round((dailyRequestCount / DAILY_LIMIT) * 100),
    isQuietHours: isQuietHours(),
  };
}

export function resetDailyCount(): void {
  dailyRequestCount = 0;
  console.log("[API Football] Contador diário resetado");
}

export function clearCache(): void {
  requestCache.clear();
  console.log("[API Football] Cache limpo");
}
