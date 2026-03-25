import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, BellRing, Bot, CalendarClock, CheckCircle2,
  ChevronRight, Filter, Flame, Gauge, Loader2, MessageCircle,
  PauseCircle, PlayCircle, Plus, RefreshCw, Search, ShieldCheck,
  Siren, Sparkles, Target, Trash2, TrendingUp, Wifi, XCircle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type TemplateCard = {
  id: number; slug: string; name: string; description: string;
  category: string; mode: string;
  config: Record<string, unknown>; default_channels: string[];
};

type UserBot = {
  id: number; name: string; description: string; category: string;
  mode: string; status: 'active' | 'paused';
  run_count: number; alert_count: number; win_count: number;
  loss_count: number; roi_units: number;
  last_run_at?: number | null; last_alert_at?: number | null;
  next_run_at?: number | null;
  config: Record<string, unknown>; channels: string[];
};

type BotAlert = {
  id: number; bot_name: string; category: string; match_label: string;
  league?: string | null; market: string;
  outcome_status: 'pending' | 'win' | 'loss' | 'void';
  triggered_at: number; signal_json: string;
};

type FeedEntry = {
  matchId: string; league?: string; homeTeam?: string; awayTeam?: string;
  provider?: string; raw?: Record<string, unknown>; receivedAt: number;
};

type DashboardPayload = {
  templates: TemplateCard[];
  bots: UserBot[];
  alerts: BotAlert[];
  stats: {
    overview: {
      total_bots: number; active_bots: number; total_alerts: number;
      total_wins: number; total_losses: number; total_roi_units: number;
      total_runs: number; hit_rate: number;
    };
    by_filter: { category: string; bots: number; alerts: number; wins: number; losses: number }[];
    recent_alerts: BotAlert[];
  };
  feed: FeedEntry[];
};

const BOT_API = '/api/bots';

