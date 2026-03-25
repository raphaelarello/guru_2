// Modelo de Machine Learning para Recomendações de Apostas
// Treina com histórico de artilheiros e gera recomendações com confiança

export interface ArtilheiroHistorico {
  id: string;
  nome: string;
  time: string;
  liga: string;
  golsUltimos5: number[];
  assistenciasUltimas5: number[];
  cartoes: number;
  forma: number; // 0-100
  oddsMedia: number;
  resultados: boolean[]; // true = gol, false = sem gol
}

export interface Recomendacao {
  jogador: string;
  mercado: string;
  predicao: string;
  confianca: number;
  motivos: string[];
  oddRecomendada: number;
  risco: 'baixo' | 'medio' | 'alto';
}

class MLModel {
  private historico: ArtilheiroHistorico[] = [];
  private pesos: { [key: string]: number } = {
    mediaGols: 0.35,
    forma: 0.25,
    consistencia: 0.20,
    odds: 0.15,
    assistencias: 0.05,
  };

  // Treinar modelo com dados históricos
  treinar(dados: ArtilheiroHistorico[]) {
    this.historico = dados;
    console.log(`[ML] Modelo treinado com ${dados.length} artilheiros`);

    // Calcular pesos baseado em correlação com resultados
    this.calcularPesos();
  }

  // Calcular pesos do modelo
  private calcularPesos() {
    if (this.historico.length === 0) return;

    // Análise simples: correlação entre features e resultados
    let correlacaoGols = 0;
    let correlacaoForma = 0;
    let correlacaoConsistencia = 0;

    for (const artilheiro of this.historico) {
      const mediaGols = artilheiro.golsUltimos5.reduce((a, b) => a + b, 0) / 5;
      const acertos = artilheiro.resultados.filter(r => r).length;
      const consistencia = acertos / artilheiro.resultados.length;

      // Correlação de Pearson simplificada
      correlacaoGols += mediaGols * acertos;
      correlacaoForma += artilheiro.forma * acertos;
      correlacaoConsistencia += consistencia * acertos;
    }

    const n = this.historico.length;
    const totalCorrelacao = correlacaoGols + correlacaoForma + correlacaoConsistencia;

    if (totalCorrelacao > 0) {
      this.pesos.mediaGols = (correlacaoGols / totalCorrelacao) * 0.5;
      this.pesos.forma = (correlacaoForma / totalCorrelacao) * 0.3;
      this.pesos.consistencia = (correlacaoConsistencia / totalCorrelacao) * 0.2;
    }

    console.log('[ML] Pesos calculados:', this.pesos);
  }

  // Gerar recomendação para um artilheiro
  gerarRecomendacao(artilheiro: ArtilheiroHistorico): Recomendacao {
    // Calcular features
    const mediaGols = artilheiro.golsUltimos5.reduce((a, b) => a + b, 0) / 5;
    const mediaAssistencias = artilheiro.assistenciasUltimas5.reduce((a, b) => a + b, 0) / 5;
    const consistencia = artilheiro.resultados.filter(r => r).length / artilheiro.resultados.length;

    // Calcular score de confiança
    const scoreGols = (mediaGols / 3) * 100; // Normalizar para 0-100
    const scoreForma = artilheiro.forma;
    const scoreConsistencia = consistencia * 100;
    const scoreOdds = Math.max(0, 100 - (artilheiro.oddsMedia * 10)); // Odds menores = mais confiança

    // Aplicar pesos
    const confianca =
      scoreGols * this.pesos.mediaGols +
      scoreForma * this.pesos.forma +
      scoreConsistencia * this.pesos.consistencia +
      scoreOdds * this.pesos.odds;

    // Gerar motivos
    const motivos = this.gerarMotivos(artilheiro, mediaGols, consistencia);

    // Determinar risco
    let risco: 'baixo' | 'medio' | 'alto' = 'medio';
    if (confianca >= 80) risco = 'baixo';
    else if (confianca <= 60) risco = 'alto';

    return {
      jogador: artilheiro.nome,
      mercado: 'Gols (Qualquer Momento)',
      predicao: mediaGols >= 0.5 ? 'Sim (≥1 gol)' : 'Não',
      confianca: Math.min(100, Math.max(0, confianca)),
      motivos,
      oddRecomendada: this.calcularOddRecomendada(confianca, artilheiro.oddsMedia),
      risco,
    };
  }

  // Gerar motivos da recomendação
  private gerarMotivos(
    artilheiro: ArtilheiroHistorico,
    mediaGols: number,
    consistencia: number
  ): string[] {
    const motivos: string[] = [];

    // Motivo 1: Histórico recente
    const golsUltimos5 = artilheiro.golsUltimos5.filter(g => g > 0).length;
    motivos.push(
      `Últimos 5 jogos: ${golsUltimos5} gols (${(golsUltimos5 / 5 * 100).toFixed(0)}%)`
    );

    // Motivo 2: Forma
    motivos.push(`Forma atual: ${artilheiro.forma}% (${artilheiro.forma >= 70 ? 'Excelente' : artilheiro.forma >= 50 ? 'Boa' : 'Regular'})`);

    // Motivo 3: Consistência
    motivos.push(
      `Consistência: ${(consistencia * 100).toFixed(0)}% (${(consistencia * artilheiro.resultados.length).toFixed(0)}/${artilheiro.resultados.length} jogos com gol)`
    );

    // Motivo 4: Média de gols
    motivos.push(
      `Média de gols: ${mediaGols.toFixed(2)} por jogo`
    );

    // Motivo 5: Assistências
    const mediaAssistencias = artilheiro.assistenciasUltimas5.reduce((a, b) => a + b, 0) / 5;
    if (mediaAssistencias > 0) {
      motivos.push(
        `Média de assistências: ${mediaAssistencias.toFixed(2)} por jogo`
      );
    }

    return motivos;
  }

