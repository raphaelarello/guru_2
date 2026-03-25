"use client";

import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
  BarChart2,
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  Clock3,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSSE } from "@/hooks/useSSE";
import { useNotifications } from "@/hooks/useNotifications";

const mainNav = [
  { path: "/painel", label: "Painel", icon: LayoutDashboard, badge: "HQ" },
  { path: "/ao-vivo", label: "Ao Vivo", icon: Activity, badge: "Live" },
  { path: "/jogos-hoje", label: "Jogos de Hoje", icon: Calendar },
  { path: "/pitacos", label: "Pitacos", icon: Sparkles },
  { path: "/apostas", label: "Apostas", icon: Zap },
  { path: "/destaques", label: "Destaques", icon: Flame },
  { path: "/estatisticas", label: "Estatísticas", icon: BarChart2 },
  { path: "/times", label: "Times", icon: Users },
  { path: "/ligas", label: "Ligas", icon: Trophy },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

const quickNav = [
  { path: "/bots", label: "Bots IA", icon: Bot },
  { path: "/auditoria", label: "Auditoria", icon: ShieldCheck },
  { path: "/historico-ao-vivo", label: "Histórico", icon: Clock3 },
];

interface RaphaLayoutProps {
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

function initialsFromName(name?: string | null) {
  if (!name) return "RG";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function RaphaLayout({
  children,
  title = "Rapha Guru",
  eyebrow = "Sistema esportivo premium",
  actions,
}: RaphaLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const counts = useNotifications();
  const { connected, naoLidas } = useSSE({ enabled: isAuthenticated });
  const alertasQuery = trpc.alertas.list.useQuery(undefined, { enabled: isAuthenticated });
  const alertasPendentes = alertasQuery.data?.filter((a) => a.resultado === "pendente").length ?? 0;

  const unreadCount = naoLidas + (counts.alertas || 0) + alertasPendentes;

  const topStatus = useMemo(
    () => [
      {
        label: connected ? "Ao vivo conectado" : "Reconectando",
        value: connected ? "Realtime" : "Offline",
        icon: connected ? Wifi : WifiOff,
        tone: connected ? "text-emerald-300" : "text-red-300",
      },
      {
        label: "Alertas",
        value: String(alertasPendentes),
        icon: Bell,
        tone: unreadCount > 0 ? "text-cyan-300" : "text-slate-300",
      },
      {
        label: "Sinais",
        value: String(counts.pitacos || 0),
        icon: Sparkles,
        tone: "text-lime-300",
      },
    ],
    [connected, unreadCount, counts.pitacos, alertasPendentes],
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-strong gradient-outline relative w-full max-w-lg overflow-hidden rounded-[28px] p-8 text-center"
        >
          <div className="pointer-events-none absolute inset-0 field-lines opacity-25" />
          <div className="relative space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-lime-400/15 text-lime-300 shadow-[0_0_50px_rgba(163,230,53,0.12)]">
              <Trophy className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <p className="sport-chip mx-auto w-fit border-lime-400/30 bg-lime-400/10 text-lime-200">Rapha Guru</p>
              <h1 className="sport-title">Inteligência esportiva com cara de produto premium</h1>
              <p className="mx-auto max-w-md text-sm leading-6 text-slate-300">
                Redesenhamos a casca para deixar o sistema mais veloz, visual e memorável, mantendo sua operação intacta.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 rounded-2xl bg-lime-400 px-6 text-slate-950 hover:bg-lime-300"
              onClick={() => {
                window.location.href = "/api/oauth/login";
              }}
            >
              Entrar no sistema
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-lime-400/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1800px]">
        <AnimatePresence>
          {(mobileOpen || typeof window === "undefined") && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: mobileOpen ? 1 : 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden",
                !mobileOpen && "pointer-events-none",
              )}
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: mobileOpen ? 0 : -20, opacity: mobileOpen || typeof window === "undefined" ? 1 : 1 }}
          className={cn(
            "glass-card-strong fixed inset-y-3 left-3 z-50 flex w-[290px] flex-col overflow-hidden rounded-[30px] border-white/10 lg:sticky lg:left-0 lg:top-0 lg:z-10 lg:m-3 lg:h-[calc(100vh-24px)] lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-[110%] lg:translate-x-0",
          )}
        >
          <div className="border-b border-white/8 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="sport-chip w-fit bg-lime-400/10 text-lime-200">Sports OS</p>
                <h1 className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">Rapha Guru</h1>
                <p className="mt-1 text-sm text-slate-400">Radar ao vivo, insights e execução rápida.</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto px-4 py-5">
            <div className="space-y-2">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Navegação</p>
              <nav className="space-y-2">
                {mainNav.map((item) => {
                  const isActive = location === item.path || (location === "/" && item.path === "/painel");
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <a
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group flex items-center justify-between rounded-2xl border px-3 py-3 transition-all duration-300",
                          isActive
                            ? "border-lime-400/35 bg-lime-400/12 text-white shadow-[0_0_40px_rgba(163,230,53,0.10)]"
                            : "border-white/6 bg-white/[0.025] text-slate-300 hover:border-white/12 hover:bg-white/[0.05]",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-2xl border transition-all",
                              isActive
                                ? "border-lime-400/35 bg-lime-400/15 text-lime-200"
                                : "border-white/8 bg-slate-900/70 text-slate-400 group-hover:text-white",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{item.label}</span>
                            <span className="block text-xs text-slate-500">
                              {item.path === "/ao-vivo"
                                ? "Monitoramento em tempo real"
                                : item.path === "/pitacos"
                                ? "Recomendações e sinais"
                                : "Navegação principal"}
                            </span>
                          </span>
                        </span>
                        {item.badge ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5" />
                        )}
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Atalhos</p>
              <div className="grid grid-cols-1 gap-2">
                {quickNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <a
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/8 hover:text-white"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-slate-950/70 text-cyan-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 p-4">
            <div className="glass-card rounded-[24px] p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-white/10 bg-slate-900/80">
                  <AvatarFallback className="bg-slate-800 text-slate-100">
                    {initialsFromName((user as any)?.name || (user as any)?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{(user as any)?.name || "Operador"}</p>
                  <p className="truncate text-xs text-slate-400">{(user as any)?.email || "Sessão autenticada"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => logout?.()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col px-3 pb-3 pt-3 lg:pl-0">
          <header className="glass-card-strong sticky top-3 z-30 overflow-hidden rounded-[28px] px-4 py-4 sm:px-5">
            <div className="pointer-events-none absolute inset-0 field-lines opacity-[0.08]" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl border border-white/10 bg-white/5 lg:hidden"
                    onClick={() => setMobileOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-white sm:text-3xl">{title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {actions}
                  <Link href="/notificacoes">
                    <a className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/35 hover:bg-cyan-400/10">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 min-w-[1.35rem] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </a>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
                <div className="glass-card rounded-[24px] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="sport-chip border-red-400/30 bg-red-500/10 text-red-200">
                      <span className="live-dot" />
                      cobertura ao vivo
                    </span>
                    <span className="text-sm text-slate-300">
                      Interface redesenhada para leitura rápida, tomada de decisão e sensação de produto premium.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {topStatus.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="glass-card rounded-[22px] px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <Icon className={cn("h-4 w-4", item.tone)} />
                          <span className={cn("text-sm font-black tracking-[-0.04em]", item.tone)}>{item.value}</span>
                        </div>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 py-4">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="min-h-[calc(100vh-170px)]"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
