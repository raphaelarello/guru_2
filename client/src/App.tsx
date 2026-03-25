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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Painel} />
      <Route path="/painel" component={Painel} />
      <Route path="/ao-vivo" component={AoVivo} />
      <Route path="/bots" component={Bots} />
      <Route path="/kelly" component={KellyTracker} />
      <Route path="/auditoria" component={Auditoria} />
      <Route path="/pitacos" component={Pitacos} />
      <Route path="/jogos-hoje" component={JogosHoje} />
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
