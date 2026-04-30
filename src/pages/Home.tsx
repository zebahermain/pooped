import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X } from "lucide-react";
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
import {
  getConsecutiveNoMovementDays,
} from "@/lib/noMovement";

const Home = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [score, setScore] = useState(0);
  const [profile, setProfile] = useState(getProfile());
  const [firstFillOpen, setFirstFillOpen] = useState(false);
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
      setFirstFillOpen(true);
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
        <div className="mb-4 relative rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-top-2">
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

      <header className="mb-2">
        <p className="text-sm text-muted-foreground font-medium">Welcome back</p>
        <h1 className="text-2xl font-black text-foreground">
          Hey {profile.name}
        </h1>
      </header>

      <section className="mt-6 flex flex-col items-center">
        <GutScoreRing score={score} />
      </section>

      <StreakStrip />

      {showSuspiciousNudge && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="text-2xl">🙏</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground text-foreground">Heads up</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Logging more than 3 times daily can skew your Gut Score.
            </p>
          </div>
          <button
            onClick={dismissSuspiciousNudge}
            className="shrink-0 rounded-full px-2 text-lg text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      <DailyChallengeCard />

      <Button
        variant="hero"
        size="xl"
        className="mt-6 w-full h-14 font-black text-lg"
        onClick={() => navigate("/log")}
      >
        Log a poop 💩
      </Button>
    </AppShell>
  );
};

export default Home;
