import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/AppShell";
import { getProfile, saveLog, SYMPTOM_OPTIONS } from "@/lib/storage";

const FEELING_OPTIONS = [
  { id: "bloating", label: "Bloating", emoji: "😮‍💨" },
  { id: "cramps", label: "Cramps", emoji: "😣" },
  { id: "discomfort", label: "Discomfort", emoji: "😕" },
  { id: "fine", label: "Fine actually", emoji: "🙂" },
];

const NoMovement = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!getProfile()) navigate("/onboarding", { replace: true });
  }, [navigate]);

  const toggle = (id: string) =>
    setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = () => {
    const log = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      bristolType: 0, // sentinel: no movement
      color: "medium_brown" as const, // placeholder — not used for no-movement
      frequency: 0,
      symptoms: symptoms.length ? symptoms : undefined,
      notes: notes.trim() || undefined,
      gutScore: 15,
      noMovement: true,
    };
    saveLog(log);
    navigate(`/result/${log.id}`);
  };

  return (
    <AppShell>
      <div className="pb-28">
        <header className="mb-6 flex items-center gap-3 pr-12">
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-card p-2 shadow-card border border-border"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">No movement today</p>
            <h1 className="text-lg font-bold">Honest log</h1>
          </div>
        </header>

        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">How are you feeling?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap what fits — or none. This is just a check-in.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {FEELING_OPTIONS.map((f) => {
              const active = symptoms.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-bounce ${
                    active
                      ? "border-primary bg-primary/15 text-foreground scale-[1.03]"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-7">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Stress, travel, skipped meals…"
              className="mt-2 min-h-[120px] rounded-2xl border-border bg-card text-base shadow-card"
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto w-full max-w-md">
          <Button variant="hero" size="xl" className="w-full" onClick={submit}>
            Log no movement today
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

// Unused guard to avoid tree-shaking SYMPTOM_OPTIONS import if we later swap.
void SYMPTOM_OPTIONS;

export default NoMovement;
