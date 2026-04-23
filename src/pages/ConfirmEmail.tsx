import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ConfirmEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const initialBanner = location.state?.showBanner || false;
  
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setCountdown(60);
      toast({ title: "Email sent", description: "Check your inbox again." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      {initialBanner && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-center">
          <p className="text-sm font-medium text-warning-foreground">
            Your email isn't confirmed yet. Check your inbox or resend below.
          </p>
        </div>
      )}
      
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-[48px] mb-6">📧</div>
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="mt-4 text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. 
          Tap it to activate your account — it takes 5 seconds.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          Can't find it? Check your spam folder.
        </p>
        
        <div className="mt-10 w-full space-y-4">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full" 
            onClick={handleResend} 
            disabled={busy || countdown > 0}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
          </Button>
          
          <Link 
            to="/auth" 
            state={{ mode: "signup" }}
            className="block text-sm text-primary font-medium"
          >
            Wrong email? Go back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
