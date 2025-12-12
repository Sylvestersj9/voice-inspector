import { EvaluationResult, ofstedQuestions, getJudgementBand } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ExportSummary } from "./ExportSummary";

interface SessionSummaryProps {
  results: Map<number, EvaluationResult>;
  onStartOver: () => void;
}

export function SessionSummary({ results, onStartOver }: SessionSummaryProps) {
  const averageScore = Array.from(results.values()).reduce((sum, r) => sum + r.score, 0) / results.size;
  const overallBand = getJudgementBand(averageScore);
  
  const getScoreColor = (band: string) => {
    switch (band) {
      case "Outstanding": return "bg-success text-success-foreground";
      case "Good": return "bg-primary text-primary-foreground";
      case "Requires Improvement": return "bg-warning text-warning-foreground";
      case "Inadequate": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Overall Score */}
      <div className="card-elevated p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">
          Inspection Simulation Complete
        </h2>
        
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className={cn(
            "flex items-center justify-center h-32 w-32 rounded-3xl text-4xl font-display font-bold",
            getScoreColor(overallBand)
          )}>
            {averageScore.toFixed(1)}
          </div>
          <div className={cn("px-6 py-2 rounded-full text-lg font-semibold", getScoreColor(overallBand))}>
            {overallBand}
          </div>
        </div>
        
        <p className="text-muted-foreground max-w-lg mx-auto">
          Based on your responses across all {results.size} questions, your overall performance 
          indicates a <span className="font-semibold text-foreground">{overallBand}</span> rating.
        </p>
      </div>

      {/* Export Summary */}
      <ExportSummary results={results} />

      {/* Individual Results */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold text-foreground">Question-by-Question Results</h3>
        
        {ofstedQuestions.map((question, index) => {
          const result = results.get(index);
          if (!result) return null;
          
          return (
            <div key={question.id} className="card-elevated p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl text-lg font-semibold",
                  getScoreColor(result.judgementBand)
                )}>
                  {result.score.toFixed(1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getScoreColor(result.judgementBand))}>
                      {result.judgementBand}
                    </span>
                  </div>
                  <h4 className="font-medium text-foreground mb-2">{question.domain}</h4>
                  
                  {result.strengths.length > 0 && (
                    <p className="text-sm text-success mb-1">
                      <span className="font-medium">Key strength:</span> {result.strengths[0]}
                    </p>
                  )}
                  {result.gaps.length > 0 && (
                    <p className="text-sm text-warning">
                      <span className="font-medium">Area to develop:</span> {result.gaps[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4 pt-6">
        <Button onClick={onStartOver} variant="outline" size="lg" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Start New Session
        </Button>
        <Link to="/history">
          <Button variant="outline" size="lg" className="gap-2">
            <Clock className="h-4 w-4" />
            View History
          </Button>
        </Link>
      </div>
    </div>
  );
}
