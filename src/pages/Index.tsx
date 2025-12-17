import { useState, useMemo, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { EvaluationResult, getJudgementBand, BankQuestion } from "@/lib/questions";
import { QuestionCard } from "@/components/QuestionCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { EvaluationResults } from "@/components/EvaluationResults";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { InputMethodSelector } from "@/components/InputMethodSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingOverlay from "@/components/LoadingOverlay";
import { supabase } from "@/lib/supabase";
import { bandUi } from "@/lib/evalUi";
import { useLoading } from "@/providers/LoadingProvider";
import { Loader2, ChevronLeft, ChevronRight, MessageCircleQuestion, Clock, Settings, RefreshCw, AlertTriangle, MessageSquare, Mail, Check } from "lucide-react";
import { detectFollowUpNeed, FollowUpDecision, getFollowUpLabel } from "@/lib/followUpRules";
import { evaluationSchema } from "@/lib/evaluationSchema";
import { buildFallbackActions, buildFallbackGaps, buildFallbackStrengths, buildFollowUpFallback, nonEmptyArray } from "@/lib/evalFallbacks";
import FinalSummaryReport from "@/components/report/FinalSummaryReport";
import { BetaFeedback } from "@/components/BetaFeedback";
import FeedbackButton from "@/feedback/FeedbackButton";
import CompletionPrompt from "@/feedback/CompletionPrompt";
import { useOnboardingChecklist } from "@/onboarding/useOnboardingChecklist";
import { BetaBanner } from "@/components/BetaBanner";
import { generateSessionQuestions } from "@/lib/inspectionSession";

type Step = 
  | "ready" 
  | "recording"
  | "uploading" 
  | "transcribing" 
  | "editing" 
  | "evaluating" 
  | "evaluated" 
  | "summary";

interface QuestionResult {
  transcript: string;
  evaluation: EvaluationResult;
  followUpUsed: boolean;
  followUpTranscript?: string;
  followUpEvaluation?: EvaluationResult;
  followUpDecision?: FollowUpDecision;
}

type SubmitType = "feedback" | "contact";
interface SendResult {
  ok: boolean;
  message: string;
}

const emailAddress = "reports@ziantra.co.uk";
const ACTIVE_SESSION_KEY = "active_session_id";

async function sendFeedback(payload: Record<string, string>, type: SubmitType): Promise<SendResult> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, ...payload }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Unable to send");
    }

    return { ok: true, message: "Thanks! We've received your message." };
  } catch (error) {
    const subject = type === "feedback" ? "Voice Inspector feedback" : "Voice Inspector contact";
    const body = Object.entries(payload)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send via the service; opened your email client instead.",
    };
  }
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const normalizeList = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((v) => (v ?? "").toString().trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const loading = useLoading();
  const desiredQuestionCountEnv = Number((import.meta as { env?: Record<string, string> })?.env?.VITE_SESSION_QUESTION_COUNT);
  const desiredQuestionCount = ((desiredQuestionCountEnv >= 5 && desiredQuestionCountEnv <= 7)
    ? desiredQuestionCountEnv
    : 6) as 5 | 6 | 7;
  const [sessionQuestions, setSessionQuestions] = useState<BankQuestion[]>(() =>
    generateSessionQuestions("preview", desiredQuestionCount),
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState<Step>("ready");
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [results, setResults] = useState<Map<number, QuestionResult>>(new Map());
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [transcriptionWarning, setTranscriptionWarning] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [allowPlaceholder, setAllowPlaceholder] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionQuestionIds, setSessionQuestionIds] = useState<string[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [storedSessionId, setStoredSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("active_session_id");
  });
  const { completeItem } = useOnboardingChecklist();
  const [markedAnswerComplete, setMarkedAnswerComplete] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  const persistActiveSession = (id: string) => {
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
    } catch {
      // ignore
    }
    setStoredSessionId(id);
  };

  const clearActiveSessionFlag = () => {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {
      // ignore
    }
    setStoredSessionId(null);
  };

  const clearActiveSession = () => {
    clearActiveSessionFlag();
    setSessionId(null);
    setSessionQuestionIds([]);
    setSessionQuestions(generateSessionQuestions("preview", desiredQuestionCount));
    setSavedAnswers({});
    setResults(new Map());
    setCompletedQuestions([]);
    setEvaluation(null);
    setTranscript("");
    setFollowUpCount(0);
    setIsFollowUp(false);
    setStep("ready");
  };

  const currentQuestion = sessionQuestions[currentQuestionIndex] || sessionQuestions[0];

  const progressLabel = useMemo(() => {
    return `Question ${currentQuestionIndex + 1} of ${sessionQuestions.length}`;
  }, [currentQuestionIndex, sessionQuestions.length]);

  useEffect(() => {
    if (sessionId || resumeLoading) return;
    const existing = storedSessionId || (typeof window !== "undefined" ? localStorage.getItem(ACTIVE_SESSION_KEY) : null);
    if (existing) {
      setStoredSessionId(existing);
      void resumeSession(existing);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, storedSessionId]);

  useEffect(() => {
    const qId = sessionQuestionIds[currentQuestionIndex];
    const saved = qId ? savedAnswers[qId] : "";
    if (!qId || !saved) return;
    if (step === "ready" && !transcript) {
      setTranscript(saved);
      setStep("editing");
    }
  }, [currentQuestionIndex, sessionQuestionIds, savedAnswers, step, transcript]);

  const resetForQuestion = () => {
    setStep("ready");
    setTranscript("");
    setEvaluation(null);
    setFollowUpCount(0);
    setIsFollowUp(false);
    setTranscriptionWarning(false);
  };

  const handleVoiceSelected = () => {
    setStep("recording");
  };

  const requireAuth = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (!user) {
      const err = new Error("Not authenticated (missing session)");
      throw err;
    }
    console.log("AUTH USER", user.id);
    return user;
  };

  const ensureProfile = async (user: { id: string; email?: string | null }) => {
    const payload = {
      id: user.id,
      email: user.email ?? null,
      plan: "free",
      status: "inactive",
      role: "manager",
    };

    console.log("UPSERT profiles", payload);

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    console.log("UPSERT profiles result", { data, error });

    if (error) {
      toast({ title: "Profile setup failed", description: error.message, variant: "destructive" });
      throw error;
    }

    return data;
  };

  const handleTextSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: "Please enter a response", variant: "destructive" });
      return;
    }
    setTranscript(trimmed);
    setTranscriptionWarning(false);
    handleSubmitForEvaluation(trimmed);
  };

  const ensureSessionAndQuestions = async (): Promise<string[] | null> => {
    if (sessionId && sessionQuestionIds.length === sessionQuestions.length) {
      if (storedSessionId !== sessionId) {
        persistActiveSession(sessionId);
      }
      return sessionQuestionIds;
    }
    let user;
    try {
      user = await requireAuth();
      await ensureProfile(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Not authenticated (missing session)";
      console.error(err);
      toast({ title: "Please log in again", description: message, variant: "destructive" });
      navigate("/login");
      return null;
    }

    const sessionPayload = { status: "draft", title: "Inspection practice", created_by: user.id };
    console.log("INSERTING INTO inspection_sessions (app)", sessionPayload);

    const { data: session, error: sessionError } = await supabase
      .from("inspection_sessions")
      .insert(sessionPayload)
      .select()
      .single();

    console.log("INSERT RESULT inspection_sessions (app)", { data: session, error: sessionError });

    if (sessionError || !session) {
      console.error(sessionError);
      toast({ title: "Failed to start session", description: sessionError?.message, variant: "destructive" });
      return null;
    }

    setSessionId(session.id);
    persistActiveSession(session.id);
    completeItem("create_session");
    console.log("SESSION CREATED", session.id);

    const generated = generateSessionQuestions(session.id, desiredQuestionCount);
    setSessionQuestions(generated);

    const questionPayload = generated.map((q, idx) => ({
      inspection_session_id: session.id,
      question_text: q.text,
      domain_name: q.domain,
      sort_order: idx,
    }));

    console.log("INSERTING INTO inspection_session_questions (app)", questionPayload);

    const { data: questionRows, error: questionsError } = await supabase
      .from("inspection_session_questions")
      .insert(questionPayload)
      .select();

    console.log("INSERT RESULT inspection_session_questions (app)", { data: questionRows, error: questionsError });

    if (questionsError || !questionRows) {
      console.error(questionsError);
      toast({ title: "Failed to create questions", description: questionsError?.message, variant: "destructive" });
      return null;
    }

    const sorted = [...questionRows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const ids = sorted.map((row) => row.id);
    setSessionQuestionIds(ids);
    setSessionQuestions(sorted.map((row) => ({
      id: String(row.id),
      domain: (row as { domain_name?: string }).domain_name || "Safeguarding",
      text: (row as { question_text?: string }).question_text || "",
    })));
    console.log("SESSION QUESTIONS CREATED", ids);

    return ids;
  };

  const resumeSession = async (existingId: string) => {
    setResumeLoading(true);
    try {
      await requireAuth();
    } catch (err: unknown) {
      setResumeLoading(false);
      const message = err instanceof Error ? err.message : "Please log in again";
      toast({ title: "Please log in again", description: message, variant: "destructive" });
      navigate("/login");
      return;
    }

      const { data: questions, error: qErr } = await supabase
        .from("inspection_session_questions")
        .select("id,sort_order,question_text,domain_name")
        .eq("inspection_session_id", existingId)
        .order("sort_order", { ascending: true });

    if (qErr || !questions || questions.length === 0) {
      clearActiveSession();
      setResumeLoading(false);
      return;
    }

      const sorted = [...questions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const ids = sorted.map((q) => q.id);
      setSessionQuestions(
        sorted.map((row) => ({
          id: String(row.id),
          domain: (row as { domain_name?: string }).domain_name || "Safeguarding",
          text: (row as { question_text?: string }).question_text || "",
        })),
      );
    setSessionId(existingId);
    setSessionQuestionIds(ids);
    persistActiveSession(existingId);

    const { data: answers, error: aErr } = await supabase
      .from("inspection_answers")
      .select("inspection_session_question_id,answer_text,transcript")
      .in("inspection_session_question_id", ids);

    if (aErr) {
      console.error("Resume load answers error", aErr);
    }

    const map: Record<string, string> = {};
    if (answers) {
      answers.forEach((row: { inspection_session_question_id: string; answer_text: string | null; transcript: string | null }) => {
        const text = (row.answer_text || row.transcript || "").toString();
        if (text.trim()) map[row.inspection_session_question_id] = text;
      });
    }
    setSavedAnswers(map);

    const completed: number[] = [];
    ids.forEach((id, idx) => {
      if (map[id]) completed.push(idx);
    });
    setCompletedQuestions(completed);
    setMarkedAnswerComplete(completed.length > 0);

    const firstIncomplete = ids.findIndex((id) => !map[id]);
    const targetIndex = firstIncomplete >= 0 ? firstIncomplete : 0;
    setCurrentQuestionIndex(targetIndex);
    const initialTranscript = map[ids[targetIndex]] || "";
    setTranscript(initialTranscript);
    setEvaluation(null);
    setStep(initialTranscript ? "editing" : "ready");
  };

  const saveAnswerToSupabase = async (sessionQuestionId: string, text: string) => {
    try {
      await requireAuth();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please log in again";
      console.error(err);
      toast({ title: "Please log in again", description: message, variant: "destructive" });
      navigate("/login");
      return false;
    }

    const payload = {
      inspection_session_question_id: sessionQuestionId,
      answer_text: text,
      transcript: text,
    };

    console.log("INSERTING INTO inspection_answers (app)", payload);

    const { data, error } = await supabase
      .from("inspection_answers")
      .insert(payload)
      .select()
      .single();

    console.log("INSERT RESULT inspection_answers (app)", { data, error });

    if (error || !data) {
      console.error(error);
      toast({ title: "Failed to save answer", description: error?.message, variant: "destructive" });
      return false;
    }

    console.log("Saved answer", sessionQuestionId);
    setSavedAnswers((prev) => ({ ...prev, [sessionQuestionId]: text }));
    if (!markedAnswerComplete) {
      setMarkedAnswerComplete(true);
      completeItem("answer_questions");
    }
    return true;
  };

  const saveEvaluationToSupabase = async (sessionQuestionId: string, mappedEvaluation: EvaluationResult) => {
    try {
      await requireAuth();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please log in again";
      console.error(err);
      toast({ title: "Please log in again", description: message, variant: "destructive" });
      navigate("/login");
      return;
    }

    const strengths = nonEmptyArray(
      normalizeList(mappedEvaluation.strengths as unknown, []),
      buildFallbackStrengths(""),
    );
    const gaps = nonEmptyArray(
      normalizeList(
        (mappedEvaluation as unknown as { gaps?: unknown; weaknesses?: unknown }).gaps ??
          (mappedEvaluation as unknown as { weaknesses?: unknown }).weaknesses,
        [],
      ),
      buildFallbackGaps(""),
    );
    const followUps = nonEmptyArray(
      normalizeList(
        (mappedEvaluation as unknown as { follow_up_questions?: unknown }).follow_up_questions ??
          mappedEvaluation.followUpQuestions,
        [],
      ),
      buildFollowUpFallback(),
    );
    const mapped = mappedEvaluation as Partial<EvaluationResult> & { band?: unknown; score?: unknown; score4?: unknown };
    const band = typeof mapped.band === "string" ? mapped.band : mapped.judgementBand ?? "Requires Improvement";
    const scoreVal = typeof mapped.score === "number" ? mapped.score : mapped.score4 ?? mappedEvaluation.score;
    const score = Number.isFinite(scoreVal) ? Number(scoreVal) : 0;
    const strengthsStr = JSON.stringify(Array.isArray(strengths) ? strengths : []);
    const gapsStr = JSON.stringify(Array.isArray(gaps) ? gaps : []);
    const followUpsStr = JSON.stringify(Array.isArray(followUps) ? followUps : []);
    const bandStr = String(band ?? "Requires Improvement");
    const scoreInt = Number.isFinite(score) ? Math.max(0, Math.min(100, Number(score))) : 0;

    const payload = {
      inspection_session_question_id: sessionQuestionId,
      score: scoreInt,
      band: bandStr,
      strengths: strengthsStr,
      gaps: gapsStr,
      follow_up_questions: followUpsStr,
    };
    console.log("EVAL PAYLOAD", payload);

    console.log("INSERTING INTO inspection_evaluations (app)", payload);

    const { data, error } = await supabase
      .from("inspection_evaluations")
      .upsert(payload, { onConflict: "inspection_session_question_id" })
      .select()
      .single();

    console.log("INSERT RESULT inspection_evaluations (app)", { data, error });

    if (error || !data) {
      console.error(error);
      toast({ title: "Failed to save evaluation", description: error?.message, variant: "destructive" });
      return;
    }

    console.log("EVALUATION SAVED", sessionQuestionId);
    completeItem("run_evaluation");
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setStep("uploading");
    try {
      setStep("transcribing");
      setTranscriptionError(null);
      setAllowPlaceholder(false);

      const fd = new FormData();
      fd.append("file", audioBlob, "recording.webm");

      const response = await fetchWithTimeout(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: fd,
        },
        15000,
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Transcription failed");
      }

      const text = (data?.transcript || data?.text || "").trim();
      if (!text) {
        throw new Error("No speech detected. Try speaking closer to the mic for 3-5 seconds.");
      }

      setTranscript(text);
      setTranscriptionWarning(text.length < 50);
      setStep("editing");
      toast({ title: "Transcription complete", description: "Review your response below." });
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscriptionError(error instanceof Error ? error.message : "Transcription failed");
      setAllowPlaceholder(true);
      setStep("ready");
      toast({ title: "Transcription unavailable", description: "You can retry or use text input.", variant: "destructive" });
    }
  };

  const handleSubmitForEvaluation = async (overrideTranscript?: string | null) => {
    const raw = typeof overrideTranscript === "string" ? overrideTranscript : transcript;
    const transcriptToUse = (raw ?? "").toString().trim();
    if (!transcriptToUse) {
      toast({ title: "Please record or type an answer", variant: "destructive" });
      return;
    }
    const ensuredIds = await ensureSessionAndQuestions();
    if (!ensuredIds) return;
    const questionId = ensuredIds[currentQuestionIndex];
    if (!questionId) {
      toast({ title: "Unable to map question", description: "Please restart the session.", variant: "destructive" });
      return;
    }

    const savedAnswer = await saveAnswerToSupabase(questionId, transcriptToUse);
    if (!savedAnswer) {
      setStep("editing");
      return;
    }

    setTranscript(transcriptToUse);
    setStep("evaluating");
    loading.show("Evaluating your response...");
    try {
      const plan = "free";
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            transcript: transcriptToUse,
            answerText: transcriptToUse,
              question: currentQuestion.text,
            domain: currentQuestion.domain,
            question_area: currentQuestion.domain,
            plan,
          }),
        },
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const parsedEvaluationResult = evaluationSchema.safeParse(data);
      if (!parsedEvaluationResult.success) {
        console.error("Evaluation schema error", parsedEvaluationResult.error, data);
        throw new Error("Invalid evaluation response");
      }
        const parsedEvaluation = parsedEvaluationResult.data;

        const bandRaw = parsedEvaluation.band as EvaluationResult["judgementBand"];
        const judgementBand =
          bandRaw === "Requires Improvement"
            ? ("Requires improvement to be good" as EvaluationResult["judgementBand"])
            : bandRaw;

        const score4 =
          typeof parsedEvaluation.score4 === "number"
            ? parsedEvaluation.score4
            : Math.max(0, Math.min(4, Math.round(((parsedEvaluation.score ?? 0) / 25) * 10) / 10));

        const riskFlags: string[] = [];

        const strengthsDetailed =
          Array.isArray(parsedEvaluation.strengths) && parsedEvaluation.strengths.length > 0
            ? parsedEvaluation.strengths.map((s) => ({
                evidence: Array.isArray(s.evidence) ? s.evidence : [],
                whatWorked: s.what_worked,
                whyMatters: s.why_it_matters_to_ofsted,
              }))
            : [];

        const strengthsNorm =
          strengthsDetailed.length > 0
            ? strengthsDetailed.map((s) => `${s.whatWorked} — ${s.whyMatters}`)
            : [];

        const weaknessesDetailed =
          Array.isArray(parsedEvaluation.weaknesses) && parsedEvaluation.weaknesses.length > 0
            ? parsedEvaluation.weaknesses.map((w) => ({
                evidence: Array.isArray(w.evidence) ? w.evidence : [],
                gap: w.gap,
                risk: w.risk,
                expected: w.what_ofsted_expected,
              }))
            : [];

        const gapsNorm =
          weaknessesDetailed.length > 0
            ? weaknessesDetailed.map(
                (w) => `${w.gap} (Risk: ${w.risk}; Expected: ${w.expected})`,
              )
            : [];

        const followUpsNorm =
          Array.isArray(parsedEvaluation.follow_up_questions) && parsedEvaluation.follow_up_questions.length > 0
            ? parsedEvaluation.follow_up_questions.map((f) => f.question)
            : [];

        const recommendedNorm = normalizeList(parsedEvaluation.missing_key_points, []);

        const sentenceImprovements =
          Array.isArray(parsedEvaluation.sentence_improvements) && parsedEvaluation.sentence_improvements.length > 0
            ? parsedEvaluation.sentence_improvements.map((s) => ({
                sentenceId: s.sentence_id,
                original: s.original,
                issue: s.issue,
                betterVersion: s.better_version,
                synonymsOrPhrases: s.synonyms_or_phrases || [],
                impact: s.impact,
              }))
            : [];

        const fallbackStrengths = buildFallbackStrengths(transcriptToUse);
        const fallbackGaps = buildFallbackGaps(transcriptToUse);
        const fallbackFollowUps = buildFollowUpFallback();
        const fallbackActions = buildFallbackActions();

      const safeStrengths = nonEmptyArray(strengthsNorm, fallbackStrengths);
      const safeGaps = nonEmptyArray(gapsNorm, fallbackGaps);
      const safeFollowUps = nonEmptyArray(followUpsNorm, fallbackFollowUps);
      const safeActions = nonEmptyArray(recommendedNorm, fallbackActions);

      const mappedEvaluation: EvaluationResult = {
          judgementBand,
          rawBand: bandRaw,
          score: score4,
          rawScore100: parsedEvaluation.score,
          score4,
          strengths: safeStrengths,
          strengthsStructured: strengthsDetailed,
          gaps: safeGaps,
          weaknesses: safeGaps,
          weaknessesStructured: weaknessesDetailed,
          recommendations: nonEmptyArray(parsedEvaluation.missing_key_points ?? [], safeActions),
          recommendedActions: safeActions,
          riskFlags,
          followUpQuestions: safeFollowUps,
          sentenceImprovements,
          sentences: parsedEvaluation.sentences,
          missingKeyPoints: parsedEvaluation.missing_key_points,
          rawFollowUps: parsedEvaluation.follow_up_questions?.map((f) => ({
            question: f.question,
            why: f.why,
            whatGoodLooksLike: f.what_good_looks_like,
          })),
          rawSummary: parsedEvaluation.summary,
          debug: parsedEvaluation.debug as Record<string, unknown> | undefined,
        };

      setEvaluation(mappedEvaluation);

      const followUpDecision = detectFollowUpNeed({
        score: mappedEvaluation.score || 0,
        transcript: transcriptToUse,
        evaluation: mappedEvaluation,
        domain: currentQuestion.domain,
        attemptIndex: followUpCount,
      });
      
      // Store result
      const existingResult = results.get(currentQuestionIndex);
      if (isFollowUp && existingResult) {
        setResults(prev => new Map(prev).set(currentQuestionIndex, {
          ...existingResult,
          followUpUsed: true,
          followUpTranscript: transcriptToUse,
          followUpEvaluation: mappedEvaluation,
          followUpDecision,
        }));
      } else {
        setResults(prev => new Map(prev).set(currentQuestionIndex, {
          transcript: transcriptToUse,
          evaluation: mappedEvaluation,
          followUpUsed: false,
          followUpDecision,
        }));
      }
      
      if (!completedQuestions.includes(currentQuestionIndex)) {
        setCompletedQuestions(prev => [...prev, currentQuestionIndex]);
      }
      
      setStep("evaluated");
      setIsFollowUp(false);
      const ui = bandUi(judgementBand);
      toast({ 
        title: "Evaluation complete", 
        description: `${ui.icon} ${ui.label}` 
      });

      await saveEvaluationToSupabase(questionId, mappedEvaluation);
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({ 
        title: "Evaluation failed", 
        description: error instanceof Error ? error.message : "Please try again.", 
        variant: "destructive" 
      });
      setStep("editing");
    } finally {
      loading.hide();
    }
  };

  const getFollowUpDecision = () => results.get(currentQuestionIndex)?.followUpDecision;

  const needsFollowUp = () => {
    const decision = getFollowUpDecision();
    return Boolean(decision?.shouldFollowUp && followUpCount < 2);
  };

  const getFollowUpQuestion = () => {
    const decision = getFollowUpDecision();
    if (decision?.question) return decision.question;
    const result = results.get(currentQuestionIndex);
    if (!result) return "Can you give a specific recent example with outcomes?";
    return result.evaluation.followUpQuestions[0] || "Can you give a specific recent example with outcomes?";
  };

  const startFollowUp = () => {
    if (followUpCount >= 2) {
      toast({ title: "Follow-up limit reached", description: "Maximum of 2 follow-ups per question." });
      return;
    }
    setFollowUpCount(prev => prev + 1);
    setIsFollowUp(true);
    setEvaluation(null);
    setTranscript("");
    setTranscriptionWarning(false);
    setStep("ready");
    toast({ 
      title: getFollowUpLabel(followUpCount + 1, 2), 
      description: "Record or type your response to the follow-up question." 
    });
  };

  const handleNextQuestion = async () => {
    if (step !== "evaluated") {
      toast({ title: "Finish this question first", description: "Please complete an evaluation before moving on." });
      return;
    }
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetForQuestion();
    } else {
      // Save session before showing summary
      await saveSession();
      setStep("summary");
    }
  };

  const saveSession = async () => {
    const evaluationResults = new Map<number, EvaluationResult>();
    results.forEach((result, index) => {
      const evalToUse = result.followUpEvaluation && result.followUpEvaluation.score > result.evaluation.score
        ? result.followUpEvaluation
        : result.evaluation;
      evaluationResults.set(index, evalToUse);
    });

    const averageScore = evaluationResults.size
      ? Array.from(evaluationResults.values()).reduce((sum, r) => sum + (r.score4 ?? r.score ?? 0), 0) / evaluationResults.size
      : 0;
    const overallBand = getJudgementBand(averageScore || 0);

    const saveSessionLocally = () => {
      const local = JSON.parse(localStorage.getItem("localSessions") || "[]");
      const sessionId = `local-${Date.now()}`;
      const answers = Array.from(results.entries()).flatMap(([qIndex, result]) => {
        const question = sessionQuestions[qIndex];
        const entries = [{
          session_id: sessionId,
          question_id: question.id,
          question_domain: question.domain,
          transcript: result.transcript,
          evaluation_json: result.evaluation,
          attempt_index: 0,
        }];

        if (result.followUpTranscript && result.followUpEvaluation) {
          entries.push({
            session_id: sessionId,
            question_id: question.id,
            question_domain: question.domain,
            transcript: result.followUpTranscript,
            evaluation_json: result.followUpEvaluation,
            attempt_index: 1,
          });
        }
        return entries;
      });

      const record = {
        id: sessionId,
        created_at: new Date().toISOString(),
        overall_score: averageScore,
        overall_band: overallBand,
        answers,
      };

      const updated = [record, ...local].slice(0, 20); // keep last 20
      localStorage.setItem("localSessions", JSON.stringify(updated));
    };

    try {
      if (!sessionId) {
        saveSessionLocally();
        return;
      }
      // Session, answers, and evaluations are saved per question; just log completion.
      console.log("SESSION COMPLETE", { sessionId, averageScore, overallBand });
    } catch (error) {
      console.error('Error saving session:', error);
      // Fallback to local storage so history still works without auth/DB
      saveSessionLocally();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetForQuestion();
    }
  };

  const handleViewSummary = () => {
    completeItem("review_summary");
    clearActiveSessionFlag();
    setStep("summary");
  };

  const handleStartOver = () => {
    clearActiveSession();
    setCurrentQuestionIndex(0);
    resetForQuestion();
    setResults(new Map());
    setCompletedQuestions([]);
  };

  const handleExitSession = () => {
    clearActiveSession();
    navigate("/app");
  };

  const handleRecordAgain = () => {
    setStep("ready");
    setTranscript("");
  };

  // Get step status message
  const getStepMessage = () => {
    switch (step) {
      case "ready": return isFollowUp ? "Choose how to respond to the follow-up" : "Choose how you'd like to respond";
      case "recording": return "Recording your response...";
      case "uploading": return "Uploading audio...";
      case "transcribing": return "Transcribing your response...";
      case "editing": return "Review and edit your response before evaluation";
      case "evaluating": return "Evaluating your answer against Ofsted criteria...";
      case "evaluated": return "Evaluation complete";
      default: return "";
    }
  };

  const handleContactSubmit = async () => {
    if (!contactMessage.trim()) {
      setContactStatus("Please add a message so we can respond.");
      return;
    }
    setContactSubmitting(true);
    setContactStatus(null);
    const result = await sendFeedback(
      {
        name: contactName.trim(),
        details: contactDetails.trim(),
        message: contactMessage.trim(),
      },
      "contact",
    );
    setContactStatus(result.message);
    if (result.ok) {
      setContactMessage("");
    }
    setContactSubmitting(false);
  };

  const contactCard = (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold text-foreground">Contact us</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Quick questions or demo requests? Use this form and we'll reply from {emailAddress}.
      </p>
      <div className="space-y-3">
        <Input placeholder="Name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <Input
          placeholder="How can we reach you? (optional email/phone)"
          value={contactDetails}
          onChange={(e) => setContactDetails(e.target.value)}
        />
        <Textarea
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          placeholder="Your message"
          className="min-h-[120px]"
        />
        <Button onClick={handleContactSubmit} disabled={contactSubmitting} className="w-full gap-2">
          {contactSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Send message
        </Button>
        {contactStatus && <p className="text-sm text-muted-foreground">{contactStatus}</p>}
      </div>
    </div>
  );

  const handleLogout = async () => {
    loading.show("Logging you out...");
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      loading.hide();
      toast({ title: "Logged out successfully" });
      navigate("/login", { replace: true, state: { toast: "Logged out successfully" } });
    }
  };

  const handlePracticeAgain = () => {
    clearActiveSession();
    setCurrentQuestionIndex(0);
    setResults(new Map());
    setCompletedQuestions([]);
    setEvaluation(null);
    setTranscript("");
    setFollowUpCount(0);
    setIsFollowUp(false);
    setStep("ready");
    setTranscriptionWarning(false);
    setTranscriptionError(null);
  };

  const AppNav = () => {
    const linkBase =
      "text-sm font-medium px-3 py-2 rounded-lg transition hover:text-slate-900 hover:bg-slate-100";
    return (
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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
            {sessionId && (
              <Button variant="outline" size="sm" onClick={handleExitSession} className="border-slate-200">
                Exit session
              </Button>
            )}
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

  if (step === "summary") {
    const evaluationResults = new Map<number, EvaluationResult>();
    const formatDomain = (d: string) => d.replace(/([A-Z])/g, " $1").replace(/^\s/, "");
    const questions = sessionQuestions.map((q, idx) => ({
      id: String(q.id ?? idx + 1),
      domain: q.domain,
      title: formatDomain(q.domain),
      question: q.text,
    }));

    const answers: { question_id: string; text?: string }[] = [];
    const evaluationsForReport: {
      question_id?: string;
      score?: number | null;
      band?: string | null;
      strengths?: string[] | null;
      gaps?: string[] | null;
      recommendations?: string[] | null;
      follow_up_questions?: string[] | null;
    }[] = [];

    results.forEach((result, index) => {
      const evalToUse = result.followUpEvaluation && result.followUpEvaluation.score > result.evaluation.score
        ? result.followUpEvaluation
        : result.evaluation;
      evaluationResults.set(index, evalToUse);

      const question = sessionQuestions[index];
      const chosenTranscript = result.followUpTranscript ?? result.transcript;

      answers.push({
        question_id: String(question.id),
        text: chosenTranscript,
      });

      const scoreValue = (evalToUse.score4 ?? evalToUse.score ?? 0) * 25;

      evaluationsForReport.push({
        question_id: String(question.id),
        score: scoreValue,
        band: evalToUse.judgementBand,
        strengths: evalToUse.strengths ?? [],
        gaps: (evalToUse.gaps ?? evalToUse.weaknesses) ?? [],
        recommendations: evalToUse.recommendations ?? evalToUse.recommendedActions ?? [],
        follow_up_questions: evalToUse.followUpQuestions ?? [],
      });
    });

    return (
      <div className="min-h-screen gradient-hero py-12 px-4">
        <div className="container max-w-4xl mx-auto space-y-8">
          <FinalSummaryReport
            questions={questions}
            answers={answers}
            evaluations={evaluationsForReport}
            onPracticeAgain={handlePracticeAgain}
          />
          <CompletionPrompt sessionId={sessionId} userId={null} />
          <div className="mt-8">{contactCard}</div>
        </div>
        <Toaster />
      </div>
    );
  }

  const showGlobalLoading =
      step === "uploading" || step === "transcribing";

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <AppNav />
      <FeedbackButton
        sessionId={sessionId || undefined}
        userId={undefined}
        onSent={() => completeItem("send_feedback")}
      />
      {showGlobalLoading && <LoadingOverlay message="Processing..." />}
      <div className="mx-auto mb-3 flex max-w-5xl justify-end gap-2">
        {storedSessionId && (!sessionId || sessionId !== storedSessionId) && (
          <Button variant="outline" size="sm" onClick={() => storedSessionId && resumeSession(storedSessionId)} disabled={resumeLoading}>
            {resumeLoading ? "Resuming..." : "Resume previous session"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleStartOver}>
          Start new session
        </Button>
      </div>
      <div className="mb-3">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
          <span>Open access beta - no account or billing required while we collect feedback.</span>
        </div>
      </div>
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Children's Home Inspection Practice
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Ofsted Inspection Simulator
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Practice your responses to key SCCIF inspection questions and receive AI-powered feedback
          </p>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto flex items-center justify-center gap-2 mt-2">
            <AlertTriangle className="h-3 w-3" />
            Do not include names or identifying details about children, staff, or locations.
          </p>
        </header>

        {/* Progress */}
        <ProgressIndicator 
          currentQuestionIndex={currentQuestionIndex} 
          completedQuestions={completedQuestions}
          questions={sessionQuestions}
        />

        {/* Question Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">{progressLabel}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextQuestion}
            disabled={step !== "evaluated"}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Question */}
        <QuestionCard 
          question={currentQuestion} 
          currentIndex={currentQuestionIndex} 
          totalQuestions={sessionQuestions.length} 
        />

        {/* Follow-up indicator */}
        {isFollowUp && evaluation === null && (
          <div className="card-elevated mb-6 p-4 border-l-4 border-l-primary">
            <div className="flex items-start gap-3">
              <MessageCircleQuestion className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  {getFollowUpLabel(followUpCount, 2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getFollowUpQuestion()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transcription Warning */}
        {transcriptionWarning && step === "editing" && (
          <div className="card-elevated mb-4 p-4 border-l-4 border-l-warning">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Transcription may be incomplete; retry recommended.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRecordAgain} className="gap-1">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Step Status */}
        {step !== "ready" && step !== "evaluated" && step !== "recording" && (
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">{getStepMessage()}</p>
          </div>
        )}

        {/* Step: Choose Input Method */}
        {step === "ready" && (
          <div className="space-y-4">
            {transcriptionError && (
              <div className="card-elevated border border-destructive/50 p-4">
                <p className="text-sm text-destructive mb-2">Transcription failed: {transcriptionError}</p>
                {allowPlaceholder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTranscript("Transcription unavailable; please type your response below.");
                      setTranscriptionWarning(false);
                      setStep("editing");
                      setAllowPlaceholder(false);
                      setTranscriptionError(null);
                    }}
                  >
                    Use placeholder and continue
                  </Button>
                )}
              </div>
            )}
            <div className="card-elevated animate-fade-in-up">
              <InputMethodSelector
                onVoiceSelected={handleVoiceSelected}
                onTextSubmit={handleTextSubmit}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Questions? Email{" "}
              <a className="text-primary underline" href="mailto:reports@ziantra.co.uk">
                reports@ziantra.co.uk
              </a>
            </p>
          </div>
        )}

        {/* Step: Voice Recording */}
        {(step === "recording" || step === "uploading" || step === "transcribing") && (
          <div className="card-elevated animate-fade-in-up">
            {step === "uploading" || step === "transcribing" ? (
              <div className="flex flex-col items-center gap-4 p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground mb-1">
                    {step === "uploading" ? "Uploading audio..." : "Transcribing your response..."}
                  </p>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-end p-4 pb-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("ready")}
                    className="text-muted-foreground"
                  >
                    Back to options
                  </Button>
                </div>
                <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
              </div>
            )}
          </div>
        )}

        {/* Step: Transcript Review */}
        {(step === "editing" || step === "evaluating") && (
          <TranscriptEditor
            transcript={transcript}
            onTranscriptChange={setTranscript}
            onSubmitForEvaluation={handleSubmitForEvaluation}
            onRecordAgain={handleRecordAgain}
            isLoading={step === "evaluating"}
          />
        )}

        {/* Step: Evaluation Results */}
        {step === "evaluated" && evaluation && (
          <div className="space-y-6">
          <EvaluationResults
            result={evaluation}
            transcript={transcript}
            onNextQuestion={handleNextQuestion}
            isLastQuestion={currentQuestionIndex === sessionQuestions.length - 1}
            onViewSummary={handleViewSummary}
            onExitSession={handleExitSession}
          />
            
            {/* Follow-up option */}
            {needsFollowUp() && (
              <div className="card-elevated p-6 border-l-4 border-l-warning">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircleQuestion className="h-5 w-5 text-warning" />
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        Improve Your Score
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your judgement was {evaluation.judgementBand}. You can answer one follow-up question to potentially improve your evaluation.
                    </p>
                    {getFollowUpQuestion() && (
                      <p className="text-foreground font-medium">
                        "{getFollowUpQuestion()}"
                      </p>
                    )}
                  </div>
                  <Button onClick={startFollowUp} variant="default">
                    Answer Follow-up
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 space-y-4">
          {/* Full-width contact form */}
          {contactCard}
          {/* Compact email preference card */}
          <div className="card-elevated p-6 space-y-3 max-w-xl mx-auto text-center">
            <h3 className="font-display text-lg font-semibold text-foreground">Prefer email?</h3>
            <p className="text-sm text-muted-foreground">
              Reach us anytime at{" "}
              <a className="text-primary underline" href={`mailto:${emailAddress}`}>
                {emailAddress}
              </a>
              . Include context from your session if helpful (no names or identifying details).
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Based on Ofsted's Social Care Common Inspection Framework (SCCIF)</p>
        </footer>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
