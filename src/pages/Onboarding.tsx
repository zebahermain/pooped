import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  saveProfile,
  wipeLegacy,
  type FrequencyPref,
  type Goal,
  type Profile,
} from "@/lib/storage";
import { AVATAR_OPTIONS, AvatarDisplay, type AvatarKey } from "@/lib/avatars";
import { Loader2 } from "lucide-react";

const goals: { id: Goal; label: string; emoji: string }[] = [
  { id: "ibs", label: "Track patterns", emoji: "📊" },
  { id: "weight", label: "Lose weight", emoji: "⚖️" },
  { id: "digestion", label: "Improve health", emoji: "🌱" },
  { id: "curious", label: "Curious", emoji: "👀" },
];

const freqs: { id: FrequencyPref; label: string }[] = [
  { id: "once", label: "Once a day" },
  { id: "two_three", label: "2–3 times" },
  { id: "less", label: "Less than once" },
  { id: "irregular", label: "Varies" },
];

/**
 * Mandatory onboarding for newly-authenticated users.
 *
 *   Modal 1 — Name + avatar
 *   Modal 2 — Main goal
 *   Modal 3 — How often you go
 *   Modal 4 — Meet your Reservoir
 *
 * Returning users (those with an existing public.profiles row) never see this
 * screen — App.tsx routes them straight to Home.
 */
const Onboarding = () => {
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarKey>("avocado");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [frequencyPref, setFrequencyPref] = useState<FrequencyPref | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mandatory sign-in: anyone who lands here without a session goes to /auth.
  // Returning users (already have a profile row) skip onboarding entirely.
  useEffect(() => {
    wipeLegacy();
    if (loading) return;
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }
    supabase
      .from("profiles")
      .select("id, name, frequency_pref")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        // Must have BOTH name AND frequency_pref — the DB trigger auto-fills
        // name from Google on first sign-up, but frequency_pref is only set
        // here in finish(), so it's the real "onboarding complete" signal.
        if (data && data.name && data.frequency_pref) {
          navigate("/", { replace: true });
        } else {
          // Pre-fill from Google identity if available.
          const meta = session.user.user_metadata as
            | { full_name?: string; name?: string }
            | undefined;
          if (meta?.full_name) setName(meta.full_name);
          else if (meta?.name) setName(meta.name);
          setChecking(false);
        }
      });
  }, [navigate, session, loading]);

  const finish = async () => {
    if (!session || !name.trim() || !goal || !frequencyPref) return;
    setSaving(true);
    try {
      const profile: Profile = {
        name: name.trim(),
        avatar,
        goal,
        frequencyPref,
        createdAt: Date.now(),
      };
      saveProfile(profile);

      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        name: profile.name,
        avatar: profile.avatar,
        goal: profile.goal,
        frequency_pref: profile.frequencyPref,
      });
      if (error) {
        // 23503 = foreign_key_violation on profiles_id_fkey -> auth.users row
        // for this session no longer exists (e.g. account was deleted but the
        // client-side JWT is still cached). Sign out and restart sign-in.
        if (error.code === "23503") {
          await signOut();
          navigate("/auth", { replace: true });
          return;
        }
        throw error;
      }

      navigate("/", { replace: true });
    } catch (e) {
      // Generic fallthrough — log and leave the user on this screen so they
      // can retry Continue. Prevents silent failure with the spinner hung.
      console.error("Onboarding finish failed:", e);
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* progress */}
      <div className="mb-8 flex justify-center gap-2 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-1 flex-col animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 1 of 4
          </span>
          <h2 className="mt-2 text-3xl font-bold">What&apos;s your name?</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">
            And pick an avatar.
          </p>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            className="mt-6 h-14 rounded-2xl border-border bg-card text-base font-bold text-foreground"
            autoFocus
          />

          <p className="mt-8 text-sm font-bold text-foreground">Choose avatar</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAvatar(a.key)}
                className={`flex aspect-square items-center justify-center rounded-2xl border-2 bg-card transition-bounce ${
                  avatar === a.key
                    ? "border-primary shadow-warm scale-[1.05]"
                    : "border-transparent shadow-card"
                }`}
                aria-label={a.label}
              >
                <AvatarDisplay avatar={a.key} size={64} />
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
          <h2 className="mt-2 text-3xl font-bold">What&apos;s your main goal?</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">
            We&apos;ll tailor your experience.
          </p>
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
            Step 3 of 4
          </span>
          <h2 className="mt-2 text-3xl font-bold">How often do you typically go?</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">
            No wrong answers.
          </p>
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
            onClick={() => setStep(4)}
          >
            Continue →
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col animate-fade-in text-foreground">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Last step ✨
          </span>
          <h2 className="mt-2 text-3xl font-bold">Meet your Reservoir 💩</h2>
          <p className="mt-2 text-muted-foreground text-sm font-medium">
            The most ridiculous part of Pooped.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {[
              { e: "💩", t: "Log daily → fill your reservoir" },
              { e: "🚀", t: "Build up enough → launch at friends" },
              { e: "😂", t: "They get shat on → they join Pooped" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl bg-white/5 p-5"
              >
                <span className="text-3xl">{item.e}</span>
                <p className="text-sm font-bold leading-tight">{item.t}</p>
              </div>
            ))}
          </div>
          <Button
            variant="hero"
            size="xl"
            className="mt-auto w-full h-14 font-black"
            disabled={saving}
            onClick={finish}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue →"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
