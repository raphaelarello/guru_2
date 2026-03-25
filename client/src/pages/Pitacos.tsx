import { useState, useMemo } from "react";
import { useRelatorioPDF } from "@/hooks/useRelatorioPDF";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Plus, Target, TrendingUp, Trophy, Zap, Search, ChevronDown, ChevronUp, Edit3, Check, X, BarChart3, Star, Trash2, RefreshCw, Download, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  GaugeCircular, MercadoResultadoItem, ScoreBadge,
  calcularScore, getScoreLabel, detectarTipoMercado, ICONES_MERCADO,
  type MercadoPrevisto
} from "@/components/ScorePrecisao";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";

// ─── Templates de mercados para preenchimento rápido ─────────────────────────
const MERCADOS_RAPIDOS = [
  { tipo: "gols", label: "Acima 0.5 Gols", valorPrevisto: "sim", peso: 1 },
  { tipo: "gols", label: "Acima 1.5 Gols", valorPrevisto: "sim", peso: 1 },
  { tipo: "gols", label: "Acima 2.5 Gols", valorPrevisto: "sim", peso: 2 },
  { tipo: "gols", label: "Acima 3.5 Gols", valorPrevisto: "sim", peso: 1 },
  { tipo: "gols", label: "Acima 4.5 Gols", valorPrevisto: "sim", peso: 1 },
  { tipo: "btts", label: "Ambas Marcam", valorPrevisto: "sim", peso: 1 },
  { tipo: "resultado", label: "Mandante Vence", valorPrevisto: "casa", peso: 2 },
  { tipo: "resultado", label: "Visitante Vence", valorPrevisto: "visitante", peso: 2 },
  { tipo: "resultado", label: "Empate", valorPrevisto: "empate", peso: 2 },
  { tipo: "escanteios", label: "Acima 8.5 Escanteios", valorPrevisto: "sim", peso: 1 },
  { tipo: "escanteios", label: "Acima 10.5 Escanteios", valorPrevisto: "sim", peso: 1 },
  { tipo: "cartoes", label: "Acima 3.5 Cartões", valorPrevisto: "sim", peso: 1 },
  { tipo: "cartoes", label: "Acima 5.5 Cartões", valorPrevisto: "sim", peso: 1 },
  { tipo: "tempo_gol", label: "Gol até 15 min", valorPrevisto: "sim", peso: 1 },
  { tipo: "tempo_gol", label: "Gol até 30 min", valorPrevisto: "sim", peso: 1 },
  { tipo: "posse", label: "Posse > 60%", valorPrevisto: "casa", peso: 1 },
  { tipo: "chutes", label: "Chutes a Gol > 5", valorPrevisto: "sim", peso: 1 },
  { tipo: "penalti", label: "Pênalti no Jogo", valorPrevisto: "sim", peso: 1 },
];

const LABEL_TIPO: Record<string, string> = {
  gols: "⚽ Gols", btts: "✅ BTTS", resultado: "🏆 Resultado",
  escanteios: "🚩 Escanteios", cartoes: "🟨 Cartões", tempo_gol: "⏱️ Tempo de Gol",
  posse: "🎮 Posse", chutes: "💥 Chutes", penalti: "🥅 Pênalti", outros: "📊 Outros",
};

