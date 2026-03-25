import axios from 'axios';

const API_KEY = process.env.API_FOOTBALL_KEY || 'ced3480ee75012136a1f2923619c8ef3';
const API_BASE = 'https://v3.football.api-sports.io';

interface SyncJob {
  id: string;
  lastSync: number;
  nextSync: number;
  status: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
  recordsUpdated: number;
}

interface GoalNotification {
  playerId: number;
  playerName: string;
  teamName: string;
  timestamp: number;
  goalCount: number;
  fixtureId: number;
}

class AutoSyncArtilheiros {
  private syncJob: SyncJob;
  private SYNC_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas
  private goalNotifications: Map<string, GoalNotification> = new Map();
  private lastGoalCheck: number = Date.now();

  constructor() {
    this.syncJob = {
      id: 'artilheiros-sync-001',
      lastSync: 0,
      nextSync: Date.now() + this.SYNC_INTERVAL,
      status: 'idle',
      recordsUpdated: 0,
    };

    // Iniciar sincronização automática
    this.startAutoSync();
  }

  /**
   * Inicia sincronização automática
   */
  private startAutoSync() {
    setInterval(() => {
      this.syncArtilheiros();
    }, this.SYNC_INTERVAL);

    // Primeira sincronização imediata
    this.syncArtilheiros();
  }

  /**
   * Sincroniza dados de artilheiros da API Football
   */
  async syncArtilheiros() {
    if (this.syncJob.status === 'syncing') {
      console.log('[AutoSync] Sincronização já em progresso');
      return;
    }

    this.syncJob.status = 'syncing';
    this.syncJob.lastSync = Date.now();

    try {
      console.log('[AutoSync] Iniciando sincronização de artilheiros...');

      // Buscar fixtures de hoje
      const today = new Date().toISOString().split('T')[0];
      const fixturesResponse = await axios.get(`${API_BASE}/fixtures`, {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'api-football-beta.p.rapidapi.com',
        },
        params: {
          date: today,
          status: 'LIVE,FT',
        },
        timeout: 10000,
      });

      const fixtures = fixturesResponse.data?.response || [];
      console.log(`[AutoSync] Encontrados ${fixtures.length} jogos`);

      let totalRecords = 0;

      // Para cada fixture, buscar estatísticas
      for (const fixture of fixtures.slice(0, 5)) {
        try {
          const statsResponse = await axios.get(`${API_BASE}/fixtures/statistics`, {
            headers: {
              'x-rapidapi-key': API_KEY,
              'x-rapidapi-host': 'api-football-beta.p.rapidapi.com',
            },
            params: {
              fixture: fixture.id,
            },
            timeout: 10000,
          });

          const stats = statsResponse.data?.response || [];
          totalRecords += stats.length;

          // Verificar gols marcados
          await this.checkGoals(fixture);
        } catch (error) {
          console.error(`[AutoSync] Erro ao buscar stats do fixture ${fixture.id}:`, error);
        }

        // Respeitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.syncJob.recordsUpdated = totalRecords;
      this.syncJob.status = 'idle';
      this.syncJob.nextSync = Date.now() + this.SYNC_INTERVAL;

      console.log(`[AutoSync] Sincronização concluída! ${totalRecords} registros atualizados`);
    } catch (error) {
      this.syncJob.status = 'error';
      this.syncJob.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[AutoSync] Erro na sincronização:', error);
    }
  }

  /**
   * Verifica gols marcados em um fixture
   */
  private async checkGoals(fixture: any) {
    try {
      const eventsResponse = await axios.get(`${API_BASE}/fixtures/events`, {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'api-football-beta.p.rapidapi.com',
        },
        params: {
          fixture: fixture.id,
        },
        timeout: 10000,
      });

      const events = eventsResponse.data?.response || [];
      const goals = events.filter((e: any) => e.type === 'Goal');

      for (const goal of goals) {
        const notificationKey = `${goal.player.id}-${fixture.id}`;

        if (!this.goalNotifications.has(notificationKey)) {
          const notification: GoalNotification = {
            playerId: goal.player.id,
            playerName: goal.player.name,
            teamName: goal.team.name,
            timestamp: Date.now(),
            goalCount: 1,
            fixtureId: fixture.id,
          };

          this.goalNotifications.set(notificationKey, notification);

          // Emitir notificação
          await this.emitGoalNotification(notification);
        }
      }
    } catch (error) {
      console.error('[AutoSync] Erro ao verificar gols:', error);
    }
  }

  /**
   * Emite notificação de gol
   */
  private async emitGoalNotification(notification: GoalNotification) {
    try {
      console.log(
        `[AutoSync] 🎉 GOOOOOL! ${notification.playerName} (${notification.teamName}) marcou!`
      );

      // Aqui você pode integrar com Firebase Cloud Messaging, Pusher, etc
      // Por enquanto, apenas logamos
    } catch (error) {
      console.error('[AutoSync] Erro ao emitir notificação:', error);
    }
  }

  /**
   * Retorna status da sincronização
   */
  getStatus() {
    return {
      ...this.syncJob,
      notificacoesAtivas: this.goalNotifications.size,
    };
  }

  /**
   * Força sincronização imediata
   */
  async forceSync() {
    console.log('[AutoSync] Sincronização forçada solicitada');
    return this.syncArtilheiros();
  }

  /**
   * Limpa notificações antigas (mais de 24 horas)
   */
  cleanOldNotifications() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    const keysToDelete: string[] = [];
    this.goalNotifications.forEach((notification, key) => {
      if (now - notification.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.goalNotifications.delete(key))

    console.log(`[AutoSync] Limpeza de notificações: ${this.goalNotifications.size} ativas`);
  }
}

// Exportar instância singleton
export const autoSyncArtilheiros = new AutoSyncArtilheiros();

// Limpar notificações antigas a cada 6 horas
setInterval(() => {
  autoSyncArtilheiros.cleanOldNotifications();
}, 6 * 60 * 60 * 1000);
