import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import {
  questionBank,
  DOMAIN_LABELS,
  DOMAIN_ORDER,
  DOMAIN_TAGS,
  getBandColorClass,
  type Domain,
  type BankQuestion,
  type JudgementBand,
} from "@/lib/questions";
import { computeTrialUsage, TRIAL_DAILY_LIMIT, TRIAL_TOTAL_LIMIT } from "@/lib/trial";
import { clearPaused, generateReportAndWait, loadPaused, progressColor, savePaused } from "@/lib/simulator";
import { trackSessionStart, trackSessionComplete, trackReportGenerated } from "@/lib/analytics";
import AppNav from "@/components/AppNav";
import ConfettiBurst from "@/components/ConfettiBurst";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { Mic, Keyboard, ArrowRight, CheckCircle2, AlertTriangle, Loader2, FileText, RotateCcw, X, BookOpen, Target, Pause, Play, SkipForward } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "idle" | "input" | "transcribing" | "evaluating" | "evaluated" | "completing" | "done";
type InputMode = "voice" | "text";

interface EvalResult {
  score: number;
  band: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  developmentPoints: string[];
  followUpQuestion: string;
  inspectorNote: string;
  regulatoryReference: string;
  encouragement: string;
}

interface QuestionState {
  question: BankQuestion;
  transcript: string;
  result: EvalResult | null;
}

// ── Seeded RNG (mulberry32) ───────────────────────────────────────────────────

