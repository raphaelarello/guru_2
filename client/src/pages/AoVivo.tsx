import { useState, useEffect } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Radio, TrendingUp, Zap, Target, Clock, Search, Filter, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// Dados simulados de jogos ao vivo com análise de IA
const JOGOS_AO_VIVO = [
  { id: 1, casa: "Manchester City", fora: "Arsenal", liga: "Premier League", minuto: 67, placar: "2-1", oportunidades: [{ mercado: "Over 0.5 FT", odd: 1.05, ev: 8.2, confianca: 94, motivos: ["Placar já 2-1", "Média 3.2 gols/jogo", "Pressão alta Arsenal"] }, { mercado: "BTTS", odd: 1.45, ev: 12.5, confianca: 88, motivos: ["Arsenal marcou fora", "City defesa vulnerável", "Ambos com gols hoje"] }], status: "quente" },
  { id: 2, casa: "Real Madrid", fora: "Barcelona", liga: "La Liga", minuto: 34, placar: "0-0", oportunidades: [{ mercado: "Over 2.5 FT", odd: 1.85, ev: 15.3, confianca: 82, motivos: ["Clássico histórico alto scoring", "Ambos precisam vencer", "Pressão ofensiva alta"] }], status: "morno" },
  { id: 3, casa: "PSG", fora: "Lyon", liga: "Ligue 1", minuto: 78, placar: "3-0", oportunidades: [{ mercado: "Goleada PSG", odd: 1.12, ev: 6.8, confianca: 96, motivos: ["Já 3-0 no 78'", "PSG dominante", "Lyon sem reação"] }], status: "quente" },
  { id: 4, casa: "Bayern Munich", fora: "Borussia Dortmund", liga: "Bundesliga", minuto: 45, placar: "1-1", oportunidades: [{ mercado: "BTTS Alta Pressão", odd: 1.55, ev: 18.7, confianca: 91, motivos: ["Clássico alemão", "Ambos marcaram", "2ª tempo mais aberto"] }, { mercado: "Over 3.5 FT", odd: 2.10, ev: 22.1, confianca: 75, motivos: ["Histórico 4+ gols", "Pressão ofensiva ambos", "Defesas abertas"] }], status: "quente" },
  { id: 5, casa: "Flamengo", fora: "Palmeiras", liga: "Brasileirão", minuto: 55, placar: "1-0", oportunidades: [{ mercado: "Over 1.5 FT", odd: 1.35, ev: 11.2, confianca: 87, motivos: ["Flamengo pressionando", "Palmeiras buscando empate", "Média alta ambos"] }], status: "morno" },
  { id: 6, casa: "Inter Milan", fora: "Juventus", liga: "Serie A", minuto: 22, placar: "0-0", oportunidades: [{ mercado: "Ambos Marcam", odd: 1.75, ev: 14.8, confianca: 79, motivos: ["Derby italiano", "Histórico BTTS 68%", "Ambos em forma ofensiva"] }], status: "frio" },
  { id: 7, casa: "Atlético Madrid", fora: "Sevilla", liga: "La Liga", minuto: 61, placar: "2-0", oportunidades: [{ mercado: "Over 0.5 FT", odd: 1.02, ev: 3.1, confianca: 99, motivos: ["Já 2-0", "Certeza matemática quase"] }], status: "quente" },
  { id: 8, casa: "Chelsea", fora: "Liverpool", liga: "Premier League", minuto: 38, placar: "1-2", oportunidades: [{ mercado: "Over 3.5 FT", odd: 1.95, ev: 19.4, confianca: 83, motivos: ["Já 3 gols em 38'", "Ritmo alto", "Chelsea buscando empate"] }, { mercado: "Liverpool Vence", odd: 1.65, ev: 13.2, confianca: 80, motivos: ["Liverpool 2-1 fora", "Histórico forte fora", "Chelsea inconsistente"] }], status: "quente" },
  { id: 9, casa: "Corinthians", fora: "São Paulo", liga: "Brasileirão", minuto: 70, placar: "0-0", oportunidades: [{ mercado: "Empate FT", odd: 2.80, ev: 25.6, confianca: 71, motivos: ["Derby sem gols", "Ambos defensivos", "Histórico 40% empate"] }], status: "frio" },
  { id: 10, casa: "Tottenham", fora: "Newcastle", liga: "Premier League", minuto: 15, placar: "0-1", oportunidades: [{ mercado: "Tottenham Vira", odd: 3.20, ev: 28.4, confianca: 68, motivos: ["Tottenham em casa", "Newcastle 1-0 cedo", "Histórico viradas Spurs"] }], status: "morno" },
  { id: 11, casa: "Ajax", fora: "PSV", liga: "Eredivisie", minuto: 52, placar: "2-2", oportunidades: [{ mercado: "Over 4.5 FT", odd: 2.40, ev: 21.8, confianca: 77, motivos: ["Já 4 gols", "Ambos ofensivos", "Liga holandesa alta pontuação"] }, { mercado: "BTTS", odd: 1.20, ev: 9.5, confianca: 95, motivos: ["Ambos já marcaram", "Certeza quase"] }], status: "quente" },
  { id: 12, casa: "Porto", fora: "Benfica", liga: "Primeira Liga", minuto: 80, placar: "1-1", oportunidades: [{ mercado: "Over 2.5 FT", odd: 1.15, ev: 7.3, confianca: 93, motivos: ["Já 2 gols", "Minuto 80", "Ambos pressionando"] }], status: "quente" },
  { id: 13, casa: "Boca Juniors", fora: "River Plate", liga: "Liga Argentina", minuto: 44, placar: "0-0", oportunidades: [{ mercado: "Superclásico Gols", odd: 1.90, ev: 16.7, confianca: 78, motivos: ["Superclásico histórico", "Tensão alta", "2ª tempo mais aberto"] }], status: "morno" },
  { id: 14, casa: "Sporting CP", fora: "Braga", liga: "Primeira Liga", minuto: 63, placar: "3-1", oportunidades: [{ mercado: "Over 0.5 FT", odd: 1.01, ev: 2.5, confianca: 99, motivos: ["Já 4 gols", "Certeza absoluta"] }], status: "quente" },
  { id: 15, casa: "Galatasaray", fora: "Fenerbahçe", liga: "Süper Lig", minuto: 29, placar: "1-0", oportunidades: [{ mercado: "Over 2.5 FT", odd: 1.70, ev: 14.1, confianca: 81, motivos: ["Derby turco", "Galatasaray em casa", "Histórico gols alto"] }], status: "morno" },
  { id: 16, casa: "Marseille", fora: "Monaco", liga: "Ligue 1", minuto: 57, placar: "1-1", oportunidades: [{ mercado: "BTTS + Over 2.5", odd: 1.60, ev: 13.8, confianca: 84, motivos: ["Ambos marcaram", "Jogo aberto", "Monaco ofensivo"] }], status: "quente" },
  { id: 17, casa: "Shakhtar", fora: "Dynamo Kyiv", liga: "UPL", minuto: 71, placar: "2-0", oportunidades: [{ mercado: "Shakhtar Vence", odd: 1.08, ev: 5.2, confianca: 97, motivos: ["2-0 no 71'", "Dominância total", "Dynamo sem reação"] }], status: "quente" },
  { id: 18, casa: "Feyenoord", fora: "AZ Alkmaar", liga: "Eredivisie", minuto: 40, placar: "1-0", oportunidades: [{ mercado: "Over 2.5 FT", odd: 1.80, ev: 15.9, confianca: 80, motivos: ["Liga ofensiva", "Feyenoord em casa", "AZ buscando empate"] }], status: "morno" },
  { id: 19, casa: "Napoli", fora: "Lazio", liga: "Serie A", minuto: 85, placar: "2-1", oportunidades: [{ mercado: "Napoli Vence", odd: 1.18, ev: 8.9, confianca: 95, motivos: ["2-1 no 85'", "Napoli controlando", "Lazio sem tempo"] }], status: "quente" },
  { id: 20, casa: "Villarreal", fora: "Valencia", liga: "La Liga", minuto: 18, placar: "0-0", oportunidades: [{ mercado: "Ambos Marcam", odd: 1.85, ev: 16.3, confianca: 76, motivos: ["Ambos ofensivos", "Derby valenciano", "Histórico BTTS 65%"] }], status: "frio" },
];

