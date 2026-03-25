// Integração com APIs Reais de Betfair e Pinnacle
// Sincroniza odds em tempo real e detecta value betting

// Usar fetch nativo do Node.js 18+

export interface BetfairSession {
  sessionToken: string;
  loginStatus: string;
}

export interface PinnacleOdds {
  eventId: number;
  odds: Array<{
    id: number;
    matchupId: number;
    price: number;
    decimal: number;
    type: string;
  }>;
}

export interface BetfairOdds {
  marketId: string;
  isMarketDataDelayed: boolean;
  status: string;
  runners: Array<{
    status: string;
    ex: {
      availableToBack: Array<{ price: number; size: number }>;
      availableToLay: Array<{ price: number; size: number }>;
    };
    adjustmentFactor: number;
    lastPriceTraded: number;
    totalMatched: number;
    totalAvailable: number;
    runnerName: string;
  }>;
}

class BetfairClient {
  private appKey: string;
  private sessionToken: string = '';
  private baseUrl = 'https://api.betfair.com/exchange';

  constructor(appKey: string) {
    this.appKey = appKey;
  }

  // Login no Betfair (requer username/password via API)
  async login(username: string, password: string): Promise<BetfairSession> {
    try {
      const response = await fetch(`${this.baseUrl}/secure/v2/login`, {
        method: 'POST',
        headers: {
          'X-Application': this.appKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${username}&password=${password}`,
      });

      const data = (await response.json()) as any;
      if (data.sessionToken) {
        this.sessionToken = data.sessionToken;
        console.log('[Betfair] Login bem-sucedido');
        return {
          sessionToken: data.sessionToken,
          loginStatus: data.loginStatus,
        };
      }
      throw new Error(`Login falhou: ${data.loginReason}`);
    } catch (error) {
      console.error('[Betfair] Erro de login:', error);
      throw error;
    }
  }

  // Obter odds de um mercado
  async getMarketOdds(marketId: string): Promise<BetfairOdds | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/betting/json-rpc`,
        {
          method: 'POST',
          headers: {
            'X-Application': this.appKey,
            'X-Authentication': this.sessionToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'SportsAPING/v1.0/listMarketBook',
            params: {
              marketIds: [marketId],
              priceData: ['EX_BEST_OFFERS'],
            },
            id: 1,
          }),
        }
      );

      const data = (await response.json()) as any;
      if (data.result && data.result.length > 0) {
        return data.result[0];
      }
      return null;
    } catch (error) {
      console.error('[Betfair] Erro ao obter odds:', error);
      return null;
    }
  }

  // Listar mercados ao vivo
  async getLiveMarkets(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/betting/json-rpc`,
        {
          method: 'POST',
          headers: {
            'X-Application': this.appKey,
            'X-Authentication': this.sessionToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'SportsAPING/v1.0/listMarketCatalogue',
            params: {
              filter: {
                eventTypeIds: ['1'], // Soccer
                marketFilter: {
                  inPlayOnly: true,
                },
              },
              maxResults: '50',
              marketProjections: ['MARKET_DESCRIPTION', 'RUNNER_DESCRIPTION'],
            },
            id: 1,
          }),
        }
      );

      const data = (await response.json()) as any;
      return data.result || [];
    } catch (error) {
      console.error('[Betfair] Erro ao listar mercados:', error);
      return [];
    }
  }
}

class PinnacleClient {
  private apiKey: string;
  private baseUrl = 'https://api.pinnacle.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Obter odds de um evento
  async getEventOdds(eventId: number): Promise<PinnacleOdds | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/odds?eventIds=${eventId}&oddsFormat=decimal`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      const data = (await response.json()) as any;
      if (data.odds && data.odds.length > 0) {
        return data.odds[0];
      }
      return null;
    } catch (error) {
      console.error('[Pinnacle] Erro ao obter odds:', error);
      return null;
    }
  }

  // Listar eventos ao vivo
  async getLiveEvents(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/events?sportId=1&isLive=true`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      const data = (await response.json()) as any;
      return data.events || [];
    } catch (error) {
      console.error('[Pinnacle] Erro ao listar eventos:', error);
      return [];
    }
  }

  // Obter histórico de odds
  async getOddsHistory(eventId: number, limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/odds/history?eventIds=${eventId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      const data = (await response.json()) as any;
      return data.oddsHistory || [];
    } catch (error) {
      console.error('[Pinnacle] Erro ao obter histórico:', error);
      return [];
    }
  }
}

// Gerenciador de sincronização de odds
export class OddsSyncManager {
  private betfairClient: BetfairClient;
  private pinnacleClient: PinnacleClient;
  private syncInterval: NodeJS.Timeout | null = null;
  private oddsCache: Map<string, { betfair: number; pinnacle: number; timestamp: number }> = new Map();

  constructor(betfairKey: string, pinnacleKey: string) {
    this.betfairClient = new BetfairClient(betfairKey);
    this.pinnacleClient = new PinnacleClient(pinnacleKey);
  }

  // Iniciar sincronização periódica
  async startSync(intervalMs: number = 5000) {
    console.log('[OddsSync] Iniciando sincronização de odds...');

    this.syncInterval = setInterval(async () => {
      try {
        const betfairMarkets = await this.betfairClient.getLiveMarkets();
        const pinnacleEvents = await this.pinnacleClient.getLiveEvents();

        // Sincronizar odds de cada mercado
        for (const market of betfairMarkets.slice(0, 5)) {
          // Limitar a 5 mercados para não sobrecarregar
          const marketId = market.marketId;
          const betfairOdds = await this.betfairClient.getMarketOdds(marketId);

          // Encontrar evento correspondente no Pinnacle
          const pinnacleEvent = pinnacleEvents.find(
            (e) => e.eventName?.includes(market.eventName)
          );

          if (betfairOdds && pinnacleEvent) {
            const pinnacleOdds = await this.pinnacleClient.getEventOdds(pinnacleEvent.id);

            if (pinnacleOdds) {
              // Armazenar em cache
              const key = `${marketId}_${pinnacleEvent.id}`;
              this.oddsCache.set(key, {
                betfair: betfairOdds.runners[0]?.lastPriceTraded || 0,
                pinnacle: pinnacleOdds.odds[0]?.decimal || 0,
                timestamp: Date.now(),
              });
            }
          }
        }

        console.log(`[OddsSync] Sincronizadas ${this.oddsCache.size} pares de odds`);
      } catch (error) {
        console.error('[OddsSync] Erro na sincronização:', error);
      }
    }, intervalMs);
  }

  // Parar sincronização
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[OddsSync] Sincronização parada');
    }
  }

  // Obter odds do cache
  getOdds(key: string) {
    return this.oddsCache.get(key);
  }

  // Obter todas as odds
  getAllOdds() {
    const result: any[] = [];
    this.oddsCache.forEach((odds, key) => {
      result.push({ key, ...odds });
    });
    return result;
  }

  // Limpar cache antigo (> 1 hora)
  cleanOldCache() {
    const agora = Date.now();
    const umHora = 3600000;
    const keysToDelete: string[] = [];

    this.oddsCache.forEach((odds, key) => {
      if (agora - odds.timestamp > umHora) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.oddsCache.delete(key));
  }
}

// Exportar instâncias singleton
let syncManager: OddsSyncManager | null = null;

export function initOddsSync(betfairKey: string, pinnacleKey: string): OddsSyncManager {
  if (!syncManager) {
    syncManager = new OddsSyncManager(betfairKey, pinnacleKey);
  }
  return syncManager;
}

export function getOddsSync(): OddsSyncManager | null {
  return syncManager;
}
