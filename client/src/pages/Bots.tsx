import { useState, useMemo } from "react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, Zap, Plus, Settings, Trash2, Play, Pause, TrendingUp, Target, Clock, RefreshCw, Layers, Send, Filter, Star, Trophy, Flame, Timer, BarChart3, Shield, AlertTriangle, ChevronDown, ChevronUp, Info, Search, Download, X, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FiltroLigas } from "@/components/FiltroLigas";

// ─── 35+ Templates Premium ───────────────────────────────────────────────────
const TEMPLATES = [
  // GOLS
  { id: "over05ft", nome: "Acima 0.5 Gols FT", descricao: "Alta probabilidade de pelo menos 1 gol na partida", categoria: "Gols", confiancaPadrao: 85, icone: "⚽", cor: "text-green-400", tags: ["popular", "seguro"] },
  { id: "over15ft", nome: "Acima 1.5 Gols FT", descricao: "Pelo menos 2 gols esperados na partida", categoria: "Gols", confiancaPadrao: 80, icone: "⚽", cor: "text-green-400", tags: ["popular"] },
  { id: "over25ft", nome: "Acima 2.5 Gols FT", descricao: "Jogos com tendência de mais de 2.5 gols totais", categoria: "Gols", confiancaPadrao: 78, icone: "📈", cor: "text-blue-400", tags: ["popular"] },
  { id: "over35ft", nome: "Acima 3.5 Gols FT", descricao: "Partidas com alto potencial de gols (3.5+)", categoria: "Gols", confiancaPadrao: 72, icone: "💥", cor: "text-purple-400", tags: [] },
  { id: "over45ft", nome: "Acima 4.5 Gols FT", descricao: "Goleadas esperadas — 5 ou mais gols", categoria: "Gols", confiancaPadrao: 65, icone: "🚀", cor: "text-red-400", tags: ["alto-risco"] },
  { id: "goleada", nome: "Goleada Detectada", descricao: "Identifica jogos com potencial de goleada (4+ gols)", categoria: "Gols", confiancaPadrao: 78, icone: "🎯", cor: "text-red-400", tags: ["alto-risco"] },
  { id: "over05_1t", nome: "Acima 0.5 Gols 1ºT", descricao: "Gol no primeiro tempo — análise de pressão inicial", categoria: "Gols", confiancaPadrao: 76, icone: "⏰", cor: "text-yellow-400", tags: [] },
  { id: "over15_1t", nome: "Acima 1.5 Gols 1ºT", descricao: "Dois ou mais gols no primeiro tempo", categoria: "Gols", confiancaPadrao: 68, icone: "⏰", cor: "text-yellow-400", tags: [] },
  { id: "over05_2t", nome: "Acima 0.5 Gols 2ºT", descricao: "Pelo menos um gol no segundo tempo", categoria: "Gols", confiancaPadrao: 79, icone: "🕐", cor: "text-indigo-400", tags: [] },
  { id: "over15_2t", nome: "Acima 1.5 Gols 2ºT", descricao: "Dois ou mais gols no segundo tempo", categoria: "Gols", confiancaPadrao: 70, icone: "🕐", cor: "text-indigo-400", tags: [] },

  // TEMPO DE GOL
  { id: "gol_5min", nome: "Gol nos 1-5 Minutos", descricao: "Gol logo no início — times que pressionam forte", categoria: "Tempo de Gol", confiancaPadrao: 62, icone: "⚡", cor: "text-yellow-300", tags: ["alto-risco"] },
  { id: "gol_10min", nome: "Gol até 10 Minutos", descricao: "Gol nos primeiros 10 minutos de jogo", categoria: "Tempo de Gol", confiancaPadrao: 68, icone: "⚡", cor: "text-yellow-400", tags: [] },
  { id: "gol_15min", nome: "Gol até 15 Minutos", descricao: "Gol nos primeiros 15 minutos de jogo", categoria: "Tempo de Gol", confiancaPadrao: 74, icone: "⏱️", cor: "text-pink-400", tags: ["popular"] },
  { id: "gol_20min", nome: "Gol até 20 Minutos", descricao: "Gol nos primeiros 20 minutos de jogo", categoria: "Tempo de Gol", confiancaPadrao: 78, icone: "⏱️", cor: "text-pink-400", tags: [] },
  { id: "gol_30min", nome: "Gol até 30 Minutos", descricao: "Gol na primeira meia hora de jogo", categoria: "Tempo de Gol", confiancaPadrao: 82, icone: "⏱️", cor: "text-orange-400", tags: [] },
  { id: "gol_ultimo_10", nome: "Gol nos Últimos 10 Min", descricao: "Gol nos últimos 10 minutos — pressão final", categoria: "Tempo de Gol", confiancaPadrao: 71, icone: "🔔", cor: "text-red-300", tags: [] },
  { id: "gol_ultimo_15", nome: "Gol nos Últimos 15 Min", descricao: "Gol nos últimos 15 minutos de jogo", categoria: "Tempo de Gol", confiancaPadrao: 75, icone: "🔔", cor: "text-red-400", tags: [] },
  { id: "gol_segundo_tempo", nome: "Gols no 2º Tempo", descricao: "Maioria dos gols acontece no segundo tempo", categoria: "Tempo de Gol", confiancaPadrao: 77, icone: "🕐", cor: "text-indigo-400", tags: [] },

  // BTTS
  { id: "btts_sim", nome: "Ambas Marcam - Sim", descricao: "Ambas as equipes marcam — análise avançada", categoria: "BTTS", confiancaPadrao: 79, icone: "✅", cor: "text-green-400", tags: ["popular"] },
  { id: "btts_pressao", nome: "BTTS Alta Pressão", descricao: "Ambos marcam em jogos de alta pressão ofensiva", categoria: "BTTS", confiancaPadrao: 82, icone: "🔥", cor: "text-orange-400", tags: ["popular"] },
  { id: "btts_over25", nome: "BTTS + Acima 2.5", descricao: "Ambos marcam E mais de 2.5 gols — mercado combinado", categoria: "BTTS", confiancaPadrao: 74, icone: "🎰", cor: "text-amber-400", tags: [] },
  { id: "btts_1t", nome: "Ambas Marcam 1ºT", descricao: "Ambas as equipes marcam no primeiro tempo", categoria: "BTTS", confiancaPadrao: 65, icone: "✅", cor: "text-green-300", tags: ["alto-risco"] },

  // RESULTADO
  { id: "casa_vence", nome: "Mandante Vence", descricao: "Mandante com vantagem histórica significativa", categoria: "Resultado", confiancaPadrao: 76, icone: "🏠", cor: "text-yellow-400", tags: ["popular"] },
  { id: "visitante_vence", nome: "Visitante Vence", descricao: "Visitante com histórico forte fora de casa", categoria: "Resultado", confiancaPadrao: 71, icone: "✈️", cor: "text-cyan-400", tags: [] },
  { id: "empate_provavel", nome: "Empate Provável", descricao: "Partidas equilibradas com alta chance de empate", categoria: "Resultado", confiancaPadrao: 68, icone: "🤝", cor: "text-gray-400", tags: [] },
  { id: "virada_detectada", nome: "Virada em Andamento", descricao: "Time perdendo mas com pressão intensa — virada provável", categoria: "Resultado", confiancaPadrao: 67, icone: "🔄", cor: "text-purple-400", tags: ["ao-vivo"] },
  { id: "favorito_perdendo", nome: "Favorito Perdendo", descricao: "Time favorito perdendo — value bet na reação", categoria: "Resultado", confiancaPadrao: 69, icone: "💎", cor: "text-blue-300", tags: ["value", "ao-vivo"] },
  { id: "jogo_6_pontos", nome: "Jogo de 6 Pontos", descricao: "Ambos precisam vencer — pressão máxima", categoria: "Resultado", confiancaPadrao: 72, icone: "🏆", cor: "text-gold-400", tags: [] },

  // PLACAR EXATO
  { id: "placar_0x0", nome: "Placar Exato 0-0", descricao: "Jogo sem gols — defesas sólidas", categoria: "Placar Exato", confiancaPadrao: 58, icone: "🔒", cor: "text-gray-400", tags: ["alto-risco"] },
  { id: "placar_1x0", nome: "Placar Exato 1-0", descricao: "Vitória mínima do mandante", categoria: "Placar Exato", confiancaPadrao: 62, icone: "1️⃣", cor: "text-yellow-400", tags: ["alto-risco"] },
  { id: "placar_1x1", nome: "Placar Exato 1-1", descricao: "Empate com gols — partida equilibrada", categoria: "Placar Exato", confiancaPadrao: 60, icone: "⚖️", cor: "text-gray-300", tags: ["alto-risco"] },
  { id: "placar_2x0", nome: "Placar Exato 2-0", descricao: "Vitória confortável do mandante", categoria: "Placar Exato", confiancaPadrao: 58, icone: "2️⃣", cor: "text-green-300", tags: ["alto-risco"] },
  { id: "placar_2x1", nome: "Placar Exato 2-1", descricao: "Vitória com gol do visitante", categoria: "Placar Exato", confiancaPadrao: 55, icone: "2️⃣", cor: "text-blue-300", tags: ["alto-risco"] },

  // ESPECIAIS
  { id: "escanteios_8", nome: "Escanteios Acima 8.5", descricao: "Partidas com volume alto de escanteios (9+)", categoria: "Especiais", confiancaPadrao: 73, icone: "🚩", cor: "text-amber-400", tags: [] },
  { id: "escanteios_10", nome: "Escanteios Acima 10.5", descricao: "Jogos com muitos escanteios (11+)", categoria: "Especiais", confiancaPadrao: 68, icone: "🚩", cor: "text-amber-500", tags: [] },
  { id: "escanteios_12", nome: "Escanteios Acima 12.5", descricao: "Volume extremo de escanteios (13+)", categoria: "Especiais", confiancaPadrao: 62, icone: "🚩", cor: "text-red-400", tags: ["alto-risco"] },
  { id: "cartoes_3", nome: "Cartões Acima 3.5", descricao: "Jogos com histórico de muitos cartões (4+)", categoria: "Especiais", confiancaPadrao: 70, icone: "🟨", cor: "text-yellow-500", tags: [] },
  { id: "cartoes_5", nome: "Cartões Acima 5.5", descricao: "Partidas com muita agressividade (6+ cartões)", categoria: "Especiais", confiancaPadrao: 64, icone: "🟥", cor: "text-red-400", tags: [] },
  { id: "posse_dominante", nome: "Posse Dominante 65%+", descricao: "Time com posse acima de 65% — pressão constante", categoria: "Especiais", confiancaPadrao: 72, icone: "🎮", cor: "text-blue-400", tags: ["ao-vivo"] },
  { id: "chutes_alto", nome: "Chutes a Gol Alto (10+)", descricao: "Time com 10+ chutes a gol — gol iminente", categoria: "Especiais", confiancaPadrao: 75, icone: "🎯", cor: "text-green-300", tags: ["ao-vivo"] },
  { id: "pressao_xg", nome: "Pressão xG Alta", descricao: "xG alto sem gol — gol esperado a qualquer momento", categoria: "Especiais", confiancaPadrao: 77, icone: "💣", cor: "text-orange-300", tags: ["ao-vivo", "value"] },
  { id: "penalti_detectado", nome: "Pênalti Detectado", descricao: "Situações de pênalti identificadas por IA", categoria: "Especiais", confiancaPadrao: 80, icone: "🥅", cor: "text-red-300", tags: ["ao-vivo"] },
  { id: "ev_positivo", nome: "EV+ Detector Universal", descricao: "Detecta qualquer mercado com Expected Value positivo", categoria: "Especiais", confiancaPadrao: 88, icone: "💰", cor: "text-primary", tags: ["popular", "value"] },
  { id: "empate_intervalo_over25", nome: "0-0 Intervalo + Over 2.5", descricao: "Empate no intervalo com tendência de gols no 2ºT", categoria: "Especiais", confiancaPadrao: 73, icone: "🎲", cor: "text-purple-300", tags: ["ao-vivo"] },
];

