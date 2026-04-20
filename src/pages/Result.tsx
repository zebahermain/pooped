import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GutScoreRing } from "@/components/GutScoreRing";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReservoirGainBanner } from "@/components/ReservoirGainBanner";
import { toast } from "@/hooks/use-toast";
import { getLogs, isAlertColor, COLOR_META } from "@/lib/storage";

const Result = () => {
  const { score: idParam } = useParams();
  const navigate = useNavigate();

  const log = useMemo(() => getLogs().find((l) => l.id === idParam), [idParam]);
  const score = log?.gutScore ?? 0;
  const [animated, setAnimated] = useState(0);

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

  const label =
    score >= 80
      ? "Excellent gut day! 🟢"
      : score >= 60
      ? "Pretty good 🟡"
      : score >= 40
      ? "Room to improve 🟠"
      : "Rough day 🔴";

  const bristolMsg =
    log.bristolType <= 2
      ? "Looks like things are moving slowly — try more water and fiber today."
      : log.bristolType >= 6
      ? "A bit loose today — consider tracking what you ate yesterday."
      : log.bristolType === 3 || log.bristolType === 4
      ? "Textbook poop. Whatever you're doing — keep doing it."
      : "Solid effort. A bit more fiber may help shape things up.";

  const showAlert = isAlertColor(log.color);

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

      {showAlert && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="text-sm">
            <div className="font-bold text-foreground">Heads up</div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              The color <strong>{COLOR_META[log.color].short}</strong> can sometimes
              indicate a health issue. If this persists for more than 2 days,
              consider speaking to a doctor. This is not a diagnosis.
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
