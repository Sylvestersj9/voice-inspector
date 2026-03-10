// ── SCCIF QS Readiness Quiz — client-side scoring & PDF export ────────────────

export const QS_DOMAINS = [
  { id: "QS1", label: "Quality and Purpose of Care",         short: "Quality & Purpose",        limiting: false },
  { id: "QS2", label: "Children's Views, Wishes & Feelings", short: "Children's Views",          limiting: false },
  { id: "QS3", label: "Education",                           short: "Education",                 limiting: false },
  { id: "QS4", label: "Enjoyment and Achievement",           short: "Enjoyment & Achievement",   limiting: false },
  { id: "QS5", label: "Health and Wellbeing",                short: "Health & Wellbeing",        limiting: false },
  { id: "QS6", label: "Positive Relationships",              short: "Positive Relationships",    limiting: false },
  { id: "QS7", label: "Protection of Children",              short: "Protection of Children",    limiting: true  },
  { id: "QS8", label: "Leadership and Management",           short: "Leadership & Management",   limiting: false },
  { id: "QS9", label: "Care Planning",                       short: "Care Planning",             limiting: false },
] as const;

export const CHECKLIST_COLS = [
  "Documentation complete",
  "Audited this quarter",
  "Staff trained",
] as const;

/** domainId → [docComplete, auditedQ, staffTrained] */
export type CheckState = Record<string, [boolean, boolean, boolean]>;

export type GapItem = {
  domainId:    string;
  domainLabel: string;
  col:         string;
  action:      string;
};

export type DomainScore = {
  id:      string;
  label:   string;
  short:   string;
  checked: number;   // 0-3
  pct:     number;   // 0-100
  limiting: boolean;
};

export type QuizResult = {
  pct:          number;   // 0-100
  checked:      number;
  total:        number;
  band:         "green" | "amber" | "red";
  bandLabel:    string;
  gaps:         GapItem[];
  domainScores: DomainScore[];
};

export function computeScore(state: CheckState): QuizResult {
  const total   = QS_DOMAINS.length * CHECKLIST_COLS.length; // 27
  let   checked = 0;
  const gaps:         GapItem[]     = [];
  const domainScores: DomainScore[] = [];

  for (const d of QS_DOMAINS) {
    const vals   = state[d.id] ?? [false, false, false];
    const dCount = vals.filter(Boolean).length;
    checked += dCount;

    domainScores.push({
      id:      d.id,
      label:   d.label,
      short:   d.short,
      checked: dCount,
      pct:     Math.round((dCount / CHECKLIST_COLS.length) * 100),
      limiting: d.limiting,
    });

    CHECKLIST_COLS.forEach((col, i) => {
      if (!vals[i]) {
        gaps.push({
          domainId:    d.id,
          domainLabel: d.label,
          col,
          action: `${d.id} — ${d.label}: ${col.toLowerCase()} not confirmed`,
        });
      }
    });
  }

  const pct = Math.round((checked / total) * 100);
  const band = pct > 80 ? "green" : pct >= 60 ? "amber" : "red";
  const bandLabel =
    pct > 80  ? "Good — Inspection Ready"      :
    pct >= 60 ? "Developing — Address Gaps"    :
                "At Risk — Act Now";

  return { pct, checked, total, band, bandLabel, gaps, domainScores };
}

// ── Static gap advice (used when no Gemini key) ───────────────────────────────

export function buildStaticGapReport(result: QuizResult): string {
  if (result.gaps.length === 0) {
    return "All 27 checks complete. Your home shows strong readiness across all Quality Standards. Maintain this through regular review cycles and consider scheduling a full mock inspection session.";
  }
  const lines: string[] = [
    `Overall readiness: ${result.pct}% — ${result.bandLabel}`,
    `${result.checked}/${result.total} checks confirmed across 9 Quality Standards.`,
    "",
    "Priority gaps to address:",
  ];
  for (const gap of result.gaps) {
    lines.push(`• ${gap.action}`);
  }
  lines.push("");
  lines.push("Recommendation: Address QS7 (Protection of Children) gaps first — this is the limiting judgement. Inadequate here overrides all other grades.");
  lines.push("");
  lines.push("Next step: Run a full InspectReady simulator session to practise answering in each gap area.");
  return lines.join("\n");
}

// ── PDF export (pure jsPDF, no html2canvas) ───────────────────────────────────

const TEAL    = "#0D9488";
const RED     = "#dc2626";
const AMBER   = "#d97706";
const GREEN   = "#16a34a";
const DARK    = "#0f172a";
const MUTED   = "#475569";
const BORDER  = "#e2e8f0";

