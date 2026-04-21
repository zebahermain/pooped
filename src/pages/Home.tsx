import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppShell } from "@/components/AppShell";
import { GutScoreRing } from "@/components/GutScoreRing";
import { WeeklyChart } from "@/components/WeeklyChart";
import { DoctorCard } from "@/components/DoctorCard";
import { IBSWeeklyTip } from "@/components/IBSWeeklyTip";
import { ReservoirCard } from "@/components/ReservoirCard";
import { FirstReservoirModal } from "@/components/FirstReservoirModal";
import { toast } from "@/hooks/use-toast";
import {
  addToWaitlist,
  getCurrentGutScore,
  getLogs,
  getProfile,
  getStreakData,
  getWeeklyScores,
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
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakPaused, setStreakPaused] = useState(false);
  const [noMoveDays, setNoMoveDays] = useState(0);
  const [showEveningCTA, setShowEveningCTA] = useState(false);
  const [weekly, setWeekly] = useState<{ day: string; score: number; date: string }[]>([]);
  const [profile, setProfile] = useState(getProfile());
  const [proOpen, setProOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstFillOpen, setFirstFillOpen] = useState(false);
  const [showSuspiciousNudge, setShowSuspiciousNudge] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate("/onboarding", { replace: true });
      return;
    }
    setProfile(p);
    document.title = "Pooped — Your gut, gamified";
    setScore(getCurrentGutScore());
    const s = getStreakData();
    setStreak(s.currentStreak);
    setStreakPaused(!!s.paused);
    setWeekly(getWeeklyScores());
    setNoMoveDays(getConsecutiveNoMovementDays());
    setShowEveningCTA(shouldShowEveningNoMovementCTA());

    // First-time reservoir fill modal: triggers the first time the user
    // returns to Home with at least 1 log + reservoir > 0.
    const r = getReservoirState();
    if (r.units > 0 && getLogs().length >= 1 && !hasSeenFirstFill()) {
      setFirstFillOpen(true);
      markFirstFillSeen();
    }

    if (!hasSeenSuspiciousNudge() && hasSuspiciousPattern()) {
      setShowSuspiciousNudge(true);
    }
  }, [navigate]);

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
      <header className="mb-2 pr-14">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold">
          Hey {profile.name} {profile.avatar}
        </h1>
      </header>

      <section className="mt-6 flex flex-col items-center">
        <GutScoreRing score={score} />
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2">
          <span className="text-xl">🔥</span>
          <span className="font-semibold text-accent-foreground">
            {streak} day streak
          </span>
          {noMoveDays === 2 && !streakPaused && (
            <span
              className="h-2 w-2 rounded-full bg-warning"
              title="Low activity — 2 no-movement days"
              aria-label="Low activity"
            />
          )}
        </div>
        {streakPaused && (
          <p className="mt-2 text-xs text-muted-foreground">
            Streak paused — not your fault. It'll resume when you're back to regular movement. 💪
          </p>
        )}
      </section>

      {showSuspiciousNudge && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="text-2xl">🙏</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Heads up</p>
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
          <p className="text-sm font-semibold text-foreground">
            Two days without a bowel movement
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This is worth paying attention to. Common causes: low fibre, dehydration, stress, or changes in routine.
          </p>
          <a
            href="https://www.google.com/maps/search/gastroenterologist+near+me"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Find a doctor near me →
          </a>
        </div>
      )}

      {noMoveDays >= 3 && (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-foreground">
            3+ days without a movement
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            3 days without a movement is considered constipation. We'd recommend
            speaking to a doctor if this is unusual for you.
          </p>
          <a
            href="https://www.google.com/maps/search/gastroenterologist+near+me"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Find a doctor near me →
          </a>
        </div>
      )}

      <Button
        variant="hero"
        size="xl"
        className="mt-8 w-full"
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

      <section className="mt-8">
        <WeeklyChart data={weekly} />
      </section>

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
            <div className="flex items-center gap-2 font-semibold text-foreground">
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
