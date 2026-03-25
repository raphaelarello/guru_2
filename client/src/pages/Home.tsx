import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Heart } from "lucide-react";

// Dados simulados de jogos
const MOCK_GAMES = [
  {
    id: 1,
    league: "UEFA Champions League",
    leagueId: "cl",
    leagueFlag: "🇪🇺",
    homeTeam: "Manchester United",
    awayTeam: "Bayern Munich",
    homeTeamId: 33,
    awayTeamId: 25,
    homeTeamLogo: "https://media.api-sports.io/teams/33.png",
    awayTeamLogo: "https://media.api-sports.io/teams/25.png",
    homeScore: 2,
    awayScore: 1,
    status: "live",
    minute: 45,
    stadium: "Old Trafford",
    startTime: "2026-03-25T17:00:00Z",
    cards: { home: 1, away: 0 },
    corners: { home: 5, away: 3 },
    shots: { home: 8, away: 6 },
    possession: { home: 65, away: 35 },
    favoriteOdds: 1.85,
    underdog: 2.05,
    draw: 3.60,
  },
  {
    id: 2,
    league: "La Liga",
    leagueId: "la",
    leagueFlag: "🇪🇸",
    homeTeam: "Real Madrid",
    awayTeam: "FC Barcelona",
    homeTeamId: 541,
    awayTeamId: 529,
    homeTeamLogo: "https://media.api-sports.io/teams/541.png",
    awayTeamLogo: "https://media.api-sports.io/teams/529.png",
    homeScore: 3,
    awayScore: 2,
    status: "finished",
    minute: 90,
    stadium: "Santiago Bernabéu",
    startTime: "2026-03-25T20:00:00Z",
    cards: { home: 2, away: 1 },
    corners: { home: 7, away: 4 },
    shots: { home: 12, away: 9 },
    possession: { home: 58, away: 42 },
  },
  {
    id: 3,
    league: "Premier League",
    leagueId: "pl",
    leagueFlag: "🇬🇧",
    homeTeam: "Liverpool",
    awayTeam: "Arsenal",
    homeTeamId: 40,
    awayTeamId: 42,
    homeTeamLogo: "https://media.api-sports.io/teams/40.png",
    awayTeamLogo: "https://media.api-sports.io/teams/42.png",
    homeScore: 0,
    awayScore: 0,
    status: "upcoming",
    minute: 0,
    stadium: "Anfield",
    startTime: "2026-03-25T19:45:00Z",
    cards: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    shots: { home: 0, away: 0 },
    possession: { home: 0, away: 0 },
  },
  {
    id: 4,
    league: "Série A",
    leagueId: "sa",
    leagueFlag: "🇧🇷",
    homeTeam: "Flamengo",
    awayTeam: "Vasco da Gama",
    homeTeamId: 64,
    awayTeamId: 71,
    homeTeamLogo: "https://media.api-sports.io/teams/64.png",
    awayTeamLogo: "https://media.api-sports.io/teams/71.png",
    homeScore: 1,
    awayScore: 1,
    status: "live",
    minute: 67,
    stadium: "Maracanã",
    startTime: "2026-03-25T21:00:00Z",
    cards: { home: 0, away: 1 },
    corners: { home: 3, away: 2 },
    shots: { home: 5, away: 4 },
    possession: { home: 52, away: 48 },
  },
];

const STATUS_COLORS = {
  live: "bg-red-500/20 text-red-400 border-red-500/50",
  finished: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/50",
};

