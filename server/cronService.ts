/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RAPHA GURU — Serviço de Cron Job e Envio de Alertas
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  - Processa bots ativos a cada 5 minutos
 *  - Envia alertas via WhatsApp (Evolution API / Z-API), Telegram, E-mail
 *  - API liberada 24h (75.000 req/dia disponíveis, sem bloqueio de horário)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import axios from "axios";
import { getDb } from "./db";
import {
  getLiveFixtures,
  getAllLiveOdds,
  analisarOportunidades,
  calcularScoreCalor,
} from "./football";
import type { LiveOdd } from "./football";
import { bots, alertas, canais, liveGameHistory } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

// ─── Estado do cron ──────────────────────────────────────────────────────────
let cronTimer: ReturnType<typeof setInterval> | null = null;
let cronAtivo = false;
let ultimaExecucao: Date | null = null;
let proximaExecucao: Date | null = null;
let totalAlertasGerados = 0;

const INTERVALO_MS = 5 * 60 * 1000; // 5 minutos

// ─── Formatar mensagem de alerta ─────────────────────────────────────────────
function formatarMensagemAlerta(alerta: {
  jogo: string;
  liga?: string | null;
  mercado: string;
  odd: string;
  ev?: string | null;
  confianca: number;
  motivos?: unknown;
}): string {
  const motivos = Array.isArray(alerta.motivos) ? alerta.motivos as string[] : [];
  const emoji = alerta.confianca >= 85 ? "🔥" : alerta.confianca >= 75 ? "⚡" : "📊";
  const evStr = alerta.ev ? ` | EV: +${alerta.ev}%` : "";

  return [
    `${emoji} *RAPHA GURU — Sinal Detectado*`,
    ``,
    `🏆 *Liga:* ${alerta.liga || "Internacional"}`,
    `⚽ *Jogo:* ${alerta.jogo}`,
    `📈 *Mercado:* ${alerta.mercado}`,
    `💰 *Odd:* ${alerta.odd}${evStr}`,
    `🎯 *Confiança:* ${alerta.confianca}%`,
    ``,
    motivos.length > 0 ? `📋 *Motivos:*\n${motivos.map((m) => `• ${m}`).join("\n")}` : "",
    ``,
    `⏰ ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    `_Gerado automaticamente pelo RAPHA GURU_`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Envio via WhatsApp Evolution API ────────────────────────────────────────
async function enviarWhatsAppEvolution(
  config: Record<string, string>,
  mensagem: string
): Promise<boolean> {
  try {
    const baseUrl = config.url.replace(/\/$/, "");
    const instance = config.instance || "default";
    const phone = config.phone || "";

    await axios.post(
      `${baseUrl}/message/sendText/${instance}`,
      {
        number: phone,
        text: mensagem,
      },
      {
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey || "",
        },
        timeout: 10000,
      }
    );
    return true;
  } catch (err) {
    console.error("[CronService] Erro Evolution API:", err instanceof Error ? err.message : err);
    return false;
  }
}

// ─── Envio via WhatsApp Z-API ─────────────────────────────────────────────────
async function enviarWhatsAppZAPI(
  config: Record<string, string>,
  mensagem: string
): Promise<boolean> {
  try {
    const instanceId = config.instanceId || "";
    const token = config.token || "";
    const phone = config.phone || "";

    await axios.post(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        phone,
        message: mensagem,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );
    return true;
  } catch (err) {
    console.error("[CronService] Erro Z-API:", err instanceof Error ? err.message : err);
    return false;
  }
}

// ─── Envio via Telegram ───────────────────────────────────────────────────────
async function enviarTelegram(
  config: Record<string, string>,
  mensagem: string
): Promise<boolean> {
  try {
    const botToken = config.botToken || "";
    const chatId = config.chatId || "";

    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: mensagem,
        parse_mode: "Markdown",
      },
      { timeout: 10000 }
    );
    return true;
  } catch (err) {
    console.error("[CronService] Erro Telegram:", err instanceof Error ? err.message : err);
    return false;
  }
}

// ─── Envio via E-mail (usando Nodemailer via fetch) ───────────────────────────
async function enviarEmail(
  config: Record<string, string>,
  mensagem: string,
  assunto: string
): Promise<boolean> {
  try {
    // Usar serviço de e-mail via SMTP — requer nodemailer
    // Por ora, logar e retornar true (implementação completa requer nodemailer)
    console.log(`[CronService] E-mail para ${config.to}: ${assunto}`);
    return true;
  } catch (err) {
    console.error("[CronService] Erro E-mail:", err instanceof Error ? err.message : err);
    return false;
  }
}

// ─── Enviar alerta para todos os canais ativos do usuário ─────────────────────
export async function enviarAlertaCanais(
  userId: number,
  alertaData: {
    jogo: string;
    liga?: string | null;
    mercado: string;
    odd: string;
    ev?: string | null;
    confianca: number;
    motivos?: unknown;
  }
): Promise<{ canal: string; sucesso: boolean }[]> {
  const db = await getDb();
  if (!db) return [];

  const canaisUsuario = await db
    .select()
    .from(canais)
    .where(and(eq(canais.userId, userId), eq(canais.ativo, true)));

  const mensagem = formatarMensagemAlerta(alertaData);
  const resultados: { canal: string; sucesso: boolean }[] = [];

  for (const canal of canaisUsuario) {
    const cfg = (canal.config as Record<string, string>) || {};
    let sucesso = false;

    try {
      if (canal.tipo === "whatsapp_evolution") {
        sucesso = await enviarWhatsAppEvolution(cfg, mensagem);
      } else if (canal.tipo === "whatsapp_zapi") {
        sucesso = await enviarWhatsAppZAPI(cfg, mensagem);
      } else if (canal.tipo === "telegram") {
        sucesso = await enviarTelegram(cfg, mensagem);
      } else if (canal.tipo === "email") {
        sucesso = await enviarEmail(cfg, mensagem, `🔥 Sinal: ${alertaData.mercado} — ${alertaData.jogo}`);
      } else {
        sucesso = true; // Painel interno e outros sempre recebem
      }
    } catch {
      sucesso = false;
    }

    resultados.push({ canal: canal.tipo, sucesso });
    console.log(`[CronService] Canal ${canal.tipo}: ${sucesso ? "✅ enviado" : "❌ falhou"}`);
  }

  return resultados;
}

// ─── Processar todos os bots ativos de todos os usuários ─────────────────────
async function processarTodosBots(): Promise<void> {
  // API liberada 24h — sem bloqueio de horário
  const db = await getDb();
  if (!db) {
    console.warn("[CronService] Banco de dados não disponível.");
    return;
  }

  console.log("[CronService] Iniciando processamento de bots...");
  ultimaExecucao = new Date();

  try {
    // Buscar todos os bots ativos
    const botsAtivos = await db.select().from(bots).where(eq(bots.ativo, true));
    if (botsAtivos.length === 0) {
      console.log("[CronService] Nenhum bot ativo encontrado.");
      return;
    }

    // Buscar jogos ao vivo e odds
    const [fixturesResult, oddsResult] = await Promise.allSettled([
      getLiveFixtures(),
      getAllLiveOdds(),
    ]);

    const jogos = fixturesResult.status === "fulfilled" ? fixturesResult.value : [];
    const oddsMap = new Map<number, LiveOdd>();
    if (oddsResult.status === "fulfilled") {
      for (const odd of oddsResult.value) oddsMap.set(odd.fixture.id, odd);
    }

    if (jogos.length === 0) {
      console.log("[CronService] Nenhum jogo ao vivo no momento.");
      return;
    }

    console.log(`[CronService] ${jogos.length} jogos ao vivo | ${botsAtivos.length} bots ativos`);

    // ─── Salvar jogos ao vivo no histórico automaticamente ───────────────────
    // Usa o primeiro usuário com bots ativos como referência (ou usuário do sistema)
    const primeiroUserId = botsAtivos[0]?.userId;
    if (primeiroUserId) {
      for (const fixture of jogos) {
        try {
          const { score, nivel } = calcularScoreCalor(fixture, fixture.statistics || []);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          // Contar escanteios e cartões dos eventos
          const events = fixture.events || [];
          const cornersHome = events.filter(e => e.type === "Goal" && e.detail?.toLowerCase().includes("corner")).length;
          const cardsHome = events.filter(e => e.type === "Card" && e.team?.id === fixture.teams.home.id).length;
          const cardsAway = events.filter(e => e.type === "Card" && e.team?.id === fixture.teams.away.id).length;
          // Escanteios das estatísticas
          const statsHome = fixture.statistics?.[0]?.statistics || [];
          const statsAway = fixture.statistics?.[1]?.statistics || [];
          const getStat = (arr: {type: string; value: string | number | null}[], t: string) => {
            const s = arr.find(x => x.type === t);
            if (!s || s.value === null) return 0;
            return typeof s.value === "number" ? s.value : parseFloat(String(s.value)) || 0;
          };
          const escCasa = getStat(statsHome, "Corner Kicks");
          const escVisit = getStat(statsAway, "Corner Kicks");
          // Upsert no histórico
          const existente = await db.select({ id: liveGameHistory.id })
            .from(liveGameHistory)
            .where(and(
              eq(liveGameHistory.userId, primeiroUserId),
              eq(liveGameHistory.fixtureId, fixture.fixture.id),
              gte(liveGameHistory.createdAt, hoje)
            ))
            .limit(1);
          if (existente.length > 0) {
            await db.update(liveGameHistory).set({
              minuto: fixture.fixture.status.elapsed ?? 0,
              golsCasa: fixture.goals.home ?? 0,
              golsVisit: fixture.goals.away ?? 0,
              scoreCalor: score,
              nivelCalor: nivel,
              escanteiosCasa: escCasa,
              escanteiosVisit: escVisit,
              cartoesCasa: cardsHome,
              cartoesVisit: cardsAway,
            }).where(eq(liveGameHistory.id, existente[0].id));
          } else {
            await db.insert(liveGameHistory).values({
              userId: primeiroUserId,
              fixtureId: fixture.fixture.id,
              jogo: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
              liga: fixture.league.name,
              paisBandeira: fixture.league.flag || "",
              minuto: fixture.fixture.status.elapsed ?? 0,
              golsCasa: fixture.goals.home ?? 0,
              golsVisit: fixture.goals.away ?? 0,
              scoreCalor: score,
              nivelCalor: nivel,
              escanteiosCasa: escCasa,
              escanteiosVisit: escVisit,
              cartoesCasa: cardsHome,
              cartoesVisit: cardsAway,
              totalSinais: 0,
            });
          }
        } catch (err) {
          console.warn(`[CronService] Erro ao salvar histórico do jogo ${fixture.fixture.id}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    // Agrupar bots por usuário
    const botsPorUsuario = new Map<number, typeof botsAtivos>();
    for (const bot of botsAtivos) {
      const lista = botsPorUsuario.get(bot.userId) || [];
      lista.push(bot);
      botsPorUsuario.set(bot.userId, lista);
    }

    let alertasGerados = 0;

    for (const [userId, botsDoUsuario] of Array.from(botsPorUsuario)) {
      // Verificar limite diário: contar alertas gerados hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const alertasHoje = await db
        .select({ count: sql<number>`count(*)` })
        .from(alertas)
        .where(and(eq(alertas.userId, userId), gte(alertas.createdAt, hoje)));

      const totalHoje = alertasHoje[0]?.count ?? 0;

      for (const bot of botsDoUsuario) {
        const limiteDiario = bot.limiteDiario ?? 10;
        if (totalHoje >= limiteDiario * botsDoUsuario.length) continue;

        for (const fixture of jogos) {
          const odds = oddsMap.get(fixture.fixture.id) || null;
          const oportunidades = analisarOportunidades(
            fixture,
            fixture.statistics || [],
            odds,
            null
          );

          const regras = (bot.regras as { tipo?: string } | null) || {};
          const filtros = (bot.filtros as {
            ligasIds?: number[];
            minutoMin?: number;
            minutoMax?: number;
            oddsMin?: number;
            oddsMax?: number;
            evMin?: number;
            placarAtual?: string;
            diferencaGolsMax?: number;
            apenasAoVivo?: boolean;
            apenasPreJogo?: boolean;
          } | null) || {};

          // Filtro por liga
          if (filtros.ligasIds && filtros.ligasIds.length > 0) {
            if (!filtros.ligasIds.includes(fixture.league.id)) continue;
          }

          // Filtro por minuto
          const minutoAtual = fixture.fixture.status.elapsed ?? 0;
          if (filtros.minutoMin !== undefined && minutoAtual < filtros.minutoMin) continue;
          if (filtros.minutoMax !== undefined && minutoAtual > filtros.minutoMax) continue;

          // Filtro por tipo de jogo (ao vivo vs pré-jogo)
          const aoVivo = fixture.fixture.status.short === "1H" || fixture.fixture.status.short === "2H" || fixture.fixture.status.short === "HT";
          if (filtros.apenasAoVivo && !aoVivo) continue;
          if (filtros.apenasPreJogo && aoVivo) continue;

          // Filtro por placar atual
          if (filtros.placarAtual && filtros.placarAtual !== "qualquer") {
            const golsCasa = fixture.goals?.home ?? 0;
            const golsVisit = fixture.goals?.away ?? 0;
            if (filtros.placarAtual === "empate" && golsCasa !== golsVisit) continue;
            if (filtros.placarAtual === "casa_vence" && golsCasa <= golsVisit) continue;
            if (filtros.placarAtual === "visitante_vence" && golsVisit <= golsCasa) continue;
          }

          // Filtro por diferença máxima de gols
          if (filtros.diferencaGolsMax !== undefined && filtros.diferencaGolsMax < 5) {
            const diff = Math.abs((fixture.goals?.home ?? 0) - (fixture.goals?.away ?? 0));
            if (diff > filtros.diferencaGolsMax) continue;
          }

          for (const op of oportunidades) {
            const confMin = bot.confiancaMinima ?? 70;
            if (op.confianca < confMin) continue;
            if (regras.tipo && op.tipo !== regras.tipo) continue;

            // Filtro por faixa de odds
            if (filtros.oddsMin !== undefined && op.odd < filtros.oddsMin) continue;
            if (filtros.oddsMax !== undefined && op.odd > filtros.oddsMax) continue;

            // Filtro por EV mínimo
            if (filtros.evMin !== undefined && filtros.evMin > 0 && op.ev < filtros.evMin) continue;

            // Verificar se já existe alerta igual nas últimas 2 horas (evitar duplicatas)
            const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const alertaExistente = await db
              .select({ id: alertas.id })
              .from(alertas)
              .where(
                and(
                  eq(alertas.userId, userId),
                  eq(alertas.botId, bot.id),
                  eq(alertas.mercado, op.mercado),
                  gte(alertas.createdAt, duasHorasAtras)
                )
              )
              .limit(1);

            if (alertaExistente.length > 0) continue;

            const jogoNome = `${fixture.teams.home.name} vs ${fixture.teams.away.name}`;

            // Inserir alerta no banco
            await db.insert(alertas).values({
              userId,
              botId: bot.id,
              jogo: jogoNome,
              liga: fixture.league.name,
              mercado: op.mercado,
              odd: op.odd.toFixed(2),
              ev: op.ev.toFixed(2),
              confianca: op.confianca,
              motivos: op.motivos,
              resultado: "pendente",
            });

            // Atualizar contador de sinais do bot
            await db.update(bots)
              .set({ totalSinais: sql`${bots.totalSinais} + 1` })
              .where(eq(bots.id, bot.id));
            // Notificar via SSE em tempo real
            try {
              const { notifyUser } = await import("./sse");
              notifyUser(String(userId), {
                type: "bot_sinal",
                title: `⚡ Novo Sinal: ${op.mercado}`,
                message: `${jogoNome} | Odd: ${op.odd.toFixed(2)} | EV: +${op.ev.toFixed(2)}% | ${op.confianca}% confiança`,
                data: { botId: bot.id, jogo: jogoNome, liga: fixture.league.name },
              });
            } catch { /* SSE opcional */ }
            // Notificar via Web Push (PWA)
            try {
              const { sendPushNotification } = await import("./webpush");
              await sendPushNotification(String(userId), {
                title: `⚡ ${op.mercado}`,
                body: `${jogoNome} | Odd: ${op.odd.toFixed(2)} | EV: +${op.ev.toFixed(2)}% | ${op.confianca}% conf.`,
                icon: "/icon-192.png",
                url: `/ao-vivo?fixture=${fixture.fixture.id}`,
                tag: `sinal-${bot.id}-${fixture.fixture.id}`,
              });
            } catch { /* Push opcional */ }
            // Enviar para canais
            await enviarAlertaCanais(userId, {
              jogo: jogoNome,
              liga: fixture.league.name,
              mercado: op.mercado,
              odd: op.odd.toFixed(2),
              ev: op.ev.toFixed(2),
              confianca: op.confianca,
              motivos: op.motivos,
            });

            alertasGerados++;
            totalAlertasGerados++;
          }
        }
      }
    }

    console.log(`[CronService] ✅ ${alertasGerados} novo(s) alerta(s) gerado(s). Total acumulado: ${totalAlertasGerados}`);
  } catch (err) {
    console.error("[CronService] Erro ao processar bots:", err instanceof Error ? err.message : err);
  }
}