const statusConfig = {
  quente: { label: "Quente", class: "badge-red", dot: "bg-red-500" },
  morno: { label: "Morno", class: "badge-yellow", dot: "bg-yellow-500" },
  frio: { label: "Frio", class: "badge-blue", dot: "bg-blue-500" },
};

export default function AoVivo() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [jogoSelecionado, setJogoSelecionado] = useState<typeof JOGOS_AO_VIVO[0] | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
  const [atualizando, setAtualizando] = useState(false);

  const atualizar = () => {
    setAtualizando(true);
    setTimeout(() => {
      setUltimaAtualizacao(new Date());
      setAtualizando(false);
      toast.success("Dados atualizados com sucesso!");
    }, 1200);
  };

  const jogosFiltrados = JOGOS_AO_VIVO.filter(j => {
    const matchBusca = busca === "" || j.casa.toLowerCase().includes(busca.toLowerCase()) || j.fora.toLowerCase().includes(busca.toLowerCase()) || j.liga.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || j.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const totalOportunidades = JOGOS_AO_VIVO.reduce((acc, j) => acc + j.oportunidades.length, 0);
  const jogosQuentes = JOGOS_AO_VIVO.filter(j => j.status === "quente").length;

  return (
    <RaphaLayout title="Jogos Ao Vivo">
      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jogos ao Vivo", value: JOGOS_AO_VIVO.length, icon: Radio, color: "text-primary" },
          { label: "Oportunidades", value: totalOportunidades, icon: Target, color: "text-green-400" },
          { label: "Jogos Quentes", value: jogosQuentes, icon: Zap, color: "text-red-400" },
          { label: "Última Atualização", value: ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), icon: Clock, color: "text-muted-foreground" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar time ou liga..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="quente">Quentes</SelectItem>
            <SelectItem value="morno">Mornos</SelectItem>
            <SelectItem value="frio">Frios</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={atualizar} disabled={atualizando} className="border-border">
          <RefreshCw className={`w-4 h-4 mr-2 ${atualizando ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Lista de jogos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {jogosFiltrados.map(jogo => {
          const statusInfo = statusConfig[jogo.status as keyof typeof statusConfig];
          return (
            <Card
              key={jogo.id}
              className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group"
              onClick={() => setJogoSelecionado(jogo)}
            >
              <CardContent className="p-4">
                {/* Header do jogo */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                    <span className="text-xs text-muted-foreground">{jogo.liga}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{jogo.minuto}'</span>
                    <span className={statusInfo.class}>{statusInfo.label}</span>
                  </div>
                </div>

                {/* Times e placar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{jogo.casa}</p>
                    <p className="font-semibold text-foreground text-sm">{jogo.fora}</p>
                  </div>
                  <div className="text-center px-4">
                    <span className="text-2xl font-bold text-primary neon-text">{jogo.placar}</span>
                  </div>
                </div>

                {/* Oportunidades */}
                <div className="space-y-1.5">
                  {jogo.oportunidades.slice(0, 2).map((op, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground">{op.mercado}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">@{op.odd}</span>
                        <span className="text-xs text-green-400 font-medium">EV+{op.ev}%</span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${op.confianca}%` }} />
                          </div>
                          <span className="text-xs text-primary font-bold">{op.confianca}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {jogo.oportunidades.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">+{jogo.oportunidades.length - 2} oportunidades</p>
                  )}
                </div>

                <div className="flex items-center justify-end mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!jogoSelecionado} onOpenChange={() => setJogoSelecionado(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {jogoSelecionado && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {jogoSelecionado.casa} vs {jogoSelecionado.fora}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{jogoSelecionado.liga} • {jogoSelecionado.minuto}'</p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center py-4 bg-muted/30 rounded-xl">
                  <span className="text-5xl font-bold text-primary neon-text">{jogoSelecionado.placar}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Oportunidades Detectadas pela IA
                  </h3>
                  {jogoSelecionado.oportunidades.map((op, i) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">{op.mercado}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">@{op.odd}</span>
                          <span className="badge-green">EV+{op.ev}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${op.confianca}%` }} />
                        </div>
                        <span className="text-sm font-bold text-primary">{op.confianca}% confiança</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Motivos da análise:</p>
                        {op.motivos.map((m, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}
