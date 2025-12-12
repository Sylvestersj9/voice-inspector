import { EvaluationResult } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Lightbulb,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EvaluationResultsProps {
  result: EvaluationResult;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  onViewSummary?: () => void;
}

export function EvaluationResults({ 
  result, 
  onNextQuestion, 
  isLastQuestion,
  onViewSummary 
}: EvaluationResultsProps) {
  const getScoreColor = () => {
    switch (result.judgementBand) {
      case "Outstanding":
        return "bg-success text-success-foreground";
      case "Good":
        return "bg-primary text-primary-foreground";
      case "Requires Improvement":
        return "bg-warning text-warning-foreground";
      case "Inadequate":
        return "bg-destructive text-destructive-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Score Header */}
      <div className="card-elevated p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className={cn(
            "flex items-center justify-center h-24 w-24 rounded-2xl text-3xl font-display font-bold",
            getScoreColor()
          )}>
            {result.score.toFixed(1)}
          </div>
          <div>
            <div className={cn(
              "inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-2",
              getScoreColor()
            )}>
              {result.judgementBand}
            </div>
            <p className="text-muted-foreground">
              Your response has been evaluated against Ofsted's SCCIF inspection criteria
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="font-display text-lg font-semibold text-foreground">Strengths</h3>
          </div>
          <ul className="space-y-2 stagger-children">
            {result.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 text-foreground">
                <span className="text-success mt-1">-</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {result.gaps.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold text-foreground">Areas for Development</h3>
          </div>
          <ul className="space-y-2 stagger-children">
            {result.gaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-3 text-foreground">
                <span className="text-warning mt-1">-</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Flags */}
      {result.riskFlags.length > 0 && (
        <div className="card-elevated p-6 border-destructive/30">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-lg font-semibold text-foreground">Risk Flags</h3>
          </div>
          <ul className="space-y-2 stagger-children">
            {result.riskFlags.map((flag, index) => (
              <li key={index} className="flex items-start gap-3 text-foreground">
                <span className="text-destructive mt-1">-</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Questions */}
      {result.followUpQuestions.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">Follow-up Questions</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            An inspector might ask these follow-up questions based on your response:
          </p>
          <ul className="space-y-3 stagger-children">
            {result.followUpQuestions.map((question, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-primary font-semibold">{index + 1}.</span>
                <span className="text-foreground">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {result.recommendedActions.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold text-foreground">Recommended Actions</h3>
          </div>
          <ul className="space-y-3 stagger-children">
            {result.recommendedActions.map((action, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <span className="text-foreground">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end gap-3 pt-4">
        {isLastQuestion ? (
          <Button onClick={onViewSummary} variant="default" size="lg">
            View Full Summary
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onNextQuestion} variant="default" size="lg">
            Next Question
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}


