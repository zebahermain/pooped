import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { GutScoreRing } from "@/components/GutScoreRing";
import { StreakStrip } from "@/components/StreakStrip";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { useAuth } from "@/hooks/useAuth";
import {
  getCurrentGutScore,
  getLogs,
  getProfile,
} from "@/lib/storage";
import {
  getReservoirState,
  hasSeenFirstFill,
  markFirstFillSeen,
} from "@/lib/reservoir";
import {
  hasSeenSuspiciousNudge,
  hasSuspiciousPattern,
  markSuspiciousNudgeSeen,
} from "@/lib/honesty";

const Home = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [score, setScore] = useState(0);
  const [profile, setProfile] = useState(getProfile());
  const [showSuspiciousNudge, setShowSuspiciousNudge] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate("/onboarding", { replace: true });
      return;
    }
    setProfile(p);
    document.title = "Pooped — Your gut, gamified";
    setScore(getCurrentGutScore());

    const r = getReservoirState();
    if (r.units > 0 && getLogs().length >= 1 && !hasSeenFirstFill()) {
      markFirstFillSeen();
    }

    if (!hasSeenSuspiciousNudge() && hasSuspiciousPattern()) {
      setShowSuspiciousNudge(true);
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

  const dismissSuspiciousNudge = () => {
    markSuspiciousNudgeSeen();
    setShowSuspiciousNudge(false);
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

      <section className="flex flex-col items-center">
        <GutScoreRing score={score} />
      </section>

      <StreakStrip />

      {showSuspiciousNudge && (
        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-warning/20 bg-warning/5 p-5 animate-in fade-in">
          <div className="text-2xl">🙏</div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">Heads up</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground leading-relaxed">
              Logging more than 3 times daily can skew your Gut Score.
            </p>
          </div>
          <button
            onClick={dismissSuspiciousNudge}
            className="shrink-0 rounded-full h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mt-8">
        <DailyChallengeCard />
      </div>

      <div className="mt-10 pb-10">
        <Button
          variant="hero"
          size="xl"
          className="w-full h-16 font-black text-lg rounded-[22px] gap-2 shadow-[var(--shadow-glow)]"
          style={{ background: "var(--gradient-primary)" }}
          onClick={() => navigate("/log")}
        >
          <Plus className="size-5" strokeWidth={3} />
          Log a poop 💩
        </Button>
      </div>
    </AppShell>
  );
};

export default Home;
