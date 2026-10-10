import { getLogs, type PoopLog } from "@/lib/storage";

/**
 * Shared palette + bucketing used by the 30-day streak strip and the
 * full-month calendar on Profile.
 */

export type DayColor = "green" | "grey" | "today" | "future";

export const DAY_COLOR_HEX: Record<DayColor, string> = {
  green: "#15803D",
  grey: "#374151",
  today: "transparent", // rendered as pulsing outline
  future: "transparent",
};

export interface DayCell {
  date: string; // YYYY-MM-DD
  color: DayColor;
  logged: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const toDateStr = (d: Date) => {
  // Use LOCAL date components — calling .toISOString() on a Date built from
  // (year, month, day) shifts to UTC, which rolls back a day for any
  // timezone east of UTC (e.g. IST). That mismatched the cell key against
  // logs (which are keyed off `new Date(now).toISOString()`), so logged
  // days appeared as "No log" in the Profile calendar.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const computeDayCell = (
  date: Date,
  logs: PoopLog[] = getLogs()
): DayCell => {
  const ds = toDateStr(date);
  const today = toDateStr(new Date());
  const isToday = ds === today;
  const isFuture = ds > today;

  const logged = logs.some(
    (l) => !l.noMovement && toDateStr(new Date(l.timestamp)) === ds
  );

  let color: DayColor = "grey";
  if (isFuture) color = "future";
  else if (logged) color = "green";
  else if (isToday) color = "today";

  return { date: ds, color, logged, isToday, isFuture };
};

/** Build the last N days ending today (oldest first). */
export const buildLastNDays = (n: number): DayCell[] => {
  const logs = getLogs();
  const out: DayCell[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push(computeDayCell(d, logs));
  }
  return out;
};
