import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.slice(7);
    const { data: userData, error: authErr } = await db.auth.getUser(token);
    if (authErr || !userData?.user) {
      console.error("[Submit Feedback] Auth error:", authErr?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = userData.user.id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const {
      feedbackType,
      title,
      description,
      outcome,
      keyLearning,
      homeSetting,
      roleAtTime,
      sessionId,
      isAnonymised = true,
      consentToShare = false,
    } = body;

    // Validate required fields
    if (!feedbackType || !title || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: feedbackType, title, description" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate feedbackType
    if (!["inspection", "interview", "practice"].includes(feedbackType)) {
      return new Response(
        JSON.stringify({ error: "Invalid feedbackType. Must be: inspection, interview, or practice" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert feedback into database
    console.log(`[Submit Feedback] Submitting feedback for user ${userId}, type: ${feedbackType}`);

    const { data: feedback, error: insertErr } = await db
      .from("inspection_feedback")
      .insert({
        user_id: userId,
        session_id: sessionId || null,
        feedback_type: feedbackType,
        title,
        description,
        outcome: outcome || null,
        key_learning: keyLearning || null,
        home_setting: homeSetting || null,
        role_at_time: roleAtTime || null,
        is_public: false, // Always private initially
        is_anonymised: isAnonymised,
        consent_to_share: consentToShare,
      })
      .select();

    if (insertErr) {
      console.error("[Submit Feedback] Insert error:", insertErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to submit feedback", detail: insertErr.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(
      `[Submit Feedback] Feedback submitted successfully, ID: ${feedback?.[0]?.id || "unknown"}`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        feedback: feedback?.[0],
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error(
      `[Submit Feedback] Error: ${e instanceof Error ? e.message : "Unknown error"}`
    );
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        detail: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