const STATUS_LABELS = {
  live: "AO VIVO",
  finished: "FINALIZADO",
  upcoming: "PRÓXIMO",
};

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedGame, setSelectedGame] = useState<typeof MOCK_GAMES[0] | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Ticker automático
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % MOCK_GAMES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filtrar jogos por liga
  const filteredGames = useMemo(() => {
    return MOCK_GAMES.filter((game) => selectedLeague === "all" || game.leagueId === selectedLeague).sort(
      (a, b) => {
        const statusOrder = { live: 0, upcoming: 1, finished: 2 };
        const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        if (statusDiff !== 0) return statusDiff;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
    );
  }, [selectedLeague]);

  // Agrupar por liga
  const gamesByLeague = useMemo(() => {
    const grouped: Record<string, typeof MOCK_GAMES> = {};
    filteredGames.forEach((game) => {
      if (!grouped[game.league]) grouped[game.league] = [];
      grouped[game.league].push(game);
    });
    return grouped;
  }, [filteredGames]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleFavorite = (gameId: number) => {
    setFavorites((prev) => (prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* TICKER DE NOTÍCIAS */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 overflow-hidden">
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold text-sm">AO VIVO</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              {MOCK_GAMES.map((game, idx) => (
                <span key={idx} className="inline-block mr-8">
                  <strong>{game.homeTeam}</strong> {game.homeScore} x {game.awayScore}{" "}
                  <strong>{game.awayTeam}</strong> - {game.league} ({game.minute}')
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HEADER COM FILTROS */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-white">RaphaGuru</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
                className="border-slate-700 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-400 min-w-[120px] text-center">
                {selectedDate.toLocaleDateString("pt-BR")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
                className="border-slate-700 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* FILTROS DE LIGA */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedLeague === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLeague("all")}
              className={selectedLeague === "all" ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-300"}
            >
              Todas as Ligas
            </Button>
            {["UEFA Champions League", "Premier League", "La Liga", "Série A"].map((league) => {
              const leagueId = MOCK_GAMES.find((g) => g.league === league)?.leagueId || "";
              return (
                <Button
                  key={league}
                  variant={selectedLeague === leagueId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLeague(leagueId)}
                  className={selectedLeague === leagueId ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
                >
                  {league.split(" ")[0]}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR ESQUERDO - JOGOS COMPACTOS */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Jogos ({filteredGames.length})</h2>

          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {Object.entries(gamesByLeague).map(([league, games]) => (
              <div key={league} className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 px-2">{league}</div>
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedGame?.id === game.id
                        ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded border ${STATUS_COLORS[game.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_LABELS[game.status as keyof typeof STATUS_LABELS]}
                      </span>
                      <span className="text-xs text-slate-400">{formatTime(game.startTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <img src={game.homeTeamLogo} alt={game.homeTeam} className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-semibold text-white flex-1 truncate">{game.homeTeam}</span>
                      <span className="text-sm font-bold text-white">{game.homeScore}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <img src={game.awayTeamLogo} alt={game.awayTeam} className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-semibold text-white flex-1 truncate">{game.awayTeam}</span>
                      <span className="text-sm font-bold text-white">{game.awayScore}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CARD EXPANDIDO */}
        <div className="lg:col-span-3">
          {selectedGame ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
              {/* HEADER DO JOGO */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selectedGame.leagueFlag}</span>
                    <span className="text-sm text-slate-400">{selectedGame.league}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[selectedGame.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[selectedGame.status as keyof typeof STATUS_LABELS]}
                      {selectedGame.status === "live" && ` ${selectedGame.minute}'`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">📍 {selectedGame.stadium}</div>
                </div>
                <button
                  onClick={() => toggleFavorite(selectedGame.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${favorites.includes(selectedGame.id) ? "fill-red-500 text-red-500" : "text-slate-500"}`}
                  />
                </button>
              </div>

              {/* PLACAR */}
              <div className="bg-slate-900/50 rounded-lg p-6 mb-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <img src={selectedGame.homeTeamLogo} alt={selectedGame.homeTeam} className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <div className="font-bold text-white text-sm">{selectedGame.homeTeam}</div>
                  </div>

                  <div className="text-center px-6">
                    <div className="text-5xl font-bold text-white mb-2">
                      {selectedGame.homeScore} <span className="text-slate-500 text-2xl">x</span> {selectedGame.awayScore}
                    </div>
                    {selectedGame.status === "live" && <div className="text-sm text-red-400 font-semibold">Minuto {selectedGame.minute}'</div>}
                  </div>

                  <div className="text-center flex-1">
                    <img src={selectedGame.awayTeamLogo} alt={selectedGame.awayTeam} className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <div className="font-bold text-white text-sm">{selectedGame.awayTeam}</div>
                  </div>
                </div>
              </div>

              {/* ESTATÍSTICAS */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">CARTÕES</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-yellow-400">{selectedGame.cards.home}</span>
                    <span className="text-2xl font-bold text-yellow-400">{selectedGame.cards.away}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">ESCANTEIOS</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-400">{selectedGame.corners.home}</span>
                    <span className="text-2xl font-bold text-blue-400">{selectedGame.corners.away}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">CHUTES</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-400">{selectedGame.shots.home}</span>
                    <span className="text-2xl font-bold text-green-400">{selectedGame.shots.away}</span>
                  </div>
                </div>
              </div>

              {/* POSSE E ODDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-3">POSSE DE BOLA</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-20">{selectedGame.homeTeam}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${selectedGame.possession.home}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-10 text-right">{selectedGame.possession.home}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-20">{selectedGame.awayTeam}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${selectedGame.possession.away}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-10 text-right">{selectedGame.possession.away}%</span>
                    </div>
                  </div>
                </div>

                {selectedGame.favoriteOdds && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-3">ODDS (EXEMPLO)</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">{selectedGame.homeTeam}</span>
                        <span className="font-bold text-green-400">{selectedGame.favoriteOdds.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">Empate</span>
                        <span className="font-bold text-yellow-400">{selectedGame.draw.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">{selectedGame.awayTeam}</span>
                        <span className="font-bold text-blue-400">{selectedGame.underdog.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <div className="text-slate-400">Selecione um jogo para ver os detalhes completos</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
