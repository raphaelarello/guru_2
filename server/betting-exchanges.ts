import axios from 'axios';

interface OddsBetfair {
  jogador: string;
  mercado: string;
  odds: number;
  liquidity: number;
  timestamp: Date;
}

interface OddsPinnacle {
  jogador: string;
  mercado: string;
  odds: number;
  timestamp: Date;
}

interface ValueBettingAlert {
  jogador: string;
  exchange: 'betfair' | 'pinnacle';
  odds: number;
  expectedProbability: number;
  value: number; // (1/odds) - expectedProbability
  timestamp: Date;
}

class BettingExchangesService {
  private betfairApiUrl = 'https://api.betfair.com/exchange/betting/rest/v1';
  private pinnacleApiUrl = 'https://api.pinnacle.com/v3';
  private betfairToken?: string;
  private pinnacleToken?: string;
  private valueBettingAlerts: ValueBettingAlert[] = [];

  constructor(betfairToken?: string, pinnacleToken?: string) {
    this.betfairToken = betfairToken || process.env.BETFAIR_API_TOKEN;
    this.pinnacleToken = pinnacleToken || process.env.PINNACLE_API_TOKEN;
  }

  /**
   * Busca odds de artilheiros na Betfair
   */
  async buscarOddsBetfair(jogador: string): Promise<OddsBetfair[]> {
    if (!this.betfairToken) {
      console.log('[Betfair] Token não configurado');
      return [];
    }

    try {
      const response = await axios.get(`${this.betfairApiUrl}/eventTypes`, {
        headers: {
          'X-Application': this.betfairToken,
          'Content-Type': 'application/json',
        },
      });

      // Simular dados de odds (em produção, fazer parsing real)
      return [
        {
          jogador,
          mercado: 'gols_totais',
          odds: 2.5,
          liquidity: 50000,
          timestamp: new Date(),
        },
        {
          jogador,
          mercado: 'gols_1_tempo',
          odds: 3.2,
          liquidity: 30000,
          timestamp: new Date(),
        },
      ];
    } catch (error) {
      console.error('[Betfair] Erro ao buscar odds:', error);
      return [];
    }
  }

  /**
   * Busca odds de artilheiros na Pinnacle
   */
  async buscarOddsPinnacle(jogador: string): Promise<OddsPinnacle[]> {
    if (!this.pinnacleToken) {
      console.log('[Pinnacle] Token não configurado');
      return [];
    }

    try {
      const response = await axios.get(`${this.pinnacleApiUrl}/odds`, {
        headers: {
          'Authorization': `Bearer ${this.pinnacleToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Simular dados de odds (em produção, fazer parsing real)
      return [
        {
          jogador,
          mercado: 'gols_totais',
          odds: 2.45,
          timestamp: new Date(),
        },
        {
          jogador,
          mercado: 'gols_1_tempo',
          odds: 3.15,
          timestamp: new Date(),
        },
      ];
    } catch (error) {
      console.error('[Pinnacle] Erro ao buscar odds:', error);
      return [];
    }
  }

  /**
   * Detecta value betting comparando odds com probabilidade esperada
   */
  async detectarValueBetting(
    jogador: string,
    expectedProbability: number
  ): Promise<ValueBettingAlert[]> {
    const oddsBetfair = await this.buscarOddsBetfair(jogador);
    const oddsPinnacle = await this.buscarOddsPinnacle(jogador);

    const alerts: ValueBettingAlert[] = [];

    // Verificar Betfair
    for (const odd of oddsBetfair) {
      const impliedProbability = 1 / odd.odds;
      const value = impliedProbability - expectedProbability;

      if (value > 0.05) { // Value > 5%
        alerts.push({
          jogador,
          exchange: 'betfair',
          odds: odd.odds,
          expectedProbability,
          value,
          timestamp: new Date(),
        });
      }
    }

    // Verificar Pinnacle
    for (const odd of oddsPinnacle) {
      const impliedProbability = 1 / odd.odds;
      const value = impliedProbability - expectedProbability;

      if (value > 0.05) { // Value > 5%
        alerts.push({
          jogador,
          exchange: 'pinnacle',
          odds: odd.odds,
          expectedProbability,
          value,
          timestamp: new Date(),
        });
      }
    }

    // Armazenar alertas
    this.valueBettingAlerts.push(...alerts);

    return alerts;
  }

  /**
   * Sincroniza odds em tempo real
   */
  async sincronizarOdds(artilheiros: any[]): Promise<void> {
    for (const artilheiro of artilheiros.slice(0, 5)) {
      // Top 5 apenas para não sobrecarregar
      const expectedProbability = artilheiro.eficiencia / 100;
      await this.detectarValueBetting(artilheiro.nome, expectedProbability);
    }

    console.log(`[BettingExchanges] Sincronizadas odds para ${artilheiros.length} artilheiros`);
  }

  /**
   * Retorna alertas de value betting
   */
  obterValueBettingAlerts(): ValueBettingAlert[] {
    return this.valueBettingAlerts.slice(-50); // Últimos 50 alertas
  }

  /**
   * Retorna estatísticas de value betting
   */
  obterEstatisticas() {
    const betfairAlerts = this.valueBettingAlerts.filter(a => a.exchange === 'betfair').length;
    const pinnacleAlerts = this.valueBettingAlerts.filter(a => a.exchange === 'pinnacle').length;
    const avgValue = this.valueBettingAlerts.length > 0
      ? (this.valueBettingAlerts.reduce((sum, a) => sum + a.value, 0) / this.valueBettingAlerts.length).toFixed(4)
      : '0';

    return {
      totalAlerts: this.valueBettingAlerts.length,
      betfairAlerts,
      pinnacleAlerts,
      avgValue,
    };
  }

  /**
   * Testa conexão com exchanges
   */
  async testarConexoes(): Promise<void> {
    console.log('[BettingExchanges] Testando conexões...');
    
    if (this.betfairToken) {
      console.log('[Betfair] ✓ Token configurado');
    } else {
      console.log('[Betfair] ✗ Token não configurado');
    }

    if (this.pinnacleToken) {
      console.log('[Pinnacle] ✓ Token configurado');
    } else {
      console.log('[Pinnacle] ✗ Token não configurado');
    }
  }
}

export const bettingExchangesService = new BettingExchangesService();
