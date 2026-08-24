import { type ReactNode } from 'react';
import { ConvexProvider } from 'convex/react';
import { convex } from '@/lib/convex';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/components/screening-ui';
import {
  JobDetailPage,
  JobsPage,
  NewRunPage,
  OverviewPage,
  PoolDetailPage,
  PoolsPage,
  RunDetailPage,
  RunsListPage,
} from '@/pages/screening-pages';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <AppShell>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/pools" component={PoolsPage} />
          <Route path="/pools/:id" component={PoolDetailPage} />
          <Route path="/jobs" component={JobsPage} />
          <Route path="/jobs/:id" component={JobDetailPage} />
          <Route path="/runs" component={RunsListPage} />
          <Route path="/runs/new" component={NewRunPage} />
          <Route path="/runs/:id" component={RunDetailPage} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

export default App;
