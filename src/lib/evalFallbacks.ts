export const nonEmptyArray = (arr: unknown, fallback: string[]) => {
  if (Array.isArray(arr)) {
    const cleaned = arr.map((v) => (v ?? "").toString().trim()).filter(Boolean);
    if (cleaned.length) return cleaned;
  }
  return fallback;
};

export const nonEmptyString = (val: unknown, fallback: string) => {
  const s = (val ?? "").toString().trim();
  return s.length ? s : fallback;
};

export const buildFallbackStrengths = (answerText: string) => {
  const a = (answerText || "").trim();
  if (!a) {
    return [
      "You stayed on topic and attempted the question.",
      "You referenced day-to-day practice in the home.",
      "You used a professional tone suitable for inspection.",
    ];
  }
  return [
    "You clearly described your intent and approach.",
    "You mentioned how staff support children day-to-day.",
    "Your answer shows a child-focused mindset.",
  ];
};

export const buildFallbackGaps = (answerText: string) => {
  const a = (answerText || "").trim();
  if (!a) {
    return [
      "No answer was captured — ensure recording/transcript is saved before evaluation.",
      "Add a clear process (what you do) and evidence (how you know).",
      "Add impact (what changed for children) and review (how often you check).",
    ];
  }
  return [
    "Add 1–2 concrete examples from recent practice.",
    "Add evidence sources (audits, incident trends, missing logs, supervision sampling).",
    "State impact and review cadence (weekly/monthly; after incidents/complaints).",
  ];
};

export const buildFallbackActions = () => [
  "Use Process → Evidence → Impact → Review for every answer.",
  "Prepare 2 examples per theme (safeguarding, education/health, staffing, QA).",
  "Bring one data point (trend) and one document reference (audit/supervision).",
];

export const buildFollowUpFallback = () => [
  "Can you give a recent, specific example of this in practice?",
  "Who would you escalate this to, and why?",
  "How do you know this approach is effective?",
];

export const buildTightenFallback = () => [
  "Add a specific example.",
  "Name the evidence you would show an inspector.",
  "State the impact for children and how you review it.",
];
