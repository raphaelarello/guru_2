import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Trophy, TrendingUp, TrendingDown, Minus,
  Home, Plane, Target, Shield, Zap, Users, BarChart3,
  ArrowLeftRight, Calendar, Star, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface TimeInfo {
  id: number;
  nome: string;
  logo: string;
  pais: string;
  fundado?: number;
  estadio?: string;
  capacidade?: number;
}

interface JogoForma {
  fixtureId: number;
  data: string;
  adversario: string;
  adversarioLogo: string;
  local: "Casa" | "Fora";
  placar: string;
  resultado: "V" | "E" | "D";
  liga: string;
  ligaLogo: string;
  rodada: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ResultadoBadge({ r }: { r: "V" | "E" | "D" }) {
  const cfg = {
    V: { label: "V", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    E: { label: "E", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    D: { label: "D", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  }[r];
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function FormaStreak({ jogos }: { jogos: JogoForma[] }) {
  const ultimos5 = jogos.slice(0, 5);
  return (
    <div className="flex gap-1">
      {ultimos5.map((j, i) => (
        <ResultadoBadge key={i} r={j.resultado} />
      ))}
      {ultimos5.length === 0 && <span className="text-muted-foreground text-xs">Sem dados</span>}
    </div>
  );
}

// ─── Componente de Busca de Time ──────────────────────────────────────────────
function BuscaTime({
  label,
  onSelect,
  selected,
}: {
  label: string;
  onSelect: (t: TimeInfo) => void;
  selected: TimeInfo | null;
}) {
  const [busca, setBusca] = useState("");
  const [query, setQuery] = useState("");

  const { data: resultados, isLoading } = trpc.times.buscar.useQuery(
    { nome: query },
    { enabled: query.length >= 2 }
  );

  const handleSearch = useCallback(() => {
    if (busca.trim().length >= 2) setQuery(busca.trim());
  }, [busca]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {selected ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <img src={selected.logo} alt={selected.nome} className="w-10 h-10 object-contain" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">{selected.nome}</p>
            <p className="text-xs text-muted-foreground">{selected.pais} {selected.fundado ? `• Fundado em ${selected.fundado}` : ""}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { onSelect({ id: 0, nome: "", logo: "", pais: "" }); setBusca(""); setQuery(""); }}>
            Trocar
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Flamengo, Real Madrid..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="bg-muted/30"
            />
            <Button onClick={handleSearch} disabled={busca.length < 2}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {isLoading && <p className="text-xs text-muted-foreground animate-pulse">Buscando...</p>}
          {resultados && resultados.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden max-h-48 overflow-y-auto">
              {resultados.map((t: TimeInfo) => (
                <button
                  key={t.id}
                  onClick={() => { onSelect(t); setBusca(""); setQuery(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <img src={t.logo} alt={t.nome} className="w-8 h-8 object-contain flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.pais}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {resultados && resultados.length === 0 && query && (
            <p className="text-xs text-muted-foreground">Nenhum time encontrado para "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Forma Recente ───────────────────────────────────────────────────────
function AbaFormaRecente({ teamId }: { teamId: number }) {
  const { data: jogos, isLoading } = trpc.times.formaRecente.useQuery({ teamId, last: 10 });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando forma recente...</div>;
  if (!jogos || jogos.length === 0) return <div className="text-center py-12 text-muted-foreground">Nenhum jogo encontrado</div>;

  const vitorias = jogos.filter(j => j.resultado === "V").length;
  const empates = jogos.filter(j => j.resultado === "E").length;
  const derrotas = jogos.filter(j => j.resultado === "D").length;
  const golsMarcados = jogos.reduce((s, j) => s + parseInt(j.placar.split("-")[0] ?? "0"), 0);
  const golsSofridos = jogos.reduce((s, j) => s + parseInt(j.placar.split("-")[1] ?? "0"), 0);
  const cleanSheets = jogos.filter(j => j.placar.split("-")[1] === "0").length;

  // Dados para gráfico
  const dadosGrafico = jogos.slice().reverse().map((j, i) => ({
    jogo: i + 1,
    gols: parseInt(j.placar.split("-")[0] ?? "0"),
    golsSofridos: parseInt(j.placar.split("-")[1] ?? "0"),
    resultado: j.resultado,
  }));

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Vitórias", val: vitorias, cls: "text-green-400", icon: "🏆" },
          { label: "Empates", val: empates, cls: "text-yellow-400", icon: "🤝" },
          { label: "Derrotas", val: derrotas, cls: "text-red-400", icon: "❌" },
          { label: "Gols Marcados", val: golsMarcados, cls: "text-primary", icon: "⚽" },
          { label: "Gols Sofridos", val: golsSofridos, cls: "text-orange-400", icon: "🥅" },
          { label: "Clean Sheets", val: cleanSheets, cls: "text-cyan-400", icon: "🛡️" },
        ].map(s => (
          <Card key={s.label} className="bg-muted/20 border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black ${s.cls}`}>{s.val}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de gols */}
      <Card className="bg-muted/20 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Gols por Jogo (últimos {jogos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dadosGrafico} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="jogo" tick={{ fontSize: 11, fill: "#888" }} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                labelStyle={{ color: "#aaa" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="gols" name="Gols Marcados" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="golsSofridos" name="Gols Sofridos" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de jogos */}
      <div className="space-y-2">
        {jogos.map(j => (
          <div key={j.fixtureId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-border/60 transition-colors">
            <ResultadoBadge r={j.resultado} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={j.adversarioLogo} alt={j.adversario} className="w-7 h-7 object-contain flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">vs {j.adversario}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <img src={j.ligaLogo} alt={j.liga} className="w-3.5 h-3.5 object-contain" />
                  <span className="truncate">{j.liga}</span>
                  <span>•</span>
                  <span>{j.rodada}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-lg">{j.placar}</div>
              <div className="text-[10px] text-muted-foreground">
                {j.local === "Casa" ? <span className="text-blue-400">🏠 Casa</span> : <span className="text-orange-400">✈️ Fora</span>}
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex-shrink-0 hidden md:block">
              {new Date(j.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aba: H2H ─────────────────────────────────────────────────────────────────
function AbaH2H({ time1, time2 }: { time1: TimeInfo; time2: TimeInfo }) {
  const { data, isLoading } = trpc.times.h2h.useQuery(
    { team1Id: time1.id, team2Id: time2.id, last: 10 },
    { enabled: time1.id > 0 && time2.id > 0 }
  );

  if (!time2.id) return (
    <div className="text-center py-16 text-muted-foreground">
      <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Selecione o segundo time para ver o confronto direto</p>
    </div>
  );

  if (isLoading) return <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando H2H...</div>;
  if (!data || data.jogos.length === 0) return <div className="text-center py-12 text-muted-foreground">Sem histórico de confrontos</div>;

  const { stats, jogos } = data;
  const total = stats.vitorias1 + stats.vitorias2 + stats.empates;

  return (
    <div className="space-y-6">
      {/* Placar H2H */}
      <Card className="bg-gradient-to-r from-primary/10 via-muted/20 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <img src={time1.logo} alt={time1.nome} className="w-16 h-16 object-contain mx-auto mb-2" />
              <p className="font-bold text-sm">{time1.nome}</p>
              <p className="text-4xl font-black text-green-400 mt-2">{stats.vitorias1}</p>
              <p className="text-xs text-muted-foreground">vitórias</p>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl font-black text-muted-foreground">{stats.empates}</div>
              <div className="text-xs text-muted-foreground">empates</div>
              <div className="mt-3 text-xs text-muted-foreground">{total} jogos</div>
            </div>
            <div className="text-center flex-1">
              <img src={time2.logo} alt={time2.nome} className="w-16 h-16 object-contain mx-auto mb-2" />
              <p className="font-bold text-sm">{time2.nome}</p>
              <p className="text-4xl font-black text-red-400 mt-2">{stats.vitorias2}</p>
              <p className="text-xs text-muted-foreground">vitórias</p>
            </div>
          </div>

          {/* Barra de domínio */}
          <div className="mt-4">
            <div className="flex rounded-full overflow-hidden h-3">
              <div
                className="bg-green-500 transition-all"
                style={{ width: total > 0 ? `${(stats.vitorias1 / total) * 100}%` : "33%" }}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: total > 0 ? `${(stats.empates / total) * 100}%` : "34%" }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: total > 0 ? `${(stats.vitorias2 / total) * 100}%` : "33%" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{total > 0 ? Math.round((stats.vitorias1 / total) * 100) : 0}%</span>
              <span>Gols: {stats.golsTime1} × {stats.golsTime2}</span>
              <span>{total > 0 ? Math.round((stats.vitorias2 / total) * 100) : 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de confrontos */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Histórico de Confrontos</h3>
        {jogos.map(j => (
          <div key={j.fixtureId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={j.timeCasaLogo} alt={j.timeCasa} className="w-7 h-7 object-contain" />
              <span className="text-sm font-medium truncate hidden sm:block">{j.timeCasa}</span>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="font-black text-lg px-3">{j.placar}</div>
              <div className="text-[10px] text-muted-foreground">{j.liga}</div>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-medium truncate hidden sm:block">{j.timeVisitante}</span>
              <img src={j.timeVisitanteLogo} alt={j.timeVisitante} className="w-7 h-7 object-contain" />
            </div>
            <div className="text-xs text-muted-foreground flex-shrink-0 hidden md:block">
              {new Date(j.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aba: Estatísticas da Temporada ──────────────────────────────────────────
function AbaEstatisticas({ teamId, ligas }: { teamId: number; ligas: { id: number; nome: string; logo: string }[] }) {
  const [ligaSelecionada, setLigaSelecionada] = useState<number | null>(null);
  const ligaId = ligaSelecionada ?? ligas[0]?.id ?? 0;

  const { data: stats, isLoading } = trpc.times.estatisticas.useQuery(
    { teamId, leagueId: ligaId, season: 2024 },
    { enabled: ligaId > 0 }
  );

  if (ligas.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Nenhuma liga encontrada para este time</p>
    </div>
  );

  const s = stats as any;

  const dadosRadar = s ? [
    { subject: "Gols", A: Math.min(100, (s.goals?.for?.average?.total ?? 0) * 33) },
    { subject: "Defesa", A: Math.min(100, 100 - (s.goals?.against?.average?.total ?? 0) * 25) },
    { subject: "Posse", A: s.fixtures?.wins?.total > 0 ? Math.round((s.fixtures.wins.total / (s.fixtures.played?.total ?? 1)) * 100) : 50 },
    { subject: "Casa", A: s.fixtures?.played?.home > 0 ? Math.round((s.fixtures.wins.home / s.fixtures.played.home) * 100) : 50 },
    { subject: "Fora", A: s.fixtures?.played?.away > 0 ? Math.round((s.fixtures.wins.away / s.fixtures.played.away) * 100) : 50 },
    { subject: "Forma", A: s.form ? Math.round((s.form.split("").filter((c: string) => c === "W").length / s.form.length) * 100) : 50 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Seletor de liga */}
      <div className="flex flex-wrap gap-2">
        {ligas.slice(0, 6).map(l => (
          <button
            key={l.id}
            onClick={() => setLigaSelecionada(l.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
              (ligaSelecionada ?? ligas[0]?.id) === l.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30"
            }`}
          >
            <img src={l.logo} alt={l.nome} className="w-4 h-4 object-contain" />
            {l.nome}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando estatísticas...</div>}

      {s && (
        <div className="space-y-4">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Jogos", val: s.fixtures?.played?.total ?? 0, icon: "📅", cls: "text-foreground" },
              { label: "Vitórias", val: s.fixtures?.wins?.total ?? 0, icon: "🏆", cls: "text-green-400" },
              { label: "Empates", val: s.fixtures?.draws?.total ?? 0, icon: "🤝", cls: "text-yellow-400" },
              { label: "Derrotas", val: s.fixtures?.loses?.total ?? 0, icon: "❌", cls: "text-red-400" },
              { label: "Gols Marcados", val: s.goals?.for?.total?.total ?? 0, icon: "⚽", cls: "text-primary" },
              { label: "Gols Sofridos", val: s.goals?.against?.total?.total ?? 0, icon: "🥅", cls: "text-orange-400" },
              { label: "Média Gols/Jogo", val: s.goals?.for?.average?.total ?? "—", icon: "📊", cls: "text-cyan-400" },
              { label: "Clean Sheets", val: s.clean_sheet?.total ?? 0, icon: "🛡️", cls: "text-blue-400" },
            ].map(c => (
              <Card key={c.label} className="bg-muted/20 border-border/50">
                <CardContent className="p-3 text-center">
                  <div className="text-xl mb-1">{c.icon}</div>
                  <div className={`text-2xl font-black ${c.cls}`}>{c.val}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{c.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar */}
          {dadosRadar.length > 0 && (
            <Card className="bg-muted/20 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Perfil de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={dadosRadar}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#888" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name="Time" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Forma recente */}
          {s.form && (
            <Card className="bg-muted/20 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Forma na Temporada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {s.form.split("").map((c: string, i: number) => (
                    <span
                      key={i}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold border ${
                        c === "W" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        c === "D" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {c === "W" ? "V" : c === "D" ? "E" : "D"}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Times() {
  const [time1, setTime1] = useState<TimeInfo | null>(null);
  const [time2, setTime2] = useState<TimeInfo | null>(null);
  const [abaAtiva, setAbaAtiva] = useState("forma");

  const { data: ligas1 } = trpc.times.ligas.useQuery(
    { teamId: time1?.id ?? 0 },
    { enabled: (time1?.id ?? 0) > 0 }
  );

  const { data: ligas2 } = trpc.times.ligas.useQuery(
    { teamId: time2?.id ?? 0 },
    { enabled: (time2?.id ?? 0) > 0 }
  );

  const handleSelect1 = (t: TimeInfo) => setTime1(t.id > 0 ? t : null);
  const handleSelect2 = (t: TimeInfo) => setTime2(t.id > 0 ? t : null);

  return (
    <RaphaLayout title="Estatísticas de Times">
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black">Estatísticas de Times</h1>
            <p className="text-sm text-muted-foreground">Forma recente, H2H e análise completa da temporada</p>
          </div>
        </div>

        {/* Busca de times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/20 border-border/50">
            <CardContent className="p-4">
              <BuscaTime label="Time Principal" onSelect={handleSelect1} selected={time1} />
            </CardContent>
          </Card>
          <Card className="bg-muted/20 border-border/50">
            <CardContent className="p-4">
              <BuscaTime label="Time para Comparar (H2H)" onSelect={handleSelect2} selected={time2} />
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        {time1 ? (
          <div className="space-y-4">
            {/* Info do time */}
            <Card className="bg-gradient-to-r from-primary/5 to-muted/20 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <img src={time1.logo} alt={time1.nome} className="w-16 h-16 object-contain" />
                <div className="flex-1">
                  <h2 className="text-2xl font-black">{time1.nome}</h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{time1.pais}</Badge>
                    {time1.fundado && <Badge variant="outline" className="text-xs">Fundado {time1.fundado}</Badge>}
                    {time1.estadio && <Badge variant="outline" className="text-xs">🏟️ {time1.estadio}</Badge>}
                    {time1.capacidade && <Badge variant="outline" className="text-xs">{time1.capacidade?.toLocaleString()} lugares</Badge>}
                  </div>
                </div>
                {time2 && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-muted-foreground font-bold">vs</span>
                    <img src={time2.logo} alt={time2.nome} className="w-12 h-12 object-contain" />
                    <div>
                      <p className="font-bold text-sm">{time2.nome}</p>
                      <p className="text-xs text-muted-foreground">{time2.pais}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Abas */}
            <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
              <TabsList className="bg-muted/30 border border-border/50 w-full md:w-auto">
                <TabsTrigger value="forma" className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Forma Recente
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Temporada
                </TabsTrigger>
                <TabsTrigger value="h2h" className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" /> H2H
                  {time2 && <span className="w-2 h-2 rounded-full bg-primary ml-1" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="forma" className="mt-4">
                <AbaFormaRecente teamId={time1.id} />
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <AbaEstatisticas
                  teamId={time1.id}
                  ligas={(ligas1 ?? []).map((l: { id: number; nome: string; logo: string }) => ({ id: l.id, nome: l.nome, logo: l.logo }))}
                />
              </TabsContent>

              <TabsContent value="h2h" className="mt-4">
                <AbaH2H time1={time1} time2={time2 ?? { id: 0, nome: "", logo: "", pais: "" }} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="bg-muted/20 border-border/50">
            <CardContent className="py-20 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Busque um time para começar</h3>
              <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                Digite o nome de qualquer time do mundo para ver forma recente, estatísticas da temporada e confronto direto H2H
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["Flamengo", "Real Madrid", "Manchester City", "Barcelona", "Palmeiras"].map(t => (
                  <Badge key={t} variant="outline" className="cursor-default text-xs">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RaphaLayout>
  );
}
