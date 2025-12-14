export type EvaluationBand =
  | "Inadequate"
  | "Requires Improvement"
  | "Good"
  | "Outstanding";

export type InspectionEvaluation = {
  id: string;
  inspection_session_question_id: string;
  score: number;
  band: EvaluationBand;
  strengths: string;
  gaps: string;
  follow_up_questions: string;
  created_at: string;
};
