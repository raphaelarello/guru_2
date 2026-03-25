import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChevronLeft, ChevronRight, Heart, Clock, MapPin, Users, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Jogo {
  id: number;
  liga: string;
  pais: string;
  timeCasa: { nome: string; logo?: string };
  timeVisitante: { nome: string; logo?: string };
  placarCasa: number;
  placarVisitante: number;
  status: string;
  minuto: number;
  estadio: string;
  horaInicio: string;
  gols: Array<{ jogador: string; minuto: number; time: "casa" | "visitante" }>;
  cartoes: { casa: number; visitante: number };
  escanteios: { casa: number; visitante: number };
  chutes: { casa: number; visitante: number };
  posse: { casa: number; visitante: number };
}

const statusTexto: Record<string, string> = {
  "1H": "1º Tempo",
  "2H": "2º Tempo",
  "HT": "Intervalo",
  "FT": "Finalizado",
  "NS": "Não Iniciado",
  "PST": "Adiado",
  "CANC": "Cancelado",
};

const paisBandeira: Record<string, string> = {
  "Polônia": "🇵🇱",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Turquia": "🇹🇷",
  "Tailândia": "🇹🇭",
  "Geórgia": "🇬🇪",
  "Portugal": "🇵🇹",
  "Brasil": "🇧🇷",
  "Índia": "🇮🇳",
  "Senegal": "🇸🇳",
  "Filipinas": "🇵🇭",
};

