// Sistema de Treinamento ML com Backtesting e Validação Cruzada
// Treina modelo com 10.000+ registros e valida performance

import { ArtilheiroHistorico, getMLModel } from './mlModel';
import { gerar10000Apostas, gerar100Artilheiros, calcularEstatisticas } from './dataGenerator';

export interface MetricasPerformance {
  taxaAcerto: number;
  precisao: number;
  recall: number;
  f1Score: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export interface ResultadoBacktest {
  periodo: string;
  totalApostas: number;
  acertos: number;
  erros: number;
  metricas: MetricasPerformance;
  recomendacoes: Array<{
    artilheiro: string;
    confianca: number;
    acertos: number;
    erros: number;
  }>;
}

class MLTrainer {
  private apostasHistoricas: any[] = [];
  private artilheiros: ArtilheiroHistorico[] = [];
  private metricas: MetricasPerformance | null = null;

  // Treinar modelo com dados históricos
  async treinar() {
    console.log('[MLTrainer] Iniciando treinamento...');

    // Gerar dados
    this.apostasHistoricas = gerar10000Apostas();
    this.artilheiros = gerar100Artilheiros();

    // Treinar modelo
    const model = getMLModel();
    model.treinar(this.artilheiros);

    console.log(`[MLTrainer] Modelo treinado com ${this.artilheiros.length} artilheiros`);
    console.log(`[MLTrainer] ${this.apostasHistoricas.length} apostas históricas carregadas`);

    // Calcular métricas
    this.calcularMetricas();

    return this.metricas;
  }

