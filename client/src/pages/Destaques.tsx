import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Target, TrendingUp, AlertCircle, Users } from "lucide-react";

export default function Destaques() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedLeague, setSelectedLeague] = useState<string>("todas");
  const [selectedPalpite, setSelectedPalpite] = useState<any>(null);

  const { data, isLoading } = trpc.destaques.avancado.useQuery({ date: selectedDate });

  // Filtrar palpites por liga
  const allPalpites = [
    ...(data?.palpitesBTTS || []),
    ...(data?.palpitesGols || []),
    ...(data?.palpitesEscanteios || []),
    ...(data?.palpitesCartoes || [])
  ];

  const filteredPalpites = selectedLeague === "todas"
    ? allPalpites
    : allPalpites.filter(p => p.leagueName === selectedLeague);

  // Ligas únicas
  const ligas = Array.from(new Set(allPalpites.map(p => p.leagueName)));

  // Cores por confiança
  const getConfiancaColor = (confianca: string) => {
    if (confianca === "Alta") return "bg-green-500/20 border-green-500 text-green-400";
    if (confianca === "Media") return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
    return "bg-red-500/20 border-red-500 text-red-400";
  };

  const getMercadoIcon = (mercado: string) => {
    if (mercado === "BTTS") return "⚽";
    if (mercado === "Gols") return "🎯";
    if (mercado === "Escanteios") return "🚩";
    return "🟨";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Zap className="w-8 h-8 text-green-400" />
          Destaques do Dia
        </h1>
        <p className="text-gray-400">Análise completa de {data?.totalJogos || 0} jogos em {data?.totalLigas || 0} ligas</p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Liga</label>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
          >
            <option value="todas">Todas as Ligas</option>
            {ligas.map(liga => (
              <option key={liga} value={liga}>{liga}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => window.location.reload()} className="w-full bg-green-600 hover:bg-green-700">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total de Palpites</span>
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{filteredPalpites.length}</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Confiança Alta</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{filteredPalpites.filter(p => p.confianca === "Alta").length}</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Taxa Média</span>
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(filteredPalpites.reduce((acc, p) => acc + p.probabilidade, 0) / filteredPalpites.length || 0)}%</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Jogos Hoje</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{data?.totalJogos || 0}</p>
          </div>
        </Card>
      </div>

      {/* Tabs de Palpites */}
      <Tabs defaultValue="todos" className="mb-8">
        <TabsList className="bg-slate-800 border-b border-slate-700 w-full justify-start overflow-x-auto">
          <TabsTrigger value="todos" className="text-gray-400 data-[state=active]:text-green-400">
            Todos ({filteredPalpites.length})
          </TabsTrigger>
          <TabsTrigger value="btts" className="text-gray-400 data-[state=active]:text-green-400">
            BTTS ({data?.palpitesBTTS?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="gols" className="text-gray-400 data-[state=active]:text-green-400">
            Gols ({data?.palpitesGols?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="escanteios" className="text-gray-400 data-[state=active]:text-green-400">
            Escanteios ({data?.palpitesEscanteios?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="cartoes" className="text-gray-400 data-[state=active]:text-green-400">
            Cartões ({data?.palpitesCartoes?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Todos */}
        <TabsContent value="todos" className="space-y-4 mt-6">
          {filteredPalpites.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum palpite disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPalpites.map((palpite, idx) => (
                <Card
                  key={idx}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1"
                  onClick={() => setSelectedPalpite(palpite)}
                >
                  <div className={`h-1 bg-gradient-to-r ${palpite.confianca === "Alta" ? "from-green-500 to-green-600" : palpite.confianca === "Media" ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600"}`} />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500">{palpite.leagueName}</p>
                        <p className="text-sm font-semibold text-white">{palpite.homeTeam} vs {palpite.awayTeam}</p>
                        <p className="text-xs text-gray-400">{palpite.matchTime}</p>
                      </div>
                      <Badge className={`${getConfiancaColor(palpite.confianca)} border`}>
                        {palpite.confianca}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">{getMercadoIcon(palpite.mercado)} {palpite.mercado}</span>
                        <span className="text-lg font-bold text-green-400">{palpite.probabilidade}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${palpite.probabilidade}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{palpite.motivo}</p>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      Ver Análise Completa →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* BTTS */}
        <TabsContent value="btts" className="space-y-4 mt-6">
          {(data?.palpitesBTTS || []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum palpite BTTS disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.palpitesBTTS || []).map((palpite, idx) => (
                <Card
                  key={idx}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1"
                  onClick={() => setSelectedPalpite(palpite)}
                >
                  <div className={`h-1 bg-gradient-to-r ${palpite.confianca === "Alta" ? "from-green-500 to-green-600" : palpite.confianca === "Media" ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600"}`} />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500">{palpite.leagueName}</p>
                        <p className="text-sm font-semibold text-white">{palpite.homeTeam} vs {palpite.awayTeam}</p>
                        <p className="text-xs text-gray-400">{palpite.matchTime}</p>
                      </div>
                      <Badge className={`${getConfiancaColor(palpite.confianca)} border`}>
                        {palpite.confianca}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">⚽ BTTS</span>
                        <span className="text-lg font-bold text-green-400">{palpite.probabilidade}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${palpite.probabilidade}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{palpite.motivo}</p>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      Ver Análise Completa →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gols */}
        <TabsContent value="gols" className="space-y-4 mt-6">
          {(data?.palpitesGols || []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum palpite de Gols disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.palpitesGols || []).map((palpite, idx) => (
                <Card
                  key={idx}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1"
                  onClick={() => setSelectedPalpite(palpite)}
                >
                  <div className={`h-1 bg-gradient-to-r ${palpite.confianca === "Alta" ? "from-green-500 to-green-600" : palpite.confianca === "Media" ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600"}`} />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500">{palpite.leagueName}</p>
                        <p className="text-sm font-semibold text-white">{palpite.homeTeam} vs {palpite.awayTeam}</p>
                        <p className="text-xs text-gray-400">{palpite.matchTime}</p>
                      </div>
                      <Badge className={`${getConfiancaColor(palpite.confianca)} border`}>
                        {palpite.confianca}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">🎯 Gols</span>
                        <span className="text-lg font-bold text-green-400">{palpite.probabilidade}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${palpite.probabilidade}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{palpite.motivo}</p>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      Ver Análise Completa →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Escanteios */}
        <TabsContent value="escanteios" className="space-y-4 mt-6">
          {(data?.palpitesEscanteios || []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum palpite de Escanteios disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.palpitesEscanteios || []).map((palpite, idx) => (
                <Card
                  key={idx}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1"
                  onClick={() => setSelectedPalpite(palpite)}
                >
                  <div className={`h-1 bg-gradient-to-r ${palpite.confianca === "Alta" ? "from-green-500 to-green-600" : palpite.confianca === "Media" ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600"}`} />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500">{palpite.leagueName}</p>
                        <p className="text-sm font-semibold text-white">{palpite.homeTeam} vs {palpite.awayTeam}</p>
                        <p className="text-xs text-gray-400">{palpite.matchTime}</p>
                      </div>
                      <Badge className={`${getConfiancaColor(palpite.confianca)} border`}>
                        {palpite.confianca}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">🚩 Escanteios</span>
                        <span className="text-lg font-bold text-green-400">{palpite.probabilidade}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${palpite.probabilidade}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{palpite.motivo}</p>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      Ver Análise Completa →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cartões */}
        <TabsContent value="cartoes" className="space-y-4 mt-6">
          {(data?.palpitesCartoes || []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum palpite de Cartões disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.palpitesCartoes || []).map((palpite, idx) => (
                <Card
                  key={idx}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1"
                  onClick={() => setSelectedPalpite(palpite)}
                >
                  <div className={`h-1 bg-gradient-to-r ${palpite.confianca === "Alta" ? "from-green-500 to-green-600" : palpite.confianca === "Media" ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600"}`} />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500">{palpite.leagueName}</p>
                        <p className="text-sm font-semibold text-white">{palpite.homeTeam} vs {palpite.awayTeam}</p>
                        <p className="text-xs text-gray-400">{palpite.matchTime}</p>
                      </div>
                      <Badge className={`${getConfiancaColor(palpite.confianca)} border`}>
                        {palpite.confianca}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">🟨 Cartões</span>
                        <span className="text-lg font-bold text-green-400">{palpite.probabilidade}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${palpite.probabilidade}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{palpite.motivo}</p>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      Ver Análise Completa →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Análise Detalhada */}
      {selectedPalpite && (
        <Dialog open={!!selectedPalpite} onOpenChange={() => setSelectedPalpite(null)}>
          <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Análise Detalhada: {selectedPalpite.homeTeam} vs {selectedPalpite.awayTeam}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Palpite Principal */}
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{selectedPalpite.palpite}</h3>
                  <Badge className={`${getConfiancaColor(selectedPalpite.confianca)} border text-lg px-4 py-2`}>
                    {selectedPalpite.confianca} - {selectedPalpite.probabilidade}%
                  </Badge>
                </div>
                <p className="text-gray-300">{selectedPalpite.motivo}</p>
              </div>

              {/* Estatísticas dos Times */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h4 className="font-bold mb-3 text-green-400">{selectedPalpite.homeTeam} (Casa)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Média de Gols:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.homeTeamStats.mediaGols.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Gols em Casa:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.homeTeamStats.mediaGolsForaEmCasa.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Gols Sofridos:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.homeTeamStats.mediaGolsSofridos.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Aproveitamento:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.homeTeamStats.aproveitamento}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Forma:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.homeTeamStats.forma}</span></div>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h4 className="font-bold mb-3 text-blue-400">{selectedPalpite.awayTeam} (Fora)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Média de Gols:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.awayTeamStats.mediaGols.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Gols Fora:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.awayTeamStats.mediaGolsForaEmCasa.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Gols Sofridos:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.awayTeamStats.mediaGolsSofridos.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Aproveitamento:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.awayTeamStats.aproveitamento}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Forma:</span><span className="text-white font-semibold">{selectedPalpite.analiseDetalhada.awayTeamStats.forma}</span></div>
                  </div>
                </div>
              </div>

              {/* Modelo de Poisson */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-bold mb-3">Modelo de Projeção (Poisson)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">BTTS:</span><span className="text-green-400 font-semibold">{(selectedPalpite.analiseDetalhada.modeloPoisson.probabilidadeBTTS * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Over 2.5:</span><span className="text-green-400 font-semibold">{(selectedPalpite.analiseDetalhada.modeloPoisson.probabilidadeOver25 * 100).toFixed(1)}%</span></div>
                </div>
              </div>

              {/* Fatores de Influência */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-bold mb-3">Fatores de Influência</h4>
                <div className="space-y-2">
                  {selectedPalpite.analiseDetalhada.fatoresInfluencia.map((fator: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{fator.fator}: {fator.impacto}</span>
                      <span className="text-green-400 font-semibold">+{((fator.peso - 1) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
