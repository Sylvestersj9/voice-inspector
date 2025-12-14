import React from "react";

type EvalLike = {
  question_id?: string;
  score?: number | null;
  band?: string | null;
  strengths?: string[] | null;
  gaps?: string[] | null;
  recommendations?: string[] | null;
  follow_up_questions?: string[] | null;
  [k: string]: any;
};

type QLike = {
  id: string;
  domain?: string | null;
  title?: string | null;
  question?: string | null;
};

type ALike = {
  question_id: string;
  text?: string | null;
  transcript?: string | null;
};

function normaliseBand(b?: string | null) {
  return (b ?? "").toString().trim().toLowerCase();
}

function bandTone(b?: string | null) {
  const band = normaliseBand(b);
  if (band.includes("inadequate"))
    return { chip: "bg-red-50 text-red-800 ring-red-100", icon: "❗", label: "Inadequate" };
  if (band.includes("requires"))
    return { chip: "bg-amber-50 text-amber-900 ring-amber-100", icon: "⚠️", label: "Requires improvement" };
  if (band.includes("good"))
    return { chip: "bg-teal-50 text-teal-900 ring-teal-100", icon: "✅", label: "Good" };
  if (band.includes("outstanding"))
    return { chip: "bg-emerald-50 text-emerald-900 ring-emerald-100", icon: "⭐", label: "Outstanding" };
  return { chip: "bg-slate-50 text-slate-800 ring-slate-100", icon: "ℹ️", label: b ?? "Evaluation" };
}

function pct(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  const clamped = Math.max(0, Math.min(100, Math.round(n)));
  return clamped;
}

function joinOrDash(items?: string[] | null | undefined) {
  if (!items || items.length === 0) return "—";
  return items.join(" • ");
}

function pickAnswer(a?: ALike | null) {
  const t = (a?.transcript ?? "").trim();
  const x = (a?.text ?? "").trim();
  return t || x || "";
}

function keywordHintsFromAnswer(answer: string) {
  const a = answer.toLowerCase();
  return {
    mentionsEvidence: /(evidence|audit|review|oversight|qa|quality|learning|supervision|sampling)/.test(a),
    mentionsChildVoice: /(child.?s voice|wishes|feelings|views|advocacy|independent visitor|ikey)/.test(a),
    mentionsRisk: /(risk|assessment|safety plan|strategy|incident|missing|cse|county lines|bullying)/.test(a),
    mentionsMultiAgency: /(marac|mash|lsp|social worker|police|yot|camhs|multi[- ]agency|strategy meeting)/.test(a),
  };
}

function exampleFraming(answer: string) {
  const k = keywordHintsFromAnswer(answer);
  const blocks: { title: string; example: string }[] = [];

  blocks.push({
    title: "Inspector-style structure (safe template)",
    example:
      "“We do three things: (1) identify risks early, (2) put clear controls in place, and (3) check impact through evidence. For example… Then we review weekly and update plans after any incident.”",
  });

  if (!k.mentionsRisk) {
    blocks.push({
      title: "Bring it back to risk assessment",
      example:
        "“We complete a risk assessment and a clear safety plan for the child, including triggers, early warning signs, staff responses, and escalation steps. We update it after key events (e.g., missing episode, incident, intelligence).”",
    });
  }

  if (!k.mentionsMultiAgency) {
    blocks.push({
      title: "Add multi-agency confidence",
      example:
        "“Where risk increases, we escalate quickly and work with the placing authority and partners (social worker, police, health). We record actions, share updates appropriately, and follow agreed safeguarding pathways.”",
    });
  }

  if (!k.mentionsChildVoice) {
    blocks.push({
      title: "Add the child’s voice",
      example:
        "“We involve the child in the plan in an age-appropriate way: what makes them feel safe, what they prefer staff to do, and what support they want. We record their views and show how it changed practice.”",
    });
  }

  if (!k.mentionsEvidence) {
    blocks.push({
      title: "Show how you KNOW it’s effective (evidence)",
      example:
        "“We measure effectiveness with evidence: incident trends, missing frequency, return interviews, audit findings, supervision sampling, and outcomes from multi-agency meetings. We can show actions taken and impact over time.”",
    });
  }

  return blocks.slice(0, 4);
}

