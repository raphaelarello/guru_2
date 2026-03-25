/**
 * Serviço de Gestão Financeira Profissional
 * Controle de usuários, pagamentos, inadimplência, automação
 */

export type UserStatus = 'ativo' | 'inadimplente' | 'inativo' | 'cancelado' | 'teste';
export type PaymentMethod = 'pix' | 'cartao' | 'boleto';
export type PaymentStatus = 'pendente' | 'processando' | 'confirmado' | 'falhou' | 'reembolsado';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  ciclo: 'mensal' | 'anual';
  features: string[];
  limite_bots: number;
  limite_alertas: number;
  suporte: 'email' | 'chat' | '24/7';
  ativo: boolean;
}

interface Usuario {
  id: string;
  email: string;
  nome: string;
  status: UserStatus;
  plano_id: string;
  data_assinatura: number;
  data_vencimento: number;
  data_cancelamento?: number;
  metodo_pagamento: PaymentMethod;
  ultima_tentativa_pagamento?: number;
  tentativas_falhas: number;
  tags: string[];
}

interface Pagamento {
  id: string;
  usuario_id: string;
  valor: number;
  metodo: PaymentMethod;
  status: PaymentStatus;
  data_criacao: number;
  data_vencimento: number;
  data_pagamento?: number;
  tentativas: number;
  motivo_falha?: string;
}

interface AutomacaoMensagem {
  id: string;
  nome: string;
  tipo: 'vencimento' | 'inadimplencia' | 'reativacao' | 'cancelamento' | 'teste_nao_convertido';
  template_id: string;
  dias_antes_vencimento?: number;
  ativo: boolean;
  criada_em: number;
}

interface TemplateEngajamento {
  id: string;
  nome: string;
  tipo: 'email' | 'sms' | 'whatsapp' | 'notificacao';
  titulo: string;
  conteudo: string;
  variaveis: string[]; // {{nome}}, {{data_vencimento}}, etc
  criada_em: number;
  atualizada_em: number;
}

interface CapturaMarketing {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  data_teste: number;
  status: 'teste_ativo' | 'teste_expirado' | 'convertido' | 'rejeitado';
  plano_testado: string;
  motivo_nao_conversao?: string;
  tags: string[];
}

class FinancialManagement {
  private planos: Map<string, Plano> = new Map();
  private usuarios: Map<string, Usuario> = new Map();
  private pagamentos: Pagamento[] = [];
  private automacoes: AutomacaoMensagem[] = [];
  private templates: Map<string, TemplateEngajamento> = new Map();
  private capturas: CapturaMarketing[] = [];

  constructor() {
    this.initializePlanos();
    this.initializeTemplates();
    this.initializeAutomacoes();
  }

  /**
   * Inicializa planos padrão
   */
  private initializePlanos(): void {
    const planos: Plano[] = [
      {
        id: 'free',
        nome: 'Gratuito',
        descricao: 'Perfeito para começar',
        preco: 0,
        ciclo: 'mensal',
        features: ['Análise básica', '1 bot', '5 alertas/dia'],
        limite_bots: 1,
        limite_alertas: 5,
        suporte: 'email',
        ativo: true,
      },
      {
        id: 'pro',
        nome: 'Profissional',
        descricao: 'Para apostadores sérios',
        preco: 9999, // R$ 99.99
        ciclo: 'mensal',
        features: ['Análise avançada', '5 bots', '50 alertas/dia', 'Value Betting', 'ML'],
        limite_bots: 5,
        limite_alertas: 50,
        suporte: 'chat',
        ativo: true,
      },
      {
        id: 'elite',
        nome: 'Elite',
        descricao: 'Máximo poder',
        preco: 29999, // R$ 299.99
        ciclo: 'mensal',
        features: ['Tudo do Pro', 'Bots ilimitados', 'Alertas ilimitados', 'API privada'],
        limite_bots: 999,
        limite_alertas: 999,
        suporte: '24/7',
        ativo: true,
      },
    ];

    for (const plano of planos) {
      this.planos.set(plano.id, plano);
    }

    console.log(`[Financial] ${planos.length} planos inicializados`);
  }

