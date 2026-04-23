import { useMemo } from "react";

interface Props {
  /**
   * Unique identifier that, when changed, causes the confetti to replay.
   * Pass something like `completion?.date ?? ""`.
   */
  trigger: string | number | null;
}

/**
 * 1.5s burst of 💩 emojis raining across the top of the screen.
 * Uses the `emoji-rain` keyframe added for the /splat page.
 *
 * Renders nothing when `trigger` is falsy, so parents can simply wire
 * the component and flip the trigger on challenge completion.
 */
export const ChallengeConfetti = ({ trigger }: Props) => {
  const drops = useMemo(
    () =>
      trigger
        ? Array.from({ length: 15 }, (_, i) => ({
            key: `${trigger}-${i}`,
            left: Math.random() * 100,
            delay: Math.random() * 0.4,
            size: 22 + Math.floor(Math.random() * 16),
          }))
        : [],
    [trigger]
  );

  if (!trigger || !drops.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-screen overflow-hidden"
      aria-hidden="true"
      data-testid="challenge-confetti"
    >
      {drops.map((d) => (
        <span
          key={d.key}
          className="absolute leading-none"
          style={{
            left: `${d.left}%`,
            top: "-8vh",
            fontSize: `${d.size}px`,
            animation: `emoji-rain 1.5s ${d.delay}s ease-in forwards`,
          }}
        >
          💩
        </span>
      ))}
    </div>
  );
};
