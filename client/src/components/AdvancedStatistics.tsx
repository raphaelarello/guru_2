import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AdvancedStatisticsProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}) => {
  const [activeTab, setActiveTab] = useState<'xg' | 'pressure' | 'heatmap' | 'history'>('xg');

  // Dados de xG (Expected Goals)
  const xgData = [
    { minute: '0-15', home: 0.2, away: 0.1 },
    { minute: '15-30', home: 0.5, away: 0.3 },
    { minute: '30-45', home: 0.8, away: 0.6 },
    { minute: '45-60', home: 1.2, away: 0.9 },
    { minute: '60-75', home: 1.5, away: 1.3 },
    { minute: '75-90', home: 2.1, away: 1.8 },
  ];

  // Dados de Pressão (Pressionamento)
  const pressureData = [
    { minute: '15', home: 45, away: 38 },
    { minute: '30', home: 52, away: 42 },
    { minute: '45', home: 58, away: 48 },
    { minute: '60', home: 62, away: 55 },
    { minute: '75', home: 68, away: 60 },
  ];

  // Dados de Comparação Histórica
  const historyData = [
    { metric: 'Vitórias', home: 12, away: 8 },
    { metric: 'Empates', home: 5, away: 7 },
    { metric: 'Derrotas', home: 3, away: 5 },
    { metric: 'Gols Marcados', home: 45, away: 32 },
    { metric: 'Gols Sofridos', home: 18, away: 24 },
  ];

  // Dados de Radar (Comparação de Atributos)
  const radarData = [
    { attribute: 'Ataque', home: 78, away: 65 },
    { attribute: 'Defesa', home: 72, away: 68 },
    { attribute: 'Posse', home: 58, away: 42 },
    { attribute: 'Passes', home: 85, away: 72 },
    { attribute: 'Velocidade', home: 70, away: 75 },
    { attribute: 'Disciplina', home: 80, away: 75 },
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">📈 Estatísticas Avançadas</h3>

        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {[
            { id: 'xg', label: 'xG (Gols Esperados)' },
            { id: 'pressure', label: 'Pressão' },
            { id: 'heatmap', label: 'Comparação' },
            { id: 'history', label: 'Histórico' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-semibold text-sm transition border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'xg' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Evolução de xG por Tempo</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={xgData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="minute" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="home"
                    stroke="#3b82f6"
                    name={homeTeam}
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="away"
                    stroke="#ef4444"
                    name={awayTeam}
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="text-xs text-blue-300 mb-1">xG {homeTeam}</div>
                <div className="text-2xl font-bold text-blue-400">2.1</div>
                <div className="text-xs text-slate-400 mt-1">Gols esperados</div>
              </div>
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <div className="text-xs text-red-300 mb-1">xG {awayTeam}</div>
                <div className="text-2xl font-bold text-red-400">1.8</div>
                <div className="text-xs text-slate-400 mt-1">Gols esperados</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pressure' && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Pressão de Pressionamento (%)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pressureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="minute" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="home" fill="#3b82f6" name={homeTeam} />
                <Bar dataKey="away" fill="#ef4444" name={awayTeam} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Comparação de Atributos</h4>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="attribute" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#94a3b8" />
                <Radar
                  name={homeTeam}
                  dataKey="home"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Radar
                  name={awayTeam}
                  dataKey="away"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Histórico de Confrontos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="metric" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="home" fill="#3b82f6" name={homeTeam} />
                <Bar dataKey="away" fill="#ef4444" name={awayTeam} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedStatistics;
