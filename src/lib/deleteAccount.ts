import { supabase } from "@/integrations/supabase/client";

/**
 * Calls the `delete-user` edge function which:
 *  1. Verifies the caller's JWT
 *  2. Validates the email confirmation matches the auth user
 *  3. Inserts an audit row into public.deleted_users
 *  4. Hard-deletes auth.users (cascades to profiles / splats / monthly_report_cards)
 */
export async function deleteAccount(confirmEmail: string, reason?: string) {
  const { data, error } = await supabase.functions.invoke("delete-user", {
    body: { confirmEmail, reason },
  });
  if (error) throw new Error(error.message ?? "Failed to delete account");
  if (data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }

  // Wipe local app data so no ghost data remains after re-landing on `/`.
  try {
    localStorage.removeItem("pooped_profile");
    localStorage.removeItem("pooped_logs");
    localStorage.removeItem("pooped_streak");
    localStorage.removeItem("pooped_profile_synced_user");
    // best-effort cleanup of any reservoir / misc keys
    Object.keys(localStorage)
      .filter((k) => k.startsWith("pooped"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}

  // Make sure the now-invalid session token is cleared client-side.
  await supabase.auth.signOut().catch(() => {});
}
