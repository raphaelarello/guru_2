/**
 * Serviço de Notificações Push em Tempo Real
 * Integração com Firebase Cloud Messaging
 */

interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data: {
    type: 'oportunidade' | 'alerta' | 'vitoria' | 'achievement' | 'sistema';
    fixtureId?: number;
    score?: number;
    actionUrl?: string;
  };
  timestamp: number;
  read: boolean;
  priority: 'high' | 'normal' | 'low';
}

interface PushAlert {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  score: number;
  probability: number;
  confidence: number;
  recommendation: string;
}

class PushNotificationService {
  private notifications = new Map<string, PushNotification[]>();
  private alertHistory = new Map<string, PushAlert[]>();
  private subscribers = new Set<string>();

  /**
   * Registra dispositivo para receber notificações
   */
  registerDevice(userId: string, fcmToken: string): void {
    this.subscribers.add(fcmToken);
    console.log(`[Push] Dispositivo registrado: ${userId} - ${fcmToken.substring(0, 20)}...`);
  }

  /**
   * Remove dispositivo
   */
  unregisterDevice(fcmToken: string): void {
    this.subscribers.delete(fcmToken);
    console.log(`[Push] Dispositivo removido: ${fcmToken.substring(0, 20)}...`);
  }

  /**
   * Envia notificação de oportunidade
   */
  async sendOpportunityAlert(userId: string, alert: PushAlert): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `alert-${Date.now()}`,
        userId,
        title: `🎯 Oportunidade: ${alert.homeTeam} vs ${alert.awayTeam}`,
        body: `Score: ${alert.score} | Confiança: ${alert.confidence}% | ${alert.recommendation}`,
        data: {
          type: 'oportunidade',
          fixtureId: alert.fixtureId,
          score: alert.score,
          actionUrl: `/match-center?fixture=${alert.fixtureId}`,
        },
        timestamp: Date.now(),
        read: false,
        priority: alert.score > 80 ? 'high' : 'normal',
      };

      // Armazenar notificação
      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      this.notifications.get(userId)!.push(notification);

      // Armazenar alerta
      if (!this.alertHistory.has(userId)) {
        this.alertHistory.set(userId, []);
      }
      this.alertHistory.get(userId)!.push(alert);

      console.log(`[Push] Alerta enviado: ${userId} - Score: ${alert.score}`);

      // Simular envio via Firebase
      await this.sendViaFirebase(notification);

      return true;
    } catch (error) {
      console.error('[Push] Erro ao enviar alerta:', error);
      return false;
    }
  }

  /**
   * Envia notificação de vitória
   */
  async sendVictoryNotification(userId: string, streak: number, points: number): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `victory-${Date.now()}`,
        userId,
        title: '🎉 Vitória!',
        body: `Streak: ${streak} | Pontos: ${points} | Você está em grande forma!`,
        data: {
          type: 'vitoria',
          actionUrl: '/dashboard-vitorias',
        },
        timestamp: Date.now(),
        read: false,
        priority: 'high',
      };

      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      this.notifications.get(userId)!.push(notification);

      await this.sendViaFirebase(notification);

      console.log(`[Push] Vitória notificada: ${userId}`);
      return true;
    } catch (error) {
      console.error('[Push] Erro ao enviar notificação de vitória:', error);
      return false;
    }
  }

  /**
   * Envia notificação de achievement
   */
  async sendAchievementNotification(userId: string, badge: string, description: string): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `achievement-${Date.now()}`,
        userId,
        title: `🏅 Achievement Desbloqueado!`,
        body: `${badge}: ${description}`,
        data: {
          type: 'achievement',
          actionUrl: '/ranking-recordes',
        },
        timestamp: Date.now(),
        read: false,
        priority: 'high',
      };

      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      this.notifications.get(userId)!.push(notification);

      await this.sendViaFirebase(notification);

      console.log(`[Push] Achievement notificado: ${userId} - ${badge}`);
      return true;
    } catch (error) {
      console.error('[Push] Erro ao enviar notificação de achievement:', error);
      return false;
    }
  }

  /**
   * Envia notificação do sistema
   */
  async sendSystemNotification(userId: string, title: string, body: string): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `system-${Date.now()}`,
        userId,
        title,
        body,
        data: {
          type: 'sistema',
        },
        timestamp: Date.now(),
        read: false,
        priority: 'normal',
      };

      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      this.notifications.get(userId)!.push(notification);

      await this.sendViaFirebase(notification);

      console.log(`[Push] Notificação do sistema: ${userId}`);
      return true;
    } catch (error) {
      console.error('[Push] Erro ao enviar notificação do sistema:', error);
      return false;
    }
  }

  /**
   * Simula envio via Firebase Cloud Messaging
   */
  private async sendViaFirebase(notification: PushNotification): Promise<void> {
    // Em produção, aqui seria feita a chamada real ao Firebase
    // const message = {
    //   notification: {
    //     title: notification.title,
    //     body: notification.body,
    //   },
    //   data: notification.data,
    //   webpush: {
    //     fcmOptions: {
    //       link: notification.data.actionUrl || '/',
    //     },
    //   },
    // };
    // await admin.messaging().sendToDevice(fcmTokens, message);

    console.log(`[Firebase] Enviando: ${notification.title}`);

    // Simular delay de envio
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[Firebase] Entregue: ${notification.id}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Obtém notificações do usuário
   */
  getUserNotifications(userId: string, limit: number = 50): PushNotification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(-limit).reverse();
  }

  /**
   * Marca notificação como lida
   */
  markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const notification = userNotifications.find(n => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    return true;
  }

  /**
   * Marca todas as notificações como lidas
   */
  markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    userNotifications.forEach((n: PushNotification) => (n.read = true));
  }

  /**
   * Deleta notificação
   */
  deleteNotification(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const index = userNotifications.findIndex(n => n.id === notificationId);
    if (index === -1) return false;

    userNotifications.splice(index, 1);
    return true;
  }

  /**
   * Obtém histórico de alertas
   */
  getAlertHistory(userId: string, limit: number = 100): PushAlert[] {
    const history = this.alertHistory.get(userId) || [];
    return history.slice(-limit).reverse();
  }

  /**
   * Limpa notificações antigas (mais de 7 dias)
   */
  cleanupOldNotifications(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const notificationEntries = Array.from(this.notifications.entries());
    for (const [userId, notifications] of notificationEntries) {
      const filtered = notifications.filter((n: PushNotification) => n.timestamp > sevenDaysAgo);
      if (filtered.length === 0) {
        this.notifications.delete(userId);
      } else {
        this.notifications.set(userId, filtered);
      }
    }

    const alertEntries = Array.from(this.alertHistory.entries());
    for (const [, alerts] of alertEntries) {
      // Cleanup alerts
    }

    console.log('[Push] Limpeza de notificações antigas concluída');
  }

  /**
   * Retorna estatísticas
   */
  getStats(): {
    totalSubscribers: number;
    totalNotifications: number;
    unreadCount: number;
    alertsCount: number;
  } {
    let totalNotifications = 0;
    let unreadCount = 0;
    let alertsCount = 0;

    const notificationValues = Array.from(this.notifications.values());
    for (const notifications of notificationValues) {
      totalNotifications += notifications.length;
      unreadCount += notifications.filter((n: PushNotification) => !n.read).length;
    }

    const alertValues = Array.from(this.alertHistory.values());
    for (const alerts of alertValues) {
      alertsCount += alerts.length;
    }

    return {
      totalSubscribers: this.subscribers.size,
      totalNotifications,
      unreadCount,
      alertsCount,
    };
  }
}

export const pushNotificationService = new PushNotificationService();
export type { PushNotification, PushAlert };