function bandHex(band: "green" | "amber" | "red"): string {
  return band === "green" ? GREEN : band === "amber" ? AMBER : RED;
}

function domainBarColor(pct: number): string {
  return pct === 100 ? GREEN : pct >= 67 ? AMBER : RED;
}

export async function exportQuizPdf(
  result:   QuizResult,
  homeName?: string,
  aiReport?: string,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc  = new jsPDF({ format: "a4" });
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Cover header ──
  doc.setFillColor(TEAL);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("InspectReady — SCCIF Readiness Report", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${date}${homeName ? `  ·  ${homeName}` : ""}`, 14, 23);

  let y = 40;

  // ── Overall score ──
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(bandHex(result.band));
  doc.text(`${result.pct}%`, 14, y);
  doc.setFontSize(13);
  doc.setTextColor(DARK);
  doc.text(result.bandLabel, 38, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED);
  doc.text(`${result.checked} of ${result.total} evidence checks confirmed across all 9 Quality Standards`, 14, y);
  y += 10;

  doc.setDrawColor(BORDER);
  doc.line(14, y, 196, y);
  y += 8;

  // ── Domain overview ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK);
  doc.text("Domain Readiness Overview", 14, y);
  y += 7;

  const BAR_X = 110;
  const BAR_W = 60;

  for (const ds of result.domainScores) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setFont("helvetica", ds.limiting ? "bold" : "normal");
    doc.setTextColor(ds.limiting ? RED : DARK);
    const label = `${ds.id}  ${ds.short}${ds.limiting ? " (LIMITING)" : ""}`;
    doc.text(label, 14, y);

    // Bar background
    doc.setFillColor(BORDER);
    doc.roundedRect(BAR_X, y - 4, BAR_W, 5, 1, 1, "F");
    // Bar fill
    const filled = Math.round((ds.checked / 3) * BAR_W);
    if (filled > 0) {
      doc.setFillColor(domainBarColor(ds.pct));
      doc.roundedRect(BAR_X, y - 4, filled, 5, 1, 1, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK);
    doc.text(`${ds.checked}/3`, 176, y);
    y += 7;
  }

  y += 4;
  doc.setDrawColor(BORDER);
  doc.line(14, y, 196, y);
  y += 8;

  // ── Gaps list ──
  if (result.gaps.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GREEN);
    doc.text("All checks confirmed — no gaps identified.", 14, y);
    y += 10;
  } else {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK);
    doc.text(`Priority Gaps (${result.gaps.length} of 27 checks outstanding)`, 14, y);
    y += 7;

    for (const gap of result.gaps) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const isLimiting = gap.domainId === "QS7";
      doc.setFillColor(isLimiting ? RED : AMBER);
      doc.circle(17, y - 1.5, 1.2, "F");
      doc.setTextColor(isLimiting ? RED : DARK);
      doc.text(gap.action, 20, y);
      y += 6;
    }
  }

  // ── AI analysis (if present) ──
  if (aiReport) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 4;
    doc.setDrawColor(BORDER);
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK);
    doc.text("AI Gap Analysis", 14, y);
    y += 7;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    const lines = doc.splitTextToSize(aiReport, 178);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 5;
    }
  }

  // ── Footer CTA ──
  if (y > 262) { doc.addPage(); y = 20; }
  y += 6;
  doc.setFillColor(TEAL);
  doc.roundedRect(14, y, 182, 22, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#ffffff");
  doc.text("Ready to practise answering your gaps out loud?", 105, y + 8, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("inspectready.co.uk  —  AI simulator · 3-day free trial · no card required", 105, y + 16, { align: "center" });

  doc.save("inspectready-sccif-readiness-report.pdf");
}

// ── Prep calendar PDF ─────────────────────────────────────────────────────────

const CALENDAR_DOMAIN_ROTATION = [
  { qs: "QS7", label: "Protection of Children (Limiting)",    goal: "Walk through missing from care protocol and CSE indicators" },
  { qs: "QS8", label: "Leadership & Management",              goal: "Evidence Reg 44/45 quality improvement loop with specific examples" },
  { qs: "QS1", label: "Quality and Purpose of Care",          goal: "Align statement of purpose to current young people's needs" },
  { qs: "QS9", label: "Care Planning",                        goal: "Demonstrate co-production and responsive review processes" },
  { qs: "QS2", label: "Children's Views, Wishes & Feelings",  goal: "Give a concrete example of young person influence on decisions" },
  { qs: "QS5", label: "Health and Wellbeing",                 goal: "Describe GP registration, CAMHS escalation, medication management" },
  { qs: "QS7", label: "Protection of Children (Limiting)",    goal: "Repeat — QS7 needs monthly practice as limiting judgement" },
  { qs: "QS3", label: "Education",                            goal: "Explain PEP quality, VSH relationship, and provision during gaps" },
  { qs: "QS4", label: "Enjoyment and Achievement",            goal: "Describe individualised activity provision and risk management" },
  { qs: "QS6", label: "Positive Relationships",               goal: "Evidence keyworker impact, family contact management" },
  { qs: "QS8", label: "Leadership & Management",              goal: "Quality assurance beyond supervision — observation and log review" },
  { qs: "QS1", label: "Full mock inspection (all domains)",   goal: "Run a complete 6-question simulator session — target Outstanding" },
];

export async function exportCalendarPdf(startDate: Date, homeName?: string): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc  = new jsPDF({ format: "a4" });
  const date = startDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  doc.setFillColor(TEAL);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("InspectReady — 12-Week Prep Calendar", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Starting: ${date}${homeName ? `  ·  ${homeName}` : ""}`, 14, 23);

  let y = 40;

  // Table header
  doc.setFillColor("#f1f5f9");
  doc.rect(14, y - 5, 182, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK);
  doc.text("Week", 15, y);
  doc.text("Dates", 32, y);
  doc.text("Domain Focus", 72, y);
  doc.text("Session Goal", 130, y);
  y += 6;
  doc.setDrawColor(BORDER);
  doc.line(14, y, 196, y);

  for (let i = 0; i < 12; i++) {
    if (y > 268) { doc.addPage(); y = 20; }
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd   = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);

    const wStart = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const wEnd   = weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const row    = CALENDAR_DOMAIN_ROTATION[i];

    const isQS7 = row.qs === "QS7";
    doc.setFontSize(8);
    doc.setFont("helvetica", isQS7 ? "bold" : "normal");
    doc.setTextColor(isQS7 ? RED : DARK);
    doc.text(`Wk ${i + 1}`, 15, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(`${wStart}–${wEnd}`, 32, y + 4);
    doc.setTextColor(isQS7 ? RED : DARK);
    doc.setFont("helvetica", isQS7 ? "bold" : "normal");
    const focusLines = doc.splitTextToSize(row.label, 52);
    doc.text(focusLines, 72, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    const goalLines = doc.splitTextToSize(row.goal, 60);
    doc.text(goalLines, 130, y + 2);

    const rowH = Math.max(focusLines.length, goalLines.length) * 4.5 + 4;
    y += rowH;
    doc.setDrawColor(BORDER);
    doc.line(14, y, 196, y);
  }

  y += 10;
  doc.setFillColor(TEAL);
  doc.roundedRect(14, y, 182, 22, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#ffffff");
  doc.text("Run each week's session at inspectready.co.uk", 105, y + 9, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("3-day free trial · no card required · voice or text responses", 105, y + 17, { align: "center" });

  doc.save("inspectready-12-week-prep-calendar.pdf");
}

// ── Audit checklist PDF ───────────────────────────────────────────────────────

export const AUDIT_ITEMS: { domain: string; short: string; items: string[]; limiting?: boolean }[] = [
  {
    domain: "QS1 — Quality and Purpose of Care", short: "QS1",
    items: [
      "Statement of purpose reviewed in last 12 months",
      "SOP reflects current young people's needs and home ethos",
      "Staff briefed on SOP contents and expectations",
      "Young people consulted on home values and atmosphere",
      "Monthly monitoring report completed and filed",
    ],
  },
  {
    domain: "QS2 — Children's Views, Wishes & Feelings", short: "QS2",
    items: [
      "House meeting minutes recorded with young people's contributions",
      "Complaints log maintained and reviewed by RI",
      "Advocacy service information displayed and explained to young people",
      "Young people know how to contact Ofsted directly",
      "Evidence of a decision changed by young person's feedback (last 6 months)",
    ],
  },
  {
    domain: "QS3 — Education", short: "QS3",
    items: [
      "All young people have an active school place or alternative provision",
      "PEPs completed and reviewed within required timescales",
      "Working relationship with virtual school head documented",
      "Process in place for day-one education gap on emergency placements",
      "Educational achievements celebrated and recorded in care files",
    ],
  },
  {
    domain: "QS4 — Enjoyment and Achievement", short: "QS4",
    items: [
      "Individual activity plans documented per young person",
      "At least one meaningful activity arranged per young person this month",
      "Risk assessments in place for activities",
      "Young people involved in their own risk assessments",
      "Achievements (academic and non-academic) recorded in care files",
    ],
  },
  {
    domain: "QS5 — Health and Wellbeing", short: "QS5",
    items: [
      "All young people registered with GP and dentist",
      "Health assessments completed within timescales for all placements",
      "Medication management records accurate and countersigned",
      "CAMHS referrals chased and escalation pathway documented",
      "Healthy lifestyle support recorded in care plans",
    ],
  },
  {
    domain: "QS6 — Positive Relationships", short: "QS6",
    items: [
      "Keyworker allocations current and reviewed",
      "Family contact arrangements reviewed and recorded in care plans",
      "Risk assessments in place for family contact where safeguarding concerns exist",
      "Evidence of relationship-based practice in daily logs",
      "Staff continuity plan documented for high-risk transitions",
    ],
  },
  {
    domain: "QS7 — Protection of Children (LIMITING JUDGEMENT)", short: "QS7",
    limiting: true,
    items: [
      "Missing from care protocol documented, current, and staff-trained",
      "Return home interview process understood by all staff",
      "Exploitation risk indicators training completed (CSE, criminal, online)",
      "Safeguarding referral pathway clear — MASH contacts accessible to all shifts",
      "Partial disclosure protocol documented and practised",
      "Shift handover includes live safeguarding risk information",
    ],
  },
  {
    domain: "QS8 — Leadership and Management", short: "QS8",
    items: [
      "Regulation 44 visits completed on schedule with independent visitor",
      "Regulation 45 report filed with documented improvement actions",
      "All staff have had supervision within required timescale",
      "Quality assurance beyond supervision (log audits, practice observation) recorded",
      "Staffing model reviewed against current young people's needs",
    ],
  },
  {
    domain: "QS9 — Care Planning", short: "QS9",
    items: [
      "All care plans current and reviewed within required timescales",
      "Young people involved in care plan reviews (evidenced)",
      "Unplanned review process in place for significant changes in needs",
      "Transition planning underway for young people approaching 18",
      "Placing authority informed promptly of care plan updates",
    ],
  },
];

export async function exportAuditPdf(
  checked: Record<string, boolean[]>,
  homeName?: string,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc  = new jsPDF({ format: "a4" });
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  doc.setFillColor(TEAL);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("InspectReady — SCCIF Pre-Inspection Audit Checklist", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${date}${homeName ? `  ·  ${homeName}` : ""}  ·  Print and complete or use as self-audit`, 14, 23);

  let y = 38;

  for (const section of AUDIT_ITEMS) {
    if (y > 250) { doc.addPage(); y = 20; }

    // Section header
    const bgColor = section.limiting ? "#fef2f2" : "#f0fdfa";
    const textColor = section.limiting ? RED : TEAL;
    doc.setFillColor(bgColor);
    doc.roundedRect(14, y - 4, 182, 9, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text(section.domain, 17, y + 1.5);
    if (section.limiting) {
      doc.setFontSize(7);
      doc.text("LIMITING JUDGEMENT", 172, y + 1.5, { align: "right" });
    }
    y += 10;

    for (let i = 0; i < section.items.length; i++) {
      if (y > 275) { doc.addPage(); y = 20; }
      const isChecked = checked[section.short]?.[i] ?? false;

      // Checkbox square
      doc.setDrawColor("#94a3b8");
      doc.setFillColor(isChecked ? TEAL : "#ffffff");
      doc.roundedRect(17, y - 3.5, 4.5, 4.5, 0.5, 0.5, isChecked ? "FD" : "D");
      if (isChecked) {
        doc.setTextColor("#ffffff");
        doc.setFontSize(6);
        doc.text("✓", 18.5, y);
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(DARK);
      doc.text(section.items[i], 24, y);
      y += 6.5;
    }
    y += 3;
  }

  y += 4;
  if (y > 262) { doc.addPage(); y = 20; }
  doc.setFillColor(TEAL);
  doc.roundedRect(14, y, 182, 22, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#ffffff");
  doc.text("Practise your answers to every item above", 105, y + 9, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("inspectready.co.uk  —  AI simulator · 3-day free trial · no card required", 105, y + 17, { align: "center" });

  doc.save("inspectready-sccif-audit-checklist.pdf");
}
