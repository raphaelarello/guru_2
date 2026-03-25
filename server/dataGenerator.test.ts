import { describe, it, expect, beforeAll } from 'vitest';
import {
  gerar10000Apostas,
  gerar100Artilheiros,
  calcularEstatisticas,
  validarDados,
  gerarArtilheiroHistorico,
} from './services/dataGenerator';
import { initMLModel, getMLModel, gerarDadosTreinamento } from './services/mlModel';

describe('Data Generator', () => {
  describe('Geração de Dados', () => {
    it('deve gerar 10.000 apostas históricas', () => {
      const apostas = gerar10000Apostas();
      expect(apostas).toHaveLength(10000);
      expect(apostas[0]).toHaveProperty('id');
      expect(apostas[0]).toHaveProperty('resultado');
      expect(apostas[0]).toHaveProperty('oddApostada');
    });

    it('deve gerar 100 artilheiros com dados realistas', () => {
      const artilheiros = gerar100Artilheiros();
      expect(artilheiros).toHaveLength(100);

      for (const art of artilheiros) {
        expect(art.forma).toBeGreaterThanOrEqual(20);
        expect(art.forma).toBeLessThanOrEqual(100);
        expect(art.golsUltimos5).toHaveLength(5);
        expect(art.assistenciasUltimas5).toHaveLength(5);
        expect(art.resultados.length).toBeGreaterThan(0);
      }
    });

    it('deve gerar artilheiro individual com dados válidos', () => {
      const artilheiro = gerarArtilheiroHistorico(0);
      expect(artilheiro.nome).toBeTruthy();
      expect(artilheiro.time).toBeTruthy();
      expect(artilheiro.liga).toBeTruthy();
      expect(artilheiro.forma).toBeGreaterThanOrEqual(20);
      expect(artilheiro.forma).toBeLessThanOrEqual(100);
    });
  });

  describe('Estatísticas de Apostas', () => {
    let apostas: ReturnType<typeof gerar10000Apostas>;

    beforeAll(() => {
      apostas = gerar10000Apostas();
    });

    it('deve calcular estatísticas corretas', () => {
      const stats = calcularEstatisticas(apostas);

      expect(stats.totalApostas).toBe(10000);
      expect(stats.acertos + stats.erros).toBe(10000);
      expect(stats.taxaAcerto).toBeGreaterThanOrEqual(30);
      expect(stats.taxaAcerto).toBeLessThanOrEqual(70);
      expect(stats.confiancaMedia).toBeGreaterThanOrEqual(50);
      expect(stats.confiancaMedia).toBeLessThanOrEqual(80);
    });

    it('deve ter ROI calculado corretamente', () => {
      const stats = calcularEstatisticas(apostas);
      expect(stats.roi).toBeDefined();
      expect(typeof stats.roi).toBe('number');
    });

    it('deve agrupar apostas por confiança', () => {
      const stats = calcularEstatisticas(apostas);
      const total = stats.porConfianca.baixa + stats.porConfianca.media + stats.porConfianca.alta;
      expect(total).toBe(10000);
    });

    it('deve agrupar apostas por mercado', () => {
      const stats = calcularEstatisticas(apostas);
      const total = Object.values(stats.porMercado).reduce((a, b) => a + b, 0);
      expect(total).toBe(10000);
    });
  });

  describe('Validação de Dados', () => {
    it('deve validar dados gerados como válidos', () => {
      const apostas = gerar10000Apostas();
      const validacao = validarDados(apostas);

      expect(validacao.erros.length).toBeLessThanOrEqual(1);
    });

    it('deve detectar dados insuficientes', () => {
      const apostas = gerar10000Apostas().slice(0, 500);
      const validacao = validarDados(apostas);

      expect(validacao.valido).toBe(false);
      expect(validacao.erros.length).toBeGreaterThan(0);
    });
  });

  describe('Integração com ML Model', () => {
    it('deve treinar modelo com dados gerados', () => {
      const artilheiros = gerar100Artilheiros();
      const model = initMLModel();

      expect(() => {
        model.treinar(artilheiros);
      }).not.toThrow();
    });

    it('deve gerar recomendações após treinamento', () => {
      const artilheiros = gerar100Artilheiros();
      const model = getMLModel();
      model.treinar(artilheiros);

      const recomendacoes = model.gerarRecomendacoes(artilheiros, 10);

      expect(recomendacoes).toHaveLength(10);
      for (const rec of recomendacoes) {
        expect(rec.confianca).toBeGreaterThanOrEqual(0);
        expect(rec.confianca).toBeLessThanOrEqual(100);
        expect(rec.motivos.length).toBeGreaterThan(0);
      }
    });

    it('deve validar recomendações com backtesting', () => {
      const artilheiros = gerar100Artilheiros();
      const model = getMLModel();
      model.treinar(artilheiros);

      const recomendacao = model.gerarRecomendacao(artilheiros[0]);
      const validacao = model.validarComBacktesting(recomendacao, artilheiros[0]);

      expect(validacao.acertos + validacao.erros).toBeGreaterThan(0);
      expect(validacao.taxaAcerto).toBeGreaterThanOrEqual(0);
      expect(validacao.taxaAcerto).toBeLessThanOrEqual(100);
    });

    it('deve obter estatísticas do modelo', () => {
      const artilheiros = gerarDadosTreinamento();
      const model = getMLModel();
      model.treinar(artilheiros);

      const stats = model.obterEstatisticas();

      expect(stats.artilheirosAnalisados).toBeGreaterThan(0);
      expect(stats.mediaConfianca).toBeGreaterThanOrEqual(0);
      expect(stats.mediaConfianca).toBeLessThanOrEqual(100);
      expect(stats.mediaGols).toBeGreaterThanOrEqual(0);
      expect(stats.mediaForma).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Qualidade de Dados', () => {
    it('deve ter distribuição realista de odds', () => {
      const apostas = gerar10000Apostas();
      const odds = apostas.map(a => a.oddApostada);

      const minOdd = Math.min(...odds);
      const maxOdd = Math.max(...odds);
      const mediaOdd = odds.reduce((a, b) => a + b, 0) / odds.length;

      expect(minOdd).toBeGreaterThanOrEqual(1.0);
      expect(maxOdd).toBeLessThanOrEqual(5);
      expect(mediaOdd).toBeGreaterThanOrEqual(1.3);
      expect(mediaOdd).toBeLessThanOrEqual(4.0);
    });

    it('deve ter distribuição realista de stakes', () => {
      const apostas = gerar10000Apostas();
      const stakes = apostas.map(a => a.stake);

      const minStake = Math.min(...stakes);
      const maxStake = Math.max(...stakes);

      expect(minStake).toBeGreaterThanOrEqual(10);
      expect(maxStake).toBeLessThanOrEqual(200);
    });

    it('deve ter correlação entre forma e resultados', () => {
      const artilheiros = gerar100Artilheiros();

      for (const art of artilheiros) {
        const acertos = art.resultados.filter(r => r).length;
        const taxaAcerto = acertos / art.resultados.length;

        // Forma alta deve correlacionar com mais acertos
        if (art.forma > 80) {
          expect(taxaAcerto).toBeGreaterThan(0.3);
        }
      }
    });
  });
});
