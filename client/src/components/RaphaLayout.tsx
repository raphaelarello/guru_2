"use client";

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
  BellRing,
  Bot,
  Calendar,
  ChevronRight,
  Clock3,
  Flame,
  Home,
  LogOut,
  Menu,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSSE } from "@/hooks/useSSE";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const primaryNav = [
  { path: "/painel", label: "Painel", icon: Home },
  { path: "/ao-vivo", label: "Ao Vivo", icon: Radio, badge: "LIVE" },
  { path: "/jogos-hoje", label: "Jogos", icon: Calendar },
  { path: "/pitacos", label: "Pitacos", icon: Sparkles },
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/apostas", label: "Kelly", icon: Wallet },
];

const secondaryNav = [
  { path: "/times", label: "Times", icon: Users },
  { path: "/ligas", label: "Ligas", icon: Trophy },
  { path: "/estatisticas", label: "Estatísticas", icon: Activity },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

interface RaphaLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function initials(name?: string | null) {
  if (!name) return "RG";
  return name
    .split(" ")
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join("");
}

export default function RaphaLayout({ children, title, subtitle }: RaphaLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout, loading } = useAuth();
  const notificationCounts = useNotifications();
  const { connected, naoLidas } = useSSE({ enabled: isAuthenticated });

  const pageMeta = useMemo(() => {
    const item = [...primaryNav, ...secondaryNav].find(entry => location.startsWith(entry.path));
    return {
      label: title ?? item?.label ?? "Rapha Guru",
      subtitle:
        subtitle ??
        (location === "/ao-vivo"
          ? "Monitoramento em tempo real com destaque para jogos quentes."
          : location === "/pitacos"
          ? "Predições, confiança e valor em uma experiência mais premium."
          : "Painel esportivo moderno, rápido e orientado a ação."),
    };
  }, [location, subtitle, title]);

  const shell = (
    <aside className="flex h-full w-full flex-col rounded-[30px] border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
      <div className="hero-glow sports-surface rounded-[28px] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_0_24px_rgba(124,255,93,0.18)]">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80">Rapha Guru</p>
            <h1 className="text-lg font-black">Sports Intelligence</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-balance">
          Produto esportivo mais rápido, visual e vivo para operação diária.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Core</p>
        {primaryNav.map(item => {
          const Icon = item.icon;
          const active = location === item.path || location.startsWith(`${item.path}/`);
          const count =
            item.path === "/bots"
              ? notificationCounts.bots
              : item.path === "/ao-vivo"
              ? notificationCounts.aoVivo
              : item.path === "/pitacos"
              ? notificationCounts.pitacos
              : 0;

          return (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                active
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(124,255,93,0.16)]"
                  : "border-transparent bg-white/[0.03] text-slate-200 hover:border-white/10 hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl border transition-colors",
                  active ? "border-black/10 bg-black/15" : "border-white/10 bg-black/15 group-hover:border-primary/25"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn("chip text-[10px]", active ? "border-black/10 bg-black/15 text-white" : "chip-live")}>
                  {item.badge}
                </span>
              )}
              {!!count && !item.badge && <span className="chip chip-success">{count}</span>}
            </a>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Explorar</p>
        {secondaryNav.map(item => {
          const Icon = item.icon;
          const active = location === item.path || location.startsWith(`${item.path}/`);
          return (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                active
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-transparent bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/[0.05]"
              )}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-xl border", active ? "border-primary/25 bg-primary/10" : "border-white/10 bg-black/15")}>
                <Icon className="size-4" />
              </span>
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="size-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
            </a>
          );
        })}
      </div>

      <div className="mt-auto space-y-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <span className="chip chip-info">
            <Clock3 className="size-3.5" />
            Tempo real
          </span>
          <span className={cn("chip", connected ? "chip-success" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}>
            {connected ? "Conectado" : "Reconectando"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Alertas</p>
            <p className="mt-2 text-2xl font-black">{naoLidas}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Bots</p>
            <p className="mt-2 text-2xl font-black">{notificationCounts.bots}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center rounded-[32px] border border-white/10 bg-black/20 p-8 backdrop-blur-xl">
          <div className="hero-glow sports-surface max-w-xl rounded-[32px] p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-primary/20 text-primary">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Rapha Guru</h1>
            <p className="mt-3 text-lg text-muted-foreground text-balance">
              Acesso premium ao seu cockpit esportivo. Visual novo, navegação mais rápida e leitura muito mais clara.
            </p>
            <Button className="mt-8" size="lg" onClick={() => (window.location.href = "/api/oauth/login")}>
              Entrar no sistema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1800px] gap-4">
        <div className="hidden w-[310px] shrink-0 xl:block">{shell}</div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 xl:hidden" onClick={() => setMobileOpen(false)}>
            <div className="h-full w-[320px] p-3" onClick={e => e.stopPropagation()}>
              {shell}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="glass-panel sticky top-3 z-40 rounded-[28px] border px-4 py-3 md:px-5">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="xl:hidden" onClick={() => setMobileOpen(v => !v)}>
                {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip chip-live animate-pulse-ring">
                    <Radio className="size-3" />
                    LIVE UI
                  </span>
                  <span className="chip chip-info">
                    <BellRing className="size-3.5" />
                    {naoLidas} notificações
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black md:text-3xl">{pageMeta.label}</h2>
                    <p className="text-sm text-muted-foreground">{pageMeta.subtitle}</p>
                  </div>
                  <div className="hidden items-center gap-2 md:flex">
                    <span className="chip">
                      <Activity className="size-3.5" />
                      Operação ativa
                    </span>
                    <span className={cn("chip", connected ? "chip-success" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}>
                      {connected ? "SSE OK" : "Reconectando"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Usuário</p>
                  <p className="max-w-[160px] truncate text-sm font-semibold">{(user as any)?.name ?? "Operador"}</p>
                </div>
                <Avatar className="size-11 border border-white/10">
                  <AvatarFallback className="bg-primary/20 text-primary">{initials((user as any)?.name)}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="icon" onClick={() => void logout()}>
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
