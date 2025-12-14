import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * REQUIRED SECRETS:
 * - RESEND_API_KEY
 * - ALLOWED_ORIGINS (comma-separated, e.g. https://voiceinspector.ai,https://www.voiceinspector.ai)
 */

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function buildCorsHeaders(req: Request): HeadersInit | null {
  const origin = req.headers.get("origin") || "";

  // fail-closed
  if (allowedOrigins.length === 0) return null;

  const allowAny = allowedOrigins.includes("*");
  const originAllowed = allowAny || (origin && allowedOrigins.includes(origin));
  if (!originAllowed) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const TO_EMAIL = "reports@ziantra.co.uk";
const FROM_EMAIL = "Voice Inspector <onboarding@resend.dev>";

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (!corsHeaders) {
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Parse JSON safely
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    const type = payload?.type === "contact" ? "contact" : "feedback";
    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const email = typeof payload?.email === "string" ? payload.email.trim() : "";
    const organization = typeof payload?.organization === "string" ? payload.organization.trim() : "";
    const details = typeof payload?.details === "string" ? payload.details.trim() : "";
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";

    if (!message) {
      return json({ error: "Message is required." }, 400, corsHeaders);
    }

    if (!RESEND_API_KEY) {
      return json({ error: "RESEND_API_KEY is missing in Supabase secrets." }, 500, corsHeaders);
    }

    const subject = type === "contact" ? "Voice Inspector contact" : "Voice Inspector feedback";

    const body = [
      `Type: ${type}`,
      name ? `Name: ${name}` : null,
      email ? `Email: ${email}` : null,
      organization ? `Organisation: ${organization}` : null,
      details ? `Details: ${details}` : null,
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    // Call Resend
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject,
        text: body,
        // If you want reply-to enabled, uncomment this:
        // reply_to: email || undefined,
      }),
    });

    const resendText = await resendResp.text().catch(() => "");

    if (!resendResp.ok) {
      // IMPORTANT: return the real error for debugging
      console.error("Resend failed:", resendResp.status, resendText);
      return json(
        { error: "Resend rejected the request", status: resendResp.status, details: resendText },
        502,
        corsHeaders,
      );
    }

    // Return success + resend response (useful once)
    return json({ status: "sent", resend: resendText ? safeJson(resendText) : null }, 200, corsHeaders);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-feedback error:", msg);
    return json({ error: "Internal server error", details: msg }, 500, corsHeaders);
  }
});

// Helper: try parse JSON, otherwise return string
function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
