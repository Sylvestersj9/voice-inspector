import { EvaluationResult, JudgementBand, BankQuestion, Domain, questionBank } from "@/lib/questions";

type ConfidenceBand = "borderline" | "secure" | "strong";

const BAND_SCORE: Record<JudgementBand, number> = {
  Outstanding: 4,
  Good: 3,
  "Requires improvement to be good": 2,
  "Requires Improvement": 2,
  Inadequate: 1,
};

const domains: Domain[] = [
  "Safeguarding",
  "Leadership",
  "CarePlanning",
  "StaffPractice",
  "Outcomes",
  "RiskMissingExploitation",
];

const hashSeed = (seed: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: string) => {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T>(arr: T[], rng: () => number) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const groupBankByDomain = (): Record<Domain, BankQuestion[]> => {
  const grouped: Record<Domain, BankQuestion[]> = {
    Safeguarding: [],
    Leadership: [],
    CarePlanning: [],
    StaffPractice: [],
    Outcomes: [],
    RiskMissingExploitation: [],
  };
  for (const q of questionBank) {
    grouped[q.domain]?.push(q);
  }
  return grouped;
};

export const generateSessionQuestions = (
  sessionId: string,
  desiredCount: 5 | 6 | 7 = 6,
): BankQuestion[] => {
  const rng = mulberry32(sessionId || "default");
  const grouped = groupBankByDomain();

  // pick one per domain
  const selections: BankQuestion[] = [];
  for (const domain of domains) {
    const pool = shuffle(grouped[domain], rng);
    if (pool.length) selections.push(pool[0]);
  }

  // adjust for 5 or 7
  if (desiredCount === 5) {
    const dropIndex = Math.floor(rng() * selections.length);
    selections.splice(dropIndex, 1);
  } else if (desiredCount === 7) {
    const domainOrder = shuffle(domains, rng);
    let added = 0;
    for (const domain of domainOrder) {
      if (added >= 2) break;
      const pool = shuffle(grouped[domain], rng).filter(
        (q) => !selections.find((s) => s.id === q.id),
      );
      if (pool.length) {
        selections.push(pool[0]);
        added += 1;
      }
    }
  }

  return shuffle(selections, rng);
};

export interface SessionAreaResult {
  area: string;
  band: JudgementBand;
  score4: number;
  confidence?: ConfidenceBand;
}

export function calcSessionBand(scores: number[] = []) {
  if (!scores.length) return { session_band: "Requires improvement to be good" as JudgementBand, session_score4: 0 };
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const session_band =
    avg >= 3.6 ? "Outstanding" :
    avg >= 2.8 ? "Good" :
    avg >= 2.0 ? "Requires improvement to be good" :
    "Inadequate";
  return { session_band: session_band as JudgementBand, session_score4: Math.round(avg * 10) / 10 };
}

export function calcTrajectory(scores: number[] = []) {
  if (scores.length < 3) return "insufficient data";
  const diff = scores[scores.length - 1] - scores[0];
  if (diff >= 1) return "improving";
  if (diff <= -1) return "declining";
  return "stable";
}

export function calcReadinessScore(areas: SessionAreaResult[] = []) {
  if (!areas.length) return 0;
  let total = 0;
  let weight = 0;
  for (const a of areas) {
    const base = (BAND_SCORE[a.band] ?? 0) * 25;
    const confidenceBonus =
      a.confidence === "strong" ? 5 :
      a.confidence === "borderline" ? -5 : 0;
    const lower = a.area.toLowerCase();
    const safeguarding = lower.includes("safeguard") ? 1.3 : lower.includes("lead") ? 1.1 : 1.0;
    total += (base + confidenceBonus) * safeguarding;
    weight += safeguarding;
  }
  // readiness adjustment: safeguarding deficits hurt more
  const hasSafeguardRI = areas.some((a) => a.area.toLowerCase().includes("safeguard") && BAND_SCORE[a.band] === 2);
  const hasSafeguardInad = areas.some((a) => a.area.toLowerCase().includes("safeguard") && BAND_SCORE[a.band] === 1);
  let score = weight ? Math.round(total / weight) : 0;
  if (hasSafeguardInad) score = Math.max(0, score - 10);
  else if (hasSafeguardRI) score = Math.max(0, score - 5);
  return Math.min(100, Math.max(0, score));
}

export function calcPriorityAreas(areas: SessionAreaResult[] = [], topN = 2) {
  const grouped = new Map<string, number[]>();
  areas.forEach((a) => {
    const key = a.area;
    const arr = grouped.get(key) || [];
    arr.push(a.score4);
    grouped.set(key, arr);
  });
  const averages = Array.from(grouped.entries()).map(([area, vals]) => ({
    area,
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }));
  averages.sort((a, b) => a.avg - b.avg);
  return averages.slice(0, topN).map((a) => a.area);
}

export function buildOfstedConclusionTemplate(sessionBand: JudgementBand, priorityAreas: string[], trajectory: string) {
  const priorities = priorityAreas.length ? priorityAreas.join(", ") : "key areas";
  const trajectoryText = trajectory === "improving" ? "improving trajectory" : trajectory === "declining" ? "declining trajectory" : "stable trajectory";
  return `Based on the evidence across this rehearsal, Ofsted would likely judge overall ${sessionBand}, with particular attention on ${priorities} and a ${trajectoryText}. Focus on evidencing impact and consistency to strengthen the outcome.`;
}

// Inline examples:
// calcSessionBand([4,3,3]) => { session_band: "Good", session_score4: 3.3 }
// calcTrajectory([2,3,3]) => "improving"
// calcReadinessScore([{area:"Safeguarding", band:"Good", score4:3, confidence:"secure"}]) => ~75
