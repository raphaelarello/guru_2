
export type OddsWebhookPayload = {
  matchId: string;
  source?: string;
  provider?: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  homeOdds?: number | null;
  drawOdds?: number | null;
  awayOdds?: number | null;
  over25Odds?: number | null;
  under25Odds?: number | null;
  over85CornersOdds?: number | null;
  over35CardsOdds?: number | null;
  raw?: unknown;
};

export type OddsWebhookEntry = OddsWebhookPayload & { receivedAt: number };

const oddsStore = new Map<string, OddsWebhookEntry>();

export function normalizeNumber(value: unknown) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function saveOdds(payload: OddsWebhookPayload) {
  const entry: OddsWebhookEntry = {
    matchId: String(payload.matchId),
    source: payload.source || 'webhook',
    provider: payload.provider || 'Feed externo',
    homeTeam: payload.homeTeam,
    awayTeam: payload.awayTeam,
    league: payload.league,
    homeOdds: normalizeNumber(payload.homeOdds),
    drawOdds: normalizeNumber(payload.drawOdds),
    awayOdds: normalizeNumber(payload.awayOdds),
    over25Odds: normalizeNumber(payload.over25Odds),
    under25Odds: normalizeNumber(payload.under25Odds),
    over85CornersOdds: normalizeNumber(payload.over85CornersOdds),
    over35CardsOdds: normalizeNumber(payload.over35CardsOdds),
    raw: payload.raw,
    receivedAt: Date.now(),
  };
  oddsStore.set(entry.matchId, entry);
  return entry;
}

export function getOddsEntry(matchId: string) {
  return oddsStore.get(matchId);
}

export function listLatestOdds(limit = 50) {
  return [...oddsStore.values()].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, limit);
}

export function listAllOdds() {
  return [...oddsStore.values()];
}

export function clearOddsStore() {
  oddsStore.clear();
}
