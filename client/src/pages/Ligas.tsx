import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LIGAS } from "@shared/ligas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trophy, Search, ChevronRight, Star, Globe, Users,
  Calendar, TrendingUp, Zap, Target, ArrowRight, Shield
} from "lucide-react";

const TEMPORADA_ATUAL = 2024;

const CONTINENTES = [
  { id: "todos", nome: "Todas", icone: "🌍" },
  { id: "Europa", nome: "Europa", icone: "🇪🇺" },
  { id: "América do Sul", nome: "América do Sul", icone: "🌎" },
  { id: "América do Norte", nome: "América do Norte", icone: "🌎" },
  { id: "Ásia", nome: "Ásia", icone: "🌏" },
  { id: "África", nome: "África", icone: "🌍" },
  { id: "Oceania", nome: "Oceania", icone: "🌊" },
  { id: "Mundial", nome: "Mundial", icone: "🏆" },
];

export default function Ligas() {
  const [, navigate] = useLocation();
  const [ligaSelecionada, setLigaSelecionada] = useState<number>(71); // Brasileirão por padrão
  const [busca, setBusca] = useState("");
  const [continente, setContinente] = useState("todos");
  const [temporada, setTemporada] = useState(TEMPORADA_ATUAL);

  // Filtrar ligas
  const ligasFiltradas = useMemo(() => {
    const todas = Object.values(LIGAS);
    let filtradas = todas;

    if (busca.trim()) {
      const b = busca.toLowerCase();
      filtradas = filtradas.filter(l =>
        l.nome.toLowerCase().includes(b) ||
        l.nomePais.toLowerCase().includes(b)
      );
    }

    if (continente !== "todos") {
      filtradas = filtradas.filter(l => l.continente === continente);
    }

    return filtradas.sort((a, b) => {
      if (a.destaque && !b.destaque) return -1;
      if (!a.destaque && b.destaque) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [busca, continente]);

  const ligaAtual = LIGAS[ligaSelecionada];

  // Queries
  const { data: standings, isLoading: loadingStandings } = trpc.ligasRouter.standings.useQuery(
    { ligaId: ligaSelecionada, season: temporada },
    { enabled: !!ligaSelecionada }
  );

  const { data: artilheiros, isLoading: loadingArtilheiros } = trpc.ligasRouter.artilheiros.useQuery(
    { ligaId: ligaSelecionada, season: temporada },
    { enabled: !!ligaSelecionada }
  );

  const { data: proximosJogos, isLoading: loadingProximos } = trpc.ligasRouter.proximosJogos.useQuery(
    { ligaId: ligaSelecionada, season: temporada, count: 10 },
    { enabled: !!ligaSelecionada }
  );

  const { data: ultimosResultados, isLoading: loadingUltimos } = trpc.ligasRouter.ultimosResultados.useQuery(
    { ligaId: ligaSelecionada, season: temporada, count: 10 },
    { enabled: !!ligaSelecionada }
  );

  const tabela = standings?.[0] ?? [];

  // Estatísticas rápidas da liga
  const totalGols = useMemo(() => {
    if (!tabela || tabela.length === 0) return 0;
    return tabela.reduce((acc: number, t: any) => acc + (t.all?.goals?.for ?? 0), 0);
  }, [tabela]);

  const mediaGolsJogo = useMemo(() => {
    if (!tabela || tabela.length === 0) return 0;
    const totalJogos = tabela.reduce((acc: number, t: any) => acc + (t.all?.played ?? 0), 0) / 2;
    return totalJogos > 0 ? (totalGols / totalJogos).toFixed(2) : 0;
  }, [tabela, totalGols]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Ligas & Competições
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {Object.keys(LIGAS).length} ligas de todo o mundo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(temporada)} onValueChange={v => setTemporada(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel de seleção de liga */}
        <div className="lg:col-span-1 space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar liga ou país..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por continente */}
          <div className="flex flex-wrap gap-1">
            {CONTINENTES.map(c => (
              <button
                key={c.id}
                onClick={() => setContinente(c.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  continente === c.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c.icone} {c.nome}
              </button>
            ))}
          </div>

          {/* Contador de resultados */}
          <p className="text-xs text-muted-foreground">
            {ligasFiltradas.length} liga{ligasFiltradas.length !== 1 ? "s" : ""} encontrada{ligasFiltradas.length !== 1 ? "s" : ""}
          </p>

          {/* Lista de ligas */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {ligasFiltradas.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma liga encontrada</p>
            )}
            {ligasFiltradas.map(liga => (
              <button
                key={liga.id}
                onClick={() => setLigaSelecionada(liga.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 group ${
                  ligaSelecionada === liga.id
                    ? "bg-primary/15 border border-primary/40 text-primary"
                    : "hover:bg-muted/60 text-foreground border border-transparent"
                }`}
              >
                <span className="text-base">{liga.bandeira}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{liga.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{liga.nomePais}</p>
                </div>
                {liga.destaque && <Star className="w-3 h-3 text-yellow-400 shrink-0" />}
                <ChevronRight className={`w-3 h-3 shrink-0 transition-opacity ${
                  ligaSelecionada === liga.id ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-50"
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo da liga selecionada */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header da liga */}
          {ligaAtual && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-4xl">{ligaAtual.bandeira}</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold">{ligaAtual.nome}</h2>
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Globe className="w-3 h-3" />
                      {ligaAtual.nomePais} · {ligaAtual.continente}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {ligaAtual.destaque && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Star className="w-3 h-3 mr-1" /> Destaque
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">{ligaAtual.tipo}</Badge>
                    <Badge variant="outline" className="capitalize">{ligaAtual.continente}</Badge>
                  </div>
                </div>

                {/* Estatísticas rápidas */}
                {tabela.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/30">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{tabela.length}</p>
                      <p className="text-xs text-muted-foreground">Times</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{totalGols}</p>
                      <p className="text-xs text-muted-foreground">Gols na Temporada</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{mediaGolsJogo}</p>
                      <p className="text-xs text-muted-foreground">Média Gols/Jogo</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Abas */}
          <Tabs defaultValue="tabela">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="tabela" className="flex items-center gap-1 text-xs">
                <TrendingUp className="w-3 h-3" /> Tabela
              </TabsTrigger>
              <TabsTrigger value="artilheiros" className="flex items-center gap-1 text-xs">
                <Zap className="w-3 h-3" /> Artilheiros
              </TabsTrigger>
              <TabsTrigger value="proximos" className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3" /> Próximos
              </TabsTrigger>
              <TabsTrigger value="resultados" className="flex items-center gap-1 text-xs">
                <Trophy className="w-3 h-3" /> Resultados
              </TabsTrigger>
            </TabsList>

            {/* Tabela de classificação */}
            <TabsContent value="tabela">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Classificação — Temporada {temporada}</CardTitle>
                    {tabela.length > 0 && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Classificação</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Rebaixamento</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingStandings ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando classificação...
                    </div>
                  ) : tabela.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Classificação não disponível para esta liga/temporada</p>
                      <p className="text-xs mt-1">Tente selecionar outra temporada</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-muted-foreground text-xs bg-muted/20">
                            <th className="text-left px-4 py-2 w-8">#</th>
                            <th className="text-left px-4 py-2">Time</th>
                            <th className="text-center px-2 py-2 hidden sm:table-cell">J</th>
                            <th className="text-center px-2 py-2 hidden sm:table-cell">V</th>
                            <th className="text-center px-2 py-2 hidden sm:table-cell">E</th>
                            <th className="text-center px-2 py-2 hidden sm:table-cell">D</th>
                            <th className="text-center px-2 py-2 hidden md:table-cell">GP</th>
                            <th className="text-center px-2 py-2 hidden md:table-cell">GC</th>
                            <th className="text-center px-2 py-2 hidden md:table-cell">SG</th>
                            <th className="text-center px-2 py-2 font-bold text-foreground">PTS</th>
                            <th className="text-center px-2 py-2 hidden lg:table-cell">Forma</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tabela.map((team: any, idx: number) => {
                            const pos = team.rank ?? idx + 1;
                            const isTop = pos <= 4;
                            const isRelegation = pos >= tabela.length - 2;
                            const descricao = (team.description ?? "").toLowerCase();
                            const isChampions = descricao.includes("champions") || descricao.includes("libertadores");
                            const isEuropa = descricao.includes("europa") || descricao.includes("sudamericana");
                            return (
                              <tr
                                key={team.team?.id ?? idx}
                                className={`border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer ${
                                  isChampions ? "border-l-2 border-l-blue-500" :
                                  isEuropa ? "border-l-2 border-l-orange-500" :
                                  isTop ? "border-l-2 border-l-green-500" :
                                  isRelegation ? "border-l-2 border-l-red-500" : "border-l-2 border-l-transparent"
                                }`}
                                onClick={() => navigate(`/times?id=${team.team?.id}`)}
                                title={`Ver estatísticas de ${team.team?.name}`}
                              >
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`font-bold text-xs ${
                                    pos === 1 ? "text-yellow-400" :
                                    pos <= 4 ? "text-green-400" :
                                    isRelegation ? "text-red-400" : "text-muted-foreground"
                                  }`}>{pos}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {team.team?.logo && (
                                      <img src={team.team.logo} alt="" className="w-5 h-5 object-contain" />
                                    )}
                                    <span className="font-medium text-xs">{team.team?.name}</span>
                                    {team.description && (
                                      <span className="hidden xl:inline text-[10px] text-muted-foreground truncate max-w-[100px]">
                                        {team.description}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2.5 text-center text-xs text-muted-foreground hidden sm:table-cell">{team.all?.played}</td>
                                <td className="px-2 py-2.5 text-center text-xs text-green-400 hidden sm:table-cell">{team.all?.win}</td>
                                <td className="px-2 py-2.5 text-center text-xs text-yellow-400 hidden sm:table-cell">{team.all?.draw}</td>
                                <td className="px-2 py-2.5 text-center text-xs text-red-400 hidden sm:table-cell">{team.all?.lose}</td>
                                <td className="px-2 py-2.5 text-center text-xs hidden md:table-cell">{team.all?.goals?.for}</td>
                                <td className="px-2 py-2.5 text-center text-xs hidden md:table-cell">{team.all?.goals?.against}</td>
                                <td className="px-2 py-2.5 text-center text-xs hidden md:table-cell">
                                  <span className={team.goalsDiff > 0 ? "text-green-400" : team.goalsDiff < 0 ? "text-red-400" : ""}>
                                    {team.goalsDiff > 0 ? "+" : ""}{team.goalsDiff}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <span className="font-bold text-sm">{team.points}</span>
                                </td>
                                <td className="px-2 py-2.5 hidden lg:table-cell">
                                  <div className="flex gap-0.5 justify-center">
                                    {(team.form ?? "").split("").slice(-5).map((r: string, i: number) => (
                                      <span key={i} className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                                        r === "W" ? "bg-green-500 text-white" :
                                        r === "D" ? "bg-yellow-500 text-white" :
                                        r === "L" ? "bg-red-500 text-white" : "bg-muted"
                                      }`}>{r}</span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Artilheiros */}
            <TabsContent value="artilheiros">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top Artilheiros — Temporada {temporada}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingArtilheiros ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando artilheiros...
                    </div>
                  ) : !artilheiros || artilheiros.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Artilheiros não disponíveis para esta liga/temporada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {artilheiros.map((p: any, idx: number) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                          onClick={() => navigate(`/times?busca=${encodeURIComponent(p.time)}`)}
                          title={`Ver time ${p.time}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            idx === 0 ? "bg-yellow-500 text-black" :
                            idx === 1 ? "bg-gray-400 text-black" :
                            idx === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                          </div>
                          {p.foto && (
                            <img src={p.foto} alt={p.nome} className="w-9 h-9 rounded-full object-cover border border-border" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{p.nome}</p>
                            <div className="flex items-center gap-1">
                              {p.timeLogo && <img src={p.timeLogo} alt="" className="w-3 h-3 object-contain" />}
                              <p className="text-xs text-muted-foreground truncate">{p.time}</p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-right shrink-0">
                            <div>
                              <p className="text-lg font-bold text-primary">{p.gols}</p>
                              <p className="text-xs text-muted-foreground">gols</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-blue-400">{p.assistencias ?? 0}</p>
                              <p className="text-xs text-muted-foreground">assist.</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-muted-foreground">{p.jogos}</p>
                              <p className="text-xs text-muted-foreground">jogos</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Próximos jogos */}
            <TabsContent value="proximos">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Próximos Jogos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProximos ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando próximos jogos...
                    </div>
                  ) : !proximosJogos || proximosJogos.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum jogo agendado encontrado</p>
                      <p className="text-xs mt-1">Tente selecionar a temporada 2025</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {proximosJogos.map((j: any) => (
                        <div
                          key={j.id}
                          onClick={() => navigate(`/ao-vivo?fixture=${j.id}`)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer border border-border/30 hover:border-primary/30 group"
                        >
                          <div className="text-xs text-muted-foreground w-20 shrink-0">
                            <p className="font-medium">{new Date(j.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
                            <p className="text-primary font-bold">{new Date(j.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              {j.timeCasaLogo && <img src={j.timeCasaLogo} alt="" className="w-5 h-5 object-contain" />}
                              <span className="text-sm font-medium text-right">{j.timeCasa}</span>
                            </div>
                            <div className="flex items-center gap-1 px-3 shrink-0">
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">vs</span>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm font-medium">{j.timeVisitante}</span>
                              {j.timeVisitanteLogo && <img src={j.timeVisitanteLogo} alt="" className="w-5 h-5 object-contain" />}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground w-16 shrink-0 text-right hidden sm:block">
                            {j.rodada?.replace("Regular Season - ", "R") ?? ""}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Últimos resultados */}
            <TabsContent value="resultados">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Últimos Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingUltimos ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando resultados...
                    </div>
                  ) : !ultimosResultados || ultimosResultados.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum resultado encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ultimosResultados.map((j: any) => {
                        const casaVenceu = j.golsCasa > j.golsVisitante;
                        const visitanteVenceu = j.golsVisitante > j.golsCasa;
                        const empate = j.golsCasa === j.golsVisitante;
                        return (
                          <div
                            key={j.id}
                            onClick={() => navigate(`/ao-vivo?fixture=${j.id}`)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer border border-border/30 hover:border-primary/30 group"
                          >
                            <div className="text-xs text-muted-foreground w-16 shrink-0">
                              {new Date(j.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                            </div>
                            <div className="flex-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                {j.timeCasaLogo && <img src={j.timeCasaLogo} alt="" className="w-5 h-5 object-contain" />}
                                <span className={`text-sm font-medium text-right ${casaVenceu ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                  {j.timeCasa}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 px-2 shrink-0 bg-muted rounded-lg py-1">
                                <span className={`text-base font-bold ${casaVenceu ? "text-primary" : empate ? "text-yellow-400" : "text-muted-foreground"}`}>{j.golsCasa}</span>
                                <span className="text-muted-foreground text-xs">-</span>
                                <span className={`text-base font-bold ${visitanteVenceu ? "text-primary" : empate ? "text-yellow-400" : "text-muted-foreground"}`}>{j.golsVisitante}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`text-sm font-medium ${visitanteVenceu ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                  {j.timeVisitante}
                                </span>
                                {j.timeVisitanteLogo && <img src={j.timeVisitanteLogo} alt="" className="w-5 h-5 object-contain" />}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground w-16 shrink-0 text-right hidden sm:block">
                              {j.rodada?.replace("Regular Season - ", "R") ?? ""}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
