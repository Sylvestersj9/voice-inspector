import { describe, expect, it } from "vitest";
import { buildDashboardModel } from "@/lib/dashboardModel";

describe("buildDashboardModel", () => {
  const questions = [
    { id: "q1", domain: "Leadership" },
    { id: "q2", domain: "Safeguarding" },
  ];

  it("computes averages and domains", () => {
    const model = buildDashboardModel({
      questions,
      evaluations: [
        { inspection_session_question_id: "q1", score: 80, strengths: ["A"], gaps: ["G1"] },
        { inspection_session_question_id: "q2", score: 60, strengths: ["B"], gaps: ["G2"] },
      ],
      sessionCreatedAt: new Date().toISOString(),
    });

    expect(model.averageScore).toBeCloseTo(70);
    expect(model.strongestDomain).toBe("Leadership");
    expect(model.weakestDomain).toBe("Safeguarding");
    expect(model.domainStats.length).toBe(2);
    expect(model.strengthThemes).toEqual(["A", "B"]);
    expect(model.improvementActions).toContain("Focus on G1");
  });

  it("fills fallbacks when no evals", () => {
    const model = buildDashboardModel({
      questions,
      evaluations: [],
      sessionCreatedAt: new Date().toISOString(),
    });
    expect(model.averageScore).toBe(0);
    expect(model.domainStats.length).toBe(0);
  });
});
