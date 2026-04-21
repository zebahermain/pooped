import { getLogs, type PoopLog } from "./storage";

const toDateStr = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/**
 * Count consecutive days (ending today or yesterday) that are "no-movement" days.
 * A day qualifies as no-movement when EVERY log that day has bristolType === 0
 * AND there's at least one such log. Days with no logs at all break the streak
 * (we can't assume they were no-movement).
 */
export const getConsecutiveNoMovementDays = (): number => {
  const logs = getLogs();
  if (!logs.length) return 0;

  // Group logs by date
  const byDate: Record<string, PoopLog[]> = {};
  for (const l of logs) {
    const d = toDateStr(l.timestamp);
    (byDate[d] ||= []).push(l);
  }

  const today = new Date();
  const todayS = toDateStr(today.getTime());
  const yStr = toDateStr(today.getTime() - 86400000);

  // Start walking from today if logged, else yesterday, else 0.
  let cursor: Date;
  if (byDate[todayS]) cursor = today;
  else if (byDate[yStr]) {
    cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 1);
  } else return 0;

  let count = 0;
  while (true) {
    const ds = toDateStr(cursor.getTime());
    const dayLogs = byDate[ds];
    if (!dayLogs || dayLogs.length === 0) break;
    const allNoMove = dayLogs.every((l) => l.bristolType === 0);
    if (!allNoMove) break;
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
};

export const hasLoggedToday = (): boolean => {
  const today = toDateStr(Date.now());
  return getLogs().some((l) => toDateStr(l.timestamp) === today);
};

/**
 * Whether the evening "Didn't go today?" CTA should appear.
 * Rule: it's past 6pm local AND no log today.
 */
export const shouldShowEveningNoMovementCTA = (): boolean => {
  const now = new Date();
  if (now.getHours() < 18) return false;
  return !hasLoggedToday();
};
