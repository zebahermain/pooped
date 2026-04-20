import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  clearPrevUnitsForBanner,
  getPrevUnitsForBanner,
  getReservoirState,
} from "@/lib/reservoir";

export const ReservoirGainBanner = () => {
  const navigate = useNavigate();
  const [state] = useState(getReservoirState());
  const [prev] = useState(getPrevUnitsForBanner());
  const [animatedRatio, setAnimatedRatio] = useState(
    prev != null && state.max > 0 ? prev / state.max : 0
  );

  const gain = prev != null ? state.units - prev : 0;

  useEffect(() => {
    // Clear so a refresh on the same Result screen doesn't re-animate stale data.
    const t = setTimeout(() => {
      setAnimatedRatio(state.max > 0 ? state.units / state.max : 0);
    }, 250);
    return () => clearTimeout(t);
  }, [state.units, state.max]);

  useEffect(() => {
    return () => clearPrevUnitsForBanner();
  }, []);

  if (gain <= 0) return null;

  return (
    <button
      onClick={() => navigate("/reservoir")}
      className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary-glow/5 p-4 text-left transition-bounce animate-fade-in hover:scale-[1.01]"
    >
      <div className="text-2xl" aria-hidden>💩</div>
      <div className="flex-1">
        <div className="text-sm font-bold">
          +{gain} units added to your reservoir
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-warm transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, animatedRatio * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Tap to see your reservoir
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-primary" />
    </button>
  );
};
