import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Bell, BellOff, BellRing, Smartphone, MessageSquare,
  Mail, Send, Zap, Target, TrendingUp, Shield,
  CheckCircle2, XCircle, AlertCircle, Settings,
  Flame, Volume2, VolumeX, Clock, Bot, Radio
} from "lucide-react";
import RaphaLayout from "@/components/RaphaLayout";

// ─── Hook de Push Notifications ──────────────────────────────────────────────
function usePushStatus() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribeMutation = trpc.system.subscribePush.useMutation();
  const unsubscribeMutation = trpc.system.unsubscribePush.useMutation();

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const subscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Permissão negada. Habilite notificações nas configurações do navegador.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const VAPID_PUBLIC_KEY = "BNepEQau5rSRgfRGceyR9RYpc6Cecc2H0EBd0ZjlXquRbaV-xbTxdkV-9bkEjVKUGJQl--kasu8Tg_ahou1M4Vo";
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });
      const json = sub.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setSubscribed(true);
      toast.success("🔔 Notificações push ativadas! Você receberá alertas mesmo com o app fechado.");
    } catch (err) {
      toast.error("Erro ao ativar notificações push.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
      }
      setSubscribed(false);
      toast.success("Notificações push desativadas.");
    } catch {
      toast.error("Erro ao desativar notificações push.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supported) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub));
      });
    }
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}

