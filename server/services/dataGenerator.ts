// Gerador de Dados Históricos Realistas para Treinamento ML
// Cria 10.000+ registros com padrões realistas de apostas

import { ArtilheiroHistorico } from './mlModel';

interface ApostaHistorica {
  id: string;
  artilheiroId: string;
  artilheiro: string;
  time: string;
  liga: string;
  data: Date;
  mercado: string;
  predicao: boolean; // true = gol, false = sem gol
  resultado: boolean;
  oddApostada: number;
  stake: number;
  lucro: number;
  confiancaML: number;
  forma: number;
  golsUltimos5: number[];
}

const nomes = [
  'Erling Haaland', 'Vinícius Júnior', 'Mbappé', 'Lewandowski', 'Benzema',
  'Neymar', 'Harry Kane', 'Rodrygo', 'Vinicius', 'Cristiano Ronaldo',
  'Messi', 'Mohamed Salah', 'Leroy Sané', 'Jack Grealish', 'Phil Foden',
  'Ilkay Gündogan', 'Riyad Mahrez', 'Julián Álvarez', 'Marco Reus', 'Thomas Müller',
  'Serge Gnabry', 'Kingsley Coman', 'Ousmane Dembélé', 'Ferran Torres', 'Pedri',
  'Gavi', 'Ansu Fati', 'Robert Lewandowski', 'Karim Benzema', 'Luka Modrić',
  'Toni Kroos', 'Jude Bellingham', 'Vinícius Jr', 'Aurélien Tchouaméni', 'Eduardo Camavinga',
  'Jorginho', 'N\'Golo Kanté', 'Reece James', 'Mason Mount', 'Conor Gallagher',
  'Bukayo Saka', 'Gabriel Martinelli', 'Emile Smith Rowe', 'Martin Ødegaard', 'Granit Xhaka',
  'Declan Rice', 'Bruno Fernandes', 'Antony', 'Marcus Rashford', 'Jadon Sancho',
];

const times = [
  'Manchester City', 'Real Madrid', 'PSG', 'Bayern Munich', 'Liverpool',
  'Barcelona', 'Juventus', 'Inter Milan', 'AC Milan', 'Napoli',
  'Borussia Dortmund', 'Chelsea', 'Manchester United', 'Arsenal', 'Tottenham',
  'Atlético Madrid', 'Sevilla', 'Valencia', 'Villarreal', 'Real Sociedad',
  'Atalanta', 'Lazio', 'Roma', 'Fiorentina', 'Torino',
  'Leverkusen', 'RB Leipzig', 'Hoffenheim', 'Eintracht Frankfurt', 'Mainz',
  'Marseille', 'Lyon', 'Monaco', 'Lens', 'Rennes',
  'Ajax', 'PSV Eindhoven', 'Feyenoord', 'Vitesse', 'AZ Alkmaar',
];

const ligas = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Eredivisie'];

const mercados = [
  'Gols (Qualquer Momento)',
  'Gols (1º Tempo)',
  'Gols (2º Tempo)',
  'Ambas Marcam',
  'Over 2.5 Gols',
  'Under 2.5 Gols',
  'Assistências (≥1)',
  'Cartão Amarelo',
];

// Gerar padrão de forma realista (correlacionado com resultados)
function gerarFormaRealista(): number {
  // Distribuição normal em torno de 65% com desvio padrão de 15
  const media = 65;
  const desvio = 15;
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(20, Math.min(100, media + z * desvio));
}

// Gerar gols realistas (correlacionados com forma)
function gerarGolsRealistas(forma: number): number[] {
  const probabilidadeGol = forma / 100;
  const gols: number[] = [];

  for (let i = 0; i < 5; i++) {
    if (Math.random() < probabilidadeGol) {
      // 0-2 gols por jogo
      gols.push(Math.floor(Math.random() * 2) + 1);
    } else {
      gols.push(0);
    }
  }

  return gols;
}

// Gerar resultado correlacionado com forma e gols
function gerarResultado(forma: number, golsUltimos5: number[]): boolean {
  const mediaGols = golsUltimos5.reduce((a, b) => a + b, 0) / 5;
  const probabilidade = (forma / 100) * 0.7 + (mediaGols / 2) * 0.3;
  return Math.random() < probabilidade;
}

// Gerar odd realista baseada em probabilidade
function gerarOddRealista(probabilidade: number): number {
  // Converter probabilidade em odd (com margem de 5%)
  const oddJusta = 1 / probabilidade;
  const margem = 1.1; // Aumentar margem para mínimo de 1.1
  return Math.round(oddJusta * margem * 100) / 100;
}

// Gerar aposta histórica realista
function gerarApostaHistorica(
  id: number,
  artilheiro: string,
  time: string,
  liga: string,
  forma: number,
  golsUltimos5: number[]
): ApostaHistorica {
  const resultado = gerarResultado(forma, golsUltimos5);
  const mercado = mercados[Math.floor(Math.random() * mercados.length)];
  const confiancaML = 40 + forma * 0.6; // 40-100
  const probabilidade = confiancaML / 100;
  const oddApostada = gerarOddRealista(probabilidade);
  const stake = 10 + Math.floor(Math.random() * 190); // 10-200
  const predicao = resultado; // Simplificado: predicao = resultado
  const lucro = predicao ? stake * (oddApostada - 1) : -stake;

  return {
    id: `aposta_${id}`,
    artilheiroId: `artilheiro_${Math.floor(Math.random() * 100)}`,
    artilheiro,
    time,
    liga,
    data: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)), // Últimos 90 dias
    mercado,
    predicao,
    resultado,
    oddApostada,
    stake,
    lucro,
    confiancaML,
    forma,
    golsUltimos5,
  };
}

