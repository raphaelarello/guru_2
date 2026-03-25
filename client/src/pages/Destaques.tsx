import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Target, TrendingUp, AlertCircle } from "lucide-react";

export default function Destaques() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedLeague, setSelectedLeague] = useState<string>("todas");
  const [selectedTime, setSelectedTime] = useState<any>(null);

  const { data, isLoading } = trpc.destaques.hoje.useQuery({ date: selectedDate });

  // Combinar todos os times destacados
  const allTimes = [
    ...(data?.timesEscanteios || []),
    ...(data?.timesGols || []),
    ...(data?.timesChutes || []),
    ...(data?.timesCartoes || [])
  ];

  // Ligas únicas
  const ligas = Array.from(new Set(allTimes.map((t: any) => t.leagueName)));

  // Filtrar por liga
  const filterByLeague = (times: any[]) => {
    if (selectedLeague === "todas") return times;
    return times.filter((t: any) => t.leagueName === selectedLeague);
  };

  const TimeCard = ({ time }: { time: any }) => (
    <Card
      onClick={() => setSelectedTime(time)}
      className="bg-slate-800/50 border-slate-700 hover:border-green-500 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm text-gray-400">{time.leagueName}</p>
            <p className="text-white font-semibold flex items-center gap-2">
              <img src={time.teamLogo} alt={time.teamName} className="w-5 h-5 rounded-full" />
              {time.teamName}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs {time.opponent} • {time.matchTime}</p>
          </div>
          <Badge className="bg-green-500/20 border-green-500 text-green-400">{time.tipo}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Indicador:</span>
            <span className="text-white font-semibold">{time.indicador?.toFixed(1) || 0}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
              style={{ width: `${Math.min(100, (time.indicador || 0) / 2)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div><span className="text-gray-500">Gols:</span> <span className="text-white">{time.mediaGols?.toFixed(1)}</span></div>
            <div><span className="text-gray-500">Forma:</span> <span className="text-white">{time.forma}</span></div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Zap className="w-8 h-8 text-green-400" />
          Destaques do Dia
        </h1>
        <p className="text-gray-400">Análise completa de {data?.totalJogos || 0} jogos em {data?.totalLigas || 0} ligas</p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Liga</label>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
          >
            <option value="todas">Todas as Ligas</option>
            {ligas.map(liga => (
              <option key={liga} value={liga}>{liga}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => window.location.reload()} className="w-full bg-green-600 hover:bg-green-700">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total de Destaques</span>
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{allTimes.length}</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Gols</span>
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{(data?.timesGols || []).length}</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Escanteios</span>
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{(data?.timesEscanteios || []).length}</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Jogos Hoje</span>
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{data?.totalJogos || 0}</p>
          </div>
        </Card>
      </div>

      {/* Destaques por Tipo */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-700 p-1">
          <TabsTrigger value="todos">Todos ({allTimes.length})</TabsTrigger>
          <TabsTrigger value="gols">Gols ({(data?.timesGols || []).length})</TabsTrigger>
          <TabsTrigger value="escanteios">Escanteios ({(data?.timesEscanteios || []).length})</TabsTrigger>
          <TabsTrigger value="chutes">Chutes ({(data?.timesChutes || []).length})</TabsTrigger>
          <TabsTrigger value="cartoes">Cartões ({(data?.timesCartoes || []).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : allTimes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum destaque disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByLeague(allTimes).map((time: any, idx: number) => (
                <TimeCard key={idx} time={time} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gols" className="mt-6">
          {filterByLeague(data?.timesGols || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum destaque de Gols disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByLeague(data?.timesGols || []).map((time: any, idx: number) => (
                <TimeCard key={idx} time={time} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="escanteios" className="mt-6">
          {filterByLeague(data?.timesEscanteios || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum destaque de Escanteios disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByLeague(data?.timesEscanteios || []).map((time: any, idx: number) => (
                <TimeCard key={idx} time={time} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chutes" className="mt-6">
          {filterByLeague(data?.timesChutes || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum destaque de Chutes disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByLeague(data?.timesChutes || []).map((time: any, idx: number) => (
                <TimeCard key={idx} time={time} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cartoes" className="mt-6">
          {filterByLeague(data?.timesCartoes || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum destaque de Cartões disponível</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByLeague(data?.timesCartoes || []).map((time: any, idx: number) => (
                <TimeCard key={idx} time={time} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Análise */}
      <Dialog open={!!selectedTime} onOpenChange={() => setSelectedTime(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedTime?.teamName} - Destaque em {selectedTime?.tipo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={selectedTime?.teamLogo} alt={selectedTime?.teamName} className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-white font-semibold">{selectedTime?.teamName}</p>
                <p className="text-gray-400 text-sm">{selectedTime?.leagueName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Indicador:</p>
                <p className="text-white text-xl font-bold">{selectedTime?.indicador?.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Tipo:</p>
                <Badge className="bg-green-500/20 border-green-500 text-green-400">{selectedTime?.tipo}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Média de Gols</p>
                <p className="text-white font-semibold">{selectedTime?.mediaGols?.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Forma</p>
                <p className="text-white font-semibold">{selectedTime?.forma}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Horário</p>
                <p className="text-white font-semibold">{selectedTime?.matchTime}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
