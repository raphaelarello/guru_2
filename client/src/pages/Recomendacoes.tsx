import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Recomendacao {
  id: string;
  jogador: string;
  time: string;
  mercado: string;
  predicao: string;
  confianca: number;
  motivos: string[];
  oddRecomendada: number;
  status: 'pendente' | 'acertou' | 'errou';
  dataGeracao: number;
}

export default function Recomendacoes() {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'acertadas' | 'erradas'>('todas');

  useEffect(() => {
    const carregarRecomendacoes = () => {
      setLoading(true);

      const recsMock: Recomendacao[] = [
        {
          id: '1',
          jogador: 'Erling Haaland',
          time: 'Manchester City',
          mercado: 'Gols (1º Tempo)',
          predicao: 'Sim (≥1 gol)',
          confianca: 92,
          motivos: [
            'Últimos 5 jogos: 5 gols no 1º tempo',
            'Forma atual: 95% (5/5 jogos com gol)',
            'Histórico vs Liverpool: 3 gols em 2 jogos',
            'Modelo prevê 87% de probabilidade',
          ],
          oddRecomendada: 2.15,
          status: 'acertou',
          dataGeracao: Date.now() - 86400000,
        },
        {
          id: '2',
          jogador: 'Vinícius Júnior',
          time: 'Real Madrid',
          mercado: 'Gols (Qualquer Momento)',
          predicao: 'Sim (≥1 gol)',
          confianca: 88,
          motivos: [
            'Últimos 10 jogos: 8 gols',
            'Forma: 80% (8/10 jogos com gol)',
            'Odds em 2.05 (value betting detectado)',
            'Modelo prevê 85% de probabilidade',
          ],
          oddRecomendada: 2.05,
          status: 'acertou',
          dataGeracao: Date.now() - 172800000,
        },
        {
          id: '3',
          jogador: 'Mbappé',
          time: 'PSG',
          mercado: 'Gols (Qualquer Momento)',
          predicao: 'Sim (≥1 gol)',
          confianca: 85,
          motivos: [
            'Últimos 5 jogos: 4 gols',
            'Forma: 80% (4/5 jogos com gol)',
            'Histórico em casa: 92% de acerto',
            'Modelo prevê 82% de probabilidade',
          ],
          oddRecomendada: 1.95,
          status: 'pendente',
          dataGeracao: Date.now() - 3600000,
        },
        {
          id: '4',
          jogador: 'Neymar',
          time: 'Al-Hilal',
          mercado: 'Assistências (≥1)',
          predicao: 'Sim',
          confianca: 78,
          motivos: [
            'Últimos 8 jogos: 5 assistências',
            'Forma: 62% (5/8 jogos com assistência)',
            'Modelo prevê 76% de probabilidade',
            'Odds em 2.25 (ligeiro value)',
          ],
          oddRecomendada: 2.25,
          status: 'pendente',
          dataGeracao: Date.now() - 7200000,
        },
        {
          id: '5',
          jogador: 'Harry Kane',
          time: 'Bayern Munich',
          mercado: 'Gols (Qualquer Momento)',
          predicao: 'Sim (≥1 gol)',
          confianca: 81,
          motivos: [
            'Últimos 6 jogos: 5 gols',
            'Forma: 83% (5/6 jogos com gol)',
            'Histórico vs Dortmund: 4 gols em 3 jogos',
            'Modelo prevê 79% de probabilidade',
          ],
          oddRecomendada: 1.88,
          status: 'errou',
          dataGeracao: Date.now() - 259200000,
        },
        {
          id: '6',
          jogador: 'Rodrygo',
          time: 'Real Madrid',
          mercado: 'Gols (1º Tempo)',
          predicao: 'Sim (≥1 gol)',
          confianca: 75,
          motivos: [
            'Últimos 4 jogos: 2 gols no 1º tempo',
            'Forma: 50% (2/4 jogos com gol no 1º)',
            'Modelo prevê 73% de probabilidade',
            'Odds em 2.80 (bom value)',
          ],
          oddRecomendada: 2.80,
          status: 'pendente',
          dataGeracao: Date.now() - 10800000,
        },
      ];

      setRecomendacoes(recsMock);
      setLoading(false);
    };

    carregarRecomendacoes();
  }, []);

  const filtradas = recomendacoes.filter((rec) => {
    if (filtro === 'todas') return true;
    if (filtro === 'pendentes') return rec.status === 'pendente';
    if (filtro === 'acertadas') return rec.status === 'acertou';
    if (filtro === 'erradas') return rec.status === 'errou';
    return true;
  });

  const stats = {
    total: recomendacoes.length,
    acertadas: recomendacoes.filter(r => r.status === 'acertou').length,
    erradas: recomendacoes.filter(r => r.status === 'errou').length,
    pendentes: recomendacoes.filter(r => r.status === 'pendente').length,
  };

  const taxaAcerto = stats.total > 0
    ? ((stats.acertadas / (stats.acertadas + stats.erradas)) * 100).toFixed(1)
    : '0';

  const confiancaMedia = recomendacoes.length > 0
    ? (recomendacoes.reduce((acc, r) => acc + r.confianca, 0) / recomendacoes.length).toFixed(0)
    : '0';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acertou':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'errou':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'acertou':
        return <CheckCircle className="w-4 h-4" />;
      case 'errou':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getConfiancaColor = (confianca: number) => {
    if (confianca >= 85) return 'text-emerald-400';
    if (confianca >= 75) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Recomendações ML</h1>
              <p className="text-slate-400">Apostas recomendadas pelo modelo de machine learning</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Total</div>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Acertadas</div>
                <div className="text-3xl font-bold text-emerald-400">{stats.acertadas}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Erradas</div>
                <div className="text-3xl font-bold text-red-400">{stats.erradas}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Taxa de Acerto</div>
                <div className="text-3xl font-bold text-purple-400">{taxaAcerto}%</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Confiança Média</div>
                <div className="text-3xl font-bold text-blue-400">{confiancaMedia}%</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['todas', 'pendentes', 'acertadas', 'erradas'].map((f) => (
            <Button
              key={f}
              onClick={() => setFiltro(f as any)}
              variant={filtro === f ? 'default' : 'outline'}
              className={filtro === f ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'todas' && ` (${stats.total})`}
              {f === 'pendentes' && ` (${stats.pendentes})`}
              {f === 'acertadas' && ` (${stats.acertadas})`}
              {f === 'erradas' && ` (${stats.erradas})`}
            </Button>
          ))}
        </div>

        {/* Recomendações */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block">
                <RefreshCw className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-slate-400 mt-4">Carregando recomendações...</p>
            </div>
          ) : filtradas.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-400">Nenhuma recomendação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filtradas.map((rec) => (
              <Card
                key={rec.id}
                className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {rec.jogador}
                        </h3>
                        <span className="text-sm text-slate-400">
                          ({rec.time})
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {rec.mercado} • {rec.predicao}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getConfiancaColor(rec.confianca)}`}>
                          {rec.confianca}%
                        </div>
                        <div className="text-xs text-slate-500">Confiança</div>
                      </div>
                      <Badge className={`${getStatusColor(rec.status)} border flex items-center gap-1`}>
                        {getStatusIcon(rec.status)}
                        {rec.status === 'acertou' && 'Acertou'}
                        {rec.status === 'errou' && 'Errou'}
                        {rec.status === 'pendente' && 'Pendente'}
                      </Badge>
                    </div>
                  </div>

                  {/* Motivos */}
                  <div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <div className="text-xs font-semibold text-slate-300 mb-2">Motivos da Recomendação:</div>
                    <ul className="space-y-1">
                      {rec.motivos.map((motivo, idx) => (
                        <li key={idx} className="text-sm text-slate-400 flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          {motivo}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Odd Recomendada */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Odd Recomendada</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {rec.oddRecomendada.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={rec.status !== 'pendente'}
                    >
                      {rec.status === 'pendente' ? 'Apostar Agora' : 'Ver Resultado'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
