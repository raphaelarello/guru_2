import { telegramService } from './telegram';

interface JogadorForma {
  id: string;
  nome: string;
  time: string;
  ultimosJogos: number;
  golsUltimos: number;
  media: number;
  forma: 'excelente' | 'boa' | 'normal' | 'ruim';
  confianca: number;
}

interface AlertaBot {
  tipo: 'forma_detectada' | 'queda_forma' | 'top5_entrada' | 'top5_saida';
  jogador: JogadorForma;
  timestamp: Date;
  enviado: boolean;
}

class BotsSyncService {
  private alertas: AlertaBot[] = [];
  private ultimosArtilheiros: any[] = [];

  /**
   * Detecta jogadores em forma baseado nos últimos 3 jogos
   */
  detectarForma(artilheiros: any[]): JogadorForma[] {
    return artilheiros
      .map(jogador => {
        const ultimosJogos = 3;
        const golsUltimos = jogador.golsUltimos || 0;
        const media = golsUltimos / ultimosJogos;

        let forma: 'excelente' | 'boa' | 'normal' | 'ruim';
        let confianca: number;

        if (media >= 1.5) {
          forma = 'excelente';
          confianca = 95;
        } else if (media >= 1.0) {
          forma = 'boa';
          confianca = 85;
        } else if (media >= 0.5) {
          forma = 'normal';
          confianca = 70;
        } else {
          forma = 'ruim';
          confianca = 50;
        }

        return {
          id: jogador.id,
          nome: jogador.nome,
          time: jogador.time,
          ultimosJogos,
          golsUltimos,
          media,
          forma,
          confianca,
        };
      })
      .filter(j => j.forma !== 'ruim');
  }

  /**
   * Sincroniza dados com bots de apostas
   */
  async sincronizarComBots(artilheiros: any[]): Promise<void> {
    const jogadoresForma = this.detectarForma(artilheiros);

    // Detectar mudanças
    for (const jogador of jogadoresForma) {
      const anterior = this.ultimosArtilheiros.find(j => j.id === jogador.id);

      // Novo jogador em forma
      if (!anterior && jogador.forma === 'excelente') {
        await this.gerarAlerta({
          tipo: 'forma_detectada',
          jogador,
          timestamp: new Date(),
          enviado: false,
        });
      }

      // Jogador entrou no top 5
      if (artilheiros.slice(0, 5).find(j => j.id === jogador.id)) {
        if (!anterior || !this.ultimosArtilheiros.slice(0, 5).find(j => j.id === jogador.id)) {
          await this.gerarAlerta({
            tipo: 'top5_entrada',
            jogador,
            timestamp: new Date(),
            enviado: false,
          });
        }
      }

      // Queda de forma
      if (anterior && anterior.forma === 'excelente' && jogador.forma !== 'excelente') {
        await this.gerarAlerta({
          tipo: 'queda_forma',
          jogador,
          timestamp: new Date(),
          enviado: false,
        });
      }
    }

    // Atualizar histórico
    this.ultimosArtilheiros = artilheiros;
  }

  /**
   * Gera alerta e envia para Telegram
   */
  private async gerarAlerta(alerta: AlertaBot): Promise<void> {
    this.alertas.push(alerta);

    // Enviar para Telegram
    if (alerta.tipo === 'forma_detectada') {
      await telegramService.enviarFormaDetectada({
        nome: alerta.jogador.nome,
        time: alerta.jogador.time,
        ultimosJogos: alerta.jogador.ultimosJogos,
        golsUltimos: alerta.jogador.golsUltimos,
        media: alerta.jogador.media,
      });
    }

    console.log(`[BotSync] Alerta gerado: ${alerta.tipo} - ${alerta.jogador.nome}`);
  }

  /**
   * Retorna alertas não enviados
   */
  obterAlertasNaoEnviados(): AlertaBot[] {
    return this.alertas.filter(a => !a.enviado);
  }

  /**
   * Marca alerta como enviado
   */
  marcarComoEnviado(alerta: AlertaBot): void {
    const index = this.alertas.indexOf(alerta);
    if (index !== -1) {
      this.alertas[index].enviado = true;
    }
  }

  /**
   * Limpa alertas antigos (mais de 24h)
   */
  limparAlertasAntigos(): void {
    const agora = new Date();
    const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

    this.alertas = this.alertas.filter(a => a.timestamp > umDiaAtras);
  }

  /**
   * Retorna estatísticas de alertas
   */
  obterEstatisticas() {
    return {
      totalAlertas: this.alertas.length,
      alertasNaoEnviados: this.alertas.filter(a => !a.enviado).length,
      formaDetectada: this.alertas.filter(a => a.tipo === 'forma_detectada').length,
      top5Entrada: this.alertas.filter(a => a.tipo === 'top5_entrada').length,
      quedaForma: this.alertas.filter(a => a.tipo === 'queda_forma').length,
    };
  }
}

export const botsSyncService = new BotsSyncService();
