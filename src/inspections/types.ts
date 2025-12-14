export type InspectionStatus = "draft" | "in_progress" | "submitted";

export interface InspectionSession {
  id: string;
  created_by: string;
  status: InspectionStatus;
  title: string | null;
  created_at: string;
}
