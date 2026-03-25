import { useMemo } from "react";
import { Users, Cpu } from "lucide-react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Bot, Radio, TrendingUp, Target, Zap, ArrowRight, BarChart3,
  DollarSign, CheckCircle, Trophy, Star, Activity, Flame,
  AlertTriangle, ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  GaugeCircular, ScoreBadge, getScoreLabel, ICONES_MERCADO,
  type MercadoPrevisto
} from "@/components/ScorePrecisao";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

export default function Painel() {
  const botsQuery = trpc.bots.list.useQuery();
  const alertasQuery = trpc.alertas.list.useQuery();
  const bancaQuery = trpc.banca.get.useQuery();
  const apostasQuery = trpc.apostas.list.useQuery();
  const pitacosStatsQuery = trpc.pitacos.stats.useQuery();
  const pitacosQuery = trpc.pitacos.list.useQuery();
  const liveQuery = trpc.football.liveFixtures.useQuery(undefined, { refetchInterval: 60000 });

  const bots = botsQuery.data ?? [];
  const alertas = alertasQuery.data ?? [];
  const apostas = apostasQuery.data ?? [];
  const banca = bancaQuery.data;
  const pStats = pitacosStatsQuery.data;
  const pitacos = pitacosQuery.data ?? [];

  const botsAtivos = bots.filter(b => b.ativo).length;
  const alertasHoje = alertas.filter(a => {
    const hoje = new Date();
    const data = new Date(a.createdAt);
    return data.toDateString() === hoje.toDateString();
  }).length;
  const greens = apostas.filter(a => a.resultado === "green").length;
  const finalizadas = apostas.filter(a => a.resultado !== "pendente" && a.resultado !== "void").length;
  const taxa = finalizadas > 0 ? ((greens / finalizadas) * 100).toFixed(1) : "0";
  const lucroTotal = apostas.reduce((s, a) => s + parseFloat(a.lucro ?? "0"), 0);

  // Últimos palpites com score
  const ultimosPalpitesComScore = useMemo(() =>
    pitacos
      .filter(p => p.scorePrevisao !== null && p.scorePrevisao !== undefined)
      .slice(-5)
      .reverse(),
    [pitacos]
  );

  // Dados para gráfico de barras de mercados
  const dadosMercados = useMemo(() => {
    if (!pStats?.statsPorMercado) return [];
    return Object.entries(pStats.statsPorMercado)
      .filter(([, s]) => s.total >= 1)
      .map(([tipo, s]) => ({
        nome: tipo,
        taxa: Math.round(s.taxa),
        total: s.total,
        icone: ICONES_MERCADO[tipo] ?? "📊",
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 6);
  }, [pStats]);

  // Score médio
  const scoreMedio = pStats?.scoreMedio ? Math.round(pStats.scoreMedio) : 0;
  const { cor: scoreCor } = getScoreLabel(scoreMedio);

  const cards = [
    { titulo: "Bots Ativos", valor: `${botsAtivos}/${bots.length}`, icone: Bot, cor: "text-primary", bg: "bg-primary/10", link: "/bots", desc: "Bots automáticos" },
    { titulo: "Jogos Ao Vivo", valor: liveQuery.data ? `${liveQuery.data.length}` : "—", icone: Radio, cor: "text-red-400", bg: "bg-red-500/10", link: "/ao-vivo", desc: "Jogos em andamento agora" },
    { titulo: "Alertas Hoje", valor: alertasHoje, icone: Target, cor: "text-green-400", bg: "bg-green-500/10", link: "/auditoria", desc: "Sinais gerados" },
    { titulo: "Taxa de Acerto", valor: `${taxa}%`, icone: CheckCircle, cor: "text-yellow-400", bg: "bg-yellow-500/10", link: "/kelly", desc: "Performance geral" },
    { titulo: "Banca Atual", valor: banca ? `R$ ${parseFloat(banca.valorAtual ?? "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—", icone: DollarSign, cor: "text-blue-400", bg: "bg-blue-500/10", link: "/kelly", desc: "Kelly Tracker" },
    { titulo: "Lucro Total", valor: `R$ ${lucroTotal.toFixed(2)}`, icone: TrendingUp, cor: lucroTotal >= 0 ? "text-green-400" : "text-red-400", bg: lucroTotal >= 0 ? "bg-green-500/10" : "bg-red-500/10", link: "/kelly", desc: "Resultado acumulado" },
  ];

  return (
    <RaphaLayout title="Painel">
      {/* Boas-vindas */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 neon-glow flex items-center justify-center flex-shrink-0">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">RAPHA GURU</h2>
            <p className="text-sm text-muted-foreground">Plataforma de Apostas com Inteligência Artificial</p>
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {cards.map((card, i) => (
          <Link key={i} href={card.link}>
            <Card className="bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group h-full active:scale-95">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <card.icone className={`w-4 h-4 ${card.cor}`} />
                  </div>
                  <div className="flex items-center gap-0.5 bg-primary/10 rounded-full px-1.5 py-0.5">
                    <span className="text-[8px] text-primary font-medium">ir</span>
                    <ArrowRight className="w-2.5 h-2.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <p className={`text-xl font-bold ${card.cor}`}>{card.valor}</p>
                <p className="text-xs font-medium text-foreground">{card.titulo}</p>
                <p className="text-[10px] text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO ANÁLISE DE PRECISÃO ULTRA-INTELIGENTE                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Análise de Precisão de Palpites
          </h3>
          <Link href="/pitacos">
            <Button size="sm" variant="outline" className="border-border text-xs">
              Ver Detalhes <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score médio com gauge */}
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex flex-col items-center justify-center gap-3">
              <GaugeCircular score={scoreMedio} size={120} />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Score Médio de Precisão</p>
                <p className="text-xs text-muted-foreground">
                  {pStats?.totalPalpites ?? 0} palpite{(pStats?.totalPalpites ?? 0) !== 1 ? "s" : ""} •{" "}
                  <span className="text-green-400">{pStats?.greens ?? 0}G</span>{" "}
                  <span className="text-red-400">{pStats?.reds ?? 0}R</span>
                </p>
                {scoreMedio > 0 && <ScoreBadge score={scoreMedio} />}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de barras por mercado */}
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Taxa de Acerto por Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosMercados.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center gap-2">
                  <Target className="w-8 h-8 text-muted-foreground opacity-30" />
                  <p className="text-xs text-muted-foreground">Registre palpites com múltiplos mercados para ver a análise</p>
                  <Link href="/pitacos">
                    <Button size="sm" className="bg-primary/10 text-primary border border-primary/30 text-xs mt-1">
                      Criar Palpite Multi-Mercado
                    </Button>
                  </Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={dadosMercados} layout="vertical" margin={{ left: 8, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: "#9ca3af", fontSize: 10 }} width={70} tickFormatter={v => `${ICONES_MERCADO[v] ?? "📊"} ${v}`} />
                    <RTooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any, _: any, props: any) => [`${v}% (${props.payload.total} prev.)`, "Taxa"]}
                    />
                    <Bar dataKey="taxa" radius={[0, 4, 4, 0]}>
                      {dadosMercados.map((entry, i) => (
                        <Cell key={i} fill={entry.taxa >= 60 ? "#22c55e" : entry.taxa >= 40 ? "#eab308" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Últimos palpites com score + Melhor/Pior mercado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Últimos palpites com score */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Últimos Palpites com Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimosPalpitesComScore.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-muted-foreground">Nenhum palpite com score ainda</p>
                <Link href="/pitacos">
                  <Button size="sm" variant="outline" className="border-border mt-2 text-xs">Registrar Palpite</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {ultimosPalpitesComScore.map(p => {
                  const score = parseFloat(p.scorePrevisao ?? "0");
                  const { cor } = getScoreLabel(score);
                  const mercados = (p.mercadosPrevistos as MercadoPrevisto[] | null) ?? [];
                  const acertos = mercados.filter(m => m.acertou === true).length;
                  const total = mercados.length;
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <GaugeCircular score={score} size={48} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{p.jogo}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {acertos}/{total} mercados •{" "}
                          {p.placarFinal && <span className="text-primary font-medium">{p.placarFinal}</span>}
                        </p>
                      </div>
                      <ScoreBadge score={score} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Melhor e pior mercado + Ações rápidas */}
        <div className="space-y-4">
          {/* Melhor mercado */}
          {pStats?.melhorMercado && (
            <Card className="bg-green-500/5 border-green-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl shrink-0">
                  {ICONES_MERCADO[pStats.melhorMercado.label] ?? "🏆"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wide">Melhor Mercado</p>
                  <p className="text-sm font-bold text-foreground capitalize truncate">{pStats.melhorMercado.label}</p>
                  <p className="text-xs text-green-400">{pStats.melhorMercado.taxa.toFixed(0)}% • {pStats.melhorMercado.acertos}/{pStats.melhorMercado.total} acertos</p>
                </div>
                <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
              </CardContent>
            </Card>
          )}

          {/* Pior mercado */}
          {pStats?.piorMercado && pStats.piorMercado.label !== pStats.melhorMercado?.label && (
            <Card className="bg-red-500/5 border-red-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-xl shrink-0">
                  {ICONES_MERCADO[pStats.piorMercado.label] ?? "📉"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Mercado a Melhorar</p>
                  <p className="text-sm font-bold text-foreground capitalize truncate">{pStats.piorMercado.label}</p>
                  <p className="text-xs text-red-400">{pStats.piorMercado.taxa.toFixed(0)}% • {pStats.piorMercado.acertos}/{pStats.piorMercado.total} acertos</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              </CardContent>
            </Card>
          )}

          {/* Ações rápidas */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Ver Jogos Ao Vivo", link: "/ao-vivo", icon: Radio, color: "text-red-400" },
                { label: "Gerenciar Bots", link: "/bots", icon: Bot, color: "text-primary" },
                { label: "Calcular Stake Kelly", link: "/kelly", icon: TrendingUp, color: "text-green-400" },
                { label: "Novo Palpite Multi-Mercado", link: "/pitacos", icon: Target, color: "text-yellow-400" },
              ].map((item, i) => (
                <Link key={i} href={item.link}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="text-xs text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparativo Bots vs Manual */}
      <ComparativoBotVsManual bots={bots} alertas={alertas} apostas={apostas} />

      {/* Últimas apostas */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Últimas Apostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apostas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-xs">Nenhuma aposta registrada</p>
              <Link href="/kelly">
                <Button size="sm" variant="outline" className="border-border mt-2 text-xs">Registrar Aposta</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {apostas.slice(0, 5).map(aposta => (
                <div key={aposta.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{aposta.jogo}</p>
                    <p className="text-[10px] text-muted-foreground">{aposta.mercado} @{aposta.odd}</p>
                  </div>
                  <span className={aposta.resultado === "green" ? "badge-green text-[10px]" : aposta.resultado === "red" ? "badge-red text-[10px]" : "badge-yellow text-[10px]"}>
                    {aposta.resultado === "green" ? "✅ Green" : aposta.resultado === "red" ? "❌ Red" : "⏳ Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </RaphaLayout>
  );
}

function ComparativoBotVsManual({ bots, alertas, apostas }: {
  bots: any[];
  alertas: any[];
  apostas: any[];
}) {
  // Alertas gerados por bots (com botId)
  const alertasBots = alertas.filter(a => a.botId);
  const alertasBotsGreen = alertasBots.filter(a => a.resultado === "green").length;
  const alertasBotsFin = alertasBots.filter(a => a.resultado === "green" || a.resultado === "red").length;
  const taxaBots = alertasBotsFin > 0 ? Math.round((alertasBotsGreen / alertasBotsFin) * 100) : 0;

  // Apostas manuais (sem botId)
  const apostasManual = apostas.filter(a => !a.botId);
  const apostasManualGreen = apostasManual.filter(a => a.resultado === "green").length;
  const apostasManualFin = apostasManual.filter(a => a.resultado === "green" || a.resultado === "red").length;
  const taxaManual = apostasManualFin > 0 ? Math.round((apostasManualGreen / apostasManualFin) * 100) : 0;

  const totalBots = alertasBots.length;
  const totalManual = apostasManual.length;
  const temDados = totalBots > 0 || totalManual > 0;

  const vencedor = taxaBots > taxaManual ? "bots" : taxaManual > taxaBots ? "manual" : "empate";

  return (
    <Card className="bg-card border-border mb-5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Bots vs Análise Manual
          </CardTitle>
          {temDados && vencedor !== "empate" && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              vencedor === "bots" ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"
            }`}>
              {vencedor === "bots" ? "🤖 Bots lideram" : "👤 Manual lidera"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!temDados ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Ative bots e registre apostas para ver o comparativo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Bots */}
            <div className={`rounded-xl p-4 border ${
              vencedor === "bots" ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground">Bots IA</span>
                {vencedor === "bots" && <span className="text-[9px] text-primary">★</span>}
              </div>
              <p className="text-2xl font-black text-primary mb-1">{taxaBots}%</p>
              <p className="text-[10px] text-muted-foreground">{alertasBotsGreen}G / {alertasBotsFin - alertasBotsGreen}R</p>
              <p className="text-[10px] text-muted-foreground">{totalBots} sinais gerados</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${taxaBots}%` }} />
              </div>
            </div>
            {/* Manual */}
            <div className={`rounded-xl p-4 border ${
              vencedor === "manual" ? "border-blue-500/40 bg-blue-500/5" : "border-border bg-muted/20"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-bold text-foreground">Manual</span>
                {vencedor === "manual" && <span className="text-[9px] text-blue-400">★</span>}
              </div>
              <p className="text-2xl font-black text-blue-400 mb-1">{taxaManual}%</p>
              <p className="text-[10px] text-muted-foreground">{apostasManualGreen}G / {apostasManualFin - apostasManualGreen}R</p>
              <p className="text-[10px] text-muted-foreground">{totalManual} apostas registradas</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${taxaManual}%` }} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
