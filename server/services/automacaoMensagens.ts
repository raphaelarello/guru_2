/**
 * Serviço de Automação de Mensagens
 * Envio automático baseado em eventos e regras
 */

export type TipoMensagem = 'email' | 'sms' | 'whatsapp' | 'notificacao';
export type EventoDisparo = 'vencimento' | 'inadimplencia' | 'reativacao' | 'teste_nao_convertido' | 'novo_usuario';

interface MensagemEnviada {
  id: string;
  usuario_id: string;
  email: string;
  tipo: TipoMensagem;
  evento: EventoDisparo;
  titulo: string;
  conteudo: string;
  status: 'enviado' | 'falhou' | 'entregue' | 'lido';
  data_envio: number;
  data_entrega?: number;
  tentativas: number;
}

interface RegradispAcao {
  id: string;
  nome: string;
  evento: EventoDisparo;
  dias_antes?: number;
  template_id: string;
  tipo_mensagem: TipoMensagem;
  ativo: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
  criada_em: number;
}

class AutomacaoMensagens {
  private mensagensEnviadas: MensagemEnviada[] = [];
  private regrasAcao: RegradispAcao[] = [];
  private fila: MensagemEnviada[] = [];

  constructor() {
    this.initializeRegras();
  }

  /**
   * Inicializa regras de ação
   */
  private initializeRegras(): void {
    const regras: RegradispAcao[] = [
      {
        id: 'regra-1',
        nome: 'Lembrete 7 dias antes',
        evento: 'vencimento',
        dias_antes: 7,
        template_id: 'tpl-vencimento-7dias',
        tipo_mensagem: 'email',
        ativo: true,
        prioridade: 'media',
        criada_em: Date.now(),
      },
      {
        id: 'regra-2',
        nome: 'Lembrete 1 dia antes',
        evento: 'vencimento',
        dias_antes: 1,
        template_id: 'tpl-vencimento-1dia',
        tipo_mensagem: 'notificacao',
        ativo: true,
        prioridade: 'alta',
        criada_em: Date.now(),
      },
      {
        id: 'regra-3',
        nome: 'Alerta inadimplência',
        evento: 'inadimplencia',
        template_id: 'tpl-inadimplencia',
        tipo_mensagem: 'email',
        ativo: true,
        prioridade: 'alta',
        criada_em: Date.now(),
      },
      {
        id: 'regra-4',
        nome: 'Oferta reativação',
        evento: 'reativacao',
        template_id: 'tpl-reativacao-oferta',
        tipo_mensagem: 'sms',
        ativo: true,
        prioridade: 'media',
        criada_em: Date.now(),
      },
      {
        id: 'regra-5',
        nome: 'Teste não convertido',
        evento: 'teste_nao_convertido',
        template_id: 'tpl-teste-nao-convertido',
        tipo_mensagem: 'email',
        ativo: true,
        prioridade: 'media',
        criada_em: Date.now(),
      },
      {
        id: 'regra-6',
        nome: 'Boas-vindas novo usuário',
        evento: 'novo_usuario',
        template_id: 'tpl-boas-vindas',
        tipo_mensagem: 'email',
        ativo: true,
        prioridade: 'alta',
        criada_em: Date.now(),
      },
    ];

    this.regrasAcao = regras;
    console.log(`[Automação] ${regras.length} regras de ação inicializadas`);
  }

  /**
   * Agenda mensagem para envio
   */
  agendarMensagem(
    usuario_id: string,
    email: string,
    tipo: TipoMensagem,
    evento: EventoDisparo,
    titulo: string,
    conteudo: string
  ): MensagemEnviada {
    const mensagem: MensagemEnviada = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario_id,
      email,
      tipo,
      evento,
      titulo,
      conteudo,
      status: 'enviado',
      data_envio: Date.now(),
      tentativas: 0,
    };

    this.fila.push(mensagem);
    console.log(`[Automação] Mensagem agendada: ${mensagem.id} (${email})`);

