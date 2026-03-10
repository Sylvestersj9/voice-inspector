import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an experienced Ofsted inspector conducting a children's home inspection under the SCCIF 2025. You are evaluating a registered manager's spoken or written response to an inspection question. Your tone is professional but fair — you are a human inspector, not a robotic marking system. Managers are practitioners, not academics. You reward answers that demonstrate genuine knowledge, real examples, reflective thinking, and child-centred practice. You do not penalise imperfect wording or lack of technical jargon if the substance is strong.

Award Outstanding (4) when the answer is confident, evidence-rich, specific to their home, demonstrates reflective practice, and shows clear impact on children's lived experience.

Award Good (3) when the answer covers the key points competently, includes at least one specific example or piece of evidence, and shows clear understanding of practice and standards.

Award Requires Improvement (2) when the answer is too vague, lacks specific evidence, is mostly theoretical, or misses a key element of the domain.

Award Inadequate (1) only when the answer demonstrates a significant gap in knowledge, unsafe practice, or inability to evidence basic standards.

A well-structured answer that covers the main points clearly and includes examples should score at minimum Good (3). A thorough, reflective answer with specific evidence and demonstrated impact should score Outstanding (4). Do not be overly harsh.

Respond ONLY in valid JSON with no markdown, no code fences, and no text before or after the JSON object.`;

const JSON_SCHEMA = `{
  "score": <integer 1-4>,
  "band": <"Outstanding" | "Good" | "Requires Improvement" | "Inadequate">,
  "summary": <"2-3 sentences in first person as the inspector — what the answer demonstrated and the overall standard reached">,
  "strengths": [<"specific concrete strength from the answer">, ...up to 4],
  "gaps": [<"specific gap or missing element — constructive, not harsh">, ...up to 4],
  "developmentPoints": [<"specific actionable development step">, ...up to 3],
  "followUpQuestion": <"one specific follow-up question the inspector would ask next, written naturally">,
  "inspectorNote": <"one candid sentence as a private inspector note about what this response reveals">,
  "regulatoryReference": <"most relevant QS number and regulation, e.g. QS7 Protection of Children — Regulation 34">,
  "encouragement": <"one sentence of constructive, warm, motivating feedback — something a real inspector might say verbally at the end of the question, acknowledging what was good and pointing forward">
}`;

const SIGNAL_WORDS =
  /record|review|risk|assessment|safety|plan|supervision|audit|outcome|referral|escalate|monitor|incident|evidence|child|young\s*person|staff|home|care|safeguard|policy|regulation|standard|inspection|Ofsted|quality|support|practice|training|example|process|manage|key|ensure|work/i;

serve(async (req: Request) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = await req.json().catch(() => ({}));
    const domain = String(body?.domain ?? "").trim();
    const question = String(body?.question ?? "").trim();
    const answerText = String(body?.answerText ?? body?.transcript ?? "").trim();

    if (!question) return json(400, { error: "Missing question" });

    if (answerText.length < 20 || !SIGNAL_WORDS.test(answerText)) {
      return json(200, {
        score: 1,
        band: "Inadequate",
        summary:
          "I wasn't able to assess this response — the answer was too brief or didn't engage with the question sufficiently for me to form a view on your practice in this area.",
        strengths: [],
        gaps: [
          "No specific evidence or examples provided",
          "The response did not engage meaningfully with the inspection question",
        ],
        developmentPoints: [
          "Before inspection, prepare 2–3 specific examples from your home's practice for each Quality Standard",
          "Practise speaking your answers aloud — knowledge needs to come across clearly under pressure",
          "Use the SCCIF self-evaluation tool to identify the evidence you already have and can articulate",
        ],
        followUpQuestion: "Can you take me through a specific recent example from your home in more detail?",
        inspectorNote:
          "Manager did not provide a substantive response — this area would need further exploration before I could form a view.",
        regulatoryReference: "SCCIF 2025 — Quality Standards, Children's Homes (England) Regulations 2015",
        encouragement:
          "Don't worry — come back to this one and think of a specific example you can use from your home before your inspection.",
      });
    }

    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") ?? Deno.env.get("ANTHROPIC_API_KEY");
    if (!CLAUDE_API_KEY) throw new Error("CLAUDE_API_KEY is not set in Supabase secrets");

    const userMessage = `Domain: ${domain}
Question: ${question}

Manager's response:
${answerText}

Evaluate this response and return ONLY the JSON object matching this schema:
${JSON_SCHEMA}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const raw = await resp.text();
    if (!resp.ok) throw new Error(`Claude API error ${resp.status}: ${raw.slice(0, 400)}`);

    const claudeData = JSON.parse(raw);
    const text: string = claudeData?.content?.[0]?.text ?? "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    const score = Math.max(1, Math.min(4, Math.round(Number(parsed.score) || 1)));
    const bands: Record<number, string> = { 4: "Outstanding", 3: "Good", 2: "Requires Improvement", 1: "Inadequate" };
    const band = parsed.band ?? bands[score] ?? "Requires Improvement";

    return json(200, {
      score,
      band,
      summary: String(parsed.summary ?? ""),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter(Boolean).slice(0, 4) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.filter(Boolean).slice(0, 4) : [],
      developmentPoints: Array.isArray(parsed.developmentPoints) ? parsed.developmentPoints.filter(Boolean).slice(0, 3) : [],
      followUpQuestion: String(parsed.followUpQuestion ?? ""),
      inspectorNote: String(parsed.inspectorNote ?? ""),
      regulatoryReference: String(parsed.regulatoryReference ?? ""),
      encouragement: String(parsed.encouragement ?? ""),
    });
  } catch (e) {
    console.error("evaluate error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
