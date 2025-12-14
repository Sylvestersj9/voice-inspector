import { supabase } from "@/lib/supabase";
import { generateInspectionReport } from "./generateReport";
import type { InspectionReport } from "./types";
import type { ReportBand } from "./types";

export async function getReport(inspectionSessionId: string): Promise<{
  report: InspectionReport;
  domains: Array<{ domain: string; avg_score: number; band: ReportBand }>;
  sessionTitle: string | null;
  homeName: string | null;
}> {
  // Fetch session to get title and home
  const { data: session, error: sessionErr } = await supabase
    .from("inspection_sessions")
    .select("id, title, home_id")
    .eq("id", inspectionSessionId)
    .maybeSingle();
  if (sessionErr || !session) throw sessionErr || new Error("Session not found");

  let homeName: string | null = null;
  if (session.home_id) {
    const { data: home } = await supabase
      .from("homes")
      .select("name")
      .eq("id", session.home_id)
      .maybeSingle();
    homeName = home?.name ?? null;
  }

  // Ensure report exists; regenerate to get domains snapshot too
  const { report, domains } = await generateInspectionReport(inspectionSessionId);

  return {
    report,
    domains,
    sessionTitle: session.title ?? null,
    homeName,
  };
}
