import { getLogs, getStreakData, getTodaysLogs } from "@/lib/storage";

/**
 * Pick a note-prompt dynamically for the LogEntry Step 6 placeholder.
 *
 * The rules below fire in order — first match wins. We save the chosen
 * prompt alongside the note (PoopLog.notePrompt) so we can later see
 * which prompts generate useful responses and tweak the hierarchy.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const averageScoreOnDate = (dateStr: string): number | null => {
  const logs = getLogs().filter(
    (l) => new Date(l.timestamp).toISOString().slice(0, 10) === dateStr
  );
  if (!logs.length) return null;
  return logs.reduce((s, l) => s + l.gutScore, 0) / logs.length;
};

const stdevAroundMean = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, n) => s + n, 0) / values.length;
  const variance =
    values.reduce((s, n) => s + (n - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const getSmartPrompt = (): string => {
  const logs = getLogs();
  const today = getTodaysLogs();
  const streak = getStreakData().currentStreak;
  const hour = new Date().getHours();

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - MS_PER_DAY)
    .toISOString()
    .slice(0, 10);

  // Rule 1: score is 15+ points lower than yesterday
  const todayAvg =
    today.length > 0
      ? today.reduce((s, l) => s + l.gutScore, 0) / today.length
      : averageScoreOnDate(todayStr);
  const yAvg = averageScoreOnDate(yesterdayStr);
  if (todayAvg !== null && yAvg !== null && yAvg - todayAvg > 15) {
    return "Your score is lower than yesterday — any idea why? (food, stress, sleep, travel?)";
  }

  // Rule 2: high_stress symptom 3+ times in last 7 days
  const weekAgo = Date.now() - 7 * MS_PER_DAY;
  const stressCount = logs.filter(
    (l) =>
      l.timestamp >= weekAgo &&
      (l.tags?.includes("stress") || l.foodTags?.includes("high_stress"))
  ).length;
  if (stressCount >= 3) {
    return "Stress has come up a lot this week. Anything in particular going on?";
  }

  // Rule 3: no food tags in last 5 days
  const fiveAgo = Date.now() - 5 * MS_PER_DAY;
  const recent = logs.filter((l) => l.timestamp >= fiveAgo);
  const anyFoodTagged = recent.some((l) => (l.foodTags?.length ?? 0) > 0);
  if (recent.length > 0 && !anyFoodTagged) {
    return "What did you eat today? Tagging food helps spot your triggers over time.";
  }

  // Rule 4: streak is a non-zero multiple of 7
  if (streak > 0 && streak % 7 === 0) {
    return `You've hit a ${streak}-day streak 🔥 — how's your gut feeling overall this week?`;
  }

  // Rule 5: last 3 logs all have the same Bristol type
  if (logs.length >= 3) {
    const [a, b, c] = logs; // most recent first per saveLog()
    if (a && b && c && a.bristolType === b.bristolType && b.bristolType === c.bristolType) {
      return `You've been consistently Type ${a.bristolType} lately — anything different in your routine?`;
    }
  }

  // Rule 6: evening and this is the first log of the day
  if (hour >= 18 && today.length === 0) {
    return "Late in the day — anything worth noting about today?";
  }

  // Default
  return "Anything to note? (food, stress, medication, travel — or nothing, that's fine too)";
};

/** Exposed for tests / debugging of the stdev-based "Chaos Agent" rule later. */
export const _stdev = stdevAroundMean;
