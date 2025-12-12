import { EvaluationResult, ofstedQuestions, getJudgementBand } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportSummaryProps {
  results: Map<number, EvaluationResult>;
  sessionDate?: Date;
}

export function ExportSummary({ results, sessionDate = new Date() }: ExportSummaryProps) {
  const averageScore = Array.from(results.values()).reduce((sum, r) => sum + r.score, 0) / results.size;
  const overallBand = getJudgementBand(averageScore);

  // Collect all strengths, gaps, and actions
  const allStrengths = Array.from(results.values()).flatMap(r => r.strengths).slice(0, 5);
  const allGaps = Array.from(results.values()).flatMap(r => r.gaps).slice(0, 5);
  const allActions = Array.from(results.values()).flatMap(r => r.recommendedActions).slice(0, 5);

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
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground print:text-black">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground print:text-gray-600">out of 5</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground print:text-black">{overallBand}</div>
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Overall judgement across {results.size} questions
            </p>
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
                      {result.score.toFixed(1)}
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


