import { describe, it, expect, beforeAll } from 'vitest';
import { initMLTrainer, getMLTrainer } from './services/mlTrainer';

describe('ML Trainer', () => {
  let trainer: ReturnType<typeof initMLTrainer>;

  beforeAll(() => {
    trainer = initMLTrainer();
  });

  describe('Treinamento do Modelo', () => {
    it('deve treinar modelo com sucesso', async () => {
      const metricas = await trainer.treinar();

      expect(metricas).toBeDefined();
      expect(metricas?.taxaAcerto).toBeGreaterThan(30);
      expect(metricas?.taxaAcerto).toBeLessThan(70);
    });

    it('deve calcular precisão e recall', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.precisao).toBeGreaterThanOrEqual(0);
      expect(metricas?.precisao).toBeLessThanOrEqual(1);
      expect(metricas?.recall).toBeGreaterThanOrEqual(0);
      expect(metricas?.recall).toBeLessThanOrEqual(1);
    });

    it('deve calcular F1 Score', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.f1Score).toBeGreaterThanOrEqual(0);
      expect(metricas?.f1Score).toBeLessThanOrEqual(1);
    });

    it('deve calcular ROI', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.roi).toBeDefined();
      expect(typeof metricas?.roi).toBe('number');
    });

    it('deve calcular Sharpe Ratio', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.sharpeRatio).toBeDefined();
      expect(typeof metricas?.sharpeRatio).toBe('number');
    });

    it('deve calcular Max Drawdown', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(metricas?.maxDrawdown).toBeLessThanOrEqual(100);
    });

    it('deve calcular Win Rate', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.winRate).toBeGreaterThanOrEqual(0);
      expect(metricas?.winRate).toBeLessThanOrEqual(100);
    });

    it('deve calcular Profit Factor', async () => {
      const metricas = await trainer.treinar();

      expect(metricas?.profitFactor).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Backtesting', () => {
    it('deve executar backtesting com sucesso', async () => {
      const resultado = await trainer.backtesting();

      expect(resultado).toBeDefined();
      expect(resultado.totalApostas).toBeGreaterThan(0);
      expect(resultado.acertos + resultado.erros).toBe(resultado.totalApostas);
      expect(resultado.metricas).toBeDefined();
      expect(resultado.recomendacoes).toHaveLength(20);
    });

    it('deve ter recomendações com confiança válida', async () => {
      const resultado = await trainer.backtesting();

      for (const rec of resultado.recomendacoes) {
        expect(rec.confianca).toBeGreaterThanOrEqual(0);
        expect(rec.confianca).toBeLessThanOrEqual(100);
        expect(rec.acertos + rec.erros).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Validação Cruzada', () => {
    it('deve executar validação cruzada 5-fold', async () => {
      const metricas = await trainer.validacaoCruzada(5);

      expect(metricas).toHaveLength(5);

      for (const metrica of metricas) {
        expect(metrica.taxaAcerto).toBeGreaterThan(0);
        expect(metrica.taxaAcerto).toBeLessThan(100);
        expect(metrica.precisao).toBeGreaterThanOrEqual(0);
        expect(metrica.recall).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve ter consistência entre folds', async () => {
      const metricas = await trainer.validacaoCruzada(5);

      const taxas = metricas.map(m => m.taxaAcerto);
      const media = taxas.reduce((a, b) => a + b, 0) / taxas.length;
      const desvio = Math.sqrt(
        taxas.reduce((sum, t) => sum + Math.pow(t - media, 2), 0) / taxas.length
      );

      // Desvio não deve ser muito alto (consistência)
      expect(desvio).toBeLessThan(20);
    });
  });

  describe('Relatório de Treinamento', () => {
    it('deve gerar relatório completo', async () => {
      await trainer.treinar();
      const relatorio = trainer.gerarRelatorio();

      expect(relatorio).toBeDefined();
      expect(relatorio.dataTrainamento).toBeDefined();
      expect(relatorio.artilheirosAnalisados).toBeGreaterThan(0);
      expect(relatorio.apostasHistoricas).toBeGreaterThan(0);
      expect(relatorio.metricas).toBeDefined();
      expect(relatorio.status).toBe('Treinamento Completo');
    });
  });

  describe('Obter Métricas', () => {
    it('deve obter métricas após treinamento', async () => {
      await trainer.treinar();
      const metricas = trainer.obterMetricas();

      expect(metricas).toBeDefined();
      expect(metricas?.taxaAcerto).toBeGreaterThan(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('deve retornar mesma instância', () => {
      const trainer1 = getMLTrainer();
      const trainer2 = getMLTrainer();

      expect(trainer1).toBe(trainer2);
    });
  });
});
