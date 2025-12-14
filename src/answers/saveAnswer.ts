import { supabase } from "@/lib/supabase";
import { logAudit } from "@/audit/logAudit";
import type { InspectionAnswer } from "./types";

type SaveAnswerInput = {
  sessionQuestionId: string;
  profileId: string;
  answerText?: string | null;
  transcript?: string | null;
  evidenceNotes?: string | null;
};

// Upsert an answer for a session question; one answer per question.
// Permission/ownership checks should be applied by caller.
export async function saveAnswer(input: SaveAnswerInput): Promise<InspectionAnswer> {
  const { data, error } = await supabase
    .from("inspection_answers")
    .upsert(
      {
        inspection_session_question_id: input.sessionQuestionId,
        answered_by: input.profileId,
        answer_text: input.answerText ?? null,
        transcript: input.transcript ?? null,
        evidence_notes: input.evidenceNotes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "inspection_session_question_id" },
    )
    .select("*")
    .single();

  if (error || !data) throw error || new Error("Failed to save answer");

  // Fire-and-forget audit
  logAudit({
    actorId: input.profileId,
    action: "inspection_answered",
    entityType: "inspection_session_question",
    entityId: input.sessionQuestionId,
    metadata: {
      has_text: Boolean(input.answerText),
      has_transcript: Boolean(input.transcript),
      has_evidence: Boolean(input.evidenceNotes),
    },
  });

  return data as InspectionAnswer;
}
