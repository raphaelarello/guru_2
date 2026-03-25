import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface OddsPanelProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export function OddsPanel({ homeTeam, awayTeam, homeScore, awayScore, minute }: OddsPanelProps) {
  const [selectedBookmaker, setSelectedBookmaker] = useState<"betfair" | "pinnacle">("betfair");

  // Odds simuladas (em produção viriam de API real)
  const odds = {
    betfair: {
      home: 1.85,
      draw: 3.60,
      away: 2.05,
      over25: 1.50,
      under25: 2.40,
      btts: 1.70,
      nobtts: 2.10,
    },
    pinnacle: {
      home: 1.83,
      draw: 3.65,
      away: 2.08,
      over25: 1.48,
      under25: 2.45,
      btts: 1.68,
      nobtts: 2.15,
    },
  };

  // Calcular probabilidade implícita
  const calcImpliedProb = (odd: number) => ((1 / odd) * 100).toFixed(1);

  // Analisar value betting
  const analyzeValue = (odd: number, impliedProb: string | number) => {
    const fairOdd = 1 / (parseFloat(String(impliedProb)) / 100);
    const value = ((odd - fairOdd) / fairOdd * 100).toFixed(1);
    return {
      value: parseFloat(value),
      isValue: parseFloat(value) > 5,
    };
  };

  const currentOdds = odds[selectedBookmaker];

  // Calcular histórico de mudanças
  const oddHistory = {
    home: [1.90, 1.88, 1.86, 1.85],
    draw: [3.50, 3.55, 3.58, 3.60],
    away: [2.00, 2.02, 2.04, 2.05],
  };

  return (
    <div className="space-y-4">
      {/* SELETOR DE CASA DE APOSTAS */}
      <div className="flex gap-2">
        {(["betfair", "pinnacle"] as const).map((bm) => (
          <button
            key={bm}
            onClick={() => setSelectedBookmaker(bm)}
            className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
              selectedBookmaker === bm
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {bm === "betfair" ? "Betfair" : "Pinnacle"}
          </button>
        ))}
      </div>

      {/* ODDS PRINCIPAIS */}
      <div className="grid grid-cols-3 gap-3">
        {/* VITÓRIA HOME */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">🏠 {homeTeam.split(" ")[0]} Vencer</div>
          <div className="text-3xl font-bold text-green-400 mb-2">{currentOdds.home}</div>
          <div className="text-xs text-slate-400 mb-2">
            Prob: <span className="text-slate-300">{calcImpliedProb(currentOdds.home)}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {analyzeValue(currentOdds.home, parseFloat(calcImpliedProb(currentOdds.home))).isValue ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 font-bold">
                  +{analyzeValue(currentOdds.home, parseFloat(calcImpliedProb(currentOdds.home))).value}% Value
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-red-400">Sem valor</span>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <div className="flex justify-between mb-1">
              <span>Histórico:</span>
              <span>{oddHistory.home.join(" → ")}</span>
            </div>
          </div>
        </div>

        {/* EMPATE */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">🤝 Empate</div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">{currentOdds.draw}</div>
          <div className="text-xs text-slate-400 mb-2">
            Prob: <span className="text-slate-300">{calcImpliedProb(currentOdds.draw)}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {analyzeValue(currentOdds.draw, parseFloat(calcImpliedProb(currentOdds.draw))).isValue ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 font-bold">
                  +{analyzeValue(currentOdds.draw, parseFloat(calcImpliedProb(currentOdds.draw))).value}% Value
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-red-400">Sem valor</span>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <div className="flex justify-between mb-1">
              <span>Histórico:</span>
              <span>{oddHistory.draw.join(" → ")}</span>
            </div>
          </div>
        </div>

        {/* VITÓRIA AWAY */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">🚀 {awayTeam.split(" ")[0]} Vencer</div>
          <div className="text-3xl font-bold text-blue-400 mb-2">{currentOdds.away}</div>
          <div className="text-xs text-slate-400 mb-2">
            Prob: <span className="text-slate-300">{calcImpliedProb(currentOdds.away)}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {analyzeValue(currentOdds.away, parseFloat(calcImpliedProb(currentOdds.away))).isValue ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 font-bold">
                  +{analyzeValue(currentOdds.away, parseFloat(calcImpliedProb(currentOdds.away))).value}% Value
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-red-400">Sem valor</span>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <div className="flex justify-between mb-1">
              <span>Histórico:</span>
              <span>{oddHistory.away.join(" → ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ODDS SECUNDÁRIAS */}
      <div className="grid grid-cols-3 gap-3">
        {/* OVER/UNDER */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">📊 Over/Under 2.5</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Over 2.5</span>
              <span className="font-bold text-green-400">{currentOdds.over25}</span>
            </div>
            <div className="flex justify-between">
              <span>Under 2.5</span>
              <span className="font-bold text-red-400">{currentOdds.under25}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <div className="bg-slate-900/50 rounded p-2">
              <div className="font-semibold text-slate-300 mb-1">💡 Análise:</div>
              <div>Esperados ~3 gols (Over tem valor)</div>
            </div>
          </div>
        </div>

        {/* AMBOS MARCAM */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">⚽ Ambos Marcam</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Sim</span>
              <span className="font-bold text-green-400">{currentOdds.btts}</span>
            </div>
            <div className="flex justify-between">
              <span>Não</span>
              <span className="font-bold text-red-400">{currentOdds.nobtts}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <div className="bg-slate-900/50 rounded p-2">
              <div className="font-semibold text-slate-300 mb-1">💡 Análise:</div>
              <div>Ambos em forma - Sim tem valor</div>
            </div>
          </div>
        </div>

        {/* COMPARAÇÃO DE CASAS */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">🏆 Melhor Odd</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Home</span>
              <span className="font-bold text-green-400">Pinnacle 1.83</span>
            </div>
            <div className="flex justify-between">
              <span>Draw</span>
              <span className="font-bold text-yellow-400">Betfair 3.60</span>
            </div>
            <div className="flex justify-between">
              <span>Away</span>
              <span className="font-bold text-blue-400">Pinnacle 2.08</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <div className="bg-slate-900/50 rounded p-2">
              <div className="font-semibold text-slate-300 mb-1">💡 Dica:</div>
              <div>Compare sempre entre casas</div>
            </div>
          </div>
        </div>
      </div>

      {/* ANÁLISE DE MOVIMENTO */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-bold text-slate-300 mb-3">📈 Movimento de Odds</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">Home: 1.90 → 1.85</span>
            <span className="text-green-400 font-bold">Subindo (Favorito)</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">Draw: 3.50 → 3.60</span>
            <span className="text-red-400 font-bold">Caindo (Menos provável)</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">Away: 2.00 → 2.05</span>
            <span className="text-yellow-400 font-bold">Estável</span>
          </div>
        </div>
      </div>

      {/* RECOMENDAÇÕES */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="text-sm font-bold text-green-400 mb-2">✅ Oportunidades de Value</div>
        <div className="space-y-1 text-xs text-green-300">
          <div>• <strong>Over 2.5 a 1.50:</strong> Bom valor considerando o histórico</div>
          <div>• <strong>Ambos Marcam a 1.70:</strong> Valor moderado, ambas em forma</div>
          <div>• <strong>Away a 2.08 (Pinnacle):</strong> Melhor odd disponível</div>
        </div>
      </div>
    </div>
  );
}
