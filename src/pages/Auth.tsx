import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/storage";
import { Loader2, AlertCircle } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(location.state?.mode || "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    document.title = mode === "signup" ? "Create account — Pooped" : "Sign in — Pooped";
  }, [mode]);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.includes("@")) errors.email = "Please enter a valid email address";
    if (password.length < 8) errors.password = "Too short — minimum 8 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          navigate("/confirm-email", { state: { email, showBanner: true } });
          return;
        }
        if (error.message.includes("Invalid login credentials")) {
          setFieldErrors({ password: "Incorrect password" });
          return;
        }
        if (error.status === 429) {
          setError("Too many attempts — wait a minute and try again.");
          return;
        }
        throw error;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setBusy(true);
    setError(null);
    try {
      const local = getProfile();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `\${window.location.origin}/`,
          data: local ? { name: local.name, avatar: local.avatar } : undefined,
        },
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          setFieldErrors({ email: "This email is already registered — try signing in instead" });
          return;
        }
        throw error;
      }
      navigate("/confirm-email", { state: { email } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `\${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
      setGoogleBusy(false);
    }
  };

  const submit = async () => {
    if (mode === "signup") await handleSignUp();
    else await handleSignIn();
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.includes("@")) {
      setForgotError("Please enter a valid email");
      return;
    }
    setForgotBusy(true);
    setForgotError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `\${window.location.origin}/profile`,
      });
      if (error) throw error;
      setForgotSuccess(true);
    } catch (e: any) {
      setForgotError(e.message);
    } finally {
      setForgotBusy(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { label: "Too short — minimum 8 characters", color: "bg-red-500", width: "w-1/3" };
    const hasSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasSpecial) return { label: "Add a number or symbol to strengthen it", color: "bg-amber-500", width: "w-2/3" };
    return { label: "Strong ✓", color: "bg-green-500", width: "w-full" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
      <div className="mt-8 text-center">
        <div className="text-6xl">💩</div>
        <h1 className="mt-4 text-3xl font-bold">
          {mode === "signup" ? "Save your streak" : "Welcome back"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "signup"
            ? "Create a free account so you never lose your data."
            : "Sign in to sync your gut journey."}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="space-y-1">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => !email.includes("@") && email && setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))}
            className="h-12 rounded-xl"
          />
          {fieldErrors.email && (
            <p className="flex items-center gap-1 text-[12px] text-[#EF4444] animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Input
            type="password"
            placeholder="Password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl"
          />
          {mode === "signup" && strength && (
            <div className="mt-2 space-y-1.5">
              <div className="h-1 w-full rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
              </div>
              <p className={`text-[12px] ${strength.color.replace('bg-', 'text-')}`}>
                {strength.label}
              </p>
            </div>
          )}
          {fieldErrors.password && (
            <p className="flex items-center gap-1 text-[12px] text-[#EF4444] animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.password}
            </p>
          )}
          {mode === "signin" && (
            <button 
              onClick={() => setShowForgot(true)}
              className="mt-1 text-sm text-primary font-medium"
            >
              Forgot password?
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-[#78350F] bg-[#1C1400] p-3">
            <p className="flex items-center gap-2 text-sm text-white font-medium">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {error}
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button variant="hero" size="xl" className="w-full" disabled={busy || googleBusy} onClick={submit}>
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              mode === "signup" ? "Create account" : "Sign in"
            )}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="xl" 
            className="w-full bg-white text-black hover:bg-gray-50 border-gray-200" 
            disabled={busy || googleBusy} 
            onClick={handleGoogleSignIn}
          >
            {googleBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </div>
            )}
          </Button>
        </div>
      </div>

      <button
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setFieldErrors({});
          setError(null);
        }}
        className="mt-6 text-center text-sm text-primary font-medium"
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>

      <Drawer open={showForgot} onOpenChange={setShowForgot}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Reset password</DrawerTitle>
              <DrawerDescription>
                Enter your email and we'll send you a link to get back into your account.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 space-y-4">
              <Input
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
              {forgotError && (
                <p className="text-sm text-red-500 font-medium">{forgotError}</p>
              )}
              {forgotSuccess && (
                <p className="text-sm text-green-500 font-medium">Reset link sent to {forgotEmail} ✓</p>
              )}
            </div>
            <DrawerFooter className="mb-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full" 
                onClick={handleForgotPassword}
                disabled={forgotBusy || forgotSuccess}
              >
                {forgotBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default AuthPage;
