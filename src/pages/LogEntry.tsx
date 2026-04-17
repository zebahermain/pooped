import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/AppShell";
import {
  BRISTOL_META,
  COLOR_META,
  calculateGutScore,
  getProfile,
  getTodaysLogs,
  saveLog,
  type StoolColor,
} from "@/lib/storage";

const colorOrder: StoolColor[] = [
  "medium_brown",
  "dark_brown",
  "light_brown",
  "green",
  "yellow",
  "red",
  "black",
  "pale",
];

const freqOptions = [
  { n: 1, label: "First time" },
  { n: 2, label: "2nd time" },
  { n: 3, label: "3rd time" },
  { n: 4, label: "4 or more" },
];

const LogEntry = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bristol, setBristol] = useState<number | null>(null);
  const [color, setColor] = useState<StoolColor | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!getProfile()) navigate("/onboarding", { replace: true });
    // pre-suggest frequency
    const today = getTodaysLogs().length;
    setFrequency(Math.min(today + 1, 4));
  }, [navigate]);

  const submit = () => {
    if (!bristol || !color || !frequency) return;
    const todayCount = getTodaysLogs().length + 1;
    const score = calculateGutScore(bristol, color, todayCount);
    const log = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      bristolType: bristol,
      color,
      frequency,
      notes: notes.trim() || undefined,
      gutScore: score,
    };
    saveLog(log);
    navigate(`/result/${log.id}`);
  };

  const canContinue =
    (step === 1 && bristol) ||
    (step === 2 && color) ||
    (step === 3 && frequency) ||
    step === 4;

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-3 pr-12">
        <button
          onClick={() => (step === 1 ? navigate("/") : setStep(step - 1))}
          className="rounded-full bg-card p-2 shadow-card border border-border"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex h-2 gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-full flex-1 rounded-full transition-all ${
                  s <= step ? "gradient-warm" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Step {step} of 4</p>
        </div>
      </header>

      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">Pick your Bristol type</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Which one looks most like yours?
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {Object.entries(BRISTOL_META).map(([typeStr, b]) => {
              const type = parseInt(typeStr, 10);
              const selected = bristol === type;
              return (
                <button
                  key={type}
                  onClick={() => setBristol(type)}
                  className={`flex items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-bounce ${
                    selected
                      ? "border-primary shadow-warm scale-[1.01]"
                      : "border-transparent shadow-card"
                  }`}
                >
                  <span className="text-3xl">{b.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Type {type}</span>
                      {b.ideal && (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                          Ideal
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{b.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">What color was it?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Brown is healthy.</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {colorOrder.map((c) => {
              const meta = COLOR_META[c];
              const selected = color === c;
              return (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border-2 bg-card p-4 transition-bounce ${
                    selected
                      ? "border-primary shadow-warm scale-[1.03]"
                      : "border-border/40 shadow-card"
                  }`}
                >
                  <div
                    className={`h-16 w-16 rounded-full border-2 ${
                      selected ? "ring-4 ring-primary/40" : "border-border"
                    }`}
                    style={{ backgroundColor: meta.hex }}
                  />
                  <span className="text-center text-xs font-semibold leading-tight">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">How many times today?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Counting this one.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {freqOptions.map((f) => (
              <button
                key={f.n}
                onClick={() => setFrequency(f.n)}
                className={`rounded-2xl border-2 bg-card p-6 text-center font-semibold transition-bounce ${
                  frequency === f.n
                    ? "border-primary shadow-warm scale-[1.02]"
                    : "border-transparent shadow-card"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">Any notes?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional — food, mood, symptoms.
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any food, stress, or context to note?"
            className="mt-5 min-h-[140px] rounded-2xl border-border bg-card text-base shadow-card"
          />
        </div>
      )}

      <div className="mt-8">
        {step < 4 ? (
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
          >
            Continue →
          </Button>
        ) : (
          <Button variant="hero" size="xl" className="w-full" onClick={submit}>
            Calculate my score →
          </Button>
        )}
      </div>
    </AppShell>
  );
};

export default LogEntry;