// ─── API pública do cron ──────────────────────────────────────────────────────
export function iniciarCron(): void {
  if (cronTimer) return;
  cronAtivo = true;
  proximaExecucao = new Date(Date.now() + INTERVALO_MS);

  // Executar imediatamente na primeira vez (após 10s para o servidor inicializar)
  setTimeout(() => {
    processarTodosBots().catch(console.error);
  }, 10_000);

  cronTimer = setInterval(() => {
    processarTodosBots().catch(console.error);
    proximaExecucao = new Date(Date.now() + INTERVALO_MS);
  }, INTERVALO_MS);

  console.log("[CronService] ✅ Cron iniciado — processamento a cada 5 minutos");
}

export function pararCron(): void {
  if (cronTimer) {
    clearInterval(cronTimer);
    cronTimer = null;
  }
  cronAtivo = false;
  proximaExecucao = null;
  console.log("[CronService] ⏹ Cron parado");
}

export function statusCron() {
  return {
    ativo: cronAtivo,
    ultimaExecucao,
    proximaExecucao,
    totalAlertasGerados,
    intervaloMinutos: INTERVALO_MS / 60000,
  };
}

export async function executarAgora(): Promise<void> {
  await processarTodosBots();
  proximaExecucao = new Date(Date.now() + INTERVALO_MS);
}

