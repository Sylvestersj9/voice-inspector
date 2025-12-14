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
  const weaknesses = result.weaknesses?.length ? result.weaknesses : result.gaps;
  const showWeaknesses =
    result.judgementBand === "Inadequate" ||
    result.judgementBand === "Requires improvement to be good" ||
    result.judgementBand === "Good";

  const getScoreColor = () => {
    switch (result.judgementBand) {
      case "Outstanding":
        return "bg-success text-success-foreground";
      case "Good":
        return "bg-primary text-primary-foreground";
      case "Requires improvement to be good":
        return "bg-warning text-warning-foreground";
      case "Inadequate":
        return "bg-destructive text-destructive-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Score Header */}
      <div className="card-elevated p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className={cn(
            "inline-block px-4 py-1.5 rounded-full text-sm font-semibold",
            getScoreColor()
          )}>
            {result.judgementBand}
          </div>
          {typeof result.score4 === "number" && (
            <div className="text-sm text-muted-foreground">
              Inspection band score: {result.score4}/4
            </div>
          )}
          <p className="text-muted-foreground md:ml-auto">
            Evaluated against SCCIF inspection criteria
          </p>
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

      {/* Weaknesses */}
      {showWeaknesses && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold text-foreground">Weaknesses</h3>
          </div>
          {weaknesses && weaknesses.length > 0 ? (
            <ul className="space-y-2 stagger-children">
              {weaknesses.map((gap, index) => (
                <li key={index} className="flex items-start gap-3 text-foreground">
                  <span className="text-warning mt-1">-</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Weaknesses were not specified. Add clear gaps with evidence to improve the judgement.
            </p>
          )}
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

      {/* Ofsted concern text for lower bands */}
      {(result.judgementBand === "Inadequate" || result.judgementBand === "Requires improvement to be good") && (
        <div className="card-elevated p-6 border-destructive/30">
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">What Ofsted would be concerned about</h3>
          <p className="text-sm text-muted-foreground">
            Your response does not demonstrate that safeguarding practice is consistent, reviewed, or effective in protecting children from harm.
            Inspectors would be concerned that risks may not be identified early, escalated appropriately, or reviewed to reduce recurrence.
          </p>
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
          <div className="mt-4">
            <h4 className="font-display text-sm font-semibold text-foreground mb-1">What a stronger answer would include</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>A recent safeguarding concern (e.g., missing episode, peer conflict, online risk).</li>
              <li>How it was identified, recorded, and reviewed.</li>
              <li>Who it was escalated to (and why) and the outcome.</li>
              <li>What changed for the child as a result (impact, reduced recurrence).</li>
            </ul>
          </div>
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
