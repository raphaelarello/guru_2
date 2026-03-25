
import type { LiveFixture, TeamStatistics, Oportunidade, FixtureEvent } from "../football";

export interface AlertaCentral {
  fixtureId: number;
  titulo: string;
  resumo: string;
  tipo: "gol" | "expulsao" | "lesao" | "classificacao" | "alerta" | "momento";
  prioridade: "critica" | "alta" | "media";
  minuto?: number | null;
  liga?: string | null;
  time?: string | null;
}

export interface RadarOportunidade {
  fixtureId: number;
  titulo: string;
  explicacao: string;
  confianca: number;
  categoria: "gol" | "cartoes" | "escanteios" | "resultado" | "pressao";
  urgencia: "alta" | "media" | "baixa";
  mercado?: string;
}

function statNumber(stats: TeamStatistics[] | undefined, teamIndex: number, type: string): number {
  const raw = stats?.[teamIndex]?.statistics?.find((s) => s.type === type)?.value;
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "string") return parseFloat(raw.replace("%", "")) || 0;
  return typeof raw === "number" ? raw : 0;
}

export function gerarAlertasCentral(fixtures: LiveFixture[]): AlertaCentral[] {
  const alertas: AlertaCentral[] = [];

  for (const fixture of fixtures) {
    const minute = fixture.fixture.status.elapsed ?? null;
    const events = fixture.events || [];
    const league = fixture.league?.name || null;

    for (const event of events.slice(-6)) {
      if (event.type === "Goal") {
        alertas.push({
          fixtureId: fixture.fixture.id,
          titulo: "Gol confirmado",
          resumo: `${event.player?.name || "Jogador"} marcou para ${event.team?.name || "o time"} aos ${event.time?.elapsed || minute || 0}'`,
          tipo: "gol",
          prioridade: "alta",
          minuto: event.time?.elapsed ?? minute,
          liga: fixture.league?.name || "Desconhecida",
          time: event.team?.name || null,
        });
      }

      if (event.type === "Card" && String(event.detail || "").toLowerCase().includes("red")) {
        alertas.push({
          fixtureId: fixture.fixture.id,
          titulo: "Expulsão",
          resumo: `${event.team?.name || "Time"} perdeu um jogador aos ${event.time?.elapsed || minute || 0}'`,
          tipo: "expulsao",
          prioridade: "critica",
          minuto: event.time?.elapsed ?? minute,
          liga: fixture.league?.name || "Desconhecida",
          time: event.team?.name || null,
        });
      }
    }

    const goalsHome = fixture.goals?.home ?? 0;
    const goalsAway = fixture.goals?.away ?? 0;
    if (Math.abs(goalsHome - goalsAway) >= 4) {
      alertas.push({
        fixtureId: fixture.fixture.id,
        titulo: "Goleada em andamento",
        resumo: `${fixture.teams.home.name} ${goalsHome} × ${goalsAway} ${fixture.teams.away.name}`,
        tipo: "momento",
        prioridade: "alta",
        minuto: minute,
        liga: fixture.league?.name || "Desconhecida",
      });
    }

    const recentGoals = events.filter((e) => e.type === "Goal" && (minute ? (e.time?.elapsed || 0) >= minute - 12 : true)).length;
    if (recentGoals >= 2) {
      alertas.push({
        fixtureId: fixture.fixture.id,
        titulo: "Jogo pegando fogo",
        resumo: `${recentGoals} gols nos últimos minutos em ${fixture.teams.home.name} × ${fixture.teams.away.name}`,
        tipo: "alerta",
        prioridade: "media",
        minuto: minute,
        liga: fixture.league?.name || "Desconhecida",
      });
    }
  }

  return alertas
    .sort((a, b) => {
      const pa = a.prioridade === "critica" ? 3 : a.prioridade === "alta" ? 2 : 1;
      const pb = b.prioridade === "critica" ? 3 : b.prioridade === "alta" ? 2 : 1;
      return pb - pa || (b.minuto || 0) - (a.minuto || 0);
    })
    .slice(0, 30);
}

export function resumirRadar(
  fixture: LiveFixture,
  stats: TeamStatistics[],
  oportunidades: Oportunidade[],
): RadarOportunidade[] {
  const home = fixture.teams.home.name;
  const away = fixture.teams.away.name;
  const minute = fixture.fixture.status.elapsed ?? 0;
  const cornersHome = statNumber(stats, 0, "Corner Kicks");
  const cornersAway = statNumber(stats, 1, "Corner Kicks");
  const shotsOnHome = statNumber(stats, 0, "Shots on Goal");
  const shotsOnAway = statNumber(stats, 1, "Shots on Goal");
  const dangerousHome = statNumber(stats, 0, "Dangerous Attacks");
  const dangerousAway = statNumber(stats, 1, "Dangerous Attacks");

  const radar: RadarOportunidade[] = oportunidades.slice(0, 3).map((op) => ({
    fixtureId: fixture.fixture.id,
    titulo: traduzirMercado(op.mercado),
    explicacao: op.motivos?.join(" • ") || "Sinal detectado pelo motor de leitura ao vivo",
    confianca: op.confianca,
    categoria: categoriaPorTipo(op.tipo),
    urgencia: op.urgencia,
    mercado: op.mercado,
  }));

  if (cornersHome + cornersAway >= 8) {
    radar.push({
      fixtureId: fixture.fixture.id,
      titulo: "Escanteios acima da média",
      explicacao: `${home} e ${away} somam ${cornersHome + cornersAway} escanteios até ${minute}'`,
      confianca: 74,
      categoria: "escanteios",
      urgencia: "media",
    });
  }

  if (shotsOnHome + shotsOnAway >= 7 || dangerousHome + dangerousAway >= 50) {
    radar.push({
      fixtureId: fixture.fixture.id,
      titulo: "Pressão ofensiva crescente",
      explicacao: `${home} × ${away} já tem ${shotsOnHome + shotsOnAway} chutes no gol e ${dangerousHome + dangerousAway} ataques perigosos`,
      confianca: 79,
      categoria: "pressao",
      urgencia: "alta",
    });
  }

  return radar.slice(0, 5);
}

function categoriaPorTipo(tipo: Oportunidade["tipo"]): RadarOportunidade["categoria"] {
  if (tipo === "cartao") return "cartoes";
  if (tipo === "escanteio") return "escanteios";
  if (tipo === "resultado") return "resultado";
  if (tipo === "over" || tipo === "under" || tipo === "btts") return "gol";
  return "pressao";
}

function traduzirMercado(mercado: string): string {
  return mercado
    .replace(/over/ig, "Mais de")
    .replace(/under/ig, "Menos de")
    .replace(/both teams to score/ig, "Ambas marcam")
    .replace(/corners/ig, "escanteios")
    .replace(/cards/ig, "cartões");
}
