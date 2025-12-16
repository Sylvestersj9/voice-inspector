import { EvaluationResult, ofstedQuestions, getJudgementBand } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calcSessionBand,
  calcReadinessScore,
  calcTrajectory,
  calcPriorityAreas,
  buildOfstedConclusionTemplate,
} from "@/lib/inspectionSession";
import { getPlan } from "@/lib/plan";
import { safeArray } from "@/lib/safeArray";

interface ExportSummaryProps {
  results: Map<number, EvaluationResult>;
  sessionDate?: Date;
}

export function ExportSummary({ results, sessionDate = new Date() }: ExportSummaryProps) {
  const plan: "free" | "pro" = getPlan();
  const entries = Array.from(results?.entries?.() || []);
  if (!entries.length) {
    return (
      <div className="text-sm text-muted-foreground">
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

  // Collect all strengths, gaps, and actions
  const allStrengths = Array.from(results.values()).flatMap((r) => safeArray(r.strengths)).slice(0, 5);
  const allGaps = Array.from(results.values()).flatMap((r) => safeArray(r.gaps)).slice(0, 5);
  const allActions = Array.from(results.values()).flatMap((r) => safeArray(r.recommendedActions)).slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print:p-0">
      {/* Print Button - hidden in print */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      {/* Printable Content */}
      <div className="print:text-black print:bg-white space-y-6 card-elevated p-6 print:shadow-none print:border-none">
        {/* Header */}
        <div className="border-b pb-4 print:border-gray-300">
          <h1 className="font-display text-2xl font-bold text-foreground print:text-black">
            Ofsted Inspection Simulation Report
          </h1>
          <p className="text-muted-foreground print:text-gray-600">
            Generated: {sessionDate.toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Overall Score */}
        <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg print:bg-gray-100">
          <div>
            <div className="text-xl font-semibold text-foreground print:text-black">{session_band}</div>
            {session_score4 > 0 && (
              <p className="text-sm text-muted-foreground print:text-gray-600">
                Session score: {session_score4.toFixed(2)}/4
              </p>
            )}
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Overall judgement across {results.size} questions
            </p>
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Priority areas: {priorityAreas.join(", ") || "None identified"}
            </p>
            {plan === "pro" && (
              <>
                <p className="text-sm text-muted-foreground print:text-gray-600">Readiness: {readiness}/100</p>
                <p className="text-sm text-muted-foreground print:text-gray-600">Trajectory: {trajectory}</p>
                <p className="text-sm text-foreground print:text-black mt-1">{ofstedConclusion}</p>
              </>
            )}
          </div>
        </div>

        {/* Key Strengths */}
        {allStrengths.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground print:text-black mb-3">
              Key Strengths
            </h2>
            <ul className="space-y-2">
              {allStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground print:text-black">
                  <span className="text-success print:text-green-700">-</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Gaps */}
        {allGaps.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground print:text-black mb-3">
              Areas for Development
            </h2>
            <ul className="space-y-2">
              {allGaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground print:text-black">
                  <span className="text-warning print:text-yellow-700">-</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Priority Actions */}
        {allActions.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground print:text-black mb-3">
              Priority Actions
            </h2>
            <ol className="space-y-2 list-decimal list-inside">
              {allActions.map((a, i) => (
                <li key={i} className="text-sm text-foreground print:text-black">
                  {a}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Per-Question Scores */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground print:text-black mb-3">
            Question Breakdown
          </h2>
          <div className="space-y-2">
            {ofstedQuestions.map((q, idx) => {
              const result = results.get(idx);
              if (!result) return null;
              return (
                <div key={q.id} className="flex items-center justify-between py-2 border-b last:border-0 print:border-gray-200">
                  <div>
                    <span className="text-sm text-muted-foreground print:text-gray-600">Q{idx + 1}</span>
                    <span className="ml-2 text-sm font-medium text-foreground print:text-black">{q.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground print:text-black">
                      {(result.score4 ?? result.score ?? 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground print:text-gray-600">
                      ({result.judgementBand})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t text-center print:border-gray-300">
          <p className="text-xs text-muted-foreground print:text-gray-500">
            Based on Ofsted's Social Care Common Inspection Framework (SCCIF)
          </p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-0,
          .print\\:p-0 * {
            visibility: visible;
          }
          .print\\:p-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
