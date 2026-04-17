import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/AppShell";
import {
  calculateScore,
  saveLog,
  type StoolColor,
  type TimeOfDay,
} from "@/lib/storage";

const bristolTypes = [
  { type: 1, emoji: "🪨", label: "Hard lumps", desc: "Severe constipation" },
  { type: 2, emoji: "🥜", label: "Lumpy sausage", desc: "Mild constipation" },
  { type: 3, emoji: "🌽", label: "Cracked sausage", desc: "Normal" },
  { type: 4, emoji: "🌭", label: "Smooth sausage ✅", desc: "Ideal" },
  { type: 5, emoji: "🫧", label: "Soft blobs", desc: "Lacking fiber" },
  { type: 6, emoji: "🥣", label: "Mushy", desc: "Mild diarrhea" },
  { type: 7, emoji: "💧", label: "Liquid", desc: "Diarrhea" },
];

const colors: { id: StoolColor; label: string; hex: string }[] = [
  { id: "brown", label: "Brown ✅", hex: "#7B4A1E" },
  { id: "yellow", label: "Yellow", hex: "#D4A53A" },
  { id: "green", label: "Green", hex: "#5C8A3A" },
  { id: "black", label: "Black", hex: "#2A1F1A" },
  { id: "red", label: "Red", hex: "#A23B2C" },
  { id: "pale", label: "Pale/Grey", hex: "#C9BBA8" },
];

const times: { id: TimeOfDay; label: string; emoji: string }[] = [
  { id: "morning", label: "Morning", emoji: "🌅" },
  { id: "afternoon", label: "Afternoon", emoji: "☀️" },
  { id: "evening", label: "Evening", emoji: "🌆" },
  { id: "night", label: "Night", emoji: "🌙" },
];

const LogEntry = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bristol, setBristol] = useState<number | null>(null);
  const [color, setColor] = useState<StoolColor | null>(null);
  const [time, setTime] = useState<TimeOfDay | null>(null);
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!bristol || !color || !time) return;
    const score = calculateScore(bristol, color, time);
    const now = new Date();
    saveLog({
      id: crypto.randomUUID(),
      date: now.toISOString().slice(0, 10),
      timestamp: now.getTime(),
      bristolType: bristol,
      color,
      timeOfDay: time,
      notes: notes || undefined,
      score,
    });
    navigate(`/result/${score}`);
  };

  const canContinue =
    (step === 1 && bristol) ||
    (step === 2 && color) ||
    (step === 3 && time) ||
    step === 4;

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => (step === 1 ? navigate("/") : setStep(step - 1))}
          className="rounded-full bg-card p-2 shadow-card"
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
            Which one looked most like yours?
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3">
            {bristolTypes.map((b) => (
              <button
                key={b.type}
                onClick={() => setBristol(b.type)}
                className={`flex items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-bounce ${
                  bristol === b.type
                    ? "border-primary shadow-warm scale-[1.01]"
                    : "border-transparent shadow-card"
                }`}
              >
                <span className="text-3xl">{b.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold">
                    Type {b.type}: {b.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">What color was it?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Brown is healthy.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 bg-card p-4 transition-bounce ${
                  color === c.id
                    ? "border-primary shadow-warm scale-[1.02]"
                    : "border-transparent shadow-card"
                }`}
              >
                <div
                  className="h-16 w-16 rounded-full shadow-soft"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">What time of day?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Morning logs score higher.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {times.map((t) => (
              <button
                key={t.id}
                onClick={() => setTime(t.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-6 transition-bounce ${
                  time === t.id
                    ? "border-primary shadow-warm scale-[1.02]"
                    : "border-transparent shadow-card"
                }`}
              >
                <span className="text-4xl">{t.emoji}</span>
                <span className="font-semibold">{t.label}</span>
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
            placeholder="e.g. Felt bloated after lunch..."
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
