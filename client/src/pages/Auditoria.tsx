import { useState, useMemo } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Search, Filter, Target, TrendingUp, CheckCircle, XCircle, Clock, ChevronRight, Download, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FiltroLigas } from "@/components/FiltroLigas";
import { getInfoLiga } from "@shared/ligas";

const MERCADOS_OPCOES = [
  "Todos", "Acima 0.5 Gols", "Acima 1.5 Gols", "Acima 2.5 Gols", "Acima 3.5 Gols",
  "Ambas Marcam", "Vitória Casa", "Vitória Visitante", "Empate",
  "Gol no 1º Quarto", "Gols no 2º Tempo", "Escanteios Alto", "Cartões Amarelos", "EV+ Detector",
];

const PERIODOS = [
  { value: "todos", label: "Todo o período" },
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "30dias", label: "Últimos 30 dias" },
  { value: "data", label: "Data específica" },
];

export default function Auditoria() {
  const [busca, setBusca] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("todos");
  const [filtroMercado, setFiltroMercado] = useState("Todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [filtroLigas, setFiltroLigas] = useState<number[]>([]);
  const [alertaSelecionado, setAlertaSelecionado] = useState<any>(null);
  const [dataEspecifica, setDataEspecifica] = useState("");

  const alertasQuery = trpc.alertas.list.useQuery(undefined, { refetchInterval: 30_000 });
  const utils = trpc.useUtils();

  const updateResultado = trpc.alertas.updateResultado.useMutation({
    onSuccess: () => { utils.alertas.list.invalidate(); toast.success("Resultado atualizado!"); },
    onError: () => toast.error("Erro ao atualizar resultado"),
  });

  const alertas = alertasQuery.data ?? [];

  const alertasFiltrados = useMemo(() => {
    const agora = new Date();
    return alertas.filter(a => {
      const matchBusca = busca === "" || a.jogo.toLowerCase().includes(busca.toLowerCase()) || a.mercado.toLowerCase().includes(busca.toLowerCase());
      const matchResultado = filtroResultado === "todos" || a.resultado === filtroResultado;
      const matchMercado = filtroMercado === "Todos" || a.mercado === filtroMercado;

      let matchPeriodo = true;
      if (filtroPeriodo !== "todos") {
        const data = new Date(a.createdAt);
        const diffMs = agora.getTime() - data.getTime();
        const diffDias = diffMs / (1000 * 60 * 60 * 24);
        if (filtroPeriodo === "hoje") matchPeriodo = diffDias < 1;
        else if (filtroPeriodo === "ontem") matchPeriodo = diffDias >= 1 && diffDias < 2;
        else if (filtroPeriodo === "7dias") matchPeriodo = diffDias <= 7;
        else if (filtroPeriodo === "30dias") matchPeriodo = diffDias <= 30;
        else if (filtroPeriodo === "data" && dataEspecifica) {
          const dAlerta = data.toLocaleDateString("pt-BR");
          const [y, m, d] = dataEspecifica.split("-");
          const dFiltro = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString("pt-BR");
          matchPeriodo = dAlerta === dFiltro;
        }
      }

      // Filtro por liga: como não temos ID da liga no alerta, filtramos por nome
      const matchLiga = filtroLigas.length === 0 || true;

      return matchBusca && matchResultado && matchMercado && matchPeriodo && matchLiga;
    });
  }, [alertas, busca, filtroResultado, filtroMercado, filtroPeriodo, filtroLigas]);

  const greens = alertasFiltrados.filter(a => a.resultado === "green").length;
  const reds = alertasFiltrados.filter(a => a.resultado === "red").length;
  const pendentes = alertasFiltrados.filter(a => !a.resultado || a.resultado === "pendente").length;
  const taxa = (greens + reds) > 0 ? ((greens / (greens + reds)) * 100).toFixed(1) : "0";

  const resultadoConfig: Record<string, { label: string; class: string; icon: any }> = {
    pendente: { label: "Pendente", class: "badge-yellow", icon: Clock },
    green: { label: "Green", class: "badge-green", icon: CheckCircle },
    red: { label: "Red", class: "badge-red", icon: XCircle },
    void: { label: "Void", class: "badge-blue", icon: Target },
  };

  const exportarCSV = () => {
    const header = "Jogo,Liga,Mercado,Odd,EV,Confiança,Resultado,Data";
    const linhas = alertasFiltrados.map(a =>
      `"${a.jogo}","${a.liga ?? ""}","${a.mercado}","${a.odd ?? ""}","${a.ev ?? ""}","${a.confianca ?? ""}","${a.resultado ?? "pendente"}","${new Date(a.createdAt).toLocaleString("pt-BR")}"`
    );
    const csv = [header, ...linhas].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapha-guru-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const limparFiltros = () => {
    setBusca(""); setFiltroResultado("todos"); setFiltroMercado("Todos");
    setFiltroPeriodo("todos"); setFiltroLigas([]); setDataEspecifica("");
  };

  const temFiltros = busca !== "" || filtroResultado !== "todos" || filtroMercado !== "Todos" || filtroPeriodo !== "todos" || filtroLigas.length > 0 || dataEspecifica !== "";

  return (
    <RaphaLayout title="Auditoria de Alertas">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Filtrado", value: alertasFiltrados.length, color: "text-foreground" },
          { label: "Greens", value: greens, color: "text-green-400" },
          { label: "Reds", value: reds, color: "text-red-400" },
          { label: "Taxa de Acerto", value: `${taxa}%`, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="space-y-3 mb-4">
        {/* Linha 1: busca + resultado + período */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por jogo ou mercado..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <Select value={filtroResultado} onValueChange={setFiltroResultado}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os resultados</SelectItem>
              <SelectItem value="pendente">⏳ Pendentes</SelectItem>
              <SelectItem value="green">✅ Greens</SelectItem>
              <SelectItem value="red">❌ Reds</SelectItem>
              <SelectItem value="void">⚪ Void</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPeriodo} onValueChange={(v) => { setFiltroPeriodo(v); if (v !== "data") setDataEspecifica(""); }}>
            <SelectTrigger className="w-full sm:w-44 bg-card border-border">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {filtroPeriodo === "data" && (
            <input
              type="date"
              value={dataEspecifica}
              onChange={e => setDataEspecifica(e.target.value)}
              className="w-full sm:w-40 h-9 px-3 rounded-md bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>

        {/* Linha 2: mercado + ligas + ações */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filtroMercado} onValueChange={setFiltroMercado}>
            <SelectTrigger className="w-full sm:w-52 bg-card border-border">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Mercado" />
            </SelectTrigger>
            <SelectContent>
              {MERCADOS_OPCOES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex-1">
            <FiltroLigas ligasSelecionadas={filtroLigas} onChange={setFiltroLigas} placeholder="Filtrar por liga(s)" />
          </div>
          <div className="flex gap-2">
            {temFiltros && (
              <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
            <Button variant="outline" className="border-border" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            {alertasQuery.isFetching && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground self-center" />}
          </div>
        </div>
      </div>

      {/* Contagem */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {alertasFiltrados.length} alerta(s) encontrado(s)
          {temFiltros && <span className="text-primary ml-1">(filtros ativos)</span>}
        </p>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span className="text-green-400 font-medium">{greens} greens</span>
          <span>·</span>
          <span className="text-red-400 font-medium">{reds} reds</span>
          <span>·</span>
          <span className="text-yellow-400 font-medium">{pendentes} pendentes</span>
        </div>
      </div>

      {/* Lista */}
      {alertasFiltrados.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {alertas.length === 0 ? "Nenhum alerta registrado" : "Nenhum alerta encontrado"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {alertas.length === 0 ? "Os alertas gerados pelos bots aparecerão aqui" : "Tente ajustar os filtros de busca"}
            </p>
            {temFiltros && (
              <Button variant="outline" className="border-border mt-4" onClick={limparFiltros}>
                Limpar todos os filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alertasFiltrados.map(alerta => {
            const res = resultadoConfig[alerta.resultado ?? "pendente"] ?? resultadoConfig["pendente"];
            const ResIcon = res.icon;
            const ligaInfo = getInfoLiga(0, alerta.liga ?? "");
            return (
              <Card key={alerta.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setAlertaSelecionado(alerta)}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{ligaInfo.bandeira}</span>
                    <ResIcon className={`w-4 h-4 flex-shrink-0 ${alerta.resultado === "green" ? "text-green-400" : alerta.resultado === "red" ? "text-red-400" : alerta.resultado === "pendente" || !alerta.resultado ? "text-yellow-400" : "text-blue-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-medium text-foreground text-sm truncate">{alerta.jogo}</span>
                        {alerta.liga && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {ligaInfo.nome !== alerta.liga ? ligaInfo.nome : alerta.liga}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-primary">{alerta.mercado}</span>
                        {alerta.odd && <span>@{Number(alerta.odd).toFixed(2)}</span>}
                        {alerta.ev && <span className="text-green-400">EV+{alerta.ev}%</span>}
                        {alerta.confianca && <span>{alerta.confianca}% conf.</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                    <span className={res.class}>{res.label}</span>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {new Date(alerta.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal detalhes */}
      <Dialog open={!!alertaSelecionado} onOpenChange={() => setAlertaSelecionado(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {alertaSelecionado && (() => {
            const ligaInfo = getInfoLiga(0, alertaSelecionado.liga ?? "");
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-foreground flex items-center gap-2">
                    <span className="text-xl">{ligaInfo.bandeira}</span>
                    {alertaSelecionado.jogo}
                  </DialogTitle>
                  {alertaSelecionado.liga && (
                    <p className="text-sm text-muted-foreground">
                      {ligaInfo.nome !== alertaSelecionado.liga ? `${ligaInfo.nome} · ${ligaInfo.pais}` : alertaSelecionado.liga}
                    </p>
                  )}
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Mercado", value: alertaSelecionado.mercado },
                      { label: "Odd", value: alertaSelecionado.odd ? `@${Number(alertaSelecionado.odd).toFixed(2)}` : "—" },
                      { label: "Expected Value", value: alertaSelecionado.ev ? `+${alertaSelecionado.ev}%` : "—", color: "text-green-400" },
                      { label: "Confiança", value: alertaSelecionado.confianca ? `${alertaSelecionado.confianca}%` : "—", color: "text-primary" },
                    ].map((item, i) => (
                      <div key={i} className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className={`font-semibold text-sm ${item.color ?? "text-foreground"}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {alertaSelecionado.motivos && Array.isArray(alertaSelecionado.motivos) && alertaSelecionado.motivos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Motivos da Análise</p>
                      <div className="space-y-1">
                        {alertaSelecionado.motivos.map((m: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Atualizar Resultado</p>
                    <div className="flex gap-2">
                      {(["green", "red", "void"] as const).map(r => (
                        <Button key={r} size="sm" variant="outline"
                          className={`flex-1 ${r === "green" ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : r === "red" ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-border"}`}
                          onClick={() => { updateResultado.mutate({ id: alertaSelecionado.id, resultado: r }); setAlertaSelecionado(null); }}>
                          {r === "green" ? "✅ Green" : r === "red" ? "❌ Red" : "⚪ Void"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Criado em {new Date(alertaSelecionado.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}