  /**
   * Inicializa templates de engajamento
   */
  private initializeTemplates(): void {
    const templates: TemplateEngajamento[] = [
      {
        id: 'vencimento_7dias',
        nome: 'Vencimento em 7 dias',
        tipo: 'email',
        titulo: 'Sua assinatura vence em 7 dias',
        conteudo:
          'Olá {{nome}},\n\nSua assinatura {{plano}} vence em 7 dias ({{data_vencimento}}).\n\nRenove agora para não perder acesso aos recursos premium!',
        variaveis: ['nome', 'plano', 'data_vencimento'],
        criada_em: Date.now(),
        atualizada_em: Date.now(),
      },
      {
        id: 'vencimento_1dia',
        nome: 'Vencimento em 1 dia',
        tipo: 'notificacao',
        titulo: 'Última chance! Assinatura vence amanhã',
        conteudo:
          'Sua assinatura {{plano}} vence amanhã! Renove agora para continuar usando todos os recursos.',
        variaveis: ['plano'],
        criada_em: Date.now(),
        atualizada_em: Date.now(),
      },
      {
        id: 'inadimplencia_3dias',
        nome: 'Inadimplência 3 dias',
        tipo: 'email',
        titulo: 'Sua assinatura foi suspensa',
        conteudo:
          'Olá {{nome}},\n\nDetectamos um problema no pagamento da sua assinatura {{plano}}.\n\nClique aqui para atualizar seus dados de pagamento e reativar sua conta.',
        variaveis: ['nome', 'plano'],
        criada_em: Date.now(),
        atualizada_em: Date.now(),
      },
      {
        id: 'teste_nao_convertido',
        nome: 'Teste não convertido',
        tipo: 'email',
        titulo: 'Seu teste expirou - Volte com 50% OFF',
        conteudo:
          'Olá {{nome}},\n\nVimos que seu teste de {{plano}} expirou.\n\nTemos uma oferta especial para você: 50% OFF no primeiro mês!\n\nQual foi o motivo de não ter continuado?',
        variaveis: ['nome', 'plano'],
        criada_em: Date.now(),
        atualizada_em: Date.now(),
      },
      {
        id: 'reativacao_oferta',
        nome: 'Reativação com oferta',
        tipo: 'sms',
        titulo: 'Volte ao RaphaGuru',
        conteudo: '{{nome}}, sentimos sua falta! Volte com 30% OFF. Use código: VOLTA30',
        variaveis: ['nome'],
        criada_em: Date.now(),
        atualizada_em: Date.now(),
      },
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }

    console.log(`[Financial] ${templates.length} templates inicializados`);
  }

  /**
   * Inicializa automações de mensagens
   */
  private initializeAutomacoes(): void {
    const automacoes: AutomacaoMensagem[] = [
      {
        id: 'auto-1',
        nome: 'Lembrete 7 dias antes',
        tipo: 'vencimento',
        template_id: 'vencimento_7dias',
        dias_antes_vencimento: 7,
        ativo: true,
        criada_em: Date.now(),
      },
      {
        id: 'auto-2',
        nome: 'Lembrete 1 dia antes',
        tipo: 'vencimento',
        template_id: 'vencimento_1dia',
        dias_antes_vencimento: 1,
        ativo: true,
        criada_em: Date.now(),
      },
      {
        id: 'auto-3',
        nome: 'Alerta inadimplência',
        tipo: 'inadimplencia',
        template_id: 'inadimplencia_3dias',
        ativo: true,
        criada_em: Date.now(),
      },
      {
        id: 'auto-4',
        nome: 'Teste não convertido',
        tipo: 'teste_nao_convertido',
        template_id: 'teste_nao_convertido',
        ativo: true,
        criada_em: Date.now(),
      },
    ];

    this.automacoes = automacoes;
    console.log(`[Financial] ${automacoes.length} automações inicializadas`);
  }

  /**
   * Cria novo usuário
   */
  criarUsuario(
    email: string,
    nome: string,
    plano_id: string,
    metodo_pagamento: PaymentMethod
  ): Usuario {
    const usuario: Usuario = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      nome,
      status: 'ativo',
      plano_id,
      data_assinatura: Date.now(),
      data_vencimento: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 dias
      metodo_pagamento,
      tentativas_falhas: 0,
      tags: [],
    };

    this.usuarios.set(usuario.id, usuario);
    console.log(`[Financial] Usuário criado: ${email} (${plano_id})`);

