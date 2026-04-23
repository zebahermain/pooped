import { getLogs, getStreakData, type PoopLog } from "@/lib/storage";

/**
 * Gut Personality — Feature 3.
 *
 * Pure client-side computation over the last 30 logs. Each personality
 * is evaluated in declaration order; the FIRST matching personality wins.
 * If none match, we fall back to "The Explorer".
 *
 * The result is cached in localStorage for 7 days so the user sees a
 * stable badge (and so we don't recompute on every Profile open).
 */

export interface Personality {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

const NONE: Personality = {
  id: "explorer",
  emoji: "🗺️",
  name: "The Explorer",
  description:
    "Still finding your rhythm. Keep logging and your personality will emerge.",
};

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export const timeOfDay = (ts: number): TimeOfDay => {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
};

const avg = (ns: number[]) =>
  ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0;

const stdev = (ns: number[]) => {
  if (ns.length < 2) return 0;
  const m = avg(ns);
  return Math.sqrt(avg(ns.map((n) => (n - m) ** 2)));
};

/** Minimum logs needed before a personality is computed. */
export const PERSONALITY_UNLOCK_THRESHOLD = 14;

export const MIN_LOGS_FOR_PERSONALITY = PERSONALITY_UNLOCK_THRESHOLD;

export const computePersonality = (): Personality => {
  const all = getLogs(); // most-recent first
  if (all.length < PERSONALITY_UNLOCK_THRESHOLD) return NONE;

  const last30 = all.slice(0, 30);
  const last14 = all.slice(0, 14);
  const streak = getStreakData().currentStreak;

  // -------- The Streak Machine 🔥 --------
  if (streak >= 14) {
    return {
      id: "streak_machine",
      emoji: "🔥",
      name: "The Streak Machine",
      description:
        "You never miss a day. Your consistency is your superpower — and your gut knows it.",
    };
  }

  // -------- The Zen Monk 🧘 (avg >= 82 over last 14) --------
  if (last14.length && avg(last14.map((l) => l.gutScore)) >= 82) {
    return {
      id: "zen_monk",
      emoji: "🧘",
      name: "The Zen Monk",
      description:
        "Calm, regular, enlightened. Whatever you're doing, keep doing it. Your gut is at peace.",
    };
  }

  // -------- The Comeback Kid 💪 (last 7 avg > previous 7 avg by >10) --------
  if (all.length >= 14) {
    const last7 = avg(all.slice(0, 7).map((l) => l.gutScore));
    const prev7 = avg(all.slice(7, 14).map((l) => l.gutScore));
    if (last7 - prev7 > 10) {
      return {
        id: "comeback_kid",
        emoji: "💪",
        name: "The Comeback Kid",
        description:
          "You were down but you bounced back. Your gut is improving — keep the momentum.",
      };
    }
  }

  // -------- The Chaos Agent 🌪️ (stdev of last 14 > 20) --------
  if (last14.length >= 5 && stdev(last14.map((l) => l.gutScore)) > 20) {
    return {
      id: "chaos_agent",
      emoji: "🌪️",
      name: "The Chaos Agent",
      description:
        "High highs, low lows. Your gut is reactive — probably to food or stress. Time to find your triggers.",
    };
  }

  // -------- The Weekend Warrior 🎉 (Fri/Sat/Sun avg > 15 pts below Mon-Thu) --------
  const weekend: number[] = [];
  const weekday: number[] = [];
  for (const l of last30) {
    const dow = new Date(l.timestamp).getDay();
    if (dow === 5 || dow === 6 || dow === 0) weekend.push(l.gutScore);
    else weekday.push(l.gutScore);
  }
  if (weekend.length >= 3 && weekday.length >= 3 && avg(weekday) - avg(weekend) > 15) {
    return {
      id: "weekend_warrior",
      emoji: "🎉",
      name: "The Weekend Warrior",
      description:
        "Your gut behaves all week then goes rogue on weekends. Sound familiar? Check the alcohol and late-night food.",
    };
  }

  // -------- The Early Bird / The Night Owl (>60% morning OR evening+night) --------
  const todBuckets = last30.reduce(
    (acc, l) => {
      acc[timeOfDay(l.timestamp)]++;
      return acc;
    },
    { morning: 0, afternoon: 0, evening: 0, night: 0 } as Record<TimeOfDay, number>
  );
  if (last30.length > 0) {
    const morningRatio = todBuckets.morning / last30.length;
    const nightRatio = (todBuckets.evening + todBuckets.night) / last30.length;
    if (morningRatio > 0.6) {
      return {
        id: "early_bird",
        emoji: "🌅",
        name: "The Early Bird",
        description:
          "Your gut runs on schedule — always first thing. Consistent morning routine = happy digestive system.",
      };
    }
    if (nightRatio > 0.6) {
      return {
        id: "night_owl",
        emoji: "🦉",
        name: "The Night Owl",
        description:
          "You're a late mover. Late meals or a slower metabolism — worth tracking if scores are lower.",
      };
    }
  }

  // -------- The Consistent One 💎 (>80% Bristol 3 or 4) --------
  if (last30.length >= 10) {
    const ideal = last30.filter((l) => l.bristolType === 3 || l.bristolType === 4).length;
    if (ideal / last30.length > 0.8) {
      return {
        id: "consistent_one",
        emoji: "💎",
        name: "The Consistent One",
        description:
          "Textbook gut health. Type 3-4 consistently means your transit time is dialled in perfectly.",
      };
    }
  }

  return NONE;
};

// ---------------- Cache ----------------
interface CacheRecord {
  personality: Personality;
  computedAt: number;
}
const KEY = "pooped_personality_cache";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const getPersonality = (): {
  personality: Personality;
  computedAt: number;
  isLocked: boolean;
  logCount: number;
} => {
  const logCount = getLogs().length;
  const isLocked = logCount < PERSONALITY_UNLOCK_THRESHOLD;

  if (isLocked) {
    return { personality: NONE, computedAt: Date.now(), isLocked, logCount };
  }

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CacheRecord;
      if (Date.now() - parsed.computedAt < SEVEN_DAYS) {
        return {
          personality: parsed.personality,
          computedAt: parsed.computedAt,
          isLocked: false,
          logCount,
        };
      }
    }
  } catch {
    // ignore — recompute below
  }

  const fresh: CacheRecord = {
    personality: computePersonality(),
    computedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(fresh));
  } catch {
    // ignore quota errors
  }
  return { ...fresh, isLocked: false, logCount };
};

export type { PoopLog };
