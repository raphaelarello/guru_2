import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, Calendar, BarChart3 } from 'lucide-react';

interface PerformanceData {
  date: string;
  acertos: number;
  erros: number;
  roi: number;
  score: number;
}

export default function RelatorioPerfomance() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Gerar dados simulados
  const performanceData = useMemo(() => {
    const data: PerformanceData[] = [];
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toLocaleDateString('pt-BR'),
        acertos: Math.floor(Math.random() * 15 + 5),
        erros: Math.floor(Math.random() * 10 + 2),
        roi: Math.random() * 40 - 10,
        score: Math.floor(Math.random() * 30 + 60),
      });
    }

    return data;
  }, [period]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalAcertos = performanceData.reduce((sum, d) => sum + d.acertos, 0);
    const totalErros = performanceData.reduce((sum, d) => sum + d.erros, 0);
    const taxaAcerto = (totalAcertos / (totalAcertos + totalErros)) * 100;
    const roiMedio = performanceData.reduce((sum, d) => sum + d.roi, 0) / performanceData.length;
    const scoreMedio = performanceData.reduce((sum, d) => sum + d.score, 0) / performanceData.length;
    const melhorDia = performanceData.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return {
      totalAcertos,
      totalErros,
      taxaAcerto: taxaAcerto.toFixed(1),
      roiMedio: roiMedio.toFixed(2),
      scoreMedio: scoreMedio.toFixed(1),
      melhorDia,
    };
  }, [performanceData]);

  const handleExportPDF = () => {
    console.log('Exportando PDF...');
    // Implementar exportação PDF
  };

  const handleExportCSV = () => {
    console.log('Exportando CSV...');
    // Implementar exportação CSV
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">Relatório de Performance</h1>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map(p => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                className={`${
                  period === p
                    ? 'bg-yellow-500 text-black'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {p === '7d' ? 'Última Semana' : p === '30d' ? 'Último Mês' : 'Últimos 3 Meses'}
              </Button>
            ))}
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Total de Acertos</p>
              <p className="text-3xl font-bold text-green-400">{stats.totalAcertos}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Total de Erros</p>
              <p className="text-3xl font-bold text-red-400">{stats.totalErros}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Taxa de Acerto</p>
              <p className="text-3xl font-bold text-blue-400">{stats.taxaAcerto}%</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">ROI Médio</p>
              <p className={`text-3xl font-bold ${parseFloat(stats.roiMedio) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.roiMedio}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Score Médio</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.scoreMedio}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-2">Melhor Dia</p>
              <p className="text-lg font-bold text-white">{stats.melhorDia.date}</p>
              <p className="text-sm text-yellow-400">Score: {stats.melhorDia.score}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Acertos vs Erros */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Acertos vs Erros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.slice(-7).map((data, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{data.date}</span>
                      <span className="text-white font-semibold">
                        {data.acertos}/{data.erros}
                      </span>
                    </div>
                    <div className="flex gap-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(data.acertos / (data.acertos + data.erros)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${(data.erros / (data.acertos + data.erros)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de ROI */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">ROI por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.slice(-7).map((data, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{data.date}</span>
                      <span className={data.roi > 0 ? 'text-green-400' : 'text-red-400'}>
                        {data.roi.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={data.roi > 0 ? 'bg-green-500' : 'bg-red-500'}
                        style={{
                          width: `${Math.min(Math.abs(data.roi), 50)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Histórico Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Data</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                      Acertos
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Erros</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                      Taxa de Acerto
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">ROI</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((data, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="py-3 px-4 text-gray-300">{data.date}</td>
                      <td className="text-center py-3 px-4 text-green-400 font-semibold">
                        {data.acertos}
                      </td>
                      <td className="text-center py-3 px-4 text-red-400 font-semibold">
                        {data.erros}
                      </td>
                      <td className="text-center py-3 px-4 text-blue-400">
                        {(
                          (data.acertos / (data.acertos + data.erros)) *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                      <td
                        className={`text-center py-3 px-4 font-semibold ${
                          data.roi > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {data.roi.toFixed(2)}%
                      </td>
                      <td className="text-center py-3 px-4 text-yellow-400 font-semibold">
                        {data.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/50 mt-8">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300">
              ✅ Sua taxa de acerto de <span className="font-bold text-green-400">{stats.taxaAcerto}%</span> está{' '}
              <span className="font-bold">acima da média</span> (60% esperado).
            </p>
            <p className="text-gray-300">
              💰 ROI médio de <span className="font-bold text-yellow-400">{stats.roiMedio}%</span> indica{' '}
              <span className="font-bold">bom desempenho</span> nas últimas apostas.
            </p>
            <p className="text-gray-300">
              📈 Seu melhor dia foi <span className="font-bold">{stats.melhorDia.date}</span> com score de{' '}
              <span className="font-bold text-yellow-400">{stats.melhorDia.score}</span>.
            </p>
            <p className="text-gray-300">
              🎯 Continue focando em apostas com score &gt; 75 para manter a consistência.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
