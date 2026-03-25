import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardFinanceiro from "@/pages/DashboardFinanceiro";
import UpgradePlanos from "@/pages/UpgradePlanos";
import DashboardNotificacoes from "@/pages/DashboardNotificacoes";
import RelatorioPerfomance from "@/pages/RelatorioPerfomance";

export function AdminPanelSecret() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const SUPERADMIN_PASSWORD = "RaphaGuru2024!Admin";
  const MAX_ATTEMPTS = 3;
  const LOCK_TIME = 5 * 60 * 1000; // 5 minutos

  // Atalho secreto: Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePasswordSubmit = () => {
    if (locked) {
      alert("Painel bloqueado. Tente novamente em 5 minutos.");
      return;
    }

    if (password === SUPERADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setTimeout(() => {
          setLocked(false);
          setAttempts(0);
        }, LOCK_TIME);
        alert("Máximo de tentativas atingido. Painel bloqueado por 5 minutos.");
      } else {
        alert(
          `Senha incorreta. Tentativas restantes: ${MAX_ATTEMPTS - newAttempts}`
        );
      }
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setAttempts(0);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔐 Painel de Administração
            {isAuthenticated && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                Autenticado
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">Autenticação SuperAdmin</h3>
            <p className="text-sm text-gray-500">
              Digite a senha SuperAdmin para acessar o painel de administração
            </p>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha SuperAdmin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handlePasswordSubmit();
                }}
                disabled={locked}
              />
              <Button
                onClick={handlePasswordSubmit}
                disabled={locked}
                className="w-full"
              >
                {locked ? "Painel Bloqueado" : "Entrar"}
              </Button>
            </div>

            {attempts > 0 && !locked && (
              <p className="text-sm text-red-500">
                Tentativas restantes: {MAX_ATTEMPTS - attempts}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="financeiro" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="financeiro">💰 Financeiro</TabsTrigger>
                <TabsTrigger value="planos">📦 Planos</TabsTrigger>
                <TabsTrigger value="notificacoes">🔔 Notificações</TabsTrigger>
                <TabsTrigger value="performance">📊 Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="financeiro" className="space-y-4">
                <DashboardFinanceiro />
              </TabsContent>

              <TabsContent value="planos" className="space-y-4">
                <UpgradePlanos />
              </TabsContent>

              <TabsContent value="notificacoes" className="space-y-4">
                <DashboardNotificacoes />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <RelatorioPerfomance />
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Sair do Painel ADM
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
