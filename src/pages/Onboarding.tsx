import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  saveProfile,
  wipeLegacy,
  type AvatarEmoji,
  type FrequencyPref,
  type Goal,
  type Profile,
  getProfile,
} from "@/lib/storage";

const avatars: AvatarEmoji[] = ["💩", "🦠", "🌿", "🏋️", "💊", "🧘"];

const goals: { id: Goal; label: string; emoji: string }[] = [
  { id: "digestion", label: "Improve digestion", emoji: "🌱" },
  { id: "ibs", label: "Track IBS / IBD", emoji: "📊" },
  { id: "weight", label: "Lose weight & gut health", emoji: "⚖️" },
  { id: "curious", label: "Just curious", emoji: "👀" },
];

const freqs: { id: FrequencyPref; label: string }[] = [
  { id: "once", label: "Once a day" },
  { id: "two_three", label: "2–3 times a day" },
  { id: "less", label: "Less than once a day" },
  { id: "irregular", label: "Irregularly" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarEmoji>("💩");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [frequencyPref, setFrequencyPref] = useState<FrequencyPref | null>(null);

  useEffect(() => {
    wipeLegacy();
    if (getProfile()) navigate("/", { replace: true });
  }, [navigate]);

  const finish = () => {
    if (!name.trim() || !goal || !frequencyPref) return;
    const profile: Profile = {
      name: name.trim(),
      avatar,
      goal,
      frequencyPref,
      createdAt: Date.now(),
    };
    saveProfile(profile);
    navigate("/");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* progress dots */}
      <div className="mb-8 flex justify-center gap-2 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-between text-center animate-fade-in">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 text-8xl animate-scale-in">💩</div>
            <h1 className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-6xl font-extrabold leading-none text-transparent">
              Pooped
            </h1>
            <p className="mt-4 text-xl font-medium text-muted-foreground">
              Your gut, gamified.
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Log daily, build streaks, and learn what your body is telling you.
            </p>
          </div>
          <Button variant="hero" size="xl" className="w-full" onClick={() => setStep(1)}>
            Start tracking
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 1 of 3
          </span>
          <h2 className="mt-2 text-3xl font-bold">What's your name?</h2>
          <p className="mt-2 text-muted-foreground">And pick an avatar.</p>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-6 h-14 rounded-2xl border-border bg-card text-base"
          />

          <p className="mt-6 text-sm font-semibold">Choose avatar</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {avatars.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`flex aspect-square items-center justify-center rounded-2xl border-2 bg-card text-4xl transition-bounce ${
                  avatar === a
                    ? "border-primary shadow-warm scale-[1.05]"
                    : "border-transparent shadow-card"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <Button
            variant="hero"
            size="xl"
            className="mt-auto w-full"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
          >
            Continue →
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 2 of 3
          </span>
          <h2 className="mt-2 text-3xl font-bold">What's your main goal?</h2>
          <p className="mt-2 text-muted-foreground">We'll tailor your experience.</p>
          <div className="mt-6 flex flex-col gap-3">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`flex items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left transition-bounce ${
                  goal === g.id
                    ? "border-primary shadow-warm scale-[1.02]"
                    : "border-transparent shadow-card"
                }`}
              >
                <span className="text-3xl">{g.emoji}</span>
                <span className="font-semibold">{g.label}</span>
              </button>
            ))}
          </div>
          <Button
            variant="hero"
            size="xl"
            className="mt-auto w-full"
            disabled={!goal}
            onClick={() => setStep(3)}
          >
            Continue →
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 3 of 3
          </span>
          <h2 className="mt-2 text-3xl font-bold">How often do you usually go?</h2>
          <p className="mt-2 text-muted-foreground">No wrong answers.</p>
          <div className="mt-6 flex flex-col gap-3">
            {freqs.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrequencyPref(f.id)}
                className={`rounded-2xl border-2 bg-card p-5 text-left font-semibold transition-bounce ${
                  frequencyPref === f.id
                    ? "border-primary shadow-warm scale-[1.02]"
                    : "border-transparent shadow-card"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button
            variant="hero"
            size="xl"
            className="mt-auto w-full"
            disabled={!frequencyPref}
            onClick={finish}
          >
            Let's go →
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
