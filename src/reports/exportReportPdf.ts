import type { InspectionReport, ReportBand } from "./types";
import { DOMAIN_LABELS, DOMAIN_ORDER } from "@/lib/questions";

const TEAL = "#0D9488";

const BAND_COLORS: Record<string, string> = {
  Outstanding: "#22c55e",
  Good: "#f59e0b",
  "Requires Improvement": "#f97316",
  Inadequate: "#ef4444",
};

type DomainSummary = { domain: string; avg_score: number; band: ReportBand };

type ReportDomain = {
  domain: number;
  qsName: string;
  grade: string;
  evidence?: string;
  strengths?: string[];
  actions?: string[];
  inspectorNote?: string;
};

type ReportJson = {
  overallGrade?: string;
  overallBand?: string;
  overallScore?: number;
  summaryNarrative?: string;
  closingVerdict?: string;
  keyStrengths?: string[];
  priorityActions?: string[];
  readinessStatement?: string;
  developmentPoints?: string[];
  domainBreakdown?: ReportDomain[];
  header?: {
    homeName?: string;
    managerName?: string;
    managerRole?: string;
    date?: string;
  };
};

type ResponseRow = {
  domain: string;
  score?: number | null;
  band?: string | null;
  feedback_json?: Record<string, unknown> | null;
};

type NewParams = {
  sessionId: string;
  report: ReportJson;
  responses: ResponseRow[];
  header?: ReportJson["header"];
};

type LegacyParams = {
  report: InspectionReport;
  domains: DomainSummary[];
  homeName: string | null;
  sessionTitle: string | null;
  inspectionSessionId: string;
  actorId: string;
};

function isLegacyParams(params: NewParams | LegacyParams): params is LegacyParams {
  return (params as LegacyParams).inspectionSessionId !== undefined;
}

export function truncateWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function getBandColor(band?: string | null) {
  return BAND_COLORS[band ?? ""] ?? "#64748b";
}

