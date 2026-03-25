import { getTeamSeasonStats, getFixtureStatistics, getTodayFixtures } from "./football";
import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const BASE_URL = "https://v3.football.api-sports.io";

// Cache simples
const cache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiry < Date.now()) return null;
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

async function apiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const response = await axios.get<{ response: T }>(`${BASE_URL}/${endpoint}`, {
    headers: { "x-apisports-key": API_KEY },
    params,
  });
  return response.data.response;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PalpiteAvancado = {
  fixtureId: number;
  homeTeam: string;
  homeTeamLogo: string;
  awayTeam: string;
  awayTeamLogo: string;
  leagueName: string;
  leagueLogo: string;
  countryFlag: string;
  matchTime: string;
  
  // Palpite
  mercado: "BTTS" | "Gols" | "Escanteios" | "Cartões";
  palpite: string;
  confianca: "Alta" | "Media" | "Baixa";
  probabilidade: number; // 0-100
  motivo: string;
  
  // Análise detalhada
  analiseDetalhada: {
    homeTeamStats: {
      mediaGols: number;

      mediaGolsForaEmCasa: number;
      mediaGolsSofridos: number;
      forma: string;
      ultimosJogos: string[];
      vitorias: number;
      empates: number;
      derrotas: number;
      aproveitamento: number;
    };
    awayTeamStats: {
      mediaGols: number;
      mediaGolsForaEmCasa: number;
      mediaGolsSofridos: number;
      forma: string;
      ultimosJogos: string[];
      vitorias: number;
      empates: number;
      derrotas: number;
      aproveitamento: number;
    };
    h2h: {
      ultimosJogos: Array<{
        data: string;
        resultado: string;
        placar: string;
      }>;
      estatisticas: {
        vitoriasHome: number;
        vitoriasAway: number;
        empates: number;
        mediaGolsHome: number;
        mediaGolsAway: number;
      };
    };
    modeloPoisson: {
      probabilidadeGolsHome: number[];
      probabilidadeGolsAway: number[];
      probabilidadeBTTS: number;
      probabilidadeOver25: number;
    };
    fatoresInfluencia: {
      fator: string;
      impacto: string;
      peso: number;
    }[];
  };
};

export type ResultadoAnaliseAvancada = {
  totalJogos: number;
  totalLigas: number;
  palpitesBTTS: PalpiteAvancado[];
  palpitesGols: PalpiteAvancado[];
  palpitesEscanteios: PalpiteAvancado[];
  palpitesCartoes: PalpiteAvancado[];
};

// ─── Helpers Estatísticos ────────────────────────────────────────────────────

function calcularPoissonProbabilidade(lambda: number, k: number): number {
  const e = Math.exp(-lambda);
  let factorial = 1;
  for (let i = 1; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * e) / factorial;
}

function calcularDistribuicaoPoissonAte(lambda: number, max: number): number[] {
  const resultado: number[] = [];
  for (let i = 0; i <= max; i++) {
    resultado.push(calcularPoissonProbabilidade(lambda, i));
  }
  return resultado;
}

function calcularProbabilidadeBTTS(lambdaHome: number, lambdaAway: number): number {
  // P(Home >= 1 AND Away >= 1)
  const pHome0 = calcularPoissonProbabilidade(lambdaHome, 0);
  const pAway0 = calcularPoissonProbabilidade(lambdaAway, 0);
  return (1 - pHome0) * (1 - pAway0);
}

function calcularProbabilidadeOver(lambdaHome: number, lambdaAway: number, limite: number): number {
  // P(Home + Away > limite)
  let probabilidade = 0;
  for (let h = 0; h <= 10; h++) {
    for (let a = 0; a <= 10; a++) {
      if (h + a > limite) {
        probabilidade += calcularPoissonProbabilidade(lambdaHome, h) * 
                        calcularPoissonProbabilidade(lambdaAway, a);
      }
    }
  }
  return probabilidade;
}

// ─── Análise Avançada ─────────────────────────────────────────────────────────

