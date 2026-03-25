/**
 * Motor Analítico Avançado
 * Calcula: pressão, probabilidade, confiança, edge, score com algoritmos sofisticados
 */

interface MatchAnalysis {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  minute: number;
  status: string;
  pressure: number; // 0-100
  probability: number; // 0-100
  confidence: number; // 0-100
  edge: number; // -100 to 100
  score: number; // 0-100
  recommendation: string;
  riskLevel: 'baixo' | 'médio' | 'alto';
  opportunities: Opportunity[];
}

interface Opportunity {
  type: 'gol' | 'cartão' | 'escanteio' | 'falta';
  probability: number;
  confidence: number;
  odds: number;
  value: number; // -100 to 100
}

class AdvancedAnalytics {
  /**
   * Calcula pressão do jogo baseado em minuto e eventos
   */
  calculatePressure(minute: number, events: number = 0, possession: number = 50): number {
    // Pressão aumenta com o tempo
    const timePressure = (minute / 90) * 40;

    // Pressão aumenta com eventos (gols, cartões, etc)
    const eventPressure = Math.min(events * 5, 30);

    // Pressão baseada em posse de bola
    const possessionPressure = Math.abs(possession - 50) * 0.4;

    return Math.min(100, timePressure + eventPressure + possessionPressure);
  }

  /**
   * Calcula probabilidade de gol baseado em múltiplos fatores
   */
  calculateGoalProbability(
    pressure: number,
    teamStrength: number = 50,
    possession: number = 50,
    shotsOnTarget: number = 0,
    xG: number = 0
  ): number {
    // Fórmula base: pressão + força do time + posse
    const baseProbability = (pressure * 0.3 + teamStrength * 0.4 + possession * 0.3) * 0.8;

    // Ajuste por xG (expected goals)
    const xGFactor = xG * 10;

    // Ajuste por chutes no alvo
    const shotsFactor = Math.min(shotsOnTarget * 8, 20);

    return Math.min(95, Math.max(5, baseProbability + xGFactor + shotsFactor));
  }

  /**
   * Calcula confiança da análise
   */
  calculateConfidence(
    dataPoints: number,
    timeElapsed: number,
    eventVariance: number
  ): number {
    // Mais dados = mais confiança
    const dataConfidence = Math.min(dataPoints * 5, 50);

    // Mais tempo decorrido = mais confiança
    const timeConfidence = Math.min((timeElapsed / 90) * 30, 30);

    // Menos variância = mais confiança
    const varianceConfidence = Math.max(20 - eventVariance, 0);

    return Math.min(100, dataConfidence + timeConfidence + varianceConfidence);
  }

  /**
   * Calcula edge (vantagem) da aposta
   */
  calculateEdge(
    modelProbability: number,
    marketOdds: number,
    confidence: number,
    historicalAccuracy: number = 60
  ): number {
    // Converter odds para probabilidade implícita
    const impliedProbability = (1 / marketOdds) * 100;

    // Diferença entre modelo e mercado
    const rawEdge = modelProbability - impliedProbability;

    // Ajustar por confiança
    const confidenceAdjustedEdge = rawEdge * (confidence / 100);

    // Ajustar por acurácia histórica
    const finalEdge = confidenceAdjustedEdge * (historicalAccuracy / 100);

    return finalEdge;
  }

  /**
   * Calcula score final da oportunidade (0-100)
   */
  calculateOpportunityScore(
    probability: number,
    confidence: number,
    edge: number,
    riskAdjustment: number = 1
  ): number {
    // Ponderação dos fatores
    const probabilityWeight = probability * 0.35;
    const confidenceWeight = confidence * 0.35;
    const edgeWeight = Math.max(0, edge) * 0.3; // Apenas edge positivo conta

    const baseScore = probabilityWeight + confidenceWeight + edgeWeight;

    // Aplicar ajuste de risco
    const finalScore = baseScore * riskAdjustment;

    return Math.min(100, Math.max(0, finalScore));
  }

