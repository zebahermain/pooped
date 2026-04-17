import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { GutScoreRing } from "@/components/GutScoreRing";
import { WeeklyChart } from "@/components/WeeklyChart";
import {
  getCurrentGutScore,
  getProfile,
  getStreak,
  getWeeklyScores,
} from "@/lib/storage";

const Home = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weekly, setWeekly] = useState<{ day: string; score: number }[]>([]);

  useEffect(() => {
    const profile = getProfile();
    if (!profile.onboarded) {
      navigate("/onboarding", { replace: true });
      return;
    }
    document.title = "Pooped — Your gut, gamified";
    setScore(getCurrentGutScore());
    setStreak(getStreak());
    setWeekly(getWeeklyScores());
  }, [navigate]);

  return (
    <AppShell>
      <header className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back 👋</p>
          <h1 className="text-2xl font-bold">Today's check-in</h1>
        </div>
        <span className="text-3xl">💩</span>
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
        Log today's poop 💩
      </Button>

      <section className="mt-8">
        <WeeklyChart data={weekly} />
      </section>

      <button
        onClick={() => {}}
        className="mt-6 flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-left transition-bounce hover:bg-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl gradient-warm p-2">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Unlock AI insights</div>
            <div className="text-xs text-muted-foreground">
              Personalized tips based on your logs
            </div>
          </div>
        </div>
        <span className="text-primary">→</span>
      </button>
    </AppShell>
  );
};

export default Home;
