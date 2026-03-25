"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard, Menu, X, LogOut, Home, Zap, TrendingUp,
  Calendar, Users, Trophy, BellRing, CheckCheck, Trash2,
  Wifi, WifiOff, Thermometer, Settings, Star, ChevronDown,
  BarChart2, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useSSE } from "@/hooks/useSSE";
import { useNotifications } from "@/hooks/useNotifications";

// ─── Botões da barra inferior (os 4 principais) ──────────────────────────────
const bottomNavItems = [
  {
    path: "/bots",
    label: "Bots IA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1" />
        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
      </svg>
    ),
    badge: "PRO",
  },
  {
    path: "/ao-vivo",
    label: "Ao Vivo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
    badge: "LIVE",
  },
  {
    path: "/pitacos",
    label: "Pitacos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    ),
    badge: null,
  },
  {
    path: "/destaques",
    label: "Destaques",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
    badge: null,
  },
];

// ─── Todos os itens de navegação (para o menu do topo) ───────────────────────
const allNavItems = [
  { path: "/painel", label: "Painel", icon: LayoutDashboard },
  { path: "/jogos-hoje", label: "Jogos de Hoje", icon: Calendar },
  { path: "/apostas", label: "Apostas", icon: TrendingUp },
  { path: "/auditoria", label: "Auditoria", icon: History },
  { path: "/times", label: "Estatísticas Times", icon: Users },
  { path: "/ligas", label: "Ligas", icon: Trophy },
  { path: "/artilheiros", label: "Artilheiros", icon: TrendingUp },
  { path: "/estatisticas", label: "Estatísticas", icon: BarChart2 },
  { path: "/historico-ao-vivo", label: "Histórico Ao Vivo", icon: Thermometer },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

interface RaphaLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function RaphaLayout({ children, title }: RaphaLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const notificationCounts = useNotifications();

  const alertasQuery = trpc.alertas.list.useQuery(undefined, { enabled: isAuthenticated });
  const alertasPendentes = alertasQuery.data?.filter(a => a.resultado === "pendente").length ?? 0;
  const [painelNotif, setPainelNotif] = useState(false);
  const { notifications, connected, naoLidas, marcarTodasLidas, limpar } = useSSE({ enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">RaphaGuru</h1>
          <p className="text-slate-400 mb-8">Análise Esportiva Inteligente</p>
          <Button onClick={() => window.location.href = "/api/oauth/login"}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header Superior */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">RaphaGuru</h1>
            {title && <span className="text-slate-400 text-sm">/ {title}</span>}
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                className="text-slate-300 hover:text-white"
              >
                Menu <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              {desktopMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50">
                  {allNavItems.map((item) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-2 px-4 py-2 text-sm ${
                          isActive
                            ? "bg-slate-800 text-green-400"
                            : "text-slate-300 hover:bg-slate-800 hover:text-green-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notificações */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPainelNotif(!painelNotif)}
                className="text-slate-300 hover:text-white relative"
              >
                <BellRing className="w-5 h-5" />
                {naoLidas > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>

              {painelNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Notificações</h3>
                    <div className="flex gap-2">
                      {naoLidas > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={marcarTodasLidas}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Marcar lidas
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={limpar}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">Sem notificações</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg text-sm ${
                              notif.lida
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-700 text-white border border-slate-600"
                            }`}
                          >
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-xs mt-1">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status da Conexão SSE */}
            <div className="flex items-center gap-2 text-xs">
              {connected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">Desconectado</span>
                </>
              )}
            </div>

            {/* Perfil do Usuário */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name || "Usuário"}</p>
                <p className="text-xs text-slate-400">{user?.email || ""}</p>
              </div>
              <Avatar className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500">
                <AvatarFallback className="text-white font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-2">
            {allNavItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                    isActive
                      ? "bg-slate-800 text-green-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-green-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {children}
      </main>

      {/* Barra de Navegação Inferior (Mobile/Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl">
        <div className="flex justify-around">
          {bottomNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all duration-300 relative group ${
                  isActive
                    ? "text-green-400"
                    : "text-slate-400 hover:text-green-300"
                }`}
              >
                {/* Ícone com efeito glow */}
                <div
                  className={`w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                    isActive ? "scale-125" : "group-hover:scale-110"
                  }`}
                  style={{
                    filter: isActive
                      ? "drop-shadow(0 0 12px rgba(34,197,94,0.8))"
                      : "drop-shadow(0 0 6px rgba(34,197,94,0.4))",
                  }}
                >
                  {typeof item.icon === "string" ? (
                    <span>{item.icon}</span>
                  ) : (
                    item.icon
                  )}
                </div>

                {/* Label */}
                <span className="text-[10px] mt-1 font-semibold text-center leading-tight">
                  {item.label}
                </span>

                {/* Badge LIVE pulsante */}
                {item.badge === "LIVE" && !isActive && (
                  <span
                    className="absolute top-2 right-[14%] w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"
                    style={{
                      boxShadow: "0 0 12px rgba(239,68,68,0.9), inset 0 0 4px rgba(255,255,255,0.4)",
                    }}
                  />
                )}

                {/* Badge PRO */}
                {item.badge === "PRO" && (
                  <span
                    className="absolute top-1.5 right-[12%] text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,255,136,0.35) 0%, rgba(0,204,102,0.25) 100%)",
                      color: "#00ff88",
                      border: "1px solid rgba(0,255,136,0.5)",
                      boxShadow: "0 0 8px rgba(0,255,136,0.4), inset 0 0 4px rgba(255,255,255,0.2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Pro
                  </span>
                )}

                {/* Badges com contadores de notificações */}
                {item.path === "/bots" && notificationCounts.bots > 0 && (
                  <span
                    className="absolute top-1.5 right-[12%] w-5 h-5 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse"
                    style={{
                      boxShadow: "0 0 12px rgba(34,197,94,0.8), inset 0 0 4px rgba(255,255,255,0.3)",
                    }}
                  >
                    {notificationCounts.bots > 9 ? "9+" : notificationCounts.bots}
                  </span>
                )}
                {item.path === "/ao-vivo" && notificationCounts.aoVivo > 0 && (
                  <span
                    className="absolute top-1.5 right-[12%] w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse"
                    style={{
                      boxShadow: "0 0 12px rgba(239,68,68,0.8), inset 0 0 4px rgba(255,255,255,0.3)",
                    }}
                  >
                    {notificationCounts.aoVivo > 9 ? "9+" : notificationCounts.aoVivo}
                  </span>
                )}
                {item.path === "/pitacos" && notificationCounts.pitacos > 0 && (
                  <span
                    className="absolute top-1.5 right-[12%] w-5 h-5 bg-yellow-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse"
                    style={{
                      boxShadow: "0 0 12px rgba(234,179,8,0.8), inset 0 0 4px rgba(255,255,255,0.3)",
                    }}
                  >
                    {notificationCounts.pitacos > 9 ? "9+" : notificationCounts.pitacos}
                  </span>
                )}
                {item.path === "/destaques" && notificationCounts.destaques > 0 && (
                  <span
                    className="absolute top-1.5 right-[12%] w-5 h-5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse"
                    style={{
                      boxShadow: "0 0 12px rgba(59,130,246,0.8), inset 0 0 4px rgba(255,255,255,0.3)",
                    }}
                  >
                    {notificationCounts.destaques > 9 ? "9+" : notificationCounts.destaques}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
