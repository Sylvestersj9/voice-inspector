import { supabase } from "@/lib/supabase";
import type { InspectionFramework, InspectionDomain, InspectionQuestion } from "./types";

export async function getActiveFramework(): Promise<{
  framework: InspectionFramework;
  domains: InspectionDomain[];
  questions: InspectionQuestion[];
}> {
  const { data: framework, error: fwErr } = await supabase
    .from("inspection_frameworks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fwErr || !framework) throw fwErr || new Error("No active framework found");

  const { data: domains, error: domErr } = await supabase
    .from("inspection_domains")
    .select("*")
    .eq("framework_id", framework.id)
    .order("sort_order", { ascending: true });
  if (domErr || !domains) throw domErr || new Error("No domains for active framework");

  const domainIds = domains.map((d) => d.id);
  const { data: questions, error: qErr } = await supabase
    .from("inspection_questions")
    .select("*")
    .in("domain_id", domainIds)
    .order("sort_order", { ascending: true });
  if (qErr || !questions) throw qErr || new Error("No questions for active framework");

  return {
    framework: framework as InspectionFramework,
    domains: domains as InspectionDomain[],
    questions: questions as InspectionQuestion[],
  };
}
