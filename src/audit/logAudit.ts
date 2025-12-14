import { supabase } from "@/lib/supabase";
import type { AuditAction } from "./types";

type LogAuditInput = {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
};

// Fire-and-forget audit logger. Never throws; warns on failure.
export async function logAudit(input: LogAuditInput) {
  if (!input.actorId) return;
  try {
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      console.warn("audit log insert error:", error.message);
    }
  } catch (err) {
    console.warn("audit log failed:", err);
  }
}
