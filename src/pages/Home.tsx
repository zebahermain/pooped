import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/AppShell";
import { GutScoreRing } from "@/components/GutScoreRing";
import { DoctorCard } from "@/components/DoctorCard";
import { DoctorLinkSmall } from "@/components/DoctorLinkSmall";
import { IBSWeeklyTip } from "@/components/IBSWeeklyTip";
import { ReservoirCard } from "@/components/ReservoirCard";
import { FirstReservoirModal } from "@/components/FirstReservoirModal";
import { StreakStrip } from "@/components/StreakStrip";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  addToWaitlist,
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
  shouldShowEveningNoMovementCTA,
} from "@/lib/noMovement";

const Home = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [score, setScore] = useState(0);
  const [noMoveDays, setNoMoveDays] = useState(0);
  const [showEveningCTA, setShowEveningCTA] = useState(false);
  const [profile, setProfile] = useState(getProfile());
  const [proOpen, setProOpen] = useState(false);
  const [email, setEmail] = useState("");
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
    setNoMoveDays(getConsecutiveNoMovementDays());
    setShowEveningCTA(shouldShowEveningNoMovementCTA());

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

  const submitWaitlist = () => {
    if (!email.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    addToWaitlist(email);
    toast({ title: "You're on the list!", description: "We'll be in touch soon." });
    setEmail("");
    setProOpen(false);
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

      <header className="mb-2 pr-14">
        <p className="text-sm text-muted-foreground font-medium">Welcome back</p>
        <h1 className="text-2xl font-black text-foreground">
          Hey {profile.name} {profile.avatar}
        </h1>
      </header>

      <section className="mt-6 flex flex-col items-center">
        <GutScoreRing score={score} />
        {noMoveDays === 2 && (
          <span
            className="mt-3 inline-flex items-center gap-2 text-xs text-warning"
            title="Low activity — 2 no-movement days"
          >
            <span className="h-2 w-2 rounded-full bg-warning" />
            Low activity
          </span>
        )}
      </section>

      <StreakStrip />

      {showSuspiciousNudge && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="text-2xl">🙏</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground text-foreground">Heads up</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Logging more than 3 times daily can skew your Gut Score. We trust you to keep it real.
            </p>
          </div>
          <button
            onClick={dismissSuspiciousNudge}
            className="shrink-0 rounded-full px-2 text-lg text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {noMoveDays === 2 && (
        <div className="mt-6 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm font-semibold text-foreground text-foreground">
            Two days without a bowel movement
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This is worth paying attention to. Common causes: low fibre, dehydration, stress, or changes in routine.
          </p>
          <DoctorLinkSmall />
        </div>
      )}

      {noMoveDays >= 3 && (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-foreground text-foreground">
            3+ days without a movement
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            3 days without a movement is considered constipation. We'd recommend
            speaking to a doctor if this is unusual for you.
          </p>
          <DoctorLinkSmall />
        </div>
      )}

      <DailyChallengeCard />

      <Button
        variant="hero"
        size="xl"
        className="mt-4 w-full h-14 font-black"
        onClick={() => navigate("/log")}
      >
        Log a poop 💩
      </Button>

      {showEveningCTA && (
        <Button
          variant="soft"
          size="lg"
          className="mt-3 w-full"
          onClick={() => navigate("/log/no-movement")}
        >
          Didn't go today? Log that too →
        </Button>
      )}

      <ReservoirCard />

      <IBSWeeklyTip />

      <DoctorCard />

      <button
        onClick={() => setProOpen(true)}
        className="mt-6 w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary-glow/5 p-4 text-left transition-bounce hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl gradient-warm p-2">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold text-foreground text-foreground">
              Pooped Pro <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground blur-[2px] select-none">
              Your gut microbiome is showing signs of imbalance. Recent fiber intake suggests…
            </div>
          </div>
          <span className="text-primary">→</span>
        </div>
      </button>

      <Dialog open={proOpen} onOpenChange={setProOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Pooped Pro coming soon ✨</DialogTitle>
            <DialogDescription>
              Unlock AI gut analysis — see what's really happening in your gut.
              Join the waitlist and be the first to know.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl"
          />
          <Button variant="hero" size="lg" onClick={submitWaitlist}>
            Join the waitlist →
          </Button>
        </DialogContent>
      </Dialog>

      <FirstReservoirModal
        open={firstFillOpen}
        onClose={() => setFirstFillOpen(false)}
      />
    </AppShell>
  );
};

export default Home;
