import { buildEvaluationPrompt } from "./prompt";
import type { InspectionSessionQuestion } from "@/framework/types";
import type { InspectionAnswer } from "@/answers/types";
import type { InspectionEvaluation, EvaluationBand } from "./types";
import { supabase } from "@/lib/supabase";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

const bandFromScore = (score: number): EvaluationBand => {
  if (score >= 4) return "Outstanding";
  if (score >= 3) return "Good";
  if (score >= 2) return "Requires Improvement";
  return "Inadequate";
};

type EvaluateAnswerInput = {
  sessionQuestion: InspectionSessionQuestion;
  answer: InspectionAnswer | null;
};

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<InspectionEvaluation | null> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (!input.answer) return null; // nothing to evaluate

  const prompt = buildEvaluationPrompt({
    domainName: input.sessionQuestion.domain_name,
    questionText: input.sessionQuestion.question_text,
    guidance: input.sessionQuestion.guidance,
    answerText: input.answer.answer_text || "",
    transcript: input.answer.transcript || "",
    evidenceNotes: input.answer.evidence_notes || "",
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

  let parsed: any;
  try {
    const data = JSON.parse(raw);
    const content = data?.choices?.[0]?.message?.content ?? "";
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error("Failed to parse LLM JSON");
  }

  const score = Math.max(1, Math.min(4, Number(parsed?.score) || 1));
  const band: EvaluationBand =
    parsed?.band === "Outstanding" ||
    parsed?.band === "Good" ||
    parsed?.band === "Requires Improvement" ||
    parsed?.band === "Inadequate"
      ? parsed.band
      : bandFromScore(score);

  const strengths = parsed?.strengths ? String(parsed.strengths) : "";
  const gaps = parsed?.gaps ? String(parsed.gaps) : "";
  const follow_up_questions = parsed?.follow_up_questions ? String(parsed.follow_up_questions) : "";

  const { data: row, error } = await supabase
    .from("inspection_evaluations")
    .upsert(
      {
        inspection_session_question_id: input.sessionQuestion.id,
        score,
        band,
        strengths,
        gaps,
        follow_up_questions,
      },
      { onConflict: "inspection_session_question_id" },
    )
    .select("*")
    .single();

  if (error || !row) throw error || new Error("Failed to upsert evaluation");

  return row as InspectionEvaluation;
}
