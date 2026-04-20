import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { ToiletBowl } from "@/components/ToiletBowl";
import { toast } from "@/hooks/use-toast";
import {
  LAUNCH_THRESHOLD,
  acknowledgeLaunchDot,
  getGrade,
  getReservoirState,
} from "@/lib/reservoir";
import { getProfile } from "@/lib/storage";

const Reservoir = () => {
  const navigate = useNavigate();
  const [state, setState] = useState(getReservoirState());

  useEffect(() => {
    if (!getProfile()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    document.title = "Your Reservoir 💩 — Pooped";
    setState(getReservoirState());
    // Clear notification dot when user visits the tab.
    acknowledgeLaunchDot().catch(() => {});
  }, [navigate]);

  const ratio = state.max > 0 ? state.units / state.max : 0;
  const grade = getGrade(state.units);
  const canLaunch = state.units >= LAUNCH_THRESHOLD;
  const untilLaunch = Math.max(0, LAUNCH_THRESHOLD - state.units);

  const handleLaunch = () => {
    toast({
      title: "Launch flow coming soon 🚀",
      description: "Recipient + percentage + delivery style — next update.",
    });
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
          <div className="text-sm text-muted-foreground">You have</div>
          <div className="mt-1 text-4xl font-extrabold">
            <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              {state.units}
            </span>
            <span className="ml-2 text-2xl text-muted-foreground">
              / {state.max}
            </span>
          </div>
          <div className="mt-1 text-base font-semibold">
            units of <span className="text-primary">{grade}</span> 💩
          </div>
        </div>

        <div className="mt-5 w-full">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full gradient-warm transition-all duration-700"
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>0</span>
            <span>Launch ready at {LAUNCH_THRESHOLD}</span>
            <span>{state.max}</span>
          </div>
        </div>
      </section>

      <div className="mt-8">
        {canLaunch ? (
          <Button
            variant="hero"
            size="xl"
            className="w-full gap-2"
            onClick={handleLaunch}
          >
            <Rocket className="h-5 w-5" />
            Launch 💩
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <Button
                    variant="hero"
                    size="xl"
                    className="pointer-events-none w-full gap-2 opacity-50"
                    disabled
                  >
                    <Rocket className="h-5 w-5" />
                    Launch 💩
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Keep logging to fill up</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!canLaunch && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {untilLaunch} more units until you can launch
          </p>
        )}
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">How it fills up</h3>
        </div>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Type 4 (textbook): +30 units</li>
          <li>• Type 3 / 5: +20 units</li>
          <li>• Type 2 / 6: +10 units</li>
          <li>• Type 1 / 7: +5 units</li>
          <li>• Healthy brown: +10 bonus units</li>
          <li>• 7-day streak: ×1.5 multiplier 🔥</li>
          <li>• Capacity grows +100 every 30 days of logging</li>
        </ul>
      </section>
    </AppShell>
  );
};

export default Reservoir;
