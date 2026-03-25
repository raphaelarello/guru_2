/**
 * Integração Completa com Stripe
 * Gerenciamento de planos, pagamentos e webhooks
 */

interface Plan {
  id: string;
  name: 'free' | 'pro' | 'elite';
  price: number;
  currency: string;
  stripePriceId: string;
  features: string[];
  limits: {
    bots: number;
    alerts: number;
    apiCalls: number;
    storage: number;
  };
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  canceledAt?: number;
  createdAt: number;
}

interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'draft' | 'void' | 'uncollectible';
  dueDate: number;
  paidAt?: number;
  createdAt: number;
}

class StripeIntegration {
  private plans: Map<string, Plan> = new Map();
  private subscriptions: Map<string, Subscription[]> = new Map();
  private invoices: Map<string, Invoice[]> = new Map();
  private webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

  constructor() {
    this.initializePlans();
  }

  /**
   * Inicializa planos disponíveis
   */
  private initializePlans(): void {
    const plans: Plan[] = [
      {
        id: 'free',
        name: 'free',
        price: 0,
        currency: 'BRL',
        stripePriceId: 'price_free_test',
        features: [
          '📱 Acesso básico',
          '🤖 1 bot automático',
          '🔔 5 alertas/dia',
          '📊 Análise básica',
          '💾 1GB de armazenamento',
        ],
        limits: {
          bots: 1,
          alerts: 5,
          apiCalls: 100,
          storage: 1024,
        },
      },
      {
        id: 'pro',
        name: 'pro',
        price: 9999, // R$ 99,99
        currency: 'BRL',
        stripePriceId: 'price_pro_test',
        features: [
          '✨ Tudo do FREE',
          '🤖 5 bots automáticos',
          '🔔 50 alertas/dia',
          '📊 Análise avançada',
          '💾 50GB de armazenamento',
          '🎯 Value Betting',
          '⚡ Prioridade de suporte',
        ],
        limits: {
          bots: 5,
          alerts: 50,
          apiCalls: 1000,
          storage: 51200,
        },
      },
      {
        id: 'elite',
        name: 'elite',
        price: 29999, // R$ 299,99
        currency: 'BRL',
        stripePriceId: 'price_elite_test',
        features: [
          '👑 Tudo do PRO',
          '🤖 Bots ilimitados',
          '🔔 Alertas ilimitados',
          '📊 Análise premium com ML',
          '💾 500GB de armazenamento',
          '🎯 Value Betting avançado',
          '⚡ Suporte 24/7',
          '🔐 API privada',
          '📈 Relatórios customizados',
        ],
        limits: {
          bots: 999,
          alerts: 999999,
          apiCalls: 100000,
          storage: 512000,
        },
      },
    ];

    plans.forEach(plan => {
      this.plans.set(plan.id, plan);
    });

    console.log('[Stripe] Planos inicializados');
  }

  /**
   * Obtém todos os planos
   */
  getPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Obtém plano específico
   */
  getPlan(planId: string): Plan | null {
    return this.plans.get(planId) || null;
  }

  /**
   * Cria sessão de checkout
   */
  async createCheckoutSession(userId: string, planId: string, returnUrl: string): Promise<{
    sessionId: string;
    url: string;
  }> {
    try {
      const plan = this.getPlan(planId);
      if (!plan) {
        throw new Error(`Plano não encontrado: ${planId}`);
      }

      // Simular criação de sessão Stripe
      const sessionId = `cs_test_${Date.now()}_${userId}`;
      const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

      console.log(`[Stripe] Sessão de checkout criada: ${sessionId} - Plano: ${planId}`);

      return {
        sessionId,
        url: checkoutUrl,
      };
    } catch (error) {
      console.error('[Stripe] Erro ao criar sessão:', error);
      throw error;
    }
  }

