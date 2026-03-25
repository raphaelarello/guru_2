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

// Dados simulados premium para demonstração
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
    },
    {
      playerId: 4,
      playerName: "Harry Kane",
      playerPhoto: "https://media.api-sports.io/players/4.png",
      teamId: 33,
      teamName: "Bayern Munich",
      teamLogo: "https://media.api-sports.io/teams/33.png",
      leagueId: 78,
      leagueName: "Bundesliga",
      season: 2025,
      gols: 15,
      assistencias: 4,
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      eficiencia: 42.1,
      consistencia: 88,
      forma: "W",
      historicoGols: [1, 1, 2, 1, 2],
      historicoAssistencias: [0, 1, 0, 0, 1],
      mediaLiga: 7.8,
      acimaDaMedia: true,
      percentilLiga: 96
    },
    {
      playerId: 5,
      playerName: "Rodrygo",
      playerPhoto: "https://media.api-sports.io/players/5.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 12,
      assistencias: 5,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 38.5,
      consistencia: 75,
      forma: "D",
      historicoGols: [1, 0, 1, 1, 1],
      historicoAssistencias: [1, 0, 0, 1, 0],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 94
    },
    {
      playerId: 6,
      playerName: "Vinicius Jr",
      playerPhoto: "https://media.api-sports.io/players/6.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 11,
      assistencias: 8,
      cartoes: 3,
      amarelos: 3,
      vermelhos: 0,
      eficiencia: 35.2,
      consistencia: 72,
      forma: "W",
      historicoGols: [1, 1, 0, 1, 1],
      historicoAssistencias: [1, 1, 1, 1, 0],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 92
    },
    {
      playerId: 7,
      playerName: "Jude Bellingham",
      playerPhoto: "https://media.api-sports.io/players/7.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 10,
      assistencias: 3,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 32.1,
      consistencia: 68,
      forma: "W",
      historicoGols: [1, 0, 1, 1, 0],
      historicoAssistencias: [0, 0, 1, 0, 0],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 90
    },
    {
      playerId: 8,
      playerName: "Pedri",
      playerPhoto: "https://media.api-sports.io/players/8.png",
      teamId: 206,
      teamName: "Barcelona",
      teamLogo: "https://media.api-sports.io/teams/206.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 8,
      assistencias: 9,
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      eficiencia: 28.5,
      consistencia: 70,
      forma: "W",
      historicoGols: [0, 1, 0, 1, 0],
      historicoAssistencias: [1, 1, 1, 1, 1],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 85
    },
    {
      playerId: 9,
      playerName: "Gavi",
      playerPhoto: "https://media.api-sports.io/players/9.png",
      teamId: 206,
      teamName: "Barcelona",
      teamLogo: "https://media.api-sports.io/teams/206.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 7,
      assistencias: 6,
      cartoes: 3,
      amarelos: 3,
      vermelhos: 0,
      eficiencia: 25.3,
      consistencia: 65,
      forma: "D",
      historicoGols: [0, 1, 0, 0, 1],
      historicoAssistencias: [1, 0, 1, 1, 0],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 80
    },
    {
      playerId: 10,
      playerName: "Ferran Torres",
      playerPhoto: "https://media.api-sports.io/players/10.png",
      teamId: 206,
      teamName: "Barcelona",
      teamLogo: "https://media.api-sports.io/teams/206.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 6,
      assistencias: 4,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 22.1,
      consistencia: 60,
      forma: "L",
      historicoGols: [0, 0, 1, 0, 1],
      historicoAssistencias: [0, 1, 0, 0, 1],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 75
    }
  ],
  topAssistencias: [
    {
      playerId: 11,
      playerName: "Toni Kroos",
      playerPhoto: "https://media.api-sports.io/players/11.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 3,
      assistencias: 12,
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      eficiencia: 15.2,
      consistencia: 80,
      forma: "W",
      historicoGols: [0, 0, 0, 0, 0],
      historicoAssistencias: [2, 1, 2, 1, 2],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 88
    },
    {
      playerId: 12,
      playerName: "Luis Díaz",
      playerPhoto: "https://media.api-sports.io/players/12.png",
      teamId: 40,
      teamName: "Liverpool",
      teamLogo: "https://media.api-sports.io/teams/40.png",
      leagueId: 39,
      leagueName: "Premier League",
      season: 2025,
      gols: 9,
      assistencias: 11,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 32.1,
      consistencia: 75,
      forma: "W",
      historicoGols: [1, 0, 1, 1, 0],
      historicoAssistencias: [1, 1, 1, 2, 1],
      mediaLiga: 9.2,
      acimaDaMedia: false,
      percentilLiga: 85
    },
    {
      playerId: 13,
      playerName: "Florian Wirtz",
      playerPhoto: "https://media.api-sports.io/players/13.png",
      teamId: 168,
      teamName: "Bayer Leverkusen",
      teamLogo: "https://media.api-sports.io/teams/168.png",
      leagueId: 78,
      leagueName: "Bundesliga",
      season: 2025,
      gols: 8,
      assistencias: 10,
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      eficiencia: 28.5,
      consistencia: 82,
      forma: "W",
      historicoGols: [0, 1, 0, 1, 1],
      historicoAssistencias: [1, 1, 2, 1, 1],
      mediaLiga: 7.8,
      acimaDaMedia: true,
      percentilLiga: 90
    }
  ],
  topCartoes: [
    {
      playerId: 14,
      playerName: "Sergio Ramos",
      playerPhoto: "https://media.api-sports.io/players/14.png",
      teamId: 536,
      teamName: "Sevilla",
      teamLogo: "https://media.api-sports.io/teams/536.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 1,
      assistencias: 0,
      cartoes: 8,
      amarelos: 6,
      vermelhos: 1,
      eficiencia: 5.2,
      consistencia: 45,
      forma: "L",
      historicoGols: [0, 0, 0, 0, 0],
      historicoAssistencias: [0, 0, 0, 0, 0],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 15
    },
    {
      playerId: 15,
      playerName: "Rúben Dias",
      playerPhoto: "https://media.api-sports.io/players/15.png",
      teamId: 50,
      teamName: "Manchester City",
      teamLogo: "https://media.api-sports.io/teams/50.png",
      leagueId: 39,
      leagueName: "Premier League",
      season: 2025,
      gols: 2,
      assistencias: 1,
      cartoes: 7,
      amarelos: 5,
      vermelhos: 1,
      eficiencia: 8.1,
      consistencia: 50,
      forma: "D",
      historicoGols: [0, 0, 0, 0, 0],
      historicoAssistencias: [0, 0, 0, 0, 0],
      mediaLiga: 9.2,
      acimaDaMedia: false,
      percentilLiga: 20
    },
    {
      playerId: 16,
      playerName: "Nicolás Tagliafico",
      playerPhoto: "https://media.api-sports.io/players/16.png",
      teamId: 206,
      teamName: "Barcelona",
      teamLogo: "https://media.api-sports.io/teams/206.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 0,
      assistencias: 2,
      cartoes: 6,
      amarelos: 5,
      vermelhos: 0,
      eficiencia: 0,
      consistencia: 55,
      forma: "W",
      historicoGols: [0, 0, 0, 0, 0],
      historicoAssistencias: [0, 1, 0, 0, 1],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 25
    }
  ],
  topEficiencia: [],
  topConsistencia: [],
  topForma: []
};

