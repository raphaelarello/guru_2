import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Crown, Sparkles } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  icon: React.ReactNode;
  features: { name: string; included: boolean }[];
  limits: { name: string; value: string | number }[];
  cta: string;
  highlighted: boolean;
}

export default function UpgradePlanos() {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      currency: 'BRL',
      description: 'Perfeito para começar',
      icon: <Sparkles className="w-6 h-6" />,
      features: [
        { name: 'Acesso básico', included: true },
        { name: '1 bot automático', included: true },
        { name: '5 alertas por dia', included: true },
        { name: 'Análise básica', included: true },
        { name: 'Value Betting', included: false },
        { name: 'ML Avançado', included: false },
        { name: 'Suporte prioritário', included: false },
        { name: 'API privada', included: false },
      ],
      limits: [
        { name: 'Bots', value: 1 },
        { name: 'Alertas/dia', value: 5 },
        { name: 'Armazenamento', value: '1GB' },
        { name: 'Requisições/mês', value: '1.000' },
      ],
      cta: 'Comece Agora',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: billingCycle === 'monthly' ? 9999 : 99990,
      currency: 'BRL',
      description: 'Para apostadores sérios',
      icon: <Zap className="w-6 h-6" />,
      features: [
        { name: 'Tudo do Gratuito', included: true },
        { name: '5 bots automáticos', included: true },
        { name: '50 alertas por dia', included: true },
        { name: 'Análise avançada', included: true },
        { name: 'Value Betting', included: true },
        { name: 'ML Avançado', included: true },
        { name: 'Suporte prioritário', included: false },
        { name: 'API privada', included: false },
      ],
      limits: [
        { name: 'Bots', value: 5 },
        { name: 'Alertas/dia', value: 50 },
        { name: 'Armazenamento', value: '50GB' },
        { name: 'Requisições/mês', value: '10.000' },
      ],
      cta: 'Fazer Upgrade',
      highlighted: true,
    },
    {
      id: 'elite',
      name: 'Elite',
      price: billingCycle === 'monthly' ? 29999 : 299990,
      currency: 'BRL',
      description: 'Máximo poder e controle',
      icon: <Crown className="w-6 h-6" />,
      features: [
        { name: 'Tudo do Profissional', included: true },
        { name: 'Bots ilimitados', included: true },
        { name: 'Alertas ilimitados', included: true },
        { name: 'Análise premium', included: true },
        { name: 'Value Betting avançado', included: true },
        { name: 'ML Premium', included: true },
        { name: 'Suporte 24/7', included: true },
        { name: 'API privada', included: true },
      ],
      limits: [
        { name: 'Bots', value: 'Ilimitado' },
        { name: 'Alertas/dia', value: 'Ilimitado' },
        { name: 'Armazenamento', value: '500GB' },
        { name: 'Requisições/mês', value: '100.000' },
      ],
      cta: 'Virar Elite',
      highlighted: false,
    },
  ];

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Desbloqueie recursos premium e maximize seus ganhos
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingCycle === 'annual'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Anual (20% OFF)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative transition transform hover:scale-105 ${
                plan.highlighted ? 'md:scale-105' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <Card
                className={`h-full transition ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/50 shadow-2xl shadow-yellow-500/20'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{plan.icon}</div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {plan.name}
                      </CardTitle>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {plan.price === 0 ? 'Grátis' : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-400">
                          /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-6 font-bold text-lg py-6 transition ${
                      plan.highlighted
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                      Recursos
                    </h3>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Limits */}
                  <div className="border-t border-slate-700 pt-6">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">
                      Limites
                    </h3>
                    <div className="space-y-2">
                      {plan.limits.map((limit, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm text-gray-300"
                        >
                          <span>{limit.name}</span>
                          <span className="font-semibold text-white">
                            {limit.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="bg-slate-800 border-slate-700 mb-12">
          <CardHeader>
            <CardTitle className="text-white">Comparação Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                      Recurso
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                      Gratuito
                    </th>
                    <th className="text-center py-3 px-4 text-yellow-400 font-semibold">
                      Profissional
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                      Elite
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Bots Automáticos', free: '1', pro: '5', elite: '∞' },
                    { name: 'Alertas/Dia', free: '5', pro: '50', elite: '∞' },
                    { name: 'Armazenamento', free: '1GB', pro: '50GB', elite: '500GB' },
                    { name: 'Requisições/Mês', free: '1K', pro: '10K', elite: '100K' },
                    { name: 'Value Betting', free: '✗', pro: '✓', elite: '✓' },
                    { name: 'ML Avançado', free: '✗', pro: '✓', elite: '✓' },
                    { name: 'API Privada', free: '✗', pro: '✗', elite: '✓' },
                    { name: 'Suporte 24/7', free: '✗', pro: '✗', elite: '✓' },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="py-3 px-4 text-gray-300">{row.name}</td>
                      <td className="text-center py-3 px-4 text-gray-400">
                        {row.free}
                      </td>
                      <td className="text-center py-3 px-4 text-yellow-400 font-semibold">
                        {row.pro}
                      </td>
                      <td className="text-center py-3 px-4 text-gray-300">
                        {row.elite}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Posso cancelar minha assinatura a qualquer momento?',
                a: 'Sim, você pode cancelar sua assinatura a qualquer momento sem penalidades. Você terá acesso até o final do período de faturamento.',
              },
              {
                q: 'Qual é a diferença entre Profissional e Elite?',
                a: 'O plano Elite oferece recursos ilimitados, API privada, suporte 24/7 e análises premium. Perfeito para traders profissionais.',
              },
              {
                q: 'Vocês oferecem desconto anual?',
                a: 'Sim! Ao escolher o plano anual, você economiza 20% em comparação com o preço mensal.',
              },
              {
                q: 'Posso fazer upgrade ou downgrade a qualquer momento?',
                a: 'Sim, você pode mudar de plano a qualquer momento. As mudanças entram em vigor imediatamente.',
              },
            ].map((faq, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
