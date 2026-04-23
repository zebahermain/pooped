import { getLogs, getStreakData, getTodaysLogs, type PoopLog } from "@/lib/storage";

/**
 * Daily Gut Challenge — Feature 1.
 *
 * Entirely client-side: the 5 challenge archetypes are deterministically
 * rotated by day-of-epoch so every user sees the same challenge on the
 * same calendar date without needing a shared Supabase table (and thus
 * avoids clashing with Lovable's migrations).
 *
 * Consecutive days never share a type because `POOL.length === 5` and
 * we rotate by `dayIndex % 5`, which always differs from `(dayIndex-1) % 5`.
 */

export type ChallengeType =
  | "timing"
  | "score"
  | "streak"
  | "log_count"
  | "food_tag";

export interface ChallengeDef {
  type: ChallengeType;
  text: string;
  targetValue: number;
  bonusUnits: number;
}

const POOL: ChallengeDef[] = [
  { type: "timing", text: "Log before 9am today ⏰", targetValue: 9, bonusUnits: 15 },
  { type: "score", text: "Hit a Gut Score above 75 today 🎯", targetValue: 75, bonusUnits: 20 },
  { type: "streak", text: "Keep your streak alive today 🔥", targetValue: 1, bonusUnits: 10 },
  { type: "log_count", text: "Log twice today (if you actually go twice) 📊", targetValue: 2, bonusUnits: 15 },
  { type: "food_tag", text: "Tag your food today so we can spot your triggers 🥗", targetValue: 1, bonusUnits: 12 },
];

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

/** Days since Unix epoch — used as the rotation index. */
const dayIndex = (d: Date) =>
  Math.floor(d.getTime() / 86_400_000);

export const getChallengeForDate = (date: Date = new Date()): ChallengeDef => {
  return POOL[dayIndex(date) % POOL.length];
};

// ---------------- Completion state ----------------

interface CompletionRecord {
  date: string;
  type: ChallengeType;
  bonusUnits: number;
  completedAt: number;
}

const KEY = "pooped_challenge_completions";

const readAll = (): Record<string, CompletionRecord> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAll = (data: Record<string, CompletionRecord>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore quota
  }
};

export const getCompletionForDate = (
  date: Date = new Date()
): CompletionRecord | null => {
  const ds = toDateStr(date);
  return readAll()[ds] ?? null;
};

export const isCompletedToday = () =>
  getCompletionForDate(new Date()) !== null;

/**
 * Evaluate today's challenge against today's logs (with a candidate log
 * we're about to save optionally merged in). If the challenge is now
 * satisfied and wasn't already completed today, persist the completion
 * and return the record (caller can then credit reservoir + confetti).
 */
export const evaluateAndMarkCompletion = (
  candidateLog?: PoopLog
): CompletionRecord | null => {
  if (isCompletedToday()) return null;

  const challenge = getChallengeForDate();
  const todaysLogs = getTodaysLogs();
  const effective = candidateLog
    ? [candidateLog, ...todaysLogs.filter((l) => l.id !== candidateLog.id)]
    : todaysLogs;

  const ok = (() => {
    switch (challenge.type) {
      case "timing": {
        if (!effective.length) return false;
        const earliest = Math.min(...effective.map((l) => l.timestamp));
        return new Date(earliest).getHours() < challenge.targetValue;
      }
      case "score":
        return effective.some((l) => l.gutScore >= challenge.targetValue);
      case "streak": {
        const candidateAdded = !!candidateLog;
        const streak = getStreakData().currentStreak + (candidateAdded && !todaysLogs.length ? 1 : 0);
        return streak >= challenge.targetValue;
      }
      case "log_count":
        return effective.length >= challenge.targetValue;
      case "food_tag":
        return effective.some((l) => (l.foodTags?.length ?? 0) >= challenge.targetValue);
      default:
        return false;
    }
  })();

  if (!ok) return null;

  const now = new Date();
  const record: CompletionRecord = {
    date: toDateStr(now),
    type: challenge.type,
    bonusUnits: challenge.bonusUnits,
    completedAt: now.getTime(),
  };
  const all = readAll();
  all[record.date] = record;
  writeAll(all);
  return record;
};

/** Add bonus units directly to the local reservoir (no log attached). */
export const creditReservoirBonus = (units: number) => {
  const LOCAL_KEY = "pooped_reservoir";
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const state = raw ? JSON.parse(raw) : { units: 0, max: 500, notified: false };
    const next = { ...state, units: Math.min(state.max, state.units + units) };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

// Re-export in case callers want the log type without a separate import.
export type { PoopLog };
