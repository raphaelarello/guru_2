import RaphaLayout from "@/components/RaphaLayout";
import { Star, Zap, TrendingUp, Trophy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Destaques() {
  return (
    <RaphaLayout title="Destaques">
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
        {/* Ícone animado */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Star className="w-12 h-12 text-yellow-400" fill="currentColor" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Destaques</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Em breve, os melhores jogos, apostas e análises do dia em um só lugar.
          </p>
        </div>

        {/* Cards de preview do que vem por aí */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="font-semibold text-sm text-foreground">Top Oportunidades</p>
              <p className="text-xs text-muted-foreground">As apostas com maior valor esperado do dia, selecionadas pelos bots.</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="font-semibold text-sm text-foreground">Jogos em Destaque</p>
              <p className="text-xs text-muted-foreground">Partidas com maior intensidade ofensiva e probabilidade de gols.</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <p className="font-semibold text-sm text-foreground">Próximas Grandes Ligas</p>
              <p className="text-xs text-muted-foreground">Agenda dos jogos mais importantes das principais ligas do mundo.</p>
            </CardContent>
          </Card>
        </div>

        {/* Badge Em Breve */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold">
          <Clock className="w-4 h-4" />
          Em desenvolvimento — em breve disponível
        </div>
      </div>
    </RaphaLayout>
  );
}
