export type SessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  overall_band: string | null;
  overall_score: number | null;
  responses: Array<{ domain: string }>;
};
