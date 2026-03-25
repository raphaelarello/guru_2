/**
 * Serviço de Monitoramento em Tempo Real
 * Health checks, Sentry, alertas automáticos
 */

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
}

interface HealthReport {
  timestamp: number;
  overallStatus: 'healthy' | 'warning' | 'critical';
  metrics: HealthMetric[];
  uptime: number;
  errors: number;
  warnings: number;
}

interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

class MonitoringService {
  private metrics: Map<string, HealthMetric> = new Map();
  private alerts: Alert[] = [];
  private startTime = Date.now();
  private errorCount = 0;
  private requestCount = 0;
  private totalResponseTime = 0;

  private thresholds = {
    latency: 500, // ms
    errorRate: 5, // %
    cpuUsage: 80, // %
    memoryUsage: 85, // %
    diskUsage: 90, // %
    databaseConnections: 15, // connections
  };

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Inicializa monitoramento
   */
  private initializeMonitoring(): void {
    console.log('[Monitoring] Inicializando serviço de monitoramento...');

    // Inicializar métricas
    this.metrics.set('latency', {
      name: 'Latência',
      status: 'healthy',
      value: 0,
      threshold: this.thresholds.latency,
      timestamp: Date.now(),
    });

    this.metrics.set('errorRate', {
      name: 'Taxa de Erro',
      status: 'healthy',
      value: 0,
      threshold: this.thresholds.errorRate,
      timestamp: Date.now(),
    });

    this.metrics.set('cpuUsage', {
      name: 'Uso de CPU',
      status: 'healthy',
      value: Math.random() * 50,
      threshold: this.thresholds.cpuUsage,
      timestamp: Date.now(),
    });

    this.metrics.set('memoryUsage', {
      name: 'Uso de Memória',
      status: 'healthy',
      value: Math.random() * 60,
      threshold: this.thresholds.memoryUsage,
      timestamp: Date.now(),
    });

    this.metrics.set('databaseConnections', {
      name: 'Conexões BD',
      status: 'healthy',
      value: Math.floor(Math.random() * 10),
      threshold: this.thresholds.databaseConnections,
      timestamp: Date.now(),
    });

    console.log('[Monitoring] Monitoramento inicializado com 5 métricas');
  }

  /**
   * Registra requisição
   */
  recordRequest(responseTime: number, success: boolean): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;

    if (!success) {
      this.errorCount++;
    }

    // Atualizar latência
    const avgLatency = this.totalResponseTime / this.requestCount;
    this.updateMetric('latency', avgLatency);

    // Atualizar taxa de erro
    const errorRate = (this.errorCount / this.requestCount) * 100;
    this.updateMetric('errorRate', errorRate);