    return usuario;
  }

  /**
   * Obtém usuários por status
   */
  obterUsuariosPorStatus(status: UserStatus): Usuario[] {
    return Array.from(this.usuarios.values()).filter(u => u.status === status);
  }

  /**
   * Obtém estatísticas de usuários
   */
  obterEstatisticasUsuarios(): {
    total: number;
    ativos: number;
    inadimplentes: number;
    inativos: number;
    cancelados: number;
    testes: number;
    mrr: number; // Monthly Recurring Revenue
    churn_rate: number;
  } {
    const usuarios = Array.from(this.usuarios.values());
    const ativos = usuarios.filter(u => u.status === 'ativo').length;
    const inadimplentes = usuarios.filter(u => u.status === 'inadimplente').length;
    const inativos = usuarios.filter(u => u.status === 'inativo').length;
    const cancelados = usuarios.filter(u => u.status === 'cancelado').length;
    const testes = usuarios.filter(u => u.status === 'teste').length;

    // Calcular MRR
    const mrr = Array.from(this.usuarios.values())
      .filter(u => u.status === 'ativo')
      .reduce((sum, u) => {
        const plano = this.planos.get(u.plano_id);
        return sum + (plano ? plano.preco : 0);
      }, 0);

    // Calcular churn rate (usuários cancelados / total anterior)
    const churn_rate = usuarios.length > 0 ? (cancelados / usuarios.length) * 100 : 0;

    return {
      total: usuarios.length,
      ativos,
      inadimplentes,
      inativos,
      cancelados,
      testes,
      mrr,
      churn_rate: parseFloat(churn_rate.toFixed(2)),
    };
  }

  /**
   * Cria pagamento
   */
  criarPagamento(usuario_id: string, valor: number, metodo: PaymentMethod): Pagamento {
    const pagamento: Pagamento = {
      id: `pag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario_id,
      valor,
      metodo,
      status: 'pendente',
      data_criacao: Date.now(),
      data_vencimento: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 dias
      tentativas: 0,
    };

    this.pagamentos.push(pagamento);
    console.log(`[Financial] Pagamento criado: ${pagamento.id} (${valor} - ${metodo})`);

    return pagamento;
  }

  /**
   * Processa pagamento PIX
   */
  processarPagamentoPIX(pagamento_id: string): { sucesso: boolean; qr_code: string; chave: string } {
    const pagamento = this.pagamentos.find(p => p.id === pagamento_id);
    if (!pagamento) throw new Error('Pagamento não encontrado');

    // Simular geração de QR code PIX
    const qr_code = `00020126580014br.gov.bcb.brcode01051.0.0...${Math.random().toString(36).substr(2, 20)}`;
    const chave = `${Math.random().toString(36).substr(2, 32)}@raphaguru`;

    pagamento.status = 'processando';
    pagamento.tentativas++;

    console.log(`[Financial] PIX gerado para pagamento ${pagamento_id}`);
    console.log(`[Financial] QR Code: ${qr_code}`);
    console.log(`[Financial] Chave: ${chave}`);

    return {
      sucesso: true,
      qr_code,
      chave,
    };
  }

  /**
   * Processa pagamento com Cartão
   */
  processarPagamentoCartao(
    pagamento_id: string,
    numero_cartao: string,
    validade: string,
    cvv: string
  ): { sucesso: boolean; mensagem: string } {
    const pagamento = this.pagamentos.find(p => p.id === pagamento_id);
    if (!pagamento) throw new Error('Pagamento não encontrado');

    // Simular processamento de cartão
    const sucesso = Math.random() > 0.1; // 90% de sucesso

    pagamento.status = sucesso ? 'confirmado' : 'falhou';
    pagamento.tentativas++;

    if (sucesso) {
      pagamento.data_pagamento = Date.now();

      // Atualizar status do usuário
      const usuario = this.usuarios.get(pagamento.usuario_id);
      if (usuario) {
        usuario.status = 'ativo';
        usuario.tentativas_falhas = 0;
        usuario.data_vencimento = Date.now() + 30 * 24 * 60 * 60 * 1000;
      }

      console.log(`[Financial] Pagamento confirmado: ${pagamento_id}`);
    } else {
      pagamento.motivo_falha = 'Cartão recusado';

      // Incrementar tentativas falhas
      const usuario = this.usuarios.get(pagamento.usuario_id);
      if (usuario) {
        usuario.tentativas_falhas++;
        if (usuario.tentativas_falhas >= 3) {
          usuario.status = 'inadimplente';
        }
      }

      console.log(`[Financial] Pagamento falhou: ${pagamento_id}`);
    }

    return {
      sucesso,
      mensagem: sucesso ? 'Pagamento confirmado' : 'Cartão recusado',
    };
  }

  /**
   * Registra captura de marketing
   */
  registrarCaptura(email: string, nome: string, plano_testado: string): CapturaMarketing {
    const captura: CapturaMarketing = {
      id: `cap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      nome,
      data_teste: Date.now(),
      status: 'teste_ativo',
      plano_testado,
      tags: [],
    };

    this.capturas.push(captura);
    console.log(`[Financial] Captura registrada: ${email} (${plano_testado})`);

    return captura;
  }

  /**
   * Obtém capturas não convertidas
   */
  obterCapturasNaoConvertidas(): CapturaMarketing[] {
    const agora = Date.now();
    const diasTeste = 7; // 7 dias de teste

    return this.capturas.filter(c => {
      const diasDecorridos = (agora - c.data_teste) / (1000 * 60 * 60 * 24);
      return c.status === 'teste_ativo' && diasDecorridos > diasTeste;
    });
  }

  /**
   * Obtém estatísticas de marketing
   */
  obterEstatisticasMarketing(): {
    total_capturas: number;
    testes_ativos: number;
    convertidos: number;
    nao_convertidos: number;
    taxa_conversao: number;
  } {
    const total_capturas = this.capturas.length;
    const testes_ativos = this.capturas.filter(c => c.status === 'teste_ativo').length;
    const convertidos = this.capturas.filter(c => c.status === 'convertido').length;
    const nao_convertidos = this.capturas.filter(c => c.status === 'teste_expirado').length;
    const taxa_conversao =
      total_capturas > 0 ? (convertidos / (convertidos + nao_convertidos)) * 100 : 0;

    return {
      total_capturas,
      testes_ativos,
      convertidos,
      nao_convertidos,
      taxa_conversao: parseFloat(taxa_conversao.toFixed(2)),
    };
  }

  /**
   * Obtém planos
   */
  obterPlanos(): Plano[] {
    return Array.from(this.planos.values());
  }

  /**
   * Atualiza plano
   */
  atualizarPlano(plano_id: string, dados: Partial<Plano>): Plano {
    const plano = this.planos.get(plano_id);
    if (!plano) throw new Error('Plano não encontrado');

    const planoAtualizado = { ...plano, ...dados };
    this.planos.set(plano_id, planoAtualizado);

    console.log(`[Financial] Plano atualizado: ${plano_id}`);

    return planoAtualizado;
  }

  /**
   * Obtém automações
   */
  obterAutomacoes(): AutomacaoMensagem[] {
    return this.automacoes;
  }

  /**
   * Obtém templates
   */
  obterTemplates(): TemplateEngajamento[] {
    return Array.from(this.templates.values());
  }

  /**
   * Cria novo template
   */
  criarTemplate(
    nome: string,
    tipo: 'email' | 'sms' | 'whatsapp' | 'notificacao',
    titulo: string,
    conteudo: string,
    variaveis: string[]
  ): TemplateEngajamento {
    const template: TemplateEngajamento = {
      id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nome,
      tipo,
      titulo,
      conteudo,
      variaveis,
      criada_em: Date.now(),
      atualizada_em: Date.now(),
    };

    this.templates.set(template.id, template);
    console.log(`[Financial] Template criado: ${nome}`);

    return template;
  }

  /**
   * Obtém diagnóstico financeiro
   */
  obterDiagnosticoFinanceiro(): {
    usuarios: { total: number; ativos: number; inadimplentes: number; inativos: number; cancelados: number; testes: number; mrr: number; churn_rate: number };
    marketing: { total_capturas: number; testes_ativos: number; convertidos: number; nao_convertidos: number; taxa_conversao: number };
    pagamentos_pendentes: number;
    receita_total: number;
  } {
    const usuarios = this.obterEstatisticasUsuarios();
    const marketing = this.obterEstatisticasMarketing();
    const pagamentos_pendentes = this.pagamentos.filter(p => p.status === 'pendente').length;
    const receita_total = this.pagamentos
      .filter(p => p.status === 'confirmado')
      .reduce((sum, p) => sum + p.valor, 0);

    return {
      usuarios,
      marketing,
      pagamentos_pendentes,
      receita_total,
    };
  }
}

export const financialManagement = new FinancialManagement();
export type { Plano, Usuario, Pagamento, AutomacaoMensagem, TemplateEngajamento, CapturaMarketing };
