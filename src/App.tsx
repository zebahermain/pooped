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
import Onboarding from "./onboarding.tsx";
import LogEntry from "./LogEntry.tsx";
import NoMovement from "./NoMovement.tsx";
import Result from "./Result.tsx";
import History from "./History.tsx";
import Reservoir from "./Reservoir.tsx";
import Send from "./Send.tsx";
import Splat from "./Splat.tsx";
import ProfilePage from "./Profile.tsx";
import AuthPage from "./Auth.tsx";
import ConfirmEmail from "./ConfirmEmail.tsx";
import NotFound from "./NotFound.tsx";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProfileSyncer = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (user) syncProfileForUser(user.id).catch(console.error);
  }, [user]);
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
          })
          .catch(() => {
            setCheckingProfile(false);
          });
      } else {
        setCheckingProfile(false);
      }
    }
  }, [session, loading]);

  if (loading || (session && checkingProfile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ); innerHTML
  }

  if (!session && !localProfile) return <Navigate to="/auth" replace state={{ mode: "signin" }} />;
  if (session && !hasRemoteProfile) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const RootRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/splat/:id" element={<Splat />} />
      <Route path="/log" element={<ProtectedRoute><LogEntry /></ProtectedRoute>} />
      <Route path="/log/no-movement" element={<ProtectedRoute><NoMovement /></ProtectedRoute>} />
      <Route path="/result/:score" element={<ProtectedRoute><Result /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/reservoir" element={<ProtectedRoute><Reservoir /></ProtectedRoute>} />
      <Route path="/send" element={<ProtectedRoute><Send /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
