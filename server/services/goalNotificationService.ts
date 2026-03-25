import axios from 'axios';

const API_KEY = process.env.API_FOOTBALL_KEY || 'ced3480ee75012136a1f2923619c8ef3';
const API_BASE = 'https://v3.football.api-sports.io';

interface GoalEvent {
  playerId: number;
  playerName: string;
  playerPhoto?: string;
  teamId: number;
  teamName: string;
  teamLogo?: string;
  fixtureId: number;
  minute: number;
  second: number;
  timestamp: number;
  goalType: 'goal' | 'penalty' | 'owngoal';
  assistPlayer?: string;
}

interface NotificationSubscriber {
  userId: string;
  playerIds: number[];
  teamIds: number[];
  callback: (goal: GoalEvent) => Promise<void>;
}

class GoalNotificationService {
  private subscribers: Map<string, NotificationSubscriber> = new Map();
  private recentGoals: Map<string, GoalEvent> = new Map();
  private monitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Inscrever usuário para notificações de gols
   */
  subscribe(userId: string, playerIds: number[], teamIds: number[], callback: (goal: GoalEvent) => Promise<void>) {
    this.subscribers.set(userId, {
      userId,
      playerIds,
      teamIds,
      callback,
    });

    console.log(`[GoalNotifications] Usuário ${userId} inscrito para ${playerIds.length} jogadores`);

    // Iniciar monitoramento se não estiver ativo
    if (!this.monitoringActive) {
      this.startMonitoring();
    }
  }

  /**
   * Desinscrever usuário
   */
  unsubscribe(userId: string) {
    this.subscribers.delete(userId);
    console.log(`[GoalNotifications] Usuário ${userId} desinscrito`);

    // Parar monitoramento se não houver mais inscritos
    if (this.subscribers.size === 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Inicia monitoramento de gols em tempo real
   */
  private startMonitoring() {
    if (this.monitoringActive) return;

    this.monitoringActive = true;
    console.log('[GoalNotifications] Iniciando monitoramento de gols...');

    // Verificar gols a cada 30 segundos
    this.monitoringInterval = setInterval(() => {
      this.checkLiveGoals();
    }, 30000);

    // Primeira verificação imediata
    this.checkLiveGoals();
  }

  /**
   * Para monitoramento de gols
   */
  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.monitoringActive = false;
    console.log('[GoalNotifications] Monitoramento de gols parado');
  }

  /**
   * Verifica gols em jogos ao vivo
   */
  private async checkLiveGoals() {
    try {
      // Buscar fixtures ao vivo
      const fixturesResponse = await axios.get(`${API_BASE}/fixtures`, {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'api-football-beta.p.rapidapi.com',
        },
        params: {
          status: 'LIVE',
        },
        timeout: 10000,
      });

      const fixtures = fixturesResponse.data?.response || [];

      // Para cada fixture, buscar eventos
      for (const fixture of fixtures.slice(0, 3)) {
        await this.checkFixtureGoals(fixture);
      }
    } catch (error) {
      console.error('[GoalNotifications] Erro ao verificar gols:', error);
    }
  }

  /**
   * Verifica gols em um fixture específico
   */
  private async checkFixtureGoals(fixture: any) {
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
        const goalKey = `${fixture.id}-${goal.player.id}-${goal.time.elapsed}`;

        // Se gol já foi notificado, pular
        if (this.recentGoals.has(goalKey)) {
          continue;
        }

        const goalEvent: GoalEvent = {
          playerId: goal.player.id,
          playerName: goal.player.name,
          playerPhoto: goal.player.photo,
          teamId: goal.team.id,
          teamName: goal.team.name,
          teamLogo: goal.team.logo,
          fixtureId: fixture.id,
          minute: goal.time.elapsed,
          second: goal.time.extra || 0,
          timestamp: Date.now(),
          goalType: goal.detail === 'Penalty' ? 'penalty' : goal.detail === 'Own Goal' ? 'owngoal' : 'goal',
          assistPlayer: goal.assist?.name,
        };

        // Registrar gol
        this.recentGoals.set(goalKey, goalEvent);

        // Notificar inscritos
        await this.notifySubscribers(goalEvent);
      }
    } catch (error) {
      console.error('[GoalNotifications] Erro ao verificar fixture:', error);
    }
  }

  /**
   * Notifica inscritos sobre um gol
   */
  private async notifySubscribers(goal: GoalEvent) {
    const promises: Promise<void>[] = [];

    this.subscribers.forEach((subscriber) => {
      // Verificar se o jogador ou time está na lista de interesse
      const isPlayerOfInterest = subscriber.playerIds.includes(goal.playerId);
      const isTeamOfInterest = subscriber.teamIds.includes(goal.teamId);

      if (isPlayerOfInterest || isTeamOfInterest) {
        console.log(`[GoalNotifications] 🎉 Notificando ${subscriber.userId} sobre gol de ${goal.playerName}`);
        promises.push(subscriber.callback(goal));
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Retorna gols recentes
   */
  getRecentGoals(limit: number = 10): GoalEvent[] {
    return Array.from(this.recentGoals.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Limpa gols antigos (mais de 24 horas)
   */
  cleanOldGoals() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    const keysToDelete: string[] = [];
    this.recentGoals.forEach((goal, key) => {
      if (now - goal.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.recentGoals.delete(key));

    console.log(`[GoalNotifications] Limpeza: ${this.recentGoals.size} gols recentes`);
  }

  /**
   * Retorna status do serviço
   */
  getStatus() {
    return {
      monitoringActive: this.monitoringActive,
      subscribers: this.subscribers.size,
      recentGoals: this.recentGoals.size,
    };
  }
}

// Exportar instância singleton
export const goalNotificationService = new GoalNotificationService();

// Limpar gols antigos a cada 6 horas
setInterval(() => {
  goalNotificationService.cleanOldGoals();
}, 6 * 60 * 60 * 1000);
