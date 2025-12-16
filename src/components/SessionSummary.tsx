import { EvaluationResult, ofstedQuestions, getJudgementBand } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ExportSummary } from "./ExportSummary";
import {
  calcSessionBand,
  calcTrajectory,
  calcReadinessScore,
  calcPriorityAreas,
  buildOfstedConclusionTemplate,
} from "@/lib/inspectionSession";
import { getPlan } from "@/lib/plan";
import { safeArray } from "@/lib/safeArray";

interface SessionSummaryProps {
  results: Map<number, EvaluationResult>;
  onStartOver: () => void;
}

export function SessionSummary({ results, onStartOver }: SessionSummaryProps) {
  const plan: "free" | "pro" = getPlan();

  const entries = Array.from(results?.entries?.() || []);
  if (!entries.length) {
    return (
      <div className="card-elevated p-6 text-sm text-muted-foreground">
        No session results available yet.
      </div>
    );
  }

  const scores = entries.map(([, r]) => r.score4 ?? r.score ?? 0);
  const averageScore = scores.length ? scores.reduce((sum, v) => sum + v, 0) / scores.length : 0;
  const overallBand = getJudgementBand(averageScore || 0);

  const sessionAreas = ofstedQuestions.map((q, idx) => {
    const r = results.get(idx);
    return {
      area: q.domain,
      band: r?.judgementBand ?? "Requires improvement to be good",
      score4: r?.score4 ?? r?.score ?? 0,
      confidence: r?.confidenceBand,
    };
  }).filter((r) => r.score4 > 0);

  const { session_band, session_score4 } = calcSessionBand(sessionAreas.map((a) => a.score4));
  const trajectory = calcTrajectory(sessionAreas.map((a) => a.score4));
  const readiness = calcReadinessScore(sessionAreas);
  const priorityAreas = calcPriorityAreas(sessionAreas);
  const ofstedConclusion = buildOfstedConclusionTemplate(session_band, priorityAreas, trajectory);
  
  const getScoreColor = (band: string) => {
    switch (band) {
      case "Outstanding": return "bg-success text-success-foreground";
      case "Good": return "bg-primary text-primary-foreground";
      case "Requires improvement to be good": return "bg-warning text-warning-foreground";
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
          <div className={cn("px-6 py-2 rounded-full text-lg font-semibold", getScoreColor(session_band))}>
            {session_band}
          </div>
          {session_score4 > 0 && (
            <div className="text-sm text-muted-foreground">
              Session score: {session_score4.toFixed(2)}/4
            </div>
          )}
        </div>
        
        <p className="text-muted-foreground max-w-lg mx-auto">
          Based on your responses across all {results.size} questions, your overall performance 
          indicates a <span className="font-semibold text-foreground">{session_band}</span> inspection readiness band.
        </p>
      </div>

      <div className="card-elevated p-6 space-y-3">
        <h3 className="font-display text-lg font-semibold text-foreground">Inspection Readiness</h3>
        <div className="grid gap-3 md:grid-cols-3 items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Trajectory</p>
            <p className="text-sm text-foreground">
              {trajectory === "improving" && "↑ Improving"}
              {trajectory === "declining" && "↓ Declining"}
              {trajectory === "stable" && "→ Stable"}
              {trajectory === "insufficient data" && "Not enough data"}
            </p>
          </div>
          {plan === "pro" ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Readiness score</p>
                <p className="text-sm text-foreground">{readiness}/100</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Priority areas</p>
                <p className="text-sm text-foreground">{priorityAreas.join(", ") || "None identified"}</p>
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <div className="card-elevated border border-primary/30 p-4">
                <p className="text-sm font-semibold text-foreground">Unlock full inspection rehearsal</p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to see readiness score, trajectory detail, and inspector-style conclusion.
                </p>
              </div>
            </div>
          )}
        </div>
        {plan === "pro" && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground uppercase mb-1">What Ofsted would likely conclude</p>
            <p className="text-sm text-foreground">{ofstedConclusion}</p>
          </div>
        )}
      </div>

      {/* Export Summary */}
      <ExportSummary results={results} />

      {/* Individual Results */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold text-foreground">Question-by-Question Results</h3>
        
        {ofstedQuestions.map((question, index) => {
          const result = results.get(index);
          if (!result) return null;
          const strengths = safeArray(result.strengths);
          const gaps = safeArray((result as { gaps?: unknown }).gaps);
          
          return (
            <div key={question.id} className="card-elevated p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl text-lg font-semibold",
                  getScoreColor(result.judgementBand)
                )}>
                  {(result.score4 ?? result.score ?? 0).toFixed(1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getScoreColor(result.judgementBand))}>
                      {result.judgementBand}
                    </span>
                  </div>
                  <h4 className="font-medium text-foreground mb-2">{question.domain}</h4>
                  
                  {strengths.length > 0 && (
                    <p className="text-sm text-success mb-1">
                      <span className="font-medium">Key strength:</span> {strengths[0]}
                    </p>
                  )}
                  {gaps.length > 0 && (
                    <p className="text-sm text-warning">
                      <span className="font-medium">Area to develop:</span> {gaps[0]}
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
