import { useState, useMemo } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Calculator, Plus, CheckCircle, XCircle, Clock, Settings, BarChart3, Search, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function calcularKelly(odd: number, prob: number, fracao: number = 0.25): number {
  const b = odd - 1;
  const q = 1 - prob;
  const kelly = (b * prob - q) / b;
  return Math.max(0, kelly * fracao);
}

export default function KellyTracker() {
  const [aba, setAba] = useState("calculadora");
  const [modalBanca, setModalBanca] = useState(false);
  const [modalAposta, setModalAposta] = useState(false);
  const [buscaAposta, setBuscaAposta] = useState("");
  const [filtroResultadoAposta, setFiltroResultadoAposta] = useState("todos");

  // Calculadora
  const [calcOdd, setCalcOdd] = useState("2.00");
  const [calcProb, setCalcProb] = useState("55");
  const [calcFracao, setCalcFracao] = useState("0.25");

  // Nova aposta
  const [novaAposta, setNovaAposta] = useState({ jogo: "", mercado: "", odd: "", stake: "" });

  // Config banca
  const [configBanca, setConfigBanca] = useState({ valorTotal: "", stopLoss: "20", stopGain: "50", kellyFracao: "0.25" });

  const bancaQuery = trpc.banca.get.useQuery();
  const apostasQuery = trpc.apostas.list.useQuery();
  const utils = trpc.useUtils();

  const upsertBanca = trpc.banca.upsert.useMutation({
    onSuccess: () => { utils.banca.get.invalidate(); setModalBanca(false); toast.success("Banca configurada!"); },
    onError: () => toast.error("Erro ao configurar banca"),
  });

  const criarAposta = trpc.apostas.create.useMutation({
    onSuccess: () => { utils.apostas.list.invalidate(); setModalAposta(false); toast.success("Aposta registrada!"); setNovaAposta({ jogo: "", mercado: "", odd: "", stake: "" }); },
    onError: () => toast.error("Erro ao registrar aposta"),
  });

  const updateAposta = trpc.apostas.updateResultado.useMutation({
    onSuccess: () => { utils.apostas.list.invalidate(); toast.success("Resultado atualizado!"); },
    onError: () => toast.error("Erro ao atualizar resultado"),
  });

  const banca = bancaQuery.data;
  const apostas = apostasQuery.data ?? [];

  const apostasFiltradas = useMemo(() => {
    return apostas.filter(a => {
      const matchBusca = buscaAposta === "" || a.jogo.toLowerCase().includes(buscaAposta.toLowerCase()) || (a.mercado ?? "").toLowerCase().includes(buscaAposta.toLowerCase());
      const matchResultado = filtroResultadoAposta === "todos" || a.resultado === filtroResultadoAposta;
      return matchBusca && matchResultado;
    });
  }, [apostas, buscaAposta, filtroResultadoAposta]);

  // Cálculo Kelly
  const kellyResult = useMemo(() => {
    const odd = parseFloat(calcOdd) || 0;
    const prob = parseFloat(calcProb) / 100 || 0;
    const fracao = parseFloat(calcFracao) || 0.25;
    const bancaAtual = parseFloat(banca?.valorAtual ?? "1000");
    const kellyPct = calcularKelly(odd, prob, fracao);
    return {
      percentual: kellyPct * 100,
      stake: bancaAtual * kellyPct,
      ev: (odd * prob - 1) * 100,
    };
  }, [calcOdd, calcProb, calcFracao, banca]);

  // Métricas
  const metricas = useMemo(() => {
    const finalizadas = apostas.filter(a => a.resultado !== "pendente" && a.resultado !== "void");
    const greens = finalizadas.filter(a => a.resultado === "green");
    const totalInvestido = finalizadas.reduce((s, a) => s + parseFloat(a.stake ?? "0"), 0);
    const totalLucro = finalizadas.reduce((s, a) => s + parseFloat(a.lucro ?? "0"), 0);
    const roi = totalInvestido > 0 ? (totalLucro / totalInvestido) * 100 : 0;
    return {
      total: apostas.length,
      finalizadas: finalizadas.length,
      greens: greens.length,
      taxa: finalizadas.length > 0 ? (greens.length / finalizadas.length * 100).toFixed(1) : "0",
      roi: roi.toFixed(2),
      lucroTotal: totalLucro.toFixed(2),
    };
  }, [apostas]);

  // Dados para gráfico
  const dadosGrafico = useMemo(() => {
    const bancaInicial = parseFloat(banca?.valorTotal ?? "1000");
    let bancaAcumulada = bancaInicial;
    return apostas.filter(a => a.resultado !== "pendente").slice(0, 30).reverse().map((a, i) => {
      const lucro = parseFloat(a.lucro ?? "0");
      bancaAcumulada += lucro;
      return { aposta: i + 1, banca: parseFloat(bancaAcumulada.toFixed(2)) };
    });
  }, [apostas, banca]);

  const bancaAtual = parseFloat(banca?.valorAtual ?? "0");
  const bancaTotal = parseFloat(banca?.valorTotal ?? "0");
  const pctBanca = bancaTotal > 0 ? (bancaAtual / bancaTotal) * 100 : 0;

  return (
    <RaphaLayout title="Kelly Tracker">
      {/* Banca Overview */}
      {banca ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border-border md:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Banca Atual</p>
                  <p className="text-4xl font-bold text-primary neon-text">R$ {parseFloat(banca.valorAtual ?? "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground mt-1">de R$ {parseFloat(banca.valorTotal ?? "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })} inicial</p>
                </div>
                <Button variant="outline" size="sm" className="border-border" onClick={() => { setConfigBanca({ valorTotal: banca.valorTotal ?? "", stopLoss: banca.stopLoss ?? "20", stopGain: banca.stopGain ?? "50", kellyFracao: banca.kellyFracao ?? "0.25" }); setModalBanca(true); }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(pctBanca, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Stop Loss: -{banca.stopLoss}%</span>
                <span className="text-primary font-medium">{pctBanca.toFixed(1)}% da banca</span>
                <span>Stop Gain: +{banca.stopGain}%</span>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {[
              { label: "ROI Total", value: `${metricas.roi}%`, color: parseFloat(metricas.roi) >= 0 ? "text-green-400" : "text-red-400", icon: TrendingUp },
              { label: "Taxa de Acerto", value: `${metricas.taxa}%`, color: "text-primary", icon: Target },
            ].map((m, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <m.icon className={`w-8 h-8 ${m.color}`} />
                  <div>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Configure sua Banca</h3>
            <p className="text-muted-foreground mb-4">Defina sua banca para usar o Kelly Tracker completo</p>
            <Button className="bg-primary text-primary-foreground" onClick={() => setModalBanca(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Banca
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={aba} onValueChange={setAba}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="calculadora">Calculadora Kelly</TabsTrigger>
            <TabsTrigger value="apostas">Registro de Apostas</TabsTrigger>
            <TabsTrigger value="grafico">Evolução da Banca</TabsTrigger>
          </TabsList>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setModalAposta(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Aposta
          </Button>
        </div>

        {/* Calculadora */}
        <TabsContent value="calculadora">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Parâmetros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-foreground">Odd da Aposta</Label>
                  <Input value={calcOdd} onChange={e => setCalcOdd(e.target.value)} placeholder="2.00" className="bg-input border-border mt-1" type="number" step="0.01" min="1.01" />
                </div>
                <div>
                  <Label className="text-foreground">Probabilidade Estimada: {calcProb}%</Label>
                  <Slider value={[parseInt(calcProb)]} onValueChange={([v]) => setCalcProb(String(v))} min={1} max={99} step={1} className="mt-2" />
                </div>
                <div>
                  <Label className="text-foreground">Fração de Kelly</Label>
                  <Select value={calcFracao} onValueChange={setCalcFracao}>
                    <SelectTrigger className="bg-input border-border mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.25">Kelly 1/4 (Conservador)</SelectItem>
                      <SelectItem value="0.5">Kelly 1/2 (Moderado)</SelectItem>
                      <SelectItem value="0.75">Kelly 3/4 (Agressivo)</SelectItem>
                      <SelectItem value="1">Kelly Completo (Máximo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-card border-border ${kellyResult.ev > 0 ? "border-primary/40 neon-glow" : "border-red-500/30"}`}>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${kellyResult.ev > 0 ? "text-primary" : "text-red-400"}`} />
                  Resultado Kelly
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Stake Recomendado</p>
                  <p className={`text-4xl font-bold ${kellyResult.ev > 0 ? "text-primary neon-text" : "text-red-400"}`}>
                    R$ {kellyResult.stake.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{kellyResult.percentual.toFixed(2)}% da banca</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Expected Value</p>
                    <p className={`text-xl font-bold ${kellyResult.ev > 0 ? "text-green-400" : "text-red-400"}`}>
                      {kellyResult.ev > 0 ? "+" : ""}{kellyResult.ev.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Lucro Potencial</p>
                    <p className="text-xl font-bold text-green-400">
                      R$ {(kellyResult.stake * (parseFloat(calcOdd) - 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
                {kellyResult.ev <= 0 && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span>EV negativo — não recomendado apostar</span>
                  </div>
                )}
                {kellyResult.ev > 0 && (
                  <Button className="w-full bg-primary text-primary-foreground" onClick={() => { setNovaAposta(p => ({ ...p, odd: calcOdd, stake: kellyResult.stake.toFixed(2) })); setModalAposta(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar esta Aposta
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Apostas */}
        <TabsContent value="apostas">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total", value: metricas.total, color: "text-foreground" },
              { label: "Greens", value: metricas.greens, color: "text-green-400" },
              { label: "Taxa Acerto", value: `${metricas.taxa}%`, color: "text-primary" },
              { label: "Lucro Total", value: `R$ ${metricas.lucroTotal}`, color: parseFloat(metricas.lucroTotal) >= 0 ? "text-green-400" : "text-red-400" },
            ].map((m, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-3">
                  <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar jogo ou mercado..." value={buscaAposta} onChange={e => setBuscaAposta(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <Select value={filtroResultadoAposta} onValueChange={setFiltroResultadoAposta}>
              <SelectTrigger className="w-full sm:w-44 bg-card border-border">
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">⏳ Pendentes</SelectItem>
                <SelectItem value="green">✅ Greens</SelectItem>
                <SelectItem value="red">❌ Reds</SelectItem>
                <SelectItem value="void">⚪ Void</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-border" onClick={() => {
              const header = "Jogo,Mercado,Odd,Stake,Lucro,ROI,Resultado,Data";
              const linhas = apostasFiltradas.map(a => `"${a.jogo}","${a.mercado ?? ""}","${a.odd ?? ""}","${a.stake ?? ""}","${a.lucro ?? ""}","${a.roi ?? ""}","${a.resultado ?? "pendente"}","${new Date(a.createdAt).toLocaleString("pt-BR")}"`);
              const csv = [header, ...linhas].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url; link.download = `kelly-apostas-${new Date().toISOString().slice(0,10)}.csv`;
              link.click(); URL.revokeObjectURL(url);
              toast.success("CSV exportado!");
            }}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          {apostasFiltradas.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-10 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{apostas.length === 0 ? "Nenhuma aposta registrada ainda" : "Nenhuma aposta encontrada com os filtros aplicados"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {apostasFiltradas.map(aposta => (
                <Card key={aposta.id} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm">{aposta.jogo}</span>
                        <span className="badge-blue">{aposta.mercado}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>@{aposta.odd}</span>
                        <span>Stake: R$ {aposta.stake}</span>
                        {aposta.lucro && <span className={parseFloat(aposta.lucro) >= 0 ? "text-green-400" : "text-red-400"}>Lucro: R$ {aposta.lucro}</span>}
                        {aposta.roi && <span className={parseFloat(aposta.roi) >= 0 ? "text-green-400" : "text-red-400"}>ROI: {aposta.roi}%</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {aposta.resultado === "pendente" ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-7 px-2 text-xs" onClick={() => {
                            const lucro = (parseFloat(aposta.odd ?? "1") - 1) * parseFloat(aposta.stake ?? "0");
                            const roi = (lucro / parseFloat(aposta.stake ?? "1")) * 100;
                            updateAposta.mutate({ id: aposta.id, resultado: "green", lucro: lucro.toFixed(2), roi: roi.toFixed(2) });
                          }}>Green</Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs" onClick={() => {
                            const lucro = -parseFloat(aposta.stake ?? "0");
                            updateAposta.mutate({ id: aposta.id, resultado: "red", lucro: lucro.toFixed(2), roi: "-100" });
                          }}>Red</Button>
                        </div>
                      ) : (
                        <span className={aposta.resultado === "green" ? "badge-green" : aposta.resultado === "red" ? "badge-red" : "badge-yellow"}>
                          {aposta.resultado === "green" ? "Green ✓" : aposta.resultado === "red" ? "Red ✗" : "Void"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gráfico */}
        <TabsContent value="grafico">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Evolução da Banca</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosGrafico.length < 2 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>Registre pelo menos 2 apostas para ver o gráfico</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 150)" />
                    <XAxis dataKey="aposta" stroke="oklch(0.55 0.03 150)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="oklch(0.55 0.03 150)" tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "oklch(0.12 0.015 150)", border: "1px solid oklch(0.22 0.02 150)", borderRadius: "8px" }}
                      labelStyle={{ color: "oklch(0.95 0.02 150)" }}
                      formatter={(v: any) => [`R$ ${v}`, "Banca"]}
                    />
                    <Line type="monotone" dataKey="banca" stroke="oklch(0.72 0.22 145)" strokeWidth={2} dot={{ fill: "oklch(0.72 0.22 145)", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Banca */}
      <Dialog open={modalBanca} onOpenChange={setModalBanca}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Configurar Banca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Valor Total da Banca (R$)</Label>
              <Input value={configBanca.valorTotal} onChange={e => setConfigBanca(p => ({ ...p, valorTotal: e.target.value }))} placeholder="1000.00" className="bg-input border-border mt-1" type="number" />
            </div>
            <div>
              <Label className="text-foreground">Stop Loss: {configBanca.stopLoss}%</Label>
              <Slider value={[parseInt(configBanca.stopLoss)]} onValueChange={([v]) => setConfigBanca(p => ({ ...p, stopLoss: String(v) }))} min={5} max={50} step={5} className="mt-2" />
            </div>
            <div>
              <Label className="text-foreground">Stop Gain: {configBanca.stopGain}%</Label>
              <Slider value={[parseInt(configBanca.stopGain)]} onValueChange={([v]) => setConfigBanca(p => ({ ...p, stopGain: String(v) }))} min={10} max={200} step={10} className="mt-2" />
            </div>
            <div>
              <Label className="text-foreground">Fração de Kelly Padrão</Label>
              <Select value={configBanca.kellyFracao} onValueChange={v => setConfigBanca(p => ({ ...p, kellyFracao: v }))}>
                <SelectTrigger className="bg-input border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.25">Kelly 1/4 (Conservador)</SelectItem>
                  <SelectItem value="0.5">Kelly 1/2 (Moderado)</SelectItem>
                  <SelectItem value="0.75">Kelly 3/4 (Agressivo)</SelectItem>
                  <SelectItem value="1">Kelly Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalBanca(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => upsertBanca.mutate({ valorTotal: configBanca.valorTotal, stopLoss: configBanca.stopLoss, stopGain: configBanca.stopGain, kellyFracao: configBanca.kellyFracao })} disabled={!configBanca.valorTotal || upsertBanca.isPending}>
              {upsertBanca.isPending ? "Salvando..." : "Salvar Banca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Aposta */}
      <Dialog open={modalAposta} onOpenChange={setModalAposta}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Registrar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Jogo</Label>
              <Input value={novaAposta.jogo} onChange={e => setNovaAposta(p => ({ ...p, jogo: e.target.value }))} placeholder="Ex: Flamengo vs Palmeiras" className="bg-input border-border mt-1" />
            </div>
            <div>
              <Label className="text-foreground">Mercado</Label>
              <Input value={novaAposta.mercado} onChange={e => setNovaAposta(p => ({ ...p, mercado: e.target.value }))} placeholder="Ex: Over 2.5 Gols" className="bg-input border-border mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Odd</Label>
                <Input value={novaAposta.odd} onChange={e => setNovaAposta(p => ({ ...p, odd: e.target.value }))} placeholder="2.00" className="bg-input border-border mt-1" type="number" step="0.01" />
              </div>
              <div>
                <Label className="text-foreground">Stake (R$)</Label>
                <Input value={novaAposta.stake} onChange={e => setNovaAposta(p => ({ ...p, stake: e.target.value }))} placeholder="50.00" className="bg-input border-border mt-1" type="number" step="0.01" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalAposta(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => criarAposta.mutate(novaAposta)} disabled={!novaAposta.jogo || !novaAposta.mercado || !novaAposta.odd || !novaAposta.stake || criarAposta.isPending}>
              {criarAposta.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}
