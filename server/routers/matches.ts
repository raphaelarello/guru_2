import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

const API_KEY = process.env.API_FOOTBALL_KEY || "ced3480ee75012136a1f2923619c8ef3";
const API_BASE = "https://v3.football.api-sports.io";

interface Match {
  id: number;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
  status: string;
  statusShort: string;
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    timezone: string;
    week: number | null;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
  };
  events?: Array<{
    time: {
      elapsed: number;
      extra: number | null;
    };
    team: {
      id: number;
      name: string;
      logo: string;
    };
    player: {
      id: number;
      name: string;
    };
    assist: {
      id: number | null;
      name: string | null;
    } | null;
    type: string;
    detail: string;
    comments: string | null;
  }>;
  statistics?: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    statistics: Array<{
      type: string;
      value: number | string | null;
    }>;
  }>;
}

async function fetchFromAPI(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "x-apisports-key": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error("API Football error:", error);
    return [];
  }
}

export const matchesRouter = router({
  // Obter jogos de um dia específico
  getByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const matches = await fetchFromAPI(`/fixtures?date=${input.date}`);
      return matches.map((match: Match) => ({
        id: match.fixture.id,
        league: {
          id: match.league.id,
          name: match.league.name,
          logo: match.league.logo,
        },
        homeTeam: {
          id: match.teams.home.id,
          name: match.teams.home.name,
          logo: match.teams.home.logo,
        },
        awayTeam: {
          id: match.teams.away.id,
          name: match.teams.away.name,
          logo: match.teams.away.logo,
        },
        homeScore: match.goals.home,
        awayScore: match.goals.away,
        status: match.fixture.status.short,
        minute: match.fixture.status.elapsed || 0,
        stadium: match.fixture.venue?.name || "Estádio desconhecido",
        startTime: match.fixture.date,
        events: match.events || [],
      }));
    }),

  // Obter detalhes de um jogo específico
  getDetails: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      const matches = await fetchFromAPI(`/fixtures?id=${input.fixtureId}`);
      if (matches.length === 0) return null;

      const match = matches[0] as Match;
      const events = match.events || [];
      const statistics = match.statistics || [];

      return {
        id: match.fixture.id,
        league: {
          id: match.league.id,
          name: match.league.name,
          logo: match.league.logo,
        },
        homeTeam: {
          id: match.teams.home.id,
          name: match.teams.home.name,
          logo: match.teams.home.logo,
        },
        awayTeam: {
          id: match.teams.away.id,
          name: match.teams.away.name,
          logo: match.teams.away.logo,
        },
        homeScore: match.goals.home,
        awayScore: match.goals.away,
        status: match.fixture.status.short,
        minute: match.fixture.status.elapsed || 0,
        stadium: match.fixture.venue?.name || "Estádio desconhecido",
        startTime: match.fixture.date,
        events: events.map((event) => ({
          minute: event.time.elapsed,
          team: event.team.name,
          player: event.player.name,
          type: event.type,
          detail: event.detail,
        })),
        statistics: statistics.map((stat) => ({
          team: stat.team.name,
          stats: stat.statistics.map((s) => ({
            type: s.type,
            value: s.value,
          })),
        })),
      };
    }),

  // Obter jogos ao vivo
  getLive: publicProcedure.query(async () => {
    const matches = await fetchFromAPI("/fixtures?live=all");
    return matches.map((match: Match) => ({
      id: match.fixture.id,
      league: {
        id: match.league.id,
        name: match.league.name,
        logo: match.league.logo,
      },
      homeTeam: {
        id: match.teams.home.id,
        name: match.teams.home.name,
        logo: match.teams.home.logo,
      },
      awayTeam: {
        id: match.teams.away.id,
        name: match.teams.away.name,
        logo: match.teams.away.logo,
      },
      homeScore: match.goals.home,
      awayScore: match.goals.away,
      status: match.fixture.status.short,
      minute: match.fixture.status.elapsed || 0,
      stadium: match.fixture.venue?.name || "Estádio desconhecido",
      startTime: match.fixture.date,
    }));
  }),

  // Obter jogos por liga
  getByLeague: publicProcedure
    .input(z.object({ leagueId: z.number(), season: z.number() }))
    .query(async ({ input }) => {
      const matches = await fetchFromAPI(
        `/fixtures?league=${input.leagueId}&season=${input.season}`
      );
      return matches.map((match: Match) => ({
        id: match.fixture.id,
        league: {
          id: match.league.id,
          name: match.league.name,
          logo: match.league.logo,
        },
        homeTeam: {
          id: match.teams.home.id,
          name: match.teams.home.name,
          logo: match.teams.home.logo,
        },
        awayTeam: {
          id: match.teams.away.id,
          name: match.teams.away.name,
          logo: match.teams.away.logo,
        },
        homeScore: match.goals.home,
        awayScore: match.goals.away,
        status: match.fixture.status.short,
        minute: match.fixture.status.elapsed || 0,
        stadium: match.fixture.venue?.name || "Estádio desconhecido",
        startTime: match.fixture.date,
      }));
    }),
});