export default function Pitacos() {
  const { gerarPDF, gerando } = useRelatorioPDF();
  const [modalNovo, setModalNovo] = useState(false);
  const [modalResultados, setModalResultados] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("todos");
  const [abaStats, setAbaStats] = useState(false);

  // Formulário novo palpite
  const [novo, setNovo] = useState({ jogo: "", liga: "", mercado: "", odd: "", analise: "", confianca: 75 });
  const [mercadosForm, setMercadosForm] = useState<MercadoPrevisto[]>([]);
  const [mercadoCustom, setMercadoCustom] = useState({ tipo: "gols", label: "", valorPrevisto: "", peso: 1 });

  // Formulário de resultados
  const [mercadosResultado, setMercadosResultado] = useState<MercadoPrevisto[]>([]);
  const [placarFinal, setPlacarFinal] = useState("");

  const pitacosQuery = trpc.pitacos.list.useQuery();
  const statsQuery = trpc.pitacos.stats.useQuery();
  const statsByLigaQuery = trpc.pitacos.statsByLiga.useQuery();
  const [abaAnalise, setAbaAnalise] = useState<"geral" | "liga">("geral");
  const utils = trpc.useUtils();

  const criarPitaco = trpc.pitacos.create.useMutation({
    onSuccess: () => {
      utils.pitacos.list.invalidate();
      utils.pitacos.stats.invalidate();
      setModalNovo(false);
      toast.success("Palpite registrado! 🎯");
      setNovo({ jogo: "", liga: "", mercado: "", odd: "", analise: "", confianca: 75 });
      setMercadosForm([]);
    },
    onError: () => toast.error("Erro ao registrar palpite"),
  });

  const updateMercados = trpc.pitacos.updateMercados.useMutation({
    onSuccess: (data) => {
      utils.pitacos.list.invalidate();
      utils.pitacos.stats.invalidate();
      setModalResultados(null);
      const score = data?.scorePrevisao ? parseFloat(data.scorePrevisao) : 0;
      const { label, cor } = getScoreLabel(score);
      toast.success(`Score de Precisão: ${score.toFixed(0)} — ${label}`, {
        description: `Palpite atualizado com sucesso`,
      });
    },
    onError: () => toast.error("Erro ao atualizar resultados"),
  });

  const pitacos = pitacosQuery.data ?? [];
  const stats = statsQuery.data;

  const pitacosFiltrados = useMemo(() => pitacos.filter(p => {
    const matchBusca = busca === "" || p.jogo.toLowerCase().includes(busca.toLowerCase()) || p.mercado.toLowerCase().includes(busca.toLowerCase());
    const matchResultado = filtroResultado === "todos" || p.resultado === filtroResultado;
    return matchBusca && matchResultado;
  }), [pitacos, busca, filtroResultado]);

  const adicionarMercadoRapido = (template: typeof MERCADOS_RAPIDOS[0]) => {
    setMercadosForm(prev => [...prev, { ...template }]);
  };

  const adicionarMercadoCustom = () => {
    if (!mercadoCustom.label || !mercadoCustom.valorPrevisto) return;
    setMercadosForm(prev => [...prev, { ...mercadoCustom }]);
    setMercadoCustom({ tipo: "gols", label: "", valorPrevisto: "", peso: 1 });
  };

  const removerMercado = (i: number) => setMercadosForm(prev => prev.filter((_, idx) => idx !== i));

  const abrirModalResultados = (pitaco: any) => {
    const mercados = (pitaco.mercadosPrevistos as MercadoPrevisto[] | null) ?? [];
    setMercadosResultado(mercados.map(m => ({ ...m })));
    setPlacarFinal(pitaco.placarFinal ?? "");
    setModalResultados(pitaco);
  };

  const toggleAcerto = (i: number, acertou: boolean | undefined) => {
    setMercadosResultado(prev => prev.map((m, idx) => idx === i ? { ...m, acertou } : m));
  };

  const setValorReal = (i: number, valorReal: string) => {
    setMercadosResultado(prev => prev.map((m, idx) => idx === i ? { ...m, valorReal } : m));
  };

  const scorePreview = useMemo(() => calcularScore(mercadosResultado), [mercadosResultado]);

  // Dados para o radar chart de mercados
  const radarData = useMemo(() => {
    if (!stats?.statsPorMercado) return [];
    return Object.entries(stats.statsPorMercado).map(([tipo, s]) => ({
      mercado: LABEL_TIPO[tipo] ?? tipo,
      taxa: Math.round(s.taxa),
      total: s.total,
    }));
  }, [stats]);

  // Dados para o gráfico de linha de score
  const linhaScore = useMemo(() => {
    if (!stats?.historicoScore) return [];
    return stats.historicoScore.map((h, i) => ({
      index: i + 1,
      score: Math.round(h.score),
      jogo: h.jogo,
    }));
  }, [stats]);

  return (
    <RaphaLayout title="Pitacos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          <Button
            variant={!abaStats ? "default" : "outline"}
            size="sm"
            className={!abaStats ? "bg-primary text-primary-foreground" : "border-border"}
            onClick={() => setAbaStats(false)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />Palpites
          </Button>
          <Button
            variant={abaStats ? "default" : "outline"}
            size="sm"
            className={abaStats ? "bg-primary text-primary-foreground" : "border-border"}
            onClick={() => setAbaStats(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />Análise de Precisão
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            disabled={gerando}
            onClick={async () => {
              const statsData = statsQuery.data;
              const byLiga = statsByLigaQuery.data ?? [];
              const mercados = (statsData?.rankingMercados ?? []).map((m: any) => ({
                tipo: m.label,
                total: m.total,
                acertos: m.acertos,
                taxa: m.taxa,
                scoreMedio: m.scoreMedio ?? 0,
              }));
              const ligas = byLiga.map((l: any) => ({
                liga: l.liga,
                total: l.total,
                greens: l.greens,
                reds: l.reds,
                taxaAcerto: l.taxaAcerto,
                scoreMedio: l.scoreMedio,
                oddMedia: l.oddMedia,
              }));
              await gerarPDF({
                periodo: "Todos os períodos",
                totalPalpites: statsData?.totalPalpites ?? 0,
                greens: statsData?.greens ?? 0,
                reds: statsData?.reds ?? 0,
                taxaAcerto: statsData?.taxaAcerto ?? 0,
                scoreMedio: statsData?.scoreMedio ?? 0,
                oddMedia: 0,
                mercados,
                ligas,
                evolucaoScore: (statsData?.historicoScore ?? []).map((h: any, i: number) => ({
                  data: `#${i + 1}`,
                  score: Math.round(h.score),
                })),
              }, "analise-precisao-grafico");
              toast.success("📄 Relatório PDF gerado com sucesso!");
            }}
          >
            {gerando ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando PDF...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Exportar PDF</>
            )}
          </Button>
          <Button className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
            <Plus className="w-4 h-4 mr-2" />Novo Palpite Multi-Mercado
          </Button>
        </div>
      </div>

      {!abaStats ? (
        <>
          {/* Stats rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total", value: pitacos.length, color: "text-foreground" },
              { label: "Greens", value: stats?.greens ?? 0, color: "text-green-400" },
              { label: "Reds", value: stats?.reds ?? 0, color: "text-red-400" },
              { label: "Score Médio", value: stats?.scoreMedio ? `${stats.scoreMedio.toFixed(0)}` : "—", color: "text-primary" },
            ].map((s, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  {i === 3 && stats?.scoreMedio ? (
                    <GaugeCircular score={Math.round(stats.scoreMedio)} size={56} />
                  ) : (
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  )}
                  {i !== 3 && <p className="text-xs text-muted-foreground">{s.label}</p>}
                  {i === 3 && <div><p className={`text-lg font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar jogo ou mercado..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <Select value={filtroResultado} onValueChange={setFiltroResultado}>
              <SelectTrigger className="w-full sm:w-44 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">⏳ Pendentes</SelectItem>
                <SelectItem value="green">✅ Greens</SelectItem>
                <SelectItem value="red">❌ Reds</SelectItem>
                <SelectItem value="void">⚪ Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pitacosFiltrados.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {pitacos.length === 0 ? "Nenhum palpite ainda" : "Nenhum resultado encontrado"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {pitacos.length === 0 ? "Registre palpites com múltiplos mercados e acompanhe sua precisão em cada um" : "Tente ajustar os filtros"}
                </p>
                {pitacos.length === 0 && (
                  <Button className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
                    <Plus className="w-4 h-4 mr-2" />Criar Primeiro Palpite
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pitacosFiltrados.map(pitaco => {
                const mercados = (pitaco.mercadosPrevistos as MercadoPrevisto[] | null) ?? [];
                const score = pitaco.scorePrevisao ? parseFloat(pitaco.scorePrevisao) : (mercados.length > 0 ? calcularScore(mercados) : null);
                const temMercados = mercados.length > 0;
                const pendente = pitaco.resultado === "pendente";
                const acertos = mercados.filter(m => m.acertou === true).length;
                const erros = mercados.filter(m => m.acertou === false).length;
                const pendentes = mercados.filter(m => m.acertou === undefined).length;

                return (
                  <Card key={pitaco.id} className={`bg-card border transition-all ${
                    !pendente && score !== null && score >= 60 ? "border-green-500/30" :
                    !pendente && score !== null && score < 60 ? "border-red-500/30" :
                    "border-border"
                  }`}>
                    <CardContent className="p-4">
                      {/* Header do card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-foreground">{pitaco.jogo}</h3>
                            {pitaco.placarFinal && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{pitaco.placarFinal}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {pitaco.liga && <span className="text-xs text-muted-foreground">{pitaco.liga}</span>}
                            <span className="badge-blue text-[10px]">{pitaco.mercado}</span>
                            <span className="text-xs text-foreground">@{pitaco.odd}</span>
                            <span className="text-xs text-primary">{pitaco.confianca}% conf.</span>
                          </div>
                          {/* Resumo de mercados */}
                          {temMercados && (
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {acertos > 0 && <span className="text-xs text-green-400 font-semibold">✓ {acertos} acerto{acertos !== 1 ? "s" : ""}</span>}
                              {erros > 0 && <span className="text-xs text-red-400 font-semibold">✗ {erros} erro{erros !== 1 ? "s" : ""}</span>}
                              {pendentes > 0 && <span className="text-xs text-muted-foreground">⏳ {pendentes} pendente{pendentes !== 1 ? "s" : ""}</span>}
                              <span className="text-xs text-muted-foreground">/ {mercados.length} mercados</span>
                            </div>
                          )}
                        </div>
                        {/* Score Gauge */}
                        {score !== null && temMercados ? (
                          <GaugeCircular score={score} size={80} />
                        ) : (
                          <span className={`badge-${pendente ? "yellow" : pitaco.resultado === "green" ? "green" : pitaco.resultado === "red" ? "red" : "blue"} text-xs shrink-0`}>
                            {pendente ? "⏳ Pendente" : pitaco.resultado === "green" ? "✅ Green" : pitaco.resultado === "red" ? "❌ Red" : "⚪ Void"}
                          </span>
                        )}
                      </div>

                      {/* Mercados previstos */}
                      {temMercados && (
                        <div className="space-y-1.5 mb-3">
                          {mercados.map((m, i) => (
                            <MercadoResultadoItem key={i} mercado={m} />
                          ))}
                        </div>
                      )}

                      {/* Análise */}
                      {pitaco.analise && (
                        <p className="text-xs text-muted-foreground mb-3 italic border-l-2 border-primary/30 pl-2">{pitaco.analise}</p>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(pitaco.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex gap-2">
                          {temMercados && (
                            <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 text-xs" onClick={() => abrirModalResultados(pitaco)}>
                              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                              {pendente ? "Inserir Resultados" : "Editar Resultados"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ─── ABA ANÁLISE DE PRECISÃO ─── */
        <div className="space-y-4">
          {/* Sub-abas */}
          <div className="flex gap-2">
            <button
              onClick={() => setAbaAnalise("geral")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                abaAnalise === "geral"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <BarChart3 className="w-4 h-4" />Visão Geral
            </button>
            <button
              onClick={() => setAbaAnalise("liga")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                abaAnalise === "liga"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Globe className="w-4 h-4" />Por Liga
              {(statsByLigaQuery.data?.length ?? 0) > 0 && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                  {statsByLigaQuery.data?.length}
                </span>
              )}
            </button>
          </div>
          {abaAnalise === "geral" ? (
            <AnalisePrecisao stats={stats} radarData={radarData} linhaScore={linhaScore} />
          ) : (
            <ComparativoPorLiga data={statsByLigaQuery.data ?? []} isLoading={statsByLigaQuery.isLoading} />
          )}
        </div>
      )}

      {/* ─── MODAL NOVO PALPITE MULTI-MERCADO ─── */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Novo Palpite Multi-Mercado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Jogo e liga */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground text-sm">Jogo *</Label>
                <Input value={novo.jogo} onChange={e => setNovo(p => ({ ...p, jogo: e.target.value }))} placeholder="Time A vs Time B" className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-sm">Liga</Label>
                <Input value={novo.liga} onChange={e => setNovo(p => ({ ...p, liga: e.target.value }))} placeholder="Brasileirão" className="bg-input border-border mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground text-sm">Mercado Principal *</Label>
                <Input value={novo.mercado} onChange={e => setNovo(p => ({ ...p, mercado: e.target.value }))} placeholder="Over 2.5 Gols" className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-sm">Odd</Label>
                <Input value={novo.odd} onChange={e => setNovo(p => ({ ...p, odd: e.target.value }))} placeholder="1.85" className="bg-input border-border mt-1" type="number" step="0.01" />
              </div>
            </div>
            <div>
              <Label className="text-foreground text-sm">Confiança: <span className="text-primary font-bold">{novo.confianca}%</span></Label>
              <Slider value={[novo.confianca]} onValueChange={([v]) => setNovo(p => ({ ...p, confianca: v }))} min={1} max={99} step={1} className="mt-2" />
            </div>
            <div>
              <Label className="text-foreground text-sm">Análise</Label>
              <Textarea value={novo.analise} onChange={e => setNovo(p => ({ ...p, analise: e.target.value }))} placeholder="Descreva sua análise..." className="bg-input border-border mt-1 resize-none" rows={2} />
            </div>

            {/* Mercados adicionais */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Mercados Adicionais</span>
                  {mercadosForm.length > 0 && <span className="badge-blue text-[10px]">{mercadosForm.length}</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">Clique para adicionar rapidamente</span>
              </div>
              <div className="p-3 space-y-3">
                {/* Atalhos rápidos */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2 font-medium">Atalhos Rápidos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MERCADOS_RAPIDOS.map((m, i) => {
                      const jaAdicionado = mercadosForm.some(f => f.label === m.label);
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={jaAdicionado}
                          onClick={() => adicionarMercadoRapido(m)}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${jaAdicionado ? "border-primary/50 bg-primary/10 text-primary opacity-60" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                        >
                          {ICONES_MERCADO[m.tipo]} {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mercado personalizado */}
                <div className="border-t border-border pt-3">
                  <p className="text-[11px] text-muted-foreground mb-2 font-medium">Mercado Personalizado</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Select value={mercadoCustom.tipo} onValueChange={v => setMercadoCustom(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger className="bg-input border-border text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LABEL_TIPO).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={mercadoCustom.label} onChange={e => setMercadoCustom(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Acima 2.5" className="bg-input border-border text-xs h-8" />
                    <Input value={mercadoCustom.valorPrevisto} onChange={e => setMercadoCustom(p => ({ ...p, valorPrevisto: e.target.value }))} placeholder="Valor previsto" className="bg-input border-border text-xs h-8" />
                    <Button size="sm" className="h-8 bg-primary/10 text-primary border border-primary/30 text-xs" onClick={adicionarMercadoCustom} disabled={!mercadoCustom.label || !mercadoCustom.valorPrevisto}>
                      <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de mercados adicionados */}
                {mercadosForm.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <p className="text-[11px] text-muted-foreground font-medium mb-2">Mercados Configurados ({mercadosForm.length})</p>
                    {mercadosForm.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <span className="text-base">{ICONES_MERCADO[m.tipo] ?? "📊"}</span>
                        <span className="text-xs text-foreground flex-1">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground">→ {m.valorPrevisto}</span>
                        {m.peso > 1 && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">PRINCIPAL</span>}
                        <button type="button" onClick={() => removerMercado(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => criarPitaco.mutate({ ...novo, mercadosPrevistos: mercadosForm.length > 0 ? mercadosForm : undefined })}
              disabled={!novo.jogo || !novo.mercado || criarPitaco.isPending}
            >
              {criarPitaco.isPending ? "Registrando..." : `Registrar Palpite${mercadosForm.length > 0 ? ` (${mercadosForm.length + 1} mercados)` : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL INSERIR RESULTADOS ─── */}
      <Dialog open={!!modalResultados} onOpenChange={() => setModalResultados(null)}>
        <DialogContent className="bg-card border-border max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Inserir Resultados Reais
            </DialogTitle>
          </DialogHeader>
          {modalResultados && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="font-semibold text-foreground">{modalResultados.jogo}</p>
                {modalResultados.liga && <p className="text-xs text-muted-foreground">{modalResultados.liga}</p>}
              </div>

              {/* Placar final */}
              <div>
                <Label className="text-foreground text-sm">Placar Final (ex: 2-1)</Label>
                <Input value={placarFinal} onChange={e => setPlacarFinal(e.target.value)} placeholder="2-1" className="bg-input border-border mt-1" />
              </div>

              {/* Preview do score em tempo real */}
              {mercadosResultado.some(m => m.acertou !== undefined) && (
                <div className="flex items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <GaugeCircular score={scorePreview} size={72} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Score de Precisão em Tempo Real</p>
                    <p className="text-xs text-muted-foreground">
                      {mercadosResultado.filter(m => m.acertou === true).length} acertos,{" "}
                      {mercadosResultado.filter(m => m.acertou === false).length} erros,{" "}
                      {mercadosResultado.filter(m => m.acertou === undefined).length} pendentes
                    </p>
                    <ScoreBadge score={scorePreview} />
                  </div>
                </div>
              )}

              {/* Mercados para preencher */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Resultados por Mercado</p>
                {mercadosResultado.map((m, i) => (
                  <div key={i} className={`p-3 rounded-xl border transition-all ${
                    m.acertou === true ? "border-green-500/40 bg-green-500/5" :
                    m.acertou === false ? "border-red-500/40 bg-red-500/5" :
                    "border-border bg-muted/20"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ICONES_MERCADO[m.tipo] ?? "📊"}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{m.label}</p>
                          <p className="text-xs text-muted-foreground">Previsto: <span className="text-foreground font-medium">{m.valorPrevisto}</span></p>
                        </div>
                      </div>
                      {/* Botões acerto/erro */}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleAcerto(i, m.acertou === true ? undefined : true)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${m.acertou === true ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-green-500/20 hover:text-green-400"}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAcerto(i, m.acertou === false ? undefined : false)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${m.acertou === false ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-400"}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Valor real */}
                    <div>
                      <Input
                        value={m.valorReal ?? ""}
                        onChange={e => setValorReal(i, e.target.value)}
                        placeholder={`Valor real (ex: ${m.tipo === "gols" ? "3" : m.tipo === "cartoes" ? "5" : m.tipo === "escanteios" ? "11" : "sim/não"})`}
                        className="bg-input border-border text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalResultados(null)}>Cancelar</Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => updateMercados.mutate({ id: modalResultados.id, mercadosPrevistos: mercadosResultado, placarFinal: placarFinal || undefined })}
              disabled={updateMercados.isPending}
            >
              {updateMercados.isPending ? "Salvando..." : "Salvar Resultados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}

// ─── Componente de Análise de Precisão ───────────────────────────────────────
function AnalisePrecisao({ stats, radarData, linhaScore }: { stats: any; radarData: any[]; linhaScore: any[] }) {
  if (!stats) return (
    <div className="text-center py-16 text-muted-foreground">
      <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin opacity-40" />
      <p>Carregando análise...</p>
    </div>
  );

  const rankingMercados = stats.rankingMercados ?? [];

  return (
    <div className="space-y-5">
      {/* Score médio grande */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <GaugeCircular score={Math.round(stats.scoreMedio)} size={140} />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Score Médio de Precisão</p>
              <p className="text-xs text-muted-foreground">{stats.totalPalpites} palpite{stats.totalPalpites !== 1 ? "s" : ""} registrado{stats.totalPalpites !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução do Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linhaScore.length < 2 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Registre mais palpites para ver a evolução
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={linhaScore}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="index" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <RTooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [`${v}`, "Score"]}
                    labelFormatter={(i) => linhaScore[i - 1]?.jogo ?? `#${i}`}
                  />
                  <Line type="monotone" dataKey="score" stroke="#00ff41" strokeWidth={2} dot={{ fill: "#00ff41", r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Radar e Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radar por mercado */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Precisão por Tipo de Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length < 3 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm text-center">
                <div>
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Adicione palpites com múltiplos mercados para ver o radar</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="mercado" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Radar name="Taxa de Acerto" dataKey="taxa" stroke="#00ff41" fill="#00ff41" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ranking de mercados */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Ranking de Mercados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingMercados.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm text-center">
                <div>
                  <Star className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Nenhum mercado com dados suficientes ainda</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {rankingMercados.slice(0, 6).map((m: any, i: number) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <span className="text-sm">{ICONES_MERCADO[m.label] ?? "📊"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground capitalize">{m.label}</span>
                        <span className={`text-xs font-bold ${m.taxa >= 60 ? "text-green-400" : m.taxa >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                          {m.taxa.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${m.taxa >= 60 ? "bg-green-400" : m.taxa >= 40 ? "bg-yellow-400" : "bg-red-400"}`}
                          style={{ width: `${m.taxa}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.acertos}/{m.total} acertos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Melhor e pior mercado */}
      {(stats.melhorMercado || stats.piorMercado) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.melhorMercado && (
            <Card className="bg-green-500/5 border-green-500/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">
                  {ICONES_MERCADO[stats.melhorMercado.label] ?? "🏆"}
                </div>
                <div>
                  <p className="text-xs text-green-400 font-semibold uppercase tracking-wide">Melhor Mercado</p>
                  <p className="text-base font-bold text-foreground capitalize">{stats.melhorMercado.label}</p>
                  <p className="text-sm text-green-400 font-bold">{stats.melhorMercado.taxa.toFixed(0)}% de acerto</p>
                  <p className="text-xs text-muted-foreground">{stats.melhorMercado.acertos}/{stats.melhorMercado.total} previsões</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.piorMercado && stats.piorMercado.label !== stats.melhorMercado?.label && (
            <Card className="bg-red-500/5 border-red-500/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">
                  {ICONES_MERCADO[stats.piorMercado.label] ?? "📉"}
                </div>
                <div>
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wide">Mercado a Melhorar</p>
                  <p className="text-base font-bold text-foreground capitalize">{stats.piorMercado.label}</p>
                  <p className="text-sm text-red-400 font-bold">{stats.piorMercado.taxa.toFixed(0)}% de acerto</p>
                  <p className="text-xs text-muted-foreground">{stats.piorMercado.acertos}/{stats.piorMercado.total} previsões</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente Comparativo Por Liga ─────────────────────────────────────────
const CORES_BARRAS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

function ComparativoPorLiga({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <Card className="bg-card border-border border-dashed">
        <CardContent className="p-12 text-center">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum dado por liga ainda</h3>
          <p className="text-sm text-muted-foreground">Adicione palpites com o campo "Liga" preenchido para ver a análise comparativa.</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.taxaAcerto - a.taxaAcerto);
  const melhorLiga = sorted[0];
  const piorLiga = sorted[sorted.length - 1];

  return (
    <div className="space-y-5">
      {/* Cards de destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-[11px] text-green-400 font-bold uppercase tracking-wider mb-1">🏆 Melhor Liga</p>
            <p className="font-bold text-foreground">{melhorLiga.liga}</p>
            <p className="text-2xl font-black text-green-400">{melhorLiga.taxaAcerto.toFixed(1)}%</p>
            <p className="text-[11px] text-muted-foreground">{melhorLiga.greens}/{melhorLiga.total} greens</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-primary font-bold uppercase tracking-wider mb-1">📊 Score Médio Geral</p>
            <p className="font-bold text-foreground">Todas as Ligas</p>
            <p className="text-2xl font-black text-primary">
              {data.length > 0 ? (data.reduce((acc, l) => acc + l.scoreMedio, 0) / data.length).toFixed(1) : "0"}/100
            </p>
            <p className="text-[11px] text-muted-foreground">{data.reduce((acc, l) => acc + l.total, 0)} palpites totais</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/30">
          <CardContent className="p-4">
            <p className="text-[11px] text-red-400 font-bold uppercase tracking-wider mb-1">📉 Pior Liga</p>
            <p className="font-bold text-foreground">{piorLiga.liga}</p>
            <p className="text-2xl font-black text-red-400">{piorLiga.taxaAcerto.toFixed(1)}%</p>
            <p className="text-[11px] text-muted-foreground">{piorLiga.greens}/{piorLiga.total} greens</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras — Taxa de acerto por liga */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground">Taxa de Acerto por Liga</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="liga" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} width={100} />
              <RTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Taxa de Acerto"]}
              />
              <Bar dataKey="taxaAcerto" radius={[0, 4, 4, 0]}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={CORES_BARRAS[i % CORES_BARRAS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de barras — Score médio por liga */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground">Score Médio de Precisão por Liga</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
            <BarChart data={[...sorted].sort((a, b) => b.scoreMedio - a.scoreMedio)} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis type="category" dataKey="liga" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} width={100} />
              <RTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}/100`, "Score Médio"]}
              />
              <Bar dataKey="scoreMedio" radius={[0, 4, 4, 0]}>
                {[...sorted].sort((a, b) => b.scoreMedio - a.scoreMedio).map((_, i) => (
                  <Cell key={i} fill={CORES_BARRAS[i % CORES_BARRAS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela detalhada */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground">Tabela Completa por Liga</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Liga</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Palpites</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Greens</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Reds</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Taxa</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Score Médio</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Odd Média</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((liga, i) => (
                  <tr key={liga.liga} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground font-bold">{i + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-foreground">{liga.liga}</td>
                    <td className="px-3 py-2.5 text-center text-foreground">{liga.total}</td>
                    <td className="px-3 py-2.5 text-center text-green-400 font-bold">{liga.greens}</td>
                    <td className="px-3 py-2.5 text-center text-red-400 font-bold">{liga.reds}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-bold ${liga.taxaAcerto >= 60 ? "text-green-400" : liga.taxaAcerto >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                        {liga.taxaAcerto.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-bold ${liga.scoreMedio >= 70 ? "text-green-400" : liga.scoreMedio >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {liga.scoreMedio.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-primary font-medium">{liga.oddMedia.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
