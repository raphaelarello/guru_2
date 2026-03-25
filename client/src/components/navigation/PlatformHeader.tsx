import React from 'react';
import { Bell, Bot, Compass, Crown, Menu, Search, Sparkles, Trophy, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/saas/UserMenu';

const NAV_ITEMS = [
  { id: 'radar', label: 'Radar Esportivo', icon: Compass },
  { id: 'ligas', label: 'Ligas', icon: Trophy },
  { id: 'ferramentas', label: 'Ferramentas', icon: Menu },
  { id: 'recomendadas', label: 'Recomendadas 2026', icon: Sparkles },
  { id: 'bots', label: 'Bots IA', icon: Bot },
  { id: 'sobre', label: 'Sobre o sistema', icon: Bell },
] as const;

export type PlatformNavAction = (typeof NAV_ITEMS)[number]['id'];

export function PlatformHeader({
  active,
  liveCount = 0,
  subtitle,
  onAction,
  onOpenSearch,
}: {
  active?: PlatformNavAction | null;
  liveCount?: number;
  subtitle?: string;
  onAction: (action: PlatformNavAction) => void;
  onOpenSearch: () => void;
}) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex min-h-[72px] flex-wrap items-center gap-3 py-3">
          <button
            type="button"
            onClick={() => setLocation('/')}
            className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 transition-all hover:border-emerald-400/25 hover:bg-white/[0.05]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
              <Trophy className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="text-left">
              <div className="text-xl font-black tracking-tight text-white">Rapha <span className="text-emerald-400">Guru</span></div>
              <div className="text-[11px] font-medium text-slate-500">Radar esportivo premium com IA</div>
            </div>
          </button>

          <div className="hidden items-center gap-2 xl:flex">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onAction(id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
                    isActive
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-white'
                      : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-300' : 'text-slate-500')} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {liveCount > 0 ? (
              <div className="hidden items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-200 md:flex">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                {liveCount} ao vivo
              </div>
            ) : null}

            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition-all hover:bg-white/[0.06]"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">Buscar</span>
              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-500">Ctrl K</span>
            </button>

            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => setLocation('/planos')}
                  className="hidden items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200 transition-all hover:bg-emerald-500/15 sm:flex"
                >
                  <Crown className="h-4 w-4" />
                  Virar PRO
                </button>
                <button
                  type="button"
                  onClick={() => setLocation('/login')}
                  className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.07] sm:flex"
                >
                  <User2 className="h-4 w-4" />
                  Entrar
                </button>
              </>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 xl:hidden" style={{ scrollbarWidth: 'none' }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onAction(id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-white'
                    : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-emerald-300' : 'text-slate-500')} />
                {label}
              </button>
            );
          })}
        </div>

        {subtitle ? (
          <div className="border-t border-white/6 py-2 text-xs text-slate-500">
            {subtitle}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default PlatformHeader;
