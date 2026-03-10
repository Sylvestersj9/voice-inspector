import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Loader2, CheckCircle2, RefreshCw, Printer } from "lucide-react";
import MarketingLayout from "./MarketingLayout";
import {
  QS_DOMAINS,
  CHECKLIST_COLS,
  AUDIT_ITEMS,
  computeScore,
  exportQuizPdf,
  exportCalendarPdf,
  exportAuditPdf,
  type CheckState,
} from "@/lib/quizScoring";
import { getGapAnalysis } from "@/lib/geminiPrompt";

// ── Shared CTA ─────────────────────────────────────────────────────────────────

function SimulatorCTA({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <p className="text-sm font-semibold text-teal-900">Love this? Try the full AI simulator.</p>
        <p className="mt-0.5 text-xs text-teal-700">
          Real SCCIF questions · Voice or text · Scored feedback · Full inspection report — 3-day free trial, no card needed.
        </p>
      </div>
      <Link
        to="/login"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
      >
        Start free trial <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

function bandClasses(pct: number) {
  if (pct > 80)  return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Good — Inspection Ready" };
  if (pct >= 60) return { bar: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   label: "Developing — Address Gaps" };
  return            { bar: "bg-red-500",          text: "text-red-700",     bg: "bg-red-50 border-red-200",       label: "At Risk — Act Now" };
}

function domainBarClass(pct: number) {
  if (pct === 100) return "bg-emerald-500";
  if (pct >= 67)   return "bg-amber-500";
  return                   "bg-red-500";
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 1: QS Readiness Quiz
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = "ir_quiz_state";

function loadSavedState(): CheckState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function QuizTool() {
  const [state, setState] = useState<CheckState>(loadSavedState);
  const [homeName, setHomeName]   = useState("");
  const [analysis, setAnalysis]   = useState<{ text: string; isAI: boolean } | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const result = computeScore(state);
  const { bar, text: textCls, bg, label } = bandClasses(result.pct);
  const totalDomains = QS_DOMAINS.length;
  const answered = Object.values(state).filter((v) => v.some(Boolean)).length;

  function toggle(domainId: string, colIdx: number) {
    setState((prev) => {
      const vals = prev[domainId] ? [...prev[domainId]] : [false, false, false];
      vals[colIdx] = !vals[colIdx];
      const next = { ...prev, [domainId]: vals as [boolean, boolean, boolean] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    setState({});
    setAnalysis(null);
    localStorage.removeItem(LS_KEY);
  }

  async function handleAnalyse() {
    setAnalysing(true);
    setAnalysis(null);
    try {
      const res = await getGapAnalysis(result, homeName || undefined);
      setAnalysis(res);
    } finally {
      setAnalysing(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportQuizPdf(result, homeName || undefined, analysis?.text);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Optional home name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Home name (optional — appears on PDF)
        </label>
        <input
          type="text"
          value={homeName}
          onChange={(e) => setHomeName(e.target.value)}
          placeholder="e.g. Elm View Children's Home"
          className="max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* Live score bar */}
      <div className={`rounded-xl border p-5 ${bg}`}>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <span className={`font-display text-4xl font-bold ${textCls}`}>{result.pct}%</span>
            <span className={`ml-3 text-sm font-semibold ${textCls}`}>{label}</span>
          </div>
          <span className="text-xs text-slate-500">{result.checked}/{result.total} checks</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bar}`}
            style={{ width: `${result.pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {answered}/{totalDomains} domains started · tick each box as you confirm evidence
        </p>
      </div>

      {/* Checkbox grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Desktop table */}
        <table className="w-full text-sm hidden sm:table">
          <thead>
            <tr className="bg-teal-600">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50 w-[40%]">
                Quality Standard
              </th>
              {CHECKLIST_COLS.map((col) => (
                <th key={col} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-teal-50">
                  {col}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-teal-50">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {QS_DOMAINS.map((d) => {
              const vals    = state[d.id] ?? [false, false, false];
              const dCount  = vals.filter(Boolean).length;
              const dPct    = Math.round((dCount / 3) * 100);
              return (
                <tr
                  key={d.id}
                  className={`hover:bg-slate-50 transition-colors ${d.limiting ? "bg-red-50/30" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-600 shrink-0">{d.id}</span>
                      <span className={`text-sm font-medium ${d.limiting ? "text-red-700" : "text-slate-800"}`}>
                        {d.short}
                        {d.limiting && (
                          <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            LIMITING
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  {CHECKLIST_COLS.map((_, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      <button
                        onClick={() => toggle(d.id, i)}
                        className={[
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all",
                          vals[i]
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-slate-300 bg-white text-transparent hover:border-teal-400",
                        ].join(" ")}
                        aria-label={`${d.id} ${CHECKLIST_COLS[i]}`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${domainBarClass(dPct)}`}
                          style={{ width: `${dPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-6 text-right">{dCount}/3</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {QS_DOMAINS.map((d) => {
            const vals   = state[d.id] ?? [false, false, false];
            const dCount = vals.filter(Boolean).length;
            const dPct   = Math.round((dCount / 3) * 100);
            return (
              <div key={d.id} className={`p-4 ${d.limiting ? "bg-red-50/40" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-600">{d.id}</span>
                    <span className={`text-sm font-semibold ${d.limiting ? "text-red-700" : "text-slate-800"}`}>
                      {d.short}
                    </span>
                    {d.limiting && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        LIMITING
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${domainBarClass(dPct).replace("bg-", "text-")}`}>
                    {dCount}/3
                  </span>
                </div>
                <div className="space-y-2">
                  {CHECKLIST_COLS.map((col, i) => (
                    <button
                      key={i}
                      onClick={() => toggle(d.id, i)}
                      className={[
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        vals[i]
                          ? "border-teal-400 bg-teal-50 text-teal-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200",
                      ].join(" ")}
                    >
                      <div className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                        vals[i] ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 bg-white",
                      ].join(" ")}>
                        {vals[i] && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaps list */}
      {result.gaps.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            {result.gaps.length} gap{result.gaps.length !== 1 ? "s" : ""} identified
          </p>
          <ul className="space-y-1.5">
            {result.gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${g.domainId === "QS7" ? "bg-red-500" : "bg-amber-400"}`} />
                <span>{g.action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI analysis */}
      {analysis && (
        <div className={`rounded-xl border p-5 ${analysis.isAI ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">
            {analysis.isAI ? "AI Gap Analysis — Gemini 1.5 Flash" : "Gap Summary"}
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{analysis.text}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyse}
          disabled={analysing || result.checked === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
        >
          {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {analysing ? "Analysing…" : "Generate gaps report"}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting || result.checked === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40 transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Exporting…" : "Export PDF report"}
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <SimulatorCTA />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 2: Mock Inspector Demo
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_QUESTIONS = [
  {
    domain: "QS7 — Protection of Children (Limiting)",
    limiting: true,
    question: "Walk me through your missing from care protocol — from the moment a young person is unaccounted for to when the return home interview is completed.",
    hint: "Inspector wants decision-making owners at each stage. Who decides what, and when? How is the return home interview conducted and by whom?",
  },
  {
    domain: "QS8 — Leadership and Management",
    limiting: false,
    question: "How do you use your Regulation 44 and Regulation 45 reports to drive genuine improvement — give me a specific example of a change you made as a direct result.",
    hint: "Inspector wants the quality improvement loop: findings → actions → follow-through → measurable impact on children's experience.",
  },
  {
    domain: "QS1 — Quality and Purpose of Care",
    limiting: false,
    question: "How do you ensure your statement of purpose accurately reflects the care you actually deliver day to day — and when did you last review it?",
    hint: "Inspector wants evidence the SOP is a living document. Reference specific review dates and examples of updates made.",
  },
];

type MockAnswer = { text: string; submitted: boolean };

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function getMockFeedback(text: string, isLimiting: boolean): {
  band: number; label: string; strength: string; gap: string; follow: string; colour: string;
} {
  const wc = wordCount(text);
  if (wc < 15) return {
    band: 1, label: "Inadequate",
    strength: "You've identified the topic.",
    gap: "Your answer lacks specific evidence, process detail, or named decision-makers. An inspector would probe further and this response risks an Inadequate judgement.",
    follow: `Follow-up: "Can you give me a specific example from the last three months?"`,
    colour: "border-red-200 bg-red-50 text-red-800",
  };
  if (wc < 40) return {
    band: 2, label: "Requires Improvement",
    strength: "You've covered the basics of the process.",
    gap: `Your answer needs more specificity — who is responsible, at what stage, and how is it recorded? Inspector will push for names and timescales${isLimiting ? " (critical for a limiting judgement)" : ""}.`,
    follow: `Follow-up: "Who specifically makes the decision to escalate, and what triggers that escalation?"`,
    colour: "border-amber-200 bg-amber-50 text-amber-800",
  };
  if (wc < 80) return {
    band: 3, label: "Good",
    strength: "Clear process with ownership. You demonstrate awareness of the standard.",
    gap: "To reach Outstanding, add a specific recent example with an outcome, and reference how learning from this practice feeds into staff training or Reg 44/45 reports.",
    follow: `Follow-up: "Can you give me an example in the last six months where this led to a change in your practice?"`,
    colour: "border-teal-200 bg-teal-50 text-teal-800",
  };
  return {
    band: 4, label: "Outstanding",
    strength: "Specific, evidenced, process-driven response. Shows reflective practice and systemic thinking.",
    gap: "Strong answer. In a real inspection, be prepared for the inspector to test whether all staff — including night staff and bank staff — could describe this process consistently.",
    follow: `Follow-up: "If I spoke to a member of staff who worked last night, would they describe the same process?"`,
    colour: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
}

function MockInspectorTool() {
  const [answers, setAnswers] = useState<MockAnswer[]>(
    MOCK_QUESTIONS.map(() => ({ text: "", submitted: false }))
  );
  const [current, setCurrent] = useState(0);

  function update(i: number, text: string) {
    setAnswers((prev) => prev.map((a, idx) => idx === i ? { ...a, text } : a));
  }

  function submit(i: number) {
    if (!answers[i].text.trim()) return;
    setAnswers((prev) => prev.map((a, idx) => idx === i ? { ...a, submitted: true } : a));
    if (i < MOCK_QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(i + 1), 600);
    }
  }

  function reset() {
    setAnswers(MOCK_QUESTIONS.map(() => ({ text: "", submitted: false })));
    setCurrent(0);
  }

  const allDone = answers.every((a) => a.submitted);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 leading-relaxed">
        Answer 3 real SCCIF inspection questions in your own words — type as you'd speak in an inspection.
        Get instant heuristic feedback on each answer. No login, no data stored.
      </p>

      {/* Question tabs / progress */}
      <div className="flex gap-2">
        {MOCK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={[
              "flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors",
              current === i
                ? "border-teal-600 bg-teal-600 text-white"
                : answers[i].submitted
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500",
            ].join(" ")}
          >
            {answers[i].submitted ? "✓ " : ""}Q{i + 1}
          </button>
        ))}
      </div>

      {MOCK_QUESTIONS.map((q, i) => {
        if (i !== current) return null;
        const fb = answers[i].submitted
          ? getMockFeedback(answers[i].text, q.limiting)
          : null;

        return (
          <div key={i} className="space-y-4">
            <div className={`rounded-xl border p-5 ${q.limiting ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                  {q.domain}
                </span>
                {q.limiting && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    LIMITING
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.question}</p>
              <p className="mt-2 text-xs text-slate-500 italic">{q.hint}</p>
            </div>

            {!answers[i].submitted ? (
              <div className="space-y-3">
                <textarea
                  value={answers[i].text}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder="Type your answer as you would speak it to an inspector…"
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{wordCount(answers[i].text)} words</span>
                  <button
                    onClick={() => submit(i)}
                    disabled={!answers[i].text.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
                  >
                    Submit answer
                  </button>
                </div>
              </div>
            ) : fb ? (
              <div className={`rounded-xl border p-5 space-y-3 ${fb.colour}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">{fb.band}/4</span>
                  <span className="font-semibold text-base">{fb.label}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1">Strength</p>
                  <p className="text-sm">{fb.strength}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1">Gap</p>
                  <p className="text-sm">{fb.gap}</p>
                </div>
                <div className="rounded-lg bg-white/60 px-3 py-2 text-xs italic">
                  {fb.follow}
                </div>
                {i < MOCK_QUESTIONS.length - 1 && (
                  <button
                    onClick={() => setCurrent(i + 1)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border px-4 py-2 text-xs font-semibold transition-colors hover:bg-white"
                  >
                    Next question <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      {allDone && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">All 3 questions answered.</p>
          <p className="mt-1 text-sm text-emerald-800">
            The real simulator uses{" "}
            <strong>6 questions per session</strong>, covers all 9 Quality Standards, evaluates responses
            against SCCIF criteria, and generates a full inspection report with overall grade.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Try full simulator — free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      {!allDone && <SimulatorCTA />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 3: Prep Calendar
// ─────────────────────────────────────────────────────────────────────────────

// Exported from quizScoring for the export fn — re-export as local const for UI
const CALENDAR_WEEKS = [
  { qs: "QS7", label: "Protection of Children (Limiting)",    goal: "Walk through missing from care protocol and CSE indicators", focus: "bg-red-50 text-red-700 border-red-200" },
  { qs: "QS8", label: "Leadership & Management",              goal: "Evidence Reg 44/45 quality improvement loop with a specific example", focus: "bg-teal-50 text-teal-700 border-teal-200" },
  { qs: "QS1", label: "Quality and Purpose of Care",          goal: "Align statement of purpose to current young people's needs", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS9", label: "Care Planning",                        goal: "Demonstrate co-production and responsive review processes", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS2", label: "Children's Views, Wishes & Feelings",  goal: "Give a concrete example of young person influence on decisions", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS5", label: "Health and Wellbeing",                 goal: "Describe GP registration, CAMHS escalation, medication management", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS7", label: "Protection of Children (Limiting)",    goal: "Repeat — QS7 needs monthly practice as limiting judgement", focus: "bg-red-50 text-red-700 border-red-200" },
  { qs: "QS3", label: "Education",                            goal: "Explain PEP quality, VSH relationship, and provision during gaps", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS4", label: "Enjoyment and Achievement",            goal: "Describe individualised activity provision and risk management", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS6", label: "Positive Relationships",               goal: "Evidence keyworker impact and family contact management", focus: "bg-slate-50 text-slate-700 border-slate-200" },
  { qs: "QS8", label: "Leadership & Management",              goal: "Quality assurance beyond supervision: observation and log review", focus: "bg-teal-50 text-teal-700 border-teal-200" },
  { qs: "ALL", label: "Full mock inspection (all domains)",   goal: "Run a complete 6-question simulator session — target Outstanding", focus: "bg-amber-50 text-amber-700 border-amber-200" },
];

function nextMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  r.setDate(r.getDate() + diff);
  return r;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function PrepCalendarTool() {
  const defaultStart = nextMonday(new Date());
  const [startDate, setStartDate] = useState(defaultStart.toISOString().slice(0, 10));
  const [exporting, setExporting]  = useState(false);

  const start = new Date(startDate + "T00:00:00");

  async function handleExport() {
    setExporting(true);
    try { await exportCalendarPdf(start); }
    finally { setExporting(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Programme start date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50 w-16">Wk</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50 w-28">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50">Domain Focus</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50 hidden md:table-cell">Session Goal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CALENDAR_WEEKS.map((w, i) => {
              const wStart = new Date(start);
              wStart.setDate(wStart.getDate() + i * 7);
              const wEnd = new Date(wStart);
              wEnd.setDate(wEnd.getDate() + 4);
              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-teal-600">{i + 1}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(wStart)}–{fmtDate(wEnd)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${w.focus}`}>
                      {w.qs} — {w.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">{w.goal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40 transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Exporting…" : "Export PDF calendar"}
        </button>
      </div>

      <SimulatorCTA />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 4: SCCIF Audit Checklist
// ─────────────────────────────────────────────────────────────────────────────

function AuditChecklistTool() {
  const [checked, setChecked] = useState<Record<string, boolean[]>>({});
  const [homeName, setHomeName] = useState("");
  const [exporting, setExporting] = useState(false);

  const totalItems = AUDIT_ITEMS.reduce((n, s) => n + s.items.length, 0);
  const checkedCount = Object.values(checked).flat().filter(Boolean).length;
  const pct = Math.round((checkedCount / totalItems) * 100);
  const { bar, text: textCls, bg, label } = bandClasses(pct);

  function toggle(sectionShort: string, idx: number) {
    setChecked((prev) => {
      const vals = prev[sectionShort] ? [...prev[sectionShort]] : Array(AUDIT_ITEMS.find(s => s.short === sectionShort)!.items.length).fill(false);
      vals[idx] = !vals[idx];
      return { ...prev, [sectionShort]: vals };
    });
  }

  function reset() {
    setChecked({});
  }

  async function handleExport() {
    setExporting(true);
    try { await exportAuditPdf(checked, homeName || undefined); }
    finally { setExporting(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Home name (optional)
        </label>
        <input
          type="text"
          value={homeName}
          onChange={(e) => setHomeName(e.target.value)}
          placeholder="e.g. Elm View Children's Home"
          className="max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* Score bar */}
      <div className={`rounded-xl border p-4 ${bg}`}>
        <div className="flex items-end justify-between mb-2">
          <span className={`font-display text-3xl font-bold ${textCls}`}>{pct}%</span>
          <span className={`text-sm font-semibold ${textCls}`}>{label}</span>
          <span className="text-xs text-slate-500">{checkedCount}/{totalItems}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-white/60 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {AUDIT_ITEMS.map((section) => {
          const vals   = checked[section.short] ?? Array(section.items.length).fill(false);
          const sCount = vals.filter(Boolean).length;
          return (
            <div key={section.short} className={`rounded-xl border overflow-hidden ${section.limiting ? "border-red-200" : "border-slate-200"}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${section.limiting ? "bg-red-50" : "bg-slate-50"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${section.limiting ? "text-red-700" : "text-teal-600"}`}>
                    {section.short}
                  </span>
                  <span className={`text-sm font-semibold ${section.limiting ? "text-red-800" : "text-slate-800"}`}>
                    {section.domain}
                  </span>
                  {section.limiting && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                      LIMITING
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-500">{sCount}/{section.items.length}</span>
              </div>
              <div className="bg-white divide-y divide-slate-50">
                {section.items.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={[
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                      vals[idx] ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 bg-white",
                    ].join(" ")}>
                      {vals[idx] && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!vals[idx]}
                      onChange={() => toggle(section.short, idx)}
                    />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40 transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Exporting…" : "Export PDF checklist"}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <SimulatorCTA />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav & Page
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_NAV = [
  { id: "quiz",      label: "Readiness Quiz"   },
  { id: "mock",      label: "Mock Inspector"   },
  { id: "calendar",  label: "Prep Calendar"    },
  { id: "checklist", label: "Audit Checklist"  },
];

export default function Tools() {
  const [active, setActive] = useState("quiz");
  const contentRef = useRef<HTMLDivElement>(null);

  // Support hash nav: /tools#mock etc.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TOOL_NAV.some((t) => t.id === hash)) setActive(hash);
  }, []);

  function switchTool(id: string) {
    setActive(id);
    window.history.replaceState(null, "", `/tools#${id}`);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="px-4 pt-10 pb-12 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-5">
            Free tools — no account needed
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">
            Free Ofsted Prep Tools
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Grounded in the SCCIF framework. 100% client-side. No login. Your progress stays in your
            browser.
          </p>
        </div>
      </section>

      {/* Tool tab nav */}
      <section className="sticky top-[61px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TOOL_NAV.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTool(t.id)}
                className={[
                  "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  active === t.id
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tool content */}
      <section className="px-4 py-10" ref={contentRef}>
        <div className="mx-auto max-w-5xl">
          {active === "quiz"      && (
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">
                QS Readiness Quiz
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Tick each evidence check you can confirm right now. Live score updates as you go.
                Export a PDF gaps report when done.
              </p>
              <QuizTool />
            </div>
          )}
          {active === "mock"      && (
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">
                Mock Inspector Demo
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                3 real SCCIF questions. Type your answer as you'd speak it.
                Get instant heuristic feedback — no backend, no login.
              </p>
              <MockInspectorTool />
            </div>
          )}
          {active === "calendar"  && (
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">
                12-Week Prep Calendar
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Pick a start date. Get a 12-week domain rotation plan with session goals.
                Export as PDF to share with your RI or team.
              </p>
              <PrepCalendarTool />
            </div>
          )}
          {active === "checklist" && (
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">
                SCCIF Audit Checklist
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Work through all 9 Quality Standards. Tick evidence items as you confirm them.
                Export a printable PDF for your RI visit or self-audit.
              </p>
              <AuditChecklistTool />
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-teal-600 px-4 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-white">
            Ready for the full AI simulator?
          </h2>
          <p className="mt-3 text-teal-100">
            6 SCCIF questions per session · voice or text · scored feedback · full inspection report.
            3-day free trial — no card needed.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-teal-700 shadow-sm hover:bg-teal-50 transition-colors"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