  /**
   * Gera recomendação baseado em análise
   */
  generateRecommendation(score: number, edge: number, confidence: number): string {
    if (score < 30) {
      return 'Não recomendado - Baixa qualidade da oportunidade';
    }

    if (score < 50) {
      return 'Recomendação fraca - Espere por melhores oportunidades';
    }

    if (score < 70) {
      if (edge < 5) {
        return 'Recomendação moderada - Oportunidade aceitável';
      }
      return 'Recomendação boa - Oportunidade com valor';
    }

    if (score < 85) {
      return 'Recomendação forte - Excelente oportunidade';
    }

    return 'Recomendação muito forte - Oportunidade premium';
  }

  /**
   * Determina nível de risco
   */
  determineRiskLevel(
    confidence: number,
    volatility: number,
    edge: number
  ): 'baixo' | 'médio' | 'alto' {
    const riskScore = (100 - confidence) * 0.4 + volatility * 0.4 + Math.abs(edge) * 0.2;

    if (riskScore < 30) return 'baixo';
    if (riskScore < 60) return 'médio';
    return 'alto';
  }

  /**
   * Análise completa de um jogo
   */
  analyzeMatch(
    fixtureId: number,
    homeTeam: string,
    awayTeam: string,
    minute: number,
    status: string,
    matchData: {
      events: number;
      possession: number;
      shotsOnTarget: number;
      xG: number;
      homeStrength: number;
      awayStrength: number;
      marketOdds: number;
      historicalAccuracy: number;
    }
  ): MatchAnalysis {
    // Calcular pressão
    const pressure = this.calculatePressure(minute, matchData.events, matchData.possession);

    // Calcular probabilidade
    const probability = this.calculateGoalProbability(
      pressure,
      matchData.homeStrength,
      matchData.possession,
      matchData.shotsOnTarget,
      matchData.xG
    );

    // Calcular confiança
    const confidence = this.calculateConfidence(
      matchData.events,
      minute,
      Math.abs(matchData.possession - 50)
    );

    // Calcular edge
    const edge = this.calculateEdge(
      probability,
      matchData.marketOdds,
      confidence,
      matchData.historicalAccuracy
    );

    // Calcular score
    const score = this.calculateOpportunityScore(
      probability,
      confidence,
      edge,
      1 + edge / 100
    );

    // Gerar recomendação
    const recommendation = this.generateRecommendation(score, edge, confidence);

    // Determinar nível de risco
    const riskLevel = this.determineRiskLevel(
      confidence,
      Math.abs(matchData.possession - 50),
      edge
    );

    // Gerar oportunidades
    const opportunities: Opportunity[] = [
      {
        type: 'gol',
        probability: probability,
        confidence: confidence,
        odds: matchData.marketOdds,
        value: edge,
      },
      {
        type: 'cartão',
        probability: Math.min(probability * 0.6, 100),
        confidence: confidence * 0.8,
        odds: 2.5,
        value: this.calculateEdge(probability * 0.6, 2.5, confidence * 0.8, matchData.historicalAccuracy),
      },
      {
        type: 'escanteio',
        probability: Math.min(probability * 0.8, 100),
        confidence: confidence * 0.9,
        odds: 1.8,
        value: this.calculateEdge(probability * 0.8, 1.8, confidence * 0.9, matchData.historicalAccuracy),
      },
    ];

    return {
      fixtureId,
      homeTeam,
      awayTeam,
      minute,
      status,
      pressure: Math.round(pressure),
      probability: Math.round(probability),
      confidence: Math.round(confidence),
      edge: Math.round(edge * 10) / 10,
      score: Math.round(score),
      recommendation,
      riskLevel,
      opportunities,
    };
  }

  /**
   * Calcula volatilidade (variância) de um conjunto de análises
   */
  calculateVolatility(analyses: MatchAnalysis[]): number {
    if (analyses.length < 2) return 0;

    const scores = analyses.map(a => a.score);
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return Math.round(stdDev * 10) / 10;
  }

  /**
   * Ranking de oportunidades
   */
  rankOpportunities(analyses: MatchAnalysis[]): MatchAnalysis[] {
    return [...analyses].sort((a, b) => b.score - a.score);
  }
}

export const advancedAnalytics = new AdvancedAnalytics();
export type { MatchAnalysis, Opportunity };
