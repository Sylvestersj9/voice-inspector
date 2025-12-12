import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ofstedQuestions, EvaluationResult } from "@/lib/questions";
import { QuestionCard } from "@/components/QuestionCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { EvaluationResults } from "@/components/EvaluationResults";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { SessionSummary } from "@/components/SessionSummary";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, MessageCircleQuestion } from "lucide-react";

type Step = 
  | "ready" 
  | "recorded" 
  | "uploading" 
  | "transcribing" 
  | "editing" 
  | "evaluating" 
  | "evaluated" 
  | "follow-up"
  | "summary";

interface QuestionResult {
  transcript: string;
  evaluation: EvaluationResult;
  followUpUsed: boolean;
  followUpTranscript?: string;
  followUpEvaluation?: EvaluationResult;
}

const Index = () => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState<Step>("ready");
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [results, setResults] = useState<Map<number, QuestionResult>>(new Map());
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);

  const currentQuestion = ofstedQuestions[currentQuestionIndex];

  const progressLabel = useMemo(() => {
    return `Question ${currentQuestionIndex + 1} of ${ofstedQuestions.length}`;
  }, [currentQuestionIndex]);

  const resetForQuestion = () => {
    setStep("ready");
    setTranscript("");
    setEvaluation(null);
    setFollowUpUsed(false);
    setIsFollowUp(false);
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setStep("uploading");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          setStep("transcribing");
          const base64 = (reader.result as string).split(',')[1];
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, mimeType: audioBlob.type }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error);
          
          setTranscript(data.transcript);
          setStep("editing");
          toast({ title: "Transcription complete", description: "Review your response below." });
        } catch (error) {
          console.error('Transcription error:', error);
          toast({ 
            title: "Transcription failed", 
            description: error instanceof Error ? error.message : "Please try recording again.", 
            variant: "destructive" 
          });
          setStep("ready");
        }
      };
    } catch (error) {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
      setStep("ready");
    }
  };

  const handleSubmitForEvaluation = async () => {
    setStep("evaluating");
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          question: currentQuestion.question,
          domain: currentQuestion.domain,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setEvaluation(data);
      
      // Store result
      const existingResult = results.get(currentQuestionIndex);
      if (isFollowUp && existingResult) {
        setResults(prev => new Map(prev).set(currentQuestionIndex, {
          ...existingResult,
          followUpUsed: true,
          followUpTranscript: transcript,
          followUpEvaluation: data,
        }));
      } else {
        setResults(prev => new Map(prev).set(currentQuestionIndex, {
          transcript,
          evaluation: data,
          followUpUsed: false,
        }));
      }
      
      if (!completedQuestions.includes(currentQuestionIndex)) {
        setCompletedQuestions(prev => [...prev, currentQuestionIndex]);
      }
      
      setStep("evaluated");
      toast({ 
        title: "Evaluation complete", 
        description: `Score: ${data.score}/5 - ${data.judgementBand}` 
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({ 
        title: "Evaluation failed", 
        description: error instanceof Error ? error.message : "Please try again.", 
        variant: "destructive" 
      });
      setStep("editing");
    }
  };

  const needsFollowUp = (ev: EvaluationResult) => {
    return !followUpUsed && (ev.score <= 3 || ev.followUpQuestions.length > 0);
  };

  const startFollowUp = () => {
    setFollowUpUsed(true);
    setIsFollowUp(true);
    setEvaluation(null);
    setTranscript("");
    setStep("ready");
    toast({ 
      title: "Follow-up Question", 
      description: "Record your response to the follow-up question." 
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < ofstedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetForQuestion();
    } else {
      setStep("summary");
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
      case "ready": return isFollowUp ? "Record your follow-up response" : "Record your answer (voice note style)";
      case "recorded": return "Recording captured";
      case "uploading": return "Uploading audio...";
      case "transcribing": return "Transcribing your response...";
      case "editing": return "Review and edit transcript before evaluation";
      case "evaluating": return "Evaluating your answer against Ofsted criteria...";
      case "evaluated": return "Evaluation complete";
      default: return "";
    }
  };

  if (step === "summary") {
    // Convert results to the format expected by SessionSummary
    const evaluationResults = new Map<number, EvaluationResult>();
    results.forEach((result, index) => {
      // Use follow-up evaluation if available and better, otherwise use original
      const evalToUse = result.followUpEvaluation && result.followUpEvaluation.score > result.evaluation.score
        ? result.followUpEvaluation
        : result.evaluation;
      evaluationResults.set(index, evalToUse);
    });

    return (
      <div className="min-h-screen gradient-hero py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <SessionSummary results={evaluationResults} onStartOver={handleStartOver} />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
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
            disabled={currentQuestionIndex === ofstedQuestions.length - 1 && step !== "evaluated"}
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
                <p className="font-medium text-foreground mb-1">Follow-up Question</p>
                <p className="text-sm text-muted-foreground">
                  {results.get(currentQuestionIndex)?.evaluation.followUpQuestions[0] || 
                   "Can you give a specific recent example with outcomes?"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step Status */}
        {step !== "ready" && step !== "evaluated" && (
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">{getStepMessage()}</p>
          </div>
        )}

        {/* Step: Recording */}
        {(step === "ready" || step === "uploading" || step === "transcribing") && (
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
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
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
            {needsFollowUp(evaluation) && (
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
                      Your score was {evaluation.score}/5. You can answer one follow-up question to potentially improve your evaluation.
                    </p>
                    {evaluation.followUpQuestions[0] && (
                      <p className="text-foreground font-medium">
                        "{evaluation.followUpQuestions[0]}"
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
