import { getLogs, type PoopLog } from "./storage";

const SUSPICIOUS_NUDGE_KEY = "pooped.suspiciousNudgeSeen";
const LAST_CHECK_KEY = "pooped.lastHonestyCheck";

const toDateStr = (ts: number) => new Date(ts).toISOString().slice(0, 10);

const countsByDate = (logs: PoopLog[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const l of logs) {
    const d = toDateStr(l.timestamp);
    map[d] = (map[d] || 0) + 1;
  }
  return map;
};

export const shouldShowHonestyCheck = (): boolean => {
  const logs = getLogs();
  const today = toDateStr(Date.now());
  const todaysLogs = logs.filter(l => toDateStr(l.timestamp) === today);
  const logCountToday = todaysLogs.length;

  if (logCountToday === 0) return false;

  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  if (lastCheck === "pending") return false;

  if (logCountToday >= 3) return true;

  return Math.random() < 0.12;
};

export const markHonestyCheckStarted = () => {
  localStorage.setItem(LAST_CHECK_KEY, "pending");
};

export const markHonestyCheckFinished = () => {
  localStorage.removeItem(LAST_CHECK_KEY);
};

export const hasHonestLoggerBadge = (): boolean => {
  const logs = getLogs();
  if (logs.length < 7) return false;
  const counts = countsByDate(logs);
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

export const hasSuspiciousPattern = (): boolean => {
  const logs = getLogs();
  if (logs.length < 12) return false;
  const counts = countsByDate(logs);
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
