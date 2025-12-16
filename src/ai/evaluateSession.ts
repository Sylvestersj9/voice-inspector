import { supabase } from "@/lib/supabase";
import { evaluateAnswer } from "./evaluateAnswer";
import type { InspectionSessionQuestion } from "@/framework/types";
import type { InspectionAnswer } from "@/answers/types";
import { logAudit } from "@/audit/logAudit";

type QuestionRow = InspectionSessionQuestion & { inspection_answers?: InspectionAnswer[] | null };

export async function evaluateSession(inspectionSessionId: string) {
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

  let totalScore = 0;
  let evaluatedCount = 0;

  for (const row of data as QuestionRow[]) {
    const question: InspectionSessionQuestion = {
      id: row.id,
      inspection_session_id: row.inspection_session_id,
      domain_name: row.domain_name,
      question_text: row.question_text,
      guidance: row.guidance,
      sort_order: row.sort_order,
    };
    const answer: InspectionAnswer | null = row.inspection_answers?.[0] || null;
    if (!answer) continue;

    const evalResult = await evaluateAnswer({ sessionQuestion: question, answer });
    if (evalResult) {
      totalScore += evalResult.score;
      evaluatedCount += 1;
    }
  }

  const avgScore = evaluatedCount ? totalScore / evaluatedCount : 0;

  // Audit session evaluation
  logAudit({
    actorId: "ai",
    action: "inspection_evaluated",
    entityType: "inspection_session",
    entityId: inspectionSessionId,
    metadata: {
      evaluated_questions_count: evaluatedCount,
      avg_score: avgScore,
    },
  });

  return { evaluatedCount, avgScore };
}
