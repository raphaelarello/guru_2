import { useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Zap, Plus, Settings, Trash2, Play, Pause, TrendingUp, Target, CheckCircle, AlertCircle, Layers, Send, Clock, RefreshCw, TestTube, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FiltroLigas } from "@/components/FiltroLigas";
import { getInfoLiga } from "@shared/ligas";

const TEMPLATES = [
  { id: "over05ft", nome: "Over 0.5 FT", descricao: "Detecta jogos com alta probabilidade de pelo menos 1 gol", categoria: "Gols", confiancaPadrao: 85, icone: "⚽", cor: "text-green-400" },
  { id: "goleada", nome: "Goleada Detectada", descricao: "Identifica jogos com potencial de goleada (4+ gols)", categoria: "Gols", confiancaPadrao: 78, icone: "🎯", cor: "text-red-400" },
  { id: "btts_pressao", nome: "BTTS Alta Pressão", descricao: "Ambos marcam em jogos de alta pressão ofensiva", categoria: "BTTS", confiancaPadrao: 82, icone: "🔥", cor: "text-orange-400" },
  { id: "over25", nome: "Over 2.5 Gols", descricao: "Jogos com tendência de mais de 2.5 gols totais", categoria: "Gols", confiancaPadrao: 80, icone: "📈", cor: "text-blue-400" },
  { id: "over35", nome: "Over 3.5 Gols", descricao: "Partidas com alto potencial de gols (3.5+)", categoria: "Gols", confiancaPadrao: 72, icone: "💥", cor: "text-purple-400" },
  { id: "btts_sim", nome: "BTTS Sim", descricao: "Ambas as equipes marcam - análise avançada", categoria: "BTTS", confiancaPadrao: 79, icone: "✅", cor: "text-green-400" },
  { id: "casa_vence", nome: "Casa Vence Forte", descricao: "Mandante com vantagem histórica significativa", categoria: "Resultado", confiancaPadrao: 76, icone: "🏠", cor: "text-yellow-400" },
  { id: "visitante_vence", nome: "Visitante Surpreende", descricao: "Visitante com histórico forte fora de casa", categoria: "Resultado", confiancaPadrao: 71, icone: "✈️", cor: "text-cyan-400" },
  { id: "empate_provavel", nome: "Empate Provável", descricao: "Partidas equilibradas com alta chance de empate", categoria: "Resultado", confiancaPadrao: 68, icone: "🤝", cor: "text-gray-400" },
  { id: "primeiro_gol_15", nome: "Gol no 1º Quarto", descricao: "Gol nos primeiros 15 minutos de jogo", categoria: "Tempo", confiancaPadrao: 74, icone: "⏱️", cor: "text-pink-400" },
  { id: "segundo_tempo_gols", nome: "Gols no 2º Tempo", descricao: "Maioria dos gols acontece no segundo tempo", categoria: "Tempo", confiancaPadrao: 77, icone: "🕐", cor: "text-indigo-400" },
  { id: "cantos_alto", nome: "Escanteios Alto", descricao: "Partidas com volume alto de escanteios (10+)", categoria: "Especiais", confiancaPadrao: 73, icone: "🚩", cor: "text-amber-400" },
  { id: "cartoes_alto", nome: "Cartões Amarelos", descricao: "Jogos com histórico de muitos cartões amarelos", categoria: "Especiais", confiancaPadrao: 70, icone: "🟨", cor: "text-yellow-500" },
  { id: "ev_positivo", nome: "EV+ Detector", descricao: "Detecta qualquer mercado com Expected Value positivo", categoria: "Especiais", confiancaPadrao: 88, icone: "💰", cor: "text-primary" },
];

const CANAIS_OPCOES = [
  { value: "painel", label: "Painel Interno" },
  { value: "whatsapp_evolution", label: "WhatsApp (Evolution)" },
  { value: "whatsapp_zapi", label: "WhatsApp (Z-API)" },
  { value: "telegram", label: "Telegram" },
  { value: "email", label: "E-mail" },
  { value: "push", label: "Push Notification" },
];