  /**
   * Cria subscrição
   */
  async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<Subscription> {
    try {
      const plan = this.getPlan(planId);
      if (!plan) {
        throw new Error(`Plano não encontrado: ${planId}`);
      }

      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        userId,
        planId,
        stripeSubscriptionId: `sub_stripe_${Date.now()}`,
        status: 'active',
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 dias
        createdAt: Date.now(),
      };

      if (!this.subscriptions.has(userId)) {
        this.subscriptions.set(userId, []);
      }

      this.subscriptions.get(userId)!.push(subscription);

      console.log(`[Stripe] Subscrição criada: ${subscription.id} - Usuário: ${userId} - Plano: ${planId}`);

      return subscription;
    } catch (error) {
      console.error('[Stripe] Erro ao criar subscrição:', error);
      throw error;
    }
  }

  /**
   * Obtém subscrição ativa do usuário
   */
  getActiveSubscription(userId: string): Subscription | null {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    return userSubscriptions.find(s => s.status === 'active') || null;
  }

  /**
   * Cancela subscrição
   */
  async cancelSubscription(userId: string, subscriptionId: string): Promise<Subscription> {
    try {
      const userSubscriptions = this.subscriptions.get(userId) || [];
      const subscription = userSubscriptions.find(s => s.id === subscriptionId);

      if (!subscription) {
        throw new Error(`Subscrição não encontrada: ${subscriptionId}`);
      }

      subscription.status = 'canceled';
      subscription.canceledAt = Date.now();

      console.log(`[Stripe] Subscrição cancelada: ${subscriptionId}`);

      return subscription;
    } catch (error) {
      console.error('[Stripe] Erro ao cancelar subscrição:', error);
      throw error;
    }
  }

  /**
   * Atualiza plano da subscrição
   */
  async updateSubscription(userId: string, subscriptionId: string, newPlanId: string): Promise<Subscription> {
    try {
      const newPlan = this.getPlan(newPlanId);
      if (!newPlan) {
        throw new Error(`Plano não encontrado: ${newPlanId}`);
      }

      const userSubscriptions = this.subscriptions.get(userId) || [];
      const subscription = userSubscriptions.find(s => s.id === subscriptionId);

      if (!subscription) {
        throw new Error(`Subscrição não encontrada: ${subscriptionId}`);
      }

      subscription.planId = newPlanId;

      console.log(`[Stripe] Plano atualizado: ${subscriptionId} -> ${newPlanId}`);

      return subscription;
    } catch (error) {
      console.error('[Stripe] Erro ao atualizar plano:', error);
      throw error;
    }
  }

  /**
   * Processa webhook de evento Stripe
   */
  async handleWebhook(event: any): Promise<boolean> {
    try {
      console.log(`[Stripe] Webhook recebido: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
          console.log('[Stripe] Subscrição criada via webhook');
          break;

        case 'customer.subscription.updated':
          console.log('[Stripe] Subscrição atualizada via webhook');
          break;

        case 'customer.subscription.deleted':
          console.log('[Stripe] Subscrição cancelada via webhook');
          break;

        case 'invoice.payment_succeeded':
          console.log('[Stripe] Pagamento bem-sucedido');
          await this.recordInvoice(event.data.object);
          break;

        case 'invoice.payment_failed':
          console.log('[Stripe] Falha no pagamento');
          break;

        case 'charge.refunded':
          console.log('[Stripe] Reembolso processado');
          break;

        default:
          console.log(`[Stripe] Evento não tratado: ${event.type}`);
      }

      return true;
    } catch (error) {
      console.error('[Stripe] Erro ao processar webhook:', error);
      return false;
    }
  }

  /**
   * Registra fatura
   */
  private async recordInvoice(invoiceData: any): Promise<void> {
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      userId: invoiceData.customer,
      stripeInvoiceId: invoiceData.id,
      amount: invoiceData.amount_paid,
      currency: invoiceData.currency.toUpperCase(),
      status: 'paid',
      dueDate: invoiceData.due_date * 1000,
      paidAt: Date.now(),
      createdAt: Date.now(),
    };

    if (!this.invoices.has(invoice.userId)) {
      this.invoices.set(invoice.userId, []);
    }

    this.invoices.get(invoice.userId)!.push(invoice);

    console.log(`[Stripe] Fatura registrada: ${invoice.id}`);
  }

  /**
   * Obtém histórico de faturas
   */
  getInvoiceHistory(userId: string): Invoice[] {
    return this.invoices.get(userId) || [];
  }

  /**
   * Obtém estatísticas de pagamentos
   */
  getPaymentStats(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalRevenue: number;
    invoicesCount: number;
  } {
    let totalSubscriptions = 0;
    let activeSubscriptions = 0;
    let totalRevenue = 0;
    let invoicesCount = 0;

    const subscriptionValues = Array.from(this.subscriptions.values());
    for (const subs of subscriptionValues) {
      totalSubscriptions += subs.length;
      activeSubscriptions += subs.filter(s => s.status === 'active').length;
    }

    const invoiceValues = Array.from(this.invoices.values());
    for (const invs of invoiceValues) {
      invoicesCount += invs.length;
      totalRevenue += invs.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    }

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      invoicesCount,
    };
  }

  /**
   * Retorna informações de teste
   */
  getTestInfo(): {
    mode: string;
    plans: number;
    subscriptions: number;
    invoices: number;
  } {
    return {
      mode: 'test',
      plans: this.plans.size,
      subscriptions: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0),
      invoices: Array.from(this.invoices.values()).reduce((sum, invs) => sum + invs.length, 0),
    };
  }
}

export const stripeIntegration = new StripeIntegration();
export type { Plan, Subscription, Invoice };
