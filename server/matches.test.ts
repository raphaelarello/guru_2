import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchesRouter } from "./routers/matches";

// Mock fetch
global.fetch = vi.fn();

describe("Matches Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch matches by date", async () => {
    const mockData = {
      response: [
        {
          fixture: {
            id: 1,
            date: "2026-03-25T15:00:00Z",
            status: { short: "1H", elapsed: 45 },
            venue: { name: "Etihad Stadium" },
          },
          league: { id: 39, name: "Premier League", logo: "https://logo.png" },
          teams: {
            home: { id: 50, name: "Manchester City", logo: "https://mci.png" },
            away: { id: 17, name: "Liverpool", logo: "https://liv.png" },
          },
          goals: { home: 2, away: 1 },
          events: [],
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await matchesRouter.createCaller({} as any).getByDate({ date: "2026-03-25" });

    expect(result).toHaveLength(1);
    expect(result[0].homeTeam.name).toBe("Manchester City");
    expect(result[0].awayTeam.name).toBe("Liverpool");
    expect(result[0].homeScore).toBe(2);
    expect(result[0].awayScore).toBe(1);
  });

  it("should get live matches", async () => {
    const mockData = {
      response: [
        {
          fixture: {
            id: 1,
            date: "2026-03-25T15:00:00Z",
            status: { short: "1H", elapsed: 45 },
            venue: { name: "Etihad Stadium" },
          },
          league: { id: 39, name: "Premier League", logo: "https://logo.png" },
          teams: {
            home: { id: 50, name: "Manchester City", logo: "https://mci.png" },
            away: { id: 17, name: "Liverpool", logo: "https://liv.png" },
          },
          goals: { home: 2, away: 1 },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await matchesRouter.createCaller({} as any).getLive();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("1H");
    expect(result[0].minute).toBe(45);
  });

  it("should handle API errors gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const result = await matchesRouter.createCaller({} as any).getByDate({ date: "2026-03-25" });

    expect(result).toEqual([]);
  });

  it("should get match details with events", async () => {
    const mockData = {
      response: [
        {
          fixture: {
            id: 1,
            date: "2026-03-25T15:00:00Z",
            status: { short: "1H", elapsed: 45 },
            venue: { name: "Etihad Stadium" },
          },
          league: { id: 39, name: "Premier League", logo: "https://logo.png" },
          teams: {
            home: { id: 50, name: "Manchester City", logo: "https://mci.png" },
            away: { id: 17, name: "Liverpool", logo: "https://liv.png" },
          },
          goals: { home: 2, away: 1 },
          events: [
            {
              time: { elapsed: 12 },
              team: { name: "Manchester City", logo: "https://mci.png" },
              player: { name: "Haaland" },
              type: "Goal",
              detail: "Normal Goal",
            },
          ],
          statistics: [
            {
              team: { name: "Manchester City", logo: "https://mci.png" },
              statistics: [
                { type: "Possession", value: 65 },
                { type: "Shots", value: 12 },
              ],
            },
          ],
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await matchesRouter.createCaller({} as any).getDetails({ fixtureId: 1 });

    expect(result).not.toBeNull();
    expect(result?.events).toHaveLength(1);
    expect(result?.events[0].player).toBe("Haaland");
    expect(result?.statistics).toHaveLength(1);
  });
});
