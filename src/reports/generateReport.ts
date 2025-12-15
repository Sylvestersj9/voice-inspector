import { supabase } from "@/lib/supabase";
import { logAudit } from "@/audit/logAudit";
import type { InspectionReport, ReportBand } from "./types";
import { canGenerateReport } from "@/billing/enforcement";
import { generateActionsFromEvaluations } from "@/actionPlans/generateFromEvaluations";

const bandFromScore = (score: number): ReportBand => {
  if (score >= 3.6) return "Outstanding";
  if (score >= 2.8) return "Good";
  if (score >= 2.0) return "Requires Improvement";
  return "Inadequate";
};

export async function generateInspectionReport(
  inspectionSessionId: string,
  billing: { status: string | null; plan: string | null } = { status: null, plan: null },
): Promise<{
  report: InspectionReport;
  domains: Array<{ domain: string; avg_score: number; band: ReportBand }>;
}> {
  if (!canGenerateReport({ billing })) {
    logAudit({
      actorId: "system",
      action: "billing_action_blocked",
      entityType: "inspection_session",
      entityId: inspectionSessionId,
      metadata: { attempted_action: "generate_report", plan: billing.plan, status: billing.status },
    });
    throw new Error("Your subscription is inactive. Please update billing to generate reports.");
  }

  const { data: evaluations, error } = await supabase
    .from("inspection_evaluations")
    .select(
      `
      *,
      inspection_session_questions (
        domain_name
      )
    `,
    )
    .eq("inspection_session_questions.inspection_session_id", inspectionSessionId);

  if (error || !evaluations) throw error || new Error("Failed to fetch evaluations");

  if (!evaluations.length) throw new Error("No evaluations found for session");

  let total = 0;
  const domainMap = new Map<string, number[]>();
  const strengths: string[] = [];
  const gaps: string[] = [];
  const risks: string[] = [];
  const actions: string[] = [];

  evaluations.forEach((ev: any) => {
    const score = Number(ev.score) || 0;
    total += score;
    const domain = ev.inspection_session_questions?.domain_name || "General";
    const arr = domainMap.get(domain) || [];
    arr.push(score);
    domainMap.set(domain, arr);

    if (ev.strengths) strengths.push(ev.strengths);
    if (ev.gaps) {
      gaps.push(ev.gaps);
      risks.push(ev.gaps);
    }
    if (ev.follow_up_questions) actions.push(ev.follow_up_questions);
  });

  const avg = total / evaluations.length;
  const overall_band = bandFromScore(avg);

  const domains = Array.from(domainMap.entries()).map(([domain, scores]) => {
    const dAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      domain,
      avg_score: dAvg,
      band: bandFromScore(dAvg),
    };
  });

  const topStrengths = strengths.slice(0, 3).join("\n");
  const topRisks = risks.slice(0, 3).join("\n");
  const topActions = actions.slice(0, 5).join("\n");

  const payload = {
    inspection_session_id: inspectionSessionId,
    overall_score: avg,
    overall_band,
    strengths: topStrengths || "No strengths identified",
    key_risks: topRisks || "No risks captured",
    recommended_actions: topActions || "No actions captured",
  };

  const { data: upserted, error: upsertErr } = await supabase
    .from("inspection_reports")
    .upsert(payload, { onConflict: "inspection_session_id" })
    .select("*")
    .single();

  if (upsertErr || !upserted) throw upsertErr || new Error("Failed to upsert report");

  // Audit
  logAudit({
    actorId: "ai",
    action: "inspection_report_generated",
    entityType: "inspection_session",
    entityId: inspectionSessionId,
    metadata: { overall_band, overall_score: avg },
  });

  // Auto-generate action plan if not present
  const { data: existingPlan } = await supabase
    .from("inspection_action_plans")
    .select("id")
    .eq("session_id", inspectionSessionId)
    .maybeSingle();

  if (!existingPlan) {
    const autoActions = generateActionsFromEvaluations(evaluations as any[]);
    try {
      await supabase.from("inspection_action_plans").insert({
        session_id: inspectionSessionId,
        actions: autoActions,
      });
    } catch (planErr) {
      console.warn("Unable to generate action plan", planErr);
    }
  }

  return { report: upserted as InspectionReport, domains };
}
