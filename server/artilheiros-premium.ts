import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = "https://v3.football.api-sports.io";

interface PlayerStats {
  playerId: number;
  playerName: string;
  playerPhoto?: string;
  teamId: number;
  teamName: string;
  teamLogo: string;
  leagueId: number;
  leagueName: string;
  season: number;
  
  // Estatísticas principais
  gols: number;
  assistencias: number;
  cartoes: number;
  amarelos?: number;
  vermelhos?: number;
  
  // Indicadores avançados
  eficiencia: number; // gols / chutes
  consistencia: number; // 0-100 (desvio padrão dos gols)
  forma: string; // W/D/L (últimos 3 jogos)
  
  // Histórico
  historicoGols: number[]; // últimos 5 jogos
  historicoAssistencias: number[]; // últimos 5 jogos
  
  // Comparações
  mediaLiga: number; // média de gols da liga
  acimaDaMedia: boolean;
  percentilLiga: number; // 0-100
}

interface ArtilheirosPremium {
  topGols: PlayerStats[];
  topAssistencias: PlayerStats[];
  topCartoes: PlayerStats[];
  topEficiencia: PlayerStats[];
  topConsistencia: PlayerStats[];
  topForma: PlayerStats[];
}

// Cache para evitar requisições excessivas
let cacheArtilheiros: { data: ArtilheirosPremium; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 segundos

// Dados simulados premium para fallback
const DADOS_SIMULADOS: ArtilheirosPremium = {
  topGols: [
    {
      playerId: 1,
      playerName: "Vinícius Júnior",
      playerPhoto: "https://media.api-sports.io/players/1.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 18,
      assistencias: 7,
      cartoes: 3,
      amarelos: 3,
      vermelhos: 0,
      eficiencia: 45.5,
      consistencia: 82,
      forma: "W",
      historicoGols: [2, 1, 2, 1, 2],
      historicoAssistencias: [1, 0, 1, 1, 0],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 98
    },
    {
      playerId: 2,
      playerName: "Erling Haaland",
      playerPhoto: "https://media.api-sports.io/players/2.png",
      teamId: 50,
      teamName: "Manchester City",
      teamLogo: "https://media.api-sports.io/teams/50.png",
      leagueId: 39,
      leagueName: "Premier League",
      season: 2025,
      gols: 22,
      assistencias: 5,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 52.3,
      consistencia: 85,
      forma: "W",
      historicoGols: [2, 2, 1, 2, 3],
      historicoAssistencias: [0, 1, 0, 1, 0],
      mediaLiga: 9.2,
      acimaDaMedia: true,
      percentilLiga: 99
    },
    {
      playerId: 3,
      playerName: "Kylian Mbappé",
      playerPhoto: "https://media.api-sports.io/players/3.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 16,
      assistencias: 6,
      cartoes: 4,
      amarelos: 4,
      vermelhos: 0,
      eficiencia: 48.2,
      consistencia: 78,
      forma: "W",
      historicoGols: [1, 2, 1, 2, 1],
      historicoAssistencias: [1, 0, 1, 0, 1],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 97
    }
  ],
  topAssistencias: [],
  topCartoes: [],
  topEficiencia: [],
  topConsistencia: [],
  topForma: []
};

export async function getArtilheirosAvancado(data: string): Promise<ArtilheirosPremium> {
  try {
    // Verificar cache
    if (cacheArtilheiros && Date.now() - cacheArtilheiros.timestamp < CACHE_TTL) {
      console.log("[Artilheiros] Retornando dados do cache");
      return cacheArtilheiros.data;
    }

    // Tentar buscar dados reais da API Football
    console.log("[Artilheiros] Buscando dados reais da API Football...");
    
    const fixturesRes = await axios.get(`${API_BASE}/fixtures`, {
      params: {
        date: data,
        apikey: API_KEY
      },
      timeout: 8000
    });

    const fixtures = fixturesRes.data?.response || [];
    console.log(`[Artilheiros] Encontrados ${fixtures.length} jogos para ${data}`);
    
    if (fixtures.length === 0) {
      console.log("[Artilheiros] Nenhum jogo encontrado, retornando dados simulados");
      return DADOS_SIMULADOS;
    }

     // Extrair ligas únicas dos jogos
    const ligasSet = new Set<string>();
    const ligas: Array<{ id: number; name: string; season: number }> = [];
    
    for (const f of fixtures) {
      const key = `${f.league.id}-${f.league.season}`;
      if (!ligasSet.has(key)) {
        ligasSet.add(key);
        ligas.push({
          id: f.league.id,
          name: f.league.name,
          season: f.league.season
        });
      }
    }

    const allPlayers = new Map<number, PlayerStats>();
    
    // Buscar top scorers de cada liga
    for (const liga of ligas as Array<{ id: number; name: string; season: number }>) {
      try {
        console.log(`[Artilheiros] Buscando artilheiros da liga ${liga.name} (${liga.id})...`);
        
        const topScorersRes = await axios.get(`${API_BASE}/players/topscorers`, {
          params: {
            league: liga.id,
            season: liga.season,
            apikey: API_KEY
          },
          timeout: 8000
        });

        const players = topScorersRes.data?.response || [];
        console.log(`[Artilheiros] Encontrados ${players.length} artilheiros em ${liga.name}`);
        
        for (const player of players.slice(0, 10)) {
          const playerId = player.player.id;
          
          if (!allPlayers.has(playerId)) {
            try {
              // Buscar estatísticas detalhadas
              const statsRes = await axios.get(`${API_BASE}/players`, {
                params: {
                  id: playerId,
                  season: liga.season,
                  apikey: API_KEY
                },
                timeout: 8000
              });

              const playerData = statsRes.data?.response?.[0];
              if (!playerData) continue;

              const stats = playerData.statistics?.[0] || {};
              const goals = (stats.goals?.total as number) || 0;
              const assists = (stats.goals?.assists as number) || 0;
              const shots = (stats.shots?.total as number) || 1;
              const yellowCards = (stats.cards?.yellow as number) || 0;
              const redCards = (stats.cards?.red as number) || 0;
              const cards = yellowCards + (redCards * 2);

              // Calcular eficiência
              const eficiencia = shots > 0 ? (goals / shots) * 100 : 0;

              // Buscar últimos 5 jogos
              const fixturesPlayerRes = await axios.get(`${API_BASE}/fixtures`, {
                params: {
                  player: playerId,
                  season: liga.season,
                  last: 5,
                  apikey: API_KEY
                },
                timeout: 8000
              });

              const playerFixtures = fixturesPlayerRes.data?.response || [];
              const historicoGols = playerFixtures.map((f: any) => f.statistics?.[0]?.goals?.total || 0);
              const historicoAssistencias = playerFixtures.map((f: any) => f.statistics?.[0]?.goals?.assists || 0);

              // Calcular consistência (desvio padrão)
              const mediaGols = historicoGols.length > 0 ? historicoGols.reduce((a: number, b: number) => a + b, 0) / historicoGols.length : 0;
              const variancia = historicoGols.length > 0 
                ? historicoGols.reduce((sum: number, g: number) => sum + Math.pow(g - mediaGols, 2), 0) / historicoGols.length
                : 0;
              const desvio = Math.sqrt(variancia);
              const consistencia = Math.max(0, 100 - desvio * 20);

              // Forma (últimos 3 jogos)
              const ultimos3 = playerFixtures.slice(0, 3);
              let forma = "W";
              if (ultimos3.some((f: any) => f.fixture.status === "Match Finished" && f.goals.home < f.goals.away)) {
                forma = "L";
              } else if (ultimos3.some((f: any) => f.fixture.status === "Match Finished" && f.goals.home === f.goals.away)) {
                forma = "D";
              }

              allPlayers.set(playerId, {
                playerId,
                playerName: player.player.name,
                playerPhoto: player.player.photo,
                teamId: (player.statistics?.[0]?.team?.id as number) || 0,
                teamName: (player.statistics?.[0]?.team?.name as string) || "",
                teamLogo: (player.statistics?.[0]?.team?.logo as string) || "",
                leagueId: liga.id as number,
                leagueName: liga.name as string,
                season: liga.season,
                gols: goals,
                assistencias: assists,
                cartoes: cards,
                amarelos: yellowCards,
                vermelhos: redCards,
                eficiencia,
                consistencia,
                forma,
                historicoGols,
                historicoAssistencias,
                mediaLiga: 0,
                acimaDaMedia: false,
                percentilLiga: 0
              });
            } catch (err) {
              console.error(`[Artilheiros] Erro ao buscar detalhes do jogador ${playerId}:`, err instanceof Error ? err.message : err);
              continue;
            }
          }
        }
      } catch (err) {
        console.error(`[Artilheiros] Erro ao buscar artilheiros da liga ${liga.name}:`, err instanceof Error ? err.message : err);
        continue;
      }
    }

    // Calcular percentil por liga
    const playersByLiga = new Map<number, PlayerStats[]>();
    allPlayers.forEach((player) => {
      if (!playersByLiga.has(player.leagueId)) {
        playersByLiga.set(player.leagueId, []);
      }
      playersByLiga.get(player.leagueId)!.push(player);
    });

    playersByLiga.forEach((players, leagueId) => {
      const mediaLiga = players.reduce((sum: number, p: PlayerStats) => sum + p.gols, 0) / Math.max(1, players.length);
      const golsSorted = players.map((p: PlayerStats) => p.gols).sort((a: number, b: number) => b - a);

      for (const player of players) {
        player.mediaLiga = mediaLiga;
        player.acimaDaMedia = player.gols > mediaLiga;
        const posicao = golsSorted.indexOf(player.gols) + 1;
        player.percentilLiga = Math.max(0, 100 - (posicao / (players as PlayerStats[]).length) * 100);
      }
    });

    // Ordenar por diferentes critérios
    const allPlayersArray = Array.from(allPlayers.values());
    
    const resultado = {
      topGols: allPlayersArray.sort((a, b) => b.gols - a.gols).slice(0, 20),
      topAssistencias: allPlayersArray.sort((a, b) => b.assistencias - a.assistencias).slice(0, 20),
      topCartoes: allPlayersArray.sort((a, b) => b.cartoes - a.cartoes).slice(0, 20),
      topEficiencia: allPlayersArray.sort((a, b) => b.eficiencia - a.eficiencia).slice(0, 20),
      topConsistencia: allPlayersArray.sort((a, b) => b.consistencia - a.consistencia).slice(0, 20),
      topForma: allPlayersArray.slice(0, 20)
    };

    // Armazenar no cache
    cacheArtilheiros = {
      data: resultado,
      timestamp: Date.now()
    };

    console.log(`[Artilheiros] Dados reais carregados com sucesso! Total de jogadores: ${allPlayersArray.length}`);
    return resultado;
  } catch (error) {
    console.error("[Artilheiros] Erro ao buscar artilheiros avançado, usando dados simulados:", error instanceof Error ? error.message : error);
    return DADOS_SIMULADOS;
  }
}
