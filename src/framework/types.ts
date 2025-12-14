export interface InspectionFramework {
  id: string;
  created_at: string;
  name: string;
  version: string;
  is_active: boolean;
}

export interface InspectionDomain {
  id: string;
  framework_id: string;
  name: string;
  sort_order: number;
}

export interface InspectionQuestion {
  id: string;
  domain_id: string;
  text: string;
  guidance: string | null;
  sort_order: number;
}

export interface InspectionSessionQuestion {
  id: string;
  inspection_session_id: string;
  domain_name: string;
  question_text: string;
  guidance: string | null;
  sort_order: number;
}
