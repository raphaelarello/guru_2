
import { useMemo, useState } from "react";
import { Shield, Lock, KeyRound, AlertTriangle, CheckCircle2, RefreshCw, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type LogStatus = "sucesso" | "falha";

export default function AdminPanel() {
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<LogStatus | "todos">("todos");

  const meQuery = trpc.superadmin.me.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  const logsQuery = trpc.superadmin.logs.useQuery(
    {
      limite: 100,
      status: statusFiltro === "todos" ? undefined : statusFiltro,
    },
    {
      enabled: !!meQuery.data?.autenticado,
      refetchInterval: 15_000,
    },
  );

  const loginMutation = trpc.superadmin.login.useMutation({
    onSuccess: (data) => {
      if (!data.sucesso || !data.sessionId) {
        toast.error(data.mensagem);
        return;
      }
      setSessionId(data.sessionId);
      toast.success("Senha validada. Digite o código 2FA.");
      if (data.bootstrapHint) {
        toast.info(`Código bootstrap atual: ${data.bootstrapHint}`);
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const verifyMutation = trpc.superadmin.verify2FA.useMutation({
    onSuccess: async (data) => {
      if (!data.sucesso) {
        toast.error(data.mensagem);
        return;
      }
      toast.success("Superadmin autenticado com sucesso.");
      setCodigo("");
      await meQuery.refetch();
      await logsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const logoutMutation = trpc.superadmin.logout.useMutation({
    onSuccess: async () => {
      setSenha("");
      setCodigo("");
      setSessionId(null);
      await meQuery.refetch();
      toast.success("Sessão superadmin encerrada.");
    },
    onError: (error) => toast.error(error.message),
  });

  const autenticado = meQuery.data?.autenticado ?? false;
  const stats = meQuery.data?.stats ?? null;

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  const handleLogin = async () => {
    if (!senha.trim()) {
      toast.error("Informe a senha do superadmin.");
      return;
    }
    await loginMutation.mutateAsync({ senha });
  };

  const handleVerify = async () => {
    if (!sessionId) {
      toast.error("Sessão de login não encontrada. Recomece o login.");
      return;
    }
    if (codigo.trim().length !== 6) {
      toast.error("Informe um código 2FA com 6 dígitos.");
      return;
    }
    await verifyMutation.mutateAsync({ sessionId, codigo: codigo.trim() });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Shield className="h-4 w-4" />
              Área crítica do sistema
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Superadmin</h1>
            <p className="text-muted-foreground">
              Autenticação real no backend, sessão persistida por cookie seguro e trilha de auditoria.
            </p>
          </div>

          {autenticado ? (
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          ) : null}
        </div>

        {!autenticado ? (
          <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
            <Card className="border-amber-500/30 bg-slate-950/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-300">
                  <Lock className="h-5 w-5" />
                  Login seguro
                </CardTitle>
                <CardDescription>
                  O acesso agora é validado no servidor. Nada de senha hardcoded no frontend.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha do superadmin</label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha"
                    autoComplete="current-password"
                  />
                </div>

                {!sessionId ? (
                  <Button className="w-full" onClick={handleLogin} disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Validando senha..." : "Validar senha"}
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Senha aprovada. Falta concluir o 2FA.
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Código 2FA</label>
                      <Input
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        inputMode="numeric"
                        maxLength={6}
                      />
                    </div>
                    <Button className="w-full" onClick={handleVerify} disabled={verifyMutation.isPending}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {verifyMutation.isPending ? "Verificando..." : "Concluir autenticação"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-950/60">
              <CardHeader>
                <CardTitle>Correções aplicadas nesta versão</CardTitle>
                <CardDescription>
                  Esta área substitui a antiga implementação insegura do superadmin.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium">Antes</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>Senha exposta no bundle do frontend.</li>
                    <li>2FA apenas simulado no React.</li>
                    <li>Duas áreas admin concorrendo ao mesmo tempo.</li>
                    <li>Sessão perdida ao recarregar a página.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <h3 className="font-medium text-emerald-300">Agora</h3>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-100/90">
                    <li>Senha verificada no backend.</li>
                    <li>2FA validado no servidor.</li>
                    <li>Cookie seguro e persistente por 30 minutos.</li>
                    <li>Logs de auditoria disponíveis na própria tela.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="visao-geral" className="space-y-6">
            <TabsList>
              <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
              <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-950/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Sessões ativas</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats?.sessoes_ativas ?? 0}</CardContent>
                </Card>
                <Card className="bg-slate-950/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Falhas de login</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats?.tentativas_login_falhadas ?? 0}</CardContent>
                </Card>
                <Card className="bg-slate-950/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Logs registrados</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats?.logs_auditoria ?? 0}</CardContent>
                </Card>
              </div>

              <Card className="bg-slate-950/60">
                <CardHeader>
                  <CardTitle>Últimas ações</CardTitle>
                  <CardDescription>
                    Visão rápida da atividade crítica do superadmin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(stats?.ultimas_acoes ?? []).map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div>
                        <p className="font-medium">{log.descricao}</p>
                        <p className="text-sm text-muted-foreground">{log.acao}</p>
                      </div>
                      <span className={log.status === "sucesso" ? "text-emerald-400" : "text-red-400"}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auditoria" className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={statusFiltro === "todos" ? "default" : "outline"}
                  onClick={() => setStatusFiltro("todos")}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFiltro === "sucesso" ? "default" : "outline"}
                  onClick={() => setStatusFiltro("sucesso")}
                >
                  Sucesso
                </Button>
                <Button
                  variant={statusFiltro === "falha" ? "default" : "outline"}
                  onClick={() => setStatusFiltro("falha")}
                >
                  Falha
                </Button>
                <Button variant="outline" onClick={() => logsQuery.refetch()} disabled={logsQuery.isFetching}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>

              <Card className="bg-slate-950/60">
                <CardHeader>
                  <CardTitle>Trilha de auditoria</CardTitle>
                  <CardDescription>
                    Toda ação crítica do superadmin fica registrada para investigação e rastreabilidade.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                      Nenhum log encontrado para o filtro atual.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {log.status === "sucesso" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                            )}
                            <span className="font-medium">{log.acao}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{log.descricao}</p>
                        {log.motivo_falha ? (
                          <p className="mt-2 text-sm text-red-300">Motivo da falha: {log.motivo_falha}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-white/10 px-2 py-1">{log.tabela_afetada}</span>
                          <span className="rounded-full border border-white/10 px-2 py-1">{log.ip_address}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
