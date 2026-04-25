import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  saveProfile,
  wipeLegacy,
  type AvatarEmoji,
  type FrequencyPref,
  type Goal,
  type Profile,
  getProfile,
} from "@/lib/storage";

const avatars: AvatarEmoji[] = ["💩", "🦠", "🌿", "🏋️", "💊", "🧘‍♂️"];

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
  const { session, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarEmoji>("💩");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [frequencyPref, setFrequencyPref] = useState<FrequencyPref | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    wipeLegacy();
    if (!loading) {
      if (session) {
        supabase.from("profiles").select("id").eq("id", session.user.id).single()
          .then(({ data }) => {
            if (data) navigate("/", { replace: true });
            else setChecking(false);
          });
      } else {
        if (getProfile()) navigate("/", { replace: true });
        else setChecking(false);
      }
    }
  }, [navigate, session, loading]);

  const finish = async () => {
    if (!name.trim() || !goal || !frequencyPref) return;
    const profile: Profile = {
      name: name.trim(),
      avatar,
      goal,
      frequencyPref,
      createdAt: Date.now(),
    };
    saveProfile(profile);

    if (session) {
      await supabase.from("profiles").upsert({
        id: session.user.id,
        name: profile.name,
        avatar: profile.avatar,
        goal: profile.goal,
        frequency_pref: profile.frequencyPref,
      });
    }

    navigate("/");
  };

  if (checking) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mb-8 flex justify-center gap-2 pt-4">
        {[0, 1, 2, 3, 4].map((i) => (
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
          </div>
          <Button variant="hero" size="xl" className="w-full h-14 font-black" onClick={() => setStep(1)}>
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
          <p className="mt-2 text-muted-foreground text-sm font-medium">And pick an avatar.</p>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            className="mt-6 h-14 rounded-2xl border-border bg-card text-base font-bold text-foreground"
            autoFocus
          />

          <p className="mt-8 text-sm font-bold text-foreground">Choose avatar</p>
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
            className="mt-auto w-full h-14 font-black"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
          >
            Continue →
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col animate-fade-in text-foreground">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 2 of 4
          </span>
          <h2 className="mt-2 text-3xl font-bold">What's your main goal?</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">We'll tailor your experience.</p>
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
                <span className="font-bold">{g.label}</span>
              </button>
            ))}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground/60 underline underline-offset-4 transition-colors hover:text-primary">
                <Info className="h-4 w-4" />
                What is IBS / IBD?
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto bg-card">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-black text-foreground">What is IBS / IBD? 🤔</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground">
                <div className="rounded-2xl border border-white/5 bg-background p-4">
                  <p className="font-bold">🌀 IBS — Irritable Bowel Syndrome</p>
                  <p className="mt-1 text-muted-foreground">A common condition causing cramps, bloating, gas, or constipation.</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-background p-4">
                  <p className="font-bold text-foreground">🔥 IBD — Inflammatory Bowel Disease</p>
                  <p className="mt-1 text-muted-foreground">Crohn's disease and ulcerative colitis. The gut is actually inflamed.</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="hero"
            size="xl"
            className="mt-auto w-full h-14 font-black"
            disabled={!goal}
            onClick={() => setStep(3)}
          >
            Continue →
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col animate-fade-in text-foreground">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Oh, and one more thing 😈
          </span>
          <h2 className="mt-2 text-3xl font-bold">Meet your Reservoir 💩</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">The most ridiculous part of Pooped.</p>
          <div className="mt-8 flex flex-col gap-4">
            {[
              { e: "💩", t: "Log daily → fill your reservoir" },
              { e: "🚀", t: "Build up enough → launch at friends" },
              { e: "😂", t: "They get shat on → they join Pooped" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 p-5">
                <span className="text-3xl">{item.e}</span>
                <p className="text-sm font-bold leading-tight">{item.t}</p>
              </div>
            ))}
          </div>
          <Button
            variant="hero"
            size="xl"
            className="mt-auto w-full h-14 font-black"
            onClick={() => setStep(4)}
          >
            Let's go 💩
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col animate-fade-in text-foreground">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 3 of 3
          </span>
          <h2 className="mt-2 text-3xl font-bold">How often do you go?</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">No wrong answers.</p>
          <div className="mt-6 flex flex-col gap-3">
            {freqs.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrequencyPref(f.id)}
                className={`rounded-2xl border-2 bg-card p-5 text-left font-bold transition-bounce ${
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
            className="mt-auto w-full h-14 font-black"
            disabled={!frequencyPref}
            onClick={finish}
          >
            Finish Setup →
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
