import { supabase } from "@/lib/supabase";
import type { ActionItem, ActionPlan } from "./types";

export async function saveActionPlan(sessionId: string, actions: ActionItem[]): Promise<ActionPlan> {
  const payload = {
    session_id: sessionId,
    actions,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("inspection_action_plans")
    .upsert(payload, { onConflict: "session_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw error || new Error("Failed to save action plan");
  }

  const persistedActions = Array.isArray((data as { actions?: unknown }).actions)
    ? (data as { actions?: unknown }).actions
    : [];
  return { ...data, actions: persistedActions } as ActionPlan;
}
