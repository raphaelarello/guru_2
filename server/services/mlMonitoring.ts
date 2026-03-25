// Sistema de Logging e Monitoramento de Performance ML
// Rastreia acertos/erros, ajusta pesos automaticamente

export interface MLPerformanceLog {
  id: string;
  timestamp: Date;
  recomendacaoId: string;
  artilheiro: string;
  oddRecomendada: number;
  confianca: number;
  resultado: 'acerto' | 'erro' | 'pendente';
  lucro: number;
  motivos: string[];
}

export interface MLMetricsSnapshot {
  timestamp: Date;
  totalRecomendacoes: number;
  acertos: number;
  erros: number;
  pendentes: number;
  taxaAcerto: number;
  lucroTotal: number;
  roiMedio: number;
  confiancaMedia: number;
  pesosPorFator: Record<string, number>;
}

class MLMonitoring {
  private logs: MLPerformanceLog[] = [];
  private metricsHistory: MLMetricsSnapshot[] = [];
  private maxLogs = 10000; // Manter últimos 10.000 registros

  // Registrar resultado de recomendação
  logRecommendation(log: MLPerformanceLog) {
    this.logs.push({
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    });

    // Manter limite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    console.log(`[MLMonitoring] Recomendação registrada: ${log.artilheiro} - ${log.resultado}`);
  }

  // Calcular métricas atuais
  calculateMetrics(): MLMetricsSnapshot {
    const acertos = this.logs.filter(l => l.resultado === 'acerto').length;
    const erros = this.logs.filter(l => l.resultado === 'erro').length;
    const pendentes = this.logs.filter(l => l.resultado === 'pendente').length;
    const total = this.logs.length;

    const taxaAcerto = total > 0 ? (acertos / total) * 100 : 0;
    const lucroTotal = this.logs.reduce((sum, l) => sum + l.lucro, 0);
    const roiMedio = total > 0 ? lucroTotal / total : 0;
    const confiancaMedia = total > 0 ? this.logs.reduce((sum, l) => sum + l.confianca, 0) / total : 0;

    const snapshot: MLMetricsSnapshot = {
      timestamp: new Date(),
      totalRecomendacoes: total,
      acertos,
      erros,
      pendentes,
      taxaAcerto,
      lucroTotal,
      roiMedio,
      confiancaMedia,
      pesosPorFator: this.calculateWeights(),
    };

    this.metricsHistory.push(snapshot);

    // Manter histórico de últimas 1000 snapshots
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }

