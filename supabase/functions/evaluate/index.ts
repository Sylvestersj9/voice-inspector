import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EvalBand = "Inadequate" | "Requires Improvement" | "Good" | "Outstanding";

type EvalV2 = {
  score: number; // 0-100
  band: EvalBand;
  summary: string;
  strengths: Array<{ evidence: string[]; what_worked: string; why_it_matters_to_ofsted: string }>;
  weaknesses: Array<{ evidence: string[]; gap: string; risk: string; what_ofsted_expected: string }>;
  sentence_improvements: Array<{
    sentence_id: string; // "S3"
    original: string; // exact sentence text
    issue: string;
    better_version: string;
    synonyms_or_phrases: string[]; // 2-5 items
    impact: string;
  }>;
  missing_key_points: string[]; // 3-7 items
  follow_up_questions: Array<{ question: string; why: string; what_good_looks_like: string }>;
};

type Sentence = { id: string; text: string };

const allowedBands: EvalBand[] = ["Inadequate", "Requires Improvement", "Good", "Outstanding"];

const splitSentences = (input: string): Sentence[] => {
  const trimmed = (input || "").trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const sentences = (parts.length ? parts : [trimmed]).map((text, idx) => ({
    id: `S${idx + 1}`,
    text,
  }));
  return sentences;
};

const clampScore = (score: unknown) => {
  const num = typeof score === "number" ? score : Number(score);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
};

const normalizeBand = (band: unknown): EvalBand => {
  const value = (typeof band === "string" ? band : "").toLowerCase();
  if (value.includes("outstanding")) return "Outstanding";
  if (value.includes("good")) return "Good";
  if (value.includes("requires")) return "Requires Improvement";
  if (value.includes("inadequate")) return "Inadequate";
  return "Requires Improvement";
};

const ensureEvidence = (evidence: unknown, sentences: Sentence[], fallbackIdx = 0) => {
  const base = Array.isArray(evidence) ? evidence : [];
  const cleaned = base.map((e) => (e ?? "").toString().trim()).filter(Boolean);
  if (cleaned.length > 0) return cleaned;
  const fallbackId = sentences[fallbackIdx]?.id || sentences[0]?.id || "S1";
  return [fallbackId];
};

const safeText = (val: unknown, fallback: string) => {
  const s = (val ?? "").toString().trim();
  return s.length ? s : fallback;
};

const ensureArray = <T>(val: unknown): T[] => (Array.isArray(val) ? (val as T[]) : []);

const fallbackStrengths = (sentences: Sentence[]): EvalV2["strengths"] => {
  const refs = sentences.length ? sentences : [{ id: "S1", text: "No answer provided." }];
  const items = [
    {
      what_worked: "Clear safeguarding process described with staff action.",
      why_it_matters_to_ofsted: "Shows staff act on concerns and protect children promptly.",
    },
    {
      what_worked: "Evidence of reviewing impact on the child and adjusting plans.",
      why_it_matters_to_ofsted: "Ofsted want to see outcomes and learning, not just activity.",
    },
    {
      what_worked: "Attention to the child's voice within day-to-day practice.",
      why_it_matters_to_ofsted: "Inspection focuses on lived experience and whether children feel safe.",
    },
  ];
  return items.slice(0, 2).map((item, idx) => ({
    evidence: [refs[idx % refs.length].id],
    what_worked: item.what_worked,
    why_it_matters_to_ofsted: item.why_it_matters_to_ofsted,
  }));
};

const fallbackWeaknesses = (sentences: Sentence[]): EvalV2["weaknesses"] => {
  const refs = sentences.length ? sentences : [{ id: "S1", text: "No answer provided." }];
  const items = [
    {
      gap: "No specific incident or example was given to evidence practice.",
      risk: "Without examples, the response could be generic and untested in real situations.",
      what_ofsted_expected: "Inspectors expect a recent, concrete scenario with actions and outcomes.",
    },
    {
      gap: "Escalation thresholds and multi-agency working were not described.",
      risk: "Children may stay at risk if referrals and challenge routes are unclear.",
      what_ofsted_expected: "Clear thresholds (MASH/LADO/police), documentation, and follow-through.",
    },
    {
      gap: "Impact and review cycle were unclear.",
      risk: "Practice may not improve and risks can repeat without regular QA.",
      what_ofsted_expected: "Describe audits/dip sampling, supervision challenge, and trend analysis.",
    },
  ];
  return items.slice(0, 2).map((item, idx) => ({
    evidence: [refs[idx % refs.length].id],
    gap: item.gap,
    risk: item.risk,
    what_ofsted_expected: item.what_ofsted_expected,
  }));
};

