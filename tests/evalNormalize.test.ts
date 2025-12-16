import { describe, expect, it } from "vitest";
import { normalizeEvaluationArrays } from "@/lib/evalNormalize";

describe("normalizeEvaluationArrays", () => {
  it("fills defaults when arrays are missing", () => {
    const result = normalizeEvaluationArrays({});
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.follow_up_questions.length).toBeGreaterThan(0);
  });

  it("trims and cleans values", () => {
    const result = normalizeEvaluationArrays({
      strengths: ["  A ", "", null],
      gaps: [" gap "],
      follow_up_questions: [" q1 ", " "],
    });
    expect(result.strengths).toEqual(["A"]);
    expect(result.gaps).toEqual(["gap"]);
    expect(result.follow_up_questions).toEqual(["q1"]);
  });
});
