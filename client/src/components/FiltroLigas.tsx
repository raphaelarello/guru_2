import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check, Globe } from "lucide-react";
import { LIGAS, LIGAS_DESTAQUE, getLigasPorPais, type InfoLiga } from "@shared/ligas";

interface FiltroLigasProps {
  ligasSelecionadas: number[];
  onChange: (ids: number[]) => void;
  ligasDisponiveis?: number[];
  placeholder?: string;
  className?: string;
  forceOpen?: boolean;
  onForceOpenConsumed?: () => void;
}

export function FiltroLigas({
  ligasSelecionadas,
  onChange,
  ligasDisponiveis,
  placeholder = "Filtrar por liga...",
  className = "",
  forceOpen,
  onForceOpenConsumed,
}: FiltroLigasProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Abrir programaticamente quando forceOpen for true
  useEffect(() => {
    if (forceOpen) {
      setAberto(true);
      onForceOpenConsumed?.();
    }
  }, [forceOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Ligas disponíveis filtradas pela busca
  const ligasFiltradas = useMemo(() => {
    const disponiveis = ligasDisponiveis
      ? Object.values(LIGAS).filter(l => ligasDisponiveis.includes(l.id))
      : Object.values(LIGAS);

    if (!busca.trim()) return disponiveis;
    const q = busca.toLowerCase();
    return disponiveis.filter(
      l =>
        l.nome.toLowerCase().includes(q) ||
        l.nomePais.toLowerCase().includes(q)
    );
  }, [busca, ligasDisponiveis]);

  // Agrupar por país
  const grupos = useMemo(() => {
    const g: Record<string, InfoLiga[]> = {};
    for (const liga of ligasFiltradas) {
      if (!g[liga.nomePais]) g[liga.nomePais] = [];
      g[liga.nomePais].push(liga);
    }
    return g;
  }, [ligasFiltradas]);

  const totalDisponiveis = ligasFiltradas.length;
  const todasSelecionadas = totalDisponiveis > 0 && ligasSelecionadas.length === 0;

  function toggleLiga(id: number) {
    if (ligasSelecionadas.includes(id)) {
      onChange(ligasSelecionadas.filter(l => l !== id));
    } else {
      onChange([...ligasSelecionadas, id]);
    }
  }

  function selecionarTodas() {
    onChange([]); // array vazio = todas
  }

  function limparFiltros() {
    onChange([]);
  }

  const label =
    ligasSelecionadas.length === 0
      ? "Todas as ligas"
      : ligasSelecionadas.length === 1
      ? (() => {
          const l = LIGAS[ligasSelecionadas[0]];
          return l ? `${l.bandeira} ${l.nome}` : `Liga ${ligasSelecionadas[0]}`;
        })()
      : `${ligasSelecionadas.length} ligas selecionadas`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] hover:border-[#00ff88]/50 text-sm text-gray-300 hover:text-white transition-all min-w-[180px] max-w-[260px]"
      >
        <Globe className="w-4 h-4 text-[#00ff88] shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {ligasSelecionadas.length > 0 && (
          <span
            className="text-[10px] bg-[#00ff88]/20 text-[#00ff88] px-1.5 py-0.5 rounded-full font-bold"
            onClick={e => { e.stopPropagation(); limparFiltros(); }}
          >
            {ligasSelecionadas.length} ✕
          </span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute top-full left-0 mt-1 z-50 w-80 bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Busca */}
          <div className="p-2 border-b border-[#2a2a4a]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a2e] rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                autoFocus
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar liga ou país..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
              {busca && (
                <button onClick={() => setBusca("")}>
                  <X className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Opção "Todas" */}
          <div className="px-2 pt-2">
            <button
              onClick={selecionarTodas}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                todasSelecionadas
                  ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30"
                  : "text-gray-400 hover:bg-[#1a1a2e] hover:text-white"
              }`}
            >
              <span className="text-base">🌍</span>
              <span className="flex-1 text-left font-medium">Todas as ligas</span>
              {todasSelecionadas && <Check className="w-4 h-4" />}
            </button>
          </div>

          {/* Ligas em destaque (sem busca) */}
          {!busca && (
            <div className="px-2 pt-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider px-1 mb-1">⭐ Destaques</p>
              {LIGAS_DESTAQUE.filter(l => !ligasDisponiveis || ligasDisponiveis.includes(l.id)).map(liga => (
                <LigaItem
                  key={liga.id}
                  liga={liga}
                  selecionada={ligasSelecionadas.includes(liga.id)}
                  onToggle={() => toggleLiga(liga.id)}
                />
              ))}
            </div>
          )}

          {/* Lista agrupada por país */}
          <div className="max-h-64 overflow-y-auto px-2 pb-2 mt-1 custom-scrollbar">
            {Object.entries(grupos).map(([pais, ligas]) => (
              <div key={pais} className="mt-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-1 mb-1">
                  {ligas[0].bandeira} {pais}
                </p>
                {ligas.map(liga => (
                  <LigaItem
                    key={liga.id}
                    liga={liga}
                    selecionada={ligasSelecionadas.includes(liga.id)}
                    onToggle={() => toggleLiga(liga.id)}
                  />
                ))}
              </div>
            ))}
            {ligasFiltradas.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">Nenhuma liga encontrada</p>
            )}
          </div>

          {/* Footer */}
          {ligasSelecionadas.length > 0 && (
            <div className="border-t border-[#2a2a4a] p-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">{ligasSelecionadas.length} liga(s) selecionada(s)</span>
              <button
                onClick={limparFiltros}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LigaItem({ liga, selecionada, onToggle }: { liga: InfoLiga; selecionada: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
        selecionada
          ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
          : "text-gray-400 hover:bg-[#1a1a2e] hover:text-white"
      }`}
    >
      <span className="text-base">{liga.bandeira}</span>
      <span className="flex-1 text-left truncate">{liga.nome}</span>
      {selecionada && <Check className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}
