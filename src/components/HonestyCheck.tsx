import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onDeny: () => void;
}

const HEADLINES = [
  "Real talk — did you actually go?",
  "Be honest. Your gut score depends on it 👀",
  "No judgment... but did that actually happen? 🖽",
  "Your future self wants accurate data. Did you go?"
];

export const HonestyCheck = ({ open, onConfirm, onDeny }: Props) => {
  const [confetti, setConfetti] = useState<number[]>([]);
  const [headline, setHeadline] = useState(HEADLINES[0]);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (open) {
      const idx = Math.floor(Math.random() * HEADLINES.length);
      setHeadline(HEADLINES[idx]);
    } else {
      confirmedRef.current = false;
      setConfetti([]);
    }
  }, [open]);

  if (!open) return null;

  const handleYes = () => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(18);
      }
    } catch {}
    setConfetti(Array.from({ length: 14 }, (_, i) => i));
    window.setTimeout(onConfirm, 650);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-[#0A0A0A] px-6 animate-in fade-in duration-300">
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
        <div className="text-7xl animate-bounce">🖽</div>
        <h2 className="mt-8 text-[24px] font-black tracking-tight text-white leading-tight max-w-sm">
          {headline}
        </h2>
        <p className="mt-3 max-w-xs text-sm font-medium text-muted-foreground/80 italic">
          Honest logs make your insights worth something.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full h-16 text-lg font-black" 
          onClick={handleYes}
        >
          Yes, that was real 💯
        </Button>
        <button
          onClick={onDeny}
          className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition-all active:scale-95"
        >
          Actually... no 😅
        </button>
      </div>
    </div>
  );
};
