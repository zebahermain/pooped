import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { computeDayCell, DAY_COLOR_HEX } from "@/lib/streakCalendar";
import { getLogs } from "@/lib/storage";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Full-month grid calendar for the Profile page. Lets the user navigate
 * back through prior months. Uses the same colour bucketing as the
 * Home streak strip so the language is consistent.
 */
export const StreakMonthCalendar = () => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const logs = useMemo(() => getLogs(), []);

  // Build a Set of date keys (YYYY-MM-DD) that are part of the CURRENT
  // streak — consecutive logged days ending today (or yesterday if today
  // hasn't been logged yet). Used to render the amber connector.
  const streakSet = useMemo(() => {
    const set = new Set<string>();
    const pad = (n: number) => String(n).padStart(2, "0");
    const key = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const logged = new Set(logs.map((l) => key(new Date(l.ts))));
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    if (!logged.has(key(cur))) cur.setDate(cur.getDate() - 1); // grace if today unlogged
    while (logged.has(key(cur))) {
      set.add(key(cur));
      cur.setDate(cur.getDate() - 1);
    }
    return set;
  }, [logs]);

  const month = cursor.getMonth();
  const year = cursor.getFullYear();

  // Pad start of month to the correct day-of-week column (Sunday-first grid).
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = useMemo(() => {
    const out: Array<{ date: Date | null }> = [];
    for (let i = 0; i < firstDow; i++) out.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ date: new Date(year, month, d) });
    }
    return out;
  }, [firstDow, daysInMonth, month, year]);

  const shiftMonth = (delta: number) => {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta);
    setCursor(next);
  };

  const today = new Date();
  const canGoForward =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  return (
    <section
      className="rounded-3xl border border-border bg-card p-5 shadow-card"
      data-testid="streak-month-calendar"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-base font-bold">
          {MONTH_LABELS[month]} {year}
        </h3>
        <button
          onClick={() => shiftMonth(1)}
          disabled={!canGoForward}
          className="rounded-full p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {DOW_LABELS.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {l}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c.date) return <span key={`pad-${i}`} />;
          const cell = computeDayCell(c.date, logs);
          const bg = DAY_COLOR_HEX[cell.color];
          const inStreak = streakSet.has(cell.date);
          // Connect to neighbors only if they're also part of the streak AND
          // share the same calendar week (same row in the 7-col grid).
          const col = i % 7;
          const prevInRow = col > 0 ? cells[i - 1] : null;
          const nextInRow = col < 6 ? cells[i + 1] : null;
          const prevInStreak = !!(
            prevInRow?.date &&
            streakSet.has(
              `${prevInRow.date.getFullYear()}-${String(prevInRow.date.getMonth() + 1).padStart(2, "0")}-${String(prevInRow.date.getDate()).padStart(2, "0")}`
            )
          );
          const nextInStreak = !!(
            nextInRow?.date &&
            streakSet.has(
              `${nextInRow.date.getFullYear()}-${String(nextInRow.date.getMonth() + 1).padStart(2, "0")}-${String(nextInRow.date.getDate()).padStart(2, "0")}`
            )
          );
          return (
            <div
              key={cell.date}
              className={`relative flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold ${
                cell.isToday && cell.color === "today" ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor: cell.isFuture ? "transparent" : bg,
                border: cell.isToday
                  ? "2px solid hsl(var(--primary))"
                  : cell.isFuture
                  ? "1px dashed hsl(var(--border))"
                  : "1px solid " + bg,
                color: cell.isFuture
                  ? "hsl(var(--muted-foreground))"
                  : cell.color === "grey" || cell.color === "today"
                  ? "hsl(var(--muted-foreground))"
                  : "#ffffff",
              }}
              title={
                cell.avgScore !== null
                  ? `${cell.date} · Gut Score ${cell.avgScore}${inStreak ? " · 🔥 Current streak" : ""}`
                  : `${cell.date} · No log`
              }
            >
              {/* Streak connector — amber bar behind consecutive streak days
                  in the same row. Only drawn between cells, never wrapping. */}
              {inStreak && (prevInStreak || nextInStreak) && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 -z-0 h-1 -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: "#F59E0B",
                    left: prevInStreak ? "-50%" : "50%",
                    right: nextInStreak ? "-50%" : "50%",
                  }}
                />
              )}
              <span className="relative z-10">{c.date.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <Legend color={DAY_COLOR_HEX.green} label="≥ 70" />
        <Legend color={DAY_COLOR_HEX.amber} label="40–69" />
        <Legend color={DAY_COLOR_HEX.red} label="< 40" />
        <Legend color={DAY_COLOR_HEX.grey} label="No log" />
        <Legend color="#F59E0B" label="🔥 Current streak" />
      </div>
    </section>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="h-2.5 w-2.5 rounded-sm"
      style={{ backgroundColor: color }}
    />
    {label}
  </span>
);
