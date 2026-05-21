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
export type StoolColor =
  | "medium_brown"
  | "dark_brown"
  | "light_brown"
  | "green"
  | "yellow"
  | "red"
  | "black"
  | "pale";

export interface Profile {
  name: string;
  avatar: AvatarEmoji;
  goal?: Goal; 
  goals?: Goal[]; 
  frequencyPref: FrequencyPref;
  createdAt: number;
}

export type BloodPresence = "paper_only" | "in_bowl";

export interface PoopLog {
  id: string;
  timestamp: number;
  bristolType: number; 
  color: StoolColor;
  frequency: number; 
  tags?: string[];
  notes?: string;
  gutScore: number;
  noMovement?: boolean;
  colorContext?: string[];
  colorContextExplained?: boolean;
  bloodPresence?: BloodPresence;
  notePrompt?: string;
}

export const TAG_OPTIONS: { id: string; label: string; emoji: string; category: "food" | "drink" | "lifestyle" | "symptom"; subcategory?: string }[] = [
  // Food - Grains
  { id: "rice", label: "Rice", emoji: "🍚", category: "food", subcategory: "Grains" },
  { id: "roti", label: "Roti/Wheat", emoji: "🌾", category: "food", subcategory: "Grains" },
  { id: "bread", label: "Bread", emoji: "🍞", category: "food", subcategory: "Grains" },
  { id: "oats", label: "Oats", emoji: "🥣", category: "food", subcategory: "Grains" },
  // Food - Protein
  { id: "chicken", label: "Chicken", emoji: "🍗", category: "food", subcategory: "Protein" },
  { id: "meat", label: "Red meat", emoji: "🥩", category: "food", subcategory: "Protein" },
  { id: "fish", label: "Fish", emoji: "🐟", category: "food", subcategory: "Protein" },
  { id: "dal", label: "Dal", emoji: "🫘", category: "food", subcategory: "Protein" },
  { id: "eggs", label: "Eggs", emoji: "🥚", category: "food", subcategory: "Protein" },
  { id: "paneer", label: "Paneer", emoji: "🧆", category: "food", subcategory: "Protein" },
  // Food - Vegetables
  { id: "fiber", label: "Fibre rich", emoji: "🥦", category: "food", subcategory: "Vegetables" },
  { id: "salad", label: "Salad", emoji: "🥗", category: "food", subcategory: "Vegetables" },
  { id: "spicy", label: "Spicy", emoji: "🌶️", category: "food", subcategory: "Vegetables" },
  { id: "onion_garlic", label: "Onion/Garlic", emoji: "🧅", category: "food", subcategory: "Vegetables" },
  // Food - Problem foods
  { id: "dairy", label: "Dairy", emoji: "🧀", category: "food", subcategory: "Problem foods" },
  { id: "sugar", label: "Sugar", emoji: "🍬", category: "food", subcategory: "Problem foods" },
  { id: "fried", label: "Fried", emoji: "🍟", category: "food", subcategory: "Problem foods" },
  { id: "fast_food", label: "Fast food", emoji: "🍔", category: "food", subcategory: "Problem foods" },
  { id: "street_food", label: "Street food", emoji: "🌮", category: "food", subcategory: "Problem foods" },
  
  // Drink
  { id: "coffee", label: "Coffee", emoji: "☕", category: "drink" },
  { id: "tea", label: "Tea", emoji: "🍵", category: "drink" },
  { id: "alcohol", label: "Alcohol", emoji: "🍺", category: "drink" },
  { id: "milk", label: "Milk", emoji: "🥛", category: "drink" },
  { id: "water", label: "Well hydrated", emoji: "💧", category: "drink" },
  { id: "sugary_drinks", label: "Sugary drinks", emoji: "🧃", category: "drink" },

  // Lifestyle
  { id: "stress", label: "Stressed", emoji: "😰", category: "lifestyle" },
  { id: "exercise", label: "Exercised", emoji: "🏃", category: "lifestyle" },
  { id: "poor_sleep", label: "Poor sleep", emoji: "😴", category: "lifestyle" },
  { id: "travel", label: "Travelling", emoji: "✈️", category: "lifestyle" },
  { id: "medication", label: "Medication", emoji: "💊", category: "lifestyle" },

  // Symptoms
  { id: "bloating", label: "Bloating", emoji: "🎈", category: "symptom" },
  { id: "cramps", label: "Cramps", emoji: "⚡", category: "symptom" },
  { id: "nausea", label: "Nausea", emoji: "🤢", category: "symptom" },
  { id: "urgency", label: "Urgency", emoji: "🏃‍♂️", category: "symptom" },
  { id: "incomplete", label: "Incomplete feeling", emoji: "😮‍💨", category: "symptom" },
];

