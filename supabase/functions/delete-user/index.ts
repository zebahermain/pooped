// Supabase Edge Function: delete-user
// ------------------------------------------------------------
// Hard-deletes the calling user's account.
// 1. Verifies the caller's JWT (must be the same user being deleted).
// 2. Inserts an audit row into public.deleted_users.
// 3. Calls auth.admin.deleteUser() — cascades remove rows in
//    profiles / splats / monthly_report_cards via ON DELETE CASCADE.
//
// Required env vars (set automatically by Supabase for deployed functions):
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY
//
// Deploy with:  supabase functions deploy delete-user --no-verify-jwt
// (we verify the JWT manually inside the function so we can return JSON errors)
// ------------------------------------------------------------

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }

    // 1. Verify the caller using the anon client + their JWT.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const user = userData.user;

    // 2. Optional: read confirmation email + reason from body.
    let body: { confirmEmail?: string; reason?: string } = {};
    try {
      body = await req.json();
    } catch (_) {}

    if (
      body.confirmEmail &&
      user.email &&
      body.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      return json({ error: "Email confirmation does not match" }, 400);
    }

    // 3. Service-role client for privileged operations.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Audit log BEFORE deletion (so email is still resolvable).
    const { error: auditErr } = await admin.from("deleted_users").insert({
      user_id: user.id,
      email: user.email ?? null,
      reason: body.reason ?? null,
      metadata: {
        provider: user.app_metadata?.provider ?? null,
        created_at: user.created_at,
      },
    });
    if (auditErr) {
      console.error("audit insert failed", auditErr);
      // continue — we'd rather delete the account than block on audit failure
    }

    // 5. Hard-delete the auth user → cascades to dependent tables.
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return json({ error: delErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message ?? "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
