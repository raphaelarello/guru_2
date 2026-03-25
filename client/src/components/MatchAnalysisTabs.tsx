import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface MatchAnalysisTabsProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  corners: { home: number; away: number };
  cards: { home: number; away: number };
  minute: number;
}

export function MatchAnalysisTabs({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  possession,
  shots,
  corners,
  cards,
  minute,
}: MatchAnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "probabilities" | "formations">("details");

  // Dados para gráficos
  const statsData = [
    {
      name: "Posse",
      home: possession.home,
      away: possession.away,
    },
    {
      name: "Chutes",
      home: shots.home,
      away: shots.away,
    },
    {
      name: "Escanteios",
      home: corners.home,
      away: corners.away,
    },
    {
      name: "Cartões",
      home: cards.home,
      away: cards.away,
    },
  ];

  const possessionData = [
    { name: homeTeam.split(" ")[0], value: possession.home },
    { name: awayTeam.split(" ")[0], value: possession.away },
  ];

  const probabilityData = [
    { name: `${homeTeam.split(" ")[0]} Vencer`, value: 45 },
    { name: "Empate", value: 30 },
    { name: `${awayTeam.split(" ")[0]} Vencer`, value: 25 },
  ];

  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b"];

  return (
    <div className="w-full">
      {/* ABAS */}
      <div className="flex gap-2 mb-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "details"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          📊 Detalhes
        </button>
        <button
          onClick={() => setActiveTab("probabilities")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "probabilities"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          📈 Probabilidades
        </button>
        <button
          onClick={() => setActiveTab("formations")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "formations"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          ⚽ Formações
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="space-y-4">
        {/* ABA DETALHES */}
        {activeTab === "details" && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-slate-300 mb-4">📊 Comparação de Estatísticas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="home" fill="#10b981" name={homeTeam.split(" ")[0]} />
                  <Bar dataKey="away" fill="#ef4444" name={awayTeam.split(" ")[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-2 font-bold">🎯 Chutes no Alvo</div>
                <div className="text-2xl font-bold text-green-400">
                  {Math.round((shots.home / 3) * 100)}% vs {Math.round((shots.away / 3) * 100)}%
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-2 font-bold">🎪 Efetividade</div>
                <div className="text-2xl font-bold text-blue-400">
                  {homeScore}/{shots.home} vs {awayScore}/{shots.away}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA PROBABILIDADES */}
        {activeTab === "probabilities" && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-slate-300 mb-4">📊 Probabilidades de Resultado</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={probabilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {probabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30 text-center">
                <div className="text-xs text-slate-400 mb-1">Vitória {homeTeam.split(" ")[0]}</div>
                <div className="text-2xl font-bold text-green-400">1.85</div>
                <div className="text-xs text-slate-500">Odds</div>
              </div>

              <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 text-center">
                <div className="text-xs text-slate-400 mb-1">Empate</div>
                <div className="text-2xl font-bold text-yellow-400">3.60</div>
                <div className="text-xs text-slate-500">Odds</div>
              </div>

              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30 text-center">
                <div className="text-xs text-slate-400 mb-1">Vitória {awayTeam.split(" ")[0]}</div>
                <div className="text-2xl font-bold text-blue-400">2.05</div>
                <div className="text-xs text-slate-500">Odds</div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2 font-bold">💡 Análise de Valor</div>
              <div className="space-y-1 text-xs text-slate-300">
                <div>✅ <strong>Over 2.5 Gols:</strong> 1.50 (Bom valor - 3 gols esperados)</div>
                <div>✅ <strong>Ambos Marcam:</strong> 1.70 (Valor moderado)</div>
                <div>❌ <strong>Under 1.5 Gols:</strong> 2.10 (Sem valor)</div>
              </div>
            </div>
          </div>
        )}

        {/* ABA FORMAÇÕES */}
        {activeTab === "formations" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-sm font-bold text-green-400 mb-3">{homeTeam}</div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="font-semibold">Formação: 4-3-3</div>
                  <div className="mt-2 p-2 bg-slate-800 rounded text-center font-mono text-xs">
                    <div>Ederson</div>
                    <div>Dalot - Varane - Maguire - Shaw</div>
                    <div>McTominay - Casemiro - Bruno</div>
                    <div>Antony - Haaland - Rashford</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-sm font-bold text-red-400 mb-3">{awayTeam}</div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="font-semibold">Formação: 4-2-3-1</div>
                  <div className="mt-2 p-2 bg-slate-800 rounded text-center font-mono text-xs">
                    <div>Alisson</div>
                    <div>Alexander-Arnold - Van Dijk - Konate - Robertson</div>
                    <div>Fabinho - Henderson</div>
                    <div>Salah - Firmino - Diaz</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2 font-bold">🔄 Substituições Esperadas</div>
              <div className="space-y-1 text-xs text-slate-300">
                <div>45'+: {homeTeam.split(" ")[0]} pode fazer mudanças táticas</div>
                <div>60'+: Possível entrada de jogadores frescos</div>
                <div>75'+: Últimas mudanças para pressionar/defender</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