async function analisarFixture(fixture: any, season: number): Promise<PalpiteAvancado[]> {
  const palpites: PalpiteAvancado[] = [];
  const fixtureId = fixture.fixture.id;
  const homeTeam = fixture.teams.home;
  const awayTeam = fixture.teams.away;
  const league = fixture.league;
  const matchTime = new Date(fixture.fixture.date).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
  });
  const countryFlag = league.flag || "";

  try {
    // Buscar stats de ambos os times
    let homeStats = await getTeamSeasonStats(homeTeam.id, league.id, season).catch(() => null);
    let awayStats = await getTeamSeasonStats(awayTeam.id, league.id, season).catch(() => null);

    // Se não encontrar stats da temporada atual, tentar anterior
    if (!homeStats) {
      homeStats = await getTeamSeasonStats(homeTeam.id, league.id, season - 1).catch(() => null);
    }
    if (!awayStats) {
      awayStats = await getTeamSeasonStats(awayTeam.id, league.id, season - 1).catch(() => null);
    }

    if (!homeStats || !awayStats) return [];

    // Extrair dados
    const homeMediaGols = parseFloat(homeStats.goals.for.average.total) || 0;
    const homeMediaGolsEmCasa = parseFloat(homeStats.goals.for.average.home) || 0;
    const homeMediaGolsSofridos = parseFloat(homeStats.goals.against.average.total) || 0;
    const awayMediaGols = parseFloat(awayStats.goals.for.average.total) || 0;
    const awayMediaGolsForaEmCasa = parseFloat(awayStats.goals.for.average.away) || 0;
    const awayMediaGolsSofridos = parseFloat(awayStats.goals.against.average.total) || 0;

    const homeJogados = homeStats.fixtures.played.total;
    const awayJogados = awayStats.fixtures.played.total;

    if (homeJogados < 3 || awayJogados < 3) return [];

    // Forma recente
    const homeForma = homeStats.form || "";
    const awayForma = awayStats.form || "";
    const homeUltimosJogos = homeForma.slice(-5).split("");
    const awayUltimosJogos = awayForma.slice(-5).split("");

    // Estatísticas gerais
    const homeAproveitamento = Math.round((homeStats.fixtures.wins.total / homeJogados) * 100);
    const awayAproveitamento = Math.round((awayStats.fixtures.wins.total / awayJogados) * 100);

    // Buscar H2H (últimos confrontos)
    let h2hData: any[] = [];
    try {
      h2hData = await apiRequest<any[]>("fixtures", {
        h2h: `${homeTeam.id}-${awayTeam.id}`,
        last: "5",
      });
    } catch { /* sem H2H */ }

    // Calcular estatísticas de H2H
    let h2hStats = {
      vitoriasHome: 0,
      vitoriasAway: 0,
      empates: 0,
      mediaGolsHome: 0,
      mediaGolsAway: 0,
    };

    if (h2hData.length > 0) {
      let totalGolsHome = 0, totalGolsAway = 0;
      for (const jogo of h2hData) {
        const golsHome = jogo.goals.home || 0;
        const golsAway = jogo.goals.away || 0;
        totalGolsHome += golsHome;
        totalGolsAway += golsAway;

        if (golsHome > golsAway) h2hStats.vitoriasHome++;
        else if (golsAway > golsHome) h2hStats.vitoriasAway++;
        else h2hStats.empates++;
      }
      h2hStats.mediaGolsHome = totalGolsHome / h2hData.length;
      h2hStats.mediaGolsAway = totalGolsAway / h2hData.length;
    }

    // ─── Modelo de Poisson ───────────────────────────────────────────────────

    // Ajustar médias para contexto (em casa vs fora)
    const lambdaHome = homeMediaGolsEmCasa * 0.95; // Fator de ajuste
    const lambdaAway = awayMediaGolsForaEmCasa * 0.95;

    const distHome = calcularDistribuicaoPoissonAte(lambdaHome, 6);
    const distAway = calcularDistribuicaoPoissonAte(lambdaAway, 6);
    const probBTTS = calcularProbabilidadeBTTS(lambdaHome, lambdaAway);
    const probOver25 = calcularProbabilidadeOver(lambdaHome, lambdaAway, 2.5);

    // ─── Fatores de Influência ───────────────────────────────────────────────

    const fatores: Array<{ fator: string; impacto: string; peso: number }> = [];

    // Forma recente
    const homeVitorias = homeUltimosJogos.filter(j => j === "W").length;
    const awayVitorias = awayUltimosJogos.filter(j => j === "W").length;
    if (homeVitorias >= 3) fatores.push({ fator: "Forma", impacto: `${homeTeam.name} em boa forma (${homeVitorias}/5)`, peso: 1.1 });
    if (awayVitorias >= 3) fatores.push({ fator: "Forma", impacto: `${awayTeam.name} em boa forma (${awayVitorias}/5)`, peso: 1.1 });

    // H2H
    if (h2hStats.vitoriasHome > h2hStats.vitoriasAway) {
      fatores.push({ fator: "H2H", impacto: `${homeTeam.name} vence confrontos diretos`, peso: 1.05 });
    }

    // Aproveitamento
    if (homeAproveitamento > 60) fatores.push({ fator: "Aproveitamento", impacto: `${homeTeam.name} com ${homeAproveitamento}% de aproveitamento`, peso: 1.08 });
    if (awayAproveitamento > 60) fatores.push({ fator: "Aproveitamento", impacto: `${awayTeam.name} com ${awayAproveitamento}% de aproveitamento`, peso: 1.08 });

    // ─── Gerar Palpites ──────────────────────────────────────────────────────

    // BTTS
    if (probBTTS > 0.45) {
      const confianca = probBTTS > 0.60 ? "Alta" : probBTTS > 0.50 ? "Media" : "Baixa";
      palpites.push({
        fixtureId,
        homeTeam: homeTeam.name,
        homeTeamLogo: homeTeam.logo,
        awayTeam: awayTeam.name,
        awayTeamLogo: awayTeam.logo,
        leagueName: league.name,
        leagueLogo: league.logo,
        countryFlag,
        matchTime,
        mercado: "BTTS",
        palpite: "Sim",
        confianca,
        probabilidade: Math.round(probBTTS * 100),
        motivo: `Probabilidade de ${(probBTTS * 100).toFixed(1)}% baseada em modelo Poisson. ${homeTeam.name} marca ${homeMediaGolsEmCasa.toFixed(1)}/jogo em casa, ${awayTeam.name} marca ${awayMediaGolsForaEmCasa.toFixed(1)}/jogo fora.`,
        analiseDetalhada: {
          homeTeamStats: {
            mediaGols: homeMediaGols,
            mediaGolsForaEmCasa: homeMediaGolsEmCasa,
            mediaGolsSofridos: homeMediaGolsSofridos,
            forma: homeUltimosJogos.join(""),
            ultimosJogos: homeUltimosJogos,
            vitorias: homeStats.fixtures.wins.total,
            empates: homeStats.fixtures.draws.total,
            derrotas: homeStats.fixtures.loses.total,
            aproveitamento: homeAproveitamento,
          },
          awayTeamStats: {
            mediaGols: awayMediaGols,
            mediaGolsForaEmCasa: awayMediaGolsForaEmCasa,
            mediaGolsSofridos: awayMediaGolsSofridos,
            forma: awayUltimosJogos.join(""),
            ultimosJogos: awayUltimosJogos,
            vitorias: awayStats.fixtures.wins.total,
            empates: awayStats.fixtures.draws.total,
            derrotas: awayStats.fixtures.loses.total,
            aproveitamento: awayAproveitamento,
          },
          h2h: {
            ultimosJogos: h2hData.slice(0, 5).map(j => ({
              data: new Date(j.fixture.date).toLocaleDateString("pt-BR"),
              resultado: j.goals.home > j.goals.away ? "V" : j.goals.away > j.goals.home ? "D" : "E",
              placar: `${j.goals.home}-${j.goals.away}`,
            })),
            estatisticas: h2hStats,
          },
          modeloPoisson: {
            probabilidadeGolsHome: distHome,
            probabilidadeGolsAway: distAway,
            probabilidadeBTTS: probBTTS,
            probabilidadeOver25: probOver25,
          },
          fatoresInfluencia: fatores,
        },
      });
    }

    // Over Gols
    if (probOver25 > 0.45) {
      const confianca = probOver25 > 0.60 ? "Alta" : probOver25 > 0.50 ? "Media" : "Baixa";
      palpites.push({
        fixtureId,
        homeTeam: homeTeam.name,
        homeTeamLogo: homeTeam.logo,
        awayTeam: awayTeam.name,
        awayTeamLogo: awayTeam.logo,
        leagueName: league.name,
        leagueLogo: league.logo,
        countryFlag,
        matchTime,
        mercado: "Gols",
        palpite: "Over 2.5",
        confianca,
        probabilidade: Math.round(probOver25 * 100),
        motivo: `Probabilidade de ${(probOver25 * 100).toFixed(1)}% para Over 2.5 gols. Média combinada: ${(lambdaHome + lambdaAway).toFixed(2)} gols/jogo.`,
        analiseDetalhada: {
          homeTeamStats: {
            mediaGols: homeMediaGols,
            mediaGolsForaEmCasa: homeMediaGolsEmCasa,
            mediaGolsSofridos: homeMediaGolsSofridos,
            forma: homeUltimosJogos.join(""),
            ultimosJogos: homeUltimosJogos,
            vitorias: homeStats.fixtures.wins.total,
            empates: homeStats.fixtures.draws.total,
            derrotas: homeStats.fixtures.loses.total,
            aproveitamento: homeAproveitamento,
          },
          awayTeamStats: {
            mediaGols: awayMediaGols,
            mediaGolsForaEmCasa: awayMediaGolsForaEmCasa,
            mediaGolsSofridos: awayMediaGolsSofridos,
            forma: awayUltimosJogos.join(""),
            ultimosJogos: awayUltimosJogos,
            vitorias: awayStats.fixtures.wins.total,
            empates: awayStats.fixtures.draws.total,
            derrotas: awayStats.fixtures.loses.total,
            aproveitamento: awayAproveitamento,
          },
          h2h: {
            ultimosJogos: h2hData.slice(0, 5).map(j => ({
              data: new Date(j.fixture.date).toLocaleDateString("pt-BR"),
              resultado: j.goals.home > j.goals.away ? "V" : j.goals.away > j.goals.home ? "D" : "E",
              placar: `${j.goals.home}-${j.goals.away}`,
            })),
            estatisticas: h2hStats,
          },
          modeloPoisson: {
            probabilidadeGolsHome: distHome,
            probabilidadeGolsAway: distAway,
            probabilidadeBTTS: probBTTS,
            probabilidadeOver25: probOver25,
          },
          fatoresInfluencia: fatores,
        },
      });
    }

  } catch (error) {
    console.error(`Erro ao analisar fixture ${fixtureId}:`, error);
  }

  return palpites;
}