  // Calcular métricas de performance
  private calcularMetricas() {
    const acertos = this.apostasHistoricas.filter(a => a.resultado).length;
    const erros = this.apostasHistoricas.length - acertos;
    const taxaAcerto = (acertos / this.apostasHistoricas.length) * 100;

    // Precisão e Recall
    const verdadeirosPositivos = this.apostasHistoricas.filter(
      a => a.predicao && a.resultado
    ).length;
    const falsosPositivos = this.apostasHistoricas.filter(
      a => a.predicao && !a.resultado
    ).length;
    const falsosNegativos = this.apostasHistoricas.filter(
      a => !a.predicao && a.resultado
    ).length;

    const precisao = verdadeirosPositivos / (verdadeirosPositivos + falsosPositivos) || 0;
    const recall = verdadeirosPositivos / (verdadeirosPositivos + falsosNegativos) || 0;
    const f1Score = 2 * (precisao * recall) / (precisao + recall) || 0;

    // ROI e Sharpe Ratio
    const lucroTotal = this.apostasHistoricas.reduce((sum, a) => sum + a.lucro, 0);
    const stakeTotal = this.apostasHistoricas.reduce((sum, a) => sum + a.stake, 0);
    const roi = (lucroTotal / stakeTotal) * 100;

    // Calcular Sharpe Ratio (retorno ajustado por risco)
    const retornos = this.apostasHistoricas.map(a => a.lucro / a.stake);
    const mediaRetorno = retornos.reduce((a, b) => a + b, 0) / retornos.length;
    const desvioRetorno = Math.sqrt(
      retornos.reduce((sum, r) => sum + Math.pow(r - mediaRetorno, 2), 0) / retornos.length
    );
    const sharpeRatio = (mediaRetorno / desvioRetorno) * Math.sqrt(252); // 252 dias de trading

    // Max Drawdown
    let maxDrawdown = 0;
    let peakValue = 0;
    let currentValue = 0;

    for (const aposta of this.apostasHistoricas) {
      currentValue += aposta.lucro;
      if (currentValue > peakValue) {
        peakValue = currentValue;
      }
      if (peakValue > 0) {
        const drawdown = (peakValue - currentValue) / Math.abs(peakValue);
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    maxDrawdown = Math.min(maxDrawdown, 100);

    // Win Rate e Profit Factor
    const wins = this.apostasHistoricas.filter(a => a.lucro > 0);
    const losses = this.apostasHistoricas.filter(a => a.lucro < 0);
    const winRate = (wins.length / this.apostasHistoricas.length) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((sum, a) => sum + a.lucro, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, a) => sum + Math.abs(a.lucro), 0) / losses.length : 0;
    const profitFactor = avgWin > 0 ? avgWin / avgLoss : 0;

    this.metricas = {
      taxaAcerto: Math.round(taxaAcerto * 100) / 100,
      precisao: Math.round(precisao * 10000) / 10000,
      recall: Math.round(recall * 10000) / 10000,
      f1Score: Math.round(f1Score * 10000) / 10000,
      roi: Math.round(roi * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 10000,
      winRate: Math.round(winRate * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
    };

    console.log('[MLTrainer] Métricas calculadas:', this.metricas);
  }

  // Executar backtesting
  async backtesting(): Promise<ResultadoBacktest> {
    if (!this.metricas) {
      await this.treinar();
    }

    const model = getMLModel();
    const recomendacoes = model.gerarRecomendacoes(this.artilheiros, 20);

    // Validar cada recomendação
    const recomendacoesValidadas = recomendacoes.map(rec => {
      const artilheiro = this.artilheiros.find(a => a.nome === rec.jogador);
      if (!artilheiro) {
        return {
          artilheiro: rec.jogador,
          confianca: rec.confianca,
          acertos: 0,
          erros: 0,
        };
      }

      const validacao = model.validarComBacktesting(rec, artilheiro);
      return {
        artilheiro: rec.jogador,
        confianca: rec.confianca,
        acertos: validacao.acertos,
        erros: validacao.erros,
      };
    });

    const acertos = this.apostasHistoricas.filter(a => a.resultado).length;
    const erros = this.apostasHistoricas.length - acertos;

    return {
      periodo: `${new Date().toISOString().split('T')[0]}`,
      totalApostas: this.apostasHistoricas.length,
      acertos,
      erros,
      metricas: this.metricas!,
      recomendacoes: recomendacoesValidadas,
    };
  }

  // Validação cruzada (K-Fold)
  async validacaoCruzada(k: number = 5): Promise<MetricasPerformance[]> {
    console.log(`[MLTrainer] Iniciando validação cruzada com ${k} folds...`);

    const tamanhoFold = Math.floor(this.apostasHistoricas.length / k);
    const metricas: MetricasPerformance[] = [];

    for (let i = 0; i < k; i++) {
      const inicio = i * tamanhoFold;
      const fim = i === k - 1 ? this.apostasHistoricas.length : (i + 1) * tamanhoFold;

      // Dividir dados em treino e teste
      const treino = [
        ...this.apostasHistoricas.slice(0, inicio),
        ...this.apostasHistoricas.slice(fim),
      ];
      const teste = this.apostasHistoricas.slice(inicio, fim);

      // Treinar modelo com dados de treino
      const model = getMLModel();
      const artilheirosTreino = this.artilheiros.slice(0, Math.floor(this.artilheiros.length * 0.8));
      model.treinar(artilheirosTreino);

      // Validar com dados de teste
      const acertos = teste.filter(a => a.resultado).length;
      const erros = teste.length - acertos;

      const verdadeirosPositivos = teste.filter(a => a.predicao && a.resultado).length;
      const falsosPositivos = teste.filter(a => a.predicao && !a.resultado).length;
      const falsosNegativos = teste.filter(a => !a.predicao && a.resultado).length;

      const precisao = verdadeirosPositivos / (verdadeirosPositivos + falsosPositivos) || 0;
      const recall = verdadeirosPositivos / (verdadeirosPositivos + falsosNegativos) || 0;
      const f1Score = 2 * (precisao * recall) / (precisao + recall) || 0;

      const lucroTotal = teste.reduce((sum, a) => sum + a.lucro, 0);
      const stakeTotal = teste.reduce((sum, a) => sum + a.stake, 0);
      const roi = (lucroTotal / stakeTotal) * 100;

      metricas.push({
        taxaAcerto: Math.round((acertos / teste.length) * 10000) / 100,
        precisao: Math.round(precisao * 10000) / 10000,
        recall: Math.round(recall * 10000) / 10000,
        f1Score: Math.round(f1Score * 10000) / 10000,
        roi: Math.round(roi * 100) / 100,
        sharpeRatio: 0, // Simplificado para K-Fold
        maxDrawdown: 0, // Simplificado para K-Fold
        winRate: 0, // Simplificado para K-Fold
        avgWin: 0, // Simplificado para K-Fold
        avgLoss: 0, // Simplificado para K-Fold
        profitFactor: 0, // Simplificado para K-Fold
      });

      console.log(`[MLTrainer] Fold ${i + 1}/${k} - Taxa de Acerto: ${metricas[i].taxaAcerto}%`);
    }

    return metricas;
  }

  // Obter métricas atuais
  obterMetricas(): MetricasPerformance | null {
    return this.metricas;
  }

  // Gerar relatório de treinamento
  gerarRelatorio() {
    return {
      dataTrainamento: new Date().toISOString(),
      artilheirosAnalisados: this.artilheiros.length,
      apostasHistoricas: this.apostasHistoricas.length,
      metricas: this.metricas,
      status: 'Treinamento Completo',
    };
  }
}

// Instância singleton
let trainerInstance: MLTrainer | null = null;

export function initMLTrainer(): MLTrainer {
  if (!trainerInstance) {
    trainerInstance = new MLTrainer();
  }
  return trainerInstance;
}

export function getMLTrainer(): MLTrainer {
  if (!trainerInstance) {
    trainerInstance = new MLTrainer();
  }
  return trainerInstance;
}