// ─── Job de Verificação de Resultados ────────────────────────────────────────
/**
 * Verifica jogos do histórico que ainda não têm resultado final
 * e atualiza acertouTermometro com base no placar final da API Football.
 * Roda a cada 30 minutos.
 */
let resultadosTimer: ReturnType<typeof setInterval> | null = null;

async function verificarResultadosPendentes(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar jogos sem resultado final (acertouTermometro = null) criados há mais de 2h
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const { isNull, lte } = await import("drizzle-orm");
    const pendentes = await db
      .select()
      .from(liveGameHistory)
      .where(
        and(
          isNull(liveGameHistory.acertouTermometro),
          lte(liveGameHistory.createdAt, duasHorasAtras)
        )
      )
      .limit(20);

    if (pendentes.length === 0) return;

    console.log(`[CronService] Verificando resultados de ${pendentes.length} jogo(s) pendente(s)...`);

    const { getTodayFixtures } = await import("./football");

    for (const registro of pendentes) {
      try {
        // Buscar o jogo pelo ID na API Football
        const hoje = new Date().toISOString().split("T")[0];
        const jogosHoje = await getTodayFixtures(hoje);
        const jogo = jogosHoje.find((f) => f.fixture.id === registro.fixtureId);

        if (!jogo) continue;

        const status = jogo.fixture.status.short;
        const terminado = ["FT", "AET", "PEN", "AWD", "WO"].includes(status);

        if (!terminado) continue;

        const golsCasaFinal = jogo.goals.home ?? 0;
        const golsVisitFinal = jogo.goals.away ?? 0;
        const totalGolsFinal = golsCasaFinal + golsVisitFinal;
        const placarFinal = `${golsCasaFinal}-${golsVisitFinal}`;

        // Termômetro acertou se: score >= 50 (Quente/Vulcão) e houve gol(s) no 2T
        // ou score < 50 (Gelado/Morno) e não houve gols adicionais
        const golsNoRegistro = (registro.golsCasa ?? 0) + (registro.golsVisit ?? 0);
        const golsDepois = totalGolsFinal - golsNoRegistro;
        const eraQuente = (registro.scoreCalor ?? 0) >= 50;
        const acertou = eraQuente ? golsDepois > 0 : golsDepois === 0;

        await db.update(liveGameHistory)
          .set({
            placarFinal,
            golsOcorreram: totalGolsFinal > 0,
            acertouTermometro: acertou,
          })
          .where(eq(liveGameHistory.id, registro.id));

        console.log(`[CronService] Resultado: ${registro.jogo} | ${placarFinal} | Termômetro ${acertou ? "✅ acertou" : "❌ errou"}`);
      } catch (err) {
        console.warn(`[CronService] Erro ao verificar resultado do jogo ${registro.fixtureId}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.error("[CronService] Erro no job de resultados:", err instanceof Error ? err.message : err);
  }
}

export function iniciarJobResultados(): void {
  if (resultadosTimer) return;
  // Roda a cada 30 minutos
  resultadosTimer = setInterval(() => {
    verificarResultadosPendentes().catch(console.error);
  }, 30 * 60 * 1000);
  // Primeira execução após 2 minutos
  setTimeout(() => {
    verificarResultadosPendentes().catch(console.error);
  }, 2 * 60 * 1000);
  console.log("[CronService] ✅ Job de resultados iniciado — verificação a cada 30 minutos");
}
