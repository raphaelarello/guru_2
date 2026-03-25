import axios from 'axios';

interface TelegramMessage {
  type: 'artilheiro_novo' | 'indisciplinado_novo' | 'top5_mudanca' | 'cartao_recebido' | 'forma_detectada';
  title: string;
  message: string;
  data?: any;
}

class TelegramService {
  private botToken: string;
  private chatId: string;
  private apiUrl: string;

  constructor(botToken?: string, chatId?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = chatId || process.env.TELEGRAM_CHAT_ID || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async enviarAlerta(mensagem: TelegramMessage): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.log('[Telegram] Bot token ou chat ID não configurados');
      return false;
    }

    try {
      const texto = this.formatarMensagem(mensagem);
      
      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: texto,
        parse_mode: 'HTML',
      });

      console.log(`[Telegram] Alerta enviado: ${mensagem.type}`);
      return true;
    } catch (error) {
      console.error('[Telegram] Erro ao enviar alerta:', error);
      return false;
    }
  }

  async enviarArtilheiro(jogador: {
    nome: string;
    time: string;
    gols: number;
    eficiencia: number;
    forma: string;
  }): Promise<boolean> {
    const mensagem: TelegramMessage = {
      type: 'artilheiro_novo',
      title: `⚽ Novo Artilheiro em Forma`,
      message: `${jogador.nome} (${jogador.time})\n\n📊 Gols: ${jogador.gols}\n💯 Eficiência: ${jogador.eficiencia}%\n📈 Forma: ${jogador.forma}`,
      data: jogador,
    };

    return this.enviarAlerta(mensagem);
  }

  async enviarIndisciplinado(jogador: {
    nome: string;
    time: string;
    cartoes: number;
    amarelos: number;
    vermelhos: number;
  }): Promise<boolean> {
    const mensagem: TelegramMessage = {
      type: 'indisciplinado_novo',
      title: `🚨 Jogador Indisciplinado`,
      message: `${jogador.nome} (${jogador.time})\n\n🟨 Amarelos: ${jogador.amarelos}\n🟥 Vermelhos: ${jogador.vermelhos}\n📋 Total: ${jogador.cartoes}`,
      data: jogador,
    };

    return this.enviarAlerta(mensagem);
  }

  async enviarFormaDetectada(jogador: {
    nome: string;
    time: string;
    ultimosJogos: number;
    golsUltimos: number;
    media: number;
  }): Promise<boolean> {
    const mensagem: TelegramMessage = {
      type: 'forma_detectada',
      title: `🔥 Forma Detectada!`,
      message: `${jogador.nome} (${jogador.time})\n\n📊 Últimos ${jogador.ultimosJogos} jogos: ${jogador.golsUltimos} gols\n📈 Média: ${jogador.media.toFixed(2)} gols/jogo`,
      data: jogador,
    };

    return this.enviarAlerta(mensagem);
  }

  private formatarMensagem(mensagem: TelegramMessage): string {
    return `<b>${mensagem.title}</b>\n\n${mensagem.message}\n\n🕐 ${new Date().toLocaleString('pt-BR')}`;
  }

  async testarConexao(): Promise<boolean> {
    if (!this.botToken) {
      console.log('[Telegram] Bot token não configurado');
      return false;
    }

    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      console.log(`[Telegram] Bot conectado: ${response.data.result.first_name}`);
      return true;
    } catch (error) {
      console.error('[Telegram] Erro ao conectar:', error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();
