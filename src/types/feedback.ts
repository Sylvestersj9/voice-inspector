export type FeedbackType = "inspection" | "fit_person" | "practice";
export type FeedbackOutcome = "good" | "outstanding" | "requires_improvement" | "inadequate" | "passed" | "needs_work" | "preparing";

export interface InspectionFeedback {
  id: string;
  user_id: string;
  session_id?: string;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  outcome?: FeedbackOutcome;
  key_learning?: string;
  home_setting?: string;
  role_at_time?: string;
  is_public: boolean;
  is_anonymised: boolean;
  consent_to_share: boolean;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackFormData {
  feedbackType: FeedbackType;
  title: string;
  description: string;
  outcome?: FeedbackOutcome;
  keyLearning?: string;
  homeSetting?: string;
  roleAtTime?: string;
  sessionId?: string;
  isAnonymised: boolean;
  consentToShare: boolean;
}
