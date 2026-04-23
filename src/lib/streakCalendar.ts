import { getLogs, type PoopLog } from "@/lib/storage";

/**
 * Shared palette + bucketing used by the 30-day streak strip and the
 * full-month calendar on Profile.
 */

export type DayColor = "green" | "amber" | "red" | "grey" | "today" | "future";

export const DAY_COLOR_HEX: Record<DayColor, string> = {
  green: "#15803D",
  amber: "#D97706",
  red: "#B91C1C",
  grey: "#374151",
  today: "transparent", // rendered as pulsing outline
  future: "transparent",
};

export interface DayCell {
  date: string; // YYYY-MM-DD
  color: DayColor;
  avgScore: number | null;
  isToday: boolean;
  isFuture: boolean;
}

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

export const computeDayCell = (
  date: Date,
  logs: PoopLog[] = getLogs()
): DayCell => {
  const ds = toDateStr(date);
  const today = toDateStr(new Date());
  const isToday = ds === today;
  const isFuture = ds > today;

  const dayLogs = logs.filter((l) => toDateStr(new Date(l.timestamp)) === ds);
  const avgScore = dayLogs.length
    ? Math.round(dayLogs.reduce((s, l) => s + l.gutScore, 0) / dayLogs.length)
    : null;

  let color: DayColor = "grey";
  if (isFuture) color = "future";
  else if (isToday && avgScore === null) color = "today";
  else if (avgScore === null) color = "grey";
  else if (avgScore >= 70) color = "green";
  else if (avgScore >= 40) color = "amber";
  else color = "red";

  return { date: ds, color, avgScore, isToday, isFuture };
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
