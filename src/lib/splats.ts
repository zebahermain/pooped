import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/storage";
import { getReservoirState } from "@/lib/reservoir";

export type DeliveryStyle = "stealth" | "cannon" | "gentle" | "monsoon";

export interface DeliveryStyleMeta {
  id: DeliveryStyle;
  label: string;
  emoji: string;
  description: string;
}

export const DELIVERY_STYLES: DeliveryStyleMeta[] = [
  {
    id: "stealth",
    label: "Stealth drop",
    emoji: "🤫",
    description: "Silent. Deadly. They won't see it coming.",
  },
  {
    id: "cannon",
    label: "Cannon blast",
    emoji: "💥",
    description: "Loud, proud, maximum impact.",
  },
  {
    id: "gentle",
    label: "Gentle gift",
    emoji: "🎁",
    description: "Soft delivery. Almost wholesome. Almost.",
  },
  {
    id: "monsoon",
    label: "Monsoon",
    emoji: "🌧️",
    description: "A relentless downpour. Bring an umbrella.",
  },
];

export const getDeliveryStyleMeta = (id: string): DeliveryStyleMeta | undefined =>
  DELIVERY_STYLES.find((s) => s.id === id);

export interface Splat {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  recipient_name: string;
  units: number;
  style: DeliveryStyle;
  created_at: string;
}

export interface CreateSplatInput {
  recipient_name: string;
  units: number;
  style: DeliveryStyle;
}

/** Insert a splat row. Returns the created splat. Caller must be authenticated. */
export const createSplat = async (input: CreateSplatInput): Promise<Splat> => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const profile = getProfile();
  const { data, error } = await supabase
    .from("splats")
    .insert({
      sender_id: auth.user.id,
      sender_name: profile?.name ?? "",
      sender_avatar: profile?.avatar ?? "💩",
      recipient_name: input.recipient_name,
      units: input.units,
      style: input.style,
    })
    .select()
    .single();
  if (error) throw error;
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

export const buildShareText = (
  units: number,
  recipient: string,
  splatUrl: string
): string =>
  `I just launched ${units} units of Grade-A 💩 at ${recipient} on Pooped 😈 ${splatUrl}`;

export const buildWhatsAppLink = (text: string): string =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
