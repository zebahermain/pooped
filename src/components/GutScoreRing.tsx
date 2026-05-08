import { useEffect, useState } from "react";

interface GutScoreRingProps {
  score: number;
  size?: number;
}

export const GutScoreRing = ({ score, size = 208 }: GutScoreRingProps) => {
  const [animated, setAnimated] = useState(0);
  const r = 78;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const dash = c * (animated / 100);
  
  const label =
    score >= 70 ? "Happy gut 🟢" : score >= 40 ? "Doing okay 🟡" : score > 0 ? "Needs care 🔴" : "No data yet";

  return (
    <div className="flex justify-center w-full">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="14"
          />
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{
              filter: "drop-shadow(0 0 12px oklch(0.74 0.18 55 / 0.6))",
              transition: "stroke-dasharray 1200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.2 45)" />
              <stop offset="100%" stopColor="oklch(0.82 0.16 70)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
            Gut Score
          </span>
          <span
            className="text-6xl font-black tabular-nums leading-none mt-1"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {Math.round(animated)}
          </span>
          <span className="text-xs text-muted-foreground mt-1.5 font-bold">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