export const getTagMeta = (id: string) => TAG_OPTIONS.find((t) => t.id === id);

export interface TagCorrelation {
  tagId: string;
  label: string;
  emoji: string;
  count: number;
  avgWithTag: number;
  avgWithoutTag: number;
  delta: number;
}

export const getTagCorrelations = (logs: PoopLog[]): TagCorrelation[] => {
  if (logs.length < 3) return [];
  const overallAvg = logs.reduce((s, l) => s + l.gutScore, 0) / logs.length;
  const result: TagCorrelation[] = [];
  for (const tag of TAG_OPTIONS) {
    const withTag = logs.filter((l) => l.tags?.includes(tag.id));
    const withoutTag = logs.filter((l) => !l.tags?.includes(tag.id));
    if (withTag.length < 2) continue;
    const avgWith = withTag.reduce((s, l) => s + l.gutScore, 0) / withTag.length;
    const avgWithout = withoutTag.length
      ? withoutTag.reduce((s, l) => s + l.gutScore, 0) / withoutTag.length
      : overallAvg;
    result.push({
      tagId: tag.id,
      label: tag.label,
      emoji: tag.emoji,
      count: withTag.length,
      avgWithTag: Math.round(avgWith),
      avgWithoutTag: Math.round(avgWithout),
      delta: Math.round(avgWith - avgWithout),
    });
  }
  return result.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.count - a.count);
};

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

export const getStreakData = (): StreakData => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { currentStreak: 0, lastLogDate: null, longestStreak: 0 };
};

const updateStreak = () => {
  const logs = getLogs();
  const byDate: Record<string, number[]> = {};
  for (const l of logs) {
    const d = toDateStr(l.timestamp);
    (byDate[d] ||= []).push(l.bristolType);
  }
  const dates = new Set(Object.keys(byDate));
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = toDateStr(yesterday.getTime());

  const data = getStreakData();

  const isNoMoveDay = (ds: string) => {
    const arr = byDate[ds];
    return !!arr && arr.length > 0 && arr.every((b) => b === 0);
  };
  let noMoveStart: Date | null = null;
  if (dates.has(today)) noMoveStart = new Date();
  else if (dates.has(yStr)) noMoveStart = yesterday;
  let noMoveRun = 0;
  if (noMoveStart) {
    const c = new Date(noMoveStart);
    while (isNoMoveDay(toDateStr(c.getTime()))) {
      noMoveRun++;
      c.setDate(c.getDate() - 1);
    }
  }

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

  const paused = noMoveRun >= 3;
  const effectiveStreak = paused ? Math.max(0, streak - noMoveRun) : streak;
  const longest = Math.max(data.longestStreak, effectiveStreak);
  localStorage.setItem(STREAK_KEY, JSON.stringify({ currentStreak: effectiveStreak, lastLogDate: today, longestStreak: longest, paused }));
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

const BRISTOL_SCORES: Record<number, number> = { 1: 5, 2: 15, 3: 35, 4: 40, 5: 28, 6: 15, 7: 5 };
const COLOR_SCORES: Record<StoolColor, number> = {
  medium_brown: 30, dark_brown: 22, light_brown: 20, green: 12, yellow: 8, red: 4, black: 4, pale: 2,
};
const FREQUENCY_SCORES: Record<number, number> = { 0: 8, 1: 20, 2: 18, 3: 12, 4: 5 };

export const calculateGutScore = (bristolType: number, color: StoolColor, frequencyToday: number): number => {
  const bristol = BRISTOL_SCORES[bristolType] ?? 5;
  const colorScore = COLOR_SCORES[color] ?? 5;
  const freq = FREQUENCY_SCORES[Math.min(frequencyToday, 4)] ?? 5;
  const logs = getLogs();
  const datesSet = new Set(logs.map((l) => toDateStr(l.timestamp)));
  let activeDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (datesSet.has(toDateStr(d.getTime()))) activeDays++;
  }
  const streakBonus = Math.min(10, Math.floor(activeDays * 1.4));
  return Math.min(100, bristol + colorScore + freq + streakBonus);
};

