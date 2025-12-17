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
import { buildFallbackActions, buildFallbackGaps, buildFallbackStrengths, buildFollowUpFallback, nonEmptyArray } from "@/lib/evalFallbacks";
import { CoachMode } from "@/components/CoachMode";
import { useCallback, useState } from "react";

interface EvaluationResultsProps {
  result: EvaluationResult;
  transcript: string;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  onViewSummary?: () => void;
  onExitSession?: () => void;
}

export function EvaluationResults({ 
  result, 
  transcript,
  onNextQuestion, 
  isLastQuestion,
  onViewSummary,
  onExitSession
}: EvaluationResultsProps) {
  const [coachMode, setCoachMode] = useState(true);
  const [jumpToSentence, setJumpToSentence] = useState<(id: string) => void>(() => () => {});

  const registerJump = useCallback((fn: (id: string) => void) => {
    setJumpToSentence((prev) => (prev === fn ? prev : fn));
  }, []);
  const strengthFallback = buildFallbackStrengths("");
  const gapFallback = buildFallbackGaps("");
  const followUpFallback = buildFollowUpFallback();
  const actionFallback = buildFallbackActions();
  const displayBand =
    result.judgementBand === "Inadequate" ? "Needs development" : result.judgementBand;

  const strengthsStructured = Array.isArray(result.strengthsStructured) ? result.strengthsStructured : [];
  const weaknessesStructured = Array.isArray(result.weaknessesStructured) ? result.weaknessesStructured : [];
  const strengths = strengthsStructured.length > 0 ? [] : nonEmptyArray(result.strengths, strengthFallback);
  const weaknesses = weaknessesStructured.length > 0 ? [] : nonEmptyArray(result.weaknesses ?? result.gaps, gapFallback);
  const followUps = nonEmptyArray(result.followUpQuestions, followUpFallback);
  const recommendedActions = nonEmptyArray(result.recommendedActions, actionFallback);
  const riskFlags = Array.isArray(result.riskFlags) ? result.riskFlags : [];
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
      case "Needs development":
      case "Inadequate":
        return "bg-destructive text-destructive-foreground";
    }
  };

  const getConfidenceStyle = () => {
    switch (result.confidenceBand) {
      case "strong":
        return "text-success";
      case "borderline":
        return "text-warning";
      default:
        return "text-muted-foreground";
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
            {displayBand}
          </div>
          {typeof result.score4 === "number" && (
            <div className="text-sm text-muted-foreground">
              Inspection band score: {result.score4}/4
            </div>
          )}
          {result.confidenceBand && (
            <div className={cn("text-sm", getConfidenceStyle())}>
              {result.confidenceBand === "borderline" ? "Borderline" : result.confidenceBand === "strong" ? "Strong" : "Secure"}
            </div>
          )}
          <p className="text-muted-foreground md:ml-auto">
            Evaluated against SCCIF inspection criteria
          </p>
        </div>
      </div>

      {/* Strengths */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <h3 className="font-display text-lg font-semibold text-foreground">Strengths</h3>
        </div>
        {strengthsStructured.length > 0 ? (
          <ul className="space-y-3 stagger-children">
            {strengthsStructured.map((s, index) => (
              <li key={index} className="flex flex-col gap-1 text-foreground rounded-lg border bg-muted/50 p-3">
                <div className="text-sm font-medium">{s.whatWorked}</div>
                <div className="text-xs text-muted-foreground">{s.whyMatters}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(s.evidence || []).map((e) => (
                    <button
                      key={e}
                      onClick={() => jumpToSentence(e)}
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : strengths.length > 0 ? (
          <ul className="space-y-2 stagger-children">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 text-foreground">
                <span className="text-success mt-1">-</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No explicit strengths were identified. Focus on providing specific examples and evidence to demonstrate good practice.
          </p>
        )}
      </div>

      {/* Weaknesses */}
      {showWeaknesses && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold text-foreground">Weaknesses</h3>
          </div>
          {weaknessesStructured.length > 0 ? (
            <ul className="space-y-3 stagger-children">
              {weaknessesStructured.map((w, index) => (
                <li key={index} className="flex flex-col gap-1 text-foreground rounded-lg border bg-muted/50 p-3">
                  <div className="text-sm font-medium">{w.gap}</div>
                  <div className="text-xs text-warning">Risk: {w.risk}</div>
                  <div className="text-xs text-muted-foreground">What Ofsted expected: {w.expected}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(w.evidence || []).map((e) => (
                      <button
                        key={e}
                        onClick={() => jumpToSentence(e)}
                        className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : weaknesses && weaknesses.length > 0 ? (
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
      {riskFlags.length > 0 && (
        <div className="card-elevated p-6 border-destructive/30">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-lg font-semibold text-foreground">Risk Flags</h3>
          </div>
          <ul className="space-y-2 stagger-children">
            {riskFlags.map((flag, index) => (
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
      {followUps.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">Follow-up Questions</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            An inspector might ask these follow-up questions based on your response:
          </p>
          <ul className="space-y-3 stagger-children">
            {followUps.map((question, index) => (
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
      {recommendedActions.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold text-foreground">Recommended Actions</h3>
          </div>
          <ul className="space-y-3 stagger-children">
            {recommendedActions.map((action, index) => (
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

      {/* Coach mode toggle */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-display text-md font-semibold text-foreground">Coach mode</p>
              <p className="text-xs text-muted-foreground">Show transcript, improvements, and clickable evidence.</p>
            </div>
          </div>
          <Button variant={coachMode ? "default" : "outline"} size="sm" onClick={() => setCoachMode((v) => !v)}>
            {coachMode ? "Hide" : "Show"}
          </Button>
        </div>
        {coachMode && (
          <CoachMode
            transcript={transcript}
            sentences={result.sentences}
            strengths={strengthsStructured}
            weaknesses={weaknessesStructured}
            improvements={result.sentenceImprovements}
            registerJump={registerJump}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-end gap-2 pt-4">
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
        {onExitSession && (
          <Button variant="ghost" size="sm" onClick={onExitSession} className="text-muted-foreground">
            Exit session
          </Button>
        )}
      </div>
    </div>
  );
}
