// Serviço de Detecção de Value Betting e Alertas
// Monitora odds em tempo real e detecta oportunidades de value betting

export interface ValueAlert {
  id: string;
  fixtureId: number;
  mercado: string;
  casa: string;
  visitante: string;
  oddBetfair: number;
  oddPinnacle: number;
  percentualValue: number;
  recomendacao: string;
  timestamp: number;
  lido: boolean;
}

const alertas: Map<string, ValueAlert> = new Map();
let alertCounter = 0;

// Detectar value betting comparando odds
export function detectarValueBetting(
  oddBetfair: number,
  oddPinnacle: number,
  threshold: number = 2
): { detectado: boolean; percentualValue: number; recomendacao: string } {
  // Calcular diferença percentual
  const diferenca = ((oddBetfair - oddPinnacle) / oddPinnacle) * 100;

  // Value betting detectado se diferença > threshold
  const detectado = Math.abs(diferenca) > threshold;

  let recomendacao = '';
  if (detectado) {
    if (oddBetfair > oddPinnacle) {
      recomendacao = `BET na Betfair: ${diferenca.toFixed(2)}% melhor que Pinnacle`;
    } else {
      recomendacao = `BET na Pinnacle: ${Math.abs(diferenca).toFixed(2)}% melhor que Betfair`;
    }
  }

  return {
    detectado,
    percentualValue: diferenca,
    recomendacao,
  };
}

// Criar alerta de value betting
export function criarAlerta(
  fixtureId: number,
  mercado: string,
  casa: string,
  visitante: string,
  oddBetfair: number,
  oddPinnacle: number,
  percentualValue: number,
  recomendacao: string
): ValueAlert {
  const id = `alert_${++alertCounter}_${Date.now()}`;
  const alerta: ValueAlert = {
    id,
    fixtureId,
    mercado,
    casa,
    visitante,
    oddBetfair,
    oddPinnacle,
    percentualValue,
    recomendacao,
    timestamp: Date.now(),
    lido: false,
  };

  alertas.set(id, alerta);
  console.log(`[Value Betting] Novo alerta criado: ${mercado} (${recomendacao})`);

  return alerta;
}

// Obter todos os alertas não lidos
export function obterAlertas(filtro?: { lidos?: boolean; mercado?: string }): ValueAlert[] {
  let resultado = Array.from(alertas.values());

  if (filtro?.lidos !== undefined) {
    resultado = resultado.filter(a => a.lido === filtro.lidos);
  }

  if (filtro?.mercado) {
    resultado = resultado.filter(a => a.mercado.toLowerCase().includes(filtro.mercado!.toLowerCase()));
  }

  // Ordenar por timestamp decrescente (mais recentes primeiro)
  return resultado.sort((a, b) => b.timestamp - a.timestamp);
}

// Marcar alerta como lido
export function marcarComoLido(alertaId: string): boolean {
  const alerta = alertas.get(alertaId);
  if (alerta) {
    alerta.lido = true;
    return true;
  }
  return false;
}

// Obter estatísticas de alertas
export function obterEstatisticas() {
  const todos = Array.from(alertas.values());
  const naoLidos = todos.filter(a => !a.lido);
  const ultimasHoras = todos.filter(a => Date.now() - a.timestamp < 3600000);

  return {
    totalAlertas: todos.length,
    alertasNaoLidos: naoLidos.length,
    alertasUltimasHoras: ultimasHoras.length,
    percentualValue: todos.length > 0
      ? (todos.reduce((sum, a) => sum + Math.abs(a.percentualValue), 0) / todos.length).toFixed(2)
      : '0',
  };
}

// Limpar alertas antigos (mais de 24 horas)
export function limparAlertas(): number {
  const agora = Date.now();
  const umDia = 86400000;
  let removidos = 0;

  const idsParaRemover: string[] = [];
  alertas.forEach((alerta, id) => {
    if (agora - alerta.timestamp > umDia) {
      idsParaRemover.push(id);
    }
  });
  idsParaRemover.forEach(id => {
    alertas.delete(id);
    removidos++;
  });

  if (removidos > 0) {
    console.log(`[Value Betting] ${removidos} alertas antigos removidos`);
  }

  return removidos;
}

// Iniciar limpeza periódica de alertas
export function iniciarLimpezaPeriodica() {
  setInterval(() => {
    limparAlertas();
  }, 3600000); // A cada 1 hora

  console.log('[Value Betting] Limpeza periódica de alertas iniciada');
}

// Simular alertas para demonstração
export function gerarAlertasDemo() {
  const jogos = [
    { fixtureId: 1, casa: 'Manchester City', visitante: 'Liverpool' },
    { fixtureId: 2, casa: 'Real Madrid', visitante: 'Barcelona' },
    { fixtureId: 3, casa: 'Bayern Munich', visitante: 'Borussia Dortmund' },
  ];

  const mercados = ['Vitória Casa', 'Empate', 'Over 2.5 Gols', 'Ambas Marcam'];

  for (const jogo of jogos) {
    for (const mercado of mercados) {
      if (Math.random() > 0.6) {
        // 40% de chance de ter value betting
        const oddBetfair = 1.5 + Math.random() * 3;
        const oddPinnacle = oddBetfair * (0.95 + Math.random() * 0.08);
        const valueBetting = detectarValueBetting(oddBetfair, oddPinnacle, 2);

        if (valueBetting.detectado) {
          criarAlerta(
            jogo.fixtureId,
            mercado,
            jogo.casa,
            jogo.visitante,
            oddBetfair,
            oddPinnacle,
            valueBetting.percentualValue,
            valueBetting.recomendacao
          );
        }
      }
    }
  }
}

// Iniciar geração de alertas demo
gerarAlertasDemo();
iniciarLimpezaPeriodica();
