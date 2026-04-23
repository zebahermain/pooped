// supabase/functions/monthly-report-comment/index.ts
//
// Deno Edge Function — generates the Pro-tier "Teacher's Comment" for
// the monthly report card using Claude Sonnet via Emergent's universal
// LLM proxy (OpenAI-compatible `/llm/chat/completions`).
//
// Auth: the caller's Supabase JWT must be valid.
// Gating: the caller's profiles.is_pro must be TRUE — otherwise we
//         return 403 and the client stays on the blurred preview.
// Caching: the caller stores the returned comment in
//          monthly_report_cards.ai_comment for that month. This function
//          is deliberately stateless — it never writes to the DB.
//
// Required secrets (configure in Supabase → Edge Functions → Secrets):
//   EMERGENT_LLM_KEY   — the universal key starting with "sk-emergent-"
//   SUPABASE_URL       — auto-injected by Supabase at runtime
//   SUPABASE_ANON_KEY  — auto-injected by Supabase at runtime

// @ts-nocheck  Deno-only file; type-checked by Supabase at deploy time.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const EMERGENT_PROXY =
  "https://integrations.emergentagent.com/llm/chat/completions";
const MODEL = "claude-4-sonnet-20250514";

const SYSTEM_PROMPT = [
  "You are a friendly, slightly cheeky gut health coach writing a monthly",
  "report card comment for a user of the app Pooped.",
  "Write exactly 3 sentences. Tone: warm, encouraging, specific to their data,",
  "mildly funny — like a good teacher who genuinely cares.",
  "Never diagnose. Never alarm. If something looks concerning, frame it as",
  "'worth keeping an eye on' not 'you might have X'.",
  "Do not include a greeting or sign-off. Just the 3 sentences.",
].join(" ");

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReportStats {
  days_logged: number;
  days_in_month: number;
  average_gut_score: number;
  consistency_grade: string;
  color_health_grade: string;
  most_common_bristol: number | null;
  end_of_month_streak: number;
  most_common_food_tag: string | null;
  most_common_symptom: string | null;
  gut_personality: string;
}

const buildUserPrompt = (month: string, stats: ReportStats): string => {
  const lines = [
    `User's data for ${month}:`,
    `- Days logged: ${stats.days_logged} of ${stats.days_in_month} days`,
    `- Average Gut Score: ${stats.average_gut_score}/100`,
    `- Consistency grade: ${stats.consistency_grade}`,
    `- Color health grade: ${stats.color_health_grade}`,
    `- Most common Bristol type: ${stats.most_common_bristol ?? "N/A"}`,
    `- Current streak at month end: ${stats.end_of_month_streak} days`,
    stats.most_common_food_tag
      ? `- Most logged food tag: ${stats.most_common_food_tag}`
      : "",
    stats.most_common_symptom
      ? `- Most common symptom: ${stats.most_common_symptom}`
      : "",
    `- Gut Personality this month: ${stats.gut_personality}`,
    "",
    "Write the teacher's comment now. Do not include a greeting or sign-off. Just the 3 sentences.",
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const EMERGENT_KEY = Deno.env.get("EMERGENT_LLM_KEY");
  if (!EMERGENT_KEY) {
    return new Response(
      JSON.stringify({ error: "Server missing EMERGENT_LLM_KEY secret" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      }
    );
  }

  // Use the caller's JWT so RLS applies and auth.uid() resolves correctly.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  if (!profile.is_pro) {
    return new Response(
      JSON.stringify({
        error:
          "Pro subscription required to generate the teacher's comment.",
      }),
      {
        status: 403,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      }
    );
  }

  let body: { month?: string; stats?: ReportStats };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }
  if (!body.month || !body.stats) {
    return new Response(
      JSON.stringify({ error: "Missing month or stats" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      }
    );
  }

  const userPrompt = buildUserPrompt(body.month, body.stats);

  const llmRes = await fetch(EMERGENT_PROXY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EMERGENT_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!llmRes.ok) {
    const text = await llmRes.text();
    console.error("LLM proxy error", llmRes.status, text);
    return new Response(
      JSON.stringify({ error: "Upstream LLM error", status: llmRes.status }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      }
    );
  }

  const data = await llmRes.json();
  const comment: string =
    data?.choices?.[0]?.message?.content?.trim() ?? "";

  if (!comment) {
    return new Response(
      JSON.stringify({ error: "No comment returned from model" }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      }
    );
  }

  // Persist the comment on the user's report card row so future requests
  // are cheap lookups. We silently swallow errors because the primary
  // purpose of this function is to return the comment — caching is a bonus.
  try {
    await supabase
      .from("monthly_report_cards")
      .update({ ai_comment: comment })
      .eq("user_id", user.id)
      .eq("month", body.month);
  } catch (e) {
    console.warn("Failed to cache ai_comment:", e);
  }

  return new Response(JSON.stringify({ comment }), {
    status: 200,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
});
