import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIp } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT = 100; // per minute

const DOMAIN_META: Record<string, { qs: number; name: string }> = {
  QualityPurpose:        { qs: 1, name: "Quality and Purpose of Care" },
  ChildrenViews:         { qs: 2, name: "Children's Views, Wishes and Feelings" },
  Education:             { qs: 3, name: "Education" },
  EnjoymentAchievement:  { qs: 4, name: "Enjoyment and Achievement" },
  HealthWellbeing:       { qs: 5, name: "Health and Wellbeing" },
  PositiveRelationships: { qs: 6, name: "Positive Relationships" },
  ProtectionChildren:    { qs: 7, name: "Protection of Children" },
  LeadershipManagement:  { qs: 8, name: "Leadership and Management" },
  CarePlanning:          { qs: 9, name: "Care Planning" },
};

const ALL_DOMAINS = Object.keys(DOMAIN_META);

serve(async (req: Request) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Rate limit check
  const clientIp = getClientIp(req);
  const { allowed, remaining, retryAfter } = checkRateLimit(clientIp, RATE_LIMIT);
  if (!allowed) {
    return json(429, {
      error: "Rate limit exceeded. Max 100 requests per minute.",
      retryAfter,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId ?? "").trim();
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") ?? Deno.env.get("ANTHROPIC_API_KEY");
    if (!CLAUDE_API_KEY) throw new Error("CLAUDE_API_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch session
    const { data: sess, error: sessErr } = await supabase
      .from("sessions")
      .select("user_id, started_at")
      .eq("id", sessionId)
      .single();
    if (sessErr || !sess) return json(400, { error: "Session not found" });

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("name, home_name, role")
      .eq("id", sess.user_id)
      .maybeSingle();

    const homeName = userProfile?.home_name || "Children's Home";
    const managerName = userProfile?.name || "Registered Manager";
    const managerRole = userProfile?.role || "Registered Manager";
    const sessionDate = new Date(sess.started_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    const sessionTime = new Date(sess.started_at).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit",
    });

    // Fetch responses
    const { data: responses, error: respErr } = await supabase
      .from("responses")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at");

    if (respErr) throw respErr;
    if (!responses || responses.length === 0) {
      return json(400, { error: "No responses found for this session" });
    }

    // Determine covered / not-covered domains
    const coveredDomains = new Set(responses.map((r) => r.domain));
    const notCoveredDomains = ALL_DOMAINS.filter((d) => !coveredDomains.has(d));
    const isFullSession = notCoveredDomains.length === 0;

    // Calculate overall score
    const scores = responses.map((r) => Number(r.score) || 1);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const protectionScore = Number(responses.find((r) => r.domain === "ProtectionChildren")?.score ?? 3);

    let overallGrade: string;
    if (avgScore >= 3.5) overallGrade = "Outstanding";
    else if (avgScore >= 2.5) overallGrade = "Good";
    else if (avgScore >= 1.5) overallGrade = "Requires Improvement";
    else overallGrade = "Inadequate";

    if (protectionScore === 1) overallGrade = "Inadequate";

    const scorePercent = Math.round((avgScore / 4) * 100);

    // Build per-domain context for Claude
    const domainContext = responses
      .map((r) => {
        const meta = DOMAIN_META[r.domain] ?? { qs: 0, name: r.domain };
        const fb = (r.feedback_json as Record<string, unknown>) ?? {};
        return `QS${meta.qs} — ${meta.name}${r.domain === "ProtectionChildren" ? " [LIMITING JUDGEMENT]" : ""}
Grade: ${r.band} (${r.score}/4)
Question: ${r.question_text}
Manager's answer: ${String(r.answer_text ?? "").slice(0, 400)}
AI evaluation summary: ${String(fb.summary ?? "").slice(0, 200)}
Strengths: ${((fb.strengths as string[]) ?? []).join("; ") || "None noted"}
Gaps: ${((fb.gaps as string[]) ?? []).join("; ") || "None noted"}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are an Ofsted inspector. Write formal, evidence-based narrative. Return ONLY valid JSON.`;

    const reportSchema = JSON.stringify({
      overallGrade,
      overallScore: Math.round(avgScore * 10) / 10,
      scorePercent,
      summaryNarrative: "3-4 sentence formal summary",
      closingVerdict: "1 sentence readiness verdict",
      keyStrengths: ["Strength 1", "Strength 2", "Strength 3"],
      priorityActions: ["Action 1", "Action 2"],
      readinessStatement: "2-3 sentence statement",
      domainBreakdown: responses.map(r => ({
        domain: DOMAIN_META[r.domain]?.qs || 0,
        grade: r.band,
        evidence: "Evidence summary"
      }))
    });

    const userMessage = `Manager: ${managerName} | Home: ${homeName} | Grade: ${overallGrade} (${avgScore.toFixed(1)}/4)

Evidence:
${responses.map(r => `QS${DOMAIN_META[r.domain]?.qs}: ${r.band} - "${String(r.answer_text || "").slice(0, 100)}..."`).join("\n")}

Generate report JSON matching this schema:
${reportSchema}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const raw = await resp.text();
    if (!resp.ok) {
      console.error(`Claude API error ${resp.status}:`, raw.slice(0, 500));
      throw new Error(`Claude API error ${resp.status}: ${raw.slice(0, 200)}`);
    }

    let claudeData;
    try {
      claudeData = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse Claude response:", raw.slice(0, 500));
      throw new Error(`Invalid JSON from Claude: ${e instanceof Error ? e.message : "unknown"}`);
    }

    const text: string = claudeData?.content?.[0]?.text ?? "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let report;
    try {
      report = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse report JSON:", cleaned.slice(0, 500));
      throw new Error(`Invalid report JSON: ${e instanceof Error ? e.message : "unknown"}`);
    }

    // Attach deterministic metadata
    report.header = {
      homeName,
      managerName,
      managerRole,
      date: sessionDate,
      time: sessionTime,
      inspector: "AI Inspector (MockOfsted)",
      sessionType: isFullSession ? "Full Session" : "Partial Session",
      questionsAnswered: responses.length,
      totalQS: 9,
      notCoveredDomains: notCoveredDomains.map((d) => ({
        key: d,
        qs: DOMAIN_META[d]?.qs ?? 0,
        name: DOMAIN_META[d]?.name ?? d,
      })),
    };

    // Store
    const { error: updateErr } = await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        overall_band: report.overallGrade ?? overallGrade,
        overall_score: report.overallScore ?? avgScore,
        report_json: report,
      })
      .eq("id", sessionId);

    if (updateErr) throw updateErr;

    return json(200, { report });
  } catch (e) {
    console.error("generate-report error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
