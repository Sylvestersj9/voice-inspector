// ── Gemini 1.5 Flash — gap analysis prompt for SCCIF readiness quiz ───────────

import type { QuizResult } from "./quizScoring";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/** Build the prompt sent to Gemini */
export function buildGapPrompt(result: QuizResult, homeName?: string): string {
  const gapLines = result.gaps
    .map((g) => `- ${g.domainId} (${g.domainLabel}): "${g.col}" not confirmed`)
    .join("\n");

  return `You are an experienced Ofsted inspector advising a registered manager of a children's home in England.

A manager has completed a SCCIF readiness self-assessment. Here are their results:

Overall readiness score: ${result.pct}% (${result.checked}/${result.total} checks confirmed)
Band: ${result.bandLabel}
${homeName ? `Home name: ${homeName}` : ""}

Unconfirmed evidence gaps:
${gapLines || "None — all 27 checks confirmed."}

Please provide:
1. A concise overall assessment (2-3 sentences) — honest, practical, not alarming.
2. The top 3 highest-priority gaps to address and WHY they matter to inspectors.
3. One concrete action for each gap (specific, achievable within 2 weeks).
4. A single sentence on QS7 (Protection of Children) — remind them it is the limiting judgement even if it scores well.

Tone: warm, direct, colleague-to-colleague. Not corporate. Not legal. Write as a senior practitioner, not a consultant.
Length: ~200 words maximum. No bullet point headers — use plain numbered lists.`.trim();
}

/** Call Gemini 1.5 Flash and return the text response */
export async function callGemini(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_KEY as string | undefined;
  if (!key) throw new Error("VITE_GEMINI_KEY not set");

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:     0.4,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) throw new Error("Empty response from Gemini");
  return text.trim();
}

/** High-level: get analysis or fall back to static message */
export async function getGapAnalysis(
  result:   QuizResult,
  homeName?: string,
): Promise<{ text: string; isAI: boolean }> {
  const key = import.meta.env.VITE_GEMINI_KEY as string | undefined;

  if (key) {
    try {
      const prompt = buildGapPrompt(result, homeName);
      const text   = await callGemini(prompt);
      return { text, isAI: true };
    } catch {
      // fall through to static
    }
  }

  // Static fallback
  const { buildStaticGapReport } = await import("./quizScoring");
  return { text: buildStaticGapReport(result), isAI: false };
}
