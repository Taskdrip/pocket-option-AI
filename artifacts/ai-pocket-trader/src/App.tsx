import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Signals from "@/pages/signals";
import AutoTrading from "@/pages/auto-trading";
import History from "@/pages/history";
import Wallet from "@/pages/wallet";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";

import { DashboardLayout } from "@/components/layout";
import { getAuthToken } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: any }) {
  const token = getAuthToken();
  if (!token) {
    return <Redirect to="/login" />;
  }
  return <Component {...rest} />;
}

function Router() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    if (location === "/" && token) {
      setLocation("/dashboard");
    } else if (location === "/" && !token) {
      setLocation("/login");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard">
        <DashboardLayout>
          <ProtectedRoute component={Dashboard} />
        </DashboardLayout>
      </Route>
      
      <Route path="/signals">
        <DashboardLayout>
          <ProtectedRoute component={Signals} />
        </DashboardLayout>
      </Route>
      
      <Route path="/auto-trading">
        <DashboardLayout>
          <ProtectedRoute component={AutoTrading} />
        </DashboardLayout>
      </Route>
      
      <Route path="/history">
        <DashboardLayout>
          <ProtectedRoute component={History} />
        </DashboardLayout>
      </Route>
      
      <Route path="/wallet">
        <DashboardLayout>
          <ProtectedRoute component={Wallet} />
        </DashboardLayout>
      </Route>
      
      <Route path="/settings">
        <DashboardLayout>
          <ProtectedRoute component={Settings} />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin">
        <DashboardLayout>
          <ProtectedRoute component={Admin} />
        </DashboardLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
