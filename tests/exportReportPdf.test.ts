import { describe, expect, test } from "vitest";
import { truncateWords } from "@/reports/exportReportPdf";

function makeWords(count: number) {
  return Array.from({ length: count }, (_, i) => `word${i + 1}`).join(" ");
}

describe("truncateWords", () => {
  test("does not truncate when under limit", () => {
    const text = makeWords(50);
    expect(truncateWords(text, 200)).toBe(text);
  });

  test("truncates and adds ellipsis when over limit", () => {
    const text = makeWords(210);
    const out = truncateWords(text, 200);
    const words = out.replace(/\.\.\.$/, "").split(/\s+/).filter(Boolean);
    expect(words.length).toBe(200);
    expect(out.endsWith("...")).toBe(true);
  });
});