const fallbackSentenceImprovements = (sentences: Sentence[]): EvalV2["sentence_improvements"] => {
  const refs = sentences.length ? sentences : [{ id: "S1", text: "No answer provided." }];
  const templates = [
    {
      issue: "Too generic; lacks a concrete safeguarding example.",
      better: "Reference a recent incident, action taken, and impact for the child.",
      synonyms: ["for example", "specifically", "in one case", "for instance"],
      impact: "Shows credibility and lived practice inspectors can trust.",
    },
    {
      issue: "No escalation or threshold described.",
      better: "Name who you escalated to (MASH/LADO/police) and why.",
      synonyms: ["escalated to", "consulted with", "referred to", "notified"],
      impact: "Demonstrates safeguarding pathways and professional challenge.",
    },
    {
      issue: "Impact and review missing.",
      better: "State how you checked effectiveness (audit, supervision) and outcomes.",
      synonyms: ["monitored", "reviewed", "dip-sampled", "analysed"],
      impact: "Proves practice is monitored and improving over time.",
    },
  ];

  return templates.map((tpl, idx) => {
    const sentence = refs[idx % refs.length];
    return {
      sentence_id: sentence.id,
      original: sentence.text,
      issue: tpl.issue,
      better_version: tpl.better,
      synonyms_or_phrases: tpl.synonyms.slice(0, 5),
      impact: tpl.impact,
    };
  });
};

const fallbackMissingKeyPoints = (): string[] => [
  "Name a recent safeguarding incident and what changed for the child.",
  "State escalation routes (MASH/LADO/police) and thresholds you use.",
  "Explain how you check effectiveness (audit, supervision, trend analysis).",
  "Reference the child's voice and how it influenced decisions.",
];

const fallbackFollowUps = (): EvalV2["follow_up_questions"] => [
  {
    question: "Can you walk through a recent safeguarding incident and what you changed afterwards?",
    why: "No concrete example was provided.",
    what_good_looks_like: "Timeline, actions, escalation, outcome for the child, and review.",
  },
  {
    question: "Who do you escalate to and how do you challenge if there is delay?",
    why: "Escalation and professional challenge were unclear.",
    what_good_looks_like: "Named roles (MASH/LADO/police), thresholds, and evidence of follow-up.",
  },
  {
    question: "How do you know your actions reduced the risk for the child?",
    why: "Impact and review cadence were missing.",
    what_good_looks_like: "Dip sampling, supervision, audits, and measurable change for the child.",
  },
  {
    question: "How did the child's voice influence your decision or plan?",
    why: "Child's lived experience was not explicit.",
    what_good_looks_like: "Direct quotes or feedback and how you adapted the plan.",
  },
];

const ensureStrengthList = (val: unknown, sentences: Sentence[]): EvalV2["strengths"] => {
  const refs = sentences.length ? sentences : [{ id: "S1", text: "No answer provided." }];
  const items = ensureArray<{ evidence?: unknown; what_worked?: unknown; why_it_matters_to_ofsted?: unknown }>(val);
  const normalized = items
    .map((item, idx) => ({
      evidence: ensureEvidence(item?.evidence, refs, idx),
      what_worked: safeText(item?.what_worked, "No clear strength provided."),
      why_it_matters_to_ofsted: safeText(
        item?.why_it_matters_to_ofsted,
        "Explain why this protects children or assures quality.",
      ),
    }))
    .filter((s) => s.what_worked.trim().length > 0);

  const withFallback = normalized.length >= 2 ? normalized : [...normalized, ...fallbackStrengths(refs)];
  return withFallback.slice(0, Math.max(2, withFallback.length));
};

