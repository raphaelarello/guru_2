import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Mail,
  Settings,
  Download,
  Plus,
  Filter,
  Search,
} from 'lucide-react';

export default function DashboardFinanceiro() {
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'usuarios' | 'pagamentos' | 'marketing' | 'planos'>('visao-geral');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inadimplentes' | 'inativos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados simulados
  const financialData = {
    mrr: 45000, // Monthly Recurring Revenue
    churn_rate: 3.2,
    usuarios_ativos: 156,
    usuarios_inadimplentes: 8,
    usuarios_inativos: 12,
    taxa_conversao_marketing: 18.5,
    pagamentos_pendentes: 5,
    receita_total: 125000,
  };

  const usuarios = [
    { id: 1, email: 'user1@email.com', nome: 'João Silva', plano: 'Elite', status: 'ativo', vencimento: '2026-04-25' },
    { id: 2, email: 'user2@email.com', nome: 'Maria Santos', plano: 'Pro', status: 'inadimplente', vencimento: '2026-03-20' },
    { id: 3, email: 'user3@email.com', nome: 'Pedro Costa', plano: 'Pro', status: 'ativo', vencimento: '2026-04-10' },
    { id: 4, email: 'user4@email.com', nome: 'Ana Oliveira', plano: 'Elite', status: 'inativo', vencimento: '2026-02-15' },
    { id: 5, email: 'user5@email.com', nome: 'Carlos Ferreira', plano: 'Pro', status: 'ativo', vencimento: '2026-05-01' },
  ];

  const pagamentos = [
    { id: 'pag-1', usuario: 'João Silva', valor: 29999, metodo: 'cartao', status: 'confirmado', data: '2026-03-20' },
    { id: 'pag-2', usuario: 'Maria Santos', valor: 9999, metodo: 'pix', status: 'pendente', data: '2026-03-25' },
    { id: 'pag-3', usuario: 'Pedro Costa', valor: 9999, metodo: 'cartao', status: 'confirmado', data: '2026-03-22' },
    { id: 'pag-4', usuario: 'Ana Oliveira', valor: 29999, metodo: 'pix', status: 'falhou', data: '2026-03-18' },
  ];

  const capturas = [
    { id: 1, email: 'teste1@email.com', nome: 'Roberto Lima', plano: 'Pro', status: 'teste_ativo', dias: 3 },
    { id: 2, email: 'teste2@email.com', nome: 'Juliana Costa', plano: 'Elite', status: 'teste_ativo', dias: 5 },
    { id: 3, email: 'teste3@email.com', nome: 'Lucas Martins', plano: 'Pro', status: 'teste_expirado', dias: 8 },
  ];

  const planos = [
    { id: 'free', nome: 'Gratuito', preco: 0, usuarios: 234, features: 3 },
    { id: 'pro', nome: 'Profissional', preco: 99.99, usuarios: 156, features: 7 },
    { id: 'elite', nome: 'Elite', preco: 299.99, usuarios: 45, features: 10 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'inadimplente':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'inativo':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'confirmado':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'falhou':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">Dashboard Financeiro</h1>
            </div>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">MRR</p>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(financialData.mrr)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-blue-400">{financialData.usuarios_ativos}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Inadimplentes</p>
                  <p className="text-3xl font-bold text-red-400">{financialData.usuarios_inadimplentes}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Churn Rate</p>
                  <p className="text-3xl font-bold text-yellow-400">{financialData.churn_rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {(['visao-geral', 'usuarios', 'pagamentos', 'marketing', 'planos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === tab
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'visao-geral' && 'Visão Geral'}
              {tab === 'usuarios' && 'Usuários'}
              {tab === 'pagamentos' && 'Pagamentos'}
              {tab === 'marketing' && 'Marketing'}
              {tab === 'planos' && 'Planos'}
            </button>
          ))}
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'usuarios' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Gestão de Usuários</CardTitle>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar usuário..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="ativos">Ativos</option>
                    <option value="inadimplentes">Inadimplentes</option>
                    <option value="inativos">Inativos</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Nome</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Plano</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Vencimento</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(user => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4 text-gray-300">{user.nome}</td>
                        <td className="py-3 px-4 text-gray-300">{user.plano}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusColor(user.status)} border`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.vencimento}</td>
                        <td className="py-3 px-4">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Mensagem
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'pagamentos' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Usuário</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Valor</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Método</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map(pag => (
                      <tr key={pag.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">{pag.id}</td>
                        <td className="py-3 px-4 text-gray-300">{pag.usuario}</td>
                        <td className="py-3 px-4 text-green-400 font-semibold">{formatCurrency(pag.valor)}</td>
                        <td className="py-3 px-4 text-gray-300 capitalize">{pag.metodo}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusColor(pag.status)} border`}>
                            {pag.status.charAt(0).toUpperCase() + pag.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{pag.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'marketing' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Capturas de Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm mb-2">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-green-400">{financialData.taxa_conversao_marketing}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm mb-2">Testes Ativos</p>
                    <p className="text-3xl font-bold text-blue-400">{capturas.filter(c => c.status === 'teste_ativo').length}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {capturas.map(cap => (
                  <Card key={cap.id} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{cap.nome}</p>
                          <p className="text-sm text-gray-400">{cap.email}</p>
                          <p className="text-sm text-gray-500">Plano: {cap.plano} • Há {cap.dias} dias</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={`${getStatusColor(cap.status)} border`}>
                            {cap.status === 'teste_ativo' ? 'Ativo' : 'Expirado'}
                          </Badge>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Enviar Oferta
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'planos' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Gestão de Planos</CardTitle>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {planos.map(plano => (
                  <Card key={plano.id} className="bg-slate-700 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white">{plano.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-yellow-400">
                          {plano.preco === 0 ? 'Grátis' : `R$ ${plano.preco}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Usuários</p>
                        <p className="text-2xl font-bold text-white">{plano.usuarios}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Recursos</p>
                        <p className="text-2xl font-bold text-white">{plano.features}</p>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
