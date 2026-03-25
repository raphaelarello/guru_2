import React from 'react';
import { Bot, Compass, Crown, Sparkles, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DockMode = 'destaques' | 'radar' | 'bots' | 'conta';

type DockItem = {
  id: DockMode;
  label: string;
  icon: React.ElementType;
  hint: string;
};

const ITEMS: DockItem[] = [
  { id: 'destaques', label: 'Destaques', icon: Sparkles, hint: 'Entradas fortes do dia' },
  { id: 'radar', label: 'Radar Esportivo', icon: Compass, hint: 'Mapa completo da rodada' },
  { id: 'bots', label: 'Bots IA', icon: Bot, hint: 'Automações e alertas' },
  { id: 'conta', label: 'Conta', icon: User2, hint: 'Plano, conta e execução' },
];

export function BottomModeDock({
  active,
  onSelect,
}: {
  active: DockMode;
  onSelect: (mode: DockMode) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-3">
      <div className="mx-auto flex max-w-4xl justify-center">
        <div className="pointer-events-auto grid w-full max-w-2xl grid-cols-4 gap-1 rounded-3xl border border-white/10 bg-[#0a0f1d]/88 p-2 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {ITEMS.map(({ id, label, icon: Icon, hint }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  'group rounded-2xl border px-2 py-2.5 text-center transition-all',
                  isActive
                    ? 'border-emerald-400/35 bg-emerald-500/12 text-white shadow-[0_18px_35px_-25px_rgba(16,185,129,0.75)]'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'
                )}
                title={hint}
              >
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all group-hover:bg-white/[0.08]">
                  <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200')} />
                </div>
                <div className="text-[11px] font-bold leading-tight sm:text-xs">{label}</div>
                <div className={cn('mt-0.5 hidden text-[10px] leading-tight md:block', isActive ? 'text-emerald-200/80' : 'text-slate-500')}>
                  {hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BottomModeDock;
