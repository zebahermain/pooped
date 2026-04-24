import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/AppShell";
import { HonestyCheck } from "@/components/HonestyCheck";
import {
  BRISTOL_META,
  COLOR_META,
  TAG_OPTIONS,
  calculateGutScore,
  getProfile,
  getTodaysLogs,
  saveLog,
  type BloodPresence,
  type PoopLog,
  type StoolColor,
} from "@/lib/storage";
import { applyLogToReservoir } from "@/lib/reservoir";
import { COLOR_CONTEXT, isFlaggedColor } from "@/lib/colorContext";
import { getSmartPrompt } from "@/lib/smartPrompt";
import { creditReservoirBonus, evaluateAndMarkCompletion } from "@/lib/challenges";

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

const TOTAL_STEPS = 3;
const NOTES_MAX = 280;

const LogEntry = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bristol, setBristol] = useState<number | null>(null);
  const [color, setColor] = useState<StoolColor | null>(null);
  const [showContextCheck, setShowContextCheck] = useState(false);
  const [colorContextChips, setColorContextChips] = useState<string[]>([]);
  const [colorContextExplained, setColorContextExplained] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [bloodPresence, setBloodPresence] = useState<BloodPresence | "none" | null>(null);
  const [notes, setNotes] = useState("");
  const [honestyOpen, setHonestyOpen] = useState(false);

  const notePrompt = useMemo(() => getSmartPrompt(), []);

  useEffect(() => {
    if (!getProfile()) navigate("/onboarding", { replace: true });
  }, [navigate]);

  const toggle = (id: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(id) ? list.filter((t) => t !== id) : [...list, id]);

  const submit = async () => {
    if (!bristol || !color) return;
    const todayCount = getTodaysLogs().length + 1;
    const score = calculateGutScore(bristol, color, todayCount);
    const log: PoopLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      bristolType: bristol,
      color,
      frequency: todayCount,
      tags: tags.length ? tags : undefined,
      notes: notes.trim() || undefined,
      gutScore: score,
      colorContext: isFlaggedColor(color) ? colorContextChips : undefined,
      colorContextExplained: isFlaggedColor(color) ? colorContextExplained ?? false : undefined,
      bloodPresence: bloodPresence && bloodPresence !== "none" ? (bloodPresence as BloodPresence) : undefined,
      notePrompt: notes.trim() ? notePrompt : undefined,
    };
    saveLog(log);
    try {
      await applyLogToReservoir(log);
      const completion = evaluateAndMarkCompletion();
      if (completion) {
        creditReservoirBonus(completion.bonusUnits);
        sessionStorage.setItem("pooped.pending_challenge_confetti", JSON.stringify(completion));
      }
    } catch (e) {
      console.error(e);
    }
    navigate(`/result/${log.id}`);
  };

  const handleCalculate = () => {
    if (!bristol || !color) return;
    setHonestyOpen(true);
  };

  const handleBack = () => {
    if (step === 2 && showContextCheck) {
      setShowContextCheck(false);
      return;
    }
    if (step === 1) navigate("/");
    else setStep(step - 1);
  };

  const handleBristolSelect = (type: number) => {
    setBristol(type);
    setStep(2);
  };

  const handleColorSelect = (c: StoolColor) => {
    setColor(c);
    setColorContextChips([]);
    setColorContextExplained(null);
    if (isFlaggedColor(c)) {
      setShowContextCheck(true);
    } else {
      setStep(3);
    }
  };

  const flaggedMeta = color && isFlaggedColor(color) ? COLOR_CONTEXT[color] : undefined;

  return (
    <AppShell>
      <div className="pb-32">
        <header className="mb-6 flex items-center gap-3 pr-12">
          <button onClick={handleBack} className="rounded-full bg-card p-2 shadow-card border border-border">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex h-2 gap-1">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <div key={s} className={`h-full flex-1 rounded-full transition-all ${s <= step ? "gradient-warm" : "bg-muted"}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium">Step {step} of {TOTAL_STEPS}</p>
          </div>
        </header>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold">Pick your stool type</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tap the one that looks closest.</p>
            <div className="mt-6 flex flex-col gap-2.5">
              {Object.entries(BRISTOL_META).map(([typeStr, b]) => {
                const type = parseInt(typeStr, 10);
                return (
                  <button
                    key={type}
                    onClick={() => handleBristolSelect(type)}
                    className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 text-left transition-all active:scale-[0.98] hover:bg-muted/30"
                  >
                    <span className="text-3xl">{b.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Type {type}</span>
                        {b.ideal && (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">Ideal</span>
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

        {step === 2 && !showContextCheck && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold">What color was it?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Brown is healthy.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {colorOrder.map((c) => {
                const meta = COLOR_META[c];
                return (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-card p-5 transition-all active:scale-[0.98] hover:bg-muted/30"
                  >
                    <div className="h-14 w-14 rounded-full border-2 border-border shadow-inner" style={{ backgroundColor: meta.hex }} />
                    <span className="text-center text-xs font-bold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && showContextCheck && flaggedMeta && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold">Quick check 🧐</h2>
            <p className="mt-1 text-sm text-muted-foreground">{flaggedMeta.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {flaggedMeta.chips.map((chip) => {
                const active = colorContextChips.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    onClick={() => toggle(chip.id, colorContextChips, setColorContextChips)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 space-y-3">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={() => {
                  setColorContextExplained(colorContextChips.length > 0);
                  setShowContextCheck(false);
                  setStep(3);
                }}
              >
                Continue →
              </Button>
              <button
                onClick={() => {
                  setColorContextChips([]);
                  setColorContextExplained(false);
                  setShowContextCheck(false);
                  setStep(3);
                }}
                className="w-full py-2 text-sm font-bold text-muted-foreground"
              >
                None of these
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold">The details</h2>
            <p className="mt-1 text-sm text-muted-foreground">How was your day? (Optional)</p>
            
            <div className="mt-6 space-y-6">
              {(["food", "drink", "lifestyle", "symptom"] as const).map((cat) => (
                <div key={cat}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {cat === "food" ? "🍽️ Food" : cat === "drink" ? "🥤 Drink" : cat === "lifestyle" ? "🌿 Lifestyle" : "⚠️ Symptoms"}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TAG_OPTIONS.filter((t) => t.category === cat).map((t) => {
                      const active = tags.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggle(t.id, tags, setTags)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
                        >
                          <span>{t.emoji}</span>
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-border/40">
                <h3 className="text-sm font-bold flex items-center gap-2">
                   Any blood? <AlertCircle className="h-4 w-4 text-destructive" />
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { id: "none", label: "No blood ✓" },
                    { id: "paper_only", label: "On paper" },
                    { id: "in_bowl", label: "In bowl" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setBloodPresence(opt.id as any)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${bloodPresence === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold">Notes</h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
                  placeholder={notePrompt}
                  className="min-h-[100px] rounded-2xl border-border bg-card text-sm"
                  maxLength={NOTES_MAX}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-8 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="mx-auto w-full max-w-md">
          {step === 3 && (
            <Button variant="hero" size="xl" className="w-full" onClick={handleCalculate}>
              Calculate my score →
            </Button>
          )}
        </div>
      </div>

      <HonestyCheck open={honestyOpen} onConfirm={submit} onDeny={() => setHonestyOpen(false)} />
    </AppShell>
  );
};

export default LogEntry;
