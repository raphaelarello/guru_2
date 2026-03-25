import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Recomendacao {
  jogador: string;
  tipo: 'gols_totais' | 'gols_1_tempo' | 'assistencias';
  confianca: number;
  probabilidade: number;
  roi: number;
  timestamp: Date;
}

export default function Recomendacoes() {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'gols_totais' | 'gols_1_tempo' | 'assistencias'>('todos');

  useEffect(() => {
    // Simular dados de recomendações
    const mockRecomendacoes: Recomendacao[] = [
      {
        jogador: 'Erling Haaland',
        tipo: 'gols_totais',
        confianca: 92,
        probabilidade: 0.65,
        roi: 0.125,
        timestamp: new Date(),
      },
      {
        jogador: 'Vinícius Júnior',
        tipo: 'gols_1_tempo',
        confianca: 85,
        probabilidade: 0.42,
        roi: 0.085,
        timestamp: new Date(),
      },
      {
        jogador: 'Kylian Mbappé',
        tipo: 'gols_totais',
        confianca: 88,
        probabilidade: 0.58,
        roi: 0.105,
        timestamp: new Date(),
      },
      {
        jogador: 'Phil Foden',
        tipo: 'assistencias',
        confianca: 78,
        probabilidade: 0.35,
        roi: 0.065,
        timestamp: new Date(),
      },
      {
        jogador: 'Rodrygo',
        tipo: 'gols_1_tempo',
        confianca: 82,
        probabilidade: 0.38,
        roi: 0.075,
        timestamp: new Date(),
      },
    ];

    setRecomendacoes(mockRecomendacoes);
    setLoading(false);
  }, []);

  const filtradas = recomendacoes.filter(r => {
    if (filtro === 'todos') return true;
    return r.tipo === filtro;
  });

  const topRecomendacoes = filtradas.sort((a, b) => b.roi - a.roi).slice(0, 5);

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'gols_totais':
        return 'Gols Totais';
      case 'gols_1_tempo':
        return 'Gols 1º Tempo';
      case 'assistencias':
        return 'Assistências';
      default:
        return tipo;
    }
  };

  const getConfiancaColor = (confianca: number) => {
    if (confianca >= 90) return 'bg-green-500/20 text-green-600';
    if (confianca >= 80) return 'bg-emerald-500/20 text-emerald-600';
    if (confianca >= 70) return 'bg-yellow-500/20 text-yellow-600';
    return 'bg-orange-500/20 text-orange-600';
  };

  const chartData = topRecomendacoes.map(r => ({
    nome: r.jogador,
    confianca: r.confianca,
    roi: r.roi * 100,
    probabilidade: r.probabilidade * 100,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl font-bold text-white">Recomendações ML</h1>
          </div>
          <p className="text-slate-400">Modelo de IA recomenda as melhores apostas baseado em histórico</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {(['todos', 'gols_totais', 'gols_1_tempo', 'assistencias'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filtro === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f === 'todos' ? 'Todas' : getTipoLabel(f)}
            </button>
          ))}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Recomendações</p>
                <p className="text-3xl font-bold text-white mt-2">{filtradas.length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Confiança Média</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {filtradas.length > 0
                    ? (filtradas.reduce((sum, r) => sum + r.confianca, 0) / filtradas.length).toFixed(0)
                    : '0'}
                  %
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">ROI Médio</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {filtradas.length > 0
                    ? ((filtradas.reduce((sum, r) => sum + r.roi, 0) / filtradas.length) * 100).toFixed(2)
                    : '0'}
                  %
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Probabilidade Média</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {filtradas.length > 0
                    ? ((filtradas.reduce((sum, r) => sum + r.probabilidade, 0) / filtradas.length) * 100).toFixed(0)
                    : '0'}
                  %
                </p>
              </div>
              <Brain className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Confiança vs ROI</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="nome" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Bar dataKey="confianca" fill="#8b5cf6" name="Confiança (%)" />
                  <Bar dataKey="roi" fill="#10b981" name="ROI (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Evolução de Probabilidade</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="nome" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Line type="monotone" dataKey="probabilidade" stroke="#3b82f6" name="Probabilidade (%)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Lista de Recomendações */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Carregando recomendações...</p>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhuma recomendação encontrada</p>
            </div>
          ) : (
            filtradas.map((rec, idx) => (
              <Card
                key={idx}
                className="bg-slate-800/50 border-slate-700 p-6 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">{rec.jogador}</h3>
                      <Badge className="bg-purple-500/20 text-purple-600">
                        {getTipoLabel(rec.tipo)}
                      </Badge>
                      <Badge className={getConfiancaColor(rec.confianca)}>
                        Confiança: {rec.confianca}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Probabilidade</p>
                        <p className="text-white font-semibold">{(rec.probabilidade * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">ROI Esperado</p>
                        <p className="text-white font-semibold">{(rec.roi * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Status</p>
                        <p className="text-green-400 font-semibold">✓ Recomendado</p>
                      </div>
                    </div>
                  </div>

                  <button className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                    Apostar
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
