import { buildEvaluationPrompt } from "./prompt";
import type { InspectionSessionQuestion } from "@/framework/types";
import type { InspectionAnswer } from "@/answers/types";
import type { InspectionEvaluation, EvaluationBand } from "./types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

const bandFromScore = (score: number): EvaluationBand => {
  if (score >= 10) return "Outstanding";
  if (score >= 7) return "Good";
  if (score >= 4) return "Requires Improvement";
  return "Inadequate";
};

type EvaluateAnswerInput = {
  sessionQuestion: InspectionSessionQuestion;
  answer: InspectionAnswer | null;
};

function isInsufficientAnswer(question: string, answerText: string, transcript: string) {
  const q = (question || "").toLowerCase();
  const text = (answerText || "").trim();
  const trans = (transcript || "").trim();
  const combined = (text || trans).toLowerCase();

  if (!combined) return true;
  if (combined.length < 25) return true;

  // Simple overlap check: if combined mostly echoes the question words
  const qWords = new Set(q.split(/\s+/).filter((w) => w.length > 3));
  const aWords = combined.split(/\s+/).filter((w) => w.length > 3);
  const overlap = aWords.filter((w) => qWords.has(w)).length;
  if (qWords.size > 0 && overlap / Math.max(1, aWords.length) > 0.6) return true;

  const signals = /(record|review|risk|assessment|safety plan|care plan|supervision|audit|pep|health plan|key work|placing authority|outcomes|tracking)/i;
  if (!signals.test(combined) && combined.length < 80) return true;

  return false;
}

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<InspectionEvaluation | null> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (!input.answer) return null; // nothing to evaluate

  const inputMode: "voice" | "text" = input.answer.transcript ? "voice" : "text";

  // Quality gate
  const insufficient = isInsufficientAnswer(
    input.sessionQuestion.question_text || "",
    input.answer.answer_text || "",
    input.answer.transcript || "",
  );

  if (insufficient) {
    const strengths = "";
    const gaps = ["Answer did not address the question", "No evidence/examples provided"].join("\n");
    const follow_up_questions = [
      "Share one concrete example with evidence of what you did.",
      "Describe the impact or outcome and how you know it worked.",
    ].join("\n");

    const payload = {
      inspection_session_question_id: input.sessionQuestion.id,
      score: 0,
      band: "Inadequate" as EvaluationBand,
      strengths,
      gaps,
      follow_up_questions,
    };
    console.log("INSERTING INTO inspection_evaluations (insufficient)", payload);

    const { data: row, error } = await supabase
      .from("inspection_evaluations")
      .upsert(payload, { onConflict: "inspection_session_question_id" })
      .select("*")
      .single();

    console.log("INSERT RESULT inspection_evaluations (insufficient)", { data: row, error });

    if (error || !row) {
      console.error("SUPABASE SAVE FAILED", error);
      if (error?.message) toast({ title: "Save failed", description: error.message, variant: "destructive" });
      throw error || new Error("Failed to upsert evaluation");
    }
    console.log("Saved evaluation", input.sessionQuestion.id);
    return row as InspectionEvaluation;
  }

  const prompt = buildEvaluationPrompt({
    domainName: input.sessionQuestion.domain_name,
    questionText: input.sessionQuestion.question_text,
    guidance: input.sessionQuestion.guidance,
    answerText: input.answer.answer_text || "",
    transcript: input.answer.transcript || "",
    evidenceNotes: input.answer.evidence_notes || "",
    inputMode,
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an Ofsted inspector. Respond only with the required JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`LLM error: ${res.status} ${raw.slice(0, 500)}`);
  }

  let parsed: unknown;
  try {
    const data = JSON.parse(raw);
    const content = (data as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? "";
    parsed = JSON.parse(content || "{}");
  } catch (err) {
    throw new Error("Failed to parse LLM JSON");
  }

  const parsedObj = (parsed && typeof parsed === "object") ? parsed as Record<string, unknown> : {};
  const dimensions = (parsedObj.dimension_scores && typeof parsedObj.dimension_scores === "object")
    ? (parsedObj.dimension_scores as Record<string, unknown>)
    : {};
  const dimVals = [
    Number(dimensions.safeguarding) || 0,
    Number(dimensions.evidence) || 0,
    Number(dimensions.impact) || 0,
    Number(dimensions.reflection) || 0,
  ].map((n: number) => Math.max(0, Math.min(3, Math.round(n))));
  const totalScore = dimVals.reduce((a: number, b: number) => a + b, 0);
  let score = Math.max(0, Math.min(12, Number(parsedObj?.score ?? totalScore)));
  // ensure score matches dimensions sum
  score = totalScore;

  let band: EvaluationBand = bandFromScore(score);
  const redFlags: string[] = Array.isArray((parsedObj as { red_flags?: unknown }).red_flags)
    ? (parsedObj as { red_flags?: unknown }).red_flags.filter(Boolean).map((s: unknown) => String(s))
    : [];

  // guardrails
  if (redFlags.length > 0 && band === "Outstanding") band = "Requires Improvement";
  if (redFlags.length > 0 && band === "Good") band = "Requires Improvement";
  const [saf, evid, impact] = dimVals;
  if (redFlags.length === 0 && saf >= 2 && evid >= 2 && impact >= 2 && band === "Requires Improvement") {
    band = "Good";
    score = Math.max(score, 7);
  }

  const normaliseList = (val: unknown, max: number, min: number) => {
    const arr = Array.isArray(val) ? val : val ? [val] : [];
    const trimmed = arr.filter(Boolean).map((s) => String(s).trim()).filter(Boolean).slice(0, max);
    while (trimmed.length < min) trimmed.push("");
    return trimmed.filter(Boolean);
  };

  const strengths = normaliseList(parsedObj?.strengths, 4, 0).join("\n");
  const gaps = normaliseList(parsedObj?.gaps, 4, 0).join("\n");
  const follow_up_questions = normaliseList(parsedObj?.follow_up_questions, 4, 0).join("\n");

  const payload = {
    inspection_session_question_id: input.sessionQuestion.id,
    score,
    band,
    strengths,
    gaps,
    follow_up_questions,
  };

  console.log("INSERTING INTO inspection_evaluations", payload);

  const { data: row, error } = await supabase
    .from("inspection_evaluations")
    .upsert(payload, { onConflict: "inspection_session_question_id" })
    .select("*")
    .single();

  console.log("INSERT RESULT inspection_evaluations", { data: row, error });

  if (error || !row) {
    console.error("SUPABASE SAVE FAILED", error);
    if (error?.message) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    throw error || new Error("Failed to upsert evaluation");
  }
  console.log("Saved evaluation", input.sessionQuestion.id);

  return row as InspectionEvaluation;
}
