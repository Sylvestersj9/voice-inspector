import { supabase } from "@/lib/supabase";
import type { InspectionSession } from "./types";
import { logAudit } from "@/audit/logAudit";

// Inserts a new inspection session owned by userId
export async function startInspection(userId: string, title: string | null = null): Promise<InspectionSession> {
  const { data, error } = await supabase
    .from("inspection_sessions")
    .insert({
      created_by: userId,
      status: "draft",
      title,
    })
    .select("*")
    .single();

  if (error) throw error;
  const session = data as InspectionSession;

  // Fire-and-forget audit
  logAudit({
    actorId: userId,
    action: "inspection_started",
    entityType: "inspection_session",
    entityId: session.id,
    metadata: { status: session.status },
  });

  return session;
}