    return mensagem;
  }

  /**
   * Envia mensagem
   */
  enviarMensagem(mensagem_id: string): { sucesso: boolean; mensagem: string } {
    const mensagem = this.fila.find(m => m.id === mensagem_id);
    if (!mensagem) throw new Error('Mensagem não encontrada');

    // Simular envio
    const sucesso = Math.random() > 0.05; // 95% de sucesso

    if (sucesso) {
      mensagem.status = 'entregue';
      mensagem.data_entrega = Date.now();
      this.mensagensEnviadas.push(mensagem);
      this.fila = this.fila.filter(m => m.id !== mensagem_id);

      console.log(`[Automação] Mensagem enviada: ${mensagem_id} (${mensagem.tipo})`);

      return {
        sucesso: true,
        mensagem: `${mensagem.tipo.toUpperCase()} enviado com sucesso para ${mensagem.email}`,
      };
    } else {
      mensagem.tentativas++;
      if (mensagem.tentativas >= 3) {
        mensagem.status = 'falhou';
        this.mensagensEnviadas.push(mensagem);
        this.fila = this.fila.filter(m => m.id !== mensagem_id);
      }

      console.log(`[Automação] Falha ao enviar: ${mensagem_id} (tentativa ${mensagem.tentativas})`);

      return {
        sucesso: false,
        mensagem: `Falha ao enviar ${mensagem.tipo}. Tentativa ${mensagem.tentativas}/3`,
      };
    }
  }

  /**
   * Processa fila de mensagens
   */
  processarFila(): { processadas: number; sucesso: number; falhas: number } {
    let sucesso = 0;
    let falhas = 0;

    const mensagensParaProcessar = [...this.fila];

    for (const mensagem of mensagensParaProcessar) {
      const resultado = this.enviarMensagem(mensagem.id);
      if (resultado.sucesso) {
        sucesso++;
      } else {
        falhas++;
      }
    }

    console.log(`[Automação] Fila processada: ${sucesso} sucesso, ${falhas} falhas`);

    return {
      processadas: mensagensParaProcessar.length,
      sucesso,
      falhas,
    };
  }

  /**
   * Obtém regras de ação
   */
  obterRegras(): RegradispAcao[] {
    return this.regrasAcao;
  }

  /**
   * Cria nova regra
   */
  criarRegra(
    nome: string,
    evento: EventoDisparo,
    template_id: string,
    tipo_mensagem: TipoMensagem,
    prioridade: 'baixa' | 'media' | 'alta' = 'media',
    dias_antes?: number
  ): RegradispAcao {
    const regra: RegradispAcao = {
      id: `regra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nome,
      evento,
      dias_antes,
      template_id,
      tipo_mensagem,
      ativo: true,
      prioridade,
      criada_em: Date.now(),
    };

    this.regrasAcao.push(regra);
    console.log(`[Automação] Regra criada: ${nome}`);

    return regra;
  }

  /**
   * Atualiza regra
   */
  atualizarRegra(regra_id: string, dados: Partial<RegradispAcao>): RegradispAcao {
    const regra = this.regrasAcao.find(r => r.id === regra_id);
    if (!regra) throw new Error('Regra não encontrada');

    const regraAtualizada = { ...regra, ...dados };
    const index = this.regrasAcao.findIndex(r => r.id === regra_id);
    this.regrasAcao[index] = regraAtualizada;

    console.log(`[Automação] Regra atualizada: ${regra_id}`);

    return regraAtualizada;
  }

  /**
   * Deleta regra
   */
  deletarRegra(regra_id: string): void {
    this.regrasAcao = this.regrasAcao.filter(r => r.id !== regra_id);
    console.log(`[Automação] Regra deletada: ${regra_id}`);
  }

  /**
   * Obtém histórico de mensagens
   */
  obterHistorico(usuario_id?: string, status?: string): MensagemEnviada[] {
    let resultado = this.mensagensEnviadas;

    if (usuario_id) {
      resultado = resultado.filter(m => m.usuario_id === usuario_id);
    }

    if (status) {
      resultado = resultado.filter(m => m.status === status);
    }

    return resultado.sort((a, b) => b.data_envio - a.data_envio);
  }

  /**
   * Obtém estatísticas de envio
   */
  obterEstatisticas(): {
    total_enviadas: number;
    entregues: number;
    falhadas: number;
    taxa_sucesso: number;
    na_fila: number;
    por_tipo: Record<TipoMensagem, number>;
    por_evento: Record<EventoDisparo, number>;
  } {
    const total_enviadas = this.mensagensEnviadas.length;
    const entregues = this.mensagensEnviadas.filter(m => m.status === 'entregue').length;
    const falhadas = this.mensagensEnviadas.filter(m => m.status === 'falhou').length;
    const taxa_sucesso = total_enviadas > 0 ? (entregues / total_enviadas) * 100 : 0;
    const na_fila = this.fila.length;

    const por_tipo: Record<TipoMensagem, number> = {
      email: 0,
      sms: 0,
      whatsapp: 0,
      notificacao: 0,
    };

    const por_evento: Record<EventoDisparo, number> = {
      vencimento: 0,
      inadimplencia: 0,
      reativacao: 0,
      teste_nao_convertido: 0,
      novo_usuario: 0,
    };

    for (const msg of this.mensagensEnviadas) {
      por_tipo[msg.tipo]++;
      por_evento[msg.evento]++;
    }

    return {
      total_enviadas,
      entregues,
      falhadas,
      taxa_sucesso: parseFloat(taxa_sucesso.toFixed(2)),
      na_fila,
      por_tipo,
      por_evento,
    };
  }

  /**
   * Simula envios automáticos
   */
  simularEnvios(quantidade: number = 10): void {
    console.log(`[Automação] Iniciando simulação de ${quantidade} envios...`);

    const tipos: TipoMensagem[] = ['email', 'sms', 'whatsapp', 'notificacao'];
    const eventos: EventoDisparo[] = ['vencimento', 'inadimplencia', 'reativacao', 'teste_nao_convertido', 'novo_usuario'];

    for (let i = 0; i < quantidade; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const evento = eventos[Math.floor(Math.random() * eventos.length)];

      this.agendarMensagem(
        `user-${i}`,
        `user${i}@email.com`,
        tipo,
        evento,
        `Título ${i}`,
        `Conteúdo da mensagem ${i}`
      );
    }

    // Processar fila
    const resultado = this.processarFila();
    console.log(`[Automação] Simulação concluída: ${resultado.sucesso} sucesso, ${resultado.falhas} falhas`);
  }
}

export const automacaoMensagens = new AutomacaoMensagens();
export type { MensagemEnviada, RegradispAcao };
