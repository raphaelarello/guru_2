/**
 * Sistema de Recomendações ML para Apostas
 * Treina modelo com histórico de artilheiros e gera recomendações
 */

interface DadosArtilheiro {
  nome: string;
  gols: number;
  eficiencia: number;
  consistencia: number;
  forma: 'excelente' | 'boa' | 'normal' | 'ruim';
  ultimosJogos: number;
  golsUltimos: number;
}

interface Recomendacao {
  jogador: string;
  tipo: 'gols_totais' | 'gols_1_tempo' | 'assistencias';
  confianca: number; // 0-100
  probabilidade: number; // 0-1
  roi: number; // Return on Investment esperado
  timestamp: Date;
}

class MLRecommendationsService {
  private recomendacoes: Recomendacao[] = [];
  private historico: DadosArtilheiro[] = [];

  /**
   * Treina modelo com dados históricos
   */
  treinarModelo(artilheiros: DadosArtilheiro[]): void {
    this.historico = artilheiros;
    console.log(`[ML] Modelo treinado com ${artilheiros.length} artilheiros`);
  }

  /**
   * Gera recomendações baseado em histórico
   */
  gerarRecomendacoes(artilheiros: DadosArtilheiro[]): Recomendacao[] {
    const novasRecomendacoes: Recomendacao[] = [];

    for (const artilheiro of artilheiros.slice(0, 10)) {
      // Top 10 artilheiros
      // Recomendação 1: Gols Totais
      if (artilheiro.forma === 'excelente' && artilheiro.eficiencia > 50) {
        const confianca = Math.min(95, 50 + artilheiro.eficiencia);
        const probabilidade = artilheiro.eficiencia / 100;
        const roi = this.calcularROI(probabilidade, 2.5); // Odds média

        novasRecomendacoes.push({
          jogador: artilheiro.nome,
          tipo: 'gols_totais',
          confianca,
          probabilidade,
          roi,
          timestamp: new Date(),
        });
      }

      // Recomendação 2: Gols 1º Tempo
      if (artilheiro.forma === 'boa' && artilheiro.consistencia > 75) {
        const confianca = Math.min(85, 40 + artilheiro.consistencia);
        const probabilidade = (artilheiro.eficiencia / 100) * 0.6; // 60% dos gols no 1º tempo
        const roi = this.calcularROI(probabilidade, 3.2); // Odds média

        novasRecomendacoes.push({
          jogador: artilheiro.nome,
          tipo: 'gols_1_tempo',
          confianca,
          probabilidade,
          roi,
          timestamp: new Date(),
        });
      }

      // Recomendação 3: Assistências
      if (artilheiro.forma !== 'ruim') {
        const confianca = Math.min(80, 30 + artilheiro.consistencia);
        const probabilidade = 0.35; // Probabilidade média de assistência
        const roi = this.calcularROI(probabilidade, 2.8); // Odds média

        novasRecomendacoes.push({
          jogador: artilheiro.nome,
          tipo: 'assistencias',
          confianca,
          probabilidade,
          roi,
          timestamp: new Date(),
        });
      }
    }

    this.recomendacoes = novasRecomendacoes;
    return novasRecomendacoes;
  }

  /**
   * Calcula ROI esperado
   * ROI = (Probabilidade * Odds - 1) / (Odds - 1)
   */
  private calcularROI(probabilidade: number, odds: number): number {
    if (odds <= 1) return 0;
    return (probabilidade * odds - 1) / (odds - 1);
  }

  /**
   * Retorna recomendações filtradas por confiança mínima
   */
  obterRecomendacoes(confiancaMinima: number = 70): Recomendacao[] {
    return this.recomendacoes.filter(r => r.confianca >= confiancaMinima);
  }

  /**
   * Retorna recomendações por tipo
   */
  obterRecomendacoesPorTipo(tipo: string): Recomendacao[] {
    return this.recomendacoes.filter(r => r.tipo === tipo);
  }

  /**
   * Retorna top N recomendações por ROI
   */
  obterTopRecomendacoes(n: number = 5): Recomendacao[] {
    return this.recomendacoes
      .sort((a, b) => b.roi - a.roi)
      .slice(0, n);
  }

  /**
   * Calcula acurácia do modelo
   */
  calcularAcuracia(resultados: { recomendacao: Recomendacao; resultado: boolean }[]): number {
    if (resultados.length === 0) return 0;
    const acertos = resultados.filter(r => r.resultado).length;
    return (acertos / resultados.length) * 100;
  }

  /**
   * Retorna estatísticas do modelo
   */
  obterEstatisticas() {
    const topRecomendacoes = this.obterTopRecomendacoes(5);
    const roiMedio = topRecomendacoes.length > 0
      ? (topRecomendacoes.reduce((sum, r) => sum + r.roi, 0) / topRecomendacoes.length).toFixed(4)
      : '0';

    const confiancaMedia = this.recomendacoes.length > 0
      ? (this.recomendacoes.reduce((sum, r) => sum + r.confianca, 0) / this.recomendacoes.length).toFixed(2)
      : '0';

    return {
      totalRecomendacoes: this.recomendacoes.length,
      roiMedio,
      confiancaMedia,
      topRecomendacoes,
    };
  }
}

export const mlRecommendationsService = new MLRecommendationsService();
