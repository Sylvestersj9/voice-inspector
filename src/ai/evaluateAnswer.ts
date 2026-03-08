import type { InspectionSessionQuestion } from "@/framework/types";
import type { InspectionAnswer } from "@/answers/types";
import type { InspectionEvaluation, EvaluationBand } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type EvaluateAnswerInput = {
  sessionQuestion: InspectionSessionQuestion;
  answer: InspectionAnswer | null;
};

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<InspectionEvaluation | null> {
  if (!input.answer) return null;

  const inputMode: "voice" | "text" = input.answer.transcript ? "voice" : "text";

  const res = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      domain: input.sessionQuestion.domain_name || "",
      question: input.sessionQuestion.question_text || "",
      answerText: input.answer.answer_text || "",
      transcript: input.answer.transcript || "",
      inputMode,
      ragContext: "",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evaluate edge function error: ${res.status} ${text.slice(0, 500)}`);
  }

  const parsed = await res.json();

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.filter(Boolean).join("\n")
    : "";
  const gaps = Array.isArray(parsed.gaps)
    ? parsed.gaps.filter(Boolean).join("\n")
    : "";
  const follow_up_questions = Array.isArray(parsed.follow_up_questions)
    ? parsed.follow_up_questions.filter(Boolean).join("\n")
    : "";

  const payload = {
    inspection_session_question_id: input.sessionQuestion.id,
    score: parsed.score ?? 0,
    band: (parsed.band || "Inadequate") as EvaluationBand,
    strengths,
    gaps,
    follow_up_questions,
  };

  console.log("INSERTING INTO inspection_evaluations", payload);

  const { data: row, error } = await (supabase as any)
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

  return row as unknown as InspectionEvaluation;
}
