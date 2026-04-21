import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onDeny: () => void;
}

/**
 * Full-screen "confirmation moment" shown before the Gut Score calculation.
 * Nudges users to log honestly without being preachy.
 */
export const HonestyCheck = ({ open, onConfirm, onDeny }: Props) => {
  const [confetti, setConfetti] = useState<number[]>([]);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      confirmedRef.current = false;
      setConfetti([]);
    }
  }, [open]);

  if (!open) return null;

  const handleYes = () => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    // Haptic feedback (mobile only, best effort)
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(18);
      }
    } catch {
      // ignore
    }
    // Confetti burst
    setConfetti(Array.from({ length: 14 }, (_, i) => i));
    window.setTimeout(onConfirm, 650);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background px-6 animate-fade-in">
      {/* Confetti layer */}
      {confetti.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((i) => {
            const left = 40 + Math.random() * 20;
            const dx = (Math.random() - 0.5) * 320;
            const dy = -180 - Math.random() * 160;
            const rot = (Math.random() - 0.5) * 720;
            const delay = Math.random() * 80;
            return (
              <span
                key={i}
                className="absolute top-1/2 text-2xl"
                style={{
                  left: `${left}%`,
                  animation: `confetti-burst 650ms cubic-bezier(.2,.7,.3,1) ${delay}ms forwards`,
                  ["--dx" as string]: `${dx}px`,
                  ["--dy" as string]: `${dy}px`,
                  ["--rot" as string]: `${rot}deg`,
                }}
              >
                💩
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="text-7xl animate-scale-in">🚽</div>
        <h2 className="mt-6 text-2xl font-bold">Real talk — did you actually go?</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Honest logs make your insights worth something.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button variant="hero" size="xl" className="w-full" onClick={handleYes}>
          Yes, that was real 💯
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full rounded-2xl"
          onClick={onDeny}
        >
          Actually... no 😅
        </Button>
      </div>
    </div>
  );
};
