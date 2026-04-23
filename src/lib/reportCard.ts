import { getLogs, type PoopLog } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

/**
 * Feature 4 — Monthly Gut Report Card
 *
 * Computes letter grades + GPA for a completed calendar month from the
 * user's local log history, persists the card for signed-in users, and
 * surfaces the cached AI teacher's comment if the user is Pro.
 *
 * Client-side math only — the Supabase write is just persistence so
 * users see their own history across devices. The Claude-generated
 * comment is fetched lazily via `fetchOrCreateAiComment()`.
 */

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface MonthlyReportCard {
  month: string; // YYYY-MM-01
  monthLabel: string; // "March 2026"
  consistencyGrade: Grade;
  colorHealthGrade: Grade;
  frequencyGrade: Grade;
  streakGrade: Grade;
  overallGPA: number;
  daysLogged: number;
  daysInMonth: number;
  averageGutScore: number;
  mostCommonBristol: number | null;
  mostCommonFoodTag: string | null;
  mostCommonSymptom: string | null;
  endOfMonthStreak: number;
  aiComment: string | null;
}

const GRADE_POINTS: Record<Grade, number> = {
  "A+": 4.0,
  A: 3.7,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0,
};

const gradeConsistency = (pct: number): Grade => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
};

const gradeColorHealth = (brownPct: number): Grade => {
  if (brownPct >= 90) return "A+";
  if (brownPct >= 75) return "A";
  if (brownPct >= 60) return "B";
  if (brownPct >= 50) return "C";
  return "D";
};

const gradeFrequency = (avgPerDay: number): Grade => {
  if (avgPerDay >= 1.0 && avgPerDay <= 1.5) return "A+";
  if (avgPerDay >= 1.6 && avgPerDay <= 2.0) return "A";
  if ((avgPerDay >= 0.8 && avgPerDay < 1.0) || (avgPerDay > 2.0 && avgPerDay <= 3.0)) return "B";
  if (avgPerDay < 0.8 || avgPerDay > 3.0) return "C";
  return "B";
};

const gradeStreak = (longestStreak: number): Grade => {
  if (longestStreak >= 28) return "A+";
  if (longestStreak >= 21) return "A";
  if (longestStreak >= 14) return "B";
  if (longestStreak >= 7) return "C";
  return "D";
};

const ym = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

const monthLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const mostCommon = <T>(xs: T[]): T | null => {
  if (!xs.length) return null;
  const tally = new Map<T, number>();
  for (const x of xs) tally.set(x, (tally.get(x) ?? 0) + 1);
  let best: T | null = null;
  let bestN = 0;
  for (const [k, n] of tally) if (n > bestN) { best = k; bestN = n; }
  return best;
};

