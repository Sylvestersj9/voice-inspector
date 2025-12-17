import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { BetaFeedback } from "@/components/BetaFeedback";
import FeedbackButton from "@/feedback/FeedbackButton";
import { useOnboardingChecklist } from "@/onboarding/useOnboardingChecklist";
import { BetaBanner } from "@/components/BetaBanner";

type SessionRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string;
};

type SessionQuestionRow = {
  id: string;
  inspection_session_id: string;
  question_text: string;
  domain_name: string | null;
  sort_order: number | null;
  created_at: string;
};

type AnswerRow = {
  id: string;
  inspection_session_question_id: string;
  answer_text: string | null;
  transcript: string | null;
  created_at: string;
};

type EvalRow = {
  id: string;
  created_at: string;
  inspection_session_question_id: string;
  evaluated_by: string | null;
  score: number | null;
  band: string | null;
  strengths: string | null;
  gaps: string | null;
  follow_up_questions: string | null;
};

function safeJsonArray(input: string | null | undefined): string[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Sessions() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selectedSessionId = params.get("session") || "";
  const { completeItem } = useOnboardingChecklist();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestionRow[]>([]);
  const [answersByQ, setAnswersByQ] = useState<Record<string, AnswerRow>>({});
  const [evalByQ, setEvalByQ] = useState<Record<string, EvalRow>>({});
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        toast({ title: "Please log in again", description: "Your session expired." });
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("inspection_sessions")
        .select("id,title,status,created_at")
        .eq("created_by", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error("Load sessions error:", error);
        toast({ title: "Could not load sessions", description: error.message });
        setSessions([]);
      } else {
        setSessions((data as SessionRow[]) || []);
        if (!selectedSessionId && data && data.length > 0) {
          setParams({ session: data[0].id });
        }
      }

      setLoading(false);
    }

    loadSessions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionDetail(sessionId: string) {
      if (!sessionId) return;
      setDetailLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        toast({ title: "Please log in again", description: "Your session expired." });
        navigate("/login", { replace: true });
        return;
      }

      const { data: qData, error: qErr } = await supabase
        .from("inspection_session_questions")
        .select("id,inspection_session_id,question_text,domain_name,sort_order")
        .eq("inspection_session_id", sessionId)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (qErr) {
        console.error("Load session questions error:", qErr);
        toast({ title: "Could not load questions", description: qErr.message });
        setSessionQuestions([]);
        setAnswersByQ({});
        setEvalByQ({});
        setDetailLoading(false);
        return;
      }

      const questions = (qData as SessionQuestionRow[]) || [];
      setSessionQuestions(questions);

      const qIds = questions.map((q) => q.id);
      if (qIds.length === 0) {
        setAnswersByQ({});
        setEvalByQ({});
        setDetailLoading(false);
        return;
      }

      const { data: aData, error: aErr } = await supabase
        .from("inspection_answers")
        .select("id,inspection_session_question_id,answer_text,transcript,created_at")
        .in("inspection_session_question_id", qIds);

      if (cancelled) return;

      if (aErr) {
        console.error("Load answers error:", aErr);
        toast({ title: "Could not load answers", description: aErr.message });
      }

      const aMap: Record<string, AnswerRow> = {};
      ((aData as AnswerRow[]) || []).forEach((a) => {
        aMap[a.inspection_session_question_id] = a;
      });
      setAnswersByQ(aMap);

      const { data: eData, error: eErr } = await supabase
        .from("inspection_evaluations")
        .select(
          "id,created_at,inspection_session_question_id,evaluated_by,score,band,strengths,gaps,follow_up_questions",
        )
        .in("inspection_session_question_id", qIds);

      if (cancelled) return;

      if (eErr) {
        console.error("Load evaluations error:", eErr);
        toast({ title: "Could not load evaluations", description: eErr.message });
      }

      const eMap: Record<string, EvalRow> = {};
      ((eData as EvalRow[]) || []).forEach((e) => {
        eMap[e.inspection_session_question_id] = e;
      });
      setEvalByQ(eMap);

      setDetailLoading(false);
    }

    loadSessionDetail(selectedSessionId);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  const questionStatus = (qId: string): "evaluated" | "answered" | "empty" => {
    if (evalByQ[qId]) return "evaluated";
    const ans = answersByQ[qId];
    const text = ans?.answer_text || ans?.transcript || "";
    if (text.trim().length > 0) return "answered";
    return "empty";
  };

  const statusPill = (status: string | null) => {
    const normalized = (status || "draft").toLowerCase();
    const label =
      normalized === "draft" ? "Draft" : normalized === "completed" ? "Completed" : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    const color =
      normalized === "draft"
        ? "bg-amber-100 text-amber-900"
        : normalized === "completed"
          ? "bg-emerald-100 text-emerald-900"
          : "bg-slate-100 text-slate-900";
    return { label, color };
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out successfully" });
      navigate("/login", { replace: true, state: { toast: "Logged out successfully" } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      console.error("Logout error:", error);
      toast({ title: "Logout failed", description: message });
    }
  };

  const AppNav = () => {
    const linkBase =
      "text-sm font-medium px-3 py-2 rounded-lg transition hover:text-slate-900 hover:bg-slate-100";
    return (
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="text-base font-bold text-black font-display">Voice Inspector</div>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/app"
              className={({ isActive }) =>
                [linkBase, isActive ? "text-slate-900 bg-slate-100" : "text-slate-600"].join(" ")
              }
            >
              Simulator
            </NavLink>
            <NavLink
              to="/app/sessions"
              className={({ isActive }) =>
                [linkBase, isActive ? "text-slate-900 bg-slate-100" : "text-slate-600"].join(" ")
              }
            >
              My sessions
            </NavLink>
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                [linkBase, isActive ? "text-slate-900 bg-slate-100" : "text-slate-600"].join(" ")
              }
            >
              Dashboard
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            <BetaFeedback />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <BetaBanner />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />
      <FeedbackButton onSent={() => completeItem("send_feedback")} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My sessions</h1>
            <p className="text-sm text-slate-600">Your recent practice runs, answers, and evaluations.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="text-sm font-semibold text-slate-800">My sessions</div>
              <div className="text-xs text-slate-500">{loading ? "Loading…" : `${sessions.length}`}</div>
            </div>

            {loading ? (
              <div className="px-2 py-6 text-sm text-slate-600">Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className="px-2 py-6 text-sm text-slate-600">
                <div className="text-sm font-semibold text-slate-900">No sessions yet</div>
                <div className="mt-1 text-sm text-slate-600">
                  Start a practice run in the simulator and your sessions will appear here.
                </div>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                {sessions.map((s) => {
                  const active = s.id === selectedSessionId;
                  const pill = statusPill(s.status);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Open session ${s.title || "Inspection practice"}`}
                      onClick={() => setParams({ session: s.id })}
                      className={[
                        "w-full rounded-xl px-3 py-3 text-left transition",
                        active ? "bg-black/10 ring-1 ring-black/10" : "hover:bg-black/5 ring-1 ring-transparent",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 cursor-pointer",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{s.title || "Inspection practice"}</div>
                          <div className="mt-1 text-xs text-slate-500">{fmtDate(s.created_at)}</div>
                        </div>
                        <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pill.color}`}>
                          {pill.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            {!selectedSession ? (
              <div className="text-sm text-slate-600">
                <div className="text-base font-semibold text-slate-900">Select a session</div>
                <div className="mt-1 text-sm text-slate-600">
                  Choose a session from the list to view questions, answers and evaluations.
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{selectedSession.title || "Inspection practice"}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Created {fmtDate(selectedSession.created_at)} • Status: {selectedSession.status || "draft"}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Evaluated
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Answered
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" /> Not answered
                    </span>
                  </div>
                  {detailLoading ? (
                    <div className="text-sm text-slate-600">Loading session details.</div>
                  ) : sessionQuestions.length === 0 ? (
                    <div className="text-sm text-slate-600">No questions found for this session.</div>
                  ) : (
                    <div className="space-y-4">
                      {sessionQuestions.map((q, idx) => {
                        const ans = answersByQ[q.id];
                        const ev = evalByQ[q.id];

                        const strengths = safeJsonArray(ev?.strengths);
                        const gaps = safeJsonArray(ev?.gaps);
                        const followUps = safeJsonArray(ev?.follow_up_questions);

                        return (
                          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                                  <span
                                    className={[
                                      "inline-block h-2.5 w-2.5 rounded-full",
                                      questionStatus(q.id) === "evaluated"
                                        ? "bg-emerald-500"
                                        : questionStatus(q.id) === "answered"
                                          ? "bg-amber-500"
                                          : "bg-slate-400",
                                    ].join(" ")}
                                  />
                                  <span>
                                    Q{idx + 1}
                                    {q.domain_name ? ` • ${q.domain_name}` : ""}
                                  </span>
                                </div>
                                <div className="text-base font-semibold text-slate-900">{q.question_text}</div>
                        {ev ? (
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-3 py-1 text-sm font-semibold text-white">
                            <span>{ev.band === "Inadequate" ? "Needs development" : (ev.band || "-")}</span>
                            {typeof ev.score === "number" && <span className="text-xs font-medium">Score: {ev.score}</span>}
                          </div>
                        ) : (
                                  <div className="text-xs text-slate-500">Not evaluated yet</div>
                                )}
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-slate-800">Answer</div>
                                  <div
                                    className={[
                                      "rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap relative",
                                      expandedAnswers[q.id] ? "max-h-none" : "max-h-24 overflow-hidden",
                                    ].join(" ")}
                                  >
                                    {ans?.answer_text || ans?.transcript || "No answer recorded yet."}
                                    {!expandedAnswers[q.id] && (
                                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: !prev[q.id],
                                      }))
                                    }
                                    className="text-sm font-medium text-[#0D9488]"
                                  >
                                    {expandedAnswers[q.id] ? "Hide answer" : "Show answer"}
                                  </button>
                                  {ans?.created_at && (
                                    <div className="text-[11px] text-slate-500">Saved {fmtDate(ans.created_at)}</div>
                                  )}
                                </div>

                                {ev && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                  <div className="text-sm font-medium text-slate-800">Strengths</div>
                                  <ul className="list-disc pl-5 text-sm text-slate-800">
                                    {strengths.length
                                      ? strengths.map((s, i) => <li key={i}>{s}</li>)
                                      : (
                                        <li>
                                          No explicit strengths were identified. Focus on providing specific examples and evidence to demonstrate good practice.
                                        </li>
                                      )}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-slate-800">Gaps</div>
                                  <ul className="list-disc pl-5 text-sm text-slate-800">
                                    {gaps.length
                                      ? gaps.map((g, i) => <li key={i}>{g}</li>)
                                      : <li>No gaps available.</li>}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-slate-800">Follow-up questions</div>
                                  <ul className="list-disc pl-5 text-sm text-slate-800">
                                    {followUps.length
                                      ? followUps.map((f, i) => <li key={i}>{f}</li>)
                                      : <li>No follow-up questions available.</li>}
                                  </ul>
                                </div>
                                    <div className="text-[11px] text-slate-500">Evaluated {fmtDate(ev.created_at)}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
