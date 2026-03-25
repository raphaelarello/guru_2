import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = "https://v3.football.api-sports.io";

interface PlayerStats {
  playerId: number;
  playerName: string;
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

export async function getArtilheirosAvancado(data: string): Promise<ArtilheirosPremium> {
  try {
    // Buscar fixtures do dia
    const fixturesRes = await axios.get(`${API_BASE}/fixtures`, {
      params: {
        date: data,
        apikey: API_KEY
      },
      timeout: 10000
    });

    const fixtures = fixturesRes.data?.response || [];
    
    // Extrair ligas únicas
    const ligas = Array.from(new Set(fixtures.map((f: any) => f.league.id)));
    
    // Buscar top scorers de cada liga
    const allPlayers = new Map<number, PlayerStats>();
    
    for (const leagueId of ligas) {
      for (const season of [2025, 2024, 2026]) {
        try {
          const topScorersRes = await axios.get(`${API_BASE}/players/topscorers`, {
            params: {
              league: leagueId,
              season: season,
              apikey: API_KEY
            },
            timeout: 10000
          });

          const players = topScorersRes.data?.response || [];
          
          for (const player of players) {
            const playerId = player.player.id;
            
            if (!allPlayers.has(playerId)) {
              // Buscar estatísticas detalhadas
              const statsRes = await axios.get(`${API_BASE}/players`, {
                params: {
                  id: playerId,
                  season: season,
                  apikey: API_KEY
                },
                timeout: 10000
              });

              const playerData = statsRes.data?.response?.[0];
              if (!playerData) continue;

              const stats = playerData.statistics?.[0] || {};
              const goals = (stats.goals?.total as number) || 0;
              const assists = (stats.goals?.assists as number) || 0;
              const shots = (stats.shots?.total as number) || 1;
              const cards = ((stats.cards?.yellow as number) || 0) + ((stats.cards?.red as number) || 0) * 2;

              // Calcular eficiência
              const eficiencia = shots > 0 ? (goals / shots) * 100 : 0;

              // Buscar últimos 5 jogos
              const fixturesPlayerRes = await axios.get(`${API_BASE}/fixtures`, {
                params: {
                  player: playerId,
                  season: season,
                  last: 5,
                  apikey: API_KEY
                },
                timeout: 10000
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
              const consistencia = Math.max(0, 100 - desvio * 20); // Normalizar para 0-100

              // Forma (últimos 3 jogos)
              const ultimos3 = playerFixtures.slice(0, 3);
              let forma = "W";
              if (ultimos3.some((f: any) => f.fixture.status === "Match Finished" && f.teams.home.id === playerData.player.team?.id && f.goals.home < f.goals.away)) {
                forma = "L";
              } else if (ultimos3.some((f: any) => f.fixture.status === "Match Finished" && f.goals.home === f.goals.away)) {
                forma = "D";
              }

              allPlayers.set(playerId, {
                playerId,
                playerName: player.player.name,
                teamId: (player.statistics?.[0]?.team?.id as number) || 0,
                teamName: (player.statistics?.[0]?.team?.name as string) || "",
                teamLogo: (player.statistics?.[0]?.team?.logo as string) || "",
                leagueId: leagueId as number,
                leagueName: player.league.name,
                season,
                gols: goals,
                assistencias: assists,
                cartoes: cards,
                eficiencia,
                consistencia,
                forma,
                historicoGols,
                historicoAssistencias,
                mediaLiga: 0,
                acimaDaMedia: false,
                percentilLiga: 0
              });
            }
          }
        } catch (err) {
          // Continuar com próxima temporada
          continue;
        }
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
    
    return {
      topGols: allPlayersArray.sort((a, b) => b.gols - a.gols).slice(0, 10),
      topAssistencias: allPlayersArray.sort((a, b) => b.assistencias - a.assistencias).slice(0, 10),
      topCartoes: allPlayersArray.sort((a, b) => b.cartoes - a.cartoes).slice(0, 10),
      topEficiencia: allPlayersArray.sort((a, b) => b.eficiencia - a.eficiencia).slice(0, 10),
      topConsistencia: allPlayersArray.sort((a, b) => b.consistencia - a.consistencia).slice(0, 10),
      topForma: allPlayersArray.sort((a, b) => {
        const formaScore = { W: 3, D: 1, L: 0 };
        return (formaScore[b.forma as keyof typeof formaScore] || 0) - (formaScore[a.forma as keyof typeof formaScore] || 0);
      }).slice(0, 10)
    };
  } catch (error) {
    console.error("Erro ao buscar artilheiros avançado:", error);
    return {
      topGols: [],
      topAssistencias: [],
      topCartoes: [],
      topEficiencia: [],
      topConsistencia: [],
      topForma: []
    };
  }
}
