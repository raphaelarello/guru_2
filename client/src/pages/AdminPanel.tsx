import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, LogOut, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSession {
  id: string;
  token: string;
  twoFactorVerified: boolean;
}

interface AuditLog {
  id: string;
  acao: string;
  descricao: string;
  timestamp: number;
  status: 'sucesso' | 'falha';
  motivo_falha?: string;
}

export default function AdminPanel() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codigoTwoFa, setCodigoTwoFa] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Atalho secreto: Ctrl+Shift+A
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminPanel(!showAdminPanel);
        if (!showAdminPanel) {
          toast.info('Painel ADM ativado');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAdminPanel]);

  const handleLogin = async () => {
    if (!senha) {
      toast.error('Digite a senha SuperAdmin');
      return;
    }

    setLoading(true);
    try {
      // Simular autenticação
      const sessionId = `session-${Date.now()}`;
      const token = Math.random().toString(36).substr(2);

      setSession({
        id: sessionId,
        token,
        twoFactorVerified: false,
      });

      toast.success('Código 2FA enviado');
    } catch (error) {
      toast.error('Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!codigoTwoFa || codigoTwoFa.length !== 6) {
      toast.error('Digite um código 2FA válido');
      return;
    }

    setLoading(true);
    try {
      // Simular verificação 2FA
      setSession(prev => prev ? { ...prev, twoFactorVerified: true } : null);
      toast.success('Autenticação bem-sucedida');

      // Simular carregamento de logs
      setAuditLogs([
        {
          id: '1',
          acao: 'superadmin-login',
          descricao: 'Login SuperAdmin',
          timestamp: Date.now(),
          status: 'sucesso',
        },
        {
          id: '2',
          acao: 'usuario-criado',
          descricao: 'Novo usuário criado',
          timestamp: Date.now() - 3600000,
          status: 'sucesso',
        },
      ]);
    } catch (error) {
      toast.error('Código 2FA inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setSenha('');
    setCodigoTwoFa('');
    setShowAdminPanel(false);
    toast.success('Logout realizado');
  };

  if (!showAdminPanel) {
    return null;
  }

  if (!session?.twoFactorVerified) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-slate-950 border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Shield className="w-5 h-5" />
              Painel SuperAdmin
            </CardTitle>
            <CardDescription>Acesso restrito - Autenticação de dois fatores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!session ? (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-300">Senha SuperAdmin</label>
                  <div className="relative mt-2">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Digite a senha"
                      className="bg-slate-900 border-slate-700 pr-10"
                      onKeyPress={e => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleLogin} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
                  {loading ? 'Autenticando...' : 'Autenticar'}
                </Button>
              </>
            ) : (
              <>
                <div className="bg-slate-900 p-3 rounded border border-amber-500/30">
                  <p className="text-sm text-slate-300 mb-2">Código 2FA enviado para seu email</p>
                  <Input
                    type="text"
                    value={codigoTwoFa}
                    onChange={e => setCodigoTwoFa(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="bg-slate-800 border-slate-700 text-center font-mono text-lg tracking-widest"
                    onKeyPress={e => e.key === 'Enter' && handleVerify2FA()}
                  />
                </div>
                <Button onClick={handleVerify2FA} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>
                <Button onClick={() => setSession(null)} variant="outline" className="w-full">
                  Voltar
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-auto p-4">
      <Card className="w-full max-w-4xl bg-slate-950 border-amber-500/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Shield className="w-5 h-5" />
              Painel de Controle SuperAdmin
            </CardTitle>
            <CardDescription>Área restrita - Apenas SuperAdmin</CardDescription>
          </div>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="usuarios" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900">
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
              <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              <TabsTrigger value="planos">Planos</TabsTrigger>
              <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
            </TabsList>

            <TabsContent value="usuarios" className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Gestão de Usuários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-green-400">1,234</div>
                        <p className="text-sm text-slate-400">Usuários Ativos</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-red-400">45</div>
                        <p className="text-sm text-slate-400">Inadimplentes</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-yellow-400">89</div>
                        <p className="text-sm text-slate-400">Testes Expirados</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">Gerenciar Usuários</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pagamentos" className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Gestão de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-green-400">R$ 45.230</div>
                        <p className="text-sm text-slate-400">MRR</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-blue-400">234</div>
                        <p className="text-sm text-slate-400">Transações Confirmadas</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-orange-400">12</div>
                        <p className="text-sm text-slate-400">Pendentes</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">Gerenciar Pagamentos</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planos" className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Gestão de Planos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {['Free', 'Pro', 'Elite'].map(plano => (
                      <div key={plano} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                        <span className="font-medium">{plano}</span>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">Criar Novo Plano</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auditoria" className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Logs de Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-800 rounded border border-slate-700">
                        {log.status === 'sucesso' ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{log.acao}</p>
                          <p className="text-xs text-slate-400">{log.descricao}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