    // Verificar alertas
    this.checkThresholds();
  }

  /**
   * Atualiza métrica
   */
  private updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name);
    if (!metric) return;

    metric.value = parseFloat(value.toFixed(2));
    metric.timestamp = Date.now();

    // Determinar status
    if (value > metric.threshold * 1.5) {
      metric.status = 'critical';
    } else if (value > metric.threshold) {
      metric.status = 'warning';
    } else {
      metric.status = 'healthy';
    }
  }

  /**
   * Verifica thresholds e cria alertas
   */
  private checkThresholds(): void {
    const entries = Array.from(this.metrics.entries());
    for (const [name, metric] of entries) {
      if (metric.status === 'critical' && !this.hasActiveAlert(name, 'critical')) {
        this.createAlert(
          'performance',
          'critical',
          `${metric.name} crítica: ${metric.value.toFixed(2)} (limite: ${metric.threshold})`
        );
      } else if (metric.status === 'warning' && !this.hasActiveAlert(name, 'warning')) {
        this.createAlert(
          'performance',
          'medium',
          `${metric.name} acima do normal: ${metric.value.toFixed(2)} (limite: ${metric.threshold})`
        );
      }
    }
  }

  /**
   * Verifica se há alerta ativo
   */
  private hasActiveAlert(name: string, severity: string): boolean {
    return this.alerts.some(
      a => !a.resolved && a.message.includes(name) && a.severity === severity
    );
  }

  /**
   * Cria alerta
   */
  private createAlert(
    type: 'performance' | 'error' | 'security' | 'resource',
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string
  ): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    console.log(`[Alert] [${severity.toUpperCase()}] ${message}`);

    // Enviar para Sentry se crítico
    if (severity === 'critical') {
      this.sendToSentry(message, severity);
    }
  }

  /**
   * Envia erro para Sentry
   */
  private sendToSentry(message: string, severity: string): void {
    console.log(`[Sentry] Enviando erro crítico: ${message}`);

    // Simular envio para Sentry
    // Em produção, usar SDK oficial do Sentry
    const sentryPayload = {
      message,
      level: severity,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      tags: {
        service: 'raphaguru',
        type: 'monitoring',
      },
    };

    console.log('[Sentry] Payload:', JSON.stringify(sentryPayload, null, 2));
  }

  /**
   * Obtém relatório de saúde
   */
  getHealthReport(): HealthReport {
    const metrics = Array.from(this.metrics.values() as IterableIterator<HealthMetric>);
    const overallStatus =
      metrics.some(m => m.status === 'critical')
        ? 'critical'
        : metrics.some(m => m.status === 'warning')
          ? 'warning'
          : 'healthy';

    const uptime = Date.now() - this.startTime;
    const errors = this.errorCount;
    const warnings = this.alerts.filter(a => a.severity === 'medium').length;

    return {
      timestamp: Date.now(),
      overallStatus,
      metrics,
      uptime,
      errors,
      warnings,
    };
  }

  /**
   * Obtém alertas
   */
  getAlerts(resolved: boolean = false): Alert[] {
    return this.alerts.filter(a => a.resolved === resolved);
  }

  /**
   * Resolve alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`[Alert] Alerta resolvido: ${alertId}`);
    }
  }

  /**
   * Obtém estatísticas
   */
  getStats(): {
    uptime: string;
    requests: number;
    errors: number;
    errorRate: string;
    avgLatency: string;
    activeAlerts: number;
  } {
    const uptime = this.formatUptime(Date.now() - this.startTime);
    const errorRate = ((this.errorCount / this.requestCount) * 100).toFixed(2);
    const avgLatency = (this.totalResponseTime / this.requestCount).toFixed(2);
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;

    return {
      uptime,
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: `${errorRate}%`,
      avgLatency: `${avgLatency}ms`,
      activeAlerts,
    };
  }

  /**
   * Formata uptime
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Simula carga para teste
   */
  simulateLoad(duration: number = 5000): void {
    console.log('[Monitoring] Iniciando simulação de carga...');

    const interval = setInterval(() => {
      const responseTime = Math.random() * 300 + 50;
      const success = Math.random() > 0.05; // 95% de sucesso

      this.recordRequest(responseTime, success);

      // Atualizar CPU e memória
      this.updateMetric('cpuUsage', Math.random() * 80);
      this.updateMetric('memoryUsage', Math.random() * 75);
      this.updateMetric('databaseConnections', Math.floor(Math.random() * 12));
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      console.log('[Monitoring] Simulação de carga concluída');
    }, duration);
  }

  /**
   * Obtém diagnóstico completo
   */
  getDiagnostics(): {
    health: HealthReport;
    stats: { uptime: string; requests: number; errors: number; errorRate: string; avgLatency: string; activeAlerts: number };
    activeAlerts: Alert[];
    recommendations: string[];
  } {
    const health = this.getHealthReport();
    const stats = this.getStats();
    const activeAlerts = this.getAlerts(false);
    const recommendations: string[] = [];

    // Gerar recomendações baseado em métricas
    if (health.overallStatus === 'critical') {
      recommendations.push('🔴 Sistema em estado crítico. Ação imediata necessária.');
    }

    if (parseFloat(stats.errorRate) > 5) {
      recommendations.push(`⚠️ Taxa de erro alta: ${stats.errorRate}. Investigar logs de erro.`);
    }

    if (parseFloat(stats.avgLatency) > 500) {
      recommendations.push(
        `⚠️ Latência alta: ${stats.avgLatency}. Considere otimizações de database.`
      );
    }

    if (activeAlerts.length > 0) {
      recommendations.push(`⚠️ ${activeAlerts.length} alertas ativos. Revisar e resolver.`);
    }

    if (health.overallStatus === 'healthy') {
      recommendations.push('✅ Sistema operando normalmente.');
    }

    return {
      health,
      stats,
      activeAlerts,
      recommendations,
    };
  }
}

export const monitoringService = new MonitoringService();
export type { HealthMetric, HealthReport, Alert };
