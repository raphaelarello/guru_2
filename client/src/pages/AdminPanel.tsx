import { useMemo, useState } from "react";

type SessionData = {
  id: string;
  username: string;
  requiresPasswordChange: boolean;
};

export default function AdminPanel() {
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const needsPasswordChange = useMemo(
    () => Boolean(session?.requiresPasswordChange),
    [session]
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Use o backend real conectado à rota de login do superadmin.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Conecte esta tela à rota real de troca de senha do superadmin.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Superadmin</h1>
        <p className="mt-2 text-white/70">
          Entrada provisória segura com troca obrigatória de senha.
        </p>

        {!session && (
          <form onSubmit={handleLogin} className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div>
              <label className="mb-2 block text-sm text-white/70">Usuário</label>
              <input
                className="w-full rounded-xl bg-slate-900 px-4 py-3 outline-none ring-1 ring-white/10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Senha provisória</label>
              <input
                type="password"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 outline-none ring-1 ring-white/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Código provisório</label>
              <input
                className="w-full rounded-xl bg-slate-900 px-4 py-3 outline-none ring-1 ring-white/10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <button className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
              Entrar
            </button>
          </form>
        )}

        {needsPasswordChange && (
          <form onSubmit={handleChangePassword} className="mt-8 grid gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6">
            <h2 className="text-xl font-semibold">Troca obrigatória de senha</h2>

            <div>
              <label className="mb-2 block text-sm text-white/70">Senha atual</label>
              <input
                type="password"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 outline-none ring-1 ring-white/10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Nova senha</label>
              <input
                type="password"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 outline-none ring-1 ring-white/10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button className="rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950">
              Alterar senha
            </button>
          </form>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
