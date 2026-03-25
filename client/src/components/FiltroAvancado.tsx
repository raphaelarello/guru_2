import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { FiltroLigas } from "./FiltroLigas";

export interface FiltrosState {
  ligas: number[];
  mercados: string[];
  confiancaMin: number;
  urgencia: string[]; // "alta" | "media" | "baixa"
  resultado: string[]; // "green" | "red" | "void" | "pendente"
  periodo: string; // "hoje" | "semana" | "mes" | "tudo"
  oddsMin: number;
  oddsMax: number;
  soComSinal: boolean;
}

export const FILTROS_PADRAO: FiltrosState = {
  ligas: [],
  mercados: [],
  confiancaMin: 0,
  urgencia: [],
  resultado: [],
  periodo: "tudo",
  oddsMin: 1.0,
  oddsMax: 50.0,
  soComSinal: false,
};

const MERCADOS_DISPONIVEIS = [
  { id: "over_0.5", label: "Acima 0.5 Gols" },
  { id: "over_1.5", label: "Acima 1.5 Gols" },
  { id: "over_2.5", label: "Acima 2.5 Gols" },
  { id: "over_3.5", label: "Acima 3.5 Gols" },
  { id: "under_0.5", label: "Abaixo 0.5 Gols" },
  { id: "under_1.5", label: "Abaixo 1.5 Gols" },
  { id: "under_2.5", label: "Abaixo 2.5 Gols" },
  { id: "btts", label: "Ambas Marcam" },
  { id: "btts_no", label: "Ambas Não Marcam" },
  { id: "resultado_home", label: "Vitória Casa" },
  { id: "resultado_draw", label: "Empate" },
  { id: "resultado_away", label: "Vitória Visitante" },
  { id: "goleada", label: "Goleada Detectada" },
  { id: "escanteios", label: "Escanteios" },
  { id: "cartoes", label: "Cartões" },
  { id: "ev_plus", label: "EV Positivo" },
];

interface FiltroAvancadoProps {
  filtros: FiltrosState;
  onChange: (f: FiltrosState) => void;
  ligasDisponiveis?: number[];
  mostrarMercados?: boolean;
  mostrarUrgencia?: boolean;
  mostrarResultado?: boolean;
  mostrarPeriodo?: boolean;
  mostrarOdds?: boolean;
  mostrarSoComSinal?: boolean;
  className?: string;
}