    return snapshot;
  }

  // Calcular pesos dos fatores baseado em performance
  private calculateWeights(): Record<string, number> {
    if (this.logs.length === 0) {
      return {
        forma: 0.3,
        mediaGols: 0.2,
        odds: 0.2,
        assistencias: 0.15,
        consistencia: 0.15,
      };
    }

    // Agrupar por motivo e calcular taxa de acerto
    const motivoStats: Record<string, { acertos: number; total: number }> = {};

    for (const log of this.logs) {
      for (const motivo of log.motivos) {
        if (!motivoStats[motivo]) {
          motivoStats[motivo] = { acertos: 0, total: 0 };
        }
        motivoStats[motivo].total++;
        if (log.resultado === 'acerto') {
          motivoStats[motivo].acertos++;
        }
      }
    }

    // Calcular pesos normalizados
    const weights: Record<string, number> = {};
    let totalTaxa = 0;

    for (const [motivo, stats] of Object.entries(motivoStats)) {
      const taxa = stats.total > 0 ? stats.acertos / stats.total : 0;
      weights[motivo] = taxa;
      totalTaxa += taxa;
    }

    // Normalizar para somar 1
    if (totalTaxa > 0) {
      for (const motivo in weights) {
        weights[motivo] = weights[motivo] / totalTaxa;
      }
    }

    return weights;
  }

  // Obter recomendações com melhor performance
  getTopPerformingRecommendations(limit: number = 10) {
    const acertos = this.logs.filter(l => l.resultado === 'acerto');

    return acertos
      .sort((a, b) => b.confianca - a.confianca)
      .slice(0, limit)
      .map(log => ({
        artilheiro: log.artilheiro,
        confianca: log.confianca,
        odd: log.oddRecomendada,
        lucro: log.lucro,
        motivos: log.motivos,
      }));
  }

  // Obter recomendações com pior performance
  getWorstPerformingRecommendations(limit: number = 10) {
    const erros = this.logs.filter(l => l.resultado === 'erro');

    return erros
      .sort((a, b) => a.confianca - b.confianca)
      .slice(0, limit)
      .map(log => ({
        artilheiro: log.artilheiro,
        confianca: log.confianca,
        odd: log.oddRecomendada,
        lucro: log.lucro,
        motivos: log.motivos,
      }));
  }

  // Análise de tendências
  analyzeTrends(days: number = 7) {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(l => l.timestamp > cutoffTime);

    if (recentLogs.length === 0) {
      return {
        periodo: `Últimos ${days} dias`,
        totalRecomendacoes: 0,
        tendencia: 'sem dados',
        mudancaTaxaAcerto: 0,
      };
    }

    // Dividir em duas metades
    const midpoint = Math.floor(recentLogs.length / 2);
    const primeira = recentLogs.slice(0, midpoint);
    const segunda = recentLogs.slice(midpoint);

    const taxaPrimeira = primeira.filter(l => l.resultado === 'acerto').length / primeira.length;
    const taxaSegunda = segunda.filter(l => l.resultado === 'acerto').length / segunda.length;
    const mudanca = ((taxaSegunda - taxaPrimeira) / taxaPrimeira) * 100;

    return {
      periodo: `Últimos ${days} dias`,
      totalRecomendacoes: recentLogs.length,
      tendencia: mudanca > 5 ? 'melhora' : mudanca < -5 ? 'piora' : 'estável',
      mudancaTaxaAcerto: Math.round(mudanca * 100) / 100,
      taxaPrimeira: Math.round(taxaPrimeira * 10000) / 100,
      taxaSegunda: Math.round(taxaSegunda * 10000) / 100,
    };
  }

  // Gerar relatório completo
  generateReport() {
    const metrics = this.calculateMetrics();
    const topPerforming = this.getTopPerformingRecommendations(5);
    const worstPerforming = this.getWorstPerformingRecommendations(5);
    const trends = this.analyzeTrends(7);

    return {
      dataRelatorio: new Date().toISOString(),
      metricas: metrics,
      topPerforming,
      worstPerforming,
      trends,
      historicoMetricas: this.metricsHistory.slice(-30), // Últimas 30 snapshots
    };
  }

  // Exportar logs para análise
  exportLogs(formato: 'json' | 'csv' = 'json') {
    if (formato === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV
    const headers = ['timestamp', 'artilheiro', 'oddRecomendada', 'confianca', 'resultado', 'lucro'];
    const rows = this.logs.map(log =>
      [
        log.timestamp.toISOString(),
        log.artilheiro,
        log.oddRecomendada,
        log.confianca,
        log.resultado,
        log.lucro,
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  // Limpar logs antigos
  cleanOldLogs(daysToKeep: number = 30) {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const beforeCount = this.logs.length;

    this.logs = this.logs.filter(l => l.timestamp > cutoffTime);

    console.log(
      `[MLMonitoring] Limpeza de logs: ${beforeCount} -> ${this.logs.length} (removidos ${beforeCount - this.logs.length})`
    );
  }

  // Obter estatísticas por artilheiro
  getArtilheiroStats(artilheiro: string) {
    const logs = this.logs.filter(l => l.artilheiro === artilheiro);

    if (logs.length === 0) {
      return null;
    }

    const acertos = logs.filter(l => l.resultado === 'acerto').length;
    const taxaAcerto = (acertos / logs.length) * 100;
    const lucroTotal = logs.reduce((sum, l) => sum + l.lucro, 0);
    const confiancaMedia = logs.reduce((sum, l) => sum + l.confianca, 0) / logs.length;

    return {
      artilheiro,
      totalRecomendacoes: logs.length,
      acertos,
      erros: logs.length - acertos,
      taxaAcerto: Math.round(taxaAcerto * 100) / 100,
      lucroTotal: Math.round(lucroTotal * 100) / 100,
      confiancaMedia: Math.round(confiancaMedia * 100) / 100,
      oddMedia: Math.round((logs.reduce((sum, l) => sum + l.oddRecomendada, 0) / logs.length) * 100) / 100,
    };
  }
}

// Instância singleton
let monitoringInstance: MLMonitoring | null = null;

export function initMLMonitoring(): MLMonitoring {
  if (!monitoringInstance) {
    monitoringInstance = new MLMonitoring();
  }
  return monitoringInstance;
}

export function getMLMonitoring(): MLMonitoring {
  if (!monitoringInstance) {
    monitoringInstance = new MLMonitoring();
  }
  return monitoringInstance;
}
