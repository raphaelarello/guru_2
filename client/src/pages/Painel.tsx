import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bot, Radio, TrendingUp, Target, Zap, ArrowRight, BarChart3, DollarSign, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Painel() {
  const botsQuery = trpc.bots.list.useQuery();
  const alertasQuery = trpc.alertas.list.useQuery();
  const bancaQuery = trpc.banca.get.useQuery();
  const apostasQuery = trpc.apostas.list.useQuery();

  const bots = botsQuery.data ?? [];
  const alertas = alertasQuery.data ?? [];
  const apostas = apostasQuery.data ?? [];
  const banca = bancaQuery.data;

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

  const cards = [
    { titulo: "Bots Ativos", valor: `${botsAtivos}/${bots.length}`, icone: Bot, cor: "text-primary", bg: "bg-primary/10", link: "/bots", desc: "Bots automáticos" },
    { titulo: "Jogos Ao Vivo", valor: "20", icone: Radio, cor: "text-red-400", bg: "bg-red-500/10", link: "/ao-vivo", desc: "Oportunidades detectadas" },
    { titulo: "Alertas Hoje", valor: alertasHoje, icone: Target, cor: "text-green-400", bg: "bg-green-500/10", link: "/auditoria", desc: "Sinais gerados" },
    { titulo: "Taxa de Acerto", valor: `${taxa}%`, icone: CheckCircle, cor: "text-yellow-400", bg: "bg-yellow-500/10", link: "/kelly", desc: "Performance geral" },
    { titulo: "Banca Atual", valor: banca ? `R$ ${parseFloat(banca.valorAtual ?? "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—", icone: DollarSign, cor: "text-blue-400", bg: "bg-blue-500/10", link: "/kelly", desc: "Kelly Tracker" },
    { titulo: "Lucro Total", valor: `R$ ${lucroTotal.toFixed(2)}`, icone: TrendingUp, cor: lucroTotal >= 0 ? "text-green-400" : "text-red-400", bg: lucroTotal >= 0 ? "bg-green-500/10" : "bg-red-500/10", link: "/kelly", desc: "Resultado acumulado" },
  ];

  return (
    <RaphaLayout title="Painel">
      {/* Boas-vindas */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 neon-glow flex items-center justify-center flex-shrink-0">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">RAPHA GURU</h2>
            <p className="text-muted-foreground">Plataforma de Apostas com Inteligência Artificial</p>
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card, i) => (
          <Link key={i} href={card.link}>
            <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icone className={`w-5 h-5 ${card.cor}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className={`text-2xl font-bold ${card.cor}`}>{card.valor}</p>
                <p className="text-sm font-medium text-foreground">{card.titulo}</p>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Ver Jogos Ao Vivo", link: "/ao-vivo", icon: Radio, color: "text-red-400" },
              { label: "Gerenciar Bots", link: "/bots", icon: Bot, color: "text-primary" },
              { label: "Calcular Stake Kelly", link: "/kelly", icon: TrendingUp, color: "text-green-400" },
              { label: "Registrar Pitaco", link: "/pitacos", icon: Target, color: "text-yellow-400" },
            ].map((item, i) => (
              <Link key={i} href={item.link}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Últimas Apostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apostas.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">Nenhuma aposta registrada</p>
                <Link href="/kelly">
                  <Button size="sm" variant="outline" className="border-border mt-3">
                    Registrar Aposta
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {apostas.slice(0, 4).map(aposta => (
                  <div key={aposta.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{aposta.jogo}</p>
                      <p className="text-xs text-muted-foreground">{aposta.mercado} @{aposta.odd}</p>
                    </div>
                    <span className={aposta.resultado === "green" ? "badge-green" : aposta.resultado === "red" ? "badge-red" : "badge-yellow"}>
                      {aposta.resultado === "green" ? "Green" : aposta.resultado === "red" ? "Red" : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RaphaLayout>
  );
}
