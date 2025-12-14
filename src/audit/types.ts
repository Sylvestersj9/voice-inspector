export type AuditAction =
  | "inspection_started"
  | "inspection_answered"
  | "inspection_submitted"
  | "inspection_reviewed"
  | "inspection_framework_snapshotted"
  | "inspection_evaluated"
  | "inspection_report_generated"
  | "inspection_report_exported"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_canceled"
  | "billing_action_blocked"
  | "login"
  | "logout";

export type AuditLog = {
  id: string;
  created_at: string;
  actor_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, any>;
};