export const isAlertColor = (c: StoolColor) => c === "red" || c === "black" || c === "pale";

export const getCurrentGutScore = (): number => {
  const today = getTodaysLogs();
  if (today.length > 0) return Math.round(today.reduce((s, l) => s + l.gutScore, 0) / today.length);
  const logs = getLogs();
  return logs[0]?.gutScore ?? 0;
};

export const getAverageScore = (): number => {
  const logs = getLogs();
  if (!logs.length) return 0;
  return Math.round(logs.reduce((s, l) => s + l.gutScore, 0) / logs.length);
};

export const getWeeklyScores = (): { day: string; score: number; date: string }[] => {
  const logs = getLogs();
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const out: { day: string; score: number; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d.getTime());
    const dayLogs = logs.filter((l) => toDateStr(l.timestamp) === ds);
    const score = dayLogs.length > 0 ? Math.round(dayLogs.reduce((s, l) => s + l.gutScore, 0) / dayLogs.length) : 0;
    out.push({ day: labels[d.getDay()], score, date: ds });
  }
  return out;
};

export const COLOR_META: Record<StoolColor, { hex: string; label: string; short: string }> = {
  medium_brown: { hex: "#7B4F2E", label: "Healthy brown", short: "Medium brown" },
  dark_brown: { hex: "#3D1F0D", label: "Dark brown", short: "Dark brown" },
  light_brown: { hex: "#C49A6C", label: "Light tan", short: "Light tan" },
  green: { hex: "#4A7C3F", label: "Greenish", short: "Green" },
  yellow: { hex: "#D4B44A", label: "Yellow", short: "Yellow" },
  red: { hex: "#B03030", label: "Reddish / blood", short: "Red" },
  black: { hex: "#1A1A1A", label: "Black / tarry", short: "Black" },
  pale: { hex: "#C8C0B0", label: "Pale / grey", short: "Pale" },
};

export const BRISTOL_META: Record<number, { label: string; emoji: string; ideal?: boolean }> = {
  1: { label: "Hard pellets", emoji: "🪨" },
  2: { label: "Lumpy sausage", emoji: "🥜" },
  3: { label: "Cracked sausage", emoji: "🌽", ideal: true },
  4: { label: "Smooth sausage", emoji: "🌭", ideal: true },
  5: { label: "Soft blobs", emoji: "☁️" },
  6: { label: "Fluffy mush", emoji: "🥣" },
  7: { label: "Liquid 💧", emoji: "💧" },
};

export const wipeLegacy = () => {
  try {
    localStorage.removeItem("pooped:logs");
    localStorage.removeItem("pooped:profile");
  } catch {}
};

export const countBloodInBowlLastNDays = (days = 7): number => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return getLogs().filter((l) => l.timestamp >= cutoff && l.bloodPresence === "in_bowl").length;
};
