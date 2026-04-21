import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/AppShell";
import { HonestyCheck } from "@/components/HonestyCheck";
import { toast } from "@/hooks/use-toast";
import {
  BRISTOL_META,
  COLOR_META,
  FOOD_TAG_OPTIONS,
  SYMPTOM_OPTIONS,
  TAG_OPTIONS,
  calculateGutScore,
  getProfile,
  getTodaysLogs,
  saveLog,
  type StoolColor,
} from "@/lib/storage";
import { applyLogToReservoir } from "@/lib/reservoir";

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

const TOTAL_STEPS = 6;

const LogEntry = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bristol, setBristol] = useState<number | null>(null);
  const [color, setColor] = useState<StoolColor | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [foodTags, setFoodTags] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [honestyOpen, setHonestyOpen] = useState(false);
  const [symptomTipDismissed, setSymptomTipDismissed] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem("pooped.symptomTipSeen"),
  );

  useEffect(() => {
    if (!getProfile()) navigate("/onboarding", { replace: true });
    const today = getTodaysLogs().length;
    setFrequency(Math.min(today + 1, 4));
  }, [navigate]);

  const toggle = (id: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(id) ? list.filter((t) => t !== id) : [...list, id]);

  const submit = async () => {
    if (!bristol || !color || !frequency) return;
    const todayCount = getTodaysLogs().length + 1;
    const score = calculateGutScore(bristol, color, todayCount);
    const log = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      bristolType: bristol,
      color,
      frequency,
      tags: tags.length ? tags : undefined,
      foodTags: foodTags.length ? foodTags : undefined,
      symptoms: symptoms.length ? symptoms : undefined,
      notes: notes.trim() || undefined,
      gutScore: score,
    };
    saveLog(log);
    // Update reservoir (best-effort cloud sync inside).
    try {
      await applyLogToReservoir(log);
    } catch (e) {
      // non-fatal
      console.error(e);
    }
    navigate(`/result/${log.id}`);
  };

  const handleCalculate = () => {
    if (!bristol || !color || !frequency) return;
    setHonestyOpen(true);
  };

  const handleHonestyDeny = () => {
    setHonestyOpen(false);
    toast({
      title: "No worries — come back when you do 🙏",
      description: "Your streak is safe until midnight.",
    });
    navigate("/");
  };

  const canContinue =
    (step === 1 && bristol) ||
    (step === 2 && color) ||
    (step === 3 && frequency) ||
    step === 4 ||
    step === 5 ||
    step === 6;

  return (
    <AppShell>
      <div className="pb-44">
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
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-full flex-1 rounded-full transition-all ${
                  s <= step ? "gradient-warm" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
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
          <h2 className="text-2xl font-bold">Anything from today?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap all that apply — we'll find patterns over time.
          </p>
          {(["food", "drink", "lifestyle", "symptom"] as const).map((cat) => (
            <div key={cat} className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {cat === "food"
                  ? "🍽️ Food"
                  : cat === "drink"
                  ? "🥤 Drink"
                  : cat === "lifestyle"
                  ? "🌿 Lifestyle"
                  : "⚠️ Symptoms"}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {TAG_OPTIONS.filter((t) => t.category === cat).map((t) => {
                  const active = tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(t.id, tags, setTags)}
                      className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-bounce ${
                        active
                          ? "border-primary bg-primary/15 text-foreground scale-[1.03]"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 5 && (
        <div className="animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Anything else?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional — helps us spot your triggers over time.
              </p>
            </div>
            <button
              onClick={() => {
                setFoodTags([]);
                setSymptoms([]);
                setStep(6);
              }}
              className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-bounce hover:scale-[1.02]"
            >
              Skip →
            </button>
          </div>

          {!symptomTipDismissed && (
            <div className="mt-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary-glow/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold">💡 First time logging symptoms?</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Tag what you ate and how you felt. After ~14 logs we'll
                    surface your most likely food triggers. Skip whenever you like.
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem("pooped.symptomTipSeen", "1");
                    setSymptomTipDismissed(true);
                  }}
                  className="shrink-0 rounded-full px-2 text-lg text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss tip"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              🍽️ What did you eat / drink?
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {FOOD_TAG_OPTIONS.map((t) => {
                const active = foodTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id, foodTags, setFoodTags)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-bounce ${
                      active
                        ? "border-primary bg-primary/15 text-foreground scale-[1.03]"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Any symptoms today?
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((t) => {
                const active = symptoms.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id, symptoms, setSymptoms)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-bounce ${
                      active
                        ? "border-primary bg-primary/15 text-foreground scale-[1.03]"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">Any notes?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional — anything else worth remembering.
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any food, stress, or context to note?"
            className="mt-5 min-h-[140px] rounded-2xl border-border bg-card text-base shadow-card"
          />
        </div>
      )}

      </div>

      <div
        className="fixed inset-x-0 z-50 px-4 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          {step < TOTAL_STEPS ? (
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={() => {
                if (!canContinue) {
                  toast({ title: "Pick an option to continue" });
                  return;
                }
                setStep(step + 1);
              }}
              data-testid="log-continue-button"
            >
              Continue →
            </Button>
          ) : (
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleCalculate}
              data-testid="log-calculate-button"
            >
              Calculate my score →
            </Button>
          )}
        </div>
      </div>

      <HonestyCheck
        open={honestyOpen}
        onConfirm={submit}
        onDeny={handleHonestyDeny}
      />
    </AppShell>
  );
};

export default LogEntry;
