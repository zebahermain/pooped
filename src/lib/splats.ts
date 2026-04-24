import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/storage";
import { getReservoirState, getGrade, type ReservoirGrade } from "@/lib/reservoir";
import { canGuestSendNow, recordGuestSend } from "@/lib/rateLimit";

export type DeliveryStyle = "stealth" | "cannon" | "gentle" | "monsoon";

export interface DeliveryStyleMeta {
  id: DeliveryStyle;
  label: string;
  emoji: string;
  description: string; // one-word descriptor
}

/**
 * Exact copy-deck per product brief: 2×2 grid on step 2 of the send sheet.
 *   💥 Cannon Blast — Devastating
 *   🌧️ Monsoon — Relentless
 *   🤫 Stealth Drop — Unexpected
 *   🎁 Surprise Gift — Deceptive
 *
 * IDs stay the same to preserve the DB CHECK constraint on splats.style.
 */
export const DELIVERY_STYLES: DeliveryStyleMeta[] = [
  { id: "cannon", label: "Cannon Blast", emoji: "💥", description: "Devastating" },
  { id: "monsoon", label: "Monsoon", emoji: "🌧️", description: "Relentless" },
  { id: "stealth", label: "Stealth Drop", emoji: "🤫", description: "Unexpected" },
  { id: "gentle", label: "Surprise Gift", emoji: "🎁", description: "Deceptive" },
];

export const getDeliveryStyleMeta = (id: string): DeliveryStyleMeta | undefined =>
  DELIVERY_STYLES.find((s) => s.id === id);

export type ShareMethod = "whatsapp" | "share" | "copy";

export interface Splat {
  id: string;
  sender_id: string | null; // nullable — guests can now send
  sender_name: string;
  sender_avatar: string;
  recipient_name: string;
  units: number;
  style: DeliveryStyle;
  created_at: string;
}

export interface CreateSplatInput {
  recipient_name: string;
  sender_name_override?: string; // used by guest sends when no profile exists
  units: number;
  style: DeliveryStyle;
}

/**
 * Insert a splat row. Works both for authenticated and guest senders.
 *   - Authenticated: sender_id = auth.uid(), name from profile.
 *   - Guest: sender_id = null, name from sender_name_override (or "Someone").
 *     Rate-limited client-side to 3 sends / rolling hour.
 */
export const createSplat = async (input: CreateSplatInput): Promise<Splat> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;
  const profile = getProfile();

  if (!user) {
    const rl = canGuestSendNow();
    if (!rl.ok) {
      const minutes = Math.ceil(rl.resetInMs / 60000);
      throw new Error(
        `Guest send limit reached. Try again in ~${minutes} min, or sign in for unlimited.`
      );
    }
  }

  const senderName =
    (user ? profile?.name : input.sender_name_override)?.trim() || "Someone";
  const senderAvatar = profile?.avatar ?? "💩";

  const { data, error } = await supabase
    .from("splats")
    .insert({
      sender_id: user?.id ?? null,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      recipient_name: input.recipient_name,
      units: input.units,
      style: input.style,
    })
    .select()
    .single();

  if (error) throw error;
  if (!user) recordGuestSend();
  return data as Splat;
};

/** Public-readable fetch by id — works for anonymous recipients. */
export const fetchSplat = async (id: string): Promise<Splat | null> => {
  const { data, error } = await supabase
    .from("splats")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Splat) ?? null;
};

/**
 * Count of splats created since local midnight (today).
 * Used by the "💩 X splats launched today" live counter on /splat/[id].
 */
export const fetchSplatsToday = async (): Promise<number> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("splats")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay.toISOString());
  if (error) return 0;
  return count ?? 0;
};

/**
 * Drain `units` from the local reservoir and push to cloud if signed in.
 * Returns the new reservoir balance.
 */
export const drainReservoir = async (units: number): Promise<number> => {
  const LOCAL_KEY = "pooped_reservoir";
  const current = getReservoirState();
  const next = {
    ...current,
    units: Math.max(0, current.units - units),
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));

  try {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase
        .from("profiles")
        .update({ reservoir_units: next.units })
        .eq("id", auth.user.id);
    }
  } catch {
    // ignore — local is source of truth for guests
  }

  return next.units;
};

export const buildSplatUrl = (splatId: string): string => {
  if (typeof window === "undefined") return `/splat/${splatId}`;
  return `${window.location.origin}/splat/${splatId}`;
};

/**
 * Viral share line per brief:
 *   "[Their name] just got hit with [X] units of [grade] 💩 by [sender name].
 *    See the damage → [splat link]"
 */
export const buildShareText = (params: {
  recipient: string;
  sender: string;
  units: number;
  grade: ReservoirGrade;
  splatUrl: string;
}): string =>
  `${params.recipient} just got hit with ${params.units} units of ${params.grade} 💩 by ${params.sender}. See the damage → ${params.splatUrl}`;

export const buildWhatsAppLink = (text: string): string =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;

/**
 * iMessage requires an `sms:` URL — works on iOS, graceful noop on other
 * platforms (browser simply won't open anything).
 */
export const buildIMessageLink = (text: string): string =>
  `sms:&body=${encodeURIComponent(text)}`;

export { getGrade };
