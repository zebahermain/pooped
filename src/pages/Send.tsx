import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/AppShell";
import { SendAnimation } from "@/components/SendAnimation";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getReservoirState } from "@/lib/reservoir";
import {
  DELIVERY_STYLES,
  buildShareText,
  buildSplatUrl,
  buildWhatsAppLink,
  createSplat,
  drainReservoir,
  type DeliveryStyle,
  type Splat,
} from "@/lib/splats";
import { getProfile } from "@/lib/storage";

type Phase = "compose" | "launching" | "summary";

const Send = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("compose");
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState("");
  const [percent, setPercent] = useState(50);
  const [style, setStyle] = useState<DeliveryStyle | null>(null);
  const [reservoirUnits, setReservoirUnits] = useState(0);
  const [resultSplat, setResultSplat] = useState<Splat | null>(null);

  useEffect(() => {
    if (!getProfile()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    document.title = "Launch 💩 — Pooped";
    setReservoirUnits(getReservoirState().units);
  }, [navigate]);

  // Require sign-in to actually send (RLS requires auth.uid()).
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Sign in to launch",
        description: "Create an account to send your reservoir to friends.",
      });
      navigate("/auth?redirect=/send");
    }
  }, [loading, user, navigate]);

  const unitsToSend = useMemo(
    () => Math.max(1, Math.round((reservoirUnits * percent) / 100)),
    [reservoirUnits, percent]
  );

  const onLaunch = async () => {
    if (!recipient.trim() || !style || unitsToSend < 1) return;
    setPhase("launching");
    try {
      const splat = await createSplat({
        recipient_name: recipient.trim(),
        units: unitsToSend,
        style,
      });
      await drainReservoir(unitsToSend);
      setResultSplat(splat);
    } catch (e: any) {
      toast({
        title: "Launch failed",
        description: e?.message ?? "Could not send your splat.",
        variant: "destructive",
      });
      setPhase("compose");
    }
  };

  const onAnimationComplete = () => {
    setPhase("summary");
  };

  const splatUrl = resultSplat ? buildSplatUrl(resultSplat.id) : "";
  const shareText = resultSplat
    ? buildShareText(resultSplat.units, resultSplat.recipient_name, splatUrl)
    : "";

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied!", description: "Share text on your clipboard." });
    } catch {
      toast({ title: "Copy failed", description: shareText });
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Pooped 💩", text: shareText });
        return;
      } catch {
        // fall through to copy
      }
    }
    copyShare();
  };

  // ================= LAUNCHING STAGE =================
  if (phase === "launching" && style) {
    return (
      <SendAnimation
        units={unitsToSend}
        recipient={recipient}
        style={style}
        onComplete={onAnimationComplete}
      />
    );
  }

  // ================= SUMMARY STAGE =================
  if (phase === "summary" && resultSplat) {
    const styleMeta = DELIVERY_STYLES.find((s) => s.id === resultSplat.style)!;
    return (
      <AppShell>
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center animate-fade-in">
          <div className="text-7xl">{styleMeta.emoji}</div>
          <h1 className="mt-4 text-3xl font-extrabold">
            <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              {resultSplat.units} units
            </span>{" "}
            launched
          </h1>
          <p className="mt-2 text-muted-foreground">
            via {styleMeta.label} at <span className="font-semibold text-foreground">{resultSplat.recipient_name}</span>
          </p>

          <div className="mt-8 w-full rounded-3xl border border-border bg-card p-5 shadow-card text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Share it
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {shareText}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={buildWhatsAppLink(shareText)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(142,70%,42%)] px-4 py-3 text-sm font-bold text-white transition-bounce hover:scale-[1.01]"
              >
                <MessageCircle className="h-4 w-4" /> Send via WhatsApp
              </a>
              <Button variant="soft" size="lg" onClick={nativeShare} className="gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="ghost" size="lg" onClick={copyShare} className="gap-2">
                <Copy className="h-4 w-4" /> Copy link
              </Button>
            </div>
          </div>

          <Button
            variant="hero"
            size="xl"
            className="mt-6 w-full"
            onClick={() => navigate("/reservoir")}
          >
            Back to reservoir
          </Button>
        </div>
      </AppShell>
    );
  }

  // ================= COMPOSE STAGE =================
  const canStep1 = recipient.trim().length > 0;
  const canStep2 = unitsToSend >= 1 && reservoirUnits > 0;
  const canLaunch = canStep1 && canStep2 && !!style;

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-3 pr-12">
        <button
          onClick={() => (step === 1 ? navigate("/reservoir") : setStep(step - 1))}
          className="rounded-full bg-card p-2 shadow-card border border-border"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex h-2 gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-full flex-1 rounded-full transition-all ${
                  s <= step ? "gradient-warm" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Step {step} of 3 — Launch 💩</p>
        </div>
      </header>

      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">Who's getting splatted? 🎯</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Their name will show on the landing page.
          </p>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Friend's name"
            maxLength={40}
            className="mt-5 h-14 rounded-2xl border-border bg-card text-base"
            autoFocus
          />
          <p className="mt-3 text-xs text-muted-foreground">
            💡 You'll get a shareable WhatsApp link after launch.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">How much are you sending?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag to choose your payload size.
          </p>

          <div className="mt-8 rounded-3xl bg-card p-6 shadow-card border border-border">
            <div className="text-center">
              <div className="text-5xl font-extrabold">
                <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
                  {unitsToSend}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                units ({percent}% of {reservoirUnits})
              </div>
            </div>

            <div className="mt-6">
              <Slider
                value={[percent]}
                min={10}
                max={100}
                step={5}
                onValueChange={(v) => setPercent(v[0])}
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {percent === 100 && (
            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <span className="font-bold">This will empty your entire reservoir.</span>{" "}
              You sure? 👀
            </div>
          )}

          {reservoirUnits === 0 && (
            <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
              Your reservoir is empty — keep logging to fill it up.
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold">Pick your delivery style</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How should it land on {recipient || "them"}?
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {DELIVERY_STYLES.map((s) => {
              const selected = style === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 bg-card p-4 text-left transition-bounce ${
                    selected
                      ? "border-primary shadow-warm scale-[1.02]"
                      : "border-transparent shadow-card"
                  }`}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-sm font-bold">{s.label}</span>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    {s.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8">
        {step < 3 ? (
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}
            onClick={() => setStep(step + 1)}
          >
            Continue →
          </Button>
        ) : (
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={!canLaunch}
            onClick={onLaunch}
          >
            Launch 💩 ({unitsToSend} units)
          </Button>
        )}
      </div>
    </AppShell>
  );
};

export default Send;
