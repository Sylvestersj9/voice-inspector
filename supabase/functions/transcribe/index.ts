import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIp } from "../_shared/rate-limiter.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const RATE_LIMIT = 50; // per minute

const baseCors = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const buildCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowAny = allowedOrigins.length === 0 || allowedOrigins.includes("*");
  const originAllowed = allowAny || (origin && allowedOrigins.includes(origin));
  const allowOrigin = originAllowed ? (origin || "*") : origin || allowedOrigins[0] || "*";
  return { ...baseCors, "Access-Control-Allow-Origin": allowOrigin, Vary: "Origin" };
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limit check
  const clientIp = getClientIp(req);
  const { allowed, remaining, retryAfter } = checkRateLimit(clientIp, RATE_LIMIT);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Max 50 requests per minute.",
        retryAfter,
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "No audio file provided (expected form field 'file')." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const deepgramKey = Deno.env.get("DEEPGRAM_API_KEY");
    if (!deepgramKey) {
      return new Response(
        JSON.stringify({ error: "DEEPGRAM_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioBuffer = await file.arrayBuffer();
    const mimeType = file.type || "audio/webm";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en-GB",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramKey}`,
          "Content-Type": mimeType,
        },
        body: audioBuffer,
        signal: controller.signal,
      },
    ).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deepgram error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Deepgram error ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await response.json();
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
