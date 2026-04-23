import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GutScoreRing } from "@/components/GutScoreRing";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReservoirGainBanner } from "@/components/ReservoirGainBanner";
import { toast } from "@/hooks/use-toast";
import {
  COLOR_META,
  countBloodInBowlLastNDays,
  getLogs,
  isAlertColor,
} from "@/lib/storage";
import { COLOR_CONTEXT, isFlaggedColor } from "@/lib/colorContext";
import { ChallengeConfetti } from "@/components/ChallengeConfetti";

const Result = () => {
  const { score: idParam } = useParams();
  const navigate = useNavigate();

  const log = useMemo(() => getLogs().find((l) => l.id === idParam), [idParam]);
  const score = log?.gutScore ?? 0;
  const [animated, setAnimated] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState<string | null>(null);

  // Pick up pending challenge confetti stashed by LogEntry.submit.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pooped.pending_challenge_confetti");
      if (!raw) return;
      const c = JSON.parse(raw) as { date: string; bonusUnits: number };
      sessionStorage.removeItem("pooped.pending_challenge_confetti");
      setConfettiTrigger(`${c.date}-${Date.now()}`);
      toast({
        title: `Daily challenge complete! 🎉`,
        description: `+${c.bonusUnits} reservoir units added.`,
      });
      const t = window.setTimeout(() => setConfettiTrigger(null), 1800);
      return () => window.clearTimeout(t);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (!log) return;
    let frame = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(score * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, log]);

  if (!log) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <p className="text-muted-foreground">Log not found.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>
          Back home
        </Button>
      </div>
    );
  }

  const isNoMovement = log.bristolType === 0 || log.noMovement;

  const label = isNoMovement
    ? "No movement today 🫧"
    : score >= 80
    ? "Excellent gut day! 🟢"
    : score >= 60
    ? "Pretty good 🟡"
    : score >= 40
    ? "Room to improve 🟠"
    : "Rough day 🔴";

  const bristolMsg = isNoMovement
    ? "No movement today — that happens. Try more water and a short walk tomorrow. If this continues for 3+ days, consider speaking to a doctor. 💧"
    : log.bristolType <= 2
    ? "Looks like things are moving slowly — try more water and fiber today."
    : log.bristolType >= 6
    ? "A bit loose today — consider tracking what you ate yesterday."
    : log.bristolType === 3 || log.bristolType === 4
    ? "Textbook poop. Whatever you're doing — keep doing it."
    : "Solid effort. A bit more fiber may help shape things up.";

  // ---------------- Alert logic ----------------
  // Only show the color alert when:
  //   1. The colour is flagged, AND
  //   2. The user said "none of these apply" on the context check
  //      (colorContextExplained === false), i.e. we couldn't explain it
  //      via diet/medication.
  const flaggedMeta =
    log.color && isFlaggedColor(log.color) ? COLOR_CONTEXT[log.color] : undefined;
  const showColorAlert =
    !isNoMovement &&
    isAlertColor(log.color) &&
    log.colorContextExplained === false;
  const colorAlertSeverity = flaggedMeta?.severity ?? "warning";

  // Blood-presence alerts — escalate when "in_bowl" and repeated.
  const bloodRepeatCount =
    log.bloodPresence === "in_bowl" ? countBloodInBowlLastNDays(7) : 0;
  const openDoctor = () =>
    window.open(
      "https://www.google.com/maps/search/gastroenterologist+near+me",
      "_blank",
      "noopener,noreferrer"
    );

  const share = async () => {
    const text = `My Gut Score today: ${score}/100 💩 Tracked with Pooped — gutpooped.com`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Score copied to clipboard." });
    } catch {
      toast({ title: "Couldn't copy", description: text });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10 animate-fade-in">
      <ChallengeConfetti trigger={confettiTrigger} />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Today's score
        </p>
        <h1 className="mt-2 text-3xl font-bold">{label}</h1>
      </div>

      <div className="mt-8 flex justify-center">
        <GutScoreRing score={animated} />
      </div>

      {/* Blood in the bowl — strongest alert, always shown, non-dismissible */}
      {log.bloodPresence === "in_bowl" && (
        <div
          className="mt-6 flex flex-col gap-3 rounded-2xl border-2 p-4"
          style={{
            borderColor: "hsl(0 75% 50%)",
            backgroundColor: "hsl(0 75% 50% / 0.08)",
          }}
          data-testid="blood-in-bowl-alert"
        >
          <div className="flex items-start gap-3">
            <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div className="text-sm">
              <div className="font-bold text-foreground">
                Blood in the bowl — please see a doctor this week
              </div>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {bloodRepeatCount >= 2
                  ? "You've noted blood twice this week. Please see a doctor — we're not trying to alarm you, just making sure you take care of yourself."
                  : "This is worth taking seriously. It's probably nothing serious but it needs to be checked."}
              </p>
            </div>
          </div>
          <Button
            variant="hero"
            size="sm"
            className="w-full"
            onClick={openDoctor}
          >
            Find a doctor near me →
          </Button>
        </div>
      )}

      {/* Blood on paper — softer note */}
      {log.bloodPresence === "paper_only" && (
        <div className="mt-6 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm leading-relaxed">
            <span className="font-bold text-foreground">Blood on paper</span>
            <span className="text-muted-foreground">
              {" "}
              is most commonly from a small tear or haemorrhoid — usually harmless.
              If it keeps happening, worth a quick GP visit.
            </span>
          </p>
        </div>
      )}

      {/* Colour alert — only when the user couldn't explain it via diet */}
      {showColorAlert && (
        <div
          className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${
            colorAlertSeverity === "danger"
              ? "border-destructive/40 bg-destructive/10"
              : "border-warning/40 bg-warning/10"
          }`}
          data-testid="color-context-alert"
        >
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              colorAlertSeverity === "danger" ? "text-destructive" : "text-warning"
            }`}
          />
          <div className="text-sm">
            <div className="font-bold text-foreground">
              Heads up — {COLOR_META[log.color].short}
            </div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {flaggedMeta?.unexplainedAlert ??
                `The color ${COLOR_META[log.color].short} can sometimes indicate a health issue. If this persists for more than 2 days, consider speaking to a doctor. This is not a diagnosis.`}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-card border border-border">
        <h2 className="text-base font-bold">Personalized tip</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {bristolMsg}
        </p>
      </div>

      <ReservoirGainBanner />

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button variant="hero" size="xl" className="w-full" onClick={share}>
          Share my score 📤
        </Button>
        <Button variant="soft" size="xl" className="w-full" onClick={() => navigate("/")}>
          Back to home
        </Button>
      </div>
    </div>
  );
};

export default Result;
