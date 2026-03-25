/**
 * Serviço de Integração de Pagamentos
 * PIX, Cartão de Crédito e Boleto
 */

export type MetodoPagamento = 'pix' | 'cartao' | 'boleto';
export type StatusPagamento = 'pendente' | 'processando' | 'confirmado' | 'falhou' | 'reembolsado';

interface ConfiguracaoPagamento {
  chave_pix: string;
  merchant_id: string;
  api_key: string;
  ambiente: 'producao' | 'teste';
}

interface TransacaoPagamento {
  id: string;
  usuario_id: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  data_criacao: number;
  data_vencimento: number;
  data_confirmacao?: number;
  referencia: string;
  tentativas: number;
  motivo_falha?: string;
  dados_pix?: {
    qr_code: string;
    chave: string;
    txid: string;
  };
  dados_cartao?: {
    ultimos_digitos: string;
    bandeira: string;
    id_transacao: string;
  };
}

interface WebhookPagamento {
  id: string;
  tipo: 'pagamento_confirmado' | 'pagamento_falhou' | 'pagamento_reembolsado';
  transacao_id: string;
  data: number;
  processado: boolean;
}

class PagamentoIntegration {
  private config: ConfiguracaoPagamento;
  private transacoes: Map<string, TransacaoPagamento> = new Map();
  private webhooks: WebhookPagamento[] = [];

  constructor() {
    this.config = {
      chave_pix: process.env.PIX_KEY || 'chave-pix-teste@raphaguru',
      merchant_id: process.env.MERCHANT_ID || 'merchant-teste',
      api_key: process.env.PAGAMENTO_API_KEY || 'api-key-teste',
      ambiente: (process.env.NODE_ENV === 'production' ? 'producao' : 'teste') as 'producao' | 'teste',
    };

    console.log(`[Pagamento] Integração inicializada (${this.config.ambiente})`);
  }

  /**
   * Cria transação de pagamento
   */
  criarTransacao(usuario_id: string, valor: number, metodo: MetodoPagamento): TransacaoPagamento {
    const transacao: TransacaoPagamento = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario_id,
      valor,
      metodo,
      status: 'pendente',
      data_criacao: Date.now(),
      data_vencimento: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 dias
      referencia: `REF-${Date.now()}`,
      tentativas: 0,
    };

    this.transacoes.set(transacao.id, transacao);
    console.log(`[Pagamento] Transação criada: ${transacao.id} (${metodo})`);

