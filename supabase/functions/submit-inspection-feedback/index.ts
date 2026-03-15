import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const CONTACT_TO_EMAIL = Deno.env.get("CONTACT_TO_EMAIL") || "info@mockofsted.co.uk";
const CONTACT_FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") || "MockOfsted <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Send email via Resend (best-effort, non-blocking)
async function sendFeedbackNotificationEmail(feedbackData: {
  title: string;
  feedbackType: string;
  description: string;
  outcome?: string;
  userName?: string;
  userEmail?: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn("[Send Feedback Email] RESEND_API_KEY not configured, skipping email");
    return;
  }

  try {
    const feedbackTypeLabel = {
      inspection: "Inspection Feedback",
      interview: "Interview Feedback",
      practice: "Practice Feedback",
    }[feedbackData.feedbackType] || "User Feedback";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0D9488; border-bottom: 2px solid #0D9488; padding-bottom: 10px;">
          New ${feedbackTypeLabel}
        </h2>

        <p><strong>Title:</strong> ${feedbackData.title}</p>
        <p><strong>Type:</strong> ${feedbackTypeLabel}</p>
        ${feedbackData.outcome ? `<p><strong>Outcome:</strong> ${feedbackData.outcome}</p>` : ""}
        ${feedbackData.userName ? `<p><strong>From:</strong> ${feedbackData.userName}</p>` : ""}
        ${feedbackData.userEmail ? `<p><strong>Email:</strong> ${feedbackData.userEmail}</p>` : ""}

        <h3 style="color: #334155; margin-top: 20px;">Feedback:</h3>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #0D9488;">
          <p style="white-space: pre-wrap; margin: 0; color: #475569;">${feedbackData.description}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="text-align: center; font-size: 12px; color: #94a3b8;">
          Feedback from MockOfsted Platform
        </p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: CONTACT_TO_EMAIL,
        subject: `[MockOfsted] New ${feedbackTypeLabel}: "${feedbackData.title}"`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.warn(`[Send Feedback Email] Resend API error: ${response.status} ${response.statusText}`);
    } else {
      console.log("[Send Feedback Email] Email sent successfully");
    }
  } catch (error) {
    console.warn(`[Send Feedback Email] Error sending email: ${error instanceof Error ? error.message : "Unknown error"}`);
    // Non-blocking: don't throw
  }
}

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

    // Send notification email (non-blocking, best-effort)
    const userProfile = await db
      .from("users")
      .select("name, email")
      .eq("id", userId)
      .maybeSingle()
      .catch(() => ({ data: null }));

    sendFeedbackNotificationEmail({
      title,
      feedbackType,
      description,
      outcome,
      userName: userProfile?.data?.name,
      userEmail: userProfile?.data?.email,
    }).catch(() => {
      // Error already logged in sendFeedbackNotificationEmail
    });

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
