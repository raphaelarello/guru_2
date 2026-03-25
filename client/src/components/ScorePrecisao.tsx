import { useMemo } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface MercadoPrevisto {
  tipo: string;       // "gols", "cartoes", "escanteios", "btts", "resultado", "placar", "posse", "chutes"
  label: string;      // "Acima 2.5 Gols", "Acima 8 Cartões", etc.
  valorPrevisto: string; // "2.5", "sim", "casa", "8", etc.
  valorReal?: string;    // preenchido ao fechar o palpite
  acertou?: boolean;     // true/false/undefined (pendente)
  peso: number;          // 1 (normal), 2 (principal), 0.5 (secundário)
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
export function calcularScore(mercados: MercadoPrevisto[]): number {
  const finalizados = mercados.filter(m => m.acertou !== undefined);
  if (finalizados.length === 0) return 0;
  const pesoTotal = finalizados.reduce((s, m) => s + m.peso, 0);
  const pesoAcertos = finalizados.filter(m => m.acertou).reduce((s, m) => s + m.peso, 0);
  return Math.round((pesoAcertos / pesoTotal) * 100);
}

export function getScoreLabel(score: number): { label: string; cor: string; bg: string } {
  if (score >= 90) return { label: "Perfeito", cor: "text-emerald-400", bg: "bg-emerald-400" };
  if (score >= 75) return { label: "Excelente", cor: "text-green-400", bg: "bg-green-400" };
  if (score >= 60) return { label: "Bom", cor: "text-lime-400", bg: "bg-lime-400" };
  if (score >= 45) return { label: "Regular", cor: "text-yellow-400", bg: "bg-yellow-400" };
  if (score >= 25) return { label: "Fraco", cor: "text-orange-400", bg: "bg-orange-400" };
  if (score > 0) return { label: "Ruim", cor: "text-red-400", bg: "bg-red-400" };
  return { label: "Pendente", cor: "text-muted-foreground", bg: "bg-muted" };
}

export const ICONES_MERCADO: Record<string, string> = {
  gols: "⚽",
  cartoes: "🟨",
  escanteios: "🚩",
  btts: "✅",
  resultado: "🏆",
  placar: "🎯",
  posse: "🎮",
  chutes: "💥",
  tempo_gol: "⏱️",
  penalti: "🥅",
  ev: "💰",
  outros: "📊",
};

export const TIPO_MERCADO_MAP: Record<string, string> = {
  "over": "gols", "acima": "gols", "gol": "gols",
  "cartão": "cartoes", "cartao": "cartoes", "cartões": "cartoes", "cartoes": "cartoes",
  "escanteio": "escanteios", "corner": "escanteios",
  "btts": "btts", "ambas": "btts",
  "resultado": "resultado", "vitória": "resultado", "vitoria": "resultado",
  "placar": "placar",
  "posse": "posse",
  "chute": "chutes", "finalizaç": "chutes",
  "pênalti": "penalti", "penalti": "penalti",
  "ev": "ev",
};

export function detectarTipoMercado(label: string): string {
  const lower = label.toLowerCase();
  for (const [key, tipo] of Object.entries(TIPO_MERCADO_MAP)) {
    if (lower.includes(key)) return tipo;
  }
  return "outros";
}

// ─── Gauge SVG Circular ───────────────────────────────────────────────────────
export function GaugeCircular({ score, size = 120 }: { score: number; size?: number }) {
  const { cor, bg, label } = getScoreLabel(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  // Cor do arco baseada no score
  const arcColor = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : score >= 25 ? "#f97316" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Trilha de fundo */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        {/* Arco de progresso */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease", filter: `drop-shadow(0 0 6px ${arcColor}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-black tabular-nums leading-none ${size >= 120 ? "text-3xl" : "text-xl"} ${cor}`}>{score}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${cor} opacity-80`}>{label}</span>
      </div>
    </div>
  );
}

// ─── Barra de progresso de mercado individual ─────────────────────────────────
export function MercadoResultadoItem({ mercado, mostrarReal = true }: { mercado: MercadoPrevisto; mostrarReal?: boolean }) {
  const tipo = detectarTipoMercado(mercado.label);
  const icone = ICONES_MERCADO[tipo] ?? "📊";
  const pendente = mercado.acertou === undefined;
  const acertou = mercado.acertou === true;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
      pendente ? "border-border bg-muted/20" :
      acertou ? "border-green-500/30 bg-green-500/5" :
      "border-red-500/30 bg-red-500/5"
    }`}>
      {/* Ícone do tipo */}
      <span className="text-lg shrink-0 w-7 text-center">{icone}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-foreground truncate">{mercado.label}</span>
          {mercado.peso > 1 && (
            <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-bold">PRINCIPAL</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            Previsto: <span className="text-foreground font-medium">{mercado.valorPrevisto}</span>
          </span>
          {mostrarReal && mercado.valorReal !== undefined && (
            <>
              <span className="text-[10px] text-muted-foreground">→</span>
              <span className="text-[10px] text-muted-foreground">
                Real: <span className={`font-bold ${acertou ? "text-green-400" : "text-red-400"}`}>{mercado.valorReal}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="shrink-0">
        {pendente ? (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">⏳</span>
        ) : acertou ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">✓ Acerto</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">✗ Erro</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card completo de palpite com score ───────────────────────────────────────
export function PalpiteScoreCard({
  jogo,
  liga,
  mercados,
  placarFinal,
  dataJogo,
  compact = false,
}: {
  jogo: string;
  liga?: string;
  mercados: MercadoPrevisto[];
  placarFinal?: string;
  dataJogo?: Date | string;
  compact?: boolean;
}) {
  const score = useMemo(() => calcularScore(mercados), [mercados]);
  const { cor, label } = getScoreLabel(score);
  const finalizados = mercados.filter(m => m.acertou !== undefined);
  const acertos = finalizados.filter(m => m.acertou).length;
  const pendentes = mercados.filter(m => m.acertou === undefined).length;

  return (
    <div className={`rounded-2xl border transition-all ${
      finalizados.length === 0 ? "border-border bg-card" :
      score >= 60 ? "border-green-500/30 bg-card" :
      "border-red-500/30 bg-card"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-foreground text-sm truncate">{jogo}</h3>
            {placarFinal && (
              <span className="text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">
                {placarFinal}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {liga && <span className="text-[10px] text-muted-foreground">{liga}</span>}
            {dataJogo && <span className="text-[10px] text-muted-foreground">{new Date(dataJogo).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
          </div>
          {/* Resumo acertos */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-green-400 font-semibold">{acertos} acerto{acertos !== 1 ? "s" : ""}</span>
            <span className="text-[11px] text-red-400 font-semibold">{finalizados.length - acertos} erro{finalizados.length - acertos !== 1 ? "s" : ""}</span>
            {pendentes > 0 && <span className="text-[11px] text-muted-foreground">{pendentes} pendente{pendentes !== 1 ? "s" : ""}</span>}
            <span className="text-[11px] text-muted-foreground">de {mercados.length} mercado{mercados.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {/* Gauge */}
        <div className="shrink-0 ml-3">
          <GaugeCircular score={score} size={compact ? 80 : 96} />
        </div>
      </div>

      {/* Mercados */}
      {!compact && (
        <div className="px-4 pb-4 space-y-2">
          {mercados.map((m, i) => (
            <MercadoResultadoItem key={i} mercado={m} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini badge de score ──────────────────────────────────────────────────────
export function ScoreBadge({ score }: { score: number }) {
  const { cor, label } = getScoreLabel(score);
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
      score >= 75 ? "border-green-500/30 bg-green-500/10" :
      score >= 50 ? "border-yellow-500/30 bg-yellow-500/10" :
      score >= 25 ? "border-orange-500/30 bg-orange-500/10" :
      score > 0 ? "border-red-500/30 bg-red-500/10" :
      "border-border bg-muted/30"
    }`}>
      <span className={`text-sm font-black tabular-nums ${cor}`}>{score}</span>
      <span className={`text-[10px] font-semibold ${cor} opacity-80`}>{label}</span>
    </div>
  );
}
