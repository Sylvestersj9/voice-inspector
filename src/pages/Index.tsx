import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ofstedQuestions, EvaluationResult, getJudgementBand } from "@/lib/questions";
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
import FinalSummaryReport from "@/components/report/FinalSummaryReport";

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

async function sendFeedback(payload: Record<string, string>, type: SubmitType): Promise<SendResult> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const loading = useLoading();
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

  const currentQuestion = ofstedQuestions[currentQuestionIndex];

  const progressLabel = useMemo(() => {
    return `Question ${currentQuestionIndex + 1} of ${ofstedQuestions.length}`;
  }, [currentQuestionIndex]);

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
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  const handleSubmitForEvaluation = async (overrideTranscript?: string) => {
    const transcriptToUse = (overrideTranscript ?? transcript).trim();
    if (!transcriptToUse) {
      toast({ title: "No response to evaluate", variant: "destructive" });
      return;
    }
    setTranscript(transcriptToUse);
    setStep("evaluating");
    loading.show("Evaluating your responseâ€¦");
    try {
      const plan = "free";
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          transcript: transcriptToUse,
          question: currentQuestion.question,
          domain: currentQuestion.domain,
          question_area: currentQuestion.domain,
          plan,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const parsedEvaluationResult = evaluationSchema.safeParse(data);
      if (!parsedEvaluationResult.success) {
        console.error("Evaluation schema error", parsedEvaluationResult.error, data);
        throw new Error("Invalid evaluation response");
      }
      const parsedEvaluation = parsedEvaluationResult.data;

      const judgementBand = parsedEvaluation.overall_judgement as EvaluationResult["judgementBand"];
      const score4 = parsedEvaluation.score4;

      const riskFlags = (parsedEvaluation as any).risk_flags ?? (parsedEvaluation as any).riskFlags ?? [];

      const mappedEvaluation: EvaluationResult = {
        judgementBand,
        score: score4,
        score4,
        strengths: parsedEvaluation.strengths || [],
        gaps: parsedEvaluation.gaps || parsedEvaluation.weaknesses || [],
        weaknesses: parsedEvaluation.weaknesses || [],
        recommendations: parsedEvaluation.recommendations || [],
        recommendedActions: parsedEvaluation.next_actions || parsedEvaluation.recommendations || [],
        riskFlags,
        followUpQuestions: parsedEvaluation.follow_up_questions || [],
        whatInspectorWantsToHear: parsedEvaluation.what_inspector_wants_to_hear,
        evidenceToQuoteNextTime: parsedEvaluation.evidence_to_quote_next_time,
        actionPlan7Days: parsedEvaluation.action_plan_7_days,
        actionPlan30Days: parsedEvaluation.action_plan_30_days,
        confidenceBand: parsedEvaluation.confidence_band as any,
        note: parsedEvaluation.note,
        debug: parsedEvaluation.debug,
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
          followUpTranscript: transcript,
          followUpEvaluation: parsedEvaluation,
          followUpDecision,
        }));
      } else {
        setResults(prev => new Map(prev).set(currentQuestionIndex, {
          transcript: transcriptToUse,
          evaluation: parsedEvaluation,
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
    if (currentQuestionIndex < ofstedQuestions.length - 1) {
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
        const question = ofstedQuestions[qIndex];
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
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({ overall_score: averageScore, overall_band: overallBand })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const answers = Array.from(results.entries()).flatMap(([qIndex, result]) => {
        const question = ofstedQuestions[qIndex];
        const entries = [{
          session_id: session.id,
          question_id: question.id,
          question_domain: question.domain,
          transcript: result.transcript,
          evaluation_json: result.evaluation,
          attempt_index: 0,
        }];
        
        if (result.followUpTranscript && result.followUpEvaluation) {
          entries.push({
            session_id: session.id,
            question_id: question.id,
            question_domain: question.domain,
            transcript: result.followUpTranscript,
            evaluation_json: result.followUpEvaluation,
            attempt_index: 1,
          });
        }
        return entries;
      });

      const answersResult = await supabase.from('session_answers').insert(answers);
      if (answersResult.error) throw answersResult.error;
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

  const handleViewSummary = () => setStep("summary");

  const handleStartOver = () => {
    setCurrentQuestionIndex(0);
    resetForQuestion();
    setResults(new Map());
    setCompletedQuestions([]);
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
    await supabase.auth.signOut();
    navigate("/login?loggedOut=true", { replace: true });
  };

  const handlePracticeAgain = () => {
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

  if (step === "summary") {
    const evaluationResults = new Map<number, EvaluationResult>();
    const questions = ofstedQuestions.map((q) => ({
      id: String(q.id),
      domain: q.domain,
      title: q.shortTitle,
      question: q.question,
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

      const question = ofstedQuestions[index];
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
      {showGlobalLoading && <LoadingOverlay message="Processing..." />}
      <div className="mb-3">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
          <span>Open access beta — no account or billing required while we collect feedback.</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white/20 ring-1 ring-white/40 overflow-hidden flex items-center justify-center">
            <img src="/logo.svg" alt="Voice Inspector" className="h-9 w-9 object-contain" />
          </div>
          <div className="text-base font-bold text-black font-display">Voice Inspector</div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          Logout
        </button>
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
          totalQuestions={ofstedQuestions.length} 
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
              onNextQuestion={handleNextQuestion}
              isLastQuestion={currentQuestionIndex === ofstedQuestions.length - 1}
              onViewSummary={handleViewSummary}
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


