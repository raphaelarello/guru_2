import assert from 'node:assert/strict';
import { buildMomentumSummary, edgeFromMarket, fairOdds, impliedProbability } from './client/src/lib/intel.ts';
assert.equal(impliedProbability(2), 50);
assert.equal(fairOdds(40), 2.5);
const edge = edgeFromMarket(58, 2.2);
assert(edge && edge.edgePct > 12 && edge.band === 'elite');
const summary = buildMomentumSummary({ isLive: true, homeStats: { possession: 61, shots: 11, shotsOnTarget: 5, corners: 6, fouls: 0, yellowCards: 0, redCards: 0, offsides: 0, saves: 0, onTargetPct: 45 }, awayStats: { possession: 39, shots: 4, shotsOnTarget: 1, corners: 1, fouls: 0, yellowCards: 0, redCards: 0, offsides: 0, saves: 0, onTargetPct: 25 }, homeScore: '1', awayScore: '0', eventId: '1', status: 'in', statusDescription: 'Ao vivo', statusDetail: '2T', clock: "63'", period: 2, homeTeamId: 'h', awayTeamId: 'a', events: [], lastUpdated: Date.now(), isFinished: false }, 'Mandante', 'Visitante');
assert.equal(summary.leader, 'home');
console.log('intel smoke ok');
