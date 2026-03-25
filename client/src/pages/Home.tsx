import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function Home() {
  const [jogoSelecionado, setJogoSelecionado] = useState<any>(null);
  const [filtroLiga, setFiltroLiga] = useState<string>("todas");
  const [dataAtual, setDataAtual] = useState(new Date().toISOString().split("T")[0]);
  const [indiceTicket, setIndiceTicket] = useState(0);

  // Buscar jogos
  const { data: jogosAoVivo = [] } = trpc.matches.getLive.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const { data: jogosDia = [] } = trpc.matches.getByDate.useQuery(
    { date: dataAtual },
    { refetchInterval: 10000 }
  );

  // Combinar jogos
  const todosJogos = useMemo(() => {
    const combinados = [...jogosAoVivo, ...jogosDia];
    const vistos = new Set<number>();
    return combinados
      .filter((g) => {
        if (vistos.has(g.id)) return false;
        vistos.add(g.id);
        return true;
      })
      .sort((a, b) => {
        const statusOrdem = { "1H": 0, "2H": 0, "HT": 1, "NS": 2, "FT": 3 };
        const ordemA = statusOrdem[a.status as keyof typeof statusOrdem] ?? 4;
        const ordemB = statusOrdem[b.status as keyof typeof statusOrdem] ?? 4;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
      });
  }, [jogosAoVivo, jogosDia]);

  // Filtrar por liga
  const jogosFiltrados = useMemo(() => {
    if (filtroLiga === "todas") return todosJogos;
    return todosJogos.filter((g) => g.league?.name === filtroLiga);
  }, [todosJogos, filtroLiga]);

  // Ligas disponíveis
  const ligas = useMemo(() => {
    const set = new Set(todosJogos.map((g) => g.league?.name).filter(Boolean));
    return Array.from(set).sort();
  }, [todosJogos]);

  // Ticker rotativo
  useEffect(() => {
    if (jogosFiltrados.length === 0) return;
    const intervalo = setInterval(() => {
      setIndiceTicket((prev) => (prev + 1) % jogosFiltrados.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [jogosFiltrados.length]);

  const jogoTicket = jogosFiltrados[indiceTicket];

  const mudarData = (dias: number) => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() + dias);
    setDataAtual(novaData.toISOString().split("T")[0]);
  };

  const statusTexto: Record<string, string> = {
    "1H": "1º Tempo",
    "2H": "2º Tempo",
    "HT": "Intervalo",
    "FT": "Finalizado",
    "NS": "Não Iniciado",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* TICKER - TOPO */}
      {jogoTicket && (
        <div className="bg-red-600 border-b-4 border-red-700 px-4 py-3 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-bold text-sm whitespace-nowrap">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              AO VIVO
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-sm">
                ⚽ {jogoTicket.homeTeam?.name} {jogoTicket.homeScore} x {jogoTicket.awayScore} {jogoTicket.awayTeam?.name} - {jogoTicket.league?.name} | Minuto {jogoTicket.minute}'
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* CONTROLES */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-6">
          {/* Data */}
          <div className="flex items-center gap-2">
            <button onClick={() => mudarData(-1)} className="p-2 hover:bg-slate-700 rounded transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="date"
              value={dataAtual}
              onChange={(e) => setDataAtual(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            />
            <button onClick={() => mudarData(1)} className="p-2 hover:bg-slate-700 rounded transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Filtro de Liga */}
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => setFiltroLiga("todas")}
              className={`px-4 py-2 rounded font-semibold text-sm transition ${
                filtroLiga === "todas"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Todas
            </button>
            {ligas.slice(0, 5).map((liga) => (
              <button
                key={liga}
                onClick={() => setFiltroLiga(liga)}
                className={`px-4 py-2 rounded font-semibold text-sm transition ${
                  filtroLiga === liga
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {liga?.substring(0, 15)}...
              </button>
            ))}
          </div>
        </div>

        {/* LAYOUT PRINCIPAL - SIDEBAR ESQUERDO + CARD DIREITO */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* SIDEBAR - JOGOS COMPACTOS (1/5 da tela) */}
          <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto">
            <h3 className="font-bold text-sm text-slate-400 mb-3">JOGOS ({jogosFiltrados.length})</h3>
            {jogosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Nenhum jogo</div>
            ) : (
              jogosFiltrados.map((jogo) => (
                <button
                  key={jogo.id}
                  onClick={() => setJogoSelecionado(jogo)}
                  className={`w-full text-left p-2 rounded border-2 transition text-xs ${
                    jogoSelecionado?.id === jogo.id
                      ? "bg-blue-900/50 border-blue-500"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1 truncate">{jogo.league?.name}</div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="truncate font-semibold text-xs">{jogo.homeTeam?.name}</span>
                    <span className="font-bold text-sm">{jogo.homeScore}</span>
                    <span className="text-xs text-slate-400">x</span>
                    <span className="font-bold text-sm">{jogo.awayScore}</span>
                    <span className="truncate font-semibold text-xs">{jogo.awayTeam?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>{statusTexto[jogo.status] || jogo.status}</span>
                    {["1H", "2H", "HT"].includes(jogo.status) && (
                      <span className="text-yellow-400 font-bold">{jogo.minute}'</span>
                    )}
                  </div>
                  <div className="flex gap-1 text-xs">
                    <span>🟨 0</span>
                    <span>🚩 0</span>
                    <span>🎯 0</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* CARD PRINCIPAL - DIREITO (4/5 da tela) */}
          <div className="lg:col-span-4">
            {jogoSelecionado ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
                {/* HEADER */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">{jogoSelecionado.league?.name}</div>
                      <div className="text-sm text-slate-300">{statusTexto[jogoSelecionado.status]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-1">Minuto</div>
                      <div className="text-3xl font-bold text-yellow-400">{jogoSelecionado.minute}'</div>
                    </div>
                  </div>

                  {/* PLACAR GRANDE */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-slate-400 mb-2 flex items-center justify-center gap-2">
                        {jogoSelecionado.homeTeam?.logo && (
                          <img src={jogoSelecionado.homeTeam.logo} alt="" className="w-6 h-6" />
                        )}
                        {jogoSelecionado.homeTeam?.name}
                      </div>
                      <div className="text-6xl font-bold text-blue-400">{jogoSelecionado.homeScore || 0}</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-4xl text-slate-500">x</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-2 flex items-center justify-center gap-2">
                        {jogoSelecionado.awayTeam?.logo && (
                          <img src={jogoSelecionado.awayTeam.logo} alt="" className="w-6 h-6" />
                        )}
                        {jogoSelecionado.awayTeam?.name}
                      </div>
                      <div className="text-6xl font-bold text-red-400">{jogoSelecionado.awayScore || 0}</div>
                    </div>
                  </div>

                  {/* INFO JOGO */}
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="bg-slate-700/50 rounded p-3">
                      <div className="text-slate-400 mb-1">Estádio</div>
                      <div className="font-semibold text-xs">{jogoSelecionado.stadium || "-"}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3">
                      <div className="text-slate-400 mb-1">Hora</div>
                      <div className="font-semibold text-xs">
                        {jogoSelecionado.startTime
                          ? new Date(jogoSelecionado.startTime).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3">
                      <div className="text-slate-400 mb-1">Público</div>
                      <div className="font-semibold text-xs">-</div>
                    </div>
                  </div>
                </div>

                {/* ESTATÍSTICAS */}
                <div className="border-t border-slate-700 pt-4 space-y-4">
                  <h4 className="font-bold">📊 Estatísticas</h4>
                  
                  {/* GOLS */}
                  {jogoSelecionado.events?.filter((e: any) => e.type === "Goal").length > 0 && (
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h5 className="font-bold mb-3">⚽ Gols Marcados</h5>
                      <div className="space-y-2">
                        {jogoSelecionado.events
                          ?.filter((e: any) => e.type === "Goal")
                          .map((gol: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{gol.player}</span>
                              <span className="text-xs text-slate-400">Minuto {gol.minute}'</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* GRID DE STATS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Posse</div>
                      <div className="text-lg font-bold">50% x 50%</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Chutes</div>
                      <div className="text-lg font-bold">0 x 0</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Escanteios</div>
                      <div className="text-lg font-bold">0 x 0</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">Cartões</div>
                      <div className="text-lg font-bold">0 x 0</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">⚽</div>
                <p className="text-slate-400">Selecione um jogo para ver detalhes completos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