async function botFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem('rg_auth_token');
  const res = await fetch(`${BOT_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as T;
}

const CATEGORY_LABELS: Record<string, string> = {
  over15_2t_live: 'Over 1.5 2º Tempo',
  over05_ft_live: 'Over 0.5 FT',
  over05_55_live: 'Over 0.5 aos 55\'',
  corners_pressure_live: 'Escanteios',
  cards_pressure_live: 'Cartões',
  home_favorite_value: 'Favorito com Valor',
};

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  app:       { label: 'App',       color: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  email:     { label: 'E-mail',    color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  whatsapp:  { label: 'WhatsApp',  color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  telegram:  { label: 'Telegram',  color: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
};

function catLabel(c: string) { return CATEGORY_LABELS[c] ?? c; }
function fmtDate(ts?: number | null) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(ts?: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function hitRatePct(wins: number, losses: number) {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
}

// ── Outcome badge ────────────────────────────────────────────────────────────
function OutcomeBadge({ status }: { status: BotAlert['outcome_status'] }) {
  const map = {
    pending: 'border-slate-700/80 bg-slate-800/60 text-slate-400',
    win:     'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    loss:    'border-red-500/35 bg-red-500/15 text-red-300',
    void:    'border-slate-600/50 bg-slate-800/50 text-slate-500',
  };
  const labels = { pending: 'Pendente', win: 'Win ✓', loss: 'Loss ✗', void: 'Void' };
  return (
    <span className={cn('inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]', map[status])}>
      {labels[status]}
    </span>
  );
}

// ── Level badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    strong: 'border-red-500/35 bg-red-500/15 text-red-300',
    medium: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
    light:  'border-blue-500/30 bg-blue-500/10 text-blue-300',
  };
  return (
    <span className={cn('inline-block rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]', map[level ?? 'light'] ?? map.light)}>
      {level ?? 'light'}
    </span>
  );
}

export default function BotAutomationDashboard() {
  const { user, hasMinPlan } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [sort, setSort] = useState<'recent' | 'alerts' | 'wins'>('recent');
  const [activeTab, setActiveTab] = useState<'bots' | 'alertas' | 'feed'>('bots');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([
        botFetch<{ templates: TemplateCard[] }>('/templates'),
        botFetch<{ bots: UserBot[]; alerts: BotAlert[]; stats: DashboardPayload['stats']; feed: FeedEntry[] }>('/'),
      ]);
      setPayload({ templates: tRes.templates, ...dRes });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao carregar bots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredBots = useMemo(() => {
    const rows = [...(payload?.bots ?? [])].filter((bot) => {
      if (filter !== 'all' && bot.status !== filter) return false;
      if (!search) return true;
      return [bot.name, bot.description, bot.category].join(' ').toLowerCase().includes(search.toLowerCase());
    });
    rows.sort((a, b) => {
      if (sort === 'alerts') return b.alert_count - a.alert_count;
      if (sort === 'wins') return b.win_count - a.win_count;
      return Number(b.last_run_at ?? 0) - Number(a.last_run_at ?? 0);
    });
    return rows;
  }, [payload, filter, search, sort]);

  const doBusy = async (task: () => Promise<void>, ok: string) => {
    try { setBusy(true); await task(); toast.success(ok); await load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Falha na ação'); }
    finally { setBusy(false); }
  };

  const activateTemplate = (tpl: TemplateCard) => doBusy(async () => {
    await botFetch(`/templates/${tpl.slug}/activate`, { method: 'POST', body: JSON.stringify({ channels: hasMinPlan('elite') ? tpl.default_channels : ['app', 'email'] }) });
  }, `${tpl.name} ativado`);

  const toggleBot = (bot: UserBot) => doBusy(async () => {
    await botFetch(`/${bot.id}/toggle`, { method: 'POST' });
  }, bot.status === 'active' ? `${bot.name} pausado` : `${bot.name} reativado`);

  const removeBot = (bot: UserBot) => {
    if (!confirm(`Excluir o bot "${bot.name}"?`)) return;
    void doBusy(async () => { await botFetch(`/${bot.id}`, { method: 'DELETE' }); }, `${bot.name} excluído`);
  };

  const scanNow = (botId?: number) => doBusy(async () => {
    await botFetch('/scan-now', { method: 'POST', body: JSON.stringify(botId ? { botId } : {}) });
  }, botId ? 'Bot escaneado' : 'Varredura completa');

  const markResult = (alertId: number, outcome: 'win' | 'loss' | 'void') => doBusy(async () => {
    await botFetch(`/alerts/${alertId}/result`, { method: 'PATCH', body: JSON.stringify({ outcome_status: outcome, roi_units: outcome === 'win' ? 1 : outcome === 'loss' ? -1 : 0 }) });
  }, 'Resultado atualizado');

  const injectDemo = () => doBusy(async () => { await botFetch('/demo-feed', { method: 'POST' }); }, 'Feed demo carregado');

  const ov = payload?.stats.overview;
  const globalHitRate = hitRatePct(ov?.total_wins ?? 0, ov?.total_losses ?? 0);

  if (loading && !payload) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(2,6,23,0.88))] p-16 text-center">
        <div className="relative mb-5">
          <div className="h-14 w-14 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-fuchsia-400" />
          </div>
          <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-fuchsia-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Carregando central de bots…</p>
      </div>
    );
  }

  return (
    <section className="space-y-5">

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[28px] border border-slate-800/80 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.14),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_35%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))]">
        <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-300">
              <Bot className="h-3.5 w-3.5" /> Motor de bots 24/7
            </div>
            <h2 className="mt-3 text-xl font-black text-white">Bots instantâneos — alertas no app, e-mail e WhatsApp</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-400 leading-relaxed">
              Ative bots prontos ou crie os seus. O motor varre jogos ao vivo a cada 60s e dispara alertas pelos canais que você escolher.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {user?.role === 'admin' && (
              <button onClick={() => void injectDemo()} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3.5 py-2 text-xs font-black text-sky-300 hover:bg-sky-500/15 disabled:opacity-50 transition-colors">
                <Target className="h-3.5 w-3.5" /> Feed demo
              </button>
            )}
            <button onClick={() => void scanNow()} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3.5 py-2 text-xs font-black text-fuchsia-300 hover:bg-fuchsia-500/15 disabled:opacity-50 transition-colors">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Siren className="h-3.5 w-3.5" />}
              Escanear agora
            </button>
            <button onClick={() => void load()} disabled={loading || busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-800/80 disabled:opacity-50 transition-colors">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Atualizar
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-px bg-slate-800/40 sm:grid-cols-4">
          {[
            { label: 'Bots ativos',     value: `${ov?.active_bots ?? 0}/${ov?.total_bots ?? 0}`, sub: `${ov?.total_runs ?? 0} varreduras`,            tone: 'text-fuchsia-300', icon: Bot },
            { label: 'Alertas enviados',value: ov?.total_alerts ?? 0,                             sub: 'desde o início',                                tone: 'text-amber-300',   icon: BellRing },
            { label: 'Taxa de acerto',  value: `${globalHitRate}%`,                               sub: `${ov?.total_wins ?? 0}W / ${ov?.total_losses ?? 0}L`, tone: globalHitRate >= 60 ? 'text-emerald-300' : globalHitRate > 0 ? 'text-amber-300' : 'text-slate-400', icon: TrendingUp },
            { label: 'ROI acumulado',   value: `${(ov?.total_roi_units ?? 0).toFixed(1)}u`,       sub: hasMinPlan('elite') ? 'WhatsApp liberado ✓' : 'WhatsApp no Elite', tone: 'text-sky-300', icon: Gauge },
          ].map(({ label, value, sub, tone, icon: Icon }) => (
            <div key={label} className="bg-slate-950/30 px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={cn('h-3.5 w-3.5', tone)} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
              </div>
              <p className={cn('text-2xl font-black tabular-nums leading-none', tone)}>{value}</p>
              <p className="mt-1 text-xs text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main layout: bots grid + templates ──────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">

        {/* Left: bot list + tab toolbar */}
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(2,6,23,0.88))]">

          {/* Tabs */}
          <div className="flex border-b border-slate-800/60">
            {([['bots', 'Meus Bots', Bot], ['alertas', 'Alertas', BellRing], ['feed', 'Feed ao vivo', Wifi]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={cn('flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold border-b-2 transition-all',
                  activeTab === id ? 'text-fuchsia-400 border-fuchsia-500' : 'text-slate-500 border-transparent hover:text-slate-300')}>
                <Icon className="h-3.5 w-3.5" />{label}
                {id === 'alertas' && (payload?.alerts.filter(a => a.outcome_status === 'pending').length ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                    {payload?.alerts.filter(a => a.outcome_status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Bots */}
          {activeTab === 'bots' && (
            <div className="p-4 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar bot…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-fuchsia-500/40 transition-colors" />
                </div>
                {([['all', 'Todos'], ['active', 'Ativos'], ['paused', 'Pausados']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setFilter(id)}
                    className={cn('px-3 py-2 rounded-xl border text-xs font-bold transition-all',
                      filter === id ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300' : 'border-slate-700/60 bg-slate-900/50 text-slate-500 hover:text-slate-300')}>
                    {label}
                  </button>
                ))}
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                  className="px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-900/50 text-xs text-slate-300 outline-none">
                  <option value="recent">Recentes</option>
                  <option value="alerts">+ Alertas</option>
                  <option value="wins">+ Wins</option>
                </select>
              </div>

              {filteredBots.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 py-12 text-center text-sm text-slate-500">
                  Nenhum bot encontrado. Ative um template ao lado →
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredBots.map((bot) => {
                    const hr = hitRatePct(bot.win_count, bot.loss_count);
                    return (
                      <div key={bot.id} className={cn(
                        'rounded-2xl border p-4 space-y-3 transition-all',
                        bot.status === 'active'
                          ? 'border-fuchsia-500/20 bg-[linear-gradient(145deg,rgba(168,85,247,0.07),rgba(2,6,23,0.5))]'
                          : 'border-slate-800/60 bg-slate-950/50',
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                              <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]',
                                bot.status === 'active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700/60 bg-slate-800/60 text-slate-400')}>
                                {bot.status === 'active' ? '● Ativo' : '○ Pausado'}
                              </span>
                              <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-400 font-semibold">
                                {catLabel(bot.category)}
                              </span>
                            </div>
                            <h3 className="text-sm font-black text-white leading-snug">{bot.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">{bot.description || 'Bot personalizado'}</p>
                          </div>
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                            bot.status === 'active' ? 'bg-fuchsia-500/15 border border-fuchsia-500/25' : 'bg-slate-800/60 border border-slate-700/40')}>
                            <Flame className={cn('h-4 w-4', bot.status === 'active' ? 'text-fuchsia-400' : 'text-slate-600')} />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: 'Alertas', value: bot.alert_count, tone: 'text-white' },
                            { label: 'Wins', value: bot.win_count, tone: 'text-emerald-300' },
                            { label: 'Loss', value: bot.loss_count, tone: 'text-red-300' },
                            { label: `ROI`, value: `${bot.roi_units.toFixed(1)}u`, tone: bot.roi_units >= 0 ? 'text-sky-300' : 'text-rose-300' },
                          ].map(({ label, value, tone }) => (
                            <div key={label} className="rounded-xl bg-slate-950/60 border border-slate-800/60 px-2 py-1.5 text-center">
                              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">{label}</p>
                              <p className={cn('text-sm font-black tabular-nums mt-0.5', tone)}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Hit rate bar */}
                        {(bot.win_count + bot.loss_count) > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-slate-500">Taxa de acerto</span>
                              <span className="text-[10px] font-black text-emerald-300">{hr}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" style={{ width: `${hr}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Channels */}
                        <div className="flex flex-wrap gap-1">
                          {bot.channels.map(ch => (
                            <span key={ch} className={cn('rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em]', CHANNEL_LABELS[ch]?.color ?? 'border-slate-700 bg-slate-800 text-slate-400')}>
                              {CHANNEL_LABELS[ch]?.label ?? ch}
                            </span>
                          ))}
                          {bot.next_run_at && (
                            <span className="ml-auto text-[10px] text-slate-600 flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" /> {fmtDate(bot.next_run_at)}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/50">
                          <button onClick={() => void toggleBot(bot)} disabled={busy}
                            className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-colors',
                              bot.status === 'active'
                                ? 'border border-amber-500/25 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15'
                                : 'border border-emerald-500/25 bg-emerald-500/8 text-emerald-300 hover:bg-emerald-500/15')}>
                            {bot.status === 'active' ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                            {bot.status === 'active' ? 'Pausar' : 'Ativar'}
                          </button>
                          <button onClick={() => void scanNow(bot.id)} disabled={busy} title="Escanear agora"
                            className="w-9 h-9 rounded-xl border border-sky-500/25 bg-sky-500/8 text-sky-300 flex items-center justify-center hover:bg-sky-500/15 transition-colors">
                            <Siren className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => removeBot(bot)} disabled={busy} title="Excluir"
                            className="w-9 h-9 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 flex items-center justify-center hover:bg-red-500/15 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Alertas */}
          {activeTab === 'alertas' && (
            <div className="p-4 space-y-3">
              {(payload?.alerts ?? []).length === 0 ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 py-12 text-center text-sm text-slate-500">
                  Nenhum alerta registrado ainda.
                </div>
              ) : (
                (payload?.alerts ?? []).slice(0, 15).map((alert) => {
                  const signal = JSON.parse(alert.signal_json || '{}') as { level?: string; reasons?: string[]; metrics?: { minute?: number } };
                  return (
                    <div key={alert.id} className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-black text-violet-300">{alert.bot_name}</span>
                            <LevelBadge level={signal.level} />
                            <OutcomeBadge status={alert.outcome_status} />
                          </div>
                          <p className="text-sm font-black text-white">{alert.market}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{alert.match_label}{alert.league ? ` · ${alert.league}` : ''}</p>
                          {signal.reasons && signal.reasons.length > 0 && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{signal.reasons.slice(0, 2).join(' • ')}</p>
                          )}
                          <p className="text-[10px] text-slate-600 mt-1">{fmtDate(alert.triggered_at)}{signal.metrics?.minute ? ` · ${signal.metrics.minute}'` : ''}</p>
                        </div>
                        {alert.outcome_status === 'pending' && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => void markResult(alert.id, 'win')}
                              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-500/15 transition-colors">
                              <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />Win
                            </button>
                            <button onClick={() => void markResult(alert.id, 'loss')}
                              className="rounded-xl border border-red-500/25 bg-red-500/8 px-2.5 py-1.5 text-xs font-black text-red-300 hover:bg-red-500/15 transition-colors">
                              Loss
                            </button>
                            <button onClick={() => void markResult(alert.id, 'void')}
                              className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-xs font-black text-slate-400 hover:bg-slate-700/50 transition-colors">
                              Void
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab: Feed */}
          {activeTab === 'feed' && (
            <div className="p-4 space-y-3">
              {(payload?.feed ?? []).length === 0 ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 py-12 text-center">
                  <Wifi className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Feed vazio — injete dados demo ou configure o webhook externo.</p>
                  {user?.role === 'admin' && (
                    <button onClick={() => void injectDemo()} disabled={busy}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-xs font-black text-sky-300 hover:bg-sky-500/15 transition-colors">
                      <Target className="h-3.5 w-3.5" /> Injetar feed demo
                    </button>
                  )}
                </div>
              ) : (
                (payload?.feed ?? []).slice(0, 20).map((entry) => {
                  const raw = (entry.raw ?? {}) as Record<string, number>;
                  return (
                    <div key={entry.matchId} className="rounded-2xl border border-slate-800/60 bg-slate-950/50 p-3.5">
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div>
                          <p className="text-sm font-black text-white">{entry.homeTeam} x {entry.awayTeam}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{entry.league ?? entry.provider ?? 'Feed externo'} · {fmtTime(entry.receivedAt)}</p>
                        </div>
                        {raw.minute != null && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
                            {raw.minute}'
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                        {[
                          { label: 'Pressão', value: raw.homePressure != null ? `${raw.homePressure}/${raw.awayPressure}` : '—' },
                          { label: 'Escanteios', value: raw.homeCorners != null ? `${raw.homeCorners}/${raw.awayCorners}` : '—' },
                          { label: 'Cartões', value: raw.homeCards != null ? `${raw.homeCards}/${raw.awayCards}` : '—' },
                          { label: 'Placar', value: raw.homeScore != null ? `${raw.homeScore}x${raw.awayScore}` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg border border-slate-800/60 bg-slate-950/60 px-2 py-1.5 text-center">
                            <p className="text-slate-600 font-bold">{label}</p>
                            <p className="font-black text-white mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: Templates + Stats by filter */}
        <div className="space-y-4">

          {/* Templates */}
          <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(2,6,23,0.88))]">
            <div className="flex items-center gap-3 border-b border-slate-800/60 px-5 py-4">
              <div className="w-8 h-8 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">IA pronta</p>
                <h3 className="text-sm font-black text-white">Bots prontos para ativar</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {(payload?.templates ?? []).map((tpl) => (
                <div key={tpl.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/50 p-4 hover:border-slate-700/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white leading-snug">{tpl.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[9px] font-bold text-slate-400">{catLabel(tpl.category)}</span>
                        <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[9px] font-bold text-slate-400">{tpl.mode}</span>
                        {tpl.default_channels.map((ch) => (
                          <span key={ch} className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', CHANNEL_LABELS[ch]?.color ?? 'border-slate-700 text-slate-400')}>
                            {CHANNEL_LABELS[ch]?.label ?? ch}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => void activateTemplate(tpl)} disabled={busy}
                      className="flex-shrink-0 flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50 transition-colors">
                      <Plus className="h-3.5 w-3.5" /> Ativar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats by filter */}
          {(payload?.stats.by_filter ?? []).length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(2,6,23,0.88))]">
              <div className="flex items-center gap-3 border-b border-slate-800/60 px-5 py-4">
                <div className="w-8 h-8 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Desempenho</p>
                  <h3 className="text-sm font-black text-white">Efetividade por filtro</h3>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {(payload?.stats.by_filter ?? []).map((row) => {
                  const hr = hitRatePct(row.wins, row.losses);
                  return (
                    <div key={row.category} className="rounded-2xl border border-slate-800/60 bg-slate-950/50 p-3.5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-black text-white">{catLabel(row.category)}</p>
                          <p className="text-xs text-slate-500">{row.alerts} alertas · {row.bots} bot{row.bots !== 1 ? 's' : ''}</p>
                        </div>
                        <span className={cn('text-lg font-black tabular-nums', hr >= 60 ? 'text-emerald-300' : hr > 0 ? 'text-amber-300' : 'text-slate-500')}>
                          {hr}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', hr >= 60 ? 'bg-emerald-500' : hr > 40 ? 'bg-amber-500' : 'bg-slate-600')}
                          style={{ width: `${hr}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WhatsApp status card */}
          <div className={cn('overflow-hidden rounded-3xl border p-5', hasMinPlan('elite') ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800/60 bg-slate-950/50')}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', hasMinPlan('elite') ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-slate-800/60 border border-slate-700/40')}>
                <MessageCircle className={cn('h-4 w-4', hasMinPlan('elite') ? 'text-emerald-400' : 'text-slate-600')} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Canais</p>
                <p className={cn('text-sm font-black', hasMinPlan('elite') ? 'text-emerald-300' : 'text-slate-400')}>
                  {hasMinPlan('elite') ? 'WhatsApp liberado ✓' : 'WhatsApp no plano Elite'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {(['app', 'email', 'whatsapp'] as const).map(ch => (
                <span key={ch} className={cn('rounded-full border px-2.5 py-1 font-black', CHANNEL_LABELS[ch].color)}>
                  {CHANNEL_LABELS[ch].label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              {hasMinPlan('elite')
                ? 'Configure WHATSAPP_TOKEN + WHATSAPP_PHONE_ID no servidor e adicione seu telefone no perfil.'
                : 'Sem canal configurado, alertas chegam no app. WhatsApp e e-mail precisam do plano Elite + credenciais no servidor.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
