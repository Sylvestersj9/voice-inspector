import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReport } from "@/reports/getReport";
import { exportReportPdf } from "@/reports/exportReportPdf";
import type { InspectionReport } from "@/reports/types";
import type { ReportBand } from "@/reports/types";
import { useAuth } from "@/auth/AuthProvider";

export default function InspectionReport() {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [domains, setDomains] = useState<Array<{ domain: string; avg_score: number; band: ReportBand }>>([]);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [homeName, setHomeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!inspectionId) return;
      setLoading(true);
      try {
        const res = await getReport(inspectionId);
        setReport(res.report);
        setDomains(res.domains);
        setSessionTitle(res.sessionTitle);
        setHomeName(res.homeName);
      } catch (err: any) {
        setError(err?.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [inspectionId]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>;
  if (!report) return <div style={{ padding: 16 }}>No report available.</div>;

  const handleExport = async () => {
    if (!user) return;
    await exportReportPdf({
      report,
      domains,
      homeName,
      sessionTitle,
      inspectionSessionId: inspectionId!,
      actorId: user.id,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Inspection Report</h1>
          <p className="text-sm text-muted-foreground">
            Home: {homeName || "N/A"} • {sessionTitle || "Untitled"}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
        >
          Export PDF
        </button>
      </div>

      <div className="card-elevated p-4 space-y-2">
        <p className="text-lg font-semibold text-foreground">Overall band: {report.overall_band}</p>
        <p className="text-sm text-muted-foreground">Overall score: {report.overall_score.toFixed(2)}</p>
      </div>

      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Strengths</h2>
        <p className="text-sm text-foreground whitespace-pre-line">{report.strengths}</p>
      </div>

      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Key risks</h2>
        <p className="text-sm text-foreground whitespace-pre-line">{report.key_risks}</p>
      </div>

      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Recommended actions</h2>
        <p className="text-sm text-foreground whitespace-pre-line">{report.recommended_actions}</p>
      </div>

      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Domain breakdown</h2>
        <div className="space-y-2">
          {domains.map((d) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{d.domain}</span>
              <span className="text-muted-foreground">
                {d.avg_score.toFixed(2)} ({d.band})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
