import { supabase } from "@/lib/supabase";
import type { InspectionSessionQuestion } from "@/framework/types";
import type { InspectionAnswer } from "./types";

type QuestionWithAnswer = InspectionSessionQuestion & {
  answer: InspectionAnswer | null;
};

export async function getAnswersForSession(inspectionSessionId: string): Promise<QuestionWithAnswer[]> {
  const { data, error } = await supabase
    .from("inspection_session_questions")
    .select(
      `
      id,
      inspection_session_id,
      domain_name,
      question_text,
      guidance,
      sort_order,
      inspection_answers (
        id,
        inspection_session_question_id,
        answered_by,
        answer_text,
        transcript,
        evidence_notes,
        created_at,
        updated_at
      )
    `,
    )
    .eq("inspection_session_id", inspectionSessionId)
    .order("sort_order", { ascending: true });

  if (error || !data) throw error || new Error("Failed to fetch session questions");

  return (data as any[]).map((row) => ({
    id: row.id,
    inspection_session_id: row.inspection_session_id,
    domain_name: row.domain_name,
    question_text: row.question_text,
    guidance: row.guidance,
    sort_order: row.sort_order,
    answer: row.inspection_answers?.[0] || null,
  }));
}
