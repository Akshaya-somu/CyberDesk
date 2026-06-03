import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NewReport from "@/pages/new-report";
import ReportDetails from "@/pages/report-details";
import ChatPage from "@/pages/chat-page";
import IncidentResponse from "@/pages/incident-response";

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (location === "/login") return <LoginPage />;
    return <LandingPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Dashboard />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/report/new" component={NewReport} />
        <Route path="/report/:id" component={ReportDetails} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/response" component={IncidentResponse} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
