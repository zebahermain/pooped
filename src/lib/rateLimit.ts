/**
 * Simple client-side rate limit for guest splat sends.
 *
 * The real "per-IP" rate limit will live behind a Supabase Edge Function
 * (when Pro launches) — this is the first line of defence at the client
 * to stop casual abuse. Stored in localStorage so it also survives a
 * page refresh.
 *
 * Rule: max 3 successful guest sends per rolling hour.
 */

const KEY = "pooped_guest_send_timestamps";
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const GUEST_SEND_LIMIT = 3;

const readTimestamps = (): number[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
};

const writeTimestamps = (ts: number[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ts));
  } catch {
    // ignore quota errors
  }
};

export const canGuestSendNow = (): {
  ok: boolean;
  remaining: number;
  resetInMs: number;
} => {
  const now = Date.now();
  const recent = readTimestamps().filter((t) => now - t < WINDOW_MS);
  writeTimestamps(recent);
  const used = recent.length;
  const remaining = Math.max(0, GUEST_SEND_LIMIT - used);
  const oldest = recent[0] ?? now;
  const resetInMs = Math.max(0, WINDOW_MS - (now - oldest));
  return { ok: used < GUEST_SEND_LIMIT, remaining, resetInMs };
};

export const recordGuestSend = () => {
  const ts = readTimestamps();
  ts.push(Date.now());
  writeTimestamps(ts);
};
