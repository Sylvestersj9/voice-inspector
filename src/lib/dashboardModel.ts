import { scoreToBand } from "@/lib/scoreToBand";

export type DashboardInput = {
  questions: { id: string; domain: string }[];
  evaluations: {
    inspection_session_question_id: string;
    score: number | null;
    strengths: string[];
    gaps: string[];
  }[];
  sessionCreatedAt: string;
};

export type DashboardModel = {
  totalQuestions: number;
  evaluatedCount: number;
  averageScore: number;
  band: string;
  strongestDomain: string;
  weakestDomain: string;
  domainStats: { domain: string; scores: number[]; average: number; strengths: number; gaps: number }[];
  strengthThemes: string[];
  improvementActions: string[];
  sessionCreatedAt: string;
};

const dedupe = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));

export function buildDashboardModel({ questions, evaluations, sessionCreatedAt }: DashboardInput): DashboardModel {
  const qMap = new Map(questions.map((q) => [q.id, q.domain || "General"]));

  const domainStatMap = new Map<string, { domain: string; scores: number[]; strengths: number; gaps: number; average: number }>();
  const strengthThemes: string[] = [];
  const gapThemes: string[] = [];

  evaluations.forEach((ev) => {
    const domain = qMap.get(ev.inspection_session_question_id) || "General";
    if (!domainStatMap.has(domain)) {
      domainStatMap.set(domain, { domain, scores: [], strengths: 0, gaps: 0, average: 0 });
    }
    const entry = domainStatMap.get(domain)!;
    if (typeof ev.score === "number" && Number.isFinite(ev.score)) {
      entry.scores.push(ev.score);
    }
    entry.strengths += ev.strengths.length;
    entry.gaps += ev.gaps.length;
    strengthThemes.push(...ev.strengths);
    gapThemes.push(...ev.gaps);
  });

  const domainStats = Array.from(domainStatMap.values()).map((d) => {
    const avg = d.scores.length ? d.scores.reduce((s, v) => s + v, 0) / d.scores.length : 0;
    return { ...d, average: Math.round(avg * 10) / 10 };
  });

  const scores = evaluations
    .map((e) => (typeof e.score === "number" && Number.isFinite(e.score) ? e.score : null))
    .filter((s): s is number => s !== null);
  const avgScore = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const avgRounded = Math.round(avgScore * 10) / 10;

  const strongest = domainStats.reduce(
    (best, cur) => (cur.average > best.score ? { domain: cur.domain, score: cur.average } : best),
    { domain: "—", score: -Infinity },
  );
  const weakest = domainStats.reduce(
    (worst, cur) => (cur.average < worst.score ? { domain: cur.domain, score: cur.average } : worst),
    { domain: "—", score: Infinity },
  );

  const strengthThemesTop = dedupe(strengthThemes).slice(0, 3);
  const improvementActions = dedupe(gapThemes)
    .map((g) => `Focus on ${g}`)
    .slice(0, 3);

  return {
    totalQuestions: questions.length,
    evaluatedCount: evaluations.length,
    averageScore: avgRounded,
    band: scoreToBand(avgRounded || 0),
    strongestDomain: strongest.score === -Infinity ? "—" : strongest.domain,
    weakestDomain: weakest.score === Infinity ? "—" : weakest.domain,
    domainStats,
    strengthThemes: strengthThemesTop,
    improvementActions,
    sessionCreatedAt,
  };
}