const CANAIS_OPCOES = [
  { value: "painel", label: "📊 Painel Interno" },
  { value: "whatsapp_evolution", label: "📱 WhatsApp (Evolution)" },
  { value: "whatsapp_zapi", label: "📱 WhatsApp (Z-API)" },
  { value: "telegram", label: "✈️ Telegram" },
  { value: "email", label: "📧 E-mail" },
  { value: "push", label: "🔔 Push Notification" },
];

// Tipo para os filtros avançados de um bot
interface FiltrosBot {
  ligasIds: number[];
  minutoMin: number;
  minutoMax: number;
  oddsMin: number;
  oddsMax: number;
  evMin: number;
  placarAtual: string; // "qualquer", "empate", "casa_vence", "visitante_vence"
  diferencaGolsMax: number;
  apenasAoVivo: boolean;
  apenasPreJogo: boolean;
  fasesCompetição: string[]; // "grupos", "mata-mata", "final", "regular"
  importanciaMinima: string; // "qualquer", "importante", "decisivo", "derby"
}

const filtrosPadrao: FiltrosBot = {
  ligasIds: [],
  minutoMin: 0,
  minutoMax: 90,
  oddsMin: 1.20,
  oddsMax: 10.00,
  evMin: 0,
  placarAtual: "qualquer",
  diferencaGolsMax: 5,
  apenasAoVivo: false,
  apenasPreJogo: false,
  fasesCompetição: [],
  importanciaMinima: "qualquer",
};

