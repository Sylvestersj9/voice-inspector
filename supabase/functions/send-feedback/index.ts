import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const buildCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowAny = allowedOrigins.length === 0 || allowedOrigins.includes("*");
  const originAllowed = allowAny || (origin && allowedOrigins.includes(origin));
  const allowOrigin = originAllowed ? (origin || "*") : origin || allowedOrigins[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Vary": "Origin",
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TO_EMAIL = "reports@ziantra.co.uk";
const FROM_EMAIL = "Voice Inspector <onboarding@resend.dev>";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { type = "feedback", name = "", email = "", organization = "", details = "", message = "" } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const response = await fetch("https://api.resend.com/emails", {
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

    if (!response.ok) {
      const text = await response.text();
      console.error("Email send failed:", text);
      return new Response(JSON.stringify({ error: "Unable to send email right now." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-feedback error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
