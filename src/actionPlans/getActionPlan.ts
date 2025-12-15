import { supabase } from "@/lib/supabase";
import type { ActionPlan } from "./types";

export async function getActionPlan(sessionId: string): Promise<ActionPlan | null> {
  const { data, error } = await supabase
    .from("inspection_action_plans")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    actions: (data.actions as any) || [],
  } as ActionPlan;
}
