import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { exportReportPdf } from "@/reports/exportReportPdf";
import { getBandColorClass } from "@/lib/questions";
import {
  ArrowLeft, Printer, AlertTriangle, CheckCircle2, Target,
  BookOpen, FileText, Star, TrendingUp, Users, ShieldAlert,
} from "lucide-react";

// ── Domain metadata ───────────────────────────────────────────────────────────

const DOMAIN_META: Record<string, { qs: number; name: string }> = {
  QualityPurpose:        { qs: 1, name: "Quality and Purpose of Care" },
  ChildrenViews:         { qs: 2, name: "Children's Views, Wishes and Feelings" },
  Education:             { qs: 3, name: "Education" },
  EnjoymentAchievement:  { qs: 4, name: "Enjoyment and Achievement" },
  HealthWellbeing:       { qs: 5, name: "Health and Wellbeing" },
  PositiveRelationships: { qs: 6, name: "Positive Relationships" },
  ProtectionChildren:    { qs: 7, name: "Protection of Children" },
  LeadershipManagement:  { qs: 8, name: "Leadership and Management" },
  CarePlanning:          { qs: 9, name: "Care Planning" },
};

// ── Checklist data ────────────────────────────────────────────────────────────

const CHECKLIST_GROUPS = [
  {
    id: "ax",
    title: "Annex A Data Accuracy",
    items: [
      { id: "ax1", text: "Annex A figures can be generated and submitted accurately within hours of an inspector arriving" },
      { id: "ax2", text: "Annex A totals exactly match daily logs for incidents, restraints, missing from care episodes, complaints, and staffing figures" },
    ],
  },
  {
    id: "sg",
    title: "Safeguarding and Risk Management",
    items: [
      { id: "sg1", text: "Safeguarding records demonstrate a clear concern, action, and outcome trail for every concern raised" },
      { id: "sg2", text: "Individual risk assessments are up to date for all high-risk areas including self-harm, exploitation, and going missing" },
      { id: "sg3", text: "Return home interviews are completed and logged for every missing episode" },
      { id: "sg4", text: "Strategy discussions following missing episodes have clear risk-reduction measures recorded and implemented" },
      { id: "sg5", text: "The home's Location Risk Assessment has been reviewed within the last 12 months or following any new risk emerging in the area" },
    ],
  },
  {
    id: "cl",
    title: "Children's Lived Experiences and Case Tracking",
    items: [
      { id: "cl1", text: "Children's chronologies and daily records are current, meaningful, and aligned with their care and placement plans" },
      { id: "cl2", text: "Records go beyond description and evidence the impact of care on each child's progress and wellbeing" },
      { id: "cl3", text: "The child's voice is captured and evidenced as having been acted upon through keywork sessions, house meetings, or complaint outcomes" },
      { id: "cl4", text: "Each child has clear records tracking their progress in health, education, and hobbies and activities" },
      { id: "cl5", text: "There is documented evidence of proactive efforts to sustain placement stability during difficult periods" },
      { id: "cl6", text: "Any transitions or placement endings are well-planned, child-centred, and fully evidenced" },
    ],
  },
  {
    id: "lq",
    title: "Leadership, Quality Assurance and Governance",
    items: [
      { id: "lq1", text: "Regulation 44 monthly independent visitor reports are current and all recommendations are tracked to closure with evidence of impact" },
      { id: "lq2", text: "Regulation 45 six-monthly quality of care review is completed and focuses on evaluation, themes, and measurable impact rather than describing activities" },
      { id: "lq3", text: "Statement of Purpose is up to date and current practice including admission decisions aligns with it" },
      { id: "lq4", text: "There is a clear and evidenced learning loop showing how complaints, whistleblowing disclosures, and incidents have led to practice improvements" },
    ],
  },
  {
    id: "ws",
    title: "Workforce and Staffing",
    items: [
      { id: "ws1", text: "All staff recruitment files are complete including DBS certificates, references, and verified written explanations for any employment gaps" },
      { id: "ws2", text: "The training matrix is live and up to date showing compliance with all mandatory training including safeguarding and de-escalation with scheduled refresher dates" },
      { id: "ws3", text: "Staff supervision records are current and demonstrate reflective practice with follow-up actions recorded and evidenced" },
    ],
  },
];

const ALL_CHECKLIST_IDS = CHECKLIST_GROUPS.flatMap((g) => g.items.map((i) => i.id));

// ── Types ─────────────────────────────────────────────────────────────────────

type DomainBreakdownItem = {
  domain: number;
  qsName: string;
  grade: string;
  evidence?: string;
  strengths?: string[];
  actions?: string[];
  inspectorNote?: string;
  // legacy
  band?: string;
  summary?: string;
};

