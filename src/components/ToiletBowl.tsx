interface Props {
  /** 0 to 1 fill ratio */
  fillRatio: number;
  size?: number;
}

/**
 * Stylised toilet-bowl SVG with a wobbling fill. Pure CSS animation —
 * the brown "liquid" inside translates ±4px on a 2s loop.
 */
export const ToiletBowl = ({ fillRatio, size = 220 }: Props) => {
  const ratio = Math.min(1, Math.max(0, fillRatio));
  // Bowl interior runs roughly y=70 (top) to y=170 (bottom) in our viewBox.
  const bowlTop = 70;
  const bowlBottom = 170;
  const fillTop = bowlBottom - (bowlBottom - bowlTop) * ratio;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-label={`Reservoir ${Math.round(ratio * 100)}% full`}
      role="img"
    >
      <svg
        viewBox="0 0 220 220"
        width={size}
        height={size}
        className="drop-shadow-[0_10px_30px_hsl(28_60%_30%/0.25)]"
      >
        <defs>
          <clipPath id="bowl-clip">
            {/* Bowl interior shape */}
            <path d="M50 70 Q50 175 110 180 Q170 175 170 70 Z" />
          </clipPath>
          <linearGradient id="poop-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(25 55% 38%)" />
            <stop offset="100%" stopColor="hsl(25 65% 22%)" />
          </linearGradient>
          <linearGradient id="bowl-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" />
            <stop offset="100%" stopColor="hsl(30 20% 92%)" />
          </linearGradient>
        </defs>

        {/* Tank */}
        <rect x="65" y="10" width="90" height="50" rx="10" fill="url(#bowl-grad)" stroke="hsl(30 25% 80%)" strokeWidth="2" />
        <rect x="125" y="22" width="22" height="6" rx="3" fill="hsl(30 25% 80%)" />

        {/* Connector */}
        <rect x="95" y="58" width="30" height="14" fill="url(#bowl-grad)" stroke="hsl(30 25% 80%)" strokeWidth="2" />

        {/* Bowl outer */}
        <path
          d="M40 70 Q40 185 110 192 Q180 185 180 70 Z"
          fill="url(#bowl-grad)"
          stroke="hsl(30 25% 78%)"
          strokeWidth="2.5"
        />

        {/* Seat rim */}
        <ellipse cx="110" cy="70" rx="70" ry="12" fill="hsl(30 25% 88%)" stroke="hsl(30 25% 75%)" strokeWidth="2" />
        <ellipse cx="110" cy="70" rx="58" ry="8" fill="hsl(30 30% 96%)" />

        {/* Fill (clipped to bowl interior) */}
        <g clipPath="url(#bowl-clip)">
          <g className="reservoir-wobble">
            <rect
              x="40"
              y={fillTop}
              width="140"
              height={bowlBottom - fillTop + 30}
              fill="url(#poop-fill)"
            />
            {/* Surface highlight */}
            <ellipse
              cx="110"
              cy={fillTop}
              rx="55"
              ry="6"
              fill="hsl(28 70% 50%)"
              opacity="0.55"
            />
            <ellipse
              cx="110"
              cy={fillTop - 1}
              rx="40"
              ry="3"
              fill="hsl(35 80% 65%)"
              opacity="0.6"
            />
          </g>
        </g>

        {/* Bowl gloss */}
        <path
          d="M55 80 Q60 130 95 175"
          stroke="hsl(0 0% 100% / 0.5)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
