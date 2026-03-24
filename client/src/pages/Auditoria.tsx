import { useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History, Search, Filter, Target, TrendingUp, CheckCircle, XCircle, Clock, ChevronRight, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Auditoria() {
  const [busca, setBusca] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("todos");
  const [alertaSelecionado, setAlertaSelecionado] = useState<any>(null);

  const alertasQuery = trpc.alertas.list.useQuery();
  const utils = trpc.useUtils();

  const updateResultado = trpc.alertas.updateResultado.useMutation({
    onSuccess: () => { utils.alertas.list.invalidate(); toast.success("Resultado atualizado!"); },
    onError: () => toast.error("Erro ao atualizar resultado"),
  });

  const alertas = alertasQuery.data ?? [];

  const alertasFiltrados = alertas.filter(a => {
    const matchBusca = busca === "" || a.jogo.toLowerCase().includes(busca.toLowerCase()) || a.mercado.toLowerCase().includes(busca.toLowerCase());
    const matchResultado = filtroResultado === "todos" || a.resultado === filtroResultado;
    return matchBusca && matchResultado;
  });

  const greens = alertas.filter(a => a.resultado === "green").length;
  const reds = alertas.filter(a => a.resultado === "red").length;
  const pendentes = alertas.filter(a => a.resultado === "pendente").length;
  const taxa = (greens + reds) > 0 ? ((greens / (greens + reds)) * 100).toFixed(1) : "0";

  const resultadoConfig = {
    pendente: { label: "Pendente", class: "badge-yellow", icon: Clock },
    green: { label: "Green", class: "badge-green", icon: CheckCircle },
    red: { label: "Red", class: "badge-red", icon: XCircle },
    void: { label: "Void", class: "badge-blue", icon: Target },
  };

  return (
    <RaphaLayout title="Auditoria de Alertas">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total de Alertas", value: alertas.length, color: "text-foreground" },
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
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por jogo ou mercado..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filtroResultado} onValueChange={setFiltroResultado}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="green">Greens</SelectItem>
            <SelectItem value="red">Reds</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-border" onClick={() => toast.info("Exportação em desenvolvimento")}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Lista */}
      {alertasFiltrados.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {alertas.length === 0 ? "Nenhum alerta registrado" : "Nenhum alerta encontrado"}
            </h3>
            <p className="text-muted-foreground">
              {alertas.length === 0 ? "Os alertas gerados pelos bots aparecerão aqui" : "Tente ajustar os filtros de busca"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alertasFiltrados.map(alerta => {
            const res = resultadoConfig[alerta.resultado as keyof typeof resultadoConfig];
            const ResIcon = res.icon;
            return (
              <Card key={alerta.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setAlertaSelecionado(alerta)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <ResIcon className={`w-5 h-5 flex-shrink-0 ${alerta.resultado === "green" ? "text-green-400" : alerta.resultado === "red" ? "text-red-400" : alerta.resultado === "pendente" ? "text-yellow-400" : "text-blue-400"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-foreground text-sm truncate">{alerta.jogo}</span>
                        {alerta.liga && <span className="text-xs text-muted-foreground hidden sm:block">• {alerta.liga}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{alerta.mercado}</span>
                        <span>@{alerta.odd}</span>
                        {alerta.ev && <span className="text-green-400">EV+{alerta.ev}%</span>}
                        <span>{alerta.confianca}% conf.</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
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
          {alertaSelecionado && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">{alertaSelecionado.jogo}</DialogTitle>
                {alertaSelecionado.liga && <p className="text-sm text-muted-foreground">{alertaSelecionado.liga}</p>}
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Mercado", value: alertaSelecionado.mercado },
                    { label: "Odd", value: `@${alertaSelecionado.odd}` },
                    { label: "Expected Value", value: alertaSelecionado.ev ? `+${alertaSelecionado.ev}%` : "—", color: "text-green-400" },
                    { label: "Confiança", value: `${alertaSelecionado.confianca}%`, color: "text-primary" },
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
                      <Button key={r} size="sm" variant="outline" className={`flex-1 ${r === "green" ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : r === "red" ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-border"}`}
                        onClick={() => { updateResultado.mutate({ id: alertaSelecionado.id, resultado: r }); setAlertaSelecionado(null); }}>
                        {r === "green" ? "Green ✓" : r === "red" ? "Red ✗" : "Void"}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Criado em {new Date(alertaSelecionado.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}
