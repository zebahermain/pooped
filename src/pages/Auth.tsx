import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/storage";

const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = mode === "signup" ? "Create account — Pooped" : "Sign in — Pooped";
  }, [mode]);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const submit = async () => {
    if (!email.includes("@") || password.length < 6) {
      toast({ title: "Enter a valid email and 6+ char password", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const local = getProfile();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: local ? { name: local.name, avatar: local.avatar } : undefined,
          },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "You're signed in!" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
      }
    } catch (e: any) {
      toast({ title: "Auth error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

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

      <div className="mt-8 space-y-3">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Input
          type="password"
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Button variant="hero" size="xl" className="w-full" disabled={busy} onClick={submit}>
          {busy ? "..." : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </div>

      <button
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        className="mt-6 text-center text-sm text-primary"
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </div>
  );
};

export default AuthPage;
