import { supabase } from "@/integrations/supabase/client";
import { getLogs, getProfile, getStreakData, type PoopLog } from "@/lib/storage";

const LOCAL_KEY = "pooped_reservoir";
const FIRST_FILL_KEY = "pooped_reservoir_first_fill_seen";
const NOTIFIED_KEY = "pooped_reservoir_notified_local";
const PREV_UNITS_KEY = "pooped_reservoir_prev_units";

export interface ReservoirState {
  units: number;
  max: number;
  notified: boolean; // user has seen the "you can launch" dot at least once
}

export const LAUNCH_THRESHOLD = 50;
export const BASE_MAX = 500;
export const MAX_GROWTH_PER_30_DAYS = 100;

export const unitsForBristol = (bristolType: number): number => {
  if (bristolType === 4) return 30;
  if (bristolType === 3 || bristolType === 5) return 20;
  if (bristolType === 2 || bristolType === 6) return 10;
  return 5; // 1 or 7
};

export interface ReservoirGain {
  base: number;
  colorBonus: number;
  streakMultiplier: number;
  total: number;
}

export const calcGainForLog = (log: PoopLog, streakDays: number): ReservoirGain => {
  const base = unitsForBristol(log.bristolType);
  const colorBonus = log.color === "medium_brown" ? 10 : 0;
  const streakMultiplier = streakDays >= 7 ? 1.5 : 1;
  const total = Math.round((base + colorBonus) * streakMultiplier);
  return { base, colorBonus, streakMultiplier, total };
};

/** Max capacity = 500 + 100 per 30 unique logging days. */
export const calcMaxCapacity = (logs: PoopLog[]): number => {
  const days = new Set(
    logs.map((l) => new Date(l.timestamp).toISOString().slice(0, 10))
  );
  const growth = Math.floor(days.size / 30) * MAX_GROWTH_PER_30_DAYS;
  return BASE_MAX + growth;
};

export type ReservoirGrade = "Rookie" | "Regular" | "Veteran" | "Legendary";

export const getGrade = (units: number): ReservoirGrade => {
  if (units > 500) return "Legendary";
  if (units >= 301) return "Veteran";
  if (units >= 101) return "Regular";
  return "Rookie";
};

// ---------- Local storage (guest fallback) ----------
const readLocal = (): ReservoirState => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { units: 0, max: BASE_MAX, notified: false };
};

const writeLocal = (s: ReservoirState) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
};

export const getReservoirState = (): ReservoirState => {
  const local = readLocal();
  // Recompute max from logs every read so it grows over time even for guests.
  const max = Math.max(local.max, calcMaxCapacity(getLogs()));
  if (max !== local.max) {
    const next = { ...local, max };
    writeLocal(next);
    return next;
  }
  return local;
};

export const hasSeenFirstFill = () => {
  try {
    return localStorage.getItem(FIRST_FILL_KEY) === "1";
  } catch {
    return true;
  }
};

export const markFirstFillSeen = () => {
  localStorage.setItem(FIRST_FILL_KEY, "1");
};

export const hasSeenLaunchDot = () => {
  try {
    return localStorage.getItem(NOTIFIED_KEY) === "1";
  } catch {
    return true;
  }
};

export const markLaunchDotSeen = () => {
  localStorage.setItem(NOTIFIED_KEY, "1");
};

export const getPrevUnitsForBanner = (): number | null => {
  try {
    const raw = localStorage.getItem(PREV_UNITS_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
};

export const clearPrevUnitsForBanner = () => {
  try {
    localStorage.removeItem(PREV_UNITS_KEY);
  } catch {}
};

/**
 * Apply a new log to the reservoir. Caps at max. Returns the new state and
 * the gain applied. Also stores the previous-units value so the Result
 * screen can render its "+X units added" banner with an accurate animation.
 */
export const applyLogToReservoir = async (
  log: PoopLog
): Promise<{ state: ReservoirState; gain: ReservoirGain; isFirstEver: boolean }> => {
  const streakDays = getStreakData().currentStreak;
  const gain = calcGainForLog(log, streakDays);

  const logs = getLogs();
  const isFirstEver = logs.length === 1; // saveLog already inserted this log

  const max = calcMaxCapacity(logs);
  const prev = readLocal();
  const prevUnits = prev.units;
  const nextUnits = Math.min(max, prevUnits + gain.total);
  const next: ReservoirState = {
    units: nextUnits,
    max,
    notified: prev.notified || nextUnits >= LAUNCH_THRESHOLD,
  };
  writeLocal(next);
  try {
    localStorage.setItem(PREV_UNITS_KEY, String(prevUnits));
  } catch {}

  // Best-effort cloud sync if signed in.
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase
        .from("profiles")
        .update({
          reservoir_units: nextUnits,
          reservoir_max: max,
          reservoir_notified: next.notified,
        })
        .eq("id", auth.user.id);
    }
  } catch {
    // ignore — local is source of truth for guests
  }

  return { state: next, gain, isFirstEver };
};

/** Pull cloud reservoir into local on sign-in. */
export const pullReservoirFromCloud = async (userId: string) => {
  const { data } = await supabase
    .from("profiles")
    .select("reservoir_units, reservoir_max, reservoir_notified")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return;
  const local = readLocal();
  // Take the larger of local vs cloud so we never lose progress on first sync.
  const next: ReservoirState = {
    units: Math.max(local.units, data.reservoir_units ?? 0),
    max: Math.max(local.max, data.reservoir_max ?? BASE_MAX),
    notified: local.notified || !!data.reservoir_notified,
  };
  writeLocal(next);
  // If local was ahead, push back up.
  if (
    next.units !== (data.reservoir_units ?? 0) ||
    next.max !== (data.reservoir_max ?? BASE_MAX) ||
    next.notified !== !!data.reservoir_notified
  ) {
    await supabase
      .from("profiles")
      .update({
        reservoir_units: next.units,
        reservoir_max: next.max,
        reservoir_notified: next.notified,
      })
      .eq("id", userId);
  }
};

/** Mark the launch-dot as seen both locally and in cloud (if signed in). */
export const acknowledgeLaunchDot = async () => {
  markLaunchDotSeen();
  const local = readLocal();
  writeLocal({ ...local, notified: true });
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase
        .from("profiles")
        .update({ reservoir_notified: true })
        .eq("id", auth.user.id);
    }
  } catch {}
};

export { getProfile };