const ensureWeaknessList = (val: unknown, sentences: Sentence[]): EvalV2["weaknesses"] => {
  const refs = sentences.length ? sentences : [{ id: "S1", text: "No answer provided." }];
  const items = ensureArray<{ evidence?: unknown; gap?: unknown; risk?: unknown; what_ofsted_expected?: unknown }>(val);
  const normalized = items
    .map((item, idx) => ({
      evidence: ensureEvidence(item?.evidence, refs, idx),
      gap: safeText(item?.gap, "Gap not described."),
      risk: safeText(item?.risk, "Risk not stated."),
      what_ofsted_expected: safeText(
        item?.what_ofsted_expected,
        "State what Ofsted expected (process, evidence, impact, review).",
      ),
    }))
    .filter((w) => w.gap.trim().length > 0 || w.risk.trim().length > 0);

  const withFallback = normalized.length >= 2 ? normalized : [...normalized, ...fallbackWeaknesses(refs)];
  return withFallback.slice(0, Math.max(2, withFallback.length));
};

const ensureSentenceImprovementsList = (val: unknown, sentences: Sentence[]): EvalV2["sentence_improvements"] => {
  const refs = sentences.length ? sentences : [{ id: "S1", text: "No answer provided." }];
  const items = ensureArray<{
    sentence_id?: unknown;
    original?: unknown;
    issue?: unknown;
    better_version?: unknown;
    synonyms_or_phrases?: unknown;
    impact?: unknown;
  }>(val);
  const normalized = items
    .map((item, idx) => {
      const fallbackSentence = refs[idx % refs.length];
      const sentenceId = safeText(item?.sentence_id, fallbackSentence.id);
      const sentence = refs.find((s) => s.id === sentenceId) ?? fallbackSentence;
      const synonyms = ensureArray<string>(item?.synonyms_or_phrases)
        .map((s) => safeText(s, "").trim())
        .filter(Boolean);
      const paddedSynonyms =
        synonyms.length >= 2
          ? synonyms.slice(0, 5)
          : [...synonyms, "in practice", "for example"].slice(0, 5);

      return {
        sentence_id: sentence.id,
        original: safeText(item?.original, sentence.text),
        issue: safeText(item?.issue, "Clarity issue not described."),
        better_version: safeText(
          item?.better_version,
          "Add a concrete example with action, escalation, and impact.",
        ),
        synonyms_or_phrases: paddedSynonyms,
        impact: safeText(item?.impact, "Make clear how this improves safeguarding or outcomes."),
      };
    })
    .filter((s) => s.original.trim().length > 0);

  const fallback = fallbackSentenceImprovements(refs);
  const withFallback = normalized.length >= 3 ? normalized : [...normalized, ...fallback];
  return withFallback.slice(0, Math.max(3, withFallback.length));
};

const ensureMissingKeyPointsList = (val: unknown): EvalV2["missing_key_points"] => {
  const items = ensureArray<unknown>(val).map((v) => safeText(v, "")).filter(Boolean);
  const fallback = fallbackMissingKeyPoints();
  const merged = items.length >= 3 ? items : [...items, ...fallback];
  return merged.slice(0, 7);
};

