import { buildTopOpportunityBoard, buildTrendBoards } from './client/src/lib/intel';

const mockEntry = {
  match: { idEvent: '1', strHomeTeam: 'Flamengo', strAwayTeam: 'Bahia', strLeague: 'Brasileirão' },
  predictions: {
    over25Prob: 72, firstHalfOver05Prob: 81, over85CornersProb: 69, over35CardsProb: 63, bttsYesProb: 61,
    expectedTotalGoals: 3.1, expectedFirstHalfGoals: 1.22, expectedCorners: 10.4, expectedCards: 4.9,
    homeToScoreProb: 84, awayToScoreProb: 65,
  },
  summary: { decisionScore: 78, stabilityScore: 74, marketAlignmentScore: 69 },
  confidence: 'high',
  liveState: 'pre',
  livePressureScore: 0,
  topValueEdge: 8.4,
  marketOdds: { totalLine: 2.5, overOdds: 1.95, underOdds: 1.88, homeWinOdds: 1.8, awayWinOdds: 4.2, drawOdds: 3.6 },
  valueBets: [{ market: 'Over 2.5 Goals', ourProb: 72, impliedProb: 55, marketOdds: 1.95, ourOdds: 1.39, edge: 8.4, confidence: 'high', sourceLabel: 'Modelo' }],
  homeTeamStats: { goalsFirstHalfRate: 0.72, avgGoalsScored: 2.1, over15Rate: 74, bttsRate: 62, avgCornersFor: 6.8, avgCornersAgainst: 4.1, avgTotalCardsPerGame: 2.7, aggressionIndex: 0.64, cleanSheetRate: 33 },
  awayTeamStats: { goalsFirstHalfRate: 0.58, avgGoalsScored: 1.7, over15Rate: 68, bttsRate: 59, avgCornersFor: 5.7, avgCornersAgainst: 5.2, avgTotalCardsPerGame: 2.9, aggressionIndex: 0.69, cleanSheetRate: 25 },
  oddsMovement: { strongestLabel: 'Mov. Over', strongestDelta: 6.2, strength: 'strong' },
} as any;

const entries = [mockEntry];
console.log(buildTopOpportunityBoard(entries, 'all', 3));
console.log(buildTrendBoards(entries));
