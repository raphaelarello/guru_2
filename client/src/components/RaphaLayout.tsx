import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard, Radio, Bot, TrendingUp, History,
  MessageSquare, LogOut, Zap, Shield, Menu, X, Bell,
  Calendar, Users, Trophy, BellRing, CheckCheck, Trash2,
  Wifi, WifiOff, Thermometer, Settings, Star, ChevronDown,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useSSE } from "@/hooks/useSSE";

// ─── Botões da barra inferior (os 4 principais) ──────────────────────────────
const bottomNavItems = [
  {
    path: "/bots",
    label: "Bots",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
        <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    badge: "PRO",
  },
  {
    path: "/ao-vivo",
    label: "Radar Esportivo",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M5.636 18.364a9 9 0 0 1 0-12.728" />
        <path d="M18.364 5.636a9 9 0 0 1 0 12.728" />
        <path d="M8.464 15.536a5 5 0 0 1 0-7.072" />
        <path d="M15.536 8.464a5 5 0 0 1 0 7.072" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    badge: "LIVE",
  },
  {
    path: "/pitacos",
    label: "Pitacos",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="9" y1="14" x2="13" y2="14" />
      </svg>
    ),
    badge: null,
  },
  {
    path: "/destaques",
    label: "Destaques",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    badge: "EM BREVE",
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
            Acesse a plataforma mais avançada de análise esportiva com inteligência artificial, bots automáticos e Apostas.
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

  const activeBottomItem = bottomNavItems.find(
    item => location === item.path || (item.path === "/ao-vivo" && location.startsWith("/ao-vivo"))
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ─── HEADER SUPERIOR ─────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-3 md:px-5 bg-card/80 backdrop-blur-sm flex-shrink-0 z-40">

        {/* Esquerda: Logo + Menu principal */}
        <div className="flex items-center gap-3">
          <Link href="/painel">
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <div className="w-8 h-8 rounded-lg bg-primary/20 neon-glow flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-base text-primary neon-text hidden sm:block">RAPHA GURU</span>
            </div>
          </Link>

          {/* Separador */}
          <div className="hidden md:block w-px h-6 bg-border mx-1" />

          {/* Navegação desktop — itens principais visíveis */}
          <nav className="hidden md:flex items-center gap-1">
            {allNavItems.slice(0, 4).map(item => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path === "/apostas" && location === "/kelly");
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </Link>
              );
            })}

            {/* Dropdown "Mais" para os demais itens */}
            <div className="relative">
              <button
                onClick={() => setDesktopMenuOpen(p => !p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                Mais
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${desktopMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {desktopMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDesktopMenuOpen(false)} />
                  <div className="absolute left-0 top-10 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                    {allNavItems.slice(4).map(item => {
                      const Icon = item.icon;
                      const isActive = location === item.path;
                      return (
                        <Link key={item.path} href={item.path}>
                          <button
                            onClick={() => setDesktopMenuOpen(false)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Direita: Notificações + usuário */}
        <div className="flex items-center gap-1.5">

          {/* Sino de notificações */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative w-9 h-9"
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
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPainelNotif(false)} />
                <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
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
              </>
            )}
          </div>

          {/* Avatar + nome (desktop) */}
          <div className="hidden sm:flex items-center gap-2 pl-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-foreground leading-tight truncate max-w-[100px]">{user?.name ?? "Usuário"}</p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">{user?.role === "admin" ? "Admin" : "Pro"}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Hamburger mobile (para o menu completo) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden w-9 h-9"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* ─── MENU MOBILE OVERLAY (todos os itens) ────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border flex flex-col">
            {/* Header do menu */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">Menu</span>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Itens de navegação */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* Seção principal */}
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1 font-semibold">Principal</p>
              {bottomNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon />
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.badge === "LIVE" && (
                        <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold pulse-live">LIVE</span>
                      )}
                      {item.badge === "PRO" && (
                        <span className="ml-auto bg-primary/20 text-primary border border-primary/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                      )}
                      {item.badge === "EM BREVE" && (
                        <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">EM BREVE</span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Seção ferramentas */}
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1 font-semibold mt-3">Ferramentas</p>
              {allNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path || (item.path === "/apostas" && location === "/kelly");
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.path === "/bots" && alertasPendentes > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {alertasPendentes}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Usuário no rodapé */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {user?.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name ?? "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTEÚDO PRINCIPAL ──────────────────────────────────────────── */}
      {/* pb-20 para não ficar atrás da barra inferior */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* ─── BARRA INFERIOR FIXA (estilo scoretabs) ──────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: "linear-gradient(to top, #0d0d1a 0%, #111122 100%)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          height: "64px",
        }}
      >
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path === "/ao-vivo" && location.startsWith("/ao-vivo"));
          const isComingSoon = item.badge === "EM BREVE";

          return (
            <Link key={item.path} href={isComingSoon ? "#" : item.path}>
              <button
                className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full w-full px-2 transition-all duration-200 group"
                style={{ minWidth: "calc(100vw / 4)" }}
                onClick={isComingSoon ? (e) => { e.preventDefault(); } : undefined}
              >
                {/* Linha indicadora no topo (ativa) */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full transition-all duration-300"
                  style={{
                    width: isActive ? "60%" : "0%",
                    background: "linear-gradient(90deg, #00ff88, #00cc66)",
                    boxShadow: isActive ? "0 0 8px #00ff8880" : "none",
                  }}
                />

                {/* Ícone */}
                <div
                  className="transition-all duration-200"
                  style={{
                    color: isActive ? "#00ff88" : "rgba(255,255,255,0.45)",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    filter: isActive ? "drop-shadow(0 0 6px #00ff8860)" : "none",
                  }}
                >
                  <Icon />
                </div>

                {/* Label */}
                <span
                  className="text-[10px] font-semibold leading-none transition-all duration-200 truncate max-w-full px-1"
                  style={{
                    color: isActive ? "#00ff88" : "rgba(255,255,255,0.4)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.label}
                </span>

                {/* Badge LIVE pulsante */}
                {item.badge === "LIVE" && !isActive && (
                  <span className="absolute top-1.5 right-[20%] w-1.5 h-1.5 bg-red-500 rounded-full pulse-live" />
                )}

                {/* Badge EM BREVE */}
                {isComingSoon && (
                  <span
                    className="absolute top-1 right-[10%] text-[8px] font-bold px-1 py-0.5 rounded-full"
                    style={{ background: "rgba(234,179,8,0.2)", color: "#eab308", border: "1px solid rgba(234,179,8,0.3)" }}
                  >
                    BREVE
                  </span>
                )}
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