/** Return the first day of the *previous* calendar month relative to today. */
export const previousMonthAnchor = (ref = new Date()): Date => {
  const d = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Compute the full report card for a given month's first day. */
export const computeReportCard = (monthStart: Date): MonthlyReportCard => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59, 999);

  const logs: PoopLog[] = getLogs().filter((l) => {
    const t = l.timestamp;
    return t >= monthStart.getTime() && t <= monthEnd.getTime();
  });

  // --- days logged (unique by date) ---
  const days = new Set(
    logs.map((l) => new Date(l.timestamp).toISOString().slice(0, 10))
  );
  const daysLogged = days.size;
  const consistencyPct = (daysLogged / daysInMonth) * 100;

  // --- color health: % of logs with brown family ---
  const brownColors = new Set(["medium_brown", "dark_brown", "light_brown"]);
  const brownLogs = logs.filter((l) => brownColors.has(l.color)).length;
  const brownPct = logs.length ? (brownLogs / logs.length) * 100 : 0;

  // --- frequency: avg logs per logged day ---
  const avgPerDay = daysLogged ? logs.length / daysLogged : 0;

  // --- streak: longest consecutive logged-day run within the month ---
  let longestStreak = 0;
  let current = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = new Date(year, month, d).toISOString().slice(0, 10);
    if (days.has(key)) {
      current += 1;
      if (current > longestStreak) longestStreak = current;
    } else {
      current = 0;
    }
  }

  const consistencyGrade = gradeConsistency(consistencyPct);
  const colorHealthGrade = gradeColorHealth(brownPct);
  const frequencyGrade = gradeFrequency(avgPerDay);
  const streakGrade = gradeStreak(longestStreak);

  const overallGPA =
    (GRADE_POINTS[consistencyGrade] +
      GRADE_POINTS[colorHealthGrade] +
      GRADE_POINTS[frequencyGrade] +
      GRADE_POINTS[streakGrade]) /
    4;

  const averageGutScore = logs.length
    ? logs.reduce((s, l) => s + l.gutScore, 0) / logs.length
    : 0;

  return {
    month: ym(monthStart),
    monthLabel: monthLabel(monthStart),
    consistencyGrade,
    colorHealthGrade,
    frequencyGrade,
    streakGrade,
    overallGPA: Math.round(overallGPA * 100) / 100,
    daysLogged,
    daysInMonth,
    averageGutScore: Math.round(averageGutScore * 10) / 10,
    mostCommonBristol: mostCommon(logs.map((l) => l.bristolType)),
    mostCommonFoodTag: mostCommon(logs.flatMap((l) => l.foodTags ?? [])),
    mostCommonSymptom: mostCommon(logs.flatMap((l) => l.symptoms ?? [])),
    endOfMonthStreak: longestStreak,
    aiComment: null,
  };
};

// ---------------- Cloud persistence (authenticated users only) ----------------

/**
 * Upsert the grade portion of the report card for the current user,
 * and (optionally) attach an AI comment once generated. Safe to call
 * multiple times for the same month thanks to the unique (user_id, month)
 * constraint in the migration.
 */
export const persistReportCard = async (
  userId: string,
  card: MonthlyReportCard
): Promise<void> => {
  const { error } = await supabase
    .from("monthly_report_cards")
    .upsert(
      {
        user_id: userId,
        month: card.month,
        consistency_grade: card.consistencyGrade,
        color_health_grade: card.colorHealthGrade,
        frequency_grade: card.frequencyGrade,
        streak_grade: card.streakGrade,
        overall_gpa: card.overallGPA,
        days_logged: card.daysLogged,
        days_in_month: card.daysInMonth,
        average_gut_score: card.averageGutScore,
      },
      { onConflict: "user_id,month", ignoreDuplicates: false }
    );
  if (error) console.error("persistReportCard error", error);
};

export const fetchExistingReportCard = async (
  userId: string,
  monthISO: string
): Promise<{ ai_comment: string | null } | null> => {
  const { data, error } = await supabase
    .from("monthly_report_cards")
    .select("ai_comment")
    .eq("user_id", userId)
    .eq("month", monthISO)
    .maybeSingle();
  if (error || !data) return null;
  return data;
};

/**
 * Invoke the `monthly-report-comment` edge function if the user is Pro.
 * The function verifies Pro status server-side and returns 403 otherwise.
 * The generated comment is cached into monthly_report_cards.ai_comment
 * by this call — so subsequent calls are cheap lookups.
 */
export const requestAiComment = async (
  card: MonthlyReportCard,
  gutPersonalityName: string
): Promise<string | null> => {
  const { data, error } = await supabase.functions.invoke<{
    comment?: string;
    error?: string;
  }>("monthly-report-comment", {
    body: {
      month: card.month,
      stats: {
        days_logged: card.daysLogged,
        days_in_month: card.daysInMonth,
        average_gut_score: card.averageGutScore,
        consistency_grade: card.consistencyGrade,
        color_health_grade: card.colorHealthGrade,
        most_common_bristol: card.mostCommonBristol,
        end_of_month_streak: card.endOfMonthStreak,
        most_common_food_tag: card.mostCommonFoodTag,
        most_common_symptom: card.mostCommonSymptom,
        gut_personality: gutPersonalityName,
      },
    },
  });
  if (error) {
    console.warn("requestAiComment failed", error);
    return null;
  }
  return data?.comment ?? null;
};
