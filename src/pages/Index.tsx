import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ofstedQuestions, EvaluationResult } from "@/lib/questions";
import { QuestionCard } from "@/components/QuestionCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { EvaluationResults } from "@/components/EvaluationResults";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { SessionSummary } from "@/components/SessionSummary";
import { Loader2 } from "lucide-react";

type Step = "record" | "transcript" | "evaluation" | "summary";

const Index = () => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState<Step>("record");
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [results, setResults] = useState<Map<number, EvaluationResult>>(new Map());
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentQuestion = ofstedQuestions[currentQuestionIndex];

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, mimeType: audioBlob.type }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error);
          
          setTranscript(data.transcript);
          setStep("transcript");
          toast({ title: "Transcription complete", description: "Review your response below." });
        } catch (error) {
          console.error('Transcription error:', error);
          toast({ 
            title: "Transcription failed", 
            description: error instanceof Error ? error.message : "Please try recording again.", 
            variant: "destructive" 
          });
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      toast({ title: "Transcription failed", description: "Please try recording again.", variant: "destructive" });
      setIsTranscribing(false);
    }
  };

  const handleSubmitForEvaluation = async () => {
    setIsEvaluating(true);
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
      setResults(prev => new Map(prev).set(currentQuestionIndex, data));
      setCompletedQuestions(prev => [...prev, currentQuestionIndex]);
      setStep("evaluation");
      toast({ title: "Evaluation complete", description: `Score: ${data.score}/5 - ${data.judgementBand}` });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({ 
        title: "Evaluation failed", 
        description: error instanceof Error ? error.message : "Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < ofstedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setStep("record");
      setTranscript("");
      setEvaluation(null);
    }
  };

  const handleViewSummary = () => setStep("summary");

  const handleStartOver = () => {
    setCurrentQuestionIndex(0);
    setStep("record");
    setTranscript("");
    setEvaluation(null);
    setResults(new Map());
    setCompletedQuestions([]);
  };

  const handleRecordAgain = () => {
    setStep("record");
    setTranscript("");
  };

  if (step === "summary") {
    return (
      <div className="min-h-screen gradient-hero py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <SessionSummary results={results} onStartOver={handleStartOver} />
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

        {/* Current Question */}
        <QuestionCard 
          question={currentQuestion} 
          currentIndex={currentQuestionIndex} 
          totalQuestions={ofstedQuestions.length} 
        />

        {/* Step: Recording */}
        {step === "record" && (
          <div className="card-elevated animate-fade-in-up">
            {isTranscribing ? (
              <div className="flex flex-col items-center gap-4 p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground mb-1">Transcribing your response...</p>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
              </div>
            ) : (
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
            )}
          </div>
        )}

        {/* Step: Transcript Review */}
        {step === "transcript" && (
          <TranscriptEditor
            transcript={transcript}
            onTranscriptChange={setTranscript}
            onSubmitForEvaluation={handleSubmitForEvaluation}
            onRecordAgain={handleRecordAgain}
            isLoading={isEvaluating}
          />
        )}

        {/* Step: Evaluation Results */}
        {step === "evaluation" && evaluation && (
          <EvaluationResults
            result={evaluation}
            onNextQuestion={handleNextQuestion}
            isLastQuestion={currentQuestionIndex === ofstedQuestions.length - 1}
            onViewSummary={handleViewSummary}
          />
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
