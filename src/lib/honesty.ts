import { getLogs, type PoopLog } from "./storage";

const SUSPICIOUS_NUDGE_KEY = "pooped.suspiciousNudgeSeen";

const toDateStr = (ts: number) => new Date(ts).toISOString().slice(0, 10);

// Group logs by local date string
const countsByDate = (logs: PoopLog[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const l of logs) {
    const d = toDateStr(l.timestamp);
    map[d] = (map[d] || 0) + 1;
  }
  return map;
};

/**
 * Honest Logger badge: awarded when the user has logged on 7 consecutive days
 * (up to and including today or yesterday) with exactly 1–3 logs per day.
 */
export const hasHonestLoggerBadge = (): boolean => {
  const logs = getLogs();
  if (logs.length < 7) return false;
  const counts = countsByDate(logs);

  // Find the most recent day with any log; streak must end today or yesterday.
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const todayS = toDateStr(today.getTime());
  const yStr = toDateStr(yesterday.getTime());

  let cursor: Date;
  if (counts[todayS]) cursor = today;
  else if (counts[yStr]) cursor = yesterday;
  else return false;

  for (let i = 0; i < 7; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const ds = toDateStr(d.getTime());
    const c = counts[ds] ?? 0;
    if (c < 1 || c > 3) return false;
  }
  return true;
};

/**
 * Returns true if the user has logged 4+ times in a single day on 3+
 * consecutive recent days. Used to trigger a one-time nudge card.
 */
export const hasSuspiciousPattern = (): boolean => {
  const logs = getLogs();
  if (logs.length < 12) return false;
  const counts = countsByDate(logs);

  // Walk backwards from today looking for 3 consecutive days with 4+ logs.
  const cursor = new Date();
  let consecutive = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const c = counts[toDateStr(d.getTime())] ?? 0;
    if (c >= 4) {
      consecutive++;
      if (consecutive >= 3) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
};

export const hasSeenSuspiciousNudge = () =>
  typeof window !== "undefined" && !!localStorage.getItem(SUSPICIOUS_NUDGE_KEY);

export const markSuspiciousNudgeSeen = () => {
  localStorage.setItem(SUSPICIOUS_NUDGE_KEY, "1");
};
