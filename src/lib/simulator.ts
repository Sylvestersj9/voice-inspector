import { supabase } from "@/lib/supabase";

export type GenerateReportOptions = {
  sessionId: string;
  pollMs?: number;
  timeoutMs?: number;
};

const DEFAULT_POLL_MS = 800;
const DEFAULT_TIMEOUT_MS = 20000;

export function getPauseKey(sessionId: string) {
  return `mockofsted:paused:${sessionId}`;
}

export function loadPaused(sessionId: string) {
  if (typeof window === "undefined") return false;
  const key = getPauseKey(sessionId);
  return window.localStorage.getItem(key) === "1";
}

export function savePaused(sessionId: string, paused: boolean) {
  if (typeof window === "undefined") return;
  const key = getPauseKey(sessionId);
  if (paused) {
    window.localStorage.setItem(key, "1");
  } else {
    window.localStorage.removeItem(key);
  }
}

export function clearPaused(sessionId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getPauseKey(sessionId));
}

export function progressColor(avgScore: number | null) {
  if (avgScore === null) return "bg-slate-300";
  if (avgScore > 3) return "bg-emerald-500";
  if (avgScore >= 2) return "bg-amber-500";
  return "bg-red-500";
}

export async function generateReportAndWait(options: GenerateReportOptions) {
  const { sessionId, pollMs = DEFAULT_POLL_MS, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anonKey ?? "",
    },
    body: JSON.stringify({ session_id: sessionId, sessionId }),
  });

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase
      .from("sessions")
      .select("report_json")
      .eq("id", sessionId)
      .maybeSingle();

    if (data?.report_json) return true;
    await new Promise((r) => setTimeout(r, pollMs));
  }

  return false;
}
