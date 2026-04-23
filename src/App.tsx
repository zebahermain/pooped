import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { syncProfileForUser } from "@/lib/profileSync";
import { AccountPromptDialog } from "@/components/AccountPromptDialog";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/storage";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import LogEntry from "./pages/LogEntry.tsx";
import NoMovement from "./pages/NoMovement.tsx";
import Result from "./pages/Result.tsx";
import History from "./pages/History.tsx";
import Reservoir from "./pages/Reservoir.tsx";
import Send from "./pages/Send.tsx";
import Splat from "./pages/Splat.tsx";
import ProfilePage from "./pages/Profile.tsx";
import AuthPage from "./pages/Auth.tsx";
import ConfirmEmail from "./pages/ConfirmEmail.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProfileSyncer = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (user) syncProfileForUser(user.id).catch(console.error);
  }, [user]);
  return null;
};

const RootRouter = () => {
  const { session, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasRemoteProfile, setHasRemoteProfile] = useState(false);
  const localProfile = getProfile();

  useEffect(() => {
    if (!loading) {
      if (session) {
        supabase.from("profiles").select("id").eq("id", session.user.id).single()
          .then(({ data }) => {
            setHasRemoteProfile(!!data);
            setCheckingProfile(false);
          });
      }
    }
  }, [session, loading]);

  if (loading || (session && checkingProfile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && !hasRemoteProfile) return <Navigate to="/onboarding" replace />;
  if (!session && !localProfile) return <Navigate to="/auth" replace state={{ mode: "signin" }} />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/log" element={<LogEntry />} />
      <Route path="/log/no-movement" element={<NoMovement />} />
      <Route path="/result/:score" element={<Result />} />
      <Route path="/history" element={<History />} />
      <Route path="/reservoir" element={<Reservoir />} />
      <Route path="/send" element={<Send />} />
      <Route path="/splat/:id" element={<Splat />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
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
            <RootRouter />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