// Gerar artilheiro histórico com dados realistas
export function gerarArtilheiroHistorico(id: number): ArtilheiroHistorico {
  const nome = nomes[id % nomes.length];
  const time = times[Math.floor(Math.random() * times.length)];
  const liga = ligas[Math.floor(Math.random() * ligas.length)];
  const forma = gerarFormaRealista();
  const golsUltimos5 = gerarGolsRealistas(forma);
  const assistenciasUltimas5 = Array.from({ length: 5 }, () =>
    Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0
  );

  // Gerar histórico de resultados correlacionado com forma
  const resultados: boolean[] = [];
  for (let i = 0; i < 20; i++) {
    resultados.push(gerarResultado(forma, golsUltimos5));
  }

  return {
    id: `artilheiro_${id}`,
    nome,
    time,
    liga,
    golsUltimos5,
    assistenciasUltimas5,
    cartoes: Math.floor(Math.random() * 5),
    forma,
    oddsMedia: 1.5 + Math.random() * 2.5, // 1.5-4.0
    resultados,
  };
}

// Gerar 10.000+ apostas históricas
export function gerar10000Apostas(): ApostaHistorica[] {
  const apostas: ApostaHistorica[] = [];

  for (let i = 0; i < 10000; i++) {
    const artilheiroId = i % 100;
    const artilheiro = gerarArtilheiroHistorico(artilheiroId);
    const aposta = gerarApostaHistorica(
      i,
      artilheiro.nome,
      artilheiro.time,
      artilheiro.liga,
      artilheiro.forma,
      artilheiro.golsUltimos5
    );
    apostas.push(aposta);
  }

  return apostas;
}

// Calcular estatísticas das apostas
export function calcularEstatisticas(apostas: ApostaHistorica[]) {
  const totalApostas = apostas.length;
  const acertos = apostas.filter(a => a.resultado).length;
  const erros = totalApostas - acertos;
  const taxaAcerto = (acertos / totalApostas) * 100;

  const lucroTotal = apostas.reduce((sum, a) => sum + a.lucro, 0);
  const stakeTotal = apostas.reduce((sum, a) => sum + a.stake, 0);
  const roi = (lucroTotal / stakeTotal) * 100;

  const confiancaMedia = apostas.reduce((sum, a) => sum + a.confiancaML, 0) / totalApostas;
  const oddMedia = apostas.reduce((sum, a) => sum + a.oddApostada, 0) / totalApostas;

  // Agrupar por confiança
  const porConfianca = {
    baixa: apostas.filter(a => a.confiancaML < 60).length,
    media: apostas.filter(a => a.confiancaML >= 60 && a.confiancaML < 80).length,
    alta: apostas.filter(a => a.confiancaML >= 80).length,
  };

  // Agrupar por mercado
  const porMercado: { [key: string]: number } = {};
  for (const aposta of apostas) {
    porMercado[aposta.mercado] = (porMercado[aposta.mercado] || 0) + 1;
  }

  return {
    totalApostas,
    acertos,
    erros,
    taxaAcerto: Math.round(taxaAcerto * 100) / 100,
    lucroTotal: Math.round(lucroTotal),
    stakeTotal,
    roi: Math.round(roi * 100) / 100,
    confiancaMedia: Math.round(confiancaMedia),
    oddMedia: Math.round(oddMedia * 100) / 100,
    porConfianca,
    porMercado,
  };
}

// Gerar 100 artilheiros para treinamento
export function gerar100Artilheiros(): ArtilheiroHistorico[] {
  const artilheiros: ArtilheiroHistorico[] = [];

  for (let i = 0; i < 100; i++) {
    artilheiros.push(gerarArtilheiroHistorico(i));
  }

  return artilheiros;
}

// Validar qualidade dos dados
export function validarDados(apostas: ApostaHistorica[]) {
  const erros: string[] = [];

  // Verificar se há apostas suficientes
  if (apostas.length < 1000) {
    erros.push(`Apenas ${apostas.length} apostas geradas (mínimo: 1000)`);
  }

  // Verificar distribuição de resultados
  const taxaAcerto = (apostas.filter(a => a.resultado).length / apostas.length) * 100;
  if (taxaAcerto < 30 || taxaAcerto > 70) {
    erros.push(`Taxa de acerto ${taxaAcerto.toFixed(2)}% fora do esperado (30-70%)`);
  }

  // Verificar distribuição de confiança
  const confiancaMedia = apostas.reduce((sum, a) => sum + a.confiancaML, 0) / apostas.length;
  if (confiancaMedia < 40 || confiancaMedia > 85) {
    erros.push(`Confiança média ${confiancaMedia.toFixed(2)}% fora do esperado (40-85%)`);
  }

  // Verificar odds
  const oddMedia = apostas.reduce((sum, a) => sum + a.oddApostada, 0) / apostas.length;
  if (oddMedia < 1.3 || oddMedia > 4.0) {
    erros.push(`Odd média ${oddMedia.toFixed(2)} fora do esperado (1.3-4.0)`);
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos: [],
  };
}
