import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { saveProfile, type Goal } from "@/lib/storage";

const goals: { id: Goal; label: string; emoji: string; desc: string }[] = [
  { id: "digestion", label: "Improve digestion", emoji: "🌱", desc: "Build healthier habits" },
  { id: "ibs", label: "Track IBS symptoms", emoji: "📊", desc: "Spot patterns over time" },
  { id: "curious", label: "Just curious", emoji: "👀", desc: "See what my gut's up to" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const navigate = useNavigate();

  const finish = () => {
    saveProfile({ goal, onboarded: true });
    navigate("/");
  };

  if (step === 0) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between px-6 py-12">
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-in">
          <div className="mb-8 text-8xl animate-scale-in">💩</div>
          <h1 className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-6xl font-extrabold leading-none text-transparent">
            Pooped
          </h1>
          <p className="mt-4 text-xl font-medium text-muted-foreground">
            Your gut, gamified.
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Log daily, build streaks, and learn what your body's telling you.
          </p>
        </div>
        <Button variant="hero" size="xl" className="w-full" onClick={() => setStep(1)}>
          Start tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12 animate-fade-in">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Step 2 of 2
        </span>
        <h2 className="mt-2 text-3xl font-bold">What's your main goal?</h2>
        <p className="mt-2 text-muted-foreground">We'll tailor your experience.</p>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`flex items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left transition-bounce ${
              goal === g.id
                ? "border-primary shadow-warm scale-[1.02]"
                : "border-transparent shadow-card hover:border-border"
            }`}
          >
            <span className="text-3xl">{g.emoji}</span>
            <div className="flex-1">
              <div className="font-semibold">{g.label}</div>
              <div className="text-sm text-muted-foreground">{g.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <Button
        variant="hero"
        size="xl"
        className="mt-6 w-full"
        onClick={finish}
        disabled={!goal}
      >
        Let's go →
      </Button>
    </div>
  );
};

export default Onboarding;
