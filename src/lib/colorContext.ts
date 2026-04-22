import type { StoolColor } from "@/lib/storage";

/**
 * Context-check metadata for the four "flagged" stool colors.
 *
 * Shown as an interstitial between Step 2 (color) and Step 3 (frequency)
 * in the log flow. The chips represent the most common dietary / medication
 * causes that explain away a scary-looking colour. If the user picks one,
 * we mark `colorContextExplained = true` and never alarm them on the
 * Result screen. If they don't, we surface a measured amber (or red) alert.
 */

export type ContextChip = { id: string; label: string; emoji: string };

export interface ColorContextMeta {
  chips: ContextChip[];
  subtitle: string;
  /** Alert severity when the user says "none of these apply". */
  severity: "warning" | "danger";
  /** Alert copy shown on Result screen if context is unexplained. */
  unexplainedAlert: string;
}

export const FLAGGED_COLORS: StoolColor[] = ["red", "black", "pale", "yellow"];

export const isFlaggedColor = (c: StoolColor | null | undefined) =>
  !!c && FLAGGED_COLORS.includes(c);

export const COLOR_CONTEXT: Partial<Record<StoolColor, ColorContextMeta>> = {
  red: {
    subtitle: "Did you eat or take any of these in the last 48 hours?",
    severity: "warning",
    unexplainedAlert:
      "Red stool without a clear dietary cause is worth mentioning to a doctor if it continues. This isn't an emergency — just worth noting. 🩺",
    chips: [
      { id: "beetroot", label: "Beetroot", emoji: "🥗" },
      { id: "red_dragonfruit", label: "Red dragon fruit", emoji: "🍉" },
      { id: "tomato_paste", label: "Tomato juice or paste", emoji: "🍅" },
      { id: "red_fruit_drinks", label: "Red fruit drinks", emoji: "🧃" },
      { id: "iron_supplements", label: "Iron supplements", emoji: "💊" },
      { id: "pepto", label: "Pepto-Bismol", emoji: "💊" },
      { id: "strawberries", label: "Lots of strawberries", emoji: "🍓" },
      { id: "red_colouring", label: "Red food colouring", emoji: "🌶️" },
    ],
  },
  black: {
    subtitle: "Did you eat or take any of these in the last 48 hours?",
    severity: "warning",
    unexplainedAlert:
      "Black stool without a dietary cause can sometimes indicate bleeding higher in the digestive tract. Worth a doctor visit if it happens more than once. 🩺",
    chips: [
      { id: "iron_supplements", label: "Iron supplements", emoji: "💊" },
      { id: "bismuth", label: "Pepto-Bismol or bismuth", emoji: "💊" },
      { id: "blueberries", label: "Large amounts of blueberries", emoji: "🫐" },
      { id: "liquorice", label: "Black liquorice", emoji: "🍬" },
      { id: "squid_ink", label: "Squid ink", emoji: "🦑" },
      { id: "dark_chocolate", label: "Lots of dark chocolate", emoji: "🍫" },
    ],
  },
  pale: {
    subtitle: "Did you eat or take any of these in the last 48 hours?",
    severity: "danger",
    unexplainedAlert:
      "Pale or grey stool can indicate reduced bile flow, which is worth checking with a doctor — especially if it happens repeatedly or alongside any yellowing of the skin.",
    chips: [
      { id: "antacids", label: "Antacids (aluminium hydroxide)", emoji: "💊" },
      { id: "barium", label: "Barium (recent X-ray prep)", emoji: "💊" },
      { id: "high_dairy", label: "Very high dairy day", emoji: "🥛" },
    ],
  },
  yellow: {
    subtitle: "Did you eat or take any of these in the last 48 hours?",
    severity: "warning",
    unexplainedAlert:
      "Yellow stool can sometimes indicate fat absorption issues. If it's greasy, floats, and smells strong, that's worth mentioning to a doctor.",
    chips: [
      { id: "carrots_yams", label: "Lots of carrots, yams or sweet potato", emoji: "🥕" },
      { id: "orlistat", label: "Orlistat or weight loss medication", emoji: "💊" },
      { id: "high_fat_meal", label: "Very high fat meal", emoji: "🧈" },
      { id: "high_dairy", label: "High dairy intake", emoji: "🥛" },
      { id: "green_veg", label: "Large amount of green vegetables", emoji: "🥦" },
    ],
  },
};
