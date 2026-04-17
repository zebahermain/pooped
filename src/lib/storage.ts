export type Goal = "digestion" | "ibs" | "curious";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type StoolColor = "brown" | "yellow" | "green" | "black" | "red" | "pale";

export interface PoopLog {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  timestamp: number;
  bristolType: number; // 1-7
  color: StoolColor;
  timeOfDay: TimeOfDay;
  notes?: string;
  score: number;
}

export interface Profile {
  goal: Goal | null;
  onboarded: boolean;
}

const LOGS_KEY = "pooped:logs";
const PROFILE_KEY = "pooped:profile";

export const getProfile = (): Profile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { goal: null, onboarded: false };
    return JSON.parse(raw);
  } catch {
    return { goal: null, onboarded: false };
  }
};

export const saveProfile = (profile: Profile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getLogs = (): PoopLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveLog = (log: PoopLog) => {
  const logs = getLogs();
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const calculateScore = (
  bristolType: number,
  color: StoolColor,
  timeOfDay: TimeOfDay
): number => {
  let score = 0;
  // Bristol: ideal is 3-4
  if (bristolType === 3 || bristolType === 4) score += 40;
  else if (bristolType === 2 || bristolType === 5) score += 25;
  else if (bristolType === 1 || bristolType === 6) score += 12;
  else score += 5;

  // Color
  if (color === "brown") score += 35;
  else if (color === "yellow" || color === "green") score += 18;
  else score += 5;

  // Time of day
  if (timeOfDay === "morning") score += 25;
  else if (timeOfDay === "afternoon") score += 18;
  else if (timeOfDay === "evening") score += 12;
  else score += 8;

  return Math.min(100, score);
};

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

export const getStreak = (): number => {
  const logs = getLogs();
  if (logs.length === 0) return 0;
  const dates = new Set(logs.map((l) => l.date));
  let streak = 0;
  const today = new Date();
  // Allow streak even if today not logged yet, start from yesterday
  if (!dates.has(toDateStr(today))) {
    today.setDate(today.getDate() - 1);
    if (!dates.has(toDateStr(today))) return 0;
  }
  while (dates.has(toDateStr(today))) {
    streak++;
    today.setDate(today.getDate() - 1);
  }
  return streak;
};

export const getCurrentGutScore = (): number => {
  const logs = getLogs();
  if (logs.length === 0) return 0;
  const today = toDateStr(new Date());
  const todays = logs.filter((l) => l.date === today);
  if (todays.length > 0) {
    return Math.round(todays.reduce((s, l) => s + l.score, 0) / todays.length);
  }
  // fallback: average of last 3
  const recent = logs.slice(0, 3);
  return Math.round(recent.reduce((s, l) => s + l.score, 0) / recent.length);
};

export const getWeeklyScores = (): { day: string; score: number }[] => {
  const logs = getLogs();
  const result: { day: string; score: number }[] = [];
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const score =
      dayLogs.length > 0
        ? Math.round(dayLogs.reduce((s, l) => s + l.score, 0) / dayLogs.length)
        : 0;
    result.push({ day: dayLabels[d.getDay()], score });
  }
  return result;
};