type NotCoveredDomain = { key: string; qs: number; name: string };

type ReportHeader = {
  homeName?: string;
  managerName?: string;
  managerRole?: string;
  date?: string;
  time?: string;
  inspector?: string;
  sessionType?: string;
  questionsAnswered?: number;
  totalQS?: number;
  notCoveredDomains?: NotCoveredDomain[];
};

type ReportJson = {
  header?: ReportHeader;
  overallGrade?: string;
  overallBand?: string;
  overallScore?: number;
  scorePercent?: number;
  summaryNarrative?: string;
  narrativeSummary?: string;
  closingVerdict?: string;
  keyStrengths?: string[];
  priorityActions?: string[];
  readinessStatement?: string;
  domainBreakdown?: DomainBreakdownItem[];
};

type ResponseRow = {
  domain: string;
  question_text: string;
  answer_text: string | null;
  score: number | null;
  band: string | null;
  feedback_json: Record<string, unknown> | null;
};

type SessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  overall_band: string | null;
  overall_score: number | null;
  report_json: ReportJson | null;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BandPill({ band, large }: { band: string; large?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${large ? "px-4 py-1 text-base" : "px-2.5 py-0.5 text-xs"} ${getBandColorClass(band)}`}>
      {band}
    </span>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print-avoid-break">
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="text-teal-600">{icon}</div>}
        <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Report() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !sessionId) return;
    async function load() {
      setLoading(true);
      const { data: sess, error: sErr } = await supabase
        .from("sessions")
        .select("id,started_at,completed_at,overall_band,overall_score,report_json")
        .eq("id", sessionId)
        .eq("user_id", user!.id)
        .single();
      if (sErr || !sess) { setError("Session not found or access denied."); setLoading(false); return; }
      setSession(sess as SessionRow);

      const { data: resps } = await supabase
        .from("responses")
        .select("domain,question_text,answer_text,score,band,feedback_json")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      setResponses((resps as ResponseRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user, sessionId]);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-sm text-slate-500">Loading report…</div>
    </div>
  );

  if (error || !session) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
      <AlertTriangle className="h-10 w-10 text-red-400" />
      <p className="text-slate-700">{error ?? "Report not available."}</p>
      <Link to="/app/dashboard" className="text-teal-700 hover:underline text-sm">Back to dashboard</Link>
    </div>
  );

  const report = session.report_json;
  const overallBand = report?.overallGrade ?? report?.overallBand ?? session.overall_band ?? null;
  const overallScore = report?.overallScore ?? session.overall_score ?? null;
  const scorePercent = report?.scorePercent ?? (overallScore ? Math.round((overallScore / 4) * 100) : null);
  const narrative = report?.summaryNarrative ?? report?.narrativeSummary ?? null;
  const header = report?.header;

  // Derive action plan from all gaps across responses (Protection first)
  const actionPlanRows: { priority: string; action: string; qs: string; isProtection: boolean }[] = [];
  const sortedResponses = [...responses].sort((a, b) =>
    a.domain === "ProtectionChildren" ? -1 : b.domain === "ProtectionChildren" ? 1 : 0
  );
  sortedResponses.forEach((r) => {
    const meta = DOMAIN_META[r.domain] ?? { qs: 0, name: r.domain };
    const gaps: string[] = (r.feedback_json?.gaps as string[]) ?? [];
    gaps.forEach((gap) => {
      actionPlanRows.push({
        priority: r.domain === "ProtectionChildren" ? "High" : "Medium",
        action: gap,
        qs: `QS${meta.qs} — ${meta.name}`,
        isProtection: r.domain === "ProtectionChildren",
      });
    });
  });

  const notCovered = header?.notCoveredDomains ?? [];
  const sessionType = header?.sessionType ?? (responses.length >= 9 ? "Full Session" : "Partial Session");
  const totalChecked = checkedItems.size;

  const handleExportPdf = async () => {
    if (!session) return;
    await exportReportPdf({
      sessionId: session.id,
      report: report ?? {},
      responses,
      header,
    });
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm 15mm 22mm 15mm; }
          .print-hide { display: none !important; }
          .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .print-page-break { break-before: page; page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media print {
          footer.print-footer { display: block; position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #94a3b8; padding: 4mm 0; border-top: 1px solid #e2e8f0; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50">

        {/* Nav */}
        <header className="print-hide sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to="/app/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                  <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-display font-bold text-slate-900">MockOfsted</span>
            </div>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </header>

        <main ref={printRef} className="mx-auto max-w-4xl px-4 py-8 space-y-6">

          {/* ── Section 1: Report Header ────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print-avoid-break">
            {/* Print-only page header */}
            <div className="hidden print:flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600">
                <svg viewBox="0 0 32 32" fill="none" className="h-3.5 w-3.5">
                  <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                  <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-bold text-sm text-slate-700">MockOfsted — Inspection Readiness Assessment</span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">MockOfsted</p>
            <h1 className="font-display text-2xl font-bold text-slate-900">Inspection Readiness Assessment Report</h1>

            <div className="mt-4 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              {header?.managerName && <div><span className="font-semibold text-slate-800">Manager:</span> {header.managerName}</div>}
              {header?.managerRole && <div><span className="font-semibold text-slate-800">Role:</span> {header.managerRole}</div>}
              {header?.homeName && <div><span className="font-semibold text-slate-800">Home:</span> {header.homeName}</div>}
              <div><span className="font-semibold text-slate-800">Date:</span> {header?.date ?? new Date(session.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
              {header?.time && <div><span className="font-semibold text-slate-800">Time:</span> {header.time}</div>}
              <div><span className="font-semibold text-slate-800">Session type:</span> {sessionType}</div>
              <div><span className="font-semibold text-slate-800">Standards assessed:</span> {responses.length} of 9 Quality Standards</div>
            </div>

            {notCovered.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">Quality Standards not assessed in this session</p>
                <ul className="text-sm text-amber-800 space-y-0.5">
                  {notCovered.map((d) => (
                    <li key={d.key}>QS{d.qs} — {d.name} <span className="text-amber-600 italic">(not assessed)</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Section 2: Overall Judgement ────────────────────────────────── */}
          {overallBand && (
            <SectionCard title="Overall Judgement" icon={<Star className="h-5 w-5" />}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <BandPill band={overallBand} large />
                  {scorePercent != null && (
                    <div className="text-center">
                      <p className="text-3xl font-display font-bold text-slate-900">{scorePercent}%</p>
                      <p className="text-xs text-slate-400">overall score</p>
                    </div>
                  )}
                  {overallScore != null && (
                    <p className="text-xs text-slate-400">{Number(overallScore).toFixed(1)} / 4.0</p>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {narrative && (
                    <div>
                      {narrative.split(/\n+/).filter(Boolean).map((para, i) => (
                        <p key={i} className="text-sm leading-relaxed text-slate-700 mb-2">{para}</p>
                      ))}
                    </div>
                  )}
                  {report?.closingVerdict && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Inspector's closing verdict</p>
                      <p className="text-sm italic text-slate-700">"{report.closingVerdict}"</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── Section 3: Executive Summary ────────────────────────────────── */}
          {(report?.keyStrengths || report?.priorityActions || report?.readinessStatement) && (
            <SectionCard title="Executive Summary" icon={<TrendingUp className="h-5 w-5" />}>
              <div className="space-y-5">
                {report.readinessStatement && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Inspection Readiness</p>
                    <p className="text-sm leading-relaxed text-slate-700">{report.readinessStatement}</p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {report.keyStrengths && report.keyStrengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">Key strengths</p>
                      <ul className="space-y-2">
                        {report.keyStrengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.priorityActions && report.priorityActions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">Priority actions</p>
                      <ul className="space-y-2">
                        {report.priorityActions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">{i + 1}</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── Section 4: Domain by Domain ─────────────────────────────────── */}
          {responses.length > 0 && (
            <SectionCard title="Domain by Domain Breakdown" icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                {responses.map((r, idx) => {
                  const meta = DOMAIN_META[r.domain] ?? { qs: idx + 1, name: r.domain };
                  const fb = r.feedback_json ?? {};
                  const isProtection = r.domain === "ProtectionChildren";

                  // Find matching report domainBreakdown entry by QS number
                  const domainReport = report?.domainBreakdown?.find(
                    (d) => d.domain === meta.qs || d.qsName === meta.name
                  );

                  const strengths: string[] = (fb.strengths as string[]) ?? domainReport?.strengths ?? [];
                  const gaps: string[] = (fb.gaps as string[]) ?? [];
                  const followUp: string = (fb.followUpQuestion as string) ?? "";
                  const inspectorNote: string = domainReport?.inspectorNote ?? (fb.inspectorNote as string) ?? "";
                  const encouragement: string = (fb.encouragement as string) ?? "";
                  const detailedFeedback: string = domainReport?.evidence ?? (fb.summary as string) ?? "";

                  return (
                    <div key={r.domain} className="rounded-xl border border-slate-200 bg-slate-50 p-5 print-avoid-break">
                      {/* Domain header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-slate-400">QS{meta.qs}</span>
                            {isProtection && (
                              <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700 flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> LIMITING JUDGEMENT
                              </span>
                            )}
                          </div>
                          <p className="font-display font-bold text-slate-900">{meta.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-500">{r.score}/4</span>
                          <BandPill band={r.band ?? "—"} />
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Question asked</p>
                        <p className="text-sm font-medium text-slate-800 italic">"{r.question_text}"</p>
                      </div>

                      {/* Full answer */}
                      {r.answer_text && (
                        <div className="mb-4 rounded-lg bg-white border border-slate-200 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Your answer</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{r.answer_text}</p>
                        </div>
                      )}

                      {/* Detailed feedback */}
                      {detailedFeedback && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Inspector's assessment</p>
                          <p className="text-sm leading-relaxed text-slate-700">{detailedFeedback}</p>
                        </div>
                      )}

                      {/* Strengths and gaps */}
                      <div className="grid gap-3 sm:grid-cols-2 mb-4">
                        {strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1.5">Strengths</p>
                            <ul className="space-y-1">
                              {strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {gaps.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1.5">Gaps</p>
                            <ul className="space-y-1">
                              {gaps.map((g, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Follow-up question */}
                      {followUp && (
                        <div className="mb-3 rounded-lg bg-white border border-slate-200 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Inspector's follow-up question</p>
                          <p className="text-sm italic text-slate-700">"{followUp}"</p>
                        </div>
                      )}

                      {/* Inspector note */}
                      {inspectorNote && (
                        <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">Inspector's note</p>
                          <p className="text-xs text-blue-800 leading-relaxed">{inspectorNote}</p>
                        </div>
                      )}

                      {/* Encouragement */}
                      {encouragement && (
                        <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                          <p className="text-sm text-teal-800 font-medium">{encouragement}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* ── Section 5: Improvement Action Plan ──────────────────────────── */}
          {actionPlanRows.length > 0 && (
            <SectionCard title="Improvement Action Plan" icon={<Target className="h-5 w-5" />}>
              <p className="text-xs text-slate-500 mb-4">Derived from gaps identified across all domain answers. Protection of Children gaps are listed first as the limiting judgement standard.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">Priority</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Action Required</th>
                      <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 w-40">Quality Standard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionPlanRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${row.isProtection ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-700 leading-relaxed">{row.action}</td>
                        <td className="py-2.5 text-xs text-slate-500">{row.qs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* ── Section 6: Inspection Readiness Checklist ───────────────────── */}
          <SectionCard title="Inspection Readiness Checklist" icon={<BookOpen className="h-5 w-5" />}>
            <p className="text-xs text-slate-500 mb-1">
              Use this checklist to assess your readiness for an unannounced Ofsted inspection. All items are drawn from the SCCIF 2025 and the Children's Homes (England) Regulations 2015.
            </p>

            {/* Progress indicator */}
            <div className="mb-5 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-4 print-hide">
              <div className="flex-1">
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-teal-500 transition-all"
                    style={{ width: `${(totalChecked / ALL_CHECKLIST_IDS.length) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-700 shrink-0">
                {totalChecked}/{ALL_CHECKLIST_IDS.length} completed
              </p>
            </div>

            <div className="space-y-6">
              {CHECKLIST_GROUPS.map((group) => (
                <div key={group.id} className="print-avoid-break">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">{group.title}</p>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={checkedItems.has(item.id)}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                        />
                        <label htmlFor={item.id} className="text-sm text-slate-700 leading-snug cursor-pointer">
                          {item.text}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              This checklist is based on the Social Care Common Inspection Framework 2025 and the Children's Homes (England) Regulations 2015. It is intended as a self-assessment tool and does not guarantee inspection outcomes.
            </p>
          </SectionCard>

          {/* ── Section 7: Disclaimer ───────────────────────────────────────── */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 print-avoid-break">
            <p className="font-semibold mb-1">Important notice</p>
            <p className="leading-relaxed text-xs">
              This report was generated by MockOfsted as a practice and professional development tool. It does not constitute an official Ofsted inspection, compliance certification, or legal advice. Scores and feedback are AI-generated based on your answers only and should be used for self-reflection and preparation purposes. MockOfsted is not affiliated with Ofsted.
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-400 leading-relaxed">
            © {new Date().getFullYear()} MockOfsted — mockofsted.co.uk — info@mockofsted.co.uk
          </p>
        </main>

        {/* Print-only page footer */}
        <footer className="print-footer print-hide">
          MockOfsted — Inspection Readiness Assessment Report — mockofsted.co.uk
        </footer>
      </div>
    </>
  );
}
