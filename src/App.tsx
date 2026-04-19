import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { syncProfileForUser } from "@/lib/profileSync";
import { AccountPromptDialog } from "@/components/AccountPromptDialog";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import LogEntry from "./pages/LogEntry.tsx";
import Result from "./pages/Result.tsx";
import History from "./pages/History.tsx";
import ProfilePage from "./pages/Profile.tsx";
import AuthPage from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProfileSyncer = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (user) syncProfileForUser(user.id).catch(console.error);
  }, [user]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProfileSyncer />
            <AccountPromptDialog />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/log" element={<LogEntry />} />
              <Route path="/result/:score" element={<Result />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
