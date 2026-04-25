import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Rocket, Plus } from "lucide-react";
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
  const location = useLocation();
  const [state, setState] = useState(getReservoirState());
  const [sendOpen, setSendOpen] = useState(false);
  const [showFirstTip, setShowFirstTip] = useState(false);
  
  const bonusToAnimate = location.state?.animateBonus || 0;
  const [displayUnits, setDisplayUnits] = useState(
    bonusToAnimate ? Math.max(0, state.units - bonusToAnimate) : state.units
  );

  useEffect(() => {
    if (!getProfile()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    document.title = "Your Reservoir 💩 — Pooped";
    acknowledgeLaunchDot().catch(() => {});

    if (!hasSeenLaunchTip()) {
      setShowFirstTip(true);
      const t = window.setTimeout(() => {
        setShowFirstTip(false);
        markLaunchTipSeen();
      }, 6000);
      return () => window.clearTimeout(t);
    }
  }, [navigate]);

  useEffect(() => {
    if (bonusToAnimate > 0 && displayUnits < state.units) {
      const timer = setTimeout(() => {
        setDisplayUnits(state.units);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bonusToAnimate, state.units, displayUnits]);

  const refresh = () => {
    const newState = getReservoirState();
    setState(newState);
    setDisplayUnits(newState.units);
  };

  const ratio = state.max > 0 ? displayUnits / state.max : 0;
  const grade = getGrade(state.units);
  const canLaunch = state.units >= LAUNCH_THRESHOLD;

  const dismissTip = () => {
    setShowFirstTip(false);
    markLaunchTipSeen();
  };

  return (
    <AppShell>
      <header className="mb-2 pr-14">
        <p className="text-sm text-muted-foreground font-medium">Your Reservoir</p>
        <h1 className="text-2xl font-black text-foreground">Fill it. Launch it. 💩</h1>
      </header>

      <section className="mt-4 flex flex-col items-center">
        <ToiletBowl fillRatio={ratio} size={240} />

        <div className="mt-4 text-center">
          <div className="text-4xl font-extrabold" data-testid="reservoir-units">
            <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              You have {displayUnits}
            </span>
            <span className="ml-2 text-2xl text-muted-foreground">
              / {state.max} units
            </span>
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
            {grade}
          </div>
        </div>

        <div className="relative mt-6 w-full px-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out"
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

      <div className="mt-12 space-y-4">
        {canLaunch ? (
          <Button
            variant="hero"
            size="xl"
            className="w-full gap-2 h-16 text-lg font-black"
            onClick={() => setSendOpen(true)}
            data-testid="launch-button"
          >
            <Rocket className="h-6 w-6" />
            Launch 💩
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xl"
            className="w-full gap-3 h-16 text-lg font-bold border-white/20 text-white hover:bg-white/5 active:scale-95 transition-all"
            onClick={() => navigate("/log")}
          >
            <Plus className="h-5 w-5 text-primary" />
            Keep logging to unlock
          </Button>
        )}

        {canLaunch && (
          <p className="mt-3 text-center text-sm font-bold text-muted-foreground animate-in fade-in slide-in-from-top-2">
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
