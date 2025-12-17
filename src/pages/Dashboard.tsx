import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { buildDashboardModel, type DashboardModel } from "@/lib/dashboardModel";
import { BetaFeedback } from "@/components/BetaFeedback";
import FeedbackButton from "@/feedback/FeedbackButton";
import { OnboardingChecklist } from "@/onboarding/OnboardingChecklist";
import { useOnboardingChecklist } from "@/onboarding/useOnboardingChecklist";
import { BetaBanner } from "@/components/BetaBanner";

type SessionRow = {
  id: string;
  created_at: string;
};

type QuestionRow = {
  id: string;
  domain_name: string | null;
};

type EvalRow = {
  inspection_session_question_id: string;
  score: number | null;
  band: string | null;
  strengths: string | null;
  gaps: string | null;
};

const scoreToBand = (score: number) => {
  if (score >= 85) return "Outstanding";
  if (score >= 70) return "Good";
  if (score >= 50) return "Requires improvement to be good";
  return "Inadequate";
};

const parseArray = (raw: string | null) => {
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
};

const linkBase =
  "text-sm font-medium px-3 py-2 rounded-lg transition hover:text-slate-900 hover:bg-slate-100";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardModel, setDashboardModel] = useState<DashboardModel | null>(null);
  const { completeItem, reset, state } = useOnboardingChecklist();

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        toast({ title: "Please log in again", description: "Your session expired." });
        navigate("/login", { replace: true });
        return;
      }

      const { data: sessionsWithEvals, error: sessErr } = await supabase
        .from("inspection_sessions")
        .select("id, created_at, inspection_session_questions(id, inspection_evaluations(id))")
        .eq("created_by", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (cancelled) return;
      if (sessErr) {
        console.error("Load sessions error:", sessErr);
        toast({ title: "Could not load sessions", description: sessErr.message });
      }

      const chosen =
        Array.isArray(sessionsWithEvals)
          ? sessionsWithEvals.find(
              (s: unknown) =>
                s &&
                typeof s === "object" &&
                Array.isArray((s as { inspection_session_questions?: unknown }).inspection_session_questions) &&
                (s as { inspection_session_questions: unknown[] }).inspection_session_questions.some(
                  (q: unknown) =>
                    q &&
                    typeof q === "object" &&
                    Array.isArray((q as { inspection_evaluations?: unknown }).inspection_evaluations) &&
                    (q as { inspection_evaluations: unknown[] }).inspection_evaluations.length > 0,
                ),
            )
          : null;

      if (!chosen) {
        setDashboardModel(null);
        setLoading(false);
        return;
      }

      const sessionMeta: SessionRow = { id: chosen.id, created_at: chosen.created_at };

      const { data: questions, error: qErr } = await supabase
        .from("inspection_session_questions")
        .select("id,domain_name")
        .eq("inspection_session_id", sessionMeta.id);

      if (cancelled) return;
      if (qErr || !questions) {
        setDashboardModel(null);
        setLoading(false);
        return;
      }

      const qMap: Record<string, string> = {};
      (questions as QuestionRow[]).forEach((q) => {
        qMap[q.id] = q.domain_name || "General";
      });
      const questionIds = (questions as QuestionRow[]).map((q) => q.id);

      const { data: evals, error: eErr } = await supabase
        .from("inspection_evaluations")
        .select("inspection_session_question_id,score,band,strengths,gaps")
        .in("inspection_session_question_id", questionIds);

      if (cancelled) return;
      if (eErr) {
        console.error("Load evaluations error:", eErr);
        toast({ title: "Could not load evaluations", description: eErr.message });
      }
      if (eErr || !evals || (evals as EvalRow[]).length === 0) {
        setDashboardModel({
          totalQuestions: questionIds.length,
          evaluatedCount: 0,
          averageScore: 0,
          band: scoreToBand(0),
          strongestDomain: "Not enough data yet",
          weakestDomain: "Not enough data yet",
          domainStats: [],
          strengthThemes: [],
          improvementActions: [],
          sessionCreatedAt: sessionMeta.created_at,
        });
        setLoading(false);
        return;
      }

      const model = buildDashboardModel({
        questions: (questions as QuestionRow[]).map((q) => ({ id: q.id, domain: q.domain_name || "General" })),
        evaluations: (evals as EvalRow[]).map((ev) => ({
          inspection_session_question_id: ev.inspection_session_question_id,
          score: typeof ev.score === "number" && Number.isFinite(ev.score) ? ev.score : 0,
          strengths: parseArray(ev.strengths),
          gaps: parseArray(ev.gaps),
        })),
        sessionCreatedAt: sessionMeta.created_at,
      });

      setDashboardModel(model);
      setLoading(false);
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const AppNav = () => {
    return (
      <>
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
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({ title: "Logged out successfully" });
                  navigate("/login", { replace: true, state: { toast: "Logged out successfully" } });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <BetaBanner />
      </>
    );
  };

  const renderBars = () => {
    if (!dashboardModel || dashboardModel.domainStats.length === 0) {
      return <div className="text-sm text-slate-600">No evaluations yet. Complete a session to see scores by domain.</div>;
    }
    return (
      <div className="space-y-3">
        {dashboardModel.domainStats.map((d) => (
          <div key={d.domain}>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>{d.domain}</span>
              <span className="font-semibold text-slate-900">{d.average.toFixed(1)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[#0D9488]"
                style={{ width: `${Math.max(0, Math.min(100, d.average))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />
      <FeedbackButton onSent={() => completeItem("send_feedback")} />
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Performance overview</h1>
          <p className="text-sm text-slate-600">Summary of your inspection practice</p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={reset}>
            {state.dismissed ? "Show checklist" : "Reset checklist"}
          </Button>
        </div>

        <div className="max-w-lg">
          <OnboardingChecklist />
        </div>

        {loading ? (
          <div className="text-sm text-slate-600">Loading dashboard…</div>
        ) : !dashboardModel ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <div className="text-base font-semibold text-slate-900">No evaluations yet</div>
            <div className="mt-1 text-sm text-slate-600">
              Complete an evaluation in the simulator to see your performance overview.
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-600">Overall score</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-2xl font-semibold text-slate-900">{dashboardModel.averageScore.toFixed(1)}</div>
                  <span className="inline-flex items-center rounded-full bg-[#0D9488] px-2 py-1 text-xs font-semibold text-white">
                    {dashboardModel.band}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-600">Coverage</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {dashboardModel.evaluatedCount} / {dashboardModel.totalQuestions || 0}
                </div>
                <div className="text-xs text-slate-600">Latest session: {new Date(dashboardModel.sessionCreatedAt).toLocaleDateString()}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-600">Strongest domain</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{dashboardModel.strongestDomain}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-600">Priority improvement</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{dashboardModel.weakestDomain}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Scores by domain</div>
                  <div className="text-xs text-slate-600">Latest evaluated session</div>
                </div>
              </div>
              <div className="mt-4">{renderBars()}</div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="text-sm font-semibold text-slate-900">Key strengths</div>
                {dashboardModel.strengthThemes.length ? (
                  <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                    {dashboardModel.strengthThemes.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-600">No strengths identified yet.</div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="text-sm font-semibold text-slate-900">Priority improvements</div>
                {dashboardModel.improvementActions.length ? (
                  <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                    {dashboardModel.improvementActions.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-600">No improvement actions identified yet.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