    return transacao;
  }

  /**
   * Gera PIX para pagamento
   */
  gerarPIX(transacao_id: string): { qr_code: string; chave: string; txid: string; copia_cola: string } {
    const transacao = this.transacoes.get(transacao_id);
    if (!transacao) throw new Error('Transação não encontrada');
    if (transacao.metodo !== 'pix') throw new Error('Transação não é PIX');

    // Simular geração de PIX
    const txid = `${Date.now()}${Math.random().toString(36).substr(2, 8)}`;
    const qr_code = `00020126580014br.gov.bcb.brcode01051.0.0${txid}5303986540510.${(transacao.valor / 100).toFixed(2)}5802BR5913RAPHAGURU6009SAO PAULO62410503***63041D3D`;
    const chave = this.config.chave_pix;

    transacao.status = 'processando';
    transacao.dados_pix = {
      qr_code,
      chave,
      txid,
    };

    console.log(`[Pagamento] PIX gerado: ${txid}`);

    return {
      qr_code,
      chave,
      txid,
      copia_cola: qr_code,
    };
  }

  /**
   * Processa pagamento com cartão
   */
  processarCartao(
    transacao_id: string,
    numero_cartao: string,
    validade: string,
    cvv: string,
    nome_titular: string
  ): { sucesso: boolean; mensagem: string; id_transacao?: string } {
    const transacao = this.transacoes.get(transacao_id);
    if (!transacao) throw new Error('Transação não encontrada');
    if (transacao.metodo !== 'cartao') throw new Error('Transação não é cartão');

    // Validar cartão
    if (!this.validarCartao(numero_cartao, validade, cvv)) {
      transacao.status = 'falhou';
      transacao.motivo_falha = 'Dados do cartão inválidos';
      transacao.tentativas++;

      console.log(`[Pagamento] Cartão inválido: ${transacao_id}`);

      return {
        sucesso: false,
        mensagem: 'Dados do cartão inválidos',
      };
    }

    // Simular processamento
    const sucesso = Math.random() > 0.15; // 85% de sucesso

    if (sucesso) {
      transacao.status = 'confirmado';
      transacao.data_confirmacao = Date.now();
      transacao.dados_cartao = {
        ultimos_digitos: numero_cartao.slice(-4),
        bandeira: this.identificarBandeira(numero_cartao),
        id_transacao: `card-${Date.now()}`,
      };

      this.criarWebhook('pagamento_confirmado', transacao_id);

      console.log(`[Pagamento] Cartão processado com sucesso: ${transacao_id}`);

      return {
        sucesso: true,
        mensagem: 'Pagamento confirmado',
        id_transacao: transacao.dados_cartao.id_transacao,
      };
    } else {
      transacao.status = 'falhou';
      transacao.motivo_falha = 'Cartão recusado pela operadora';
      transacao.tentativas++;

      this.criarWebhook('pagamento_falhou', transacao_id);

      console.log(`[Pagamento] Cartão recusado: ${transacao_id}`);

      return {
        sucesso: false,
        mensagem: 'Cartão recusado pela operadora',
      };
    }
  }

  /**
   * Valida cartão
   */
  private validarCartao(numero: string, validade: string, cvv: string): boolean {
    // Remover espaços e traços
    numero = numero.replace(/\s|-/g, '');

    // Validar comprimento
    if (numero.length < 13 || numero.length > 19) return false;

    // Validar CVV
    if (cvv.length < 3 || cvv.length > 4) return false;

    // Validar validade (MM/YY)
    const [mes, ano] = validade.split('/');
    if (!mes || !ano || parseInt(mes) < 1 || parseInt(mes) > 12) return false;

    // Algoritmo de Luhn
    let soma = 0;
    let alternado = false;

    for (let i = numero.length - 1; i >= 0; i--) {
      let digit = parseInt(numero[i]);

      if (alternado) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      soma += digit;
      alternado = !alternado;
    }

    return soma % 10 === 0;
  }

  /**
   * Identifica bandeira do cartão
   */
  private identificarBandeira(numero: string): string {
    numero = numero.replace(/\s|-/g, '');

    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(numero)) return 'Visa';
    if (/^5[1-5][0-9]{14}$/.test(numero)) return 'Mastercard';
    if (/^3[47][0-9]{13}$/.test(numero)) return 'American Express';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(numero)) return 'Discover';
    if (/^30[0-5][0-9]{11}$/.test(numero)) return 'Diners Club';

    return 'Desconhecida';
  }

  /**
   * Confirma PIX
   */
  confirmarPIX(transacao_id: string): { sucesso: boolean; mensagem: string } {
    const transacao = this.transacoes.get(transacao_id);
    if (!transacao) throw new Error('Transação não encontrada');

    // Simular confirmação de PIX (em produção, seria via webhook)
    const sucesso = Math.random() > 0.05; // 95% de sucesso

    if (sucesso) {
      transacao.status = 'confirmado';
      transacao.data_confirmacao = Date.now();

      this.criarWebhook('pagamento_confirmado', transacao_id);

      console.log(`[Pagamento] PIX confirmado: ${transacao_id}`);

      return {
        sucesso: true,
        mensagem: 'Pagamento confirmado',
      };
    } else {
      transacao.status = 'falhou';
      transacao.motivo_falha = 'PIX não recebido no prazo';

      this.criarWebhook('pagamento_falhou', transacao_id);

      console.log(`[Pagamento] PIX expirou: ${transacao_id}`);

      return {
        sucesso: false,
        mensagem: 'PIX expirou',
      };
    }
  }

  /**
   * Reembolsa pagamento
   */
  reembolsar(transacao_id: string, motivo: string): { sucesso: boolean; mensagem: string } {
    const transacao = this.transacoes.get(transacao_id);
    if (!transacao) throw new Error('Transação não encontrada');
    if (transacao.status !== 'confirmado') throw new Error('Apenas pagamentos confirmados podem ser reembolsados');

    transacao.status = 'reembolsado';
    transacao.motivo_falha = motivo;

    this.criarWebhook('pagamento_reembolsado', transacao_id);

    console.log(`[Pagamento] Reembolso processado: ${transacao_id}`);

    return {
      sucesso: true,
      mensagem: 'Reembolso processado com sucesso',
    };
  }

  /**
   * Cria webhook
   */
  private criarWebhook(tipo: 'pagamento_confirmado' | 'pagamento_falhou' | 'pagamento_reembolsado', transacao_id: string): void {
    const webhook: WebhookPagamento = {
      id: `webhook-${Date.now()}`,
      tipo,
      transacao_id,
      data: Date.now(),
      processado: false,
    };

    this.webhooks.push(webhook);
    console.log(`[Pagamento] Webhook criado: ${tipo}`);
  }

  /**
   * Obtém transação
   */
  obterTransacao(transacao_id: string): TransacaoPagamento | undefined {
    return this.transacoes.get(transacao_id);
  }

  /**
   * Obtém transações do usuário
   */
  obterTransacoesUsuario(usuario_id: string): TransacaoPagamento[] {
    return Array.from(this.transacoes.values()).filter(t => t.usuario_id === usuario_id);
  }

  /**
   * Obtém estatísticas
   */
  obterEstatisticas(): {
    total_transacoes: number;
    confirmadas: number;
    pendentes: number;
    falhadas: number;
    reembolsadas: number;
    valor_total: number;
    valor_confirmado: number;
    taxa_sucesso: number;
  } {
    const transacoes = Array.from(this.transacoes.values());
    const confirmadas = transacoes.filter(t => t.status === 'confirmado').length;
    const pendentes = transacoes.filter(t => t.status === 'pendente').length;
    const falhadas = transacoes.filter(t => t.status === 'falhou').length;
    const reembolsadas = transacoes.filter(t => t.status === 'reembolsado').length;

    const valor_total = transacoes.reduce((sum, t) => sum + t.valor, 0);
    const valor_confirmado = transacoes
      .filter(t => t.status === 'confirmado')
      .reduce((sum, t) => sum + t.valor, 0);

    const taxa_sucesso = transacoes.length > 0 ? (confirmadas / transacoes.length) * 100 : 0;

    return {
      total_transacoes: transacoes.length,
      confirmadas,
      pendentes,
      falhadas,
      reembolsadas,
      valor_total,
      valor_confirmado,
      taxa_sucesso: parseFloat(taxa_sucesso.toFixed(2)),
    };
  }
}

export const pagamentoIntegration = new PagamentoIntegration();
export type { TransacaoPagamento, WebhookPagamento, ConfiguracaoPagamento };
