export type ReportBand = "Inadequate" | "Requires Improvement" | "Good" | "Outstanding";

export type InspectionReport = {
  id: string;
  inspection_session_id: string;
  overall_score: number;
  overall_band: ReportBand;
  strengths: string;
  key_risks: string;
  recommended_actions: string;
  created_at: string;
};
