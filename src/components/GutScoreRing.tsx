import { useEffect, useState } from "react";

interface GutScoreRingProps {
  score: number;
  size?: number;
}

export const GutScoreRing = ({ score, size = 220 }: GutScoreRingProps) => {
  const [animated, setAnimated] = useState(0);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const label =
    score >= 70 ? "Happy gut 🟢" : score >= 40 ? "Doing okay 🟡" : score > 0 ? "Needs care 🔴" : "No data yet";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 220 220" className="-rotate-90">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
          </linearGradient>
        </defs>
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="18"
        />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Gut score
        </span>
        <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-7xl font-bold leading-none text-transparent">
          {Math.round(animated)}
        </span>
        <span className="mt-1 text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};