const ensureFollowUpQuestionsList = (val: unknown): EvalV2["follow_up_questions"] => {
  const items = ensureArray<{ question?: unknown; why?: unknown; what_good_looks_like?: unknown }>(val)
    .map((q) => ({
      question: safeText(q?.question, ""),
      why: safeText(q?.why, ""),
      what_good_looks_like: safeText(q?.what_good_looks_like, ""),
    }))
    .filter((q) => q.question.length > 0);

  const fallback = fallbackFollowUps();
  const merged = items.length >= 4 ? items : [...items, ...fallback];
  return merged.slice(0, 6);
};

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

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return json(500, { error: "OPENAI_API_KEY is not set" });

  try {
    const body = await req.json().catch(() => ({}));
    const question = (body?.question || "").toString().trim();
    const questionArea = (body?.question_area || question).toString().trim();
    const transcript = (body?.transcript || "").toString().trim();
    const contextExtracts = (body?.context_extracts || "").toString().trim();
    const plan = (body?.plan || "free").toString().toLowerCase();

    if (!question || !transcript) {
      return json(400, { error: "Missing question or transcript" });
    }

    const sentences = splitSentences(transcript);
    const numberedSentences = sentences.length
      ? sentences.map((s) => `${s.id}: ${s.text}`).join("\n")
      : "S1: No answer provided.";

    const rubricChecklist = [
      "- Risk identification: patterns, triggers, early warning signs.",
      "- Risk assessment: clarity of tools, ownership, updates after incidents.",
      "- Risk management in/out of home: controls, staff direction, partnership working.",
      "- Safeguarding response: escalation routes (MASH/LADO/police), thresholds, timescales.",
      "- Effectiveness checks: QA, audits/dip samples, supervision challenge, data trends.",
      "- Child's voice and impact: lived experience, feedback, outcomes, adjustments.",
    ].join("\n");

    const ofstedLens =
      "Ofsted-style lens: safeguarding; risk assessment; outcomes/impact; QA/audit; staff oversight; recording; multi-agency working; child's voice; learning/reflective practice.";

    const system = `You are grading a manager's spoken answer to an Ofsted SCCIF children's homes inspection question.
Return STRICT JSON only (no markdown, no prose) matching this shape:
{
  "score": number, // 0-100
  "band": "Inadequate" | "Requires Improvement" | "Good" | "Outstanding",
  "summary": string,
  "strengths": Array<{ evidence: string[]; what_worked: string; why_it_matters_to_ofsted: string }>,
  "weaknesses": Array<{ evidence: string[]; gap: string; risk: string; what_ofsted_expected: string }>,
  "sentence_improvements": Array<{
    sentence_id: string;
    original: string;
    issue: string;
    better_version: string;
    synonyms_or_phrases: string[];
    impact: string;
  }>,
  "missing_key_points": string[],
  "follow_up_questions": Array<{ question: string; why: string; what_good_looks_like: string }>
}
Rules:
- Use only the numbered sentences (S1..Sn) for evidence references; every strength/weakness evidence must include at least one S#.
- Minimum counts: strengths >=2, weaknesses >=2, sentence_improvements >=3 (must cite real sentences), missing_key_points >=3, follow_up_questions >=4.
- Be specific and evidence-based; avoid generic statements.
- Band must align to the evidence; if unsafe/unclear practice is evident, select Inadequate. If generic/no evidence, cap at Requires Improvement.
- Keep JSON valid; no extra commentary.
Rubric checklist:
${rubricChecklist}
${ofstedLens}
`.trim();

    const user = `
CONTEXT EXTRACTS (authoritative):
${contextExtracts || "(none provided)"}

QUESTION:
${question}

CANDIDATE ANSWER (verbatim):
${transcript}

NUMBERED SENTENCES (use these IDs in evidence):
${numberedSentences}
`.trim();

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const raw = await resp.text();
    if (!resp.ok) {
      return json(502, { error: "OpenAI evaluate failed", status: resp.status, details: raw });
    }

    let parsed: unknown;
    try {
      const data = JSON.parse(raw);
      const content = (data as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? "";
      parsed = JSON.parse(content || "{}");
    } catch {
      return json(502, { error: "Bad model JSON", details: raw.slice(0, 2000) });
    }

    const parsedObj = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : {};
    const safeEval: EvalV2 = {
      score: clampScore((parsedObj as { score?: unknown }).score),
      band: normalizeBand((parsedObj as { band?: unknown }).band),
      summary: safeText(
        (parsedObj as { summary?: unknown }).summary,
        "No summary provided. Summarise the evidence, escalation, impact, and review cadence.",
      ),
      strengths: ensureStrengthList((parsedObj as { strengths?: unknown }).strengths, sentences),
      weaknesses: ensureWeaknessList((parsedObj as { weaknesses?: unknown }).weaknesses, sentences),
      sentence_improvements: ensureSentenceImprovementsList(
        (parsedObj as { sentence_improvements?: unknown }).sentence_improvements,
        sentences,
      ),
      missing_key_points: ensureMissingKeyPointsList(
        (parsedObj as { missing_key_points?: unknown }).missing_key_points,
      ),
      follow_up_questions: ensureFollowUpQuestionsList(
        (parsedObj as { follow_up_questions?: unknown }).follow_up_questions,
      ),
    };

    const score4 = Math.max(0, Math.min(4, Math.round((safeEval.score / 25) * 10) / 10));
    const response = {
      ...safeEval,
      band: allowedBands.includes(safeEval.band) ? safeEval.band : "Requires Improvement",
      score4,
      judgement_band: safeEval.band,
      original_answer: transcript,
      sentences,
      question,
      question_area: questionArea || "General",
      plan,
      debug: { model_raw: parsedObj },
    };

    return json(200, response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return json(message.includes("aborted") ? 504 : 500, { error: "Evaluate error", message });
  }
});
