import { useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, Target, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Pitacos() {
  const [modalNovo, setModalNovo] = useState(false);
  const [novo, setNovo] = useState({ jogo: "", liga: "", mercado: "", odd: "", analise: "", confianca: 70 });

  const pitacosQuery = trpc.pitacos.list.useQuery();
  const utils = trpc.useUtils();

  const criarPitaco = trpc.pitacos.create.useMutation({
    onSuccess: () => { utils.pitacos.list.invalidate(); setModalNovo(false); toast.success("Pitaco registrado!"); setNovo({ jogo: "", liga: "", mercado: "", odd: "", analise: "", confianca: 70 }); },
    onError: () => toast.error("Erro ao registrar pitaco"),
  });

  const updateResultado = trpc.pitacos.updateResultado.useMutation({
    onSuccess: () => { utils.pitacos.list.invalidate(); toast.success("Resultado atualizado!"); },
    onError: () => toast.error("Erro ao atualizar resultado"),
  });

  const pitacos = pitacosQuery.data ?? [];
  const greens = pitacos.filter(p => p.resultado === "green").length;
  const reds = pitacos.filter(p => p.resultado === "red").length;
  const taxa = (greens + reds) > 0 ? ((greens / (greens + reds)) * 100).toFixed(1) : "0";

  return (
    <RaphaLayout title="Pitacos">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: pitacos.length, color: "text-foreground" },
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

      <div className="flex justify-end mb-4">
        <Button className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pitaco
        </Button>
      </div>

      {pitacos.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum pitaco ainda</h3>
            <p className="text-muted-foreground mb-6">Registre suas análises manuais de apostas</p>
            <Button className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Pitaco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pitacos.map(pitaco => (
            <Card key={pitaco.id} className="bg-card border-border hover:border-primary/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{pitaco.jogo}</h3>
                    {pitaco.liga && <p className="text-xs text-muted-foreground">{pitaco.liga}</p>}
                  </div>
                  <span className={pitaco.resultado === "green" ? "badge-green" : pitaco.resultado === "red" ? "badge-red" : pitaco.resultado === "void" ? "badge-blue" : "badge-yellow"}>
                    {pitaco.resultado === "green" ? "Green ✓" : pitaco.resultado === "red" ? "Red ✗" : pitaco.resultado === "void" ? "Void" : "Pendente"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge-blue">{pitaco.mercado}</span>
                  <span className="text-sm text-foreground font-medium">@{pitaco.odd}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pitaco.confianca}%` }} />
                    </div>
                    <span className="text-xs text-primary font-bold">{pitaco.confianca}%</span>
                  </div>
                </div>
                {pitaco.analise && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pitaco.analise}</p>
                )}
                {pitaco.resultado === "pendente" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs" onClick={() => updateResultado.mutate({ id: pitaco.id, resultado: "green" })}>Green ✓</Button>
                    <Button size="sm" variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs" onClick={() => updateResultado.mutate({ id: pitaco.id, resultado: "red" })}>Red ✗</Button>
                    <Button size="sm" variant="outline" className="flex-1 border-border text-xs" onClick={() => updateResultado.mutate({ id: pitaco.id, resultado: "void" })}>Void</Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">{new Date(pitaco.createdAt).toLocaleDateString("pt-BR")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Pitaco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Jogo *</Label>
                <Input value={novo.jogo} onChange={e => setNovo(p => ({ ...p, jogo: e.target.value }))} placeholder="Time A vs Time B" className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground">Liga</Label>
                <Input value={novo.liga} onChange={e => setNovo(p => ({ ...p, liga: e.target.value }))} placeholder="Brasileirão" className="bg-input border-border mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Mercado *</Label>
                <Input value={novo.mercado} onChange={e => setNovo(p => ({ ...p, mercado: e.target.value }))} placeholder="Over 2.5" className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground">Odd *</Label>
                <Input value={novo.odd} onChange={e => setNovo(p => ({ ...p, odd: e.target.value }))} placeholder="1.85" className="bg-input border-border mt-1" type="number" step="0.01" />
              </div>
            </div>
            <div>
              <Label className="text-foreground">Confiança: {novo.confianca}%</Label>
              <Slider value={[novo.confianca]} onValueChange={([v]) => setNovo(p => ({ ...p, confianca: v }))} min={1} max={99} step={1} className="mt-2" />
            </div>
            <div>
              <Label className="text-foreground">Análise</Label>
              <Textarea value={novo.analise} onChange={e => setNovo(p => ({ ...p, analise: e.target.value }))} placeholder="Descreva sua análise..." className="bg-input border-border mt-1 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => criarPitaco.mutate(novo)} disabled={!novo.jogo || !novo.mercado || !novo.odd || criarPitaco.isPending}>
              {criarPitaco.isPending ? "Salvando..." : "Registrar Pitaco"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}
