import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// To switch provider later, change this constant and update callAI()
const PROVIDER = "gemini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EvalBand = "Inadequate" | "Requires Improvement" | "Good" | "Outstanding";

const SIGNAL_WORDS =
  /record|review|risk|assessment|safety|plan|supervision|audit|outcome|referral|escalate|monitor|incident|evidence/i;

const bandFromScore = (score: number): EvalBand => {
  if (score >= 10) return "Outstanding";
  if (score >= 7) return "Good";
  if (score >= 4) return "Requires Improvement";
  return "Inadequate";
};

const clampDim = (v: unknown) => Math.max(0, Math.min(3, Math.round(Number(v) || 0)));

const insufficientResponse = (domain: string, question: string) => ({
  dimension_scores: { safeguarding: 0, evidence: 0, impact: 0, reflection: 0 },
  score: 0,
  band: "Inadequate" as EvalBand,
  strengths: [],
  gaps: ["Answer did not address the question", "No evidence or examples provided"],
  recommendations: ["Provide a concrete example with evidence of what you did"],
  follow_up_questions: [
    "Share one concrete example with evidence of what you did.",
    "Describe the impact or outcome and how you know it worked.",
  ],
  red_flags: [],
  summary: "The answer was too brief or lacked substance to evaluate.",
});

async function callAI(
  domain: string,
  question: string,
  answerText: string,
  transcript: string,
  inputMode: string,
  ragContext: string,
): Promise<Record<string, unknown>> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const prompt = `You are an Ofsted-style inspector evaluating an answer for a children's home inspection.
Judge substance, not grammar. ${inputMode === "voice" ? 'This is a spoken/transcribed answer — do not penalise filler words or rough phrasing.' : ''}

Score each dimension 0–3 (integers only):
A) Safeguarding & risk awareness (0–3)
B) Practice & evidence (examples, routines, records) (0–3)
C) Child-centred outcomes & impact (0–3)
D) Leadership, learning & reflection (0–3)

Total = A + B + C + D (0–12)

Band mapping:
  10–12 = Outstanding
  7–9 = Good
  4–6 = Requires Improvement
  0–3 = Inadequate

Guardrails:
- If any red flag exists: cap band at Requires Improvement
- If safeguarding >= 2 AND evidence >= 2 AND impact >= 2 AND no red flags: floor band at Good
- Voice input: judge substance only, not grammar

Return JSON with this exact shape:
{
  "dimension_scores": { "safeguarding": 0, "evidence": 0, "impact": 0, "reflection": 0 },
  "score": 0,
  "band": "Outstanding|Good|Requires Improvement|Inadequate",
  "strengths": [],
  "gaps": [],
  "recommendations": [],
  "follow_up_questions": [],
  "red_flags": [],
  "summary": ""
}

Context:
Domain: ${domain}
Question: ${question}
${ragContext ? `RAG Context:\n${ragContext}\n` : ''}
Answer (text): ${answerText || "(none)"}
Answer (transcript): ${transcript || "(none)"}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  const raw = await resp.text();
  if (!resp.ok) {
    throw new Error(`Gemini error ${resp.status}: ${raw.slice(0, 500)}`);
  }

  const data = JSON.parse(raw);
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(content);
}

serve(async (req: Request) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = await req.json().catch(() => ({}));
    const domain = (body?.domain || "").toString().trim();
    const question = (body?.question || "").toString().trim();
    const answerText = (body?.answerText || "").toString().trim();
    const transcript = (body?.transcript || "").toString().trim();
    const inputMode = (body?.inputMode || "text").toString().trim();
    const ragContext = (body?.ragContext || "").toString().trim();

    if (!question) return json(400, { error: "Missing question" });

    const combined = (answerText || transcript).trim();

    // Insufficient answer gate
    if (combined.length < 30 || !SIGNAL_WORDS.test(combined)) {
      return json(200, insufficientResponse(domain, question));
    }

    const parsed = await callAI(domain, question, answerText, transcript, inputMode, ragContext);

    // Server-side guardrails: clamp dimensions, recalculate score/band
    const dims = (parsed.dimension_scores && typeof parsed.dimension_scores === "object")
      ? (parsed.dimension_scores as Record<string, unknown>)
      : {};
    const saf = clampDim(dims.safeguarding);
    const evid = clampDim(dims.evidence);
    const impact = clampDim(dims.impact);
    const reflection = clampDim(dims.reflection);
    const score = saf + evid + impact + reflection;

    const redFlags: string[] = Array.isArray(parsed.red_flags)
      ? parsed.red_flags.filter(Boolean).map((s: unknown) => String(s))
      : [];

    let band: EvalBand = bandFromScore(score);

    // Red flag cap
    if (redFlags.length > 0 && (band === "Outstanding" || band === "Good")) {
      band = "Requires Improvement";
    }
    // Strong answer floor
    if (redFlags.length === 0 && saf >= 2 && evid >= 2 && impact >= 2 && band === "Requires Improvement") {
      band = "Good";
    }

    const normaliseList = (val: unknown, max: number) => {
      const arr = Array.isArray(val) ? val : [];
      return arr.filter(Boolean).map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, max);
    };

    const result = {
      dimension_scores: { safeguarding: saf, evidence: evid, impact: impact, reflection },
      score,
      band,
      strengths: normaliseList(parsed.strengths, 4),
      gaps: normaliseList(parsed.gaps, 4),
      recommendations: normaliseList(parsed.recommendations, 6),
      follow_up_questions: normaliseList(parsed.follow_up_questions, 4),
      red_flags: redFlags,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };

    return json(200, result);
  } catch (e) {
    console.error("evaluate error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
