import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const systemPrompt = `You are a senior Ofsted inspector writing the formal narrative sections of an inspection readiness assessment report for a children's home. Write in confident, formal, third-person inspector language — as if this is an actual inspection report. Be specific and evidence-based. Reference Quality Standard numbers and domain names. Do not use generic filler. Every sentence must be grounded in the evidence provided. Respond ONLY in valid JSON — no markdown, no code fences.`;

    const reportSchema = `{
  "overallGrade": "${overallGrade}",
  "overallScore": ${Math.round(avgScore * 10) / 10},
  "scorePercent": ${scorePercent},
  "summaryNarrative": "<4-6 sentences. Formal, third-person, evidence-based inspector narrative summary of the manager's performance across the domains assessed. Reference specific QS numbers. Cover strengths, areas for development, and overall standard reached. Written as it would appear in an Ofsted inspection report.>",
  "closingVerdict": "<1-2 sentences: the inspector's honest closing verdict on this manager's readiness for a real unannounced Ofsted inspection — direct and evidence-based.>",
  "keyStrengths": [
    "<Strength 1: a full sentence in inspector report style identifying a cross-domain strength — specific, not generic>",
    "<Strength 2>",
    "<Strength 3>"
  ],
  "priorityActions": [
    "<Priority action 1: specific, actionable, linked to a gap identified — written as an inspector recommendation>",
    "<Priority action 2>",
    "<Priority action 3>"
  ],
  "readinessStatement": "<One paragraph (3-4 sentences) summarising where this manager stands ahead of a real inspection — honest, balanced, constructive. Acknowledges what is in place and what needs strengthening.>",
  "domainBreakdown": [
    <For each domain assessed, one object:>
    {
      "domain": <QS number as integer>,
      "qsName": "<Quality Standard name>",
      "grade": "<band>",
      "evidence": "<60-80 word summary of what the manager said and what it demonstrated — specific, written in report style>",
      "strengths": ["<specific strength from this domain>", ...up to 3],
      "actions": ["<specific actionable next step for this domain>", ...up to 2],
      "inspectorNote": "<2-3 sentences in inspector voice — what does the evidence in this domain tell you about the home's practice, and how would this factor into an inspection judgement?>"
    }
  ]
}`;

    const userMessage = `Manager: ${managerName} (${managerRole})
Home: ${homeName}
Date: ${sessionDate}
Overall grade: ${overallGrade} (average ${avgScore.toFixed(2)}/4 = ${scorePercent}%)
Domains not covered: ${notCoveredDomains.length === 0 ? "All domains covered" : notCoveredDomains.map((d) => DOMAIN_META[d]?.name ?? d).join(", ")}

Domain-by-domain evidence:
${domainContext}

Generate the report JSON now. Return ONLY the JSON object matching this schema exactly:
${reportSchema}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const raw = await resp.text();
    if (!resp.ok) throw new Error(`Claude API error ${resp.status}: ${raw.slice(0, 400)}`);

    const claudeData = JSON.parse(raw);
    const text: string = claudeData?.content?.[0]?.text ?? "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const report = JSON.parse(cleaned);

    // Attach deterministic metadata
    report.header = {
      homeName,
      managerName,
      managerRole,
      date: sessionDate,
      time: sessionTime,
      inspector: "AI Inspector (InspectReady)",
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
