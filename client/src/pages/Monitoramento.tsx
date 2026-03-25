import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface MetricaSnapshot {
  timestamp: Date;
  totalRecomendacoes: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  lucroTotal: number;
  roiMedio: number;
  confiancaMedia: number;
}

interface TendenciaAnalise {
  periodo: string;
  totalRecomendacoes: number;
  tendencia: 'melhora' | 'piora' | 'estável';
  mudancaTaxaAcerto: number;
}

export default function Monitoramento() {
  const [metricas, setMetricas] = useState<MetricaSnapshot | null>(null);
  const [historico, setHistorico] = useState<MetricaSnapshot[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaAnalise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const carregarDados = () => {
      const agora = new Date();
      const novaMetrica: MetricaSnapshot = {
        timestamp: agora,
        totalRecomendacoes: 1000 + Math.floor(Math.random() * 100),
        acertos: 600 + Math.floor(Math.random() * 50),
        erros: 400 + Math.floor(Math.random() * 50),
        taxaAcerto: 60 + Math.random() * 5,
        lucroTotal: 5000 + Math.random() * 2000,
        roiMedio: 5 + Math.random() * 2,
        confiancaMedia: 78 + Math.random() * 5,
      };

      setMetricas(novaMetrica);
      setHistorico(prev => [...prev.slice(-29), novaMetrica]);

      setTendencias({
        periodo: 'Últimos 7 dias',
        totalRecomendacoes: novaMetrica.totalRecomendacoes,
        tendencia: Math.random() > 0.5 ? 'melhora' : 'estável',
        mudancaTaxaAcerto: Math.random() * 10 - 5,
      });

      setLoading(false);
    };

    carregarDados();
    const intervalo = setInterval(carregarDados, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(intervalo);
  }, []);

  if (loading || !metricas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-400">Carregando monitoramento...</p>
        </div>
      </div>
    );
  }

  const taxaAcertoColor = metricas.taxaAcerto > 60 ? 'text-green-500' : metricas.taxaAcerto > 50 ? 'text-yellow-500' : 'text-red-500';
  const tendenciaColor = tendencias?.tendencia === 'melhora' ? 'text-green-500' : tendencias?.tendencia === 'piora' ? 'text-red-500' : 'text-gray-400';

  const dadosPizza = [
    { name: 'Acertos', value: metricas.acertos },
    { name: 'Erros', value: metricas.erros },
  ];

  const CORES = ['#10b981', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Monitoramento em Tempo Real</h1>
          <p className="text-gray-400">Acompanhe a performance do modelo ML em tempo real</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total de Recomendações */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metricas.totalRecomendacoes}</div>
              <p className="text-xs text-gray-500 mt-2">Histórico acumulado</p>
            </CardContent>
          </Card>

          {/* Taxa de Acerto */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Taxa de Acerto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${taxaAcertoColor}`}>
                {metricas.taxaAcerto.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-500 mt-2">Precisão do modelo</p>
            </CardContent>
          </Card>

          {/* ROI Médio */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">ROI Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{metricas.roiMedio.toFixed(2)}%</div>
              <p className="text-xs text-gray-500 mt-2">Retorno por aposta</p>
            </CardContent>
          </Card>

          {/* Confiança Média */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Confiança Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{metricas.confiancaMedia.toFixed(2)}%</div>
              <p className="text-xs text-gray-500 mt-2">Nível de confiança</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Linha - Histórico */}
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Taxa de Acerto</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="taxaAcerto"
                    stroke="#10b981"
                    dot={false}
                    name="Taxa de Acerto (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Acertos vs Erros */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Acertos vs Erros</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {CORES.map((cor, index) => (
                      <Cell key={`cell-${index}`} fill={cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tendências e Análise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card de Tendências */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Análise de Tendências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Período: {tendencias?.periodo}</p>
                <p className="text-2xl font-bold text-white">{tendencias?.totalRecomendacoes} recomendações</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Tendência</p>
                <div className="flex items-center gap-2">
                  {tendencias?.tendencia === 'melhora' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-semibold">Melhora</span>
                    </>
                  )}
                  {tendencias?.tendencia === 'piora' && (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-semibold">Piora</span>
                    </>
                  )}
                  {tendencias?.tendencia === 'estável' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 font-semibold">Estável</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Mudança na Taxa de Acerto</p>
                <p className={`text-xl font-bold ${tendencias && tendencias.mudancaTaxaAcerto > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {tendencias?.mudancaTaxaAcerto.toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Resumo */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Resumo de Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-gray-400">Acertos</span>
                <span className="text-green-500 font-semibold">{metricas.acertos}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-gray-400">Erros</span>
                <span className="text-red-500 font-semibold">{metricas.erros}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-gray-400">Lucro Total</span>
                <span className="text-blue-400 font-semibold">R$ {metricas.lucroTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                  ✓ Ativo
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nota de Atualização */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm">
            💡 Dados atualizados em tempo real. Próxima atualização em 5 segundos.
          </p>
        </div>
      </div>
    </div>
  );
}
