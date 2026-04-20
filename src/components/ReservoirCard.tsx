import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { LAUNCH_THRESHOLD, getReservoirState } from "@/lib/reservoir";

export const ReservoirCard = () => {
  const navigate = useNavigate();
  const state = getReservoirState();
  const ratio = state.max > 0 ? Math.min(1, state.units / state.max) : 0;
  const canLaunch = state.units >= LAUNCH_THRESHOLD;
  const untilLaunch = Math.max(0, LAUNCH_THRESHOLD - state.units);

  return (
    <button
      onClick={() => navigate("/reservoir")}
      className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-bounce hover:scale-[1.01]"
    >
      <div className="text-3xl" aria-hidden>🚽</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Your reservoir</span>
          <span className="text-xs font-semibold text-muted-foreground">
            {state.units}/{state.max}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-warm transition-all duration-700"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          {canLaunch
            ? "Ready to launch 💩"
            : `${untilLaunch} units until you can launch 💩`}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};
