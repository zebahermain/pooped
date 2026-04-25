import { getLogs, getStreakData, getTodaysLogs, type PoopLog } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

export type ChallengeType =
  | "timing"
  | "score"
  | "streak"
  | "food_tag";

export interface ChallengeDef {
  type: ChallengeType;
  text: string;
  targetValue: number;
  bonusUnits: number;
}

export interface CompletionRecord {
  date: string;
  type: ChallengeType;
  bonusUnits: number;
  completedAt: number;
  acknowledged?: boolean;
}

const POOL: ChallengeDef[] = [
  { type: "timing", text: "Log before 9am today ⏰", targetValue: 9, bonusUnits: 15 },
  { type: "score", text: "Hit a Gut Score above 75 today 🎯", targetValue: 75, bonusUnits: 20 },
  { type: "streak", text: "Keep your streak alive today 🔥", targetValue: 1, bonusUnits: 10 },
  { type: "food_tag", text: "Tag your food today so we can spot your triggers 🥗", targetValue: 1, bonusUnits: 12 },
];

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

const dayIndex = (d: Date) =>
  Math.floor(d.getTime() / 86_400_000);

export const getChallengeForDate = (date: Date = new Date()): ChallengeDef => {
  return POOL[dayIndex(date) % POOL.length];
};

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
  } catch {}
};

export const getCompletionForDate = (
  date: Date = new Date()
): CompletionRecord | null => {
  const ds = toDateStr(date);
  return readAll()[ds] ?? null;
};

export const acknowledgeCompletion = async (dateStr: string) => {
  const all = readAll();
  if (all[dateStr]) {
    all[dateStr].acknowledged = true;
    writeAll(all);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ reservoir_notified: true })
        .eq("id", user.id);
    }
  } catch (e) {
    console.error("Failed to sync acknowledgement:", e);
  }
};

export const isCompletedToday = ()
  => getCompletionForDate(new Date()) !== null;

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
    acknowledged: false
  };
  const all = readAll();
  all[record.date] = record;
  writeAll(all);

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase.from("profiles").update({ reservoir_notified: false }).eq("id", user.id).catch(console.error);
    }
  });

  return record;
};

export const creditReservoirBonus = (units: number) => {
  const LOCAL_KEY = "pooped_reservoir";
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const state = raw ? JSON.parse(raw) : { units: 0, max: 500 };
    const next = { ...state, units: Math.min(state.max, state.units + units) };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {}
};

export type { PoopLog };
