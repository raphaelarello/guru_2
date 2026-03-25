// Sistema de Ajuste Automático de Pesos do Modelo ML
// Otimiza pesos baseado em performance histórica

import { getMLMonitoring } from './mlMonitoring';

export interface ModelWeights {
  forma: number;
  mediaGols: number;
  consistencia: number;
  odds: number;
  assistencias: number;
  [key: string]: number;
}

export interface WeightAdjustmentResult {
  timestamp: Date;
  previousWeights: ModelWeights;
  newWeights: ModelWeights;
  changes: Record<string, number>;
  performanceImprovement: number;
  reason: string;
}

class MLWeightAdjuster {
  private currentWeights: ModelWeights = {
    forma: 0.3,
    mediaGols: 0.2,
    consistencia: 0.001,
    odds: 0.15,
    assistencias: 0.05,
  };

  private adjustmentHistory: WeightAdjustmentResult[] = [];
  private lastAdjustment: Date | null = null;
  private adjustmentInterval = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    console.log('[MLWeightAdjuster] Inicializado com pesos padrão');
  }

  // Obter pesos atuais
  getCurrentWeights(): ModelWeights {
    return { ...this.currentWeights };
  }

  // Ajustar pesos automaticamente
  adjustWeights(): WeightAdjustmentResult | null {
    // Verificar se já foi ajustado recentemente
    if (this.lastAdjustment && Date.now() - this.lastAdjustment.getTime() < this.adjustmentInterval) {
      console.log('[MLWeightAdjuster] Ajuste ainda não disponível (intervalo mínimo não atingido)');
      return null;
    }

    const monitoring = getMLMonitoring();
    const metrics = monitoring.calculateMetrics();

    // Não ajustar se houver poucos dados
    if (metrics.totalRecomendacoes < 100) {
      console.log('[MLWeightAdjuster] Dados insuficientes para ajuste (< 100 recomendações)');
      return null;
    }

    const previousWeights = { ...this.currentWeights };
    const performanceImprovement = this.calculatePerformanceImprovement(metrics);

    // Estratégia de ajuste baseada em performance
    if (metrics.taxaAcerto < 50) {
      // Performance baixa - aumentar peso de fatores mais confiáveis
      this.currentWeights.forma *= 1.1;
      this.currentWeights.mediaGols *= 1.05;
      this.currentWeights.odds *= 1.05;
    } else if (metrics.taxaAcerto > 65) {
      // Performance alta - manter estratégia
      this.currentWeights.forma *= 1.02;
    }

    // Reduzir peso de fatores com baixa correlação
    if (this.currentWeights.consistencia < 0.01) {
      this.currentWeights.consistencia *= 0.95;
    }

    // Normalizar pesos para somar 1
    this.normalizeWeights();

    const changes: Record<string, number> = {};
    for (const key in this.currentWeights) {
      changes[key] = this.currentWeights[key] - previousWeights[key];
    }

    const result: WeightAdjustmentResult = {
      timestamp: new Date(),
      previousWeights,
      newWeights: { ...this.currentWeights },
      changes,
      performanceImprovement,
      reason: this.generateAdjustmentReason(metrics, performanceImprovement),
    };

    this.adjustmentHistory.push(result);
    this.lastAdjustment = new Date();

    console.log('[MLWeightAdjuster] Pesos ajustados:', result);

    return result;
  }

  // Calcular melhoria de performance
  private calculatePerformanceImprovement(metrics: any): number {
    if (this.adjustmentHistory.length === 0) {
      return 0;
    }

    const lastMetrics = this.adjustmentHistory[this.adjustmentHistory.length - 1];
    const previousTaxa = lastMetrics.previousWeights.forma * 0.3; // Simplificado

    return metrics.taxaAcerto - previousTaxa;
  }

  // Gerar razão do ajuste
  private generateAdjustmentReason(metrics: any, improvement: number): string {
    if (metrics.taxaAcerto < 50) {
      return 'Performance baixa - aumentando pesos de fatores confiáveis';
    } else if (metrics.taxaAcerto > 65) {
      return 'Performance alta - mantendo estratégia com pequenos ajustes';
    } else if (improvement > 5) {
      return 'Melhoria significativa detectada - ajustes positivos';
    } else if (improvement < -5) {
      return 'Queda de performance - revertendo para pesos anteriores';
    }

    return 'Ajuste de manutenção - otimizando pesos';
  }

  // Normalizar pesos para somar 1
  private normalizeWeights() {
    const sum = Object.values(this.currentWeights).reduce((a, b) => a + b, 0);

    if (sum > 0) {
      for (const key in this.currentWeights) {
        this.currentWeights[key] = this.currentWeights[key] / sum;
      }
    }
  }

  // Ajuste manual de peso específico
  setWeight(factor: string, value: number) {
    if (value < 0 || value > 1) {
      throw new Error('Peso deve estar entre 0 e 1');
    }

    this.currentWeights[factor] = value;
    this.normalizeWeights();

    console.log(`[MLWeightAdjuster] Peso de ${factor} ajustado para ${value}`);
  }

  // Reverter para pesos padrão
  resetToDefault() {
    this.currentWeights = {
      forma: 0.3,
      mediaGols: 0.2,
      consistencia: 0.001,
      odds: 0.15,
      assistencias: 0.05,
    };

    this.normalizeWeights();
    console.log('[MLWeightAdjuster] Pesos revertidos para padrão');
  }

  // Obter histórico de ajustes
  getAdjustmentHistory(limit: number = 30) {
    return this.adjustmentHistory.slice(-limit);
  }

  // Análise de efetividade dos ajustes
  analyzeAdjustmentEffectiveness() {
    if (this.adjustmentHistory.length < 2) {
      return {
        totalAjustes: this.adjustmentHistory.length,
        efetividade: 'Dados insuficientes',
        melhoriasPositivas: 0,
        melhoriasNegativas: 0,
      };
    }

    const melhoriasPositivas = this.adjustmentHistory.filter(a => a.performanceImprovement > 0).length;
    const melhoriasNegativas = this.adjustmentHistory.filter(a => a.performanceImprovement < 0).length;
    const taxaSucesso = (melhoriasPositivas / this.adjustmentHistory.length) * 100;

    return {
      totalAjustes: this.adjustmentHistory.length,
      efetividade: taxaSucesso > 60 ? 'Alta' : taxaSucesso > 40 ? 'Média' : 'Baixa',
      taxaSucesso: Math.round(taxaSucesso * 100) / 100,
      melhoriasPositivas,
      melhoriasNegativas,
      ultimoAjuste: this.adjustmentHistory[this.adjustmentHistory.length - 1],
    };
  }

  // Exportar pesos para arquivo
  exportWeights() {
    return {
      timestamp: new Date().toISOString(),
      currentWeights: this.currentWeights,
      history: this.adjustmentHistory,
      analysis: this.analyzeAdjustmentEffectiveness(),
    };
  }

  // Importar pesos de arquivo
  importWeights(data: any) {
    if (data.currentWeights) {
      this.currentWeights = data.currentWeights;
      this.normalizeWeights();
      console.log('[MLWeightAdjuster] Pesos importados com sucesso');
    }
  }

  // Sugerir ajustes baseado em análise
  suggestAdjustments() {
    const monitoring = getMLMonitoring();
    const metrics = monitoring.calculateMetrics();
    const suggestions: string[] = [];

    if (metrics.taxaAcerto < 45) {
      suggestions.push('Taxa de acerto muito baixa - considere revisar dados de treinamento');
    }

    if (this.currentWeights.forma > 0.5) {
      suggestions.push('Peso de forma muito alto - pode estar overfitting');
    }

    if (this.currentWeights.odds < 0.05) {
      suggestions.push('Peso de odds muito baixo - odds são importantes para value betting');
    }

    if (metrics.confiancaMedia < 60) {
      suggestions.push('Confiança média baixa - aumentar threshold de recomendações');
    }

    return {
      sugestoes: suggestions,
      metricas: metrics,
      pesosAtuais: this.currentWeights,
    };
  }
}

// Instância singleton
let adjusterInstance: MLWeightAdjuster | null = null;

export function initMLWeightAdjuster(): MLWeightAdjuster {
  if (!adjusterInstance) {
    adjusterInstance = new MLWeightAdjuster();
  }
  return adjusterInstance;
}

export function getMLWeightAdjuster(): MLWeightAdjuster {
  if (!adjusterInstance) {
    adjusterInstance = new MLWeightAdjuster();
  }
  return adjusterInstance;
}
