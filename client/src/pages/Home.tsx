import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { EventNotification } from "@/components/EventNotification";
import { MatchAnalysisTabs } from "@/components/MatchAnalysisTabs";

// Dados com logos que funcionam e informações completas
const MOCK_GAMES = [
  {
    id: 1,
    league: "UEFA Champions League",
    leagueId: "cl",
    leagueFlag: "🇪🇺",
    leagueLogo: "⚽",
    homeTeam: "Manchester United",
    awayTeam: "Bayern Munich",
    homeTeamId: 33,
    awayTeamId: 25,
    homeTeamLogo: "🔴",
    awayTeamLogo: "🔵",
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
    goals: [
      { player: "Haaland", team: "home", minute: 12, type: "normal" },
      { player: "Müller", team: "away", minute: 28, type: "normal" },
      { player: "Rashford", team: "home", minute: 38, type: "penalty" },
    ],
    favoriteOdds: 1.85,
    underdog: 2.05,
    draw: 3.60,
  },
  {
    id: 2,
    league: "La Liga",
    leagueId: "la",
    leagueFlag: "🇪🇸",
    leagueLogo: "⚽",
    homeTeam: "Real Madrid",
    awayTeam: "FC Barcelona",
    homeTeamId: 541,
    awayTeamId: 529,
    homeTeamLogo: "⚪",
    awayTeamLogo: "🔵",
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
    goals: [
      { player: "Benzema", team: "home", minute: 15, type: "normal" },
      { player: "Lewandowski", team: "away", minute: 22, type: "normal" },
      { player: "Vinicius", team: "home", minute: 45, type: "normal" },
      { player: "Gavi", team: "away", minute: 67, type: "normal" },
      { player: "Rodrygo", team: "home", minute: 78, type: "normal" },
    ],
  },
  {
    id: 3,
    league: "Premier League",
    leagueId: "pl",
    leagueFlag: "🇬🇧",
    leagueLogo: "⚽",
    homeTeam: "Liverpool",
    awayTeam: "Arsenal",
    homeTeamId: 40,
    awayTeamId: 42,
    homeTeamLogo: "🔴",
    awayTeamLogo: "🔴",
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
    goals: [],
  },
  {
    id: 4,
    league: "Série A",
    leagueId: "sa",
    leagueFlag: "🇧🇷",
    leagueLogo: "⚽",
    homeTeam: "Flamengo",
    awayTeam: "Vasco da Gama",
    homeTeamId: 64,
    awayTeamId: 71,
    homeTeamLogo: "🔴",
    awayTeamLogo: "⚪",
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
    goals: [
      { player: "Gabigol", team: "home", minute: 23, type: "normal" },
      { player: "Payet", team: "away", minute: 45, type: "normal" },
    ],
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
  const [selectedGame, setSelectedGame] = useState<typeof MOCK_GAMES[0] | null>(MOCK_GAMES[0]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [games, setGames] = useState(MOCK_GAMES);

  // Ticker automático
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % games.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [games.length]);

  // Simular atualização de dados em tempo real
  useEffect(() => {
    const updateTimer = setInterval(() => {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game.status === "live") {
            return {
              ...game,
              minute: Math.min(90, game.minute + Math.random() * 2),
              homeScore: game.homeScore + (Math.random() > 0.95 ? 1 : 0),
              awayScore: game.awayScore + (Math.random() > 0.95 ? 1 : 0),
            };
          }
          return game;
        })
      );
    }, 3000);
    return () => clearInterval(updateTimer);
  }, []);

  // Filtrar jogos por liga
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => selectedLeague === "all" || game.leagueId === selectedLeague)
      .sort((a, b) => {
        const statusOrder = { live: 0, upcoming: 1, finished: 2 };
        const statusDiff =
          statusOrder[a.status as keyof typeof statusOrder] -
          statusOrder[b.status as keyof typeof statusOrder];
        if (statusDiff !== 0) return statusDiff;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }, [selectedLeague, games]);

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
    setFavorites((prev) =>
      prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]
    );
  };

  const currentTickerGame = games[tickerIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <EventNotification />
      {/* BREAKING NEWS - TICKER */}
      <div className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 overflow-hidden border-b-4 border-red-900 sticky top-0 z-50">
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 flex-shrink-0 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="font-bold text-sm uppercase">🔴 BREAKING NEWS</span>
          </div>
          <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 animate-marquee whitespace-nowrap text-base font-semibold">
            {currentTickerGame && (
              <>
                <span>
                  ⚽ <strong>{currentTickerGame.homeTeam}</strong> {currentTickerGame.homeScore} x{" "}
                  {currentTickerGame.awayScore} <strong>{currentTickerGame.awayTeam}</strong> -{" "}
                  {currentTickerGame.league} | Minuto {currentTickerGame.minute.toFixed(0)}'
                </span>
                <span>
                  ⚽ <strong>{currentTickerGame.homeTeam}</strong> {currentTickerGame.homeScore} x{" "}
                  {currentTickerGame.awayScore} <strong>{currentTickerGame.awayTeam}</strong> -{" "}
                  {currentTickerGame.league} | Minuto {currentTickerGame.minute.toFixed(0)}'
                </span>
              </>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* HEADER COM FILTROS */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h1 className="text-2xl font-bold text-white">⚽ RaphaGuru</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
                className="border-slate-700 text-slate-300 h-8"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-xs text-slate-400 min-w-[100px] text-center font-semibold">
                {selectedDate.toLocaleDateString("pt-BR")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
                className="border-slate-700 text-slate-300 h-8"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* FILTROS DE LIGA */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={selectedLeague === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLeague("all")}
              className={
                selectedLeague === "all"
                  ? "bg-green-600 hover:bg-green-700 h-7 text-xs"
                  : "border-slate-700 text-slate-300 h-7 text-xs"
              }
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
                  className={
                    selectedLeague === leagueId
                      ? "bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                      : "border-slate-700 text-slate-300 h-7 text-xs"
                  }
                >
                  {league.split(" ")[0]}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-3 py-4 grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* SIDEBAR ESQUERDO - JOGOS COMPACTOS */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            📋 Jogos ({filteredGames.length})
          </h2>

          <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
            {Object.entries(gamesByLeague).map(([league, leagueGames]) => (
              <div key={league} className="space-y-1">
                <div className="text-xs font-semibold text-slate-600 px-2 py-1">
                  {leagueGames[0]?.leagueFlag} {league.split(",")[0]}
                </div>
                {leagueGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full p-2 rounded-lg border transition-all cursor-pointer text-left ${
                      selectedGame?.id === game.id
                        ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[game.status as keyof typeof STATUS_COLORS]}`}
                      >
                        {STATUS_LABELS[game.status as keyof typeof STATUS_LABELS]}
                      </span>
                      <span className="text-xs text-slate-400">{formatTime(game.startTime)}</span>
                    </div>

                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-lg">{game.homeTeamLogo}</span>
                      <span className="text-xs font-semibold text-white flex-1 truncate">
                        {game.homeTeam.split(" ")[0]}
                      </span>
                      <span className="text-xs font-bold text-white">{game.homeScore}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-lg">{game.awayTeamLogo}</span>
                      <span className="text-xs font-semibold text-white flex-1 truncate">
                        {game.awayTeam.split(" ")[0]}
                      </span>
                      <span className="text-xs font-bold text-white">{game.awayScore}</span>
                    </div>

                    {/* Mini grade de estatísticas */}
                    <div className="grid grid-cols-3 gap-1 mt-1 pt-1 border-t border-slate-700">
                      <div className="text-center">
                        <div className="text-xs text-yellow-400 font-bold">{game.cards.home}</div>
                        <div className="text-xs text-slate-500">C</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-blue-400 font-bold">{game.corners.home}</div>
                        <div className="text-xs text-slate-500">E</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-green-400 font-bold">{game.shots.home}</div>
                        <div className="text-xs text-slate-500">Ch</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CARD EXPANDIDO */}
        <div className="lg:col-span-4">
          {selectedGame ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl max-h-[calc(100vh-250px)] overflow-y-auto">
              {/* HEADER DO JOGO */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selectedGame.leagueFlag}</span>
                    <span className="text-sm text-slate-400 font-semibold">{selectedGame.league}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[selectedGame.status as keyof typeof STATUS_COLORS]}`}
                    >
                      {STATUS_LABELS[selectedGame.status as keyof typeof STATUS_LABELS]}
                      {selectedGame.status === "live" && ` ${selectedGame.minute.toFixed(0)}'`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">📍 {selectedGame.stadium}</div>
                </div>
                <button
                  onClick={() => toggleFavorite(selectedGame.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(selectedGame.id)
                        ? "fill-red-500 text-red-500"
                        : "text-slate-500"
                    }`}
                  />
                </button>
              </div>

              {/* PLACAR */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold mb-1">{selectedGame.homeTeamLogo}</div>
                    <div className="font-bold text-white text-sm">{selectedGame.homeTeam}</div>
                  </div>

                  <div className="text-center px-4">
                    <div className="text-5xl font-bold text-white mb-1">
                      {selectedGame.homeScore}{" "}
                      <span className="text-slate-500 text-2xl">x</span> {selectedGame.awayScore}
                    </div>
                    {selectedGame.status === "live" && (
                      <div className="text-xs text-red-400 font-semibold animate-pulse">
                        ⏱ Minuto {selectedGame.minute.toFixed(0)}'
                      </div>
                    )}
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold mb-1">{selectedGame.awayTeamLogo}</div>
                    <div className="font-bold text-white text-sm">{selectedGame.awayTeam}</div>
                  </div>
                </div>
              </div>

              {/* GOLS MARCADOS */}
              {selectedGame.goals.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700">
                  <div className="text-sm font-bold text-slate-300 mb-2">⚽ GOLS MARCADOS</div>
                  <div className="space-y-1">
                    {selectedGame.goals.map((goal, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded text-sm font-semibold ${
                          goal.team === "home"
                            ? "bg-green-500/20 border-l-4 border-green-500 text-green-300"
                            : "bg-blue-500/20 border-l-4 border-blue-500 text-blue-300"
                        }`}
                      >
                        <span>{goal.player}</span>
                        <span className="text-xs text-slate-400">{goal.minute}'</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ESTATÍSTICAS EM GRADE */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 font-bold">🟨 CARTÕES</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-yellow-400">{selectedGame.cards.home}</span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span className="text-2xl font-bold text-yellow-400">{selectedGame.cards.away}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 font-bold">🚩 ESCANTEIOS</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-400">{selectedGame.corners.home}</span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span className="text-2xl font-bold text-blue-400">{selectedGame.corners.away}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 font-bold">🎯 CHUTES</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-400">{selectedGame.shots.home}</span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span className="text-2xl font-bold text-green-400">{selectedGame.shots.away}</span>
                  </div>
                </div>
              </div>

              {/* ABAS DE ANÁLISE */}
              <div className="mb-4">
                <MatchAnalysisTabs
                  homeTeam={selectedGame.homeTeam}
                  awayTeam={selectedGame.awayTeam}
                  homeScore={selectedGame.homeScore}
                  awayScore={selectedGame.awayScore}
                  possession={selectedGame.possession}
                  shots={selectedGame.shots}
                  corners={selectedGame.corners}
                  cards={selectedGame.cards}
                  minute={selectedGame.minute}
                />
              </div>

              {/* POSSE E ODDS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 font-bold">🎮 POSSE DE BOLA</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-16">{selectedGame.homeTeam.split(" ")[0]}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${selectedGame.possession.home}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right">
                        {selectedGame.possession.home}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-16">{selectedGame.awayTeam.split(" ")[0]}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${selectedGame.possession.away}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right">
                        {selectedGame.possession.away}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 font-bold">💰 ODDS (1X2)</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">{selectedGame.homeTeam.split(" ")[0]}</span>
                      <span className="font-bold text-green-400">{(selectedGame.favoriteOdds || 1.85).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">Empate</span>
                      <span className="font-bold text-yellow-400">{(selectedGame.draw || 3.60).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">{selectedGame.awayTeam.split(" ")[0]}</span>
                      <span className="font-bold text-blue-400">{(selectedGame.underdog || 2.05).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <div className="text-slate-400 text-sm">Selecione um jogo para ver os detalhes completos</div>
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
