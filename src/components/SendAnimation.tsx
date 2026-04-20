import { useEffect, useState } from "react";
import type { DeliveryStyle } from "@/lib/splats";

interface Props {
  units: number;
  recipient: string;
  style: DeliveryStyle;
  onComplete: () => void;
}

const STYLE_DURATION: Record<DeliveryStyle, number> = {
  stealth: 3000,
  cannon: 2400,
  gentle: 3400,
  monsoon: 3200,
};

const STYLE_PROJECTILE_COUNT: Record<DeliveryStyle, number> = {
  stealth: 1,
  cannon: 1,
  gentle: 1,
  monsoon: 8,
};

const STYLE_LABEL: Record<DeliveryStyle, string> = {
  stealth: "🤫",
  cannon: "💥",
  gentle: "🎁",
  monsoon: "🌧️",
};

/**
 * Full-screen 3-second launch sequence:
 *   1) reservoir drains (gurgle scale-down)
 *   2) 💩 emoji travels in a parabolic arc across the screen
 *   3) lands with a SPLAT + screen shake
 */
export const SendAnimation = ({ units, recipient, style, onComplete }: Props) => {
  const [phase, setPhase] = useState<"drain" | "fly" | "splat" | "done">("drain");
  const duration = STYLE_DURATION[style];
  const flyDuration = Math.round(duration * 0.55);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fly"), 600);
    const t2 = setTimeout(() => setPhase("splat"), 600 + flyDuration);
    const t3 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, duration + 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duration, flyDuration, onComplete]);

  const projectiles = Array.from({ length: STYLE_PROJECTILE_COUNT[style] });

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black ${
        phase === "splat" ? "animate-screen-shake" : ""
      }`}
      role="dialog"
      aria-label="Launching"
    >
      {/* Drain stage: a shrinking reservoir circle with gurgle scale-pulse */}
      {phase === "drain" && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 animate-gurgle rounded-full bg-gradient-to-br from-amber-700 to-amber-950 shadow-[0_0_60px_hsl(28_88%_52%/0.6)]" />
            <div className="absolute inset-0 flex items-center justify-center text-5xl">
              💩
            </div>
          </div>
          <div className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Draining {units} units…
          </div>
        </div>
      )}

      {/* Fly stage: parabolic arc */}
      {phase === "fly" &&
        projectiles.map((_, i) => (
          <span
            key={i}
            className="pointer-events-none absolute text-6xl"
            style={{
              left: 0,
              top: "50%",
              animation: `splat-arc ${flyDuration}ms cubic-bezier(0.4, 0, 0.6, 1) forwards`,
              animationDelay: `${i * 80}ms`,
            }}
          >
            💩
          </span>
        ))}

      {/* Splat stage */}
      {phase === "splat" && (
        <div className="flex flex-col items-center gap-2 animate-splat-pop">
          <div className="text-[20vw] font-black leading-none text-amber-500 drop-shadow-[0_0_30px_hsl(28_88%_52%/0.8)]">
            SPLAT
          </div>
          <div className="text-3xl">{STYLE_LABEL[style]}</div>
          <div className="text-base font-semibold text-white/80">
            {units} units → {recipient}
          </div>
        </div>
      )}
    </div>
  );
};