export function FiltroAvancado({
  filtros,
  onChange,
  ligasDisponiveis,
  mostrarMercados = true,
  mostrarUrgencia = true,
  mostrarResultado = false,
  mostrarPeriodo = false,
  mostrarOdds = false,
  mostrarSoComSinal = false,
  className = "",
}: FiltroAvancadoProps) {
  const [expandido, setExpandido] = useState(false);

  const totalFiltrosAtivos =
    filtros.ligas.length +
    filtros.mercados.length +
    filtros.urgencia.length +
    filtros.resultado.length +
    (filtros.confiancaMin > 0 ? 1 : 0) +
    (filtros.periodo !== "tudo" ? 1 : 0) +
    (filtros.oddsMin > 1.0 || filtros.oddsMax < 50.0 ? 1 : 0) +
    (filtros.soComSinal ? 1 : 0);

  function limparTudo() {
    onChange(FILTROS_PADRAO);
  }

  function toggleMercado(id: string) {
    const novos = filtros.mercados.includes(id)
      ? filtros.mercados.filter(m => m !== id)
      : [...filtros.mercados, id];
    onChange({ ...filtros, mercados: novos });
  }

  function toggleUrgencia(u: string) {
    const novos = filtros.urgencia.includes(u)
      ? filtros.urgencia.filter(x => x !== u)
      : [...filtros.urgencia, u];
    onChange({ ...filtros, urgencia: novos });
  }

  function toggleResultado(r: string) {
    const novos = filtros.resultado.includes(r)
      ? filtros.resultado.filter(x => x !== r)
      : [...filtros.resultado, r];
    onChange({ ...filtros, resultado: novos });
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Linha principal de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtro de ligas */}
        <FiltroLigas
          ligasSelecionadas={filtros.ligas}
          onChange={ligas => onChange({ ...filtros, ligas })}
          ligasDisponiveis={ligasDisponiveis}
        />

        {/* Só com sinal */}
        {mostrarSoComSinal && (
          <button
            onClick={() => onChange({ ...filtros, soComSinal: !filtros.soComSinal })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${
              filtros.soComSinal
                ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]"
                : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:text-white"
            }`}
          >
            ⚡ Só com sinal
          </button>
        )}

        {/* Botão filtros avançados */}
        <button
          onClick={() => setExpandido(!expandido)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${
            expandido || totalFiltrosAtivos > filtros.ligas.length + (filtros.soComSinal ? 1 : 0)
              ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]"
              : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {totalFiltrosAtivos > 0 && (
            <span className="text-[10px] bg-[#00ff88]/20 text-[#00ff88] px-1.5 py-0.5 rounded-full font-bold">
              {totalFiltrosAtivos}
            </span>
          )}
          {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Limpar tudo */}
        {totalFiltrosAtivos > 0 && (
          <button
            onClick={limparTudo}
            className="flex items-center gap-1 px-2 py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Painel expandido */}
      {expandido && (
        <div className="bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Mercados */}
            {mostrarMercados && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Mercados</p>
                <div className="flex flex-wrap gap-1.5">
                  {MERCADOS_DISPONIVEIS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => toggleMercado(m.id)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        filtros.mercados.includes(m.id)
                          ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]"
                          : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Urgência */}
            {mostrarUrgencia && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Urgência do Sinal</p>
                <div className="flex gap-2">
                  {[
                    { id: "alta", label: "🔴 Alta", color: "red" },
                    { id: "media", label: "🟡 Média", color: "yellow" },
                    { id: "baixa", label: "🟢 Baixa", color: "green" },
                  ].map(u => (
                    <button
                      key={u.id}
                      onClick={() => toggleUrgencia(u.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        filtros.urgencia.includes(u.id)
                          ? u.color === "red"
                            ? "bg-red-500/10 border-red-500/40 text-red-400"
                            : u.color === "yellow"
                            ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                            : "bg-green-500/10 border-green-500/40 text-green-400"
                          : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confiança mínima */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Confiança Mínima: <span className="text-[#00ff88] font-bold">{filtros.confiancaMin}%</span>
              </p>
              <input
                type="range"
                min={0}
                max={95}
                step={5}
                value={filtros.confiancaMin}
                onChange={e => onChange({ ...filtros, confiancaMin: Number(e.target.value) })}
                className="w-full accent-[#00ff88]"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>0%</span><span>50%</span><span>95%</span>
              </div>
            </div>

            {/* Resultado */}
            {mostrarResultado && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Resultado</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "green", label: "✅ Green" },
                    { id: "red", label: "❌ Red" },
                    { id: "void", label: "⚪ Void" },
                    { id: "pendente", label: "⏳ Pendente" },
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => toggleResultado(r.id)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        filtros.resultado.includes(r.id)
                          ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]"
                          : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Período */}
            {mostrarPeriodo && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Período</p>
                <div className="flex gap-1.5">
                  {[
                    { id: "hoje", label: "Hoje" },
                    { id: "semana", label: "7 dias" },
                    { id: "mes", label: "30 dias" },
                    { id: "tudo", label: "Tudo" },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => onChange({ ...filtros, periodo: p.id })}
                      className={`text-xs px-2 py-1.5 rounded-lg border transition-all ${
                        filtros.periodo === p.id
                          ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]"
                          : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Odds */}
            {mostrarOdds && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Odds: <span className="text-[#00ff88] font-bold">{filtros.oddsMin.toFixed(1)} — {filtros.oddsMax >= 50 ? "∞" : filtros.oddsMax.toFixed(1)}</span>
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={1.0}
                    max={filtros.oddsMax}
                    step={0.1}
                    value={filtros.oddsMin}
                    onChange={e => onChange({ ...filtros, oddsMin: Number(e.target.value) })}
                    className="w-20 bg-[#1a1a2e] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-white"
                  />
                  <span className="text-gray-500">—</span>
                  <input
                    type="number"
                    min={filtros.oddsMin}
                    max={100}
                    step={0.1}
                    value={filtros.oddsMax}
                    onChange={e => onChange({ ...filtros, oddsMax: Number(e.target.value) })}
                    className="w-20 bg-[#1a1a2e] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
