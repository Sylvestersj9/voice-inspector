import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// TEMP: Resend testing mode only allows sending to your own email
const TO_EMAIL = "janvesylvester@gmail.com";

// Keep this as Resend sandbox sender for now
const FROM_EMAIL = "Voice Inspector <onboarding@resend.dev>";

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let payload: unknown = {};
    try { payload = await req.json(); }
    catch { return json({ error: "Invalid JSON body" }, 400, corsHeaders); }

    const payloadObj = (payload && typeof payload === "object") ? payload as Record<string, unknown> : {};

    const type = payloadObj?.type === "contact" ? "contact" : "feedback";
    const name = typeof payloadObj?.name === "string" ? payloadObj.name.trim() : "";
    const email = typeof payloadObj?.email === "string" ? payloadObj.email.trim() : "";
    const organization = typeof payloadObj?.organization === "string" ? payloadObj.organization.trim() : "";
    const details = typeof payloadObj?.details === "string" ? payloadObj.details.trim() : "";
    const expected = typeof payloadObj?.expected === "string" ? payloadObj.expected.trim() : "";
    const message = typeof payloadObj?.message === "string" ? payloadObj.message.trim() : "";
    const website = typeof payloadObj?.website === "string" ? payloadObj.website.trim() : "";
    const ratingRaw = payloadObj?.rating;
    const rating = typeof ratingRaw === "number" && Number.isFinite(ratingRaw) ? ratingRaw : undefined;
    const userId = typeof payloadObj?.userId === "string" ? payloadObj.userId : "";
    const appVersion = typeof payloadObj?.appVersion === "string" ? payloadObj.appVersion : "";
    const context = payloadObj?.context && typeof payloadObj.context === "object" ? payloadObj.context : null;

    // Honeypot: if filled, silently accept
    if (website) {
      return json({ ok: true }, 200, corsHeaders);
    }

    if (!message || message.length < 5) return json({ error: "Message is required." }, 400, corsHeaders);
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY is missing in Supabase secrets." }, 500, corsHeaders);
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Server config missing SUPABASE_URL or SERVICE_ROLE_KEY" }, 500, corsHeaders);

    // Basic rate limiting by email or IP (1 request per minute)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
    const rateKey = email || clientIp;
    if (rateKey && rateKey !== "unknown") {
      const { data: recent, error: recentErr } = await supabaseAdmin
        .from("feedback")
        .select("id, created_at")
        .or(`email.eq.${email || ""},user_agent.eq.${clientIp}`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!recentErr && recent && recent.length > 0) {
        const last = new Date(recent[0].created_at).getTime();
        if (Date.now() - last < 60_000) {
          return json({ error: "Too many requests, please wait a moment." }, 429, corsHeaders);
        }
      }
    }

    // Record feedback before sending
    const { data: row, error: insErr } = await supabaseAdmin
      .from("feedback")
      .insert({
        name,
        email,
        message,
        user_agent: req.headers.get("user-agent"),
        status: "received",
      })
      .select()
      .single();

    if (insErr) {
      console.error("feedback insert error:", insErr);
    }

    const subject = type === "contact" ? "Voice Inspector contact" : "Voice Inspector feedback";

    const body = [
      `Type: ${type}`,
      name ? `Name: ${name}` : null,
      email ? `Email: ${email}` : null,
      userId ? `User: ${userId}` : null,
      organization ? `Organisation: ${organization}` : null,
      appVersion ? `App: ${appVersion}` : null,
      rating ? `Rating: ${rating}` : null,
      details ? `Details: ${details}` : null,
      expected ? `Expected: ${expected}` : null,
      context ? `Context: ${JSON.stringify(context)}` : null,
      "",
      "Message:",
      message,
    ].filter(Boolean).join("\n");

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
      }),
    });

    const resendText = await resendResp.text().catch(() => "");
    if (!resendResp.ok) {
      console.error("Resend failed:", resendResp.status, resendText);
      if (row?.id) {
        await supabaseAdmin.from("feedback").update({ status: "failed" }).eq("id", row.id);
      }
      return json({ error: "Resend rejected the request", status: resendResp.status, details: resendText }, 502, corsHeaders);
    }

    if (row?.id) {
      await supabaseAdmin.from("feedback").update({ status: "sent" }).eq("id", row.id);
    }

    return json({ status: "sent", resend: resendText ? safeJson(resendText) : null }, 200, corsHeaders);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-feedback error:", msg);
    return json({ error: "Internal server error", details: msg }, 500, corsHeaders);
  }
});
