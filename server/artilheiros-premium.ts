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
      historicoGols: [1, 2, 1, 2, 2],
      historicoAssistencias: [1, 1, 0, 1, 1],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 95
    },
    {
      playerId: 4,
      playerName: "Rodrygo",
      playerPhoto: "https://media.api-sports.io/players/4.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 12,
      assistencias: 4,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 42.1,
      consistencia: 75,
      forma: "D",
      historicoGols: [1, 1, 0, 1, 1],
      historicoAssistencias: [0, 0, 1, 0, 0],
      mediaLiga: 8.5,
      acimaDaMedia: true,
      percentilLiga: 88
    },
    {
      playerId: 5,
      playerName: "Phil Foden",
      playerPhoto: "https://media.api-sports.io/players/5.png",
      teamId: 50,
      teamName: "Manchester City",
      teamLogo: "https://media.api-sports.io/teams/50.png",
      leagueId: 39,
      leagueName: "Premier League",
      season: 2025,
      gols: 14,
      assistencias: 8,
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      eficiencia: 44.8,
      consistencia: 80,
      forma: "W",
      historicoGols: [1, 1, 2, 1, 1],
      historicoAssistencias: [1, 1, 1, 1, 0],
      mediaLiga: 9.2,
      acimaDaMedia: true,
      percentilLiga: 92
    }
  ],
  topAssistencias: [
    {
      playerId: 6,
      playerName: "Toni Kroos",
      playerPhoto: "https://media.api-sports.io/players/6.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 5,
      assistencias: 12,
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      eficiencia: 35.2,
      consistencia: 70,
      forma: "W",
      historicoGols: [0, 0, 1, 0, 0],
      historicoAssistencias: [2, 1, 2, 2, 1],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 85
    },
    {
      playerId: 7,
      playerName: "Kevin De Bruyne",
      playerPhoto: "https://media.api-sports.io/players/7.png",
      teamId: 50,
      teamName: "Manchester City",
      teamLogo: "https://media.api-sports.io/teams/50.png",
      leagueId: 39,
      leagueName: "Premier League",
      season: 2025,
      gols: 6,
      assistencias: 10,
      cartoes: 2,
      amarelos: 2,
      vermelhos: 0,
      eficiencia: 40.5,
      consistencia: 75,
      forma: "W",
      historicoGols: [0, 1, 0, 0, 1],
      historicoAssistencias: [2, 1, 2, 1, 2],
      mediaLiga: 9.2,
      acimaDaMedia: false,
      percentilLiga: 88
    }
  ],
  topCartoes: [
    {
      playerId: 8,
      playerName: "Sergio Ramos",
      playerPhoto: "https://media.api-sports.io/players/8.png",
      teamId: 541,
      teamName: "Real Madrid",
      teamLogo: "https://media.api-sports.io/teams/541.png",
      leagueId: 140,
      leagueName: "La Liga",
      season: 2025,
      gols: 2,
      assistencias: 1,
      cartoes: 8,
      amarelos: 8,
      vermelhos: 0,
      eficiencia: 25.0,
      consistencia: 60,
      forma: "D",
      historicoGols: [0, 0, 0, 1, 0],
      historicoAssistencias: [0, 0, 0, 0, 0],
      mediaLiga: 8.5,
      acimaDaMedia: false,
      percentilLiga: 15
    },
    {
      playerId: 9,
      playerName: "Rúben Dias",
      playerPhoto: "https://media.api-sports.io/players/9.png",
      teamId: 50,
      teamName: "Manchester City",
      teamLogo: "https://media.api-sports.io/teams/50.png",
      leagueId: 39,
      leagueName: "Premier League",
      season: 2025,
      gols: 1,
      assistencias: 0,
      cartoes: 6,
      amarelos: 6,
      vermelhos: 0,
      eficiencia: 20.0,
      consistencia: 55,
      forma: "D",
      historicoGols: [0, 0, 0, 0, 0],
      historicoAssistencias: [0, 0, 0, 0, 0],
      mediaLiga: 9.2,
      acimaDaMedia: false,
      percentilLiga: 20
    }
  ],
  topEficiencia: [],
  topConsistencia: [],
  topForma: []
};

export async function getArtilheirosAvancado(data: string): Promise<ArtilheirosPremium> {
  try {
    console.log("[Artilheiros] Retornando dados simulados premium para demonstração");
    return DADOS_SIMULADOS;
  } catch (error) {
    console.error("[Artilheiros] Erro ao buscar artilheiros avançado, usando dados simulados:", error instanceof Error ? error.message : error);
    return DADOS_SIMULADOS;
  }
}
