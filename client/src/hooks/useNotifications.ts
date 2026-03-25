import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface NotificationCounts {
  bots: number;
  aoVivo: number;
  pitacos: number;
  destaques: number;
  alertas: number;
}

export function useNotifications() {
  const [counts, setCounts] = useState<NotificationCounts>({
    bots: 0,
    aoVivo: 0,
    pitacos: 0,
    destaques: 0,
    alertas: 0,
  });

  // Buscar dados de bots ativos
  const { data: botsData } = trpc.bots.list.useQuery();
  
  // Buscar dados de alertas
  const { data: alertasData } = trpc.alertas.list.useQuery();
  
  // Buscar dados de destaques
  const { data: destaquesData } = trpc.destaques.hoje.useQuery();

  useEffect(() => {
    // Contar bots ativos
    const botsAtivos = botsData?.filter((bot: any) => bot.ativo)?.length || 0;
    
    // Contar alertas não lidos
    const alertasNaoLidos = alertasData?.filter((alerta: any) => !alerta.lido)?.length || 0;
    
    // Contar destaques (palpites com alta confiança)
    const destaquesAltos = destaquesData?.timesGols?.length || 0;

    setCounts({
      bots: botsAtivos,
      aoVivo: 0, // Será atualizado quando dados ao vivo estiverem disponíveis
      pitacos: 0, // Será atualizado quando a página de Pitacos estiver pronta
      destaques: destaquesAltos,
      alertas: alertasNaoLidos,
    });
  }, [botsData, alertasData, destaquesData]);

  return counts;
}
