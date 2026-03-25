import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Painel from "./pages/Painel";
import AoVivo from "./pages/AoVivo";
import Bots from "./pages/Bots";
import KellyTracker from "./pages/KellyTracker";
import Auditoria from "./pages/Auditoria";
import Pitacos from "./pages/Pitacos";
import JogosHoje from "./pages/JogosHoje";
import Times from "./pages/Times";
import Ligas from "./pages/Ligas";
import HistoricoAoVivo from "./pages/HistoricoAoVivo";
import Configuracoes from "./pages/Configuracoes";
import Destaques from "./pages/Destaques";
import Artilheiros from "./pages/Artilheiros";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Painel} />
      <Route path="/painel" component={Painel} />
      <Route path="/ao-vivo" component={AoVivo} />
      <Route path="/bots" component={Bots} />
      <Route path="/kelly" component={KellyTracker} />
      <Route path="/apostas" component={KellyTracker} />
      <Route path="/destaques" component={Destaques} />
      <Route path="/auditoria" component={Auditoria} />
      <Route path="/pitacos" component={Pitacos} />
      <Route path="/jogos-hoje" component={JogosHoje} />
      <Route path="/times" component={Times} />
      <Route path="/ligas" component={Ligas} />
      <Route path="/artilheiros" component={Artilheiros} />
      <Route path="/historico-ao-vivo" component={HistoricoAoVivo} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