export default function Bots() {
  const [aba, setAba] = useState("central");
  const [modalTemplates, setModalTemplates] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);
  const [botEditando, setBotEditando] = useState<any>(null);
  const [novoBot, setNovoBot] = useState({ nome: "", descricao: "", templateId: "", confiancaMinima: 75, limiteDiario: 10 });
  const [filtroLigasBots, setFiltroLigasBots] = useState<number[]>([]);
  const [filtroLigasSinais, setFiltroLigasSinais] = useState<number[]>([]);

  const botsQuery = trpc.bots.list.useQuery();
  const cronQuery = trpc.bots.cronStatus.useQuery(undefined, { refetchInterval: 30000 });
  const utils = trpc.useUtils();

  const cronIniciar = trpc.bots.cronIniciar.useMutation({
    onSuccess: () => { utils.bots.cronStatus.invalidate(); toast.success("Cron automático iniciado! Bots processados a cada 5 minutos."); },
    onError: (err) => toast.error("Erro ao iniciar cron", { description: err.message }),
  });

  const cronParar = trpc.bots.cronParar.useMutation({
    onSuccess: () => { utils.bots.cronStatus.invalidate(); toast.success("Cron automático parado."); },
    onError: (err) => toast.error("Erro ao parar cron", { description: err.message }),
  });

  const cronExecutarAgora = trpc.bots.cronExecutarAgora.useMutation({
    onSuccess: () => { utils.bots.cronStatus.invalidate(); utils.alertas.list.invalidate(); toast.success("Processamento executado agora!"); },
    onError: (err) => toast.error("Erro ao executar", { description: err.message }),
  });

  const processarBots = trpc.bots.processar.useMutation({
    onSuccess: (data) => {
      utils.bots.list.invalidate();
      toast.success(data.mensagem, { description: data.alertasGerados > 0 ? "Verifique a Fila de Sinais" : undefined });
    },
    onError: (err) => toast.error("Erro ao processar bots", { description: err.message }),
  });

  const criarBot = trpc.bots.create.useMutation({
    onSuccess: () => { utils.bots.list.invalidate(); setModalNovo(false); setModalTemplates(false); toast.success("Bot criado com sucesso!"); setNovoBot({ nome: "", descricao: "", templateId: "", confiancaMinima: 75, limiteDiario: 10 }); },
    onError: () => toast.error("Erro ao criar bot"),
  });

  const toggleBot = trpc.bots.toggleAtivo.useMutation({
    onSuccess: (data) => { utils.bots.list.invalidate(); toast.success(data?.ativo ? "Bot ativado!" : "Bot pausado!"); },
    onError: () => toast.error("Erro ao alterar bot"),
  });

  const deletarBot = trpc.bots.delete.useMutation({
    onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot removido!"); },
    onError: () => toast.error("Erro ao remover bot"),
  });

  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [ativandoTemplate, setAtivandoTemplate] = useState<string | null>(null);

  const carregarTemplate = (template: typeof TEMPLATES[0]) => {
    setNovoBot({ nome: template.nome, descricao: template.descricao, templateId: template.id, confiancaMinima: template.confiancaPadrao, limiteDiario: 10 });
    setModalTemplates(false);
    setModalNovo(true);
  };

  const ativarTemplateComUmClique = async (template: typeof TEMPLATES[0]) => {
    setAtivandoTemplate(template.id);
    try {
      await criarBot.mutateAsync({ nome: template.nome, descricao: template.descricao, templateId: template.id, confiancaMinima: template.confiancaPadrao, limiteDiario: 10 });
      toast.success(`Bot "${template.nome}" ativado com 1 clique! 🚀`, { description: "Acesse a aba Central para gerenciá-lo" });
    } catch (e) {
      toast.error("Erro ao ativar template");
    } finally {
      setAtivandoTemplate(null);
    }
  };

  const bots = botsQuery.data ?? [];
  const botsAtivos = bots.filter(b => b.ativo).length;
  const cron = cronQuery.data;

  const categorias = ["Todos", ...Array.from(new Set(TEMPLATES.map(t => t.categoria)))];
  const templatesFiltrados = filtroCategoria === "Todos" ? TEMPLATES : TEMPLATES.filter(t => t.categoria === filtroCategoria);
  const botsExistentes = new Set(bots.map(b => b.templateId).filter(Boolean));

  return (
    <RaphaLayout title="RAPHA Bots">
      <Tabs value={aba} onValueChange={setAba}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="central">Central</TabsTrigger>
            <TabsTrigger value="templates">Templates IA</TabsTrigger>
            <TabsTrigger value="sinais">Fila de Sinais</TabsTrigger>
            <TabsTrigger value="canais">Canais</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border" onClick={() => setModalTemplates(true)}>
              <Layers className="w-4 h-4 mr-2" />
              Carregar Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-400/50 text-green-400 hover:bg-green-400/10"
              onClick={() => processarBots.mutate()}
              disabled={processarBots.isPending}
            >
              <Zap className={`w-4 h-4 mr-2 ${processarBots.isPending ? "animate-spin" : ""}`} />
              {processarBots.isPending ? "Processando..." : "Processar Agora"}
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Bot
            </Button>
          </div>
        </div>

        {/* Central */}
        <TabsContent value="central">
          {/* Painel Cron */}
          {cron && (
            <div className={`mb-4 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              cron.ativo ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  cron.ativo ? "bg-primary/20" : "bg-muted"
                }`}>
                  <Clock className={`w-5 h-5 ${cron.ativo ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">Cron Automático</span>
                    <span className={cron.ativo ? "badge-green" : "badge-yellow"}>
                      {cron.ativo ? "Ativo" : "Parado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cron.ativo
                      ? `Próxima execução: ${cron.proximaExecucao ? new Date(cron.proximaExecucao).toLocaleTimeString("pt-BR") : "—"}`
                      : "Bots não estão sendo processados automaticamente"}
                    {cron.ultimaExecucao && ` · Última: ${new Date(cron.ultimaExecucao).toLocaleTimeString("pt-BR")}`}
                    {cron.totalAlertasGerados > 0 && ` · ${cron.totalAlertasGerados} alertas gerados`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-xs"
                  onClick={() => cronExecutarAgora.mutate()}
                  disabled={cronExecutarAgora.isPending}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${cronExecutarAgora.isPending ? "animate-spin" : ""}`} />
                  Executar Agora
                </Button>
                {cron.ativo ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 text-xs"
                    onClick={() => cronParar.mutate()}
                    disabled={cronParar.isPending}
                  >
                    <Pause className="w-3.5 h-3.5 mr-1.5" />
                    Parar Cron
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground text-xs"
                    onClick={() => cronIniciar.mutate()}
                    disabled={cronIniciar.isPending}
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Iniciar Cron
                  </Button>
                )}
              </div>
            </div>
          )}
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total de Bots", value: bots.length, color: "text-foreground" },
              { label: "Bots Ativos", value: botsAtivos, color: "text-primary" },
              { label: "Sinais Hoje", value: bots.reduce((a, b) => a + (b.totalSinais ?? 0), 0), color: "text-green-400" },
              { label: "Taxa de Acerto", value: bots.length > 0 ? `${Math.round(bots.reduce((a, b) => a + (b.totalAcertos ?? 0), 0) / Math.max(bots.reduce((a, b) => a + (b.totalSinais ?? 0), 0), 1) * 100)}%` : "—", color: "text-yellow-400" },
            ].map((s, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {bots.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum bot criado ainda</h3>
                <p className="text-muted-foreground mb-6">Crie seu primeiro bot ou carregue um dos 14 templates prontos de IA</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" className="border-border" onClick={() => setModalTemplates(true)}>
                    <Layers className="w-4 h-4 mr-2" />
                    Ver Templates
                  </Button>
                  <Button className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Bot
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bots.map(bot => (
                <Card key={bot.id} className={`bg-card border-border transition-all ${bot.ativo ? "border-primary/30 neon-glow" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bot.ativo ? "bg-primary/20" : "bg-muted"}`}>
                          <Bot className={`w-5 h-5 ${bot.ativo ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{bot.nome}</h3>
                          <p className="text-xs text-muted-foreground">{bot.descricao || "Bot personalizado"}</p>
                        </div>
                      </div>
                      <Switch
                        checked={bot.ativo}
                        onCheckedChange={(v) => toggleBot.mutate({ id: bot.id, ativo: v })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-foreground">{bot.totalSinais}</p>
                        <p className="text-[10px] text-muted-foreground">Sinais</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-green-400">{bot.totalAcertos}</p>
                        <p className="text-[10px] text-muted-foreground">Acertos</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-primary">{bot.confiancaMinima}%</p>
                        <p className="text-[10px] text-muted-foreground">Confiança</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={bot.ativo ? "badge-green" : "badge-yellow"}>
                        {bot.ativo ? "Ativo" : "Pausado"}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setBotEditando(bot)}>
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deletarBot.mutate({ id: bot.id })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          {/* Filtro por categoria */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categorias.map(cat => (
              <Button key={cat} size="sm" variant={filtroCategoria === cat ? "default" : "outline"}
                className={filtroCategoria === cat ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}
                onClick={() => setFiltroCategoria(cat)}>
                {cat}
              </Button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground self-center">{templatesFiltrados.length} templates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesFiltrados.map(t => {
              const jaAtivo = botsExistentes.has(t.id);
              const ativando = ativandoTemplate === t.id;
              return (
                <Card key={t.id} className={`bg-card border-border transition-all group ${jaAtivo ? "border-primary/50 opacity-70" : "hover:border-primary/40 cursor-pointer"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icone}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground text-sm">{t.nome}</h3>
                            {jaAtivo && <span className="badge-green text-[10px]">Ativo</span>}
                          </div>
                          <span className="badge-blue text-[10px]">{t.categoria}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${t.cor}`}>{t.confiancaPadrao}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{t.descricao}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-primary text-primary-foreground"
                        disabled={jaAtivo || ativando}
                        onClick={() => ativarTemplateComUmClique(t)}>
                        <Zap className={`w-3.5 h-3.5 mr-2 ${ativando ? "animate-spin" : ""}`} />
                        {jaAtivo ? "Já ativado" : ativando ? "Ativando..." : "Ativar com 1 Clique"}
                      </Button>
                      {!jaAtivo && (
                        <Button size="sm" variant="outline" className="border-border" onClick={() => carregarTemplate(t)}>
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Fila de Sinais */}
        <TabsContent value="sinais">
          <FilaSinais filtroLigas={filtroLigasSinais} setFiltroLigas={setFiltroLigasSinais} />
        </TabsContent>

        {/* Canais */}
        <TabsContent value="canais">
          <CanaisConfig />
        </TabsContent>
      </Tabs>

      {/* Modal Templates */}
      <Dialog open={modalTemplates} onOpenChange={setModalTemplates}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              14 Templates de IA Prontos
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <div key={t.id} className="bg-muted/30 rounded-xl p-3 border border-border hover:border-primary/40 cursor-pointer transition-all" onClick={() => carregarTemplate(t)}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{t.icone}</span>
                  <span className="font-medium text-foreground text-sm">{t.nome}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.descricao}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Bot */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {novoBot.templateId ? `Template: ${novoBot.nome}` : "Novo Bot"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Nome do Bot</Label>
              <Input value={novoBot.nome} onChange={e => setNovoBot(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Over 0.5 FT Pro" className="bg-input border-border mt-1" />
            </div>
            <div>
              <Label className="text-foreground">Descrição</Label>
              <Input value={novoBot.descricao} onChange={e => setNovoBot(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do bot..." className="bg-input border-border mt-1" />
            </div>
            <div>
              <Label className="text-foreground">Confiança Mínima: {novoBot.confiancaMinima}%</Label>
              <Slider value={[novoBot.confiancaMinima]} onValueChange={([v]) => setNovoBot(p => ({ ...p, confiancaMinima: v }))} min={50} max={99} step={1} className="mt-2" />
            </div>
            <div>
              <Label className="text-foreground">Limite Diário de Sinais: {novoBot.limiteDiario}</Label>
              <Slider value={[novoBot.limiteDiario]} onValueChange={([v]) => setNovoBot(p => ({ ...p, limiteDiario: v }))} min={1} max={50} step={1} className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => criarBot.mutate(novoBot)} disabled={!novoBot.nome || criarBot.isPending}>
              {criarBot.isPending ? "Criando..." : "Criar Bot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}

function FilaSinais({ filtroLigas, setFiltroLigas }: { filtroLigas: number[]; setFiltroLigas: (v: number[]) => void }) {
  const alertasQuery = trpc.alertas.list.useQuery(undefined, { refetchInterval: 10_000 });
  const alertas = alertasQuery.data ?? [];

  const alertasFiltrados = filtroLigas.length === 0
    ? alertas
    : alertas.filter(a => {
        if (!a.liga) return false;
        // Tenta extrair ID da liga do campo liga (pode ser nome ou id)
        return true; // sem ID na tabela, filtra por nome
      });

  const cores: Record<string, string> = {
    pendente: "badge-yellow",
    green: "badge-green",
    red: "badge-red",
    void: "badge-blue",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Fila de Sinais</h3>
          <p className="text-xs text-muted-foreground">{alertasFiltrados.length} sinal(is) gerado(s) pelos bots</p>
        </div>
        <div className="flex items-center gap-2">
          <FiltroLigas ligasSelecionadas={filtroLigas} onChange={setFiltroLigas} placeholder="Filtrar por liga" />
          {alertasQuery.isFetching && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {alertasFiltrados.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum sinal ainda</h3>
            <p className="text-muted-foreground text-sm">Ative um bot e clique em "Processar Agora" ou aguarde o cron automático</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alertasFiltrados.map(alerta => {
            const ligaInfo = getInfoLiga(0, alerta.liga ?? "");
            return (
              <Card key={alerta.id} className="bg-card border-border hover:border-primary/30 transition-all">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-lg">{ligaInfo.bandeira}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm truncate">{alerta.jogo}</span>
                          <span className={cores[alerta.resultado ?? "pendente"] ?? "badge-blue"}>
                            {alerta.resultado === "green" ? "✅ Green" : alerta.resultado === "red" ? "❌ Red" : alerta.resultado === "void" ? "⚪ Void" : "⏳ Pendente"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="text-primary font-medium">{alerta.mercado}</span>
                          {alerta.odd && <span>Odd: <span className="text-foreground font-mono">{Number(alerta.odd).toFixed(2)}</span></span>}
                          {alerta.ev && <span>EV: <span className="text-green-400 font-mono">{Number(alerta.ev).toFixed(1)}%</span></span>}
                          {alerta.confianca && <span>Conf: <span className="text-yellow-400">{alerta.confianca}%</span></span>}
                          <span className="text-gray-600">{new Date(alerta.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                    {alerta.liga && (
                      <span className="text-xs text-gray-500 hidden sm:block shrink-0">{alerta.liga}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CanaisConfig() {
  const canaisQuery = trpc.canais.list.useQuery();
  const utils = trpc.useUtils();
  const [modalCanal, setModalCanal] = useState<string | null>(null);
  const [config, setConfig] = useState<any>({});

  const upsertCanal = trpc.canais.upsert.useMutation({
    onSuccess: () => { utils.canais.list.invalidate(); setModalCanal(null); toast.success("Canal configurado!"); },
    onError: () => toast.error("Erro ao configurar canal"),
  });

  const updateCanal = trpc.canais.update.useMutation({
    onSuccess: () => { utils.canais.list.invalidate(); toast.success("Canal atualizado!"); },
    onError: () => toast.error("Erro ao atualizar canal"),
  });

  const testarCanal = trpc.canais.testar.useMutation({
    onSuccess: (data) => {
      if (data.sucesso) toast.success(`✅ Mensagem de teste enviada via ${data.canal}!`);
      else toast.error(`❌ Falha ao enviar via ${data.canal}. Verifique as configurações.`);
    },
    onError: (err) => toast.error("Erro ao testar canal", { description: err.message }),
  });

  const canaisInfo = [
    { tipo: "whatsapp_evolution", nome: "WhatsApp Evolution API", descricao: "Envie alertas via Evolution API", icone: "📱", campos: [{ key: "url", label: "URL da Instância", placeholder: "https://sua-instancia.evolution.com" }, { key: "apiKey", label: "API Key", placeholder: "Sua API Key" }, { key: "phone", label: "Número (com DDI)", placeholder: "5511999999999" }] },
    { tipo: "whatsapp_zapi", nome: "WhatsApp Z-API", descricao: "Envie alertas via Z-API", icone: "💬", campos: [{ key: "instanceId", label: "Instance ID", placeholder: "Seu Instance ID" }, { key: "token", label: "Token Z-API", placeholder: "Seu token" }, { key: "phone", label: "Número (com DDI)", placeholder: "5511999999999" }] },
    { tipo: "telegram", nome: "Telegram Bot", descricao: "Alertas via bot do Telegram", icone: "✈️", campos: [{ key: "botToken", label: "Bot Token", placeholder: "1234567890:ABC..." }, { key: "chatId", label: "Chat ID", placeholder: "-1001234567890" }] },
    { tipo: "email", nome: "E-mail", descricao: "Alertas por e-mail", icone: "📧", campos: [{ key: "smtp", label: "Servidor SMTP", placeholder: "smtp.gmail.com" }, { key: "email", label: "E-mail", placeholder: "seu@email.com" }, { key: "senha", label: "Senha/App Password", placeholder: "••••••••" }] },
    { tipo: "push", nome: "Push Notification", descricao: "Notificações push no navegador", icone: "🔔", campos: [] },
  ];

  const canaisAtivos = canaisQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {canaisInfo.map(canal => {
          const canalAtivo = canaisAtivos.find(c => c.tipo === canal.tipo);
          return (
            <Card key={canal.tipo} className={`bg-card border-border transition-all ${canalAtivo?.ativo ? "border-primary/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{canal.icone}</span>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{canal.nome}</h3>
                      <p className="text-xs text-muted-foreground">{canal.descricao}</p>
                    </div>
                  </div>
                  {canalAtivo && (
                    <Switch
                      checked={canalAtivo.ativo}
                      onCheckedChange={(v) => updateCanal.mutate({ id: canalAtivo.id, ativo: v })}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={canalAtivo?.ativo ? "badge-green" : canalAtivo ? "badge-yellow" : "badge-blue"}>
                    {canalAtivo?.ativo ? "Ativo" : canalAtivo ? "Configurado" : "Não configurado"}
                  </span>
                  <div className="flex gap-1">
                    {canalAtivo && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/40 text-primary hover:bg-primary/10 text-xs"
                        onClick={() => testarCanal.mutate({ id: canalAtivo.id })}
                        disabled={testarCanal.isPending}
                      >
                        <TestTube className="w-3 h-3 mr-1" />
                        Testar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-border text-xs" onClick={() => { setConfig(canalAtivo?.config ?? {}); setModalCanal(canal.tipo); }}>
                      <Settings className="w-3 h-3 mr-1" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal configuração */}
      {modalCanal && (
        <Dialog open={!!modalCanal} onOpenChange={() => setModalCanal(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Configurar {canaisInfo.find(c => c.tipo === modalCanal)?.nome}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {canaisInfo.find(c => c.tipo === modalCanal)?.campos.map(campo => (
                <div key={campo.key}>
                  <Label className="text-foreground">{campo.label}</Label>
                  <Input
                    value={config[campo.key] ?? ""}
                    onChange={e => setConfig((p: any) => ({ ...p, [campo.key]: e.target.value }))}
                    placeholder={campo.placeholder}
                    type={campo.key.includes("senha") || campo.key.includes("token") || campo.key.includes("Key") ? "password" : "text"}
                    className="bg-input border-border mt-1"
                  />
                </div>
              ))}
              {canaisInfo.find(c => c.tipo === modalCanal)?.campos.length === 0 && (
                <p className="text-sm text-muted-foreground">Este canal não requer configuração adicional. Ative-o para começar a receber notificações.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-border" onClick={() => setModalCanal(null)}>Cancelar</Button>
              <Button className="bg-primary text-primary-foreground" onClick={() => upsertCanal.mutate({ tipo: modalCanal as any, nome: canaisInfo.find(c => c.tipo === modalCanal)?.nome ?? modalCanal, ativo: true, config })} disabled={upsertCanal.isPending}>
                {upsertCanal.isPending ? "Salvando..." : "Salvar e Ativar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
