import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface StatisticsDashboardProps {
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

export function StatisticsDashboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  possession,
  shots,
  corners,
  cards,
  minute,
}: StatisticsDashboardProps) {
  // Dados de xG (Expected Goals)
  const xgData = [
    { name: homeTeam.split(" ")[0], xg: 1.8, gols: homeScore },
    { name: awayTeam.split(" ")[0], xg: 1.2, gols: awayScore },
  ];

  // Dados de pressão (pressionamento)
  const pressureData = [
    { name: "Pressão Ofensiva", home: 65, away: 45 },
    { name: "Pressão Média", home: 55, away: 60 },
    { name: "Pressão Defensiva", home: 40, away: 70 },
  ];

  // Dados de comparação histórica
  const historicalData = [
    { minuto: "0-15", home: 0.2, away: 0.1 },
    { minuto: "15-30", home: 0.5, away: 0.3 },
    { minuto: "30-45", home: 0.8, away: 0.6 },
    { minuto: "45-60", home: 0.3, away: 0.4 },
  ];

  // Dados de distribuição de passes
  const passDistribution = [
    { name: "Curtos", value: 65 },
    { name: "Médios", value: 25 },
    { name: "Longos", value: 10 },
  ];

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  // Calcular eficiência
  const homeEfficiency = homeScore > 0 ? ((homeScore / xgData[0].xg) * 100).toFixed(1) : "0";
  const awayEfficiency = awayScore > 0 ? ((awayScore / xgData[1].xg) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: xG (EXPECTED GOALS) */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-bold text-slate-300 mb-4">📊 Expected Goals (xG)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={xgData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Bar dataKey="xg" fill="#3b82f6" name="xG (Esperado)" />
            <Bar dataKey="gols" fill="#10b981" name="Gols (Real)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">{homeTeam.split(" ")[0]} Eficiência</div>
            <div className="text-2xl font-bold text-blue-400">{homeEfficiency}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {homeScore} gols em {xgData[0].xg} xG
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">{awayTeam.split(" ")[0]} Eficiência</div>
            <div className="text-2xl font-bold text-green-400">{awayEfficiency}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {awayScore} gols em {xgData[1].xg} xG
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PRESSÃO E INTENSIDADE */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-bold text-slate-300 mb-4">🔥 Pressão e Intensidade</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pressureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Line type="monotone" dataKey="home" stroke="#3b82f6" name={homeTeam.split(" ")[0]} strokeWidth={2} />
            <Line type="monotone" dataKey="away" stroke="#10b981" name={awayTeam.split(" ")[0]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SEÇÃO 3: COMPARAÇÃO HISTÓRICA */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-bold text-slate-300 mb-4">📈 Evolução do Jogo (xG por Período)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="minuto" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Bar dataKey="home" fill="#3b82f6" name={homeTeam.split(" ")[0]} />
            <Bar dataKey="away" fill="#10b981" name={awayTeam.split(" ")[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SEÇÃO 4: HEATMAP E DISTRIBUIÇÃO */}
      <div className="grid grid-cols-2 gap-4">
        {/* DISTRIBUIÇÃO DE PASSES */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-bold text-slate-300 mb-4">📍 Distribuição de Passes</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={passDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {passDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* COMPARAÇÃO GERAL */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
          <div className="text-sm font-bold text-slate-300 mb-4">⚽ Comparação Geral</div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Posse de Bola</span>
              <span className="text-slate-300 font-bold">{possession.home}% vs {possession.away}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${possession.home}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Chutes</span>
              <span className="text-slate-300 font-bold">{shots.home} vs {shots.away}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(shots.home / (shots.home + shots.away)) * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Escanteios</span>
              <span className="text-slate-300 font-bold">{corners.home} vs {corners.away}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(corners.home / (corners.home + corners.away)) * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Cartões</span>
              <span className="text-slate-300 font-bold">{cards.home} vs {cards.away}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(cards.home / (cards.home + cards.away)) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: ANÁLISE TÁTICA */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-bold text-slate-300 mb-3">🎯 Análise Tática</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
            <span className="text-blue-400 font-bold">•</span>
            <div>
              <div className="text-slate-300 font-semibold">{homeTeam.split(" ")[0]} - Dominância</div>
              <div className="text-slate-500">Maior posse (65%), mas eficiência abaixo do esperado</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
            <span className="text-green-400 font-bold">•</span>
            <div>
              <div className="text-slate-300 font-semibold">{awayTeam.split(" ")[0]} - Contra-Ataque</div>
              <div className="text-slate-500">Menos posse (35%), mas aproveita bem as oportunidades</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
            <span className="text-yellow-400 font-bold">•</span>
            <div>
              <div className="text-slate-300 font-semibold">Tendência</div>
              <div className="text-slate-500">Jogo equilibrado, próximos 15 minutos serão decisivos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
