import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Thermometer, Trophy, TrendingUp, Calendar, Filter, BarChart3, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const NIVEL_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  "Gelado": { label: "Gelado", color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30", emoji: "🧊" },
  "Morno": { label: "Morno", color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/30", emoji: "🌡️" },
  "Quente": { label: "Quente", color: "text-orange-400", bg: "bg-orange-500/20 border-orange-500/30", emoji: "🔥" },
  "Vulcão": { label: "Vulcão", color: "text-red-400", bg: "bg-red-500/20 border-red-500/30", emoji: "🌋" },
};

export default function HistoricoAoVivo() {
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 20;

  const { data: stats, isLoading: statsLoading } = trpc.liveHistory.stats.useQuery();
  const { data: historico, isLoading: histLoading } = trpc.liveHistory.listar.useQuery({
    limit: POR_PAGINA,
    offset: pagina * POR_PAGINA,
    nivelCalor: filtroNivel !== "todos" ? filtroNivel : undefined,
  });

  const finalizarMutation = trpc.liveHistory.finalizar.useMutation();

  const chartData = stats?.porNivel?.map(n => ({
    name: n.nivel,
    taxa: n.taxa,
    total: n.total,
    acertos: n.acertos,
    fill: n.nivel === "Gelado" ? "#60a5fa" : n.nivel === "Morno" ? "#facc15" : n.nivel === "Quente" ? "#fb923c" : "#f87171",
  })) ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Thermometer className="text-orange-400" size={28} />
            Histórico Ao Vivo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise de acurácia do termômetro de calor — jogos monitorados em tempo real
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24 bg-muted/20 rounded" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <BarChart3 size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Total Monitorados</span>
              </div>
              <div className="text-3xl font-bold text-blue-300">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.comResultado} com resultado</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Target size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Taxa de Acerto</span>
              </div>
              <div className="text-3xl font-bold text-green-300">{stats.taxaAcerto}%</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.acertos} acertos verificados</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Flame size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Calor Médio c/ Gols</span>
              </div>
              <div className="text-3xl font-bold text-orange-300">{stats.mediaCalorComGols}</div>
              <div className="text-xs text-muted-foreground mt-1">score médio quando houve gol</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Trophy size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Melhor Nível</span>
              </div>
              {stats.porNivel && stats.porNivel.length > 0 ? (() => {
                const melhor = [...stats.porNivel].filter(n => n.total > 0).sort((a, b) => b.taxa - a.taxa)[0];
                return melhor ? (
                  <>
                    <div className="text-3xl font-bold text-purple-300">{melhor.taxa}%</div>
                    <div className="text-xs text-muted-foreground mt-1">{melhor.nivel} ({melhor.total} jogos)</div>
                  </>
                ) : <div className="text-muted-foreground text-sm">Sem dados</div>;
              })() : <div className="text-muted-foreground text-sm">Sem dados</div>}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Gráfico de acurácia por nível */}
      {stats && stats.porNivel && chartData.some(d => d.total > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" />
              Acurácia do Termômetro por Nível de Calor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    formatter={(value: number, name: string) => [
                      name === "taxa" ? `${value}%` : value,
                      name === "taxa" ? "Taxa de Acerto" : name === "total" ? "Total" : "Acertos"
                    ]}
                  />
                  <Bar dataKey="taxa" radius={[4, 4, 0, 0]} name="taxa">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {stats.porNivel.map(n => {
                const cfg = NIVEL_CONFIG[n.nivel] ?? { label: n.nivel, color: "text-gray-400", bg: "bg-gray-500/20 border-gray-500/30", emoji: "❓" };
                return (
                  <div key={n.nivel} className={`rounded-lg border p-3 ${cfg.bg}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-lg">{cfg.emoji}</span>
                      <span className={`text-sm font-semibold ${cfg.color}`}>{n.nivel}</span>
                    </div>
                    <div className="text-2xl font-bold">{n.taxa}%</div>
                    <div className="text-xs text-muted-foreground">{n.acertos}/{n.total} acertos</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e lista */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              Jogos Monitorados
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <Select value={filtroNivel} onValueChange={v => { setFiltroNivel(v); setPagina(0); }}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder="Nível de calor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os níveis</SelectItem>
                  <SelectItem value="Gelado">🧊 Gelado</SelectItem>
                  <SelectItem value="Morno">🌡️ Morno</SelectItem>
                  <SelectItem value="Quente">🔥 Quente</SelectItem>
                  <SelectItem value="Vulcão">🌋 Vulcão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {histLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !historico || historico.length === 0 ? (
            <div className="text-center py-12">
              <Thermometer size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum jogo monitorado ainda</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Os jogos ao vivo que você acompanhar aparecerão aqui automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map(jogo => {
                const cfg = NIVEL_CONFIG[jogo.nivelCalor ?? ""] ?? { label: "—", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20", emoji: "❓" };
                const placarStr = `${jogo.golsCasa ?? 0}–${jogo.golsVisit ?? 0}`;
                return (
                  <div key={jogo.id} className={`rounded-lg border p-3 transition-all hover:scale-[1.005] cursor-default ${cfg.bg}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{jogo.jogo}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{jogo.liga ?? "—"}</span>
                            {jogo.minuto && <span>· {jogo.minuto}'</span>}
                            <span>· {new Date(jogo.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Placar */}
                        <div className="text-center">
                          <div className="text-lg font-bold tabular-nums">{placarStr}</div>
                          {jogo.placarFinal && (
                            <div className="text-xs text-muted-foreground">Final: {jogo.placarFinal}</div>
                          )}
                        </div>
                        {/* Score de calor */}
                        <div className="text-center w-14">
                          <div className={`text-xl font-bold ${cfg.color}`}>{jogo.scoreCalor ?? 0}</div>
                          <div className="text-xs text-muted-foreground">calor</div>
                        </div>
                        {/* Resultado do termômetro */}
                        {jogo.acertouTermometro !== null && jogo.acertouTermometro !== undefined ? (
                          <Badge variant={jogo.acertouTermometro ? "default" : "destructive"} className="text-xs">
                            {jogo.acertouTermometro ? "✓ Acertou" : "✗ Errou"}
                          </Badge>
                        ) : jogo.placarFinal ? (
                          <Badge variant="secondary" className="text-xs">Verificar</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Pendente</Badge>
                        )}
                      </div>
                    </div>
                    {/* Estatísticas inline */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>⛳ {(jogo.escanteiosCasa ?? 0) + (jogo.escanteiosVisit ?? 0)} escanteios</span>
                      <span>🟨 {(jogo.cartoesCasa ?? 0) + (jogo.cartoesVisit ?? 0)} cartões</span>
                      {(jogo.totalSinais ?? 0) > 0 && (
                        <span className="text-yellow-400">⚡ {jogo.totalSinais} sinais</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {historico && historico.length === POR_PAGINA && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>
                ← Anterior
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">Página {pagina + 1}</span>
              <Button variant="outline" size="sm" onClick={() => setPagina(p => p + 1)}>
                Próxima →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