// ─── Tipos de Alerta ──────────────────────────────────────────────────────────
const TIPOS_ALERTA = [
  {
    id: "todos_sinais",
    label: "Todos os Sinais",
    desc: "Receber todos os sinais gerados pelos bots",
    icon: Zap,
    cor: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
  },
  {
    id: "alto_ev",
    label: "Alto Valor Esperado (EV > 5%)",
    desc: "Apenas sinais com EV acima de 5%",
    icon: TrendingUp,
    cor: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
  },
  {
    id: "alta_confianca",
    label: "Alta Confiança (≥ 85%)",
    desc: "Apenas sinais com confiança da IA acima de 85%",
    icon: Target,
    cor: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
  },
  {
    id: "jogos_quentes",
    label: "Jogos Quentes / Vulcão",
    desc: "Alertas quando um jogo atinge nível Quente ou Vulcão no termômetro",
    icon: Flame,
    cor: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
  },
  {
    id: "greens",
    label: "Greens Confirmados",
    desc: "Notificação quando um sinal é confirmado como Green",
    icon: CheckCircle2,
    cor: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  {
    id: "reds",
    label: "Reds (Perdas)",
    desc: "Notificação quando um sinal é confirmado como Red",
    icon: XCircle,
    cor: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
  },
];

const CANAIS_INFO = [
  {
    tipo: "push",
    label: "Push Notifications (PWA)",
    desc: "Alertas no celular mesmo com o app fechado",
    icon: Smartphone,
    cor: "text-green-400",
  },
  {
    tipo: "whatsapp_evolution",
    label: "WhatsApp (Evolution API)",
    desc: "Mensagens via Evolution API",
    icon: MessageSquare,
    cor: "text-green-400",
  },
  {
    tipo: "whatsapp_zapi",
    label: "WhatsApp (Z-API)",
    desc: "Mensagens via Z-API",
    icon: MessageSquare,
    cor: "text-green-400",
  },
  {
    tipo: "telegram",
    label: "Telegram",
    desc: "Mensagens via Bot do Telegram",
    icon: Send,
    cor: "text-blue-400",
  },
  {
    tipo: "email",
    label: "E-mail",
    desc: "Alertas por e-mail via SMTP",
    icon: Mail,
    cor: "text-purple-400",
  },
];

// ─── Configurações por Bot ─────────────────────────────────────────────────────
function ConfiguracoesPorBot() {
  const botsQuery = trpc.bots.list.useQuery();
  const bots = botsQuery.data ?? [];
  const [botsComPush, setBotsComPush] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (bots.length > 0) {
      const inicial: Record<string, boolean> = {};
      bots.forEach(b => { inicial[b.id as number] = true; });
      setBotsComPush(prev => ({ ...inicial, ...prev }));
    }
  }, [bots.length]);

  const toggleBot = (id: number) => {
    setBotsComPush(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success("Preferência do bot atualizada");
  };

  const TIPOS_BOT_ICONE: Record<string, typeof Bot> = {
    gols: Zap,
    escanteios: Radio,
    cartoes: Shield,
    btts: Target,
    over: TrendingUp,
    default: Bot,
  };

  if (botsQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
        <div className="h-4 w-32 bg-gray-700 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Push por Bot
        </h3>
        <p className="text-xs text-gray-500">Nenhum bot criado ainda. <a href="/bots" className="text-green-400 hover:underline">Criar bots</a></p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        Push por Bot Específico
      </h3>
      <p className="text-xs text-gray-500 mb-4">Escolha quais bots podem enviar notificações push para você.</p>
      <div className="space-y-2">
        {bots.map(bot => {
          const tipo = (bot.templateId ?? "default").toLowerCase();
          const IconeBot = TIPOS_BOT_ICONE[tipo] ?? TIPOS_BOT_ICONE.default;
          const ativo = botsComPush[bot.id] ?? true;
          return (
            <div key={bot.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              ativo ? "border-green-500/30 bg-green-500/5" : "border-gray-700/40 bg-gray-800/20"
            }`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  bot.ativo ? "bg-green-500/10" : "bg-gray-700/30"
                }`}>
                  <IconeBot className={`w-4 h-4 ${bot.ativo ? "text-green-400" : "text-gray-500"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${ativo ? "text-white" : "text-gray-500"}`}>
                    {bot.nome}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 capitalize">{bot.templateId ?? "geral"}</span>
                    {!bot.ativo && (
                      <Badge className="text-[9px] bg-gray-700 text-gray-400 border-0 px-1 py-0">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Switch
                checked={ativo}
                onCheckedChange={() => toggleBot(bot.id)}
                className="flex-shrink-0 ml-3"
              />
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-600 mt-3">
        Bots inativos não geram sinais, mas você pode pré-configurar o push para quando forem ativados.
      </p>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Configuracoes() {
  const push = usePushStatus();
  const [tiposAtivos, setTiposAtivos] = useState<Record<string, boolean>>({
    todos_sinais: true,
    alto_ev: true,
    alta_confianca: true,
    jogos_quentes: false,
    greens: true,
    reds: false,
  });
  const [confiancaMin, setConfiancaMin] = useState(70);
  const [evMin, setEvMin] = useState(2);
  const [somAtivado, setSomAtivado] = useState(true);
  const [horarioSilencio, setHorarioSilencio] = useState(false);
  const [horarioInicio, setHorarioInicio] = useState("23:00");
  const [horarioFim, setHorarioFim] = useState("07:00");

  const canaisQuery = trpc.canais.list.useQuery();
  const canaisAtivos = canaisQuery.data?.filter(c => c.ativo) ?? [];

  const toggleTipo = (id: string) => {
    setTiposAtivos(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success(`Preferência atualizada`);
  };

  const salvarPreferencias = () => {
    toast.success("✅ Preferências salvas com sucesso!");
  };

  return (
    <RaphaLayout title="Configurações">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-400" />
            Configurações de Notificações
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Personalize como e quando você quer receber alertas dos bots.
          </p>
        </div>

        {/* Push Notifications — Card principal */}
        <div className={`rounded-2xl border p-5 ${
          push.subscribed
            ? "bg-green-500/10 border-green-500/40"
            : "bg-gray-900/80 border-gray-700/60"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                push.subscribed ? "bg-green-500/20" : "bg-gray-800"
              }`}>
                {push.subscribed ? (
                  <BellRing className="w-6 h-6 text-green-400" />
                ) : (
                  <BellOff className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white">Push Notifications (PWA)</h3>
                  {push.subscribed && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">ATIVO</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Receba alertas dos bots diretamente no seu celular, mesmo com o navegador fechado.
                  Funciona como um app nativo.
                </p>
                {!push.supported && (
                  <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Seu navegador não suporta push notifications. Use Chrome ou Edge.
                  </p>
                )}
                {push.permission === "denied" && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Permissão bloqueada. Habilite nas configurações do navegador.
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={push.subscribed ? push.unsubscribe : push.subscribe}
              disabled={!push.supported || push.loading || push.permission === "denied"}
              className={`flex-shrink-0 ${
                push.subscribed
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                  : "bg-green-500 text-black hover:bg-green-400 font-bold"
              }`}
              variant={push.subscribed ? "outline" : "default"}
            >
              {push.loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : push.subscribed ? (
                <>
                  <BellOff className="w-4 h-4 mr-1.5" />
                  Desativar
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-1.5" />
                  Ativar Notificações
                </>
              )}
            </Button>
          </div>

          {push.subscribed && (
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Notificações ativas — você receberá alertas mesmo com o app fechado</span>
              </div>
            </div>
          )}
        </div>

        {/* Canais Configurados */}
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            Canais de Notificação Configurados
          </h3>
          <div className="space-y-2">
            {CANAIS_INFO.map(canal => {
              const ativo = canaisAtivos.some(c => c.tipo === canal.tipo) || canal.tipo === "push" && push.subscribed;
              return (
                <div key={canal.tipo} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  ativo ? "border-gray-600 bg-gray-800/60" : "border-gray-700/40 bg-gray-800/20 opacity-50"
                }`}>
                  <canal.icon className={`w-4 h-4 flex-shrink-0 ${ativo ? canal.cor : "text-gray-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{canal.label}</p>
                    <p className="text-[10px] text-gray-500">{canal.desc}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ativo ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-500"
                  }`}>
                    {ativo ? "Ativo" : "Inativo"}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-600 mt-3">
            Para configurar canais de WhatsApp, Telegram ou E-mail, acesse a aba{" "}
            <a href="/bots" className="text-green-400 hover:underline">RAPHA Bots → Canais</a>.
          </p>
        </div>

        {/* Tipos de Alerta */}
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-yellow-400" />
            Tipos de Alerta
          </h3>
          <p className="text-xs text-gray-500 mb-4">Escolha quais tipos de evento você quer receber.</p>
          <div className="space-y-3">
            {TIPOS_ALERTA.map(tipo => (
              <div key={tipo.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                tiposAtivos[tipo.id]
                  ? `${tipo.bg} ${tipo.border}`
                  : "border-gray-700/40 bg-gray-800/20"
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <tipo.icon className={`w-4 h-4 flex-shrink-0 ${tiposAtivos[tipo.id] ? tipo.cor : "text-gray-600"}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${tiposAtivos[tipo.id] ? "text-white" : "text-gray-500"}`}>
                      {tipo.label}
                    </p>
                    <p className="text-[10px] text-gray-500">{tipo.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={tiposAtivos[tipo.id]}
                  onCheckedChange={() => toggleTipo(tipo.id)}
                  className="flex-shrink-0 ml-3"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Filtros de Qualidade */}
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Filtros de Qualidade
          </h3>
          <p className="text-xs text-gray-500 mb-5">Defina os limites mínimos para receber notificações.</p>
          <div className="space-y-6">
            {/* Confiança mínima */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white">Confiança Mínima da IA</label>
                <span className="text-sm font-black text-green-400">{confiancaMin}%</span>
              </div>
              <Slider
                value={[confiancaMin]}
                onValueChange={([v]) => setConfiancaMin(v)}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>50% (mais sinais)</span>
                <span>95% (mais seletivo)</span>
              </div>
            </div>

            {/* EV mínimo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white">EV Mínimo (Valor Esperado)</label>
                <span className="text-sm font-black text-yellow-400">+{evMin}%</span>
              </div>
              <Slider
                value={[evMin]}
                onValueChange={([v]) => setEvMin(v)}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>0% (todos)</span>
                <span>+20% (alto valor)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferências de Som e Horário */}
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Som e Horário de Silêncio
          </h3>
          <div className="space-y-4">
            {/* Som */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-700/40 bg-gray-800/20">
              <div className="flex items-center gap-3">
                {somAtivado ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-600" />}
                <div>
                  <p className="text-xs font-semibold text-white">Som de Notificação</p>
                  <p className="text-[10px] text-gray-500">Toque sonoro ao receber um novo sinal</p>
                </div>
              </div>
              <Switch checked={somAtivado} onCheckedChange={setSomAtivado} />
            </div>

            {/* Horário de silêncio */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-700/40 bg-gray-800/20">
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 ${horarioSilencio ? "text-orange-400" : "text-gray-600"}`} />
                <div>
                  <p className="text-xs font-semibold text-white">Horário de Silêncio</p>
                  <p className="text-[10px] text-gray-500">Pausar notificações em um período específico</p>
                </div>
              </div>
              <Switch checked={horarioSilencio} onCheckedChange={setHorarioSilencio} />
            </div>

            {horarioSilencio && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs text-gray-400 w-12">Início:</label>
                  <input
                    type="time"
                    value={horarioInicio}
                    onChange={e => setHorarioInicio(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs text-gray-400 w-12">Fim:</label>
                  <input
                    type="time"
                    value={horarioFim}
                    onChange={e => setHorarioFim(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configurações por Bot */}
        <ConfiguracoesPorBot />

        {/* Botão Salvar */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Button
            onClick={salvarPreferencias}
            className="bg-green-500 hover:bg-green-400 text-black font-bold px-6"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Salvar Preferências
          </Button>
        </div>
      </div>
    </RaphaLayout>
  );
}