function hashSeed(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: string) {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Safeguarding is a limiting judgement — always included first in the list
const MANDATORY_DOMAINS: Domain[] = ["ProtectionChildren", "LeadershipManagement"];
// Questions per domain per session (2 × 9 domains = 18 total)
const QUESTIONS_PER_DOMAIN = 2;
// Minimum answered questions before a report can be generated
export const MIN_ANSWERS_FOR_REPORT = 3;

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickSessionQuestions(sessionId: string): BankQuestion[] {
  const rng = mulberry32(sessionId);
  const grouped: Record<string, BankQuestion[]> = {};
  for (const q of questionBank) {
    if (!grouped[q.domain]) grouped[q.domain] = [];
    grouped[q.domain].push(q);
  }

  // All 9 domains, mandatory first then rest in DOMAIN_ORDER
  const selectedDomains = DOMAIN_ORDER; // all domains always included

  // Pick QUESTIONS_PER_DOMAIN random questions per domain (no repeats within domain)
  return selectedDomains
    .flatMap((domain) => {
      const pool = fisherYates(grouped[domain] ?? [], rng);
      return pool.slice(0, QUESTIONS_PER_DOMAIN);
    })
    .filter(Boolean);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DISCLAIMER =
  "This is a practice evaluation based on your answer only. It does not reflect a full Ofsted inspection or constitute legal compliance advice. All scores are AI-generated.";

function BandPill({ band }: { band: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBandColorClass(band)}`}>
      {band}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Gate state
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [trialInfo, setTrialInfo] = useState<ReturnType<typeof computeTrialUsage> | null>(null);
  const [gateLoading, setGateLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [step, setStep] = useState<Step>("idle");
  const [skipUsed, setSkipUsed] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [paused, setPaused] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportSessionId, setReportSessionId] = useState<string | null>(null);
  const answerAreaRef = useRef<HTMLDivElement>(null);

  // ── Load subscription ──────────────────────────────────────────────────────

  const loadGate = async () => {
    if (!user) return;
      setGateLoading(true);
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status,stripe_subscription_id,created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const status = sub?.status ?? null;
      const stripeId = sub?.stripe_subscription_id ?? null;
      setSubscriptionStatus(status);
      setStripeSubscriptionId(stripeId);

      const isPaid = status === "active" || (!!stripeId && status === "trialing");
      if (isPaid) {
        setTrialInfo(null);
        setGateLoading(false);
        return;
      }

      const trialStart = sub?.created_at ? new Date(sub.created_at) : new Date();
      const { data: sessions } = await supabase
        .from("sessions")
        .select("started_at")
        .eq("user_id", user.id)
        .gte("started_at", trialStart.toISOString());

      setTrialInfo(computeTrialUsage(trialStart, sessions ?? []));
      setGateLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadGate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isPaidSubscriber = subscriptionStatus === "active"
    || (!!stripeSubscriptionId && subscriptionStatus === "trialing");

  const canStart = (() => {
    if (gateLoading) return false;
    if (isPaidSubscriber) return true;
    if (!trialInfo) return true;
    if (trialInfo.expired) return false;
    if (trialInfo.remainingTotal <= 0) return false;
    if (trialInfo.remainingToday <= 0) return false;
    return true;
  })();

  const checkoutSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    if (!checkoutSuccess || !user) return;
    async function syncAndReload() {
      setSyncing(true);
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token ?? "";
        await supabase.functions.invoke("sync-subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        await new Promise((r) => setTimeout(r, 500));
        await loadGate();
        setJustSubscribed(true);
      } finally {
        setSyncing(false);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("checkout");
          return next;
        });
      }
    }
    syncAndReload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutSuccess, user]);

  useEffect(() => {
    if (!sessionId) return;
    setPaused(loadPaused(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    savePaused(sessionId, paused);
  }, [paused, sessionId]);

  // ── Start session ──────────────────────────────────────────────────────────

  const startSession = async () => {
    if (!user) return;
    if (!canStart) {
      navigate("/app/paywall");
      return;
    }
    setError(null);

    // Ensure public.users row exists (in case trigger didn't fire at signup)
    await supabase
      .from("users")
      .upsert({ id: user.id }, { onConflict: "id" });

    // Create session row
    const { data: sess, error: sErr } = await supabase
      .from("sessions")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (sErr || !sess) {
      const msg = sErr?.message ?? "Unknown error";
      if (msg.toLowerCase().includes("row-level security")) {
        setError("Trial limit reached. Free trial includes 2 sessions/day for 3 days (6 total).");
      } else {
        setError("Failed to start session: " + msg);
      }
      return;
    }

    const sid = sess.id;
    setSessionId(sid);

    const picked = pickSessionQuestions(sid);
    setQuestions(picked.map((q) => ({ question: q, transcript: "", result: null })));
    trackSessionStart(picked.length);
    setQIndex(0);
    setStep("input");
    setSkipUsed(false);
    setShowUpsell(false);
    setPendingReportId(null);
    setTranscript("");
    setTextInput("");
    setEvalResult(null);
    setShowGenerate(false);
    clearPaused(sid);
  };

  // ── Transcribe audio ───────────────────────────────────────────────────────

  const handleRecordingComplete = async (blob: Blob) => {
    setStep("transcribing");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token ?? "";

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: formData,
      });

      const json = await res.json();
      const text = json?.transcript || json?.text || "";
      if (!text) throw new Error("No transcript returned");
      setTranscript(text);
      setStep("input"); // show editing step
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed. Please try again or use text input.");
      setStep("input");
    }
  };

  // ── Evaluate answer ────────────────────────────────────────────────────────

  const evaluate = async (answerText: string) => {
    if (!sessionId || !user) return;
    const q = questions[qIndex];
    if (!q) return;

    setStep("evaluating");
    setError(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("evaluate", {
        body: {
          question: q.question.text,
          answerText,
          domain: q.question.domain,
          hint: q.question.hint,
        },
      });

      if (fnErr) throw fnErr;

      const result: EvalResult = {
        score: data?.score ?? 1,
        band: data?.band ?? "Inadequate",
        summary: data?.summary ?? "",
        strengths: Array.isArray(data?.strengths) ? data.strengths : [],
        gaps: Array.isArray(data?.gaps) ? data.gaps : [],
        developmentPoints: Array.isArray(data?.developmentPoints) ? data.developmentPoints : [],
        followUpQuestion: data?.followUpQuestion ?? "",
        inspectorNote: data?.inspectorNote ?? "",
        regulatoryReference: data?.regulatoryReference ?? "",
        encouragement: data?.encouragement ?? "",
      };

      // Save to DB
      await supabase.from("responses").insert({
        session_id: sessionId,
        domain: q.question.domain,
        question_text: q.question.text,
        answer_text: answerText,
        score: result.score,
        band: result.band,
        feedback_json: result,
      });

      // Update question state
      setQuestions((prev) => {
        const next = [...prev];
        next[qIndex] = { ...next[qIndex], transcript: answerText, result };
        return next;
      });
      setEvalResult(result);
      setStep("evaluated");
      answerAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed. Please try again.");
      setStep("input");
    }
  };

  const handleTextSubmit = () => {
    const text = textInput.trim();
    if (!text) return;
    setTranscript(text);
    evaluate(text);
  };

  const handleTranscriptSubmit = () => {
    evaluate(transcript);
  };

  // ── Navigate questions ────────────────────────────────────────────────────

  const goNext = async () => {
    const isLast = qIndex === questions.length - 1;
    if (isLast) {
      await completeSession();
    } else {
      setQIndex((i) => i + 1);
      setStep("input");
      setTranscript("");
      setTextInput("");
      setEvalResult(null);
      setError(null);
    }
  };

  const pickReplacementQuestion = () => {
    if (!sessionId) return null;
    const usedDomains = new Set(questions.map((q) => q.question.domain));
    const availableDomains = DOMAIN_ORDER.filter((d) => !usedDomains.has(d));
    if (availableDomains.length === 0) return null;
    const rng = mulberry32(`${sessionId}-skip`);
    const domain = availableDomains[Math.floor(rng() * availableDomains.length)];
    const pool = questionBank.filter((q) => q.domain === domain);
    if (pool.length === 0) return null;
    const idx = Math.floor(rng() * pool.length);
    return pool[idx];
  };

  const skipQuestion = async () => {
    if (skipUsed) return;
    const replacement = pickReplacementQuestion();
    setSkipUsed(true);
    if (!replacement) {
      const isLast = qIndex === questions.length - 1;
      if (isLast) {
        await completeSession();
      } else {
        setQIndex((i) => i + 1);
        setStep("input");
        setTranscript("");
        setTextInput("");
        setEvalResult(null);
        setError(null);
      }
      return;
    }

    setQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = { question: replacement, transcript: "", result: null };
      return next;
    });
    setStep("input");
    setTranscript("");
    setTextInput("");
    setEvalResult(null);
    setError(null);
  };

  // ── Complete session ───────────────────────────────────────────────────────

  const completeSession = async () => {
    if (!sessionId || !user) return;
    setStep("completing");

    try {
      const ok = await generateReportAndWait({ sessionId });
      if (!ok) {
        setError("Report generation is taking longer than expected. Please try again.");
        setStep("evaluated");
        return;
      }
      // Derive score/band from answered questions for analytics
      const answered = questions.filter((q) => q.result);
      const avgScore = answered.length
        ? answered.reduce((s, q) => s + (q.result?.score ?? 0), 0) / answered.length
        : 0;
      const topBand = answered[0]?.result?.band ?? "Unknown";
      trackSessionComplete({
        overall_band: topBand,
        overall_score: Math.round(avgScore * 10) / 10,
        questions_answered: answered.length,
      });
      trackReportGenerated(sessionId);
      setReportSessionId(sessionId);
      if (!isPaidSubscriber && trialInfo) {
        setPendingReportId(sessionId);
        setShowUpsell(true);
        setStep("done");
      } else {
        navigate(`/app/report/${sessionId}`);
      }
    } catch {
      // Even on failure, mark as done and go to report page (report will show raw responses)
      trackReportGenerated(sessionId);
      setReportSessionId(sessionId);
      if (!isPaidSubscriber && trialInfo) {
        setPendingReportId(sessionId);
        setShowUpsell(true);
        setStep("done");
      } else {
        navigate(`/app/report/${sessionId}`);
      }
    } finally {
      if (trialInfo && !isPaidSubscriber) {
        const usedTotal = trialInfo.usedTotal + 1;
        const usedToday = trialInfo.usedToday + 1;
        const remainingTotal = Math.max(0, TRIAL_TOTAL_LIMIT - usedTotal);
        const remainingToday = Math.max(0, TRIAL_DAILY_LIMIT - usedToday);
        setTrialInfo({
          ...trialInfo,
          usedTotal,
          usedToday,
          remainingTotal,
          remainingToday,
        });
      }
      if (sessionId) clearPaused(sessionId);
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login?loggedOut=true", { replace: true });
  };

  const restartSession = async () => {
    if (!window.confirm("Start a new session? Your current progress will not be saved.")) return;
    setReportSessionId(null);
    setStep("idle");
    await startSession();
  };

  const stopSession = () => {
    if (!window.confirm("Stop this session and return to the dashboard?")) return;
    if (sessionId) clearPaused(sessionId);
    navigate("/app/dashboard");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const currentQ = questions[qIndex];
  const domainLabel = currentQ ? DOMAIN_LABELS[currentQ.question.domain as Domain] : "";
  const domainTag = currentQ ? DOMAIN_TAGS[currentQ.question.domain as Domain] : "";
  const isLimitingDomain = domainTag === "LIMITING JUDGEMENT";
  const completedCount = questions.filter((q) => q.result !== null).length;
  const avgScore = completedCount > 0
    ? questions.reduce((sum, q) => sum + (q.result ? q.result.score : 0), 0) / completedCount
    : null;

  useEffect(() => {
    setShowGenerate(completedCount >= MIN_ANSWERS_FOR_REPORT);
  }, [completedCount]);

  useEffect(() => {
    if (!showUpsell || !pendingReportId) return;
    const t = window.setTimeout(() => {
      navigate(`/app/report/${pendingReportId}`);
      setShowUpsell(false);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [showUpsell, pendingReportId, navigate]);

  const handleGenerateReport = async () => {
    if (completedCount < MIN_ANSWERS_FOR_REPORT) return;
    if (completedCount < questions.length) {
      const ok = window.confirm(`Partial report — you've answered ${completedCount} of ${questions.length} questions. Continue for a fuller picture?`);
      if (!ok) return;
    }
    await completeSession();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <AppNav
        isPaid={isPaidSubscriber}
        onSignOut={handleSignOut}
        extraControls={
          step !== "idle" && step !== "done" ? (
            <>
              <button
                onClick={restartSession}
                title="Restart session"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Restart</span>
              </button>
              <button
                onClick={stopSession}
                title="Stop session"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            </>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Idle: start screen ─────────────────────────────────────────── */}
        {step === "idle" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 relative">
            <ConfettiBurst active={justSubscribed} />
            {gateLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            ) : syncing ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  <span className="text-sm text-slate-600">Confirming your subscription…</span>
                </div>
              </div>
            ) : !canStart ? (
              <div className="max-w-md">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-50 ring-2 ring-amber-200">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
                  {trialInfo?.expired ? "Free trial ended" : "Trial limit reached"}
                </h1>
                <p className="mt-2 text-slate-600">
                  Free trial includes 2 sessions/day for 3 days (6 total). Subscribe for unlimited sessions and full reports.
                </p>
                <Link
                  to="/app/paywall"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                >
                  Subscribe — £29/month <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-xs text-slate-400">
                  <Link to="/app/dashboard" className="hover:underline">Back to dashboard</Link>
                </p>
              </div>
            ) : (
              <div className="max-w-md">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-teal-50 ring-2 ring-teal-200">
                  <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
                    <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="#0D9488" strokeWidth="2" strokeLinejoin="round" fill="none" />
                    <path d="M16 4v18M4 10l12 6 12-6" stroke="#0D9488" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
                  {justSubscribed ? "Subscription confirmed — unlimited access" : "Ready to practise?"}
                </h1>
                <p className="mt-2 text-slate-600">
                  You'll answer up to 18 questions across all 9 Quality Standards — safeguarding and leadership always come first, just like a real Ofsted visit. Generate your report any time after 3 answers.
                </p>
                <div className="mt-3 flex justify-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Up to 18 questions</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Voice or text</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Full Ofsted-style report</span>
                </div>
                {trialInfo && !isPaidSubscriber && (
                  <div className="mt-3 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                    Free trial: {trialInfo.remainingToday} left today · {trialInfo.remainingTotal} total left
                  </div>
                )}
                {error && (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                )}
                <button
                  onClick={startSession}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-7 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
                >
                  Start session <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Active session ─────────────────────────────────────────────── */}
        {step !== "idle" && step !== "done" && currentQ && (
          <div className="space-y-6 relative">
            {/* Pause overlay */}
            {paused && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-sm min-h-[60vh]">
                <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-slate-100">
                    <Pause className="h-6 w-6 text-slate-600" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold text-slate-900">Session paused</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Paused — resume or generate report when you're ready.
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      onClick={() => setPaused(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                    >
                      <Play className="h-4 w-4" /> Resume session
                    </button>
                    <button
                      onClick={handleGenerateReport}
                      disabled={completedCount < MIN_ANSWERS_FOR_REPORT}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors ${
                        completedCount >= MIN_ANSWERS_FOR_REPORT
                          ? "border border-teal-200 text-teal-700 hover:bg-teal-50"
                          : "border border-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <FileText className="h-4 w-4" /> Generate report
                    </button>
                    <button
                      onClick={stopSession}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Exit to dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Question {qIndex + 1} of {questions.length}
                </p>
                <h2 className="font-display text-lg font-bold text-slate-900">{domainLabel}</h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {isLimitingDomain && (
                  <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
                    LIMITING JUDGEMENT
                  </span>
                )}
                <span className="text-sm text-slate-500">{completedCount}/{questions.length} answered</span>
                <button
                  onClick={() => setPaused(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow border border-slate-200 hover:bg-slate-50 transition flex-shrink-0"
                >
                  <Pause className="h-3.5 w-3.5" /> Pause
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-slate-200">
              <div
                className={`h-1.5 rounded-full transition-all ${progressColor(avgScore)}`}
                style={{ width: `${(completedCount / questions.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">{domainTag}</span>
              </div>
              <p className="font-display text-lg font-semibold text-slate-900 leading-snug">
                {currentQ.question.text}
              </p>
              {currentQ.question.hint && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
                    Inspector hint ▸
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 italic">{currentQ.question.hint}</p>
                </details>
              )}
            </div>

            {/* Input area */}
            <div ref={answerAreaRef}>
              {step === "input" && !transcript && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setInputMode("voice")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "voice" ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        <Mic className="h-4 w-4" /> Voice
                      </button>
                      <button
                        onClick={() => setInputMode("text")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "text" ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        <Keyboard className="h-4 w-4" /> Text
                      </button>
                    </div>
                    <button
                      onClick={skipQuestion}
                      title="Skip this question"
                      disabled={skipUsed}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        skipUsed
                          ? "border-slate-200 text-slate-300 cursor-not-allowed"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <SkipForward className="h-3.5 w-3.5" /> {skipUsed ? "Skip used" : "Skip question"}
                    </button>
                  </div>

                  {inputMode === "voice" ? (
                    <div>
                      <p className="text-sm text-slate-500 mb-3">Click the microphone and speak your answer. Recording will be transcribed automatically.</p>
                      <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type your answer here…"
                        rows={6}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                      />
                      <button
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
                      >
                        Submit answer <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Transcribing */}
              {step === "transcribing" && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                  <p className="text-sm text-slate-600">Transcribing your recording…</p>
                </div>
              )}

              {/* Transcript editing (after voice transcription) */}
              {step === "input" && transcript && (
                <TranscriptEditor
                  transcript={transcript}
                  onTranscriptChange={setTranscript}
                  onSubmitForEvaluation={handleTranscriptSubmit}
                  onRecordAgain={() => { setTranscript(""); setTextInput(""); }}
                  isLoading={false}
                />
              )}

              {/* Evaluating */}
              {step === "evaluating" && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                  <p className="text-sm text-slate-600">Evaluating your answer…</p>
                </div>
              )}

              {/* Error */}
              {error && step === "input" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Evaluated: results */}
              {step === "evaluated" && evalResult && (
                <div className="space-y-4">
                  {/* Score card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                      <h3 className="font-display text-lg font-bold text-slate-900">Evaluation</h3>
                      <BandPill band={evalResult.band} />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{evalResult.summary}</p>

                    {evalResult.strengths.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">Strengths</p>
                        <ul className="space-y-1.5">
                          {evalResult.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evalResult.gaps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">Areas for improvement</p>
                        <ul className="space-y-1.5">
                          {evalResult.gaps.map((g, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evalResult.developmentPoints.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 mb-2">Development points</p>
                        <ul className="space-y-1.5">
                          {evalResult.developmentPoints.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <Target className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evalResult.followUpQuestion && (
                      <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Inspector's follow-up</p>
                        <p className="text-sm italic text-slate-700">"{evalResult.followUpQuestion}"</p>
                      </div>
                    )}

                    {evalResult.inspectorNote && (
                      <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">Inspector's note</p>
                        <p className="text-sm text-blue-800">{evalResult.inspectorNote}</p>
                      </div>
                    )}

                    {evalResult.regulatoryReference && (
                      <div className="mt-3 flex items-start gap-2">
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <p className="text-xs text-slate-400 italic">{evalResult.regulatoryReference}</p>
                      </div>
                    )}

                    {evalResult.encouragement && (
                      <div className="mt-4 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                        <p className="text-sm text-teal-800 font-medium">{evalResult.encouragement}</p>
                      </div>
                    )}
                  </div>

                  {/* Mandatory disclaimer */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800">
                    <strong>Important:</strong> {DISCLAIMER}
                  </div>

                  {/* Next button */}
                  <div className="flex justify-end">
                    <button
                      onClick={goNext}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
                    >
                      {qIndex === questions.length - 1 ? (
                        <>Generate report <FileText className="h-4 w-4" /></>
                      ) : (
                        <>Next question <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Completing */}
              {step === "completing" && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                  <p className="text-sm text-slate-600">Generating your full inspection report…</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 ring-2 ring-teal-200">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Session complete</h2>
              <p className="mt-2 text-slate-600">Your full inspection report is ready.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/app/report/${reportSessionId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                View full report
              </Link>
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Dashboard
              </Link>
            </div>
            {!isPaidSubscriber && trialInfo && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="font-semibold">Free trial: {trialInfo.remainingTotal} sessions left</div>
                <div className="mt-1 text-amber-800">
                  Subscribe for unlimited sessions, full reports, and no daily limits.
                </div>
                <div className="mt-3">
                  <Link
                    to="/app/paywall"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Unlock unlimited sessions <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 max-w-md">{DISCLAIMER}</p>
          </div>
        )}
        {step !== "idle" && step !== "done" && showGenerate && (
          <button
            onClick={handleGenerateReport}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105 transition"
          >
            <FileText className="h-4 w-4" /> Generate Report
          </button>
        )}
      </main>

      {showUpsell && trialInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 mb-4 mx-auto">
              <CheckCircle2 className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Great practice!</h2>
            <p className="text-sm text-slate-600">
              {trialInfo.remainingToday} sessions left today. Unlimited sessions with Pro.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/app/paywall"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Go Pro — Unlimited Sessions
              </Link>
              <button
                onClick={() => {
                  if (pendingReportId) navigate(`/app/report/${pendingReportId}`);
                  setShowUpsell(false);
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                View report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
