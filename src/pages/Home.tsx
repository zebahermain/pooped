import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { StreakCard } from "@/components/StreakCard";
import { useAuth } from "@/hooks/useAuth";
import {
  createLog,
  getLogs,
  getProfile,
  hasPoopedToday,
  saveLog,
} from "@/lib/storage";
import {
  applyLogToReservoir,
  getReservoirState,
  hasSeenFirstFill,
  markFirstFillSeen,
} from "@/lib/reservoir";

const Home = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [profile, setProfile] = useState(getProfile());
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [pooped, setPooped] = useState(hasPoopedToday());
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate("/onboarding", { replace: true });
      return;
    }
    setProfile(p);
    setPooped(hasPoopedToday());
    document.title = "Pooped — Your gut, gamified";

    const r = getReservoirState();
    if (r.units > 0 && getLogs().length >= 1 && !hasSeenFirstFill()) {
      markFirstFillSeen();
    }

    if (!loading) {
      if (!session) {
        const dismissed = sessionStorage.getItem("guest_banner_dismissed");
        if (!dismissed) setShowGuestBanner(true);
      } else {
        setShowGuestBanner(false);
      }
    }
  }, [navigate, session, loading]);

  // One tap = one log for today. Units go into the reservoir, then the
  // Result screen plays the "you earned poop" fill animation.
  const logPoop = async () => {
    if (logging || hasPoopedToday()) return;
    setLogging(true);
    const log = createLog();
    saveLog(log);
    try {
      await applyLogToReservoir();
    } catch (e) {
      console.error(e);
    }
    navigate(`/result/${log.id}`);
  };

  if (!profile) return null;

  return (
    <AppShell>
      {showGuestBanner && (
        <div className="mb-6 relative rounded-2xl border border-border bg-card p-4 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => {
              setShowGuestBanner(false);
              sessionStorage.setItem("guest_banner_dismissed", "true");
            }}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium pr-6 text-foreground">
            You're in guest mode — your data is only saved on this device.
          </p>
          <Link to="/auth" state={{ mode: "signup" }} className="mt-2 inline-block text-sm text-primary font-bold">
            Create free account →
          </Link>
        </div>
      )}

      <header className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
          Welcome back
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground mt-1">
          {profile.name}
        </h1>
      </header>

      <section>
        {pooped ? (
          <div
            className="flex w-full flex-col items-center justify-center gap-2 rounded-[32px] border border-border bg-card px-6 py-10 text-center shadow-sm"
            data-testid="pooped-today-done"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-success/15">
              <Check className="size-7 text-success" strokeWidth={3} />
            </div>
            <p className="mt-2 text-xl font-black text-foreground">You pooped today</p>
            <p className="text-sm font-medium text-muted-foreground">
              Come back tomorrow to earn more poop.
            </p>
          </div>
        ) : (
          <Button
            variant="hero"
            className="flex h-auto w-full flex-col gap-2 rounded-[32px] py-12 font-black shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
            onClick={logPoop}
            aria-busy={logging}
            data-testid="pooped-today-button"
          >
            {logging ? (
              <Loader2 className="size-12 animate-spin" />
            ) : (
              <span className="text-6xl leading-none" aria-hidden>💩</span>
            )}
            <span className="text-2xl">I pooped today</span>
          </Button>
        )}
      </section>

      <StreakCard />
    </AppShell>
  );
};

export default Home;