function ScoreRing({ value }: { value: number }) {
  const deg = Math.round((value / 100) * 360);
  return (
    <div className="relative h-24 w-24">
      <div
        className="h-24 w-24 rounded-full"
        style={{
          background: `conic-gradient(#0D9488 ${deg}deg, rgba(15, 23, 42, 0.12) 0deg)`,
        }}
      />
      <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center ring-1 ring-slate-200">
        <div className="text-center">
          <div className="text-xl font-semibold text-slate-900">{value}</div>
          <div className="text-[11px] text-slate-500 -mt-0.5">score</div>
        </div>
      </div>
    </div>
  );
}

export default function FinalSummaryReport({
  questions,
  answers,
  evaluations,
  onPracticeAgain,
}: {
  questions: QLike[];
  answers: ALike[];
  evaluations: EvalLike[];
  onPracticeAgain?: () => void;
}) {
  const byQ = React.useMemo(() => {
    const map = new Map<string, { q: QLike; a: ALike | null; e: EvalLike | null }>();
    for (const q of questions) map.set(q.id, { q, a: null, e: null });
    for (const a of answers) {
      const row = map.get(a.question_id);
      if (row) row.a = a;
    }
    for (const e of evaluations) {
      const id = e.question_id ?? "";
      const row = map.get(id);
      if (row) row.e = e;
    }
    return Array.from(map.values());
  }, [questions, answers, evaluations]);

  const scoreValues = byQ
    .map((x) => pct(x.e?.score ?? null))
    .filter((v): v is number => typeof v === "number");

  const avgScore = scoreValues.length ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null;

  const bandRank = (b?: string | null) => {
    const x = normaliseBand(b);
    if (x.includes("inadequate")) return 0;
    if (x.includes("requires")) return 1;
    if (x.includes("good")) return 2;
    if (x.includes("outstanding")) return 3;
    return 99;
  };
  const overallBand =
    byQ
      .map((x) => x.e?.band ?? null)
      .sort((a, b) => bandRank(a) - bandRank(b))[0] ?? null;

  const overallTone = bandTone(overallBand);

  const allStrengths = byQ.flatMap((x) => x.e?.strengths ?? []).filter(Boolean);
  const allGaps = byQ.flatMap((x) => x.e?.gaps ?? []).filter(Boolean);
  const allRecs = byQ.flatMap((x) => x.e?.recommendations ?? []).filter(Boolean);

  const topN = (arr: string[], n: number) => Array.from(new Set(arr)).slice(0, n);

  const topStrengths = topN(allStrengths, 6);
  const priorityGaps = topN(allGaps, 6);
  const priorityActions = topN(allRecs, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Session Summary</div>
            <div className="mt-1 text-sm text-slate-600">
              A focused report based on your 5 responses — strengths, gaps, and how to tighten answers for inspection conversations.
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 bg-white/70">
              <span>{overallTone.icon}</span>
              <span className={overallTone.chip + " rounded-full px-2 py-0.5 ring-1"}>{overallTone.label}</span>
              {avgScore !== null ? <span className="text-slate-500">•</span> : null}
              {avgScore !== null ? <span className="text-slate-700">Avg score: {avgScore}/100</span> : null}
            </div>
          </div>

          {avgScore !== null ? <ScoreRing value={avgScore} /> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">Top strengths</div>
            <div className="mt-2 text-sm font-medium text-slate-900">{topStrengths.length || "—"}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">Priority gaps</div>
            <div className="mt-2 text-sm font-medium text-slate-900">{priorityGaps.length || "—"}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">Actions generated</div>
            <div className="mt-2 text-sm font-medium text-slate-900">{priorityActions.length || "—"}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 lg:col-span-2">
          <div className="text-sm font-semibold text-slate-900">Strengths you demonstrated</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(topStrengths.length ? topStrengths : ["—"]).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-600" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Priority gaps to tighten</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(priorityGaps.length ? priorityGaps : ["—"]).map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">Recommended next actions</div>
          <p className="mt-1 text-sm text-slate-600">
            These are based on the gaps identified across your answers. Turn them into your next supervision / action plan items.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(priorityActions.length ? priorityActions : ["—"]).map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-5">
          <div className="text-sm font-semibold text-slate-900">How to frame stronger inspection answers</div>
          <p className="mt-1 text-sm text-slate-600">
            Use this structure consistently: <span className="font-medium text-slate-800">Process → Evidence → Impact → Review</span>.
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Template</div>
              <div className="mt-2 text-slate-800">
                “We <span className="font-semibold">do</span> X (process). We <span className="font-semibold">check</span> it by Y (evidence).
                The <span className="font-semibold">impact</span> is Z (outcomes). We <span className="font-semibold">review</span> weekly/monthly and after incidents.”
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Evidence prompts (pick 2–3)</div>
              <div className="mt-2">{joinOrDash([
                "audits & sampling",
                "incident trends",
                "missing episodes & return interviews",
                "supervision notes",
                "training compliance",
                "multi-agency outcomes",
              ])}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Impact prompts (say what changed)</div>
              <div className="mt-2">{joinOrDash([
                "risk reduced over time",
                "fewer incidents / improved patterns",
                "child feels safer / engages more",
                "plans updated quickly after learning",
              ])}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Per-question feedback (based on your answers)</div>
            <div className="mt-1 text-sm text-slate-600">
              Each section includes your answer, what landed well, what was missing, and example wording to tighten it.
            </div>
          </div>
          {onPracticeAgain ? (
            <button
              onClick={onPracticeAgain}
              className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Practice again
            </button>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          {byQ.map(({ q, a, e }, idx) => {
            const ui = bandTone(e?.band ?? null);
            const answer = pickAnswer(a);
            const examples = exampleFraming(answer);

            return (
              <section key={q.id} className="rounded-2xl border p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      Question {idx + 1} • {q.domain ?? "SCCIF domain"}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {q.title ?? "Inspection question"}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {q.question ?? "—"}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-semibold ring-1 bg-white">
                    <span>{ui.icon}</span>
                    <span className={ui.chip + " rounded-full px-2 py-0.5 ring-1"}>{ui.label}</span>
                    {typeof e?.score === "number" ? <span className="text-slate-500">•</span> : null}
                    {typeof e?.score === "number" ? <span className="text-slate-700">{Math.round(e.score)}/100</span> : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">Your answer</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                      {answer ? answer : "— (no answer captured)"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border bg-white p-4">
                      <div className="text-xs font-semibold text-slate-500">What landed well</div>
                      <div className="mt-2 text-sm text-slate-700">{joinOrDash(e?.strengths)}</div>
                    </div>
                    <div className="rounded-xl border bg-white p-4">
                      <div className="text-xs font-semibold text-slate-500">What to tighten</div>
                      <div className="mt-2 text-sm text-slate-700">{joinOrDash(e?.gaps)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">Recommended improvements</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {(e?.recommendations?.length ? e.recommendations : ["—"]).map((r: any, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-600" />
                          <span>{String(r)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">Example phrasing (based on your answer)</div>
                    <div className="mt-2 space-y-3">
                      {examples.map((ex, i) => (
                        <div key={i} className="rounded-xl border bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-600">{ex.title}</div>
                          <div className="mt-1 text-sm text-slate-800">{ex.example}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {e?.follow_up_questions?.length ? (
                  <div className="mt-4 rounded-xl border bg-amber-50/50 p-4">
                    <div className="text-xs font-semibold text-amber-900">Likely follow-up questions (be ready)</div>
                    <ul className="mt-2 space-y-2 text-sm text-amber-900">
                      {e.follow_up_questions.map((f: any, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" />
                          <span>{String(f)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-white p-5">
        <div className="text-sm text-slate-700">
          Tip: For your next run, choose one gap and fix it across all answers (consistency is what inspectors notice).
        </div>
        {onPracticeAgain ? (
          <button
            onClick={onPracticeAgain}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Start a new practice run
          </button>
        ) : null}
      </div>
    </div>
  );
}
