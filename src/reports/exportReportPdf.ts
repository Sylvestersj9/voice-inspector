import type { InspectionReport, ReportBand } from "./types";
import { DOMAIN_LABELS, DOMAIN_ORDER } from "@/lib/questions";

// RGB colors
const TEAL_RGB = [13, 148, 136];
const GRAY_RGB = [40, 40, 40];
const LIGHT_GRAY_RGB = [120, 120, 120];
const BAND_COLORS: Record<string, number[]> = {
  Outstanding: [34, 197, 94],
  Good: [245, 158, 11],
  "Requires Improvement": [249, 115, 22],
  Inadequate: [239, 68, 68],
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

function getBandColor(band?: string | null): number[] {
  return BAND_COLORS[band ?? ""] ?? [100, 116, 139];
}

type JsPdfLike = {
  splitTextToSize: (text: string, maxWidth: number) => string[];
  setFont: (font: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (...args: number[] | string[]) => void;
  text: (text: string | string[], x: number, y: number, options?: Record<string, unknown>) => void;
  setDrawColor: (...args: number[]) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  addPage: () => void;
  save: (filename: string) => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
};

function splitLines(doc: JsPdfLike, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function addPageHeader(doc: JsPdfLike, pageNum: number, pageWidth: number) {
  // Logo/Brand header on every page
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_RGB);
  doc.text("MockOfsted", 20, 12);

  // Page number
  doc.setFontSize(8);
  doc.setTextColor(...LIGHT_GRAY_RGB);
  doc.text(`Page ${pageNum}`, pageWidth - 25, 12);

  // Thin line separator
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 15, pageWidth - 20, 15);
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
  const contentTop = 20; // Content starts below header
  const contentBottom = pageHeight - 15; // Bottom margin
  let currentPage = 1;

  const addHeader = (title: string, y: number) => {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL_RGB);
    doc.text(title, margin, y);
    doc.setFont("helvetica", "normal");
  };

  const addParagraph = (text: string, startY: number, maxWidth: number) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_RGB);
    const lines = splitLines(doc, text, maxWidth);
    doc.text(lines, margin, startY, { lineHeightFactor: 1.4 });
    return startY + lines.length * 4.8;
  };

  const checkPageBreak = (currentY: number, neededSpace: number = 20): { y: number; page: number } => {
    if (currentY + neededSpace > contentBottom) {
      doc.addPage();
      addPageHeader(doc, ++currentPage, pageWidth);
      return { y: contentTop, page: currentPage };
    }
    return { y: currentY, page: currentPage };
  };

  if (isLegacyParams(params)) {
    const overallBand = params.report.overall_band;
    const overallScore = params.report.overall_score;
    const date = new Date(params.report.created_at).toLocaleDateString("en-GB");

    // Page 1: Cover
    addPageHeader(doc, 1, pageWidth);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL_RGB);
    doc.text("Practice Report", margin, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...GRAY_RGB);
    let y = 55;
    y = addParagraph(`Home: ${params.homeName || "N/A"}`, y, pageWidth - margin * 2) + 3;
    y = addParagraph(`Date: ${date}`, y, pageWidth - margin * 2) + 6;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...getBandColor(overallBand));
    doc.text(`Overall: ${overallBand}`, margin, y);
    y += 8;

    if (overallScore != null) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...GRAY_RGB);
      doc.text(`Score: ${overallScore.toFixed(1)} / 4.0`, margin, y);
      y += 10;
    }

    // Executive Summary on same page
    let pageBreak = checkPageBreak(y, 30);
    y = pageBreak.y;
    addHeader("Summary", margin + (pageBreak.page > 1 ? 10 : 0));
    y += 6;
    y = addParagraph(params.report.strengths || "", y, pageWidth - margin * 2) + 3;
    y = addParagraph(params.report.recommended_actions || "", y, pageWidth - margin * 2) + 3;

    // Domain Table
    pageBreak = checkPageBreak(y, 40);
    y = pageBreak.y;
    if (pageBreak.page > currentPage) {
      addHeader("Domains", margin + 10);
      y += 6;
    } else {
      addHeader("Domains", margin);
      y += 6;
    }

    const body = params.domains.map((d) => [d.domain, d.avg_score.toFixed(1), d.band]);
    if (autoTable && pageBreak.page === currentPage) {
      autoTable(doc, {
        startY: y,
        head: [["Domain", "Score", "Band"]],
        body,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2, valign: "top" },
        headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      });
    }

    doc.save(`mockofsted-${params.inspectionSessionId}.pdf`);
    return;
  }

  // New params section - streamlined layout
  const report = params.report ?? {};
  const header = params.header ?? report.header ?? {};
  const overallBand = report.overallGrade ?? report.overallBand ?? "";
  const overallScore = report.overallScore ?? null;
  const homeName = header.homeName ?? "Children's Home";
  const date = header.date ?? new Date().toLocaleDateString("en-GB");

  // Page 1: Cover + Summary
  addPageHeader(doc, 1, pageWidth);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_RGB);
  doc.text("Practice Report", margin, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY_RGB);
  let y = 55;
  y = addParagraph(`Home: ${homeName}`, y, pageWidth - margin * 2) + 3;
  y = addParagraph(`Date: ${date}`, y, pageWidth - margin * 2) + 6;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...getBandColor(overallBand));
  doc.text(`Overall: ${overallBand}`, margin, y);
  y += 8;

  if (overallScore != null) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...GRAY_RGB);
    doc.text(`Score: ${Number(overallScore).toFixed(1)} / 4.0`, margin, y);
    y += 12;
  }

  // Executive Summary
  let pageBreak = checkPageBreak(y, 30);
  y = pageBreak.y;
  if (pageBreak.page > currentPage) {
    addHeader("Executive Summary", margin + 10);
  } else {
    addHeader("Executive Summary", margin);
  }
  y += 5;

  if (report.summaryNarrative) {
    y = addParagraph(report.summaryNarrative, y, pageWidth - margin * 2) + 2;
  }
  if (report.closingVerdict) {
    y = addParagraph(`Verdict: ${report.closingVerdict}`, y, pageWidth - margin * 2) + 2;
  }
  if (report.readinessStatement) {
    y = addParagraph(report.readinessStatement, y, pageWidth - margin * 2) + 2;
  }

  const strengths = report.keyStrengths ?? [];
  const actions = report.priorityActions ?? [];

  if (strengths.length > 0) {
    pageBreak = checkPageBreak(y, 18);
    y = pageBreak.y;
    if (pageBreak.page > currentPage) {
      addHeader("Strengths", margin + 10);
    } else {
      addHeader("Strengths", margin);
    }
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_RGB);
    strengths.slice(0, 3).forEach((s) => {
      y = addParagraph(`• ${truncateWords(s, 20)}`, y, pageWidth - margin * 2) + 1;
    });
  }

  if (actions.length > 0) {
    pageBreak = checkPageBreak(y, 18);
    y = pageBreak.y;
    if (pageBreak.page > currentPage) {
      addHeader("Actions", margin + 10);
    } else {
      addHeader("Actions", margin);
    }
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_RGB);
    actions.slice(0, 3).forEach((a) => {
      y = addParagraph(`• ${truncateWords(a, 20)}`, y, pageWidth - margin * 2) + 1;
    });
  }

  // Domain Breakdown Table
  const responsesByDomain = new Map<string, ResponseRow>();
  params.responses.forEach((r) => responsesByDomain.set(r.domain, r));

  const rows: Array<[string, string, string]> = [];
  DOMAIN_ORDER.forEach((domainKey) => {
    const res = responsesByDomain.get(domainKey);
    if (!res) return;
    const domainLabel = DOMAIN_LABELS[domainKey] ?? domainKey;
    const score = res.score != null ? String(res.score) : "-";
    const band = res.band ?? "-";
    rows.push([domainLabel, score, band]);
  });

  pageBreak = checkPageBreak(y, 50);
  y = pageBreak.y;
  if (pageBreak.page > currentPage) {
    addHeader("Domain Breakdown", margin + 10);
  } else {
    addHeader("Domain Breakdown", margin);
  }

  if (autoTable) {
    autoTable(doc, {
      startY: y + 4,
      head: [["Domain", "Score", "Band"]],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.5, valign: "middle" },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
      },
    });
  }

  doc.save(`mockofsted-${params.sessionId}.pdf`);
}