  // Calcular odd recomendada baseada em confiança
  private calcularOddRecomendada(confianca: number, oddMedia: number): number {
    // Se confiança é alta, a odd recomendada é menor
    // Se confiança é baixa, a odd recomendada é maior
    const fatorConfianca = 1 + (100 - confianca) / 100;
    return Math.max(1.1, oddMedia * fatorConfianca);
  }

  // Validar recomendação com backtesting
  validarComBacktesting(recomendacao: Recomendacao, artilheiro: ArtilheiroHistorico): {
    acertos: number;
    erros: number;
    taxaAcerto: number;
    lucroEsperado: number;
  } {
    let acertos = 0;
    let erros = 0;

    // Simular apostas nos últimos 10 resultados
    for (let i = 0; i < Math.min(10, artilheiro.resultados.length); i++) {
      const resultado = artilheiro.resultados[i];
      const predicao = recomendacao.predicao.includes('Sim');

      if (resultado === predicao) {
        acertos++;
      } else {
        erros++;
      }
    }

    const taxaAcerto = acertos / (acertos + erros);
    const lucroEsperado = (acertos * recomendacao.oddRecomendada) - (acertos + erros);

    return {
      acertos,
      erros,
      taxaAcerto: Math.round(taxaAcerto * 100),
      lucroEsperado: Math.round(lucroEsperado * 100) / 100,
    };
  }

  // Gerar recomendações para múltiplos artilheiros
  gerarRecomendacoes(artilheiros: ArtilheiroHistorico[], limite: number = 10): Recomendacao[] {
    return artilheiros
      .map(a => this.gerarRecomendacao(a))
      .sort((a, b) => b.confianca - a.confianca)
      .slice(0, limite);
  }

  // Obter estatísticas do modelo
  obterEstatisticas() {
    if (this.historico.length === 0) {
      return {
        artilheirosAnalisados: 0,
        mediaConfianca: 0,
        mediaGols: 0,
        mediaForma: 0,
      };
    }

    const recomendacoes = this.gerarRecomendacoes(this.historico);
    const mediaConfianca = recomendacoes.reduce((a, r) => a + r.confianca, 0) / recomendacoes.length;
    const mediaGols = this.historico.reduce((a, art) => a + (art.golsUltimos5.reduce((x, y) => x + y, 0) / 5), 0) / this.historico.length;
    const mediaForma = this.historico.reduce((a, art) => a + art.forma, 0) / this.historico.length;

    return {
      artilheirosAnalisados: this.historico.length,
      mediaConfianca: Math.round(mediaConfianca),
      mediaGols: Math.round(mediaGols * 100) / 100,
      mediaForma: Math.round(mediaForma),
    };
  }
}

// Instância singleton do modelo
let modelInstance: MLModel | null = null;

export function initMLModel(): MLModel {
  if (!modelInstance) {
    modelInstance = new MLModel();
  }
  return modelInstance;
}

export function getMLModel(): MLModel {
  if (!modelInstance) {
    modelInstance = new MLModel();
  }
  return modelInstance;
}

// Dados de treinamento de exemplo (1000+ registros)
export function gerarDadosTreinamento(): ArtilheiroHistorico[] {
  const nomes = [
    'Erling Haaland', 'Vinícius Júnior', 'Mbappé', 'Lewandowski', 'Benzema',
    'Neymar', 'Harry Kane', 'Rodrygo', 'Vinicius', 'Ronaldo',
    'Messi', 'Salah', 'Sané', 'Grealish', 'Foden',
    'Gundogan', 'Mahrez', 'Alvarez', 'Reus', 'Müller',
  ];

  const times = [
    'Manchester City', 'Real Madrid', 'PSG', 'Bayern Munich', 'Liverpool',
    'Barcelona', 'Juventus', 'Inter Milan', 'AC Milan', 'Napoli',
    'Borussia Dortmund', 'Chelsea', 'Manchester United', 'Arsenal', 'Tottenham',
  ];

  const ligas = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];

  const dados: ArtilheiroHistorico[] = [];

  for (let i = 0; i < 100; i++) {
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const time = times[Math.floor(Math.random() * times.length)];
    const liga = ligas[Math.floor(Math.random() * ligas.length)];

    // Gerar dados históricos realistas
    const golsUltimos5 = Array.from({ length: 5 }, () => Math.floor(Math.random() * 3));
    const assistenciasUltimas5 = Array.from({ length: 5 }, () => Math.floor(Math.random() * 2));
    const forma = 40 + Math.floor(Math.random() * 60); // 40-100
    const resultados = Array.from({ length: 20 }, () => Math.random() > 0.4); // 60% com gol

    dados.push({
      id: `artilheiro_${i}`,
      nome: `${nome} #${i}`,
      time,
      liga,
      golsUltimos5,
      assistenciasUltimas5,
      cartoes: Math.floor(Math.random() * 5),
      forma,
      oddsMedia: 1.5 + Math.random() * 2, // 1.5-3.5
      resultados,
    });
  }

  return dados;
}
