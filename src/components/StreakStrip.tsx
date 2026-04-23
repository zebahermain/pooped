import { useMemo, useState } from "react";
import { buildLastNDays, DAY_COLOR_HEX, type DayCell } from "@/lib/streakCalendar";
import { getStreakData } from "@/lib/storage";

interface Props {
  /** Bump to force re-read after a new log is saved. */
  refreshToken?: number;
}

const DAY_COUNT = 30;

/**
 * Horizontal 30-day streak strip. Today is on the right, oldest on the left.
 * Tapping any square shows a small tooltip with the date + avg score.
 */
export const StreakStrip = ({ refreshToken = 0 }: Props) => {
  const cells = useMemo(
    () => buildLastNDays(DAY_COUNT),
    // we depend on refreshToken to trigger re-computation even though
    // buildLastNDays itself reads fresh data on every call
    [refreshToken]
  );
  const streak = useMemo(() => getStreakData().currentStreak, [refreshToken]);
  const loggedDays = cells.filter((c) => c.avgScore !== null).length;
  const [tip, setTip] = useState<{ cell: DayCell; index: number } | null>(null);

  return (
    <div className="mt-6 w-full" data-testid="streak-strip">
      <div className="flex items-baseline justify-between">
        {streak > 0 ? (
          <p className="text-lg font-bold text-primary">🔥 {streak} day streak</p>
        ) : (
          <p className="text-lg font-bold text-primary">Start your streak today 💪</p>
        )}
      </div>

      <div className="relative mt-3 overflow-x-auto pb-2">
        <div className="flex gap-[3px]">
          {cells.map((c, i) => {
            const isToday = c.isToday;
            const isFuture = c.isFuture;
            const bg = DAY_COLOR_HEX[c.color];
            return (
              <button
                key={c.date}
                onClick={() => setTip({ cell: c, index: i })}
                className={`relative h-7 w-7 shrink-0 rounded border transition-transform hover:scale-110 ${
                  isToday && !c.avgScore ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: isFuture ? "transparent" : bg,
                  borderColor: isToday
                    ? "hsl(var(--primary))"
                    : isFuture
                    ? "hsl(var(--border))"
                    : bg,
                  borderWidth: isToday ? 2 : 1,
                }}
                aria-label={`${c.date}${c.avgScore !== null ? ` — Gut Score ${c.avgScore}` : " — No log"}`}
                data-testid={`streak-cell-${c.date}`}
              />
            );
          })}
        </div>

        {tip && (
          <div
            className="absolute top-[-6px] z-10 -translate-y-full rounded-md bg-foreground px-2 py-1 text-[11px] font-semibold text-background shadow-warm"
            style={{
              left: `min(calc(${tip.index * 30}px + 14px), calc(100% - 120px))`,
            }}
          >
            {tip.cell.date}{" "}
            {tip.cell.avgScore !== null ? `· ${tip.cell.avgScore}` : "· No log"}
          </div>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {loggedDays} of last {DAY_COUNT} days logged
      </p>
    </div>
  );
};
