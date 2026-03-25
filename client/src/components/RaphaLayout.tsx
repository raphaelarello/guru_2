
"use client";

import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
  BellRing,
  Bot,
  Calendar,
  Flame,
  Home,
  LogOut,
  Menu,
  Radio,
  Settings,
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
  { path: "/apostas", label: "Apostas", icon: Wallet },
  { path: "/pitacos", label: "Pitacos", icon: Sparkles },
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/ligas", label: "Ligas", icon: Trophy },
  { path: "/times", label: "Times", icon: Users },
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
    .map(part => part[0]?.toUpperCase())
    .join("");
}

export default function RaphaLayout({ children, title, subtitle }: RaphaLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout, loading } = useAuth();
  const notificationCounts = useNotifications();
  const { connected, naoLidas } = useSSE({ enabled: isAuthenticated });

  const pageMeta = useMemo(() => {
    const current = primaryNav.find(item => location === item.path || location.startsWith(`${item.path}/`));
    return {
      title: title ?? current?.label ?? "Rapha Guru",
      subtitle:
        subtitle ??
        (location === "/ao-vivo"
          ? "Leitura instantânea de jogo, pressão, eventos e sinais ao vivo."
          : location === "/jogos-hoje"
          ? "Calendário operacional com filtros rápidos, próximos, ao vivo e encerrados."
          : "Cockpit esportivo premium com foco em decisão rápida."),
    };
  }, [location, subtitle, title]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center rounded-[32px] border border-white/10 bg-black/20 p-8 backdrop-blur-xl">
          <div className="hero-glow sports-surface max-w-xl rounded-[32px] p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-primary/20 text-primary">
              <Flame className="size-8" />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Rapha Guru</h1>
            <p className="mt-3 text-lg text-muted-foreground text-balance">
              Entre no cockpit esportivo com visual novo, leitura mais clara e navegação muito mais rápida.
            </p>
            <Button className="mt-8" size="lg" onClick={() => (window.location.href = "/api/oauth/login")}>
              Entrar no sistema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navContent = (
    <nav className="flex flex-wrap gap-2">
      {primaryNav.map(item => {
        const Icon = item.icon;
        const active = location === item.path || location.startsWith(`${item.path}/`);
        const badge =
          item.path === "/ao-vivo"
            ? connected
              ? item.badge ?? "LIVE"
              : "REC"
            : item.path === "/bots"
            ? notificationCounts.bots || null
            : item.path === "/pitacos"
            ? notificationCounts.pitacos || null
            : null;

        return (
          <Link key={item.path} href={item.path}>
            <a
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                active
                  ? "border-primary/30 bg-primary/15 text-primary shadow-[0_10px_30px_rgba(124,255,93,0.12)]"
                  : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border",
                  active ? "border-primary/20 bg-primary/10" : "border-white/10 bg-black/20"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span>{item.label}</span>
              {badge ? (
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", item.path === "/ao-vivo" ? "bg-red-500/15 text-red-300" : "bg-cyan-500/15 text-cyan-300")}>
                  {badge}
                </span>
              ) : null}
            </a>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen p-3 md:p-4">
      <div className="mx-auto max-w-[1860px]">
        <header className="glass-panel sticky top-2 z-40 overflow-hidden rounded-[28px] border px-3 py-3 md:px-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="xl:hidden" onClick={() => setMobileOpen(value => !value)}>
                {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary md:flex">
                  <Flame className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip chip-live">
                      <Radio className="size-3.5" />
                      Realtime
                    </span>
                    <span className="chip chip-info">
                      <BellRing className="size-3.5" />
                      {naoLidas} notificações
                    </span>
                    <span className={cn("chip", connected ? "chip-success" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}>
                      {connected ? "SSE OK" : "Reconectando"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h1 className="truncate text-xl font-black md:text-2xl">{pageMeta.title}</h1>
                    <p className="text-sm text-muted-foreground">{pageMeta.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Usuário</p>
                  <p className="max-w-[180px] truncate text-sm font-semibold">{(user as any)?.name ?? "Operador"}</p>
                </div>
                <Avatar className="size-11 border border-white/10">
                  <AvatarFallback className="bg-primary/20 text-primary">{initials((user as any)?.name)}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="icon" onClick={() => void logout()}>
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>

            <div className="hidden xl:block">{navContent}</div>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 xl:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute left-3 right-3 top-20 max-h-[70vh] overflow-y-auto rounded-[28px] border border-white/10 bg-[#09101d] p-4 shadow-2xl" onClick={event => event.stopPropagation()}>
              {navContent}
            </div>
          </div>
        )}

        <main className="pt-4">{children}</main>
      </div>
    </div>
  );
}
