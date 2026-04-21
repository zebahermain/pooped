import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { ToiletBowl } from "@/components/ToiletBowl";
import { SendSheet } from "@/components/SendSheet";
import {
  LAUNCH_THRESHOLD,
  acknowledgeLaunchDot,
  getGrade,
  getReservoirState,
  hasSeenLaunchTip,
  markLaunchTipSeen,
} from "@/lib/reservoir";
import { getProfile } from "@/lib/storage";

const Reservoir = () => {
  const navigate = useNavigate();
  const [state, setState] = useState(getReservoirState());
  const [sendOpen, setSendOpen] = useState(false);
  const [showFirstTip, setShowFirstTip] = useState(false);

  useEffect(() => {
    if (!getProfile()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    document.title = "Your Reservoir 💩 — Pooped";
    setState(getReservoirState());
    acknowledgeLaunchDot().catch(() => {});

    if (!hasSeenLaunchTip()) {
      setShowFirstTip(true);
      // Auto-dismiss after 6s — and never show again.
      const t = window.setTimeout(() => {
        setShowFirstTip(false);
        markLaunchTipSeen();
      }, 6000);
      return () => window.clearTimeout(t);
    }
  }, [navigate]);

  const refresh = () => setState(getReservoirState());
  const ratio = state.max > 0 ? state.units / state.max : 0;
  const grade = getGrade(state.units);
  const canLaunch = state.units >= LAUNCH_THRESHOLD;

  const dismissTip = () => {
    setShowFirstTip(false);
    markLaunchTipSeen();
  };

  return (
    <AppShell>
      <header className="mb-2 pr-14">
        <p className="text-sm text-muted-foreground">Your Reservoir</p>
        <h1 className="text-2xl font-bold">Fill it. Launch it. 💩</h1>
      </header>

      <section className="mt-4 flex flex-col items-center">
        <ToiletBowl fillRatio={ratio} size={240} />

        <div className="mt-4 text-center">
          <div className="text-4xl font-extrabold" data-testid="reservoir-units">
            <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              You have {state.units}
            </span>
            <span className="ml-2 text-2xl text-muted-foreground">
              / {state.max} units
            </span>
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
            {grade}
          </div>
        </div>

        <div className="relative mt-6 w-full">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full gradient-warm transition-all duration-700"
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>

          {showFirstTip && (
            <div
              onClick={dismissTip}
              className="absolute -top-12 left-1/2 -translate-x-1/2 cursor-pointer whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-warm animate-fade-in"
              role="tooltip"
              data-testid="first-launch-tip"
            >
              Fill to {LAUNCH_THRESHOLD} to launch 🚀
              <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-primary" />
            </div>
          )}
        </div>
      </section>

      <div className="mt-8">
        <Button
          variant={canLaunch ? "hero" : "soft"}
          size="xl"
          className={`w-full gap-2 ${!canLaunch ? "opacity-60" : ""}`}
          onClick={() => canLaunch && setSendOpen(true)}
          disabled={!canLaunch}
          data-testid="launch-button"
        >
          <Rocket className="h-5 w-5" />
          {canLaunch ? "Launch 💩" : "Keep logging to unlock"}
        </Button>

        {canLaunch && (
          <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">
            Your friends won't know what hit them 😈
          </p>
        )}
      </div>

      <SendSheet
        open={sendOpen}
        onOpenChange={setSendOpen}
        reservoirUnits={state.units}
        onSent={refresh}
      />
    </AppShell>
  );
};

export default Reservoir;
