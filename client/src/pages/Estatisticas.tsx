'use client';

import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Target } from 'lucide-react';
import RaphaLayout from '@/components/RaphaLayout';

// Dados simulados de evolução dos últimos 30 dias
const dadosEvolucao = [
  { dia: '1', gols: 12, media: 10, cartoes: 2 },
  { dia: '2', gols: 14, media: 10.5, cartoes: 1 },
  { dia: '3', gols: 11, media: 10.3, cartoes: 3 },
  { dia: '4', gols: 15, media: 10.8, cartoes: 2 },
  { dia: '5', gols: 13, media: 10.8, cartoes: 1 },
  { dia: '6', gols: 16, media: 11.3, cartoes: 2 },
  { dia: '7', gols: 18, media: 11.9, cartoes: 3 },
  { dia: '8', gols: 17, media: 12.3, cartoes: 2 },
  { dia: '9', gols: 19, media: 12.9, cartoes: 1 },
  { dia: '10', gols: 21, media: 13.6, cartoes: 2 },
  { dia: '11', gols: 20, media: 13.9, cartoes: 2 },
  { dia: '12', gols: 22, media: 14.5, cartoes: 3 },
  { dia: '13', gols: 23, media: 15.1, cartoes: 1 },
  { dia: '14', gols: 21, media: 15.2, cartoes: 2 },
  { dia: '15', gols: 24, media: 15.8, cartoes: 2 },
  { dia: '16', gols: 25, media: 16.4, cartoes: 3 },
  { dia: '17', gols: 23, media: 16.5, cartoes: 1 },
  { dia: '18', gols: 26, media: 17.1, cartoes: 2 },
  { dia: '19', gols: 27, media: 17.7, cartoes: 2 },
  { dia: '20', gols: 28, media: 18.3, cartoes: 3 },
  { dia: '21', gols: 26, media: 18.4, cartoes: 1 },
  { dia: '22', gols: 29, media: 19, cartoes: 2 },
  { dia: '23', gols: 30, media: 19.6, cartoes: 2 },
  { dia: '24', gols: 28, media: 19.7, cartoes: 3 },
  { dia: '25', gols: 31, media: 20.3, cartoes: 1 },
  { dia: '26', gols: 32, media: 20.9, cartoes: 2 },
  { dia: '27', gols: 30, media: 21, cartoes: 2 },
  { dia: '28', gols: 33, media: 21.6, cartoes: 3 },
  { dia: '29', gols: 34, media: 22.2, cartoes: 1 },
  { dia: '30', gols: 35, media: 22.8, cartoes: 2 },
];

// Dados de previsão para próximos 5 jogos
const previsoes = [
  { jogo: '1', previsao: 36, confianca: 85 },
  { jogo: '2', previsao: 37, confianca: 82 },
  { jogo: '3', previsao: 35, confianca: 78 },
  { jogo: '4', previsao: 38, confianca: 80 },
  { jogo: '5', previsao: 39, confianca: 75 },
];

export default function Estatisticas() {
  const [periodo, setPeriodo] = useState('30');
  const [liga, setLiga] = useState('todas');

  const dadosFiltrados = useMemo(() => {
    const dias = parseInt(periodo);
    return dadosEvolucao.slice(-dias);
  }, [periodo]);

  const estatisticas = useMemo(() => {
    const total = dadosFiltrados.reduce((sum, d) => sum + d.gols, 0);
    const media = (total / dadosFiltrados.length).toFixed(2);
    const maximo = Math.max(...dadosFiltrados.map(d => d.gols));
    const minimo = Math.min(...dadosFiltrados.map(d => d.gols));
    const tendencia = dadosFiltrados[dadosFiltrados.length - 1].gols - dadosFiltrados[0].gols > 0 ? 'alta' : 'baixa';

    return { total, media, maximo, minimo, tendencia };
  }, [dadosFiltrados]);

  const exportarPDF = () => {
    alert('Exportação em PDF - Implementar com jsPDF');
  };

  return (
    <RaphaLayout title="Estatísticas" subtitle="Leitura visual de performance, tendências e evolução do modelo.">
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Estatísticas Avançadas</h1>
          <p className="text-slate-400">Análise detalhada de evolução de artilheiros e previsões</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={liga} onValueChange={setLiga}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Liga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Ligas</SelectItem>
              <SelectItem value="premier">Premier League</SelectItem>
              <SelectItem value="laliga">La Liga</SelectItem>
              <SelectItem value="serie-a">Série A</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportarPDF} className="w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Gols</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{estatisticas.total}</div>
              <p className="text-xs text-slate-500 mt-1">Últimos {periodo} dias</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{estatisticas.media}</div>
              <p className="text-xs text-slate-500 mt-1">Gols por dia</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Máximo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{estatisticas.maximo}</div>
              <p className="text-xs text-slate-500 mt-1">Melhor dia</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Tendência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {estatisticas.tendencia === 'alta' ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
                <span className="text-lg font-bold text-white capitalize">{estatisticas.tendencia}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Últimos {periodo} dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Evolução de Gols */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>📈 Evolução de Gols</CardTitle>
              <CardDescription>Últimos {periodo} dias com média histórica</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dadosFiltrados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dia" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Bar dataKey="gols" fill="#3b82f6" name="Gols" />
                  <Line type="monotone" dataKey="media" stroke="#10b981" name="Média" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evolução de Cartões */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>🟨 Evolução de Cartões</CardTitle>
              <CardDescription>Últimos {periodo} dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosFiltrados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dia" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Bar dataKey="cartoes" fill="#f59e0b" name="Cartões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Previsões */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>🔮 Previsões para Próximos 5 Jogos</CardTitle>
            <CardDescription>Baseado em análise de tendências e histórico recente</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={previsoes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="jogo" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Bar dataKey="previsao" fill="#8b5cf6" name="Previsão de Gols" />
                <Bar dataKey="confianca" fill="#06b6d4" name="Confiança %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela de Detalhes */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle>📋 Detalhes Diários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-4 text-slate-400">Dia</th>
                    <th className="text-left py-2 px-4 text-slate-400">Gols</th>
                    <th className="text-left py-2 px-4 text-slate-400">Média</th>
                    <th className="text-left py-2 px-4 text-slate-400">Cartões</th>
                    <th className="text-left py-2 px-4 text-slate-400">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((item, idx) => {
                    const anterior = idx > 0 ? dadosFiltrados[idx - 1].gols : item.gols;
                    const variacao = item.gols - anterior;
                    return (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="py-2 px-4 text-white">Dia {item.dia}</td>
                        <td className="py-2 px-4 text-blue-400 font-semibold">{item.gols}</td>
                        <td className="py-2 px-4 text-green-400">{item.media.toFixed(1)}</td>
                        <td className="py-2 px-4 text-yellow-400">{item.cartoes}</td>
                        <td className={`py-2 px-4 font-semibold ${variacao > 0 ? 'text-green-400' : variacao < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {variacao > 0 ? '+' : ''}{variacao}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </RaphaLayout>
  );
}
