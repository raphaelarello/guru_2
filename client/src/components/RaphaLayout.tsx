
"use client";

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard, Menu, X, LogOut, Radio, Wallet, Sparkles, Bot,
  Trophy, Users, BarChart3, Settings, BellRing, Wifi, WifiOff, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useSSE } from "@/hooks/useSSE";

const navItems = [
  { path: "/painel", label: "Painel", icon: LayoutDashboard },
  { path: "/ao-vivo", label: "Ao Vivo", icon: Radio, badge: "AO VIVO" },
  { path: "/jogos-hoje", label: "Jogos", icon: CalendarDays },
  { path: "/apostas", label: "Apostas", icon: Wallet },
  { path: "/pitacos", label: "Pitacos", icon: Sparkles },
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/ligas", label: "Ligas", icon: Trophy },
  { path: "/times", label: "Times", icon: Users },
  { path: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

interface RaphaLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function faixaCor(prioridade?: string) {
  if (prioridade === "critica") return "text-red-200 border-red-500/25 bg-red-500/10";
  if (prioridade === "alta") return "text-amber-200 border-amber-500/25 bg-amber-500/10";
  return "text-cyan-100 border-cyan-500/20 bg-cyan-500/10";
}

export default function RaphaLayout({ children, title, subtitle }: RaphaLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { connected, naoLidas } = useSSE({ enabled: isAuthenticated });
  const { data: apiUsage } = trpc.football.apiUsage.useQuery(undefined, { enabled: isAuthenticated });
  const { data: alertas = [] } = trpc.football.centralAlertas.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 20000,
  });

  const ticker = useMemo(() => alertas.slice(0, 8), [alertas]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08101c] p-4 text-white">
        <div className="text-center">
          <h1 className="mb-3 text-3xl font-black">RaphaGuru</h1>
          <p className="mb-6 text-slate-400">Central esportiva inteligente</p>
          <Button onClick={() => (window.location.href = "/api/oauth/login")}>Entrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0d1d3b_0%,#08101c_32%,#060b14_100%)] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#08101c]/92 backdrop-blur-xl">
        <div className="border-b border-white/6">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 md:px-5">
            <a href="/painel" className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-400 ring-1 ring-emerald-400/20">
              <Radio className="h-5 w-5" />
            </a>

            <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
              {ticker.length > 0 ? (
                <div className="alerta-marquee relative min-w-0 flex-1 overflow-hidden rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
                  <div className="alerta-marquee-track flex items-center gap-3 whitespace-nowrap text-[12px] text-slate-200">
                    {ticker.concat(ticker).map((alerta, idx) => (
                      <a
                        key={`${alerta.fixtureId}-${idx}`}
                        href={alerta.fixtureId ? `/ao-vivo?jogo=${alerta.fixtureId}` : "/ao-vivo"}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${faixaCor(alerta.prioridade)}`}
                      >
                        <span className="font-semibold">{alerta.titulo}</span>
                        <span className="text-slate-300">{alerta.resumo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[12px] text-slate-400">
                  Central de Alertas aguardando eventos relevantes...
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300">
                {connected ? <Wifi className="mr-1 inline h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="mr-1 inline h-3.5 w-3.5 text-red-400" />}
                {connected ? "Tempo real ativo" : "Conexão em espera"}
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300">
                <BellRing className="mr-1 inline h-3.5 w-3.5 text-cyan-300" />
                {naoLidas} notificações
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300">
                API {apiUsage?.percent ?? 0}% usada
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-right md:block">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Usuário</div>
                <div className="text-sm font-semibold text-white">{user?.name || "Usuário"}</div>
              </div>
              <Avatar className="h-10 w-10 bg-emerald-500/15 ring-1 ring-emerald-400/20">
                <AvatarFallback className="bg-transparent font-bold text-emerald-300">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={logout} className="rounded-full border border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/8 hover:text-white">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)} className="md:hidden rounded-full border border-white/8 bg-white/[0.03] text-slate-300">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-2 py-2 md:px-4">
          <nav className="hidden gap-2 overflow-x-auto md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const ativo = location === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                    ativo
                      ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                      : "border-white/8 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge ? <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-200">{item.badge}</span> : null}
                </a>
              );
            })}
          </nav>

          {mobileOpen ? (
            <nav className="grid grid-cols-2 gap-2 md:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const ativo = location === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className={[
                      "inline-flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                      ativo
                        ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                        : "border-white/8 bg-white/[0.03] text-slate-200",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-3 py-4 md:px-5 md:py-5">
        {(title || subtitle) ? (
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              {title ? <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</h1> : null}
              {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
