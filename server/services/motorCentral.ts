/*
  Patch focado: motor da Central de Alertas com filtro de lixo
*/

export type TipoAlerta =
  | "gol"
  | "cartao"
  | "expulsao"
  | "penalti"
  | "pressao"
  | "oportunidade"
  | "lesao"
  | "hattrick"
  | "goleada";

export type AlertaCentral = {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;
  minuto?: number | null;
  time?: string | null;
  adversario?: string | null;
  liga?: string | null;
  jogador?: string | null;
  logoTime?: string | null;
  prioridade?: number;
};

const MENSAGENS_BLOQUEADAS = [
  "atualização em tempo real",
  "novo artilheiro",
  "evento detectado",
  "sincronizando",
  "update",
  "heartbeat",
  "generic",
];

function textoValido(value?: string | null): boolean {
  return Boolean(value && value.trim().length >= 6);
}

function mensagemBloqueada(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return MENSAGENS_BLOQUEADAS.some((blocked) => m.includes(blocked));
}

function prioridadePorTipo(tipo: TipoAlerta): number {
  switch (tipo) {
    case "gol":
      return 100;
    case "expulsao":
      return 95;
    case "penalti":
      return 90;
    case "hattrick":
      return 88;
    case "goleada":
      return 84;
    case "lesao":
      return 78;
    case "oportunidade":
      return 74;
    case "pressao":
      return 70;
    case "cartao":
      return 60;
    default:
      return 10;
  }
}

export function alertaValido(alerta: Partial<AlertaCentral>): alerta is AlertaCentral {
  if (!alerta) return false;
  if (!alerta.tipo) return false;
  if (!textoValido(alerta.titulo)) return false;
  if (!textoValido(alerta.mensagem)) return false;
  if (mensagemBloqueada(alerta.mensagem!)) return false;

  const temContextoDeEntidade =
    textoValido(alerta.time) ||
    textoValido(alerta.adversario) ||
    textoValido(alerta.liga) ||
    textoValido(alerta.jogador);

  const temTempo = typeof alerta.minuto === "number" && alerta.minuto >= 0;

  return temContextoDeEntidade && temTempo;
}

export function filtrarEOrdenarAlertas(alertas: Partial<AlertaCentral>[]): AlertaCentral[] {
  return alertas
    .filter(alertaValido)
    .map((alerta) => ({
      ...alerta,
      prioridade: alerta.prioridade ?? prioridadePorTipo(alerta.tipo),
    }))
    .sort((a, b) => {
      const prioridade = (b.prioridade || 0) - (a.prioridade || 0);
      if (prioridade !== 0) return prioridade;
      return (b.minuto || 0) - (a.minuto || 0);
    });
}

/*
  Exemplo de uso:
  const alertas = filtrarEOrdenarAlertas(alertasBrutos);
*/
