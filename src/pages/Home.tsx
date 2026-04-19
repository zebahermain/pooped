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
import { toast } from "@/hooks/use-toast";
import {
  addToWaitlist,
  getCurrentGutScore,
  getProfile,
  getStreakData,
  getWeeklyScores,
} from "@/lib/storage";

const Home = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weekly, setWeekly] = useState<{ day: string; score: number; date: string }[]>([]);
  const [profile, setProfile] = useState(getProfile());
  const [proOpen, setProOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate("/onboarding", { replace: true });
      return;
    }
    setProfile(p);
    document.title = "Pooped — Your gut, gamified";
    setScore(getCurrentGutScore());
    setStreak(getStreakData().currentStreak);
    setWeekly(getWeeklyScores());
  }, [navigate]);

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
        </div>
      </section>

      <Button
        variant="hero"
        size="xl"
        className="mt-8 w-full"
        onClick={() => navigate("/log")}
      >
        Log a poop 💩
      </Button>

      <section className="mt-8">
        <WeeklyChart data={weekly} />
      </section>

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
    </AppShell>
  );
};

export default Home;
