/**
 * Sistema Premium de Controle de Usuários
 * Gerenciamento de roles, features, limites e auditoria
 */

type UserRole = 'admin' | 'pro' | 'free';
type UserPlan = 'free' | 'pro' | 'elite';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;
  isActive: boolean;
  metadata: {
    totalRequests: number;
    totalAlerts: number;
    totalBots: number;
    storageUsed: number;
    apiCallsThisMonth: number;
  };
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  plans: UserPlan[];
  limit?: number;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  changes: Record<string, any>;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

class UserManagementPremium {
  private users = new Map<string, UserProfile>();
  private auditLogs: AuditLog[] = [];
  private rateLimits = new Map<string, { count: number; resetAt: number }>();
  private featureFlags = new Map<string, FeatureFlag>();

  private planLimits: Record<UserPlan, RateLimitConfig> = {
    free: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
    },
    pro: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    },
    elite: {
      requestsPerMinute: 300,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
    },
  };

  constructor() {
    this.initializeFeatureFlags();
  }

  /**
   * Inicializa feature flags
   */
  private initializeFeatureFlags(): void {
    const flags: FeatureFlag[] = [
      {
        name: 'value_betting',
        enabled: true,
        plans: ['pro', 'elite'],
      },
      {
        name: 'ml_recommendations',
        enabled: true,
        plans: ['pro', 'elite'],
      },
      {
        name: 'advanced_analytics',
        enabled: true,
        plans: ['pro', 'elite'],
      },
      {
        name: 'custom_alerts',
        enabled: true,
        plans: ['pro', 'elite'],
        limit: 50,
      },
      {
        name: 'api_access',
        enabled: true,
        plans: ['elite'],
      },
      {
        name: 'custom_reports',
        enabled: true,
        plans: ['elite'],
      },
      {
        name: 'priority_support',
        enabled: true,
        plans: ['elite'],
      },
    ];

    flags.forEach(flag => {
      this.featureFlags.set(flag.name, flag);
    });

    console.log('[UserMgmt] Feature flags inicializados');
  }

  /**
   * Cria novo usuário
   */
  createUser(email: string, name: string, plan: UserPlan = 'free'): UserProfile {
    const user: UserProfile = {
      id: `user_${Date.now()}`,
      email,
      name,
      role: plan === 'free' ? 'free' : 'pro',
      plan,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      metadata: {
        totalRequests: 0,
        totalAlerts: 0,
        totalBots: 0,
        storageUsed: 0,
        apiCallsThisMonth: 0,
      },
    };

    this.users.set(user.id, user);

    this.logAudit(user.id, 'user_created', 'user', {
      email,
      name,
      plan,
    });

    console.log(`[UserMgmt] Usuário criado: ${email} (${plan})`);

    return user;
  }

  /**
   * Obtém usuário por ID
   */
  getUser(userId: string): UserProfile | null {
    return this.users.get(userId) || null;
  }

  /**
   * Atualiza plano do usuário
   */
  upgradePlan(userId: string, newPlan: UserPlan): UserProfile | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const oldPlan = user.plan;
    user.plan = newPlan;
    user.role = newPlan === 'free' ? 'free' : 'pro';
    user.updatedAt = Date.now();

    this.logAudit(userId, 'plan_upgraded', 'user', {
      oldPlan,
      newPlan,
    });

    console.log(`[UserMgmt] Plano atualizado: ${userId} (${oldPlan} -> ${newPlan})`);

    return user;
  }

  /**
   * Verifica se usuário tem acesso a feature
   */
  hasFeatureAccess(userId: string, featureName: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const feature = this.featureFlags.get(featureName);
    if (!feature || !feature.enabled) return false;

    return feature.plans.includes(user.plan);
  }

  /**
   * Obtém limite de requisições para usuário
   */
  getRateLimit(userId: string): RateLimitConfig {
    const user = this.users.get(userId);
    if (!user) return this.planLimits.free;

    return this.planLimits[user.plan];
  }

  /**
   * Verifica se usuário atingiu limite de requisições
   */
  checkRateLimit(userId: string): boolean {
    const limit = this.getRateLimit(userId);
    const key = `${userId}_minute`;
    const now = Date.now();

    let record = this.rateLimits.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + 60000 };
    }

    record.count++;

    if (record.count > limit.requestsPerMinute) {
      console.log(`[UserMgmt] Rate limit atingido: ${userId}`);
      return false;
    }

    this.rateLimits.set(key, record);
    return true;
  }

  /**
   * Incrementa contador de requisições
   */
  incrementMetric(userId: string, metric: keyof UserProfile['metadata']): void {
    const user = this.users.get(userId);
    if (!user) return;

    (user.metadata[metric] as number)++;
    user.updatedAt = Date.now();
  }

  /**
   * Obtém uso de recursos do usuário
   */
  getResourceUsage(userId: string): {
    plan: UserPlan;
    usage: UserProfile['metadata'];
    limits: Record<string, number>;
  } | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const limits: Record<string, number> = {
      bots: user.plan === 'free' ? 1 : user.plan === 'pro' ? 5 : 999,
      alerts: user.plan === 'free' ? 5 : user.plan === 'pro' ? 50 : 999999,
      storage: user.plan === 'free' ? 1024 : user.plan === 'pro' ? 51200 : 512000,
      apiCalls: user.plan === 'free' ? 100 : user.plan === 'pro' ? 1000 : 100000,
    };

    return {
      plan: user.plan,
      usage: user.metadata,
      limits,
    };
  }

  /**
   * Migra usuário entre planos (com backup)
   */
  migratePlan(userId: string, newPlan: UserPlan): {
    success: boolean;
    backup: UserProfile | null;
    message: string;
  } {
    const user = this.users.get(userId);
    if (!user) {
      return {
        success: false,
        backup: null,
        message: 'Usuário não encontrado',
      };
    }

    // Criar backup
    const backup = JSON.parse(JSON.stringify(user));

    try {
      // Migrar plano
      const oldPlan = user.plan;
      user.plan = newPlan;
      user.role = newPlan === 'free' ? 'free' : 'pro';
      user.updatedAt = Date.now();

      // Resetar contadores se necessário
      if (oldPlan !== newPlan) {
        user.metadata.apiCallsThisMonth = 0;
      }

      this.logAudit(userId, 'plan_migrated', 'user', {
        oldPlan,
        newPlan,
        timestamp: Date.now(),
      });

      console.log(`[UserMgmt] Migração concluída: ${userId} (${oldPlan} -> ${newPlan})`);

      return {
        success: true,
        backup,
        message: `Migração de ${oldPlan} para ${newPlan} concluída com sucesso`,
      };
    } catch (error) {
      console.error('[UserMgmt] Erro na migração:', error);
      return {
        success: false,
        backup,
        message: `Erro na migração: ${error}`,
      };
    }
  }

  /**
   * Registra ação de auditoria
   */
  private logAudit(
    userId: string,
    action: string,
    resource: string,
    changes: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: `audit_${Date.now()}`,
      userId,
      action,
      resource,
      changes,
      timestamp: Date.now(),
    };

    this.auditLogs.push(log);

    // Manter apenas últimos 10.000 logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Obtém histórico de auditoria
   */
  getAuditHistory(userId: string, limit: number = 100): AuditLog[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Obtém estatísticas de usuários
   */
  getStats(): {
    totalUsers: number;
    usersByPlan: Record<UserPlan, number>;
    usersByRole: Record<UserRole, number>;
    activeUsers: number;
    totalAuditLogs: number;
  } {
    const stats = {
      totalUsers: this.users.size,
      usersByPlan: { free: 0, pro: 0, elite: 0 },
      usersByRole: { admin: 0, pro: 0, free: 0 },
      activeUsers: 0,
      totalAuditLogs: this.auditLogs.length,
    };

    const userValues = Array.from(this.users.values());
    for (const user of userValues) {
      stats.usersByPlan[user.plan]++;
      stats.usersByRole[user.role]++;
      if (user.isActive) stats.activeUsers++;
    }

    return stats;
  }

  /**
   * Exporta dados de usuário (GDPR)
   */
  exportUserData(userId: string): {
    user: UserProfile | null;
    auditLogs: AuditLog[];
  } {
    const user = this.users.get(userId) || null;
    const auditLogs = this.getAuditHistory(userId, 1000);

    return {
      user,
      auditLogs,
    };
  }

  /**
   * Deleta usuário (soft delete)
   */
  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isActive = false;
    user.updatedAt = Date.now();

    this.logAudit(userId, 'user_deleted', 'user', {
      deletedAt: Date.now(),
    });

    console.log(`[UserMgmt] Usuário deletado: ${userId}`);

    return true;
  }
}

export const userManagementPremium = new UserManagementPremium();
export type { UserProfile, FeatureFlag, AuditLog, RateLimitConfig, UserRole, UserPlan };
