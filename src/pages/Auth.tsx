import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * Landing page for unauthenticated users.
 *
 * Per the new flow spec:
 *   - The ONLY entry into the app is "Sign in with Google".
 *   - No guest mode, no email/password, no manual account creation.
 *   - After Google OAuth completes, Supabase redirects back to "/".
 *     The router (App.tsx) then decides:
 *        new user (no row in public.profiles)  -> /onboarding
 *        returning user                        -> Home
 */
const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pooped — Sign in";
  }, []);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (e: unknown) {
      setError((e as Error).message ?? "Could not start Google sign-in");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-8xl animate-scale-in">💩</div>
        <h1 className="mt-6 bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-6xl font-extrabold leading-none text-transparent">
          Pooped
        </h1>
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Your gut, gamified.
        </p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Sign in with Google to track patterns, build streaks, and meet your reservoir.
        </p>
      </div>

      <div className="w-full space-y-3">
        {error && (
          <div className="rounded-xl border border-[#78350F] bg-[#1C1400] p-3">
            <p className="flex items-center gap-2 text-sm text-white font-medium">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {error}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="xl"
          className="w-full bg-white text-black hover:bg-gray-50 border-gray-200"
          disabled={busy}
          onClick={handleGoogleSignIn}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </div>
          )}
        </Button>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          By continuing, you agree to track responsibly and laugh occasionally.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
