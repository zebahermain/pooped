import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToiletBowl } from "@/components/ToiletBowl";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  saveProfile,
  wipeLegacy,
  type FrequencyPref,
  type Profile,
} from "@/lib/storage";
import { AVATAR_OPTIONS, AvatarDisplay, type AvatarKey } from "@/lib/avatars";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Onboarding no longer asks how often the user goes. `frequency_pref` is still
// written because App.tsx and profileSync treat it as the "onboarding done"
// flag (the handle_new_user trigger pre-fills `name`, so name alone isn't
// enough). Users can change it later on the Profile screen.
const DEFAULT_FREQUENCY: FrequencyPref = "varies";

const Onboarding = () => {
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  // Flow: reservoir intro -> name -> avatar -> "setting up your home" -> Home.
  const [step, setStep] = useState<"reservoir" | 1 | 2 | "setup">("reservoir");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarKey>("avocado");
  const [checking, setChecking] = useState(true);

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
        if (data && data.name && data.frequency_pref) {
          navigate("/", { replace: true });
        } else {
          const meta = session.user.user_metadata as { full_name?: string; name?: string } | undefined;
          const fromEmail = (session.user.email ?? "")
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .replace(/\d+/g, "")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
          if (meta?.full_name) setName(meta.full_name);
          else if (meta?.name) setName(meta.name);
          else if (fromEmail) setName(fromEmail);
          setChecking(false);
        }
      });
  }, [navigate, session, loading]);

  const finish = async () => {
    if (!session || !name.trim()) return;
    setStep("setup");
    // Keep the loader up long enough to read, even when the save is instant.
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      const profile: Profile = {
        name: name.trim(),
        avatar,
        frequencyPref: DEFAULT_FREQUENCY,
        createdAt: Date.now(),
      };
      saveProfile(profile);

      // Only columns that exist on public.profiles. The old upsert also sent
      // `goals`, which has no column, so every save failed and "Let's go"
      // silently did nothing.
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        name: profile.name,
        avatar: profile.avatar,
        frequency_pref: profile.frequencyPref,
      });
      if (error) {
        if (error.code === "23503") {
          await signOut();
          navigate("/auth", { replace: true });
          return;
        }
        throw error;
      }
      await minDelay;
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Onboarding finish failed:", e);
      setStep(2);
      toast({ title: "Couldn't save your profile", description: "Check your connection and try again." });
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
    <div className={`mx-auto flex min-h-screen w-full max-w-md flex-col ${step === "reservoir" ? "bg-black text-white p-0" : "px-6 py-10"}`}>
      {(step === 1 || step === 2) && (
        <>
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>

          <div className="mb-8 flex justify-center gap-2 pt-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`}
              />
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Step 1 of 2</span>
          <h2 className="mt-2 text-3xl font-bold">What should we call you?</h2>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            className="mt-6 h-14 rounded-2xl border-border bg-card text-base font-bold text-foreground"
            autoFocus
          />
          <p className="mt-3 text-muted-foreground text-sm font-medium">
            We use it to greet you, and it's the name your friends see when you splat them.
          </p>
          <Button variant="hero" size="xl" className="mt-auto w-full h-14 font-black" disabled={!name.trim()} onClick={() => setStep(2)}>Continue</Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col animate-fade-in text-foreground">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Step 2 of 2</span>
          <h2 className="mt-2 text-3xl font-bold text-foreground">Choose your avatar</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAvatar(a.key)}
                className={`flex aspect-square items-center justify-center rounded-2xl border-2 bg-card transition-bounce ${avatar === a.key ? "border-primary shadow-warm scale-[1.05]" : "border-transparent shadow-card"}`}
                aria-label={a.label}
              >
                <AvatarDisplay avatar={a.key} size={64} />
              </button>
            ))}
          </div>
          <Button variant="hero" size="xl" className="mt-auto w-full h-14 font-black" onClick={finish}>Continue →</Button>
        </div>
      )}

      {step === "setup" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-fade-in text-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-bold">Setting up your home</p>
        </div>
      )}

      {step === "reservoir" && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 relative overflow-hidden bg-black text-white">
          {/* Subtle background poops */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "110vh", x: `${Math.random() * 100}vw` }}
                animate={{ y: "-10vh" }}
                transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
                className="absolute text-2xl"
              ><img src="/logo.png" alt="Pooped" className="w-64 h-auto" /></motion.div>
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-8"
          >
            <motion.div
              animate={{ y: [0, -12, 0], scale: [1, 1.03, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="filter drop-shadow-[0_0_30px_rgba(240,140,46,0.5)]"
            >
              <ToiletBowl fillRatio={0.6} size={200} />
            </motion.div>
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black tracking-tight text-center"
          >
            Meet your Reservoir
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-orange-400 font-bold text-center"
          >
            The most ridiculous part of Pooped
          </motion.p>

          <div className="mt-12 space-y-6 w-full max-w-xs">
            {[
              { e: "💩", t: "Log daily → fill your reservoir" },
              { e: "🚀", t: "Build up enough → launch at friends" },
              { e: "😂", t: "They get shat on → they join Pooped" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.3 }}
                className="flex items-center gap-4"
              >
                <span className="text-3xl">{item.e}</span>
                <p className="text-sm font-bold leading-tight text-neutral-300">{item.t}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-auto w-full pb-12 px-6"
          >
            <Button
              variant="hero"
              size="xl"
              className="w-full h-16 font-black text-lg shadow-[0_0_40px_rgba(240,140,46,0.3)]"
              onClick={() => setStep(1)}
            >
              Let's go 🚀
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
