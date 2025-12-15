import { supabase } from "@/lib/supabase";
import type { InspectionSession } from "./types";
import { logAudit } from "@/audit/logAudit";
import { getActiveFramework } from "@/framework/getActiveFramework";
import { canStartInspection } from "@/billing/enforcement";
import { toast } from "@/hooks/use-toast";

// Inserts a new inspection session owned by userId and scoped to a home.
// Also snapshots the active framework's questions into inspection_session_questions.
export async function startInspection(
  userId: string,
  homeId: string,
  title: string | null = null,
  billing: { status: string | null; plan: string | null } = { status: null, plan: null },
): Promise<InspectionSession> {
  if (!canStartInspection({ billing })) {
    logAudit({
      actorId: userId,
      action: "billing_action_blocked",
      entityType: "inspection_session",
      entityId: null,
      metadata: { attempted_action: "start_inspection", plan: billing.plan, status: billing.status },
    });
    throw new Error("Your subscription is inactive. Please update billing to start inspections.");
  }

  const sessionPayload = {
    created_by: userId,
    status: "draft",
    home_id: homeId,
    title,
  };
  console.log("INSERTING INTO inspection_sessions", sessionPayload);

  const { data, error } = await supabase
    .from("inspection_sessions")
    .insert(sessionPayload)
    .select("*")
    .single();

  console.log("INSERT RESULT inspection_sessions", { data, error });

  if (error || !data) {
    console.error("SUPABASE SAVE FAILED", error);
    if (error?.message) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    throw error || new Error("Failed to start session");
  }
  const session = data as InspectionSession;
  console.log("Saved session", session.id);

  // Snapshot framework questions
  try {
    const { framework, domains, questions } = await getActiveFramework();
    const sessionQuestions = domains
      .flatMap((d) =>
        questions
          .filter((q) => q.domain_id === d.id)
          .map((q) => ({
            inspection_session_id: session.id,
            domain_name: d.name,
            question_text: q.text,
            guidance: q.guidance,
            sort_order: q.sort_order,
          })),
      );

    if (sessionQuestions.length > 0) {
      console.log("INSERTING INTO inspection_session_questions", sessionQuestions);
      const { data: sqData, error: sqError } = await supabase
        .from("inspection_session_questions")
        .insert(sessionQuestions);
      console.log("INSERT RESULT inspection_session_questions", { data: sqData, error: sqError });
      if (sqError) {
        console.error("SUPABASE ERROR inspection_session_questions", sqError);
        if (sqError?.message) toast({ title: "Save failed", description: sqError.message, variant: "destructive" });
      }
    }

    // Audit snapshot
    logAudit({
      actorId: userId,
      action: "inspection_framework_snapshotted",
      entityType: "inspection_session",
      entityId: session.id,
      metadata: { framework_name: framework.name, framework_version: framework.version },
    });
  } catch (snapshotErr) {
    // Allow inspection creation even if snapshot fails; log for visibility
    console.warn("Snapshot failed:", snapshotErr);
  }

  // Fire-and-forget audit for start
  logAudit({
    actorId: userId,
    action: "inspection_started",
    entityType: "inspection_session",
    entityId: session.id,
    metadata: { status: session.status, home_id: homeId },
  });

  return session;
}