export function Home() {
  const { user } = useAuth();
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ao-vivo" | "finalizado" | "proximo">("todos");
  const [indiceTicket, setIndiceTicket] = useState(0);
  const [dataAtual, setDataAtual] = useState(new Date().toISOString().split("T")[0]);
  const [abaAtiva, setAbaAtiva] = useState<"analise" | "odds" | "stats">("analise");

  // Buscar jogos ao vivo
  const { data: jogosAoVivo = [], isLoading: carregandoAoVivo } = trpc.matches.getLive.useQuery(undefined, {
    refetchInterval: 10000, // Atualizar a cada 10s
  });

  // Buscar jogos de hoje
  const { data: jogosDia = [], isLoading: carregandoDia } = trpc.matches.getByDate.useQuery(
    { date: dataAtual },
    { refetchInterval: 10000 }
  );

  // Combinar e filtrar jogos
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
        // Ordenar por status (ao vivo primeiro) e depois por hora
        const statusOrdem = { "1H": 0, "2H": 0, "HT": 1, "NS": 2, "FT": 3 };
        const ordemA = statusOrdem[a.status as keyof typeof statusOrdem] ?? 4;
        const ordemB = statusOrdem[b.status as keyof typeof statusOrdem] ?? 4;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }, [jogosAoVivo, jogosDia]);

  // Filtrar por status
  const jogosFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return todosJogos;
    if (filtroStatus === "ao-vivo") return todosJogos.filter((g) => ["1H", "2H", "HT"].includes(g.status));
    if (filtroStatus === "finalizado") return todosJogos.filter((g) => ["FT", "AET", "PEN"].includes(g.status));
    if (filtroStatus === "proximo") return todosJogos.filter((g) => g.status === "NS");
    return todosJogos;
  }, [todosJogos, filtroStatus]);

  // Atualizar ticker a cada 5s
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* TICKER DE NOTÍCIAS */}
      {jogoTicket && (
        <div className="bg-red-600 border-b-4 border-red-700 px-4 py-3 overflow-hidden">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="flex items-center gap-2 font-bold text-sm">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
              AO VIVO
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-sm">
                ⚽ {jogoTicket.homeTeam.name} {jogoTicket.homeScore} x {jogoTicket.awayScore} {jogoTicket.awayTeam.name} - {jogoTicket.league.name} | Minuto {jogoTicket.minute}'
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* CONTROLES */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
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

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap justify-center">
            {[
              { id: "todos", label: "Todos" },
              { id: "ao-vivo", label: "🔴 Ao Vivo" },
              { id: "finalizado", label: "✓ Finalizado" },
              { id: "proximo", label: "⏱ Próximo" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroStatus(f.id as any)}
                className={`px-4 py-2 rounded font-semibold text-sm transition ${
                  filtroStatus === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SIDEBAR - LISTA DE JOGOS */}
          <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
            {jogosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Nenhum jogo nesta data</div>
            ) : (
              jogosFiltrados.map((jogo) => (
                <button
                  key={jogo.id}
                  onClick={() => setJogoSelecionado(jogo)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    jogoSelecionado?.id === jogo.id
                      ? "bg-blue-900/50 border-blue-500"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1">{jogo.league.name}</div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-300 truncate">{jogo.homeTeam.name.split(" ")[0]}</span>
                    <span className="text-sm font-bold">{jogo.homeScore}</span>
                    <span className="text-xs text-slate-400">x</span>
                    <span className="text-sm font-bold">{jogo.awayScore}</span>
                    <span className="text-xs font-semibold text-slate-300 truncate">{jogo.awayTeam.name.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{statusTexto[jogo.status] || jogo.status}</span>
                    {["1H", "2H", "HT"].includes(jogo.status) && <span className="text-yellow-400 font-bold">{jogo.minute}'</span>}
                  </div>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span>🟨 0</span>
                    <span>🚩 0</span>
                    <span>🎯 0</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* CARD PRINCIPAL */}
          <div className="lg:col-span-3">
            {jogoSelecionado ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
                {/* HEADER */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">{(jogoSelecionado as any).league?.name || "Liga"}</div>
                      <div className="text-sm text-slate-300">{statusTexto[jogoSelecionado.status]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-1">Minuto</div>
                      <div className="text-2xl font-bold text-yellow-400">{jogoSelecionado.minuto || 0}'</div>
                    </div>
                  </div>

                  {/* PLACAR */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-slate-400 mb-2">{(jogoSelecionado as any).teams?.home?.name || "Casa"}</div>
                      <div className="text-5xl font-bold text-blue-400">{(jogoSelecionado as any).goals?.home || 0}</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl text-slate-500">x</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-2">{(jogoSelecionado as any).teams?.away?.name || "Visitante"}</div>
                      <div className="text-5xl font-bold text-red-400">{(jogoSelecionado as any).goals?.away || 0}</div>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 mb-1">Estádio</div>
                      <div className="font-semibold">-</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 mb-1">Hora</div>
                      <div className="font-semibold">-</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 mb-1">Público</div>
                      <div className="font-semibold">-</div>
                    </div>
                  </div>
                </div>

                {/* ABAS */}
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex gap-2 mb-4">
                    {[
                      { id: "analise", label: "📊 Análise" },
                      { id: "odds", label: "💰 Odds" },
                      { id: "stats", label: "📈 Estatísticas" },
                    ].map((aba) => (
                      <button
                        key={aba.id}
                        onClick={() => setAbaAtiva(aba.id as any)}
                        className={`px-4 py-2 rounded font-semibold text-sm transition ${
                          abaAtiva === aba.id
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {aba.label}
                      </button>
                    ))}
                  </div>

                  {/* CONTEÚDO DAS ABAS */}
                  {abaAtiva === "analise" && (
                    <div className="space-y-4">
                      {/* GOLS */}
                      {jogoSelecionado.gols && jogoSelecionado.gols.length > 0 && (
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <h4 className="font-bold mb-3">⚽ Gols Marcados</h4>
                          <div className="space-y-2">
                            {jogoSelecionado.gols.map((gol: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span>{gol.player.name}</span>
                                <span className="text-xs text-slate-400">Minuto {gol.time}'</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ESTATÍSTICAS RÁPIDAS */}
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
                  )}

                  {abaAtiva === "odds" && (
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-bold mb-3">💰 Odds em Tempo Real</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Vitória Casa</span>
                          <span className="font-bold">2.45</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Empate</span>
                          <span className="font-bold">3.20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vitória Fora</span>
                          <span className="font-bold">3.10</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {abaAtiva === "stats" && (
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-bold mb-3">📈 Estatísticas Detalhadas</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Passes Certos</span>
                          <div className="flex gap-2">
                            <span>85%</span>
                            <span>78%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Defesas</span>
                          <div className="flex gap-2">
                            <span>12</span>
                            <span>15</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">⚽</div>
                <p className="text-slate-400">Selecione um jogo para ver detalhes</p>
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
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
