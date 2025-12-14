import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StrictnessProfile = {
  minWords: number;
  requireEscalationForGood: boolean;
  requireEscalationForOutstanding: boolean;
  evidenceHitsGood: number;
  evidenceHitsOutstanding: number;
};

const STRICTNESS: Record<string, StrictnessProfile> = {
  safeguarding: {
    minWords: 140,
    requireEscalationForGood: true,
    requireEscalationForOutstanding: true,
    evidenceHitsGood: 4,
    evidenceHitsOutstanding: 6,
  },
  leadership: {
    minWords: 110,
    requireEscalationForGood: false,
    requireEscalationForOutstanding: false,
    evidenceHitsGood: 3,
    evidenceHitsOutstanding: 5,
  },
  care: {
    minWords: 120,
    requireEscalationForGood: false,
    requireEscalationForOutstanding: false,
    evidenceHitsGood: 3,
    evidenceHitsOutstanding: 5,
  },
};

serve(async (req: Request) => {
  // ---------- CORS ----------
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // ---------- ENV ----------
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return json(500, { error: "OPENAI_API_KEY is not set" });

  // ---------- Helpers ----------
  const normalizeBand = (band: string) => {
    const b = (band || "").toLowerCase().trim();
    if (b.includes("outstanding")) return "Outstanding";
    if (b === "good" || b.includes(" good")) return "Good";
    if (b.includes("requires")) return "Requires improvement to be good";
    if (b.includes("inadequate")) return "Inadequate";
    return "Requires improvement to be good";
  };

  const bandToScore4 = (band: string) => {
    const b = normalizeBand(band);
    if (b === "Outstanding") return 4;
    if (b === "Good") return 3;
    if (b === "Requires improvement to be good") return 2;
    return 1;
  };

  const downgrade = (band: string, target: string) => {
    const order = ["Inadequate", "Requires improvement to be good", "Good", "Outstanding"];
    const cur = normalizeBand(band);
    const tar = normalizeBand(target);
    return order.indexOf(cur) > order.indexOf(tar) ? tar : cur;
  };

  const textish = (v: any) => (typeof v === "string" ? v : v ? JSON.stringify(v) : "");

  // checks: simplistic but effective “caps” enforcement
  const getEvidenceHits = (obj: any) => {
    const fields: string[] = [];
    try {
      const rubric = obj?.rubric || {};
      for (const k of Object.keys(rubric)) {
        fields.push(textish(rubric?.[k]?.evidence));
      }
      fields.push(textish(obj?.rationale));
    } catch {
      // ignore
    }
    const combined = fields.join(" ").toLowerCase();
    const signals = [
      "audit",
      "dip sample",
      "supervision",
      "team meeting",
      "trend",
      "analysis",
      "mash",
      "lado",
      "strategy meeting",
      "threshold",
      "referral",
      "safeguarding lead",
      "local authority",
      "missing",
      "episode",
      "risk assessment",
      "review",
      "updated",
      "incident",
      "debrief",
      "learning",
      "outcome",
      "impact",
      "child said",
      "feedback",
    ];
    const hits = signals.filter((s) => combined.includes(s)).length;
    return hits;
  };

  const hasSafeguardingEscalation = (obj: any) => {
    const combined = (
      textish(obj?.rubric?.safeguarding_response?.evidence) +
      " " +
      textish(obj?.rationale)
    ).toLowerCase();
    return (
      combined.includes("mash") ||
      combined.includes("lado") ||
      combined.includes("referral") ||
      combined.includes("local authority") ||
      combined.includes("strategy") ||
      combined.includes("threshold") ||
      combined.includes("section 47") ||
      combined.includes("safeguarding referral") ||
      combined.includes("multi-agency") ||
      combined.includes("escalation") ||
      combined.includes("professional disagreement")
    );
  };

  const hasEffectivenessChecks = (obj: any) => {
    const combined = (
      textish(obj?.rubric?.effectiveness_checks?.evidence) +
      " " +
      textish(obj?.rationale)
    ).toLowerCase();
    return (
      combined.includes("audit") ||
      combined.includes("dip sample") ||
      combined.includes("review") ||
      combined.includes("trend") ||
      combined.includes("analysis") ||
      combined.includes("learning")
    );
  };

  const hasImpact = (obj: any) => {
    const combined = (
      textish(obj?.rubric?.child_voice_impact?.evidence) +
      " " +
      textish(obj?.rationale)
    ).toLowerCase();
    return (
      combined.includes("impact") ||
      combined.includes("outcome") ||
      combined.includes("reduced") ||
      combined.includes("improved") ||
      combined.includes("children feel") ||
      combined.includes("child said")
    );
  };

  try {
    const body = await req.json().catch(() => ({}));
    const question = (body?.question || "").toString().trim();
    const questionArea = (body?.question_area || question).toString().trim();
    const transcript = (body?.transcript || "").toString().trim();
    const contextExtracts = (body?.context_extracts || "").toString();
    const plan = (body?.plan || "free").toString().toLowerCase();

    if (!question || !transcript) {
      return json(400, { error: "Missing question or transcript" });
    }

    const areaKey =
      questionArea.toLowerCase().includes("safeguard") ? "safeguarding" :
      questionArea.toLowerCase().includes("leader") ? "leadership" :
      "care";
    const strictness = STRICTNESS[areaKey] || STRICTNESS.care;

    const system = `
You are grading a manager’s spoken answer to an Ofsted SCCIF children's homes inspection question.

Use the 4-point SCCIF scale only:
- Outstanding
- Good
- Requires improvement to be good
- Inadequate

HARD RULES (must follow):
- If the answer is generic/waffle and lacks specific evidence (process + example + how effectiveness is checked), the overall judgement cannot be above "Requires improvement to be good".
- If safeguarding escalation/referral routes are missing/unclear (e.g., thresholds, LA/MASH, LADO where relevant), cap at "Requires improvement to be good".
- If the answer indicates unsafe/illegal practice, minimise concerns, or shows weak safeguarding culture, the overall judgement must be "Inadequate".
- Do not reward confident tone. Reward specific, credible practice and impact on children’s safety, experiences and progress.
- If details are missing, explicitly state what is missing and lower the judgement accordingly.
- You must return at least 3 strengths, 3 weaknesses, and 3 recommendations. If evidence is limited, state that explicitly in weaknesses.
- Weaknesses are mandatory (never empty). If evidence is missing, convert missing elements into explicit weaknesses (e.g., "No examples provided", "No escalation routes described", "No effectiveness monitoring explained"). Follow-up questions must directly probe the identified weaknesses (one or more per weakness).
- Tailor weaknesses to the question area:
  * Safeguarding/Risk: lack of specific incidents/examples, unclear escalation (LA/MASH/LADO/police thresholds), no review/learning/impact on safety, no child voice.
  * Leadership/Management: weak oversight/QA/challenge, no learning from incidents/audits, missing supervision/performance management.
  * Care/Outcomes/Practice: weak care planning/review/adjustment, no impact on children’s safety/wellbeing, no child voice/lived experience.

Return JSON ONLY in exactly this shape:
{
  "question_area": "...",
  "overall_judgement": "Outstanding|Good|Requires improvement to be good|Inadequate",
  "rationale": "...",
  "rubric": {
    "risk_identification": {"band":"...", "evidence":"...", "missing":"..."},
    "risk_assessment": {"band":"...", "evidence":"...", "missing":"..."},
    "risk_management_in_out": {"band":"...", "evidence":"...", "missing":"..."},
    "safeguarding_response": {"band":"...", "evidence":"...", "missing":"..."},
    "effectiveness_checks": {"band":"...", "evidence":"...", "missing":"..."},
    "child_voice_impact": {"band":"...", "evidence":"...", "missing":"..."}
  },
  "follow_up_questions": ["...", "...", "..."],
  "next_actions": ["...", "...", "..."]
}
`.trim();

    const user = `
CONTEXT EXTRACTS (authoritative):
${contextExtracts || "(none provided)"}

QUESTION:
${question}

CANDIDATE ANSWER (transcript):
${transcript}
`.trim();

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.2,
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

    let parsed: any;
    try {
      const data = JSON.parse(raw);
      const content = data?.choices?.[0]?.message?.content ?? "";
      parsed = JSON.parse(content);
    } catch {
      return json(502, { error: "Bad model JSON", details: raw.slice(0, 2000) });
    }

    parsed.overall_judgement = normalizeBand(parsed?.overall_judgement);

    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.weaknesses) || parsed.weaknesses.length === 0) {
      parsed.weaknesses = [
        "No specific examples were provided to demonstrate practice.",
        "Key safeguarding or management processes were not clearly explained.",
        "There was no evidence of review, learning, or impact on outcomes for children.",
      ];
    }
    if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];
    if (!parsed.rubric || typeof parsed.rubric !== "object") parsed.rubric = {};

    if (!Array.isArray(parsed.follow_up_questions) || parsed.follow_up_questions.length === 0) {
      parsed.follow_up_questions = [
        "Can you give a recent, specific example of this in practice?",
        "Who would you escalate this to, and why?",
        "How do you know this approach is effective?",
      ];
    }

    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    const transcriptLower = transcript.toLowerCase();
    const hasEffectivenessText =
      /audit|dip sample|quality assurance|qa|monitor|trend|analysis|supervision|review|learning|outcome|impact|children feel/.test(
        transcriptLower,
      );

    const hasEscalationText =
      /mash|lado|referral|local authority|strategy meeting|threshold|section 47|multi-agency|escalat/.test(
        transcriptLower,
      );

    const evidenceHits = getEvidenceHits(parsed);
    const evidenceOk = evidenceHits >= strictness.evidenceHitsGood;
    const escalationOk = hasSafeguardingEscalation(parsed);
    const effectivenessOk = hasEffectivenessChecks(parsed);
    const impactOk = hasImpact(parsed);
    const hasEscalation = hasEscalationText || escalationOk;
    const hasEffectiveness = hasEffectivenessText || effectivenessOk;

    // Strictness-based caps
    if (wordCount < strictness.minWords) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    }

    // General word-count shaping
    if (wordCount < 120) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    } else if (wordCount >= 120 && wordCount < 220) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Good");
    }

    if (!hasEffectivenessText) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    }

    if (strictness.requireEscalationForGood && !hasEscalation) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    }

    if (strictness.requireEscalationForOutstanding && !hasEscalation) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Good");
    }

    if (!hasEscalationText) {
      parsed.overall_judgement = downgrade(parsed.overall_judgement, "Good");
    }

    if (!evidenceOk) parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    if (!escalationOk) parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    if (!effectivenessOk) parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");
    if (!impactOk) parsed.overall_judgement = downgrade(parsed.overall_judgement, "Requires improvement to be good");

    let confidence: "borderline" | "secure" | "strong" = "secure";
    const scoreSignals = [
      wordCount >= strictness.minWords,
      hasEscalation,
      hasEffectiveness,
      impactOk,
      evidenceHits >= strictness.evidenceHitsGood,
    ].filter(Boolean).length;
    if (scoreSignals <= 2) confidence = "borderline";
    if (scoreSignals >= 4) confidence = "strong";

    const outstandingSignals =
      hasEscalation &&
      hasEffectiveness &&
      impactOk &&
      wordCount >= 220 &&
      evidenceHits >= strictness.evidenceHitsOutstanding;
    if (outstandingSignals) {
      parsed.overall_judgement = "Outstanding";
    }

    if (
      parsed.overall_judgement === "Good" &&
      evidenceOk &&
      effectivenessOk &&
      wordCount >= 200
    ) {
      parsed.overall_judgement = "Good";
    }

    if (plan === "free" && parsed.overall_judgement === "Outstanding") {
      parsed.overall_judgement = "Good";
      confidence = "strong";
      (parsed as any).note = "Upgrade to unlock Outstanding judgements and advanced coaching.";
    }

    const score4 = bandToScore4(parsed.overall_judgement);

    return json(200, {
      ...parsed,
      score4,
      confidence_band: confidence,
      debug: {
        evidenceOk,
        escalationOk,
        effectivenessOk,
        impactOk,
        wordCount,
        hasEffectivenessText,
        hasEscalationText,
        evidenceHits,
        areaKey,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return json(message.includes("aborted") ? 504 : 500, { error: "Evaluate error", message });
  }
});
