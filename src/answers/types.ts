export type InspectionAnswer = {
  id: string;
  inspection_session_question_id: string;
  answered_by: string;
  answer_text?: string | null;
  transcript?: string | null;
  evidence_notes?: string | null;
  created_at: string;
  updated_at: string;
};
