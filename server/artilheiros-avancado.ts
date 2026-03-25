import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const BASE_URL = "https://v3.football.api-sports.io";

// ─── Cache ────────────────────────────────────────────────────────────────────

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

export type ArtilheiroAvancado = {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  teamName: string;
  teamLogo: string;
  leagueName: string;
  countryFlag: string;
  matchTime: string;
  opponent: string;
  
  // Estatísticas
  totalGols: number;
  totalAssistencias: number;
  totalChutesGol: number;
  totalCartoes: number;
  mediaGolsPorJogo: number;
  mediaAssistenciasPorJogo: number;
  mediaChutesGolPorJogo: number;
  mediaCartoesPorJogo: number;
  
  // Análise
  confianca: "Alta" | "Media" | "Baixa";
  motivo: string;
  
  // Comparação
  posicaoRanking: number;
  ultimosJogos: Array<{
    data: string;
    adversario: string;
    gols: number;
    assistencias: number;
    cartoes: number;
  }>;
};

export type ResultadoArtilheiros = {
  totalJogos: number;
  totalLigas: number;
  artilheiros: ArtilheiroAvancado[];
  indisciplinados: ArtilheiroAvancado[];
};

// ─── Função Principal ─────────────────────────────────────────────────────────

export async function getArtilheirosAvancado(fixtures: any[]): Promise<ResultadoArtilheiros> {
  const season = new Date().getFullYear();
  const artilheiros: Map<string, ArtilheiroAvancado> = new Map();
  const indisciplinados: Map<string, ArtilheiroAvancado> = new Map();

  // Extrair todas as ligas únicas dos jogos de hoje
  const uniqueLeagues = new Map<number, any>();
  for (const fixture of fixtures) {
    if (fixture.fixture.status.short !== "TBD") {
      uniqueLeagues.set(fixture.league.id, fixture.league);
    }
  }

  console.log(`[Artilheiros] Processando ${uniqueLeagues.size} ligas únicas...`);

  // Processar cada liga
  for (const leagueId of Array.from(uniqueLeagues.keys())) {
    const league = uniqueLeagues.get(leagueId)!;
    // Tentar múltiplas temporadas
    const temporadas = [season, season - 1, season + 1, season - 2];
    let topScorers: any[] = [];

    for (const temporada of temporadas) {
      try {
        const cacheKey = `topscorers_${leagueId}_${temporada}`;
        let scorers = getCached<any[]>(cacheKey);

        if (!scorers) {
          scorers = await apiRequest<any[]>("players/topscorers", {
            league: String(leagueId),
            season: String(temporada),
          });
          if (scorers && scorers.length > 0) {
            setCached(cacheKey, scorers, 3600); // Cache por 1 hora
          }
        }

        if (scorers && scorers.length > 0) {
          topScorers = scorers;
          console.log(`[Artilheiros] Liga ${league.name}: ${topScorers.length} artilheiros encontrados (temporada ${temporada})`);
          break; // Encontrou dados, não precisa tentar outras temporadas
        }
      } catch (error) {
        // Continuar para próxima temporada
        continue;
      }
    }

    // Processar artilheiros da liga
    for (const scorer of topScorers.slice(0, 20)) {
      // Verificar se o jogador joga hoje
      const teamId = scorer.statistics?.[0]?.team?.id;
      if (!teamId) continue;

      const fixtureHoje = fixtures.find(
        f => (f.teams.home.id === teamId || f.teams.away.id === teamId) && f.fixture.status.short !== "TBD"
      );

      if (!fixtureHoje) continue;

      const stat = scorer.statistics[0];
      const gols = stat.goals?.total || 0;
      const assistencias = stat.goals?.assists || 0;
      const chutesGol = stat.shots?.on || 0;
      const cartoes = (stat.cards?.yellow || 0) + (stat.cards?.red || 0);

      const opponent = fixtureHoje.teams.home.id === teamId
        ? fixtureHoje.teams.away.name
        : fixtureHoje.teams.home.name;

      const matchTime = new Date(fixtureHoje.fixture.date).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

      // Buscar histórico de últimos jogos
      let ultimosJogos: any[] = [];
      try {
        const fixtures_list = await apiRequest<any[]>("fixtures", {
          player: String(scorer.player.id),
          last: "5",
        });
        ultimosJogos = fixtures_list || [];
      } catch {
        // Sem histórico
      }

      // Calcular estatísticas por jogo
      const jogosJogados = Math.max(1, stat.games?.appearences || 1);
      const mediaGolsPorJogo = gols / jogosJogados;
      const mediaAssistenciasPorJogo = assistencias / jogosJogados;
      const mediaChutesGolPorJogo = chutesGol / jogosJogados;
      const mediaCartoesPorJogo = cartoes / jogosJogados;

      // Determinar confiança
      let confianca: "Alta" | "Media" | "Baixa" = "Baixa";
      if (mediaGolsPorJogo >= 0.5) confianca = "Alta";
      else if (mediaGolsPorJogo >= 0.3) confianca = "Media";

      // Motivo
      const motivo = `${gols} gols em ${jogosJogados} jogos (${mediaGolsPorJogo.toFixed(2)}/jogo). ${assistencias} assistências. Chutes a gol: ${chutesGol}.`;

      // Artilheiro
      if (gols > 0) {
        const key = `artilheiro_${scorer.player.id}`;
        const artilheiro: ArtilheiroAvancado = {
          playerId: scorer.player.id,
          playerName: scorer.player.name,
          playerPhoto: scorer.player.photo,
          teamName: stat.team.name,
          teamLogo: stat.team.logo,
          leagueName: league.name,
          countryFlag: league.flag || "",
          matchTime,
          opponent,
          totalGols: gols,
          totalAssistencias: assistencias,
          totalChutesGol: chutesGol,
          totalCartoes: cartoes,
          mediaGolsPorJogo,
          mediaAssistenciasPorJogo,
          mediaChutesGolPorJogo,
          mediaCartoesPorJogo,
          confianca,
          motivo,
          posicaoRanking: topScorers.indexOf(scorer) + 1,
          ultimosJogos: ultimosJogos.slice(0, 5).map((f: any) => ({
            data: new Date(f.fixture.date).toLocaleDateString("pt-BR"),
            adversario: f.teams.home.id === teamId ? f.teams.away.name : f.teams.home.name,
            gols: f.teams.home.id === teamId ? f.goals.home : f.goals.away,
            assistencias: 0, // Não disponível na listagem de fixtures
            cartoes: 0, // Não disponível na listagem de fixtures
          })),
        };
        artilheiros.set(key, artilheiro);
      }

      // Indisciplinado (cartões)
      if (cartoes > 0) {
        const key = `indisciplinado_${scorer.player.id}`;
        const indisciplinado: ArtilheiroAvancado = {
          playerId: scorer.player.id,
          playerName: scorer.player.name,
          playerPhoto: scorer.player.photo,
          teamName: stat.team.name,
          teamLogo: stat.team.logo,
          leagueName: league.name,
          countryFlag: league.flag || "",
          matchTime,
          opponent,
          totalGols: gols,
          totalAssistencias: assistencias,
          totalChutesGol: chutesGol,
          totalCartoes: cartoes,
          mediaGolsPorJogo,
          mediaAssistenciasPorJogo,
          mediaChutesGolPorJogo,
          mediaCartoesPorJogo,
          confianca: cartoes >= 3 ? "Alta" : cartoes >= 2 ? "Media" : "Baixa",
          motivo: `${cartoes} cartões em ${jogosJogados} jogos (${mediaCartoesPorJogo.toFixed(2)}/jogo). Histórico de indisciplina.`,
          posicaoRanking: topScorers.indexOf(scorer) + 1,
          ultimosJogos: ultimosJogos.slice(0, 5).map((f: any) => ({
            data: new Date(f.fixture.date).toLocaleDateString("pt-BR"),
            adversario: f.teams.home.id === teamId ? f.teams.away.name : f.teams.home.name,
            gols: f.teams.home.id === teamId ? f.goals.home : f.goals.away,
            assistencias: 0,
            cartoes: 0,
          })),
        };
        indisciplinados.set(key, indisciplinado);
      }
    }
  }

  // Ordenar por confiança e gols
  const artilheirosOrdenados = Array.from(artilheiros.values())
    .sort((a, b) => {
      const confOrder = { "Alta": 0, "Media": 1, "Baixa": 2 };
      if (confOrder[a.confianca] !== confOrder[b.confianca]) {
        return confOrder[a.confianca] - confOrder[b.confianca];
      }
      return b.totalGols - a.totalGols;
    })
    .slice(0, 50);

  const indisciplinadosOrdenados = Array.from(indisciplinados.values())
    .sort((a, b) => {
      const confOrder = { "Alta": 0, "Media": 1, "Baixa": 2 };
      if (confOrder[a.confianca] !== confOrder[b.confianca]) {
        return confOrder[a.confianca] - confOrder[b.confianca];
      }
      return b.totalCartoes - a.totalCartoes;
    })
    .slice(0, 50);

  return {
    totalJogos: fixtures.filter(f => f.fixture.status.short !== "TBD").length,
    totalLigas: uniqueLeagues.size,
    artilheiros: artilheirosOrdenados,
    indisciplinados: indisciplinadosOrdenados,
  };
}
