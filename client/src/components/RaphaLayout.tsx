import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard, Radio, Bot, TrendingUp, History,
  MessageSquare, ChevronLeft, ChevronRight, LogOut,
  User, Zap, Shield, Menu, X, Bell, Calendar, Users, Trophy,
  BellRing, CheckCheck, Trash2, Wifi, WifiOff, Thermometer, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useSSE } from "@/hooks/useSSE";

const navItems = [
  { path: "/pitacos", label: "Pitacos", icon: MessageSquare, badge: null },
  { path: "/painel", label: "Painel", icon: LayoutDashboard, badge: null },
  { path: "/ao-vivo", label: "Ao Vivo", icon: Radio, badge: "LIVE", badgeClass: "pulse-live bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold" },
  { path: "/jogos-hoje", label: "Jogos de Hoje", icon: Calendar, badge: null, badgeClass: "" },
  { path: "/bots", label: "RAPHA Bots", icon: Bot, badge: "PRO", badgeClass: "bg-primary/20 text-primary border border-primary/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold" },
  { path: "/kelly", label: "Kelly Tracker", icon: TrendingUp, badge: null },
  { path: "/auditoria", label: "Auditoria", icon: History, badge: null },
  { path: "/times", label: "Estatísticas Times", icon: Users, badge: null },
  { path: "/ligas", label: "Ligas", icon: Trophy, badge: null },
  { path: "/historico-ao-vivo", label: "Histórico Ao Vivo", icon: Thermometer, badge: null },
  { path: "/configuracoes", label: "Configurações", icon: Settings, badge: null },
];

interface RaphaLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function RaphaLayout({ children, title }: RaphaLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const alertasQuery = trpc.alertas.list.useQuery(undefined, { enabled: isAuthenticated });
  const alertasPendentes = alertasQuery.data?.filter(a => a.resultado === "pendente").length ?? 0;
  const [painelNotif, setPainelNotif] = useState(false);
  const { notifications, connected, naoLidas, marcarTodasLidas, limpar } = useSSE({ enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 neon-glow flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary neon-text">RAPHA GURU</h1>
              <p className="text-muted-foreground text-sm">Plataforma de Apostas com IA</p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-md">
            Acesse a plataforma mais avançada de análise esportiva com inteligência artificial, bots automáticos e Kelly Tracker.
          </p>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-semibold px-8"
            onClick={() => window.location.href = getLoginUrl()}
          >
            <Zap className="w-5 h-5 mr-2" />
            Entrar na Plataforma
          </Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-lg bg-primary/20 neon-glow flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-lg text-primary neon-text">RAPHA GURU</span>
            <p className="text-[10px] text-muted-foreground leading-none">Apostas com IA</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path === "/painel" && location === "/");
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group
                  ${isActive
                    ? "bg-primary/15 text-primary neon-border border"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                  }`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                {!collapsed && (
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className={item.badgeClass}>{item.badge}</span>
                )}
                {!collapsed && item.path === "/bots" && alertasPendentes > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {alertasPendentes}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status do sistema */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary pulse-live" />
            <span>Sistema Online</span>
          </div>
        </div>
      )}

      {/* Usuário */}
      <div className={`p-3 border-t border-sidebar-border ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <Avatar className="w-8 h-8 cursor-pointer" onClick={() => logout()}>
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent />
        {/* Botão colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full w-5 h-10 bg-sidebar border border-sidebar-border rounded-r-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors z-10"
          style={{ left: collapsed ? "3.5rem" : "14.5rem" }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Sidebar Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            {title && (
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Sino de notificações SSE */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setPainelNotif(p => !p)}
              >
                {naoLidas > 0 ? (
                  <BellRing className="w-5 h-5 text-primary animate-bounce" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
                {naoLidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </span>
                )}
              </Button>

              {/* Painel de notificações */}
              {painelNotif && (
                <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Notificações</span>
                      {connected ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-400">
                          <Wifi className="w-3 h-3" /> Ao vivo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-red-400">
                          <WifiOff className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {notifications.length > 0 && (
                        <>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={marcarTodasLidas} title="Marcar todas como lidas">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={limpar} title="Limpar tudo">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setPainelNotif(false)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma notificação</p>
                        <p className="text-xs mt-1 opacity-60">Alertas de bots aparecem aqui em tempo real</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                            n.lida ? "opacity-60" : "bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0">
                              {n.type === "bot_sinal" ? "🤖" :
                               n.type === "resultado" ? (n.message.includes("🟢") ? "🟢" : "🔴") :
                               n.type === "alerta" ? "⚡" : "ℹ️"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {new Date(n.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            {!n.lida && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground hidden sm:block">
                {user?.role === "admin" ? "Admin" : "Pro"}
              </span>
            </div>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
