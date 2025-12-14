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

  try {
    console.log("content-type:", req.headers.get("content-type"));
    const form = await req.formData();
    console.log("form keys:", Array.from(form.keys()));

    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "No audio file provided (expected form field 'file')." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mimeType = file.type || "audio/webm";
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    console.log("file size bytes:", buffer.byteLength);

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI transcription error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI error ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({ transcript: result.text || "" }),
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