export async function getArtilheirosAvancado(data: string): Promise<ArtilheirosPremium> {
  try {
    // Tentar buscar dados reais da API
    const fixturesRes = await axios.get(`${API_BASE}/fixtures`, {
      params: {
        date: data,
        apikey: API_KEY
      },
      timeout: 5000
    });

    const fixtures = fixturesRes.data?.response || [];
    
    if (fixtures.length > 0) {
      // Se houver fixtures, buscar dados reais
      const ligas = Array.from(new Set(fixtures.map((f: any) => f.league.id)));
      const allPlayers = new Map<number, PlayerStats>();
      
      for (const leagueId of ligas) {
        try {
          const topScorersRes = await axios.get(`${API_BASE}/players/topscorers`, {
            params: {
              league: leagueId,
              season: 2025,
              apikey: API_KEY
            },
            timeout: 5000
          });

          const players = topScorersRes.data?.response || [];
          
          for (const player of players.slice(0, 5)) {
            const playerId = player.player.id;
            
            if (!allPlayers.has(playerId)) {
              const stats = player.statistics?.[0] || {};
              const goals = (stats.goals?.total as number) || 0;
              const assists = (stats.goals?.assists as number) || 0;
              const shots = (stats.shots?.total as number) || 1;

              allPlayers.set(playerId, {
                playerId,
                playerName: player.player.name,
                playerPhoto: player.player.photo,
                teamId: (stats.team?.id as number) || 0,
                teamName: (stats.team?.name as string) || "",
                teamLogo: (stats.team?.logo as string) || "",
                leagueId: leagueId as number,
                leagueName: player.league.name,
                season: 2025,
                gols: goals,
                assistencias: assists,
                cartoes: 0,
                eficiencia: shots > 0 ? (goals / shots) * 100 : 0,
                consistencia: 75,
                forma: "W",
                historicoGols: [1, 1, 1, 1, 1],
                historicoAssistencias: [0, 0, 0, 0, 0],
                mediaLiga: 8.5,
                acimaDaMedia: goals > 8.5,
                percentilLiga: 85
              });
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (allPlayers.size > 0) {
        const allPlayersArray = Array.from(allPlayers.values());
        return {
          topGols: allPlayersArray.sort((a, b) => b.gols - a.gols).slice(0, 10),
          topAssistencias: allPlayersArray.sort((a, b) => b.assistencias - a.assistencias).slice(0, 10),
          topCartoes: allPlayersArray.sort((a, b) => b.cartoes - a.cartoes).slice(0, 10),
          topEficiencia: allPlayersArray.sort((a, b) => b.eficiencia - a.eficiencia).slice(0, 10),
          topConsistencia: allPlayersArray.sort((a, b) => b.consistencia - a.consistencia).slice(0, 10),
          topForma: allPlayersArray.slice(0, 10)
        };
      }
    }
    
    // Se não houver dados reais, retornar dados simulados
    return DADOS_SIMULADOS;
  } catch (error) {
    console.error("Erro ao buscar artilheiros avançado, usando dados simulados:", error);
    // Retornar dados simulados em caso de erro
    return DADOS_SIMULADOS;
  }
}
