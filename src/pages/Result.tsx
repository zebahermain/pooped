import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReservoirGainBanner } from "@/components/ReservoirGainBanner";
import { ToiletBowl } from "@/components/ToiletBowl";
import { getLogs } from "@/lib/storage";
import { getPrevUnitsForBanner, getReservoirState } from "@/lib/reservoir";

/**
 * Shown after Home's "I pooped today" tap: the units earned, the toilet-bowl
 * reservoir filling from its old level to the new one, and the +units banner.
 */
const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const log = useMemo(() => getLogs().find((l) => l.id === id), [id]);

  const [state] = useState(getReservoirState());
  const [prev] = useState(getPrevUnitsForBanner());
  const from = prev ?? state.units;
  const gain = state.units - from;
  const [ratio, setRatio] = useState(state.max > 0 ? from / state.max : 0);

  useEffect(() => {
    if (state.max <= 0) return;
    const start = performance.now();
    const dur = 1400;
    const fromRatio = from / state.max;
    const toRatio = state.units / state.max;
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start - 300) / dur);
      if (p > 0) {
        const eased = 1 - Math.pow(1 - p, 3);
        setRatio(fromRatio + (toRatio - fromRatio) * eased);
      }
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, state.units, state.max]);

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10 animate-fade-in">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Logged for today</p>
        <h1 className="mt-2 text-3xl font-black">You earned poop 💩</h1>
        {gain > 0 ? (
          <>
            <p className="mt-3 text-5xl font-black text-primary">+{gain}</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">units in your reservoir</p>
          </>
        ) : (
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Your reservoir is full. Launch some at your friends.
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <ToiletBowl fillRatio={ratio} size={220} />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-muted-foreground">
        {state.units} / {state.max} units
      </p>

      <ReservoirGainBanner />

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button variant="hero" size="xl" className="w-full" onClick={() => navigate("/reservoir")}>
          See my reservoir
        </Button>
        <Button variant="soft" size="xl" className="w-full" onClick={() => navigate("/")}>
          Back to home
        </Button>
      </div>
    </div>
  );
};

export default Result;
