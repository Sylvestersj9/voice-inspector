import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReport } from "@/reports/getReport";
import { exportReportPdf } from "@/reports/exportReportPdf";
import type { InspectionReport } from "@/reports/types";
import type { ReportBand } from "@/reports/types";
import { useAuth } from "@/auth/AuthProvider";
import { getActionPlan } from "@/actionPlans/getActionPlan";
import { saveActionPlan } from "@/actionPlans/saveActionPlan";
import { generateActionsFromEvaluations } from "@/actionPlans/generateFromEvaluations";
import type { ActionItem } from "@/actionPlans/types";
import { supabase } from "@/lib/supabase";

export default function InspectionReport() {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [domains, setDomains] = useState<Array<{ domain: string; avg_score: number; band: ReportBand }>>([]);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [homeName, setHomeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planActions, setPlanActions] = useState<ActionItem[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [planDirty, setPlanDirty] = useState(false);

  const priorityTone = (p: ActionItem["priority"]) => {
    if (p === "High") return "bg-rose-50 text-rose-800 ring-rose-100";
    if (p === "Medium") return "bg-amber-50 text-amber-900 ring-amber-100";
    return "bg-emerald-50 text-emerald-900 ring-emerald-100";
  };

  const handleUpdateAction = (index: number, field: keyof ActionItem, value: ActionItem[keyof ActionItem]) => {
    setPlanActions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setPlanDirty(true);
  };

  const handleAddAction = () => {
    setPlanActions((prev) => [
      ...prev,
      {
        title: "New action",
        description: "",
        priority: "Medium",
        owner: "",
        due_date: null,
        status: "Open",
      },
    ]);
    setPlanDirty(true);
  };

  const handleSavePlan = async () => {
    if (!inspectionId) return;
    if (planSaving) return;
    setPlanSaving(true);
    setPlanError(null);
    try {
      const sanitised = planActions.map((a) => ({
        ...a,
        due_date: a.due_date && a.due_date.length ? a.due_date : null,
      }));
      const saved = await saveActionPlan(inspectionId, sanitised);
      setPlanActions(saved.actions || []);
      setPlanDirty(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save action plan";
      setPlanError(message);
    } finally {
      setPlanSaving(false);
    }
  };

  const handleCopyPlan = async () => {
    const lines =
      planActions.length === 0
        ? ["No actions available yet."]
        : planActions.map(
            (a, idx) =>
              `${idx + 1}. ${a.title} [${a.priority}] (${a.status}) - Owner: ${a.owner || "TBD"} - Due: ${
                a.due_date || "TBD"
              }\n   ${a.description || ""}`,
          );
    try {
      await navigator.clipboard.writeText(lines.join("\n\n"));
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load report";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [inspectionId]);

  useEffect(() => {
    const loadPlan = async () => {
      if (!inspectionId) return;
      setPlanLoading(true);
      setPlanError(null);
      try {
        const existing = await getActionPlan(inspectionId);
        if (existing) {
          setPlanActions(existing.actions || []);
          return;
        }

        const { data: evals, error: evalErr } = await supabase
          .from("inspection_evaluations")
          .select(
            `
            gaps,
            follow_up_questions,
            band,
            inspection_session_questions ( domain_name )
          `,
          )
          .eq("inspection_session_questions.inspection_session_id", inspectionId);

        if (evalErr) throw evalErr;
        const auto = generateActionsFromEvaluations(evals || []);
        const saved = await saveActionPlan(inspectionId, auto);
        setPlanActions(saved.actions || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load action plan";
        setPlanError(message);
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlan();
  }, [inspectionId]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
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

      <div className="card-elevated p-4 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Action plan</h2>
            <p className="text-sm text-muted-foreground">Editable next steps generated from this session. Save to keep changes.</p>
            {planError ? <p className="text-sm text-red-600">{planError}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyPlan}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Copy Action Plan
            </button>
            <button
              onClick={handleSavePlan}
              disabled={planSaving || planLoading || !planDirty}
              className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
            >
              {planSaving ? "Saving..." : planDirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </div>

        {planLoading ? (
          <div className="text-sm text-muted-foreground">Loading action plan...</div>
        ) : (
          <div className="space-y-3">
            {planActions.map((a, idx) => (
              <div key={idx} className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold text-slate-900">Action {idx + 1}</div>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priorityTone(a.priority)}`}>
                    Priority: {a.priority}
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Title</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                      value={a.title}
                      onChange={(e) => handleUpdateAction(idx, "title", e.target.value)}
                      onBlur={() => planDirty && handleSavePlan()}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Description</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                      value={a.description}
                      rows={3}
                      onChange={(e) => handleUpdateAction(idx, "description", e.target.value)}
                      onBlur={() => planDirty && handleSavePlan()}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Priority</label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        value={a.priority}
                        onChange={(e) => handleUpdateAction(idx, "priority", e.target.value as ActionItem["priority"])}
                        onBlur={() => planDirty && handleSavePlan()}
                      >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Owner</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        value={a.owner}
                        onChange={(e) => handleUpdateAction(idx, "owner", e.target.value)}
                        onBlur={() => planDirty && handleSavePlan()}
                        placeholder="Name or role"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Due date</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        value={a.due_date ? a.due_date.slice(0, 10) : ""}
                        onChange={(e) => handleUpdateAction(idx, "due_date", e.target.value || null)}
                        onBlur={() => planDirty && handleSavePlan()}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Status</label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        value={a.status}
                        onChange={(e) => handleUpdateAction(idx, "status", e.target.value as ActionItem["status"])}
                        onBlur={() => planDirty && handleSavePlan()}
                      >
                        <option>Open</option>
                        <option>In progress</option>
                        <option>Complete</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddAction}
              className="inline-flex items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              + Add action
            </button>
          </div>
        )}
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
