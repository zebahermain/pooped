import { supabase } from "@/integrations/supabase/client";
import { getProfile, saveProfile, type Profile } from "@/lib/storage";

const SYNCED_KEY = "pooped_profile_synced_user";

/**
 * On first sign-in for a given user, push the local guest profile up to Supabase.
 * On subsequent sign-ins, pull the cloud profile down into localStorage so the
 * existing localStorage-driven UI keeps working unchanged.
 */
export const syncProfileForUser = async (userId: string) => {
  const { data: cloud } = await supabase
    .from("profiles")
    .select("name, avatar, goal, frequency_pref")
    .eq("id", userId)
    .maybeSingle();

  const local = getProfile();
  const alreadySyncedUser = localStorage.getItem(SYNCED_KEY);

  // First time we see this user on this device AND we have local guest data
  // AND the cloud profile is essentially empty -> migrate up.
  const cloudIsEmpty = !cloud || (!cloud.name && !cloud.goal && !cloud.frequency_pref);

  if (local && cloudIsEmpty && alreadySyncedUser !== userId) {
    await supabase.from("profiles").upsert({
      id: userId,
      name: local.name,
      avatar: local.avatar,
      goal: local.goal,
      frequency_pref: local.frequencyPref,
    });
    localStorage.setItem(SYNCED_KEY, userId);
    return;
  }

  // Otherwise, pull cloud -> local so the app keeps working off localStorage.
  if (cloud && cloud.name) {
    const merged: Profile = {
      name: cloud.name,
      avatar: (cloud.avatar as Profile["avatar"]) || "💩",
      goal: (cloud.goal as Profile["goal"]) || local?.goal || "curious",
      frequencyPref:
        (cloud.frequency_pref as Profile["frequencyPref"]) || local?.frequencyPref || "once",
      createdAt: local?.createdAt ?? Date.now(),
    };
    saveProfile(merged);
    localStorage.setItem(SYNCED_KEY, userId);
  }
};

/** Push current local profile up to cloud (e.g. after Profile edit). */
export const pushProfileToCloud = async (userId: string) => {
  const local = getProfile();
  if (!local) return;
  await supabase.from("profiles").upsert({
    id: userId,
    name: local.name,
    avatar: local.avatar,
    goal: local.goal,
    frequency_pref: local.frequencyPref,
  });
};
