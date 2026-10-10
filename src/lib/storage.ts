export type Goal = 
  | "track_patterns" 
  | "understand_gut" 
  | "improve_health" 
  | "manage_weight" 
  | "manage_condition" 
  | "curious"
  | "digestion" 
  | "ibs"       
  | "weight";

export type FrequencyPref = "once" | "two_three" | "alternate" | "varies" | "less" | "irregular";

export type AvatarEmoji = string;

export interface Profile {
  name: string;
  avatar: AvatarEmoji;
  goal?: Goal; 
  goals?: Goal[]; 
  frequencyPref: FrequencyPref;
  createdAt: number;
}

/**
 * One "I pooped today" log. Logs written by the old detailed log flow may
 * still sit in localStorage with extra health fields (bristolType, color,
 * gutScore, tags...); nothing reads those any more.
 */
export interface PoopLog {
  id: string;
  timestamp: number;
  /** Legacy "I didn't go today" entry. These don't count towards the streak. */
  noMovement?: boolean;
}

export interface StreakData {
  currentStreak: number;
  lastLogDate: string | null;
  longestStreak: number;
  paused?: boolean;
}

const PROFILE_KEY = "pooped_profile";
const LOGS_KEY = "pooped_logs";
const STREAK_KEY = "pooped_streak";
export const THEME_KEY = "pooped_theme";
const WAITLIST_KEY = "pooped_waitlist";

export const getProfile = (): Profile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const saveProfile = (p: Profile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
};

export const getLogs = (): PoopLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
export const saveLog = (log: PoopLog) => {
  const logs = getLogs();
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  updateStreak();
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateToLocalStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDateStr = (ts: number) => dateToLocalStr(new Date(ts));
const todayStr = () => dateToLocalStr(new Date());

export const getTodaysLogs = (): PoopLog[] => {
  const today = todayStr();
  return getLogs().filter((l) => toDateStr(l.timestamp) === today);
};

/** True once the user has logged today (legacy no-movement logs don't count). */
export const hasPoopedToday = (): boolean =>
  getTodaysLogs().some((l) => !l.noMovement);

/** Build the log behind Home's "I pooped today" button. */
export const createLog = (): PoopLog => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
});

export const getStreakData = (): StreakData => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { currentStreak: 0, lastLogDate: null, longestStreak: 0 };
};

const updateStreak = () => {
  const dates = new Set(
    getLogs()
      .filter((l) => !l.noMovement)
      .map((l) => toDateStr(l.timestamp))
  );
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = toDateStr(yesterday.getTime());

  const data = getStreakData();

  let streak = 0;
  const cursor = new Date();
  if (!dates.has(today)) {
    if (dates.has(yStr)) cursor.setDate(cursor.getDate() - 1);
    else {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ currentStreak: 0, lastLogDate: today, longestStreak: data.longestStreak, paused: false }));
      return;
    }
  }
  while (dates.has(toDateStr(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const longest = Math.max(data.longestStreak, streak);
  localStorage.setItem(STREAK_KEY, JSON.stringify({ currentStreak: streak, lastLogDate: today, longestStreak: longest, paused: false }));
};

export const getWaitlist = (): string[] => {
  try {
    const raw = localStorage.getItem(WAITLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
export const addToWaitlist = (email: string) => {
  const list = getWaitlist();
  if (!list.includes(email)) list.push(email);
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
};

export const wipeLegacy = () => {
  try {
    localStorage.removeItem("pooped:logs");
    localStorage.removeItem("pooped:profile");
  } catch {}
};
