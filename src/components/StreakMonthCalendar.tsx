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
                  ? `${cell.date} · Gut Score ${cell.avgScore}`
                  : `${cell.date} · No log`
              }
            >
              {c.date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <Legend color={DAY_COLOR_HEX.green} label="≥ 70" />
        <Legend color={DAY_COLOR_HEX.amber} label="40–69" />
        <Legend color={DAY_COLOR_HEX.red} label="< 40" />
        <Legend color={DAY_COLOR_HEX.grey} label="No log" />
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
