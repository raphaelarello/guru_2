import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart, Settings } from "lucide-react";
import { EventNotification } from "@/components/EventNotification";
import { MatchAnalysisTabs } from "@/components/MatchAnalysisTabs";
import { OddsPanel } from "@/components/OddsPanel";
import { StatisticsDashboard } from "@/components/StatisticsDashboard";
import { PersonalizedAlerts } from "@/components/PersonalizedAlerts";
import { trpc } from "@/lib/trpc";

export function Home() {
  const { user } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "finished" | "upcoming">("all");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "odds" | "stats">("analysis");

  // Buscar jogos ao vivo da API Football
  const { data: liveGames = [], isLoading: liveLoading } = trpc.matches.getLive.useQuery(undefined, {
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Buscar jogos de hoje
  const { data: todayGames = [], isLoading: todayLoading } = trpc.matches.getByDate.useQuery(
    { date: currentDate },
    { refetchInterval: 30000 }
  );

  // Combinar dados de hoje com ao vivo
  const allGames = useMemo(() => {
    const combined = [...liveGames, ...todayGames];
    // Remover duplicatas
    const seen = new Set<number>();
    return combined.filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [liveGames, todayGames]);

  // Filtrar jogos por status
  const filteredGames = useMemo(() => {
    if (filterStatus === "all") return allGames;

    return allGames.filter((game) => {
      if (filterStatus === "live") return game.status === "1H" || game.status === "2H" || game.status === "HT";
      if (filterStatus === "finished") return game.status === "FT" || game.status === "AET" || game.status === "PEN";
      if (filterStatus === "upcoming") return game.status === "NS" || game.status === "TBD";
      return true;
    });
  }, [allGames, filterStatus]);

  // Agrupar por liga
  const gamesByLeague = useMemo(() => {
    const grouped: Record<string, typeof filteredGames> = {};
    filteredGames.forEach((game) => {
      const leagueName = game.league.name;
      if (!grouped[leagueName]) grouped[leagueName] = [];
      grouped[leagueName].push(game);
    });
    // Ordenar por hora de início (mais recentes na frente)
    Object.keys(grouped).forEach((league) => {
      grouped[league].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    });
    return grouped;
  }, [filteredGames]);

  // Ticker de notícias
  const liveGamesForTicker = useMemo(() => {
    return allGames.filter((g) => g.status === "1H" || g.status === "2H" || g.status === "HT");
  }, [allGames]);

  useEffect(() => {
    if (liveGamesForTicker.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveGamesForTicker.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [liveGamesForTicker.length]);

  const currentTickerGame = liveGamesForTicker[tickerIndex];
  const selectedGame = allGames.find((g) => g.id === selectedGameId);

  // Função para obter status em português
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      NS: "Não Iniciado",
      TBD: "A Confirmar",
      "1H": "1º Tempo",
      HT: "Intervalo",
      "2H": "2º Tempo",
      ET: "Prorrogação",
      BT: "Fim Prorrogação",
      P: "Pênaltis",
      SUSP: "Suspenso",
      INT: "Interrompido",
      FT: "Finalizado",
      AET: "Finalizado (AET)",
      PEN: "Finalizado (Pênaltis)",
      CANC: "Cancelado",
      ABD: "Abandonado",
      AWD: "Concedido",
      WO: "Vitória Técnica",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === "1H" || status === "2H" || status === "HT") return "bg-green-500/20 border-green-500/50 text-green-400";
    if (status === "FT" || status === "AET" || status === "PEN") return "bg-slate-500/20 border-slate-500/50 text-slate-400";
    if (status === "NS" || status === "TBD") return "bg-blue-500/20 border-blue-500/50 text-blue-400";
    return "bg-slate-500/20 border-slate-500/50 text-slate-400";
  };

  if (todayLoading || liveLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando dados da API Football...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <EventNotification />

      {/* BREAKING NEWS - TICKER */}
      {currentTickerGame && (
        <div className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 overflow-hidden border-b-4 border-red-900 sticky top-0 z-50">
          <div className="flex items-center gap-4 px-4">
            <div className="flex items-center gap-2 flex-shrink-0 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="font-bold text-sm uppercase">🔴 BREAKING NEWS</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-8 animate-marquee whitespace-nowrap text-base font-semibold">
                <span>
                  ⚽ <strong>{currentTickerGame.homeTeam.name}</strong> {currentTickerGame.homeScore} x{" "}
                  {currentTickerGame.awayScore} <strong>{currentTickerGame.awayTeam.name}</strong> -{" "}
                  {currentTickerGame.league.name} | Minuto {currentTickerGame.minute}'
                </span>
                <span>
                  ⚽ <strong>{currentTickerGame.homeTeam.name}</strong> {currentTickerGame.homeScore} x{" "}
                  {currentTickerGame.awayScore} <strong>{currentTickerGame.awayTeam.name}</strong> -{" "}
                  {currentTickerGame.league.name} | Minuto {currentTickerGame.minute}'
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER COM FILTROS */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Data:</span>
              <button
                onClick={() => setCurrentDate(new Date(new Date().getTime() - 86400000).toISOString().split("T")[0])}
                className="p-2 hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm"
              />
              <button
                onClick={() => setCurrentDate(new Date(new Date().getTime() + 86400000).toISOString().split("T")[0])}
                className="p-2 hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              {(["all", "live", "finished", "upcoming"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {status === "all" && "Todos"}
                  {status === "live" && "🔴 Ao Vivo"}
                  {status === "finished" && "✓ Finalizado"}
                  {status === "upcoming" && "⏱ Próximo"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-5 gap-4">
          {/* SIDEBAR ESQUERDO - JOGOS COMPACTOS */}
          <div className="col-span-1 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {Object.entries(gamesByLeague).map(([league, games]) => (
              <div key={league}>
                <div className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">{league}</div>
                <div className="space-y-2">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedGameId === game.id
                          ? "bg-blue-600/30 border-blue-500"
                          : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className={`text-xs font-bold mb-1 px-2 py-1 rounded w-fit ${getStatusColor(game.status)}`}>
                        {getStatusText(game.status)} {game.minute > 0 && `${game.minute}'`}
                      </div>
                      <div className="text-xs font-semibold text-slate-300 mb-1">
                        {game.homeTeam.name.split(" ")[0]} vs {game.awayTeam.name.split(" ")[0]}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {game.homeScore} - {game.awayScore}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(game.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex gap-2 mt-2 text-xs text-slate-400">
                        <span>🟨 {game.cards?.home || 0}</span>
                        <span>🚩 {game.corners?.home || 0}</span>
                        <span>🎯 {game.shots?.home || 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CONTEÚDO PRINCIPAL - JOGO EXPANDIDO */}
          <div className="col-span-4">
            {selectedGame ? (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-6">
                {/* HEADER DO JOGO */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400 mb-2">{selectedGame.league.name}</div>
                      <div className={`inline-block text-xs font-bold mb-4 px-3 py-1 rounded ${getStatusColor(selectedGame.status)}`}>
                        {getStatusText(selectedGame.status)} {selectedGame.minute > 0 && `${selectedGame.minute}'`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-800 rounded transition-colors">
                        <Heart className="w-6 h-6 text-slate-400 hover:text-red-500" />
                      </button>
                      <button onClick={() => setShowAlerts(true)} className="p-2 hover:bg-slate-800 rounded transition-colors">
                        <Settings className="w-6 h-6 text-slate-400 hover:text-blue-500" />
                      </button>
                    </div>
                  </div>

                  {/* PLACAR */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-2">{selectedGame.homeTeam.name}</div>
                      <div className="text-5xl font-bold text-white">{selectedGame.homeScore}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-2">vs</div>
                      <div className="text-2xl font-bold text-slate-400">-</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-2">{selectedGame.awayTeam.name}</div>
                      <div className="text-5xl font-bold text-white">{selectedGame.awayScore}</div>
                    </div>
                  </div>

                  {/* INFO DO JOGO */}
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400 mb-1">Estádio</div>
                      <div className="text-slate-200 font-semibold">{selectedGame.stadium}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400 mb-1">Hora</div>
                      <div className="text-slate-200 font-semibold">
                        {new Date(selectedGame.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400 mb-1">Público</div>
                      <div className="text-slate-200 font-semibold">-</div>
                    </div>
                  </div>
                </div>

                {/* ABAS DE ANÁLISE, ODDS E ESTATÍSTICAS */}
                <div className="mb-4 border-b border-slate-700">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                        activeTab === "analysis"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      📊 Análise
                    </button>
                    <button
                      onClick={() => setActiveTab("odds")}
                      className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                        activeTab === "odds"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      💰 Odds
                    </button>
                    <button
                      onClick={() => setActiveTab("stats")}
                      className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                        activeTab === "stats"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      📈 Estatísticas
                    </button>
                  </div>

                  <div className="mb-4">
                    {activeTab === "analysis" && (
                      <MatchAnalysisTabs
                        homeTeam={selectedGame.homeTeam.name}
                        awayTeam={selectedGame.awayTeam.name}
                        homeScore={selectedGame.homeScore}
                        awayScore={selectedGame.awayScore}
                        possession={selectedGame.possession || { home: 50, away: 50 }}
                        shots={selectedGame.shots || { home: 0, away: 0 }}
                        corners={selectedGame.corners || { home: 0, away: 0 }}
                        cards={selectedGame.cards || { home: 0, away: 0 }}
                        minute={selectedGame.minute}
                      />
                    )}
                    {activeTab === "odds" && (
                      <OddsPanel
                        homeTeam={selectedGame.homeTeam.name}
                        awayTeam={selectedGame.awayTeam.name}
                        homeScore={selectedGame.homeScore}
                        awayScore={selectedGame.awayScore}
                        minute={selectedGame.minute}
                      />
                    )}
                    {activeTab === "stats" && (
                      <StatisticsDashboard
                        homeTeam={selectedGame.homeTeam.name}
                        awayTeam={selectedGame.awayTeam.name}
                        homeScore={selectedGame.homeScore}
                        awayScore={selectedGame.awayScore}
                        possession={selectedGame.possession || { home: 50, away: 50 }}
                        shots={selectedGame.shots || { home: 0, away: 0 }}
                        corners={selectedGame.corners || { home: 0, away: 0 }}
                        cards={selectedGame.cards || { home: 0, away: 0 }}
                        minute={selectedGame.minute}
                      />
                    )}
                  </div>
                </div>

                {/* ESTATÍSTICAS */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2 font-bold">🎮 POSSE</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{selectedGame.homeTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.possession?.home || 50}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${selectedGame.possession?.home || 50}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{selectedGame.awayTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.possession?.away || 50}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2 font-bold">🎯 CHUTES</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{selectedGame.homeTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.shots?.home || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{selectedGame.awayTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.shots?.away || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2 font-bold">🚩 ESCANTEIOS</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{selectedGame.homeTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.corners?.home || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{selectedGame.awayTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.corners?.away || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2 font-bold">🟨 CARTÕES</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{selectedGame.homeTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.cards?.home || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{selectedGame.awayTeam.name.split(" ")[0]}</span>
                        <span className="font-bold">{selectedGame.cards?.away || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GOLS MARCADOS */}
                {selectedGame.events && selectedGame.events.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="text-sm font-bold text-slate-300 mb-3">⚽ Gols Marcados</div>
                    <div className="space-y-2">
                      {selectedGame.events
                        .filter((e: any) => e.type === "Goal")
                        .map((goal: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                {goal.time.elapsed}'
                              </span>
                              <span className="text-slate-300">{goal.player.name}</span>
                            </div>
                            <span className="text-slate-400 text-xs">{goal.team.name.split(" ")[0]}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-12 text-center">
                <div className="text-slate-400 mb-4 text-4xl">⚽</div>
                <p className="text-slate-400">Selecione um jogo para ver detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE ALERTAS */}
      {showAlerts && <PersonalizedAlerts onClose={() => setShowAlerts(false)} />}

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
