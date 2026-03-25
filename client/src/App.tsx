// Rapha Guru — App Root
// Base principal + módulo SaaS + automação

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch, useLocation } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { BetslipProvider } from './contexts/BetslipContext';
import { TipsHistoryProvider } from './contexts/TipsHistoryContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BetslipPanel, BetslipToggle } from './components/Betslip';
import React, { Suspense, lazy, useEffect } from 'react';
import Home from './pages/Home';

const ExecutionCenter = lazy(() => import('./pages/ExecutionCenter'));
const AutomationCenter = lazy(() => import('./pages/AutomationCenter'));
const LoginPage = lazy(() => import('./pages/saas/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/saas/AuthPages').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/saas/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/saas/AuthPages').then((m) => ({ default: m.ResetPasswordPage })));
const PlansPage = lazy(() => import('./pages/saas/PlansPage'));
const MyAccountPage = lazy(() => import('./pages/saas/MyAccountPage'));
const AdminPanel = lazy(() => import('./pages/saas/AdminPanel'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, token } = useAuth();
  const [, go] = useLocation();

  useEffect(() => {
    if (!loading && !token) go('/login');
  }, [loading, token, go]);

  if (loading) return <PageFallback />;
  if (!token) return null;
  return <>{children}</>;
}

function RequirePlan({ minPlan, children }: { minPlan: string; children: React.ReactNode }) {
  const { loading, token, hasMinPlan } = useAuth();
  const [, go] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!token) go('/login');
      else if (!hasMinPlan(minPlan)) go('/planos');
    }
  }, [loading, token, hasMinPlan, minPlan, go]);

  if (loading) return <PageFallback />;
  if (!token || !hasMinPlan(minPlan)) return null;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, token, isAdmin } = useAuth();
  const [, go] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!token) go('/login');
      else if (!isAdmin) go('/');
    }
  }, [loading, token, isAdmin, go]);

  if (loading) return <PageFallback />;
  if (!token || !isAdmin) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/executor" component={ExecutionCenter} />
        <Route path="/automacao">
          <RequirePlan minPlan="elite">
            <AutomationCenter />
          </RequirePlan>
        </Route>
        <Route path="/login" component={LoginPage} />
        <Route path="/cadastro" component={RegisterPage} />
        <Route path="/esqueci-senha" component={ForgotPasswordPage} />
        <Route path="/reset-senha" component={ResetPasswordPage} />
        <Route path="/planos" component={PlansPage} />
        <Route path="/minha-conta">
          <RequireAuth>
            <MyAccountPage />
          </RequireAuth>
        </Route>
        <Route path="/admin">
          <RequireAdmin>
            <AdminPanel />
          </RequireAdmin>
        </Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <BetslipProvider>
            <TipsHistoryProvider>
              <FavoritesProvider>
                <TooltipProvider>
                  <Toaster
                    theme="dark"
                    toastOptions={{
                      style: {
                        background: '#161b22',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e6edf3',
                      },
                    }}
                  />
                  <Router />
                  <BetslipToggle />
                  <BetslipPanel />
                </TooltipProvider>
              </FavoritesProvider>
            </TipsHistoryProvider>
          </BetslipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