type JsPdfLike = {
  splitTextToSize: (text: string, maxWidth: number) => string[];
  setFont: (font: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (...args: number[] | string[]) => void;
  text: (text: string | string[], x: number, y: number, options?: Record<string, unknown>) => void;
  setDrawColor: (...args: number[]) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  addPage: () => void;
  save: (filename: string) => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
};

function splitLines(doc: JsPdfLike, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export async function exportReportPdf(params: NewParams | LegacyParams) {
  const mod = await import("jspdf").catch(() => null);
  if (!mod || !mod.jsPDF) throw new Error("PDF export not enabled in this build");
  const { jsPDF } = mod;

  type AutoTableFn = (doc: JsPdfLike, options: Record<string, unknown>) => void;
  let autoTable: AutoTableFn | null = null;
  try {
    // Avoid bundler resolution if optional dependency isn't installed
    const loader = new Function("return import('jspdf-autotable')") as () => Promise<{ default: AutoTableFn }>;
    autoTable = (await loader()).default;
  } catch {
    autoTable = null;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
  doc.setFont("helvetica", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 16.5;

  const addHeader = (title: string) => {
    doc.setFontSize(14);
    doc.setTextColor(TEAL);
    doc.text(title, margin, margin);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
  };

  const addParagraph = (text: string, startY: number, maxWidth: number) => {
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    const lines = splitLines(doc, text, maxWidth);
    doc.text(lines, margin, startY, { lineHeightFactor: 1.5 });
    return startY + lines.length * (lineHeight / 2);
  };

  if (isLegacyParams(params)) {
    const overallBand = params.report.overall_band;
    const overallScore = params.report.overall_score;
    const date = new Date(params.report.created_at).toLocaleDateString("en-GB");

    // Cover page
    doc.setFontSize(22);
    doc.setTextColor(TEAL);
    doc.text("InspectReady Practice Report", margin, 40);
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Home: ${params.homeName || "N/A"}`, margin, 55);
    doc.text(`Date: ${date}`, margin, 63);

    doc.setFontSize(16);
    doc.setTextColor(getBandColor(overallBand));
    doc.text(`Overall: ${overallBand}`, margin, 78);
    if (overallScore != null) {
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Score: ${overallScore.toFixed(1)} / 4.0`, margin, 86);
    }

    doc.addPage();
    addHeader("Executive Summary");
    let y = margin + 12;
    y = addParagraph(params.report.strengths || "", y, pageWidth - margin * 2);
    y += 6;
    y = addParagraph(params.report.recommended_actions || "", y, pageWidth - margin * 2);

    doc.addPage();
    addHeader("Domain Breakdown");
    const body = params.domains.map((d) => [d.domain, d.avg_score.toFixed(1), d.band, "-", "-", "-"]);
    if (autoTable) {
      autoTable(doc, {
        startY: margin + 10,
        head: [["Domain", "Score", "Band", "Strengths", "Gaps", "Inspector Note"]],
        body,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2, valign: "top" },
        headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      });
    }

    doc.addPage();
    addHeader("Action Plan");
    y = margin + 12;
    y = addParagraph(params.report.recommended_actions || "", y, pageWidth - margin * 2);

    doc.save(`inspectready-${params.inspectionSessionId}.pdf`);
    return;
  }

  const report = params.report ?? {};
  const header = params.header ?? report.header ?? {};
  const overallBand = report.overallGrade ?? report.overallBand ?? "";
  const overallScore = report.overallScore ?? null;
  const homeName = header.homeName ?? "Children's Home";
  const date = header.date ?? new Date().toLocaleDateString("en-GB");

  // Cover page
  doc.setFontSize(22);
  doc.setTextColor(TEAL);
  doc.text("InspectReady Practice Report", margin, 40);

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Home: ${homeName}`, margin, 55);
  doc.text(`Date: ${date}`, margin, 63);

  doc.setFontSize(16);
  doc.setTextColor(getBandColor(overallBand));
  doc.text(`Overall: ${overallBand}`, margin, 78);
  if (overallScore != null) {
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Score: ${Number(overallScore).toFixed(1)} / 4.0`, margin, 86);
  }

  // Page 2: Executive Summary
  doc.addPage();
  addHeader("Executive Summary");
  let y = margin + 12;
  if (report.summaryNarrative) {
    y = addParagraph(report.summaryNarrative, y, pageWidth - margin * 2);
    y += 6;
  }
  if (report.closingVerdict) {
    y = addParagraph(`Closing verdict: ${report.closingVerdict}`, y, pageWidth - margin * 2);
    y += 6;
  }
  if (report.readinessStatement) {
    y = addParagraph(report.readinessStatement, y, pageWidth - margin * 2);
    y += 6;
  }

  const strengths = report.keyStrengths ?? [];
  const actions = report.priorityActions ?? [];
  if (strengths.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text("Key Strengths", margin, y);
    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    strengths.forEach((s) => {
      y = addParagraph(`• ${s}`, y, pageWidth - margin * 2);
    });
    y += 4;
  }
  if (actions.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11);
    doc.text("Priority Actions", margin, y);
    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    actions.forEach((a) => {
      y = addParagraph(`• ${a}`, y, pageWidth - margin * 2);
    });
  }

  // Domain table
  doc.addPage();
  addHeader("Domain Breakdown");

  const responsesByDomain = new Map<string, ResponseRow>();
  params.responses.forEach((r) => responsesByDomain.set(r.domain, r));

  const rows: Array<[string, string, string, string, string, string]> = [];
  DOMAIN_ORDER.forEach((domainKey) => {
    const res = responsesByDomain.get(domainKey);
    if (!res) return;
    const domainLabel = DOMAIN_LABELS[domainKey] ?? domainKey;
    const score = res.score != null ? String(res.score) : "-";
    const band = res.band ?? "-";

    const breakdown = report.domainBreakdown?.find((d) => d.qsName === domainLabel || d.domain === Number(domainKey));
    const strengthsText = (breakdown?.strengths ?? (res.feedback_json?.strengths as string[]) ?? []).join("; ");
    const gapsText = (res.feedback_json?.gaps as string[])?.join("; ") ?? (breakdown?.actions ?? []).join("; ");
    const noteRaw = breakdown?.inspectorNote ?? (res.feedback_json?.inspectorNote as string) ?? "";
    const note = noteRaw ? truncateWords(noteRaw, 200) : "";

    rows.push([domainLabel, score, band, strengthsText, gapsText, note]);
  });

  if (autoTable) {
    autoTable(doc, {
      startY: margin + 10,
      head: [["Domain", "Score", "Band", "Strengths", "Gaps", "Inspector Note"]],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2, valign: "top", lineColor: [220, 220, 220] },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 12 },
        2: { cellWidth: 22 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 60 },
      },
    });
  } else {
    let tableY = margin + 10;
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    rows.forEach((row) => {
      const line = row.join(" | ");
      const lines = splitLines(doc, line, pageWidth - margin * 2);
      if (tableY + lines.length * 5 > pageHeight - margin) {
        doc.addPage();
        addHeader("Domain Breakdown (cont.)");
        tableY = margin + 10;
      }
      doc.text(lines, margin, tableY);
      tableY += lines.length * 5 + 2;
    });
  }

  // Final page: Action plan
  doc.addPage();
  addHeader("Action Plan");
  y = margin + 12;
  const devPoints = report.developmentPoints ?? report.priorityActions ?? [];
  if (devPoints.length === 0) {
    y = addParagraph("No action points recorded.", y, pageWidth - margin * 2);
  } else {
    devPoints.forEach((p, i) => {
      y = addParagraph(`${i + 1}. ${p}`, y, pageWidth - margin * 2);
    });
  }

  y += 6;
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136);
  doc.text("Next Steps", margin, y);
  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  if (report.readinessStatement) {
    addParagraph(report.readinessStatement, y, pageWidth - margin * 2);
  } else if (report.closingVerdict) {
    addParagraph(report.closingVerdict, y, pageWidth - margin * 2);
  } else {
    addParagraph("Subscribe for unlimited sessions and continue building inspection readiness.", y, pageWidth - margin * 2);
  }

  doc.save(`inspectready-${params.sessionId}.pdf`);
}