// ─── Função Principal ─────────────────────────────────────────────────────────

export async function getDestaquesAvancado(date?: string): Promise<ResultadoAnaliseAvancada> {
  const cacheKey = `destaques_avancado_${date ?? "today"}`;
  const cached = getCached<ResultadoAnaliseAvancada>(cacheKey);
  if (cached) return cached;

  const fixtures = await getTodayFixtures(date);
  if (!fixtures.length) {
    return {
      totalJogos: 0,
      totalLigas: 0,
      palpitesBTTS: [],
      palpitesGols: [],
      palpitesEscanteios: [],
      palpitesCartoes: [],
    };
  }

  const season = new Date().getFullYear();
  const allPalpites: PalpiteAvancado[] = [];

  // Processar TODOS os fixtures (não apenas 30)
  for (const fixture of fixtures) {
    if (fixture.fixture.status.short === "TBD") continue;
    const palpites = await analisarFixture(fixture, season);
    allPalpites.push(...palpites);
  }

  // Separar por mercado
  const palpitesBTTS = allPalpites.filter(p => p.mercado === "BTTS").sort((a, b) => b.probabilidade - a.probabilidade);
  const palpitesGols = allPalpites.filter(p => p.mercado === "Gols").sort((a, b) => b.probabilidade - a.probabilidade);
  const palpitesEscanteios = allPalpites.filter(p => p.mercado === "Escanteios").sort((a, b) => b.probabilidade - a.probabilidade);
  const palpitesCartoes = allPalpites.filter(p => p.mercado === "Cartões").sort((a, b) => b.probabilidade - a.probabilidade);

  const resultado: ResultadoAnaliseAvancada = {
    totalJogos: fixtures.length,
    totalLigas: new Set(fixtures.map(f => f.league.id)).size,
    palpitesBTTS,
    palpitesGols,
    palpitesEscanteios,
    palpitesCartoes,
  };

  setCached(cacheKey, resultado, 3600); // Cache por 1 hora
  return resultado;
}
