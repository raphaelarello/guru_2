import React, { useEffect } from 'react';
import { Bot, Compass, Flame, Layers3, Search, Sparkles, Trophy } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut, CommandSeparator } from '@/components/ui/command';
import type { Match } from '@/lib/types';

export function PlatformCommandPalette({
  open,
  onOpenChange,
  matches,
  leagues,
  onSelectMatch,
  onSelectLeague,
  onGoRecommendations,
  onGoRadar,
  onGoAutomation,
  onGoAccount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: Match[];
  leagues: { id: string; name: string }[];
  onSelectMatch: (match: Match) => void;
  onSelectLeague: (leagueId: string) => void;
  onGoRecommendations: () => void;
  onGoRadar: () => void;
  onGoAutomation: () => void;
  onGoAccount: () => void;
}) {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) || event.key === '/') {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Busca rápida"
      description="Encontre jogos, ligas e atalhos de navegação"
      className="border-white/10 bg-[#0b1120] text-slate-100 sm:max-w-2xl"
    >
      <CommandInput placeholder="Buscar time, liga, radar, bots..." className="text-slate-100 placeholder:text-slate-500" />
      <CommandList className="max-h-[70vh] bg-[#0b1120]">
        <CommandEmpty>Nada encontrado. Tente buscar por time, liga ou função.</CommandEmpty>

        <CommandGroup heading="Atalhos rápidos" className="text-slate-100">
          <CommandItem onSelect={() => { onGoRecommendations(); onOpenChange(false); }}>
            <Sparkles className="text-amber-300" />
            <span>Ir para Recomendações 2026</span>
            <CommandShortcut>Top</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { onGoRadar(); onOpenChange(false); }}>
            <Compass className="text-cyan-300" />
            <span>Voltar ao Radar Esportivo</span>
            <CommandShortcut>Radar</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { onGoAutomation(); onOpenChange(false); }}>
            <Bot className="text-emerald-300" />
            <span>Abrir Bots IA</span>
            <CommandShortcut>Elite</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { onGoAccount(); onOpenChange(false); }}>
            <Layers3 className="text-violet-300" />
            <span>Abrir conta e plano</span>
            <CommandShortcut>Conta</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jogos mais quentes" className="text-slate-100">
          {matches.slice(0, 8).map((match) => (
            <CommandItem
              key={match.idEvent}
              value={`${match.strHomeTeam} ${match.strAwayTeam} ${match.strLeague}`}
              onSelect={() => {
                onSelectMatch(match);
                onOpenChange(false);
              }}
            >
              <Flame className="text-orange-300" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-slate-100">{match.strHomeTeam} x {match.strAwayTeam}</span>
                <span className="truncate text-xs text-slate-500">{match.strLeague}</span>
              </div>
              <CommandShortcut>{match.strStatus === 'In Progress' ? 'AO VIVO' : 'Analisar'}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Competições do dia" className="text-slate-100">
          {leagues.slice(0, 12).map((league) => (
            <CommandItem
              key={league.id}
              value={`${league.name} ${league.id}`}
              onSelect={() => {
                onSelectLeague(league.id);
                onOpenChange(false);
              }}
            >
              <Trophy className="text-emerald-300" />
              <span className="truncate">{league.name}</span>
              <CommandShortcut>Liga</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default PlatformCommandPalette;
