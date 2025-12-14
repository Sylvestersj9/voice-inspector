export type AuditAction =
  | "inspection_started"
  | "inspection_answered"
  | "inspection_submitted"
  | "inspection_reviewed"
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
