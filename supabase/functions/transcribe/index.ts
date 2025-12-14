import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const baseCors = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const buildCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowAny = allowedOrigins.length === 0 || allowedOrigins.includes("*");
  const originAllowed = allowAny || (origin && allowedOrigins.includes(origin));
  const allowOrigin = originAllowed ? (origin || "*") : origin || allowedOrigins[0] || "*";

  return {
    ...baseCors,
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
  };
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Stubbed transcription to avoid hangs while external service is unavailable.
  // Always returns a short transcript so the UI can proceed.
  try {
    return new Response(
      JSON.stringify({ transcript: "Transcription placeholder — voice upload disabled for now. You can edit this text." }),
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