export default function Bots() {
  const [aba, setAba] = useState("central");
  const [modalNovo, setModalNovo] = useState(false);
  const [botEditando, setBotEditando] = useState<any>(null);
  const [novoBot, setNovoBot] = useState({ nome: "", descricao: "", templateId: "", confiancaMinima: 75, limiteDiario: 10, canal: "painel" });
  const [novoFiltros, setNovoFiltros] = useState<FiltrosBot>(filtrosPadrao);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(true);
  const [abrirFiltroLigas, setAbrirFiltroLigas] = useState(false);
  const [filtroLigasSinais, setFiltroLigasSinais] = useState<number[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [filtroTag, setFiltroTag] = useState("todos");
  const [buscaTemplate, setBuscaTemplate] = useState("");
  const [ativandoTemplate, setAtivandoTemplate] = useState<string | null>(null);

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
    onSuccess: (data) => { utils.bots.list.invalidate(); toast.success(data.mensagem, { description: data.alertasGerados > 0 ? "Verifique a Fila de Sinais" : undefined }); },
    onError: (err) => toast.error("Erro ao processar bots", { description: err.message }),
  });
  const criarBot = trpc.bots.create.useMutation({
    onSuccess: () => { utils.bots.list.invalidate(); setModalNovo(false); toast.success("Bot criado com sucesso! 🤖"); setNovoBot({ nome: "", descricao: "", templateId: "", confiancaMinima: 75, limiteDiario: 10, canal: "painel" }); setNovoFiltros(filtrosPadrao); setMostrarFiltrosAvancados(false); },
    onError: () => toast.error("Erro ao criar bot"),
  });
  const toggleBot = trpc.bots.toggleAtivo.useMutation({
    onSuccess: (data) => { utils.bots.list.invalidate(); toast.success(data?.ativo ? "✅ Bot ativado!" : "⏸️ Bot pausado!"); },
    onError: () => toast.error("Erro ao alterar bot"),
  });
  const deletarBot = trpc.bots.delete.useMutation({
    onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot removido!"); },
    onError: () => toast.error("Erro ao remover bot"),
  });

  const bots = botsQuery.data ?? [];
  const botsAtivos = bots.filter(b => b.ativo).length;
  const cron = cronQuery.data;
  const botsExistentes = new Set(bots.map(b => b.templateId).filter(Boolean));

  const categorias = ["Todos", ...Array.from(new Set(TEMPLATES.map(t => t.categoria)))];
  const templatesFiltrados = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = filtroCategoria === "Todos" || t.categoria === filtroCategoria;
      const matchTag = filtroTag === "todos" || t.tags.includes(filtroTag);
      const matchBusca = buscaTemplate === "" || t.nome.toLowerCase().includes(buscaTemplate.toLowerCase()) || t.descricao.toLowerCase().includes(buscaTemplate.toLowerCase());
      return matchCat && matchTag && matchBusca;
    });
  }, [filtroCategoria, filtroTag, buscaTemplate]);

  const ativarTemplateComUmClique = async (template: typeof TEMPLATES[0]) => {
    setAtivandoTemplate(template.id);
    try {
      await criarBot.mutateAsync({ nome: template.nome, descricao: template.descricao, templateId: template.id, confiancaMinima: template.confiancaPadrao, limiteDiario: 10, canal: "painel" });
      toast.success(`Bot "${template.nome}" ativado! 🚀`, { description: "Acesse a aba Central para gerenciá-lo" });
    } catch (e) {
      toast.error("Erro ao ativar template");
    } finally {
      setAtivandoTemplate(null);
    }
  };

  const abrirTemplateAvancado = (template: typeof TEMPLATES[0]) => {
    setNovoBot({ nome: template.nome, descricao: template.descricao, templateId: template.id, confiancaMinima: template.confiancaPadrao, limiteDiario: 10, canal: "painel" });
    setNovoFiltros(filtrosPadrao);
    setMostrarFiltrosAvancados(true);
    setModalNovo(true);
  };

  return (
    <RaphaLayout title="RAPHA Bots">
      <Tabs value={aba} onValueChange={setAba}>
        {/* Header com abas e ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="central">Central</TabsTrigger>
            <TabsTrigger value="templates">
              Templates IA
              <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{TEMPLATES.length}</span>
            </TabsTrigger>
            <TabsTrigger value="sinais">Fila de Sinais</TabsTrigger>
            <TabsTrigger value="canais">Canais</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border" onClick={() => processarBots.mutate()} disabled={processarBots.isPending}>
              <Zap className={`w-4 h-4 mr-2 ${processarBots.isPending ? "animate-spin" : ""}`} />
              {processarBots.isPending ? "Processando..." : "Processar Agora"}
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { setNovoBot({ nome: "", descricao: "", templateId: "", confiancaMinima: 75, limiteDiario: 10, canal: "painel" }); setNovoFiltros(filtrosPadrao); setMostrarFiltrosAvancados(true); setModalNovo(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Bot
            </Button>
          </div>
        </div>

        {/* ─── ABA CENTRAL ─── */}
        <TabsContent value="central">
          {/* Painel Cron */}
          {cron && (
            <div className={`mb-4 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${cron.ativo ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cron.ativo ? "bg-primary/20" : "bg-muted"}`}>
                  <Clock className={`w-5 h-5 ${cron.ativo ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">Cron Automático</span>
                    <span className={cron.ativo ? "badge-green" : "badge-yellow"}>{cron.ativo ? "Ativo" : "Parado"}</span>
                    {cron.ativo && <span className="text-[10px] text-muted-foreground">a cada 5 min</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cron.ativo ? `Próxima execução: ${cron.proximaExecucao ? new Date(cron.proximaExecucao).toLocaleTimeString("pt-BR") : "—"}` : "Bots não estão sendo processados automaticamente"}
                    {cron.ultimaExecucao && ` · Última: ${new Date(cron.ultimaExecucao).toLocaleTimeString("pt-BR")}`}
                    {cron.totalAlertasGerados > 0 && ` · ${cron.totalAlertasGerados} alertas gerados`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-border text-xs" onClick={() => cronExecutarAgora.mutate()} disabled={cronExecutarAgora.isPending}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${cronExecutarAgora.isPending ? "animate-spin" : ""}`} />
                  Executar Agora
                </Button>
                {cron.ativo ? (
                  <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 text-xs" onClick={() => cronParar.mutate()} disabled={cronParar.isPending}>
                    <Pause className="w-3.5 h-3.5 mr-1.5" />Parar
                  </Button>
                ) : (
                  <Button size="sm" className="bg-primary text-primary-foreground text-xs" onClick={() => cronIniciar.mutate()} disabled={cronIniciar.isPending}>
                    <Play className="w-3.5 h-3.5 mr-1.5" />Iniciar Cron
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total de Bots", value: bots.length, color: "text-foreground", icon: Bot },
              { label: "Bots Ativos", value: botsAtivos, color: "text-primary", icon: Zap },
              { label: "Sinais Hoje", value: bots.reduce((a, b) => a + (b.totalSinais ?? 0), 0), color: "text-green-400", icon: TrendingUp },
              { label: "Taxa de Acerto", value: bots.length > 0 ? `${Math.round(bots.reduce((a, b) => a + (b.totalAcertos ?? 0), 0) / Math.max(bots.reduce((a, b) => a + (b.totalSinais ?? 0), 0), 1) * 100)}%` : "—", color: "text-yellow-400", icon: Target },
            ].map((s, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {bots.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum bot criado ainda</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Crie seu primeiro bot ou carregue um dos {TEMPLATES.length} templates prontos de IA com 1 clique</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" className="border-border" onClick={() => setAba("templates")}>
                    <Layers className="w-4 h-4 mr-2" />Ver Templates
                  </Button>
                  <Button className="bg-primary text-primary-foreground" onClick={() => setModalNovo(true)}>
                    <Plus className="w-4 h-4 mr-2" />Criar Bot
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* ─── RANKING DE PERFORMANCE ─────────────────────────────────────────────── */}
              {(() => {
                // Mostrar todos os bots no ranking (com ou sem sinais)
                const comSinais = [...bots].sort((a, b) => {
                  const taxaA = a.totalSinais > 0 ? (a.totalAcertos / a.totalSinais) * 100 : -1;
                  const taxaB = b.totalSinais > 0 ? (b.totalAcertos / b.totalSinais) * 100 : -1;
                  return taxaB - taxaA;
                });
                // Sempre mostrar o ranking quando há bots
                const top3 = comSinais.slice(0, 3);
                const medalhas = [
                  { emoji: "🥇", label: "1º Lugar", bg: "from-yellow-500/20 to-amber-500/10", border: "border-yellow-500/50", text: "text-yellow-400", stroke: "#eab308" },
                  { emoji: "🥈", label: "2º Lugar", bg: "from-slate-400/20 to-slate-500/10", border: "border-slate-400/50", text: "text-slate-300", stroke: "#94a3b8" },
                  { emoji: "🥉", label: "3º Lugar", bg: "from-amber-700/20 to-amber-800/10", border: "border-amber-700/50", text: "text-amber-600", stroke: "#b45309" },
                ];
                return (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <div>
                        <h3 className="font-bold text-foreground text-sm">Ranking de Performance</h3>
                        <p className="text-[11px] text-muted-foreground">Atualizado automaticamente com cada resultado</p>
                      </div>
                      <span className="ml-auto text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">{bots.filter(b => b.totalSinais > 0).length}/{bots.length} com dados</span>
                    </div>

                    {/* Estado vazio — sem sinais ainda */}
                    {comSinais.every(b => b.totalSinais === 0) && (
                      <div className="px-5 py-6 text-center border-b border-border bg-muted/10">
                        <Trophy className="w-8 h-8 text-yellow-400/40 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground mb-1">Ranking em construção</p>
                        <p className="text-xs text-muted-foreground">Ative os bots e processe sinais para ver o ranking de performance atualizado automaticamente a cada resultado.</p>
                      </div>
                    )}

                    {/* Pódio Top 3 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                      {top3.map((bot, idx) => {
                        const taxa = bot.totalSinais > 0 ? Math.round((bot.totalAcertos / bot.totalSinais) * 100) : 0;
                        const historico = (bot.historicoPerformance as Array<{data: string; taxa: number}> | null) ?? [];
                        const m = medalhas[idx];
                        const sparkW = 80; const sparkH = 28;
                        const maxTaxa = Math.max(...historico.map(h => h.taxa), 100);
                        const pts = historico.slice(-10);
                        const pontos = pts.map((h, i) => {
                          const x = pts.length <= 1 ? sparkW / 2 : (i / (pts.length - 1)) * sparkW;
                          const y = sparkH - (h.taxa / maxTaxa) * sparkH;
                          return `${x},${y}`;
                        }).join(" ");
                        return (
                          <div key={bot.id} className={`relative bg-gradient-to-br ${m.bg} border-2 ${m.border} rounded-xl p-4 shadow-lg`}>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="text-2xl">{m.emoji}</span>
                            </div>
                            <div className="mt-3 text-center">
                              <p className={`text-[10px] font-bold ${m.text} uppercase tracking-wider mb-1`}>{m.label}</p>
                              <p className="font-bold text-foreground text-sm truncate">{bot.nome}</p>
                              <div className={`text-3xl font-black ${m.text} my-2`}>{taxa}%</div>
                              <p className="text-[10px] text-muted-foreground">{bot.totalAcertos}/{bot.totalSinais} acertos</p>
                              {historico.length >= 2 && (
                                <div className="mt-2 flex justify-center">
                                  <svg width={sparkW} height={sparkH} className="opacity-80">
                                    <polyline points={pontos} fill="none" stroke={m.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    {pts.map((h, i) => {
                                      const x = pts.length <= 1 ? sparkW / 2 : (i / (pts.length - 1)) * sparkW;
                                      const y = sparkH - (h.taxa / maxTaxa) * sparkH;
                                      return <circle key={i} cx={x} cy={y} r="2.5" fill={m.stroke} />;
                                    })}
                                  </svg>
                                </div>
                              )}
                              <div className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                                taxa >= 70 ? "bg-green-500/20 text-green-400" :
                                taxa >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {taxa >= 70 ? "🔥 Excelente" : taxa >= 50 ? "⚡ Bom" : "📉 Abaixo"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tabela do restante */}
                    {comSinais.length > 3 && (
                      <div className="px-4 pb-4">
                        <p className="text-[11px] text-muted-foreground mb-2 font-medium">Demais bots</p>
                        <div className="space-y-1.5">
                          {comSinais.slice(3).map((bot, idx) => {
                            const taxa = bot.totalSinais > 0 ? Math.round((bot.totalAcertos / bot.totalSinais) * 100) : 0;
                            return (
                              <div key={bot.id} className="flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2">
                                <span className="text-xs text-muted-foreground w-5 text-center font-bold">#{idx + 4}</span>
                                <span className="flex-1 text-xs text-foreground font-medium truncate">{bot.nome}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${taxa}%` }} />
                                  </div>
                                  <span className={`text-xs font-bold w-10 text-right ${
                                    taxa >= 70 ? "text-green-400" : taxa >= 50 ? "text-yellow-400" : "text-red-400"
                                  }`}>{taxa}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ─── CARDS DE BOTS ────────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bots.map(bot => {
                const filtros = bot.filtros as FiltrosBot | null;
                const temFiltros = filtros && (filtros.ligasIds?.length > 0 || filtros.minutoMin > 0 || filtros.minutoMax < 90 || filtros.oddsMin > 1.20 || filtros.oddsMax < 10);
                const taxa = bot.totalSinais > 0 ? Math.round((bot.totalAcertos / bot.totalSinais) * 100) : 0;
                const isTopPerformer = bot.totalSinais >= 5 && taxa >= 70;
                return (
                  <Card key={bot.id} className={`bg-card border-border transition-all ${bot.ativo ? "border-primary/30 neon-glow" : ""} ${isTopPerformer ? "ring-1 ring-yellow-500/30" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bot.ativo ? "bg-primary/20" : "bg-muted"}`}>
                            <Bot className={`w-5 h-5 ${bot.ativo ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{bot.nome}</h3>
                              {isTopPerformer && (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  🏆 Top Performer
                                </span>
                              )}
                              {temFiltros && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Filter className="w-3.5 h-3.5 text-primary" />
                                  </TooltipTrigger>
                                  <TooltipContent>Filtros avançados configurados</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{bot.descricao || "Bot personalizado"}</p>
                          </div>
                        </div>
                        <Switch checked={bot.ativo} onCheckedChange={(v) => toggleBot.mutate({ id: bot.id, ativo: v })} />
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
                          <p className={`text-sm font-bold ${taxa >= 70 ? "text-green-400" : taxa >= 50 ? "text-yellow-400" : bot.totalSinais === 0 ? "text-primary" : "text-red-400"}`}>
                            {bot.totalSinais === 0 ? `${bot.confiancaMinima}%` : `${taxa}%`}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{bot.totalSinais === 0 ? "Confiança" : "Taxa"}</p>
                        </div>
                      </div>
                      {/* Barra de performance */}
                      {bot.totalSinais > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Performance</span>
                            <span className={taxa >= 70 ? "text-green-400" : taxa >= 50 ? "text-yellow-400" : "text-red-400"}>{taxa}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${taxa >= 70 ? "bg-green-500" : taxa >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${taxa}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Filtros resumidos */}
                      {temFiltros && filtros && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {filtros.ligasIds?.length > 0 && <span className="badge-blue text-[10px]">{filtros.ligasIds.length} liga(s)</span>}
                          {(filtros.minutoMin > 0 || filtros.minutoMax < 90) && <span className="badge-yellow text-[10px]">{filtros.minutoMin}–{filtros.minutoMax} min</span>}
                          {filtros.oddsMin > 1.20 && <span className="badge-green text-[10px]">Odd ≥ {filtros.oddsMin}</span>}
                          {filtros.evMin > 0 && <span className="badge-green text-[10px]">EV ≥ {filtros.evMin}%</span>}
                          {filtros.apenasAoVivo && <span className="badge-red text-[10px]">Só Ao Vivo</span>}
                          {filtros.ligasIds?.length === 0 && <span className="text-[10px] text-green-400/70">🌍 Todas as ligas</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={bot.ativo ? "badge-green" : "badge-yellow"}>{bot.ativo ? "Ativo" : "Pausado"}</span>
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
                );
              })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── ABA TEMPLATES ─── */}
        <TabsContent value="templates">
          {/* Barra de busca e filtros */}
          <div className="space-y-3 mb-5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar template..." value={buscaTemplate} onChange={e => setBuscaTemplate(e.target.value)} className="pl-9 bg-card border-border" />
              </div>
              <Select value={filtroTag} onValueChange={setFiltroTag}>
                <SelectTrigger className="w-full sm:w-44 bg-card border-border">
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="popular">⭐ Populares</SelectItem>
                  <SelectItem value="value">💎 Value Bet</SelectItem>
                  <SelectItem value="ao-vivo">🔴 Ao Vivo</SelectItem>
                  <SelectItem value="seguro">🛡️ Seguros</SelectItem>
                  <SelectItem value="alto-risco">⚠️ Alto Risco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Filtro por categoria */}
            <div className="flex flex-wrap gap-2">
              {categorias.map(cat => (
                <Button key={cat} size="sm" variant={filtroCategoria === cat ? "default" : "outline"}
                  className={filtroCategoria === cat ? "bg-primary text-primary-foreground text-xs" : "border-border text-muted-foreground text-xs"}
                  onClick={() => setFiltroCategoria(cat)}>
                  {cat}
                </Button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground self-center">{templatesFiltrados.length} templates</span>
            </div>
          </div>

          {templatesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum template encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesFiltrados.map(t => {
                const jaAtivo = botsExistentes.has(t.id);
                const ativando = ativandoTemplate === t.id;
                return (
                  <Card key={t.id} className={`bg-card border-border transition-all group ${jaAtivo ? "border-primary/50" : "hover:border-primary/40"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{t.icone}</span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-semibold text-foreground text-sm">{t.nome}</h3>
                              {jaAtivo && <span className="badge-green text-[10px]">✓ Ativo</span>}
                            </div>
                            <span className="badge-blue text-[10px]">{t.categoria}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${t.cor}`}>{t.confiancaPadrao}%</span>
                          <p className="text-[10px] text-muted-foreground">confiança</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{t.descricao}</p>
                      {/* Tags */}
                      {t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {t.tags.includes("popular") && <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded">⭐ Popular</span>}
                          {t.tags.includes("value") && <span className="text-[10px] bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded">💎 Value</span>}
                          {t.tags.includes("ao-vivo") && <span className="text-[10px] bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded">🔴 Ao Vivo</span>}
                          {t.tags.includes("seguro") && <span className="text-[10px] bg-green-400/10 text-green-400 px-1.5 py-0.5 rounded">🛡️ Seguro</span>}
                          {t.tags.includes("alto-risco") && <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">⚠️ Alto Risco</span>}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-primary text-primary-foreground text-xs" disabled={jaAtivo || ativando} onClick={() => ativarTemplateComUmClique(t)}>
                          <Zap className={`w-3.5 h-3.5 mr-1.5 ${ativando ? "animate-spin" : ""}`} />
                          {jaAtivo ? "Já ativado" : ativando ? "Ativando..." : "1 Clique"}
                        </Button>
                        {!jaAtivo && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="border-border" onClick={() => abrirTemplateAvancado(t)}>
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Configurar filtros avançados</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── ABA FILA DE SINAIS ─── */}
        <TabsContent value="sinais">
          <FilaSinais filtroLigas={filtroLigasSinais} setFiltroLigas={setFiltroLigasSinais} />
        </TabsContent>

        {/* ─── ABA CANAIS ─── */}
        <TabsContent value="canais">
          <CanaisConfig />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL CRIAR/EDITAR BOT ─── */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              {novoBot.templateId ? `Template: ${novoBot.nome}` : "Novo Bot"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Básico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm">Nome do Bot</Label>
                <Input value={novoBot.nome} onChange={e => setNovoBot(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Over 0.5 FT Pro" className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-sm">Canal de Envio</Label>
                <Select value={novoBot.canal} onValueChange={v => setNovoBot(p => ({ ...p, canal: v }))}>
                  <SelectTrigger className="bg-input border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANAIS_OPCOES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-foreground text-sm">Descrição</Label>
              <Input value={novoBot.descricao} onChange={e => setNovoBot(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do bot..." className="bg-input border-border mt-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm">Confiança Mínima: <span className="text-primary font-bold">{novoBot.confiancaMinima}%</span></Label>
                <Slider value={[novoBot.confiancaMinima]} onValueChange={([v]) => setNovoBot(p => ({ ...p, confiancaMinima: v }))} min={50} max={99} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-foreground text-sm">Limite Diário: <span className="text-primary font-bold">{novoBot.limiteDiario} sinais</span></Label>
                <Slider value={[novoBot.limiteDiario]} onValueChange={([v]) => setNovoBot(p => ({ ...p, limiteDiario: v }))} min={1} max={50} step={1} className="mt-2" />
              </div>
            </div>

            {/* Filtros Avançados */}
            <div className="border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
                onClick={() => setMostrarFiltrosAvancados(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  Filtros Avançados Premium
                  <span className="badge-blue text-[10px]">PRO</span>
                </div>
                {mostrarFiltrosAvancados ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {mostrarFiltrosAvancados && (
                <div className="p-4 space-y-5">
                  {/* Ligas — Toggle visual */}
                  <div>
                    <Label className="text-foreground text-sm mb-3 block font-semibold">
                      🏆 Cobertura de Ligas
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setNovoFiltros(p => ({ ...p, ligasIds: [] }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          novoFiltros.ligasIds.length === 0
                            ? "border-green-500 bg-green-500/10 text-green-400"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <span className="text-2xl">🌍</span>
                        <span className="text-xs font-bold">Todas as Ligas</span>
                        <span className="text-[10px] opacity-70">Monitorar tudo</span>
                        {novoFiltros.ligasIds.length === 0 && (
                          <span className="text-[10px] text-green-400 font-bold">✔ Ativo</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAbrirFiltroLigas(true); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          novoFiltros.ligasIds.length > 0
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-2xl">🎯</span>
                        <span className="text-xs font-bold">Ligas Específicas</span>
                        <span className="text-[10px] opacity-70">
                          {novoFiltros.ligasIds.length > 0 ? `${novoFiltros.ligasIds.length} selecionada(s)` : "Escolher abaixo"}
                        </span>
                        {novoFiltros.ligasIds.length > 0 && (
                          <span className="text-[10px] text-primary font-bold">✔ Ativo</span>
                        )}
                      </button>
                    </div>
                    <FiltroLigas
                      ligasSelecionadas={novoFiltros.ligasIds}
                      onChange={v => setNovoFiltros(p => ({ ...p, ligasIds: v }))}
                      placeholder="Buscar e adicionar ligas específicas..."
                      forceOpen={abrirFiltroLigas}
                      onForceOpenConsumed={() => setAbrirFiltroLigas(false)}
                    />
                    <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                      novoFiltros.ligasIds.length === 0 ? "text-green-400" : "text-primary"
                    }`}>
                      {novoFiltros.ligasIds.length === 0
                        ? <><span>✅</span> Bot ativo para todas as ligas disponíveis</>
                        : <><span>🎯</span> Bot filtrado para {novoFiltros.ligasIds.length} liga(s) específica(s)</>
                      }
                    </p>
                  </div>

                  {/* Minuto de jogo */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">
                      ⏱️ Minuto do Jogo: <span className="text-primary font-bold">{novoFiltros.minutoMin}' – {novoFiltros.minutoMax}'</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Mínimo</p>
                        <Slider value={[novoFiltros.minutoMin]} onValueChange={([v]) => setNovoFiltros(p => ({ ...p, minutoMin: Math.min(v, p.minutoMax - 1) }))} min={0} max={89} step={1} />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Máximo</p>
                        <Slider value={[novoFiltros.minutoMax]} onValueChange={([v]) => setNovoFiltros(p => ({ ...p, minutoMax: Math.max(v, p.minutoMin + 1) }))} min={1} max={90} step={1} />
                      </div>
                    </div>
                  </div>

                  {/* Odds */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">
                      📊 Faixa de Odds: <span className="text-primary font-bold">{novoFiltros.oddsMin.toFixed(2)} – {novoFiltros.oddsMax.toFixed(2)}</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Mínima</p>
                        <Slider value={[novoFiltros.oddsMin * 10]} onValueChange={([v]) => setNovoFiltros(p => ({ ...p, oddsMin: Math.min(v / 10, p.oddsMax - 0.1) }))} min={10} max={200} step={1} />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Máxima</p>
                        <Slider value={[novoFiltros.oddsMax * 10]} onValueChange={([v]) => setNovoFiltros(p => ({ ...p, oddsMax: Math.max(v / 10, p.oddsMin + 0.1) }))} min={11} max={1000} step={1} />
                      </div>
                    </div>
                  </div>

                  {/* EV Mínimo */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">
                      💰 EV Mínimo: <span className="text-primary font-bold">{novoFiltros.evMin}%</span>
                    </Label>
                    <Slider value={[novoFiltros.evMin]} onValueChange={([v]) => setNovoFiltros(p => ({ ...p, evMin: v }))} min={0} max={30} step={1} />
                  </div>

                  {/* Placar atual */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">⚽ Placar Atual no Momento do Sinal</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: "qualquer", label: "Qualquer" },
                        { value: "empate", label: "Empate" },
                        { value: "casa_vence", label: "Casa Vence" },
                        { value: "visitante_vence", label: "Visitante Vence" },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          className={`p-2 rounded-lg border text-xs font-medium transition-all ${novoFiltros.placarAtual === opt.value ? "bg-primary/20 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40"}`}
                          onClick={() => setNovoFiltros(p => ({ ...p, placarAtual: opt.value }))}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diferença máxima de gols */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">
                      🎯 Diferença Máxima de Gols: <span className="text-primary font-bold">{novoFiltros.diferencaGolsMax === 5 ? "Qualquer" : `≤ ${novoFiltros.diferencaGolsMax} gol(s)`}</span>
                    </Label>
                    <Slider value={[novoFiltros.diferencaGolsMax]} onValueChange={([v]) => setNovoFiltros(p => ({ ...p, diferencaGolsMax: v }))} min={0} max={5} step={1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>0 (Empate)</span><span>1</span><span>2</span><span>3</span><span>4</span><span>Qualquer</span>
                    </div>
                  </div>

                  {/* Tipo de jogo */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">🔴 Tipo de Jogo</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "apenasAoVivo", label: "Só Ao Vivo" },
                        { key: "apenasPreJogo", label: "Só Pré-Jogo" },
                      ].map(opt => (
                        <button key={opt.key} type="button"
                          className={`p-2 rounded-lg border text-xs font-medium transition-all ${(novoFiltros as any)[opt.key] ? "bg-primary/20 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40"}`}
                          onClick={() => setNovoFiltros(p => ({ ...p, [opt.key]: !(p as any)[opt.key], ...(opt.key === "apenasAoVivo" ? { apenasPreJogo: false } : { apenasAoVivo: false }) }))}>
                          {opt.label}
                        </button>
                      ))}
                      <button type="button"
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${!novoFiltros.apenasAoVivo && !novoFiltros.apenasPreJogo ? "bg-primary/20 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40"}`}
                        onClick={() => setNovoFiltros(p => ({ ...p, apenasAoVivo: false, apenasPreJogo: false }))}>
                        Ambos
                      </button>
                    </div>
                  </div>

                  {/* Importância */}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">🏆 Importância do Jogo</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: "qualquer", label: "Qualquer" },
                        { value: "importante", label: "Importante" },
                        { value: "decisivo", label: "Decisivo" },
                        { value: "derby", label: "Derby" },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          className={`p-2 rounded-lg border text-xs font-medium transition-all ${novoFiltros.importanciaMinima === opt.value ? "bg-primary/20 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40"}`}
                          onClick={() => setNovoFiltros(p => ({ ...p, importanciaMinima: opt.value }))}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resumo dos filtros */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary mb-1">📋 Resumo dos Filtros</p>
                    <div className="flex flex-wrap gap-1">
                      {novoFiltros.ligasIds.length > 0 && <span className="badge-blue text-[10px]">{novoFiltros.ligasIds.length} liga(s)</span>}
                      {(novoFiltros.minutoMin > 0 || novoFiltros.minutoMax < 90) && <span className="badge-yellow text-[10px]">{novoFiltros.minutoMin}'–{novoFiltros.minutoMax}'</span>}
                      {novoFiltros.oddsMin > 1.20 && <span className="badge-green text-[10px]">Odd ≥ {novoFiltros.oddsMin.toFixed(2)}</span>}
                      {novoFiltros.oddsMax < 10 && <span className="badge-green text-[10px]">Odd ≤ {novoFiltros.oddsMax.toFixed(2)}</span>}
                      {novoFiltros.evMin > 0 && <span className="badge-green text-[10px]">EV ≥ {novoFiltros.evMin}%</span>}
                      {novoFiltros.placarAtual !== "qualquer" && <span className="badge-blue text-[10px]">Placar: {novoFiltros.placarAtual}</span>}
                      {novoFiltros.diferencaGolsMax < 5 && <span className="badge-yellow text-[10px]">Dif. ≤ {novoFiltros.diferencaGolsMax}G</span>}
                      {novoFiltros.apenasAoVivo && <span className="badge-red text-[10px]">Só Ao Vivo</span>}
                      {novoFiltros.apenasPreJogo && <span className="badge-blue text-[10px]">Só Pré-Jogo</span>}
                      {novoFiltros.importanciaMinima !== "qualquer" && <span className="badge-yellow text-[10px]">{novoFiltros.importanciaMinima}</span>}
                      {Object.values({ ...novoFiltros, ligasIds: novoFiltros.ligasIds.length === 0 ? null : novoFiltros.ligasIds }).every(v => v === null || v === "qualquer" || v === false || v === 0 || (Array.isArray(v) && v.length === 0)) && (
                        <span className="text-[10px] text-muted-foreground">Nenhum filtro aplicado — bot processa todos os jogos</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => criarBot.mutate({ ...novoBot, filtros: novoFiltros })} disabled={!novoBot.nome || criarBot.isPending}>
              {criarBot.isPending ? "Criando..." : "Criar Bot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RaphaLayout>
  );
}

// ─── Fila de Sinais ───────────────────────────────────────────────────────────
function FilaSinais({ filtroLigas, setFiltroLigas }: { filtroLigas: number[]; setFiltroLigas: (v: number[]) => void }) {
  const alertasQuery = trpc.alertas.list.useQuery(undefined, { refetchInterval: 10_000 });
  const alertas = alertasQuery.data ?? [];
  const [busca, setBusca] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("todos");

  const alertasFiltrados = useMemo(() => alertas.filter(a => {
    const matchBusca = busca === "" || a.jogo.toLowerCase().includes(busca.toLowerCase()) || (a.mercado ?? "").toLowerCase().includes(busca.toLowerCase());
    const matchResultado = filtroResultado === "todos" || a.resultado === filtroResultado;
    return matchBusca && matchResultado;
  }), [alertas, busca, filtroResultado]);

  const cores: Record<string, string> = { pendente: "badge-yellow", green: "badge-green", red: "badge-red", void: "badge-blue" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar jogo ou mercado..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filtroResultado} onValueChange={setFiltroResultado}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border">
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
        <FiltroLigas ligasSelecionadas={filtroLigas} onChange={setFiltroLigas} placeholder="Filtrar liga" />
        {alertasQuery.isFetching && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground self-center" />}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{alertasFiltrados.length} sinal(is)</p>
      </div>
      {alertasFiltrados.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-10 text-center">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">{alertas.length === 0 ? "Nenhum sinal gerado ainda — ative um bot e inicie o cron" : "Nenhum sinal encontrado com os filtros aplicados"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alertasFiltrados.map(a => (
            <Card key={a.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-foreground text-sm truncate">{a.jogo}</span>
                    {a.liga && <span className="text-[10px] text-muted-foreground shrink-0">{a.liga}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-blue text-[10px]">{a.mercado}</span>
                    <span className="text-[11px] text-foreground">Odd {Number(a.odd).toFixed(2)}</span>
                    {a.ev && <span className="text-[11px] text-green-400">EV {Number(a.ev).toFixed(1)}%</span>}
                    <span className="text-[11px] text-primary">{a.confianca}% conf.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`${cores[a.resultado] ?? "badge-yellow"} text-[10px]`}>{a.resultado === "pendente" ? "⏳" : a.resultado === "green" ? "✅" : a.resultado === "red" ? "❌" : "⚪"} {a.resultado}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Canais Config ────────────────────────────────────────────────────────────
function CanaisConfig() {
  const canaisQuery = trpc.canais.list.useQuery();
  const utils = trpc.useUtils();
  const [modalCanal, setModalCanal] = useState<string | null>(null);
  const [configAtual, setConfigAtual] = useState<Record<string, string>>({});
  const [testando, setTestando] = useState<number | null>(null);

  const salvarCanal = trpc.canais.upsert.useMutation({
    onSuccess: () => { utils.canais.list.invalidate(); setModalCanal(null); toast.success("Canal configurado!"); },
    onError: () => toast.error("Erro ao salvar canal"),
  });
  const toggleCanal = trpc.canais.toggle.useMutation({
    onSuccess: () => { utils.canais.list.invalidate(); },
    onError: () => toast.error("Erro ao alterar canal"),
  });
  const testarCanal = trpc.canais.testar.useMutation({
    onSuccess: (data) => { setTestando(null); if (data.sucesso) toast.success("✅ Mensagem de teste enviada!"); else toast.error("❌ Falha no envio", { description: data.erro }); },
    onError: () => { setTestando(null); toast.error("Erro ao testar canal"); },
  });

  const canaisConfigurados = canaisQuery.data ?? [];

  const CANAIS_INFO = [
    { tipo: "whatsapp_evolution", nome: "WhatsApp (Evolution API)", icone: "📱", cor: "text-green-400", campos: [{ key: "url", label: "URL da Instância", placeholder: "https://sua-instancia.evolution.com" }, { key: "apiKey", label: "API Key", placeholder: "sua-api-key" }, { key: "numero", label: "Número Destino", placeholder: "5511999999999" }] },
    { tipo: "whatsapp_zapi", nome: "WhatsApp (Z-API)", icone: "📱", cor: "text-green-300", campos: [{ key: "instanceId", label: "Instance ID", placeholder: "seu-instance-id" }, { key: "token", label: "Token Z-API", placeholder: "seu-token" }, { key: "numero", label: "Número Destino", placeholder: "5511999999999" }] },
    { tipo: "telegram", nome: "Telegram Bot", icone: "✈️", cor: "text-blue-400", campos: [{ key: "botToken", label: "Bot Token", placeholder: "1234567890:ABCdefGHI..." }, { key: "chatId", label: "Chat ID", placeholder: "-1001234567890" }] },
    { tipo: "email", nome: "E-mail (SMTP)", icone: "📧", cor: "text-yellow-400", campos: [{ key: "host", label: "Servidor SMTP", placeholder: "smtp.gmail.com" }, { key: "port", label: "Porta", placeholder: "587" }, { key: "user", label: "Usuário", placeholder: "seu@email.com" }, { key: "pass", label: "Senha/App Password", placeholder: "••••••••" }, { key: "to", label: "Destinatário", placeholder: "destino@email.com" }] },
    { tipo: "push", nome: "Push Notification", icone: "🔔", cor: "text-purple-400", campos: [{ key: "endpoint", label: "Endpoint Push", placeholder: "https://..." }] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-foreground">Canais de Notificação</h3>
          <p className="text-xs text-muted-foreground">Configure onde os alertas dos bots serão enviados</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CANAIS_INFO.map(info => {
          const canal = canaisConfigurados.find(c => c.tipo === info.tipo);
          const ativo = canal?.ativo ?? false;
          const configurado = !!canal;
          return (
            <Card key={info.tipo} className={`bg-card border-border transition-all ${ativo ? "border-primary/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icone}</span>
                    <div>
                      <h4 className={`font-semibold text-sm ${info.cor}`}>{info.nome}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {configurado ? <span className="badge-green text-[10px]">✓ Configurado</span> : <span className="badge-yellow text-[10px]">Não configurado</span>}
                        {ativo && <span className="badge-green text-[10px]">Ativo</span>}
                      </div>
                    </div>
                  </div>
                  {configurado && <Switch checked={ativo} onCheckedChange={(v) => toggleCanal.mutate({ id: canal!.id, ativo: v })} />}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 text-xs" onClick={() => { setModalCanal(info.tipo); setConfigAtual((canal?.config as Record<string, string>) ?? {}); }}>
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    {configurado ? "Editar" : "Configurar"}
                  </Button>
                  {configurado && (
                    <Button size="sm" variant="outline" className="border-border text-xs" disabled={testando === canal?.id} onClick={() => { setTestando(canal!.id); testarCanal.mutate({ id: canal!.id }); }}>
                      {testando === canal?.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal configurar canal */}
      <Dialog open={!!modalCanal} onOpenChange={() => setModalCanal(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {CANAIS_INFO.find(c => c.tipo === modalCanal)?.icone} Configurar {CANAIS_INFO.find(c => c.tipo === modalCanal)?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {CANAIS_INFO.find(c => c.tipo === modalCanal)?.campos.map(campo => (
              <div key={campo.key}>
                <Label className="text-foreground text-sm">{campo.label}</Label>
                <Input
                  type={campo.key.toLowerCase().includes("pass") || campo.key.toLowerCase().includes("token") || campo.key.toLowerCase().includes("key") ? "password" : "text"}
                  value={configAtual[campo.key] ?? ""}
                  onChange={e => setConfigAtual(p => ({ ...p, [campo.key]: e.target.value }))}
                  placeholder={campo.placeholder}
                  className="bg-input border-border mt-1"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalCanal(null)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => salvarCanal.mutate({ tipo: modalCanal as any, nome: CANAIS_INFO.find(c => c.tipo === modalCanal)?.nome ?? "", config: configAtual })} disabled={salvarCanal.isPending}>
              {salvarCanal.isPending ? "Salvando..." : "Salvar Canal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
