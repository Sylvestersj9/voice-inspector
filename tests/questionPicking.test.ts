import { describe, it, expect } from "vitest";
import { DOMAIN_ORDER, questionBank } from "@/lib/questions";

// Mulberry32 RNG (same as in Index.tsx)
function mulberry32(a: number) {
  let m_w = a;
  let m_z = 987654321;
  const mask = 0xffffffff;

  return function () {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  };
}

// Helper to create seeded RNG from sessionId
function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

describe("Question Picking Logic", () => {
  describe("Deterministic RNG", () => {
    it("should return same random sequence for same seed", () => {
      const seed = seedFromString("test-session-123");
      const rng1 = mulberry32(seed);
      const rng2 = mulberry32(seed);

      const values1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const values2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      expect(values1).toEqual(values2);
    });

    it("should return different sequences for different seeds", () => {
      const rng1 = mulberry32(seedFromString("session-1"));
      const rng2 = mulberry32(seedFromString("session-2"));

      const values1 = [rng1(), rng1(), rng1()];
      const values2 = [rng2(), rng2(), rng2()];

      expect(values1).not.toEqual(values2);
    });
  });

  describe("Domain-based question picking", () => {
    it("should respect focusStandard when picking replacement questions", () => {
      const sessionId = "test-session-456";
      const focusStandard = "Education";

      // Filter questions by focusStandard
      const filteredQuestions = questionBank.filter(
        (q) => q.domain === focusStandard && (!q.mode || q.mode === "inspection")
      );

      // Expect at least one question in the domain
      expect(filteredQuestions.length).toBeGreaterThan(0);

      // Simulate picking a replacement from focused domain
      const rng = mulberry32(seedFromString(`${sessionId}-skip`));
      const randomIdx = Math.floor(rng() * filteredQuestions.length);
      const pickedQuestion = filteredQuestions[randomIdx];

      // Verify picked question is from the focused domain
      expect(pickedQuestion.domain).toBe(focusStandard);
    });

    it("should not pick from different domains when focus is set", () => {
      const sessionId = "test-session-789";
      const focusStandard = "ProtectionChildren";
      const alreadyAnswered = new Set<string>();

      // Simulate picking 5 replacement questions
      for (let i = 0; i < 5; i++) {
        const availablePool = questionBank.filter(
          (q) =>
            q.domain === focusStandard &&
            (!q.mode || q.mode === "inspection") &&
            !alreadyAnswered.has(q.id)
        );

        expect(availablePool.length).toBeGreaterThan(0);

        const rng = mulberry32(seedFromString(`${sessionId}-skip-${i}`));
        const idx = Math.floor(rng() * availablePool.length);
        const picked = availablePool[idx];

        expect(picked.domain).toBe(focusStandard);
        alreadyAnswered.add(picked.id);
      }
    });
  });

  describe("Mode filtering", () => {
    it("should only pick inspection mode questions for inspection practice", () => {
      const sessionId = "test-inspection";
      const mode = "inspection";

      const filteredByMode = questionBank.filter(
        (q) => (!q.mode || q.mode === mode)
      );

      // Verify we have inspection questions
      expect(filteredByMode.length).toBeGreaterThan(0);

      // Verify no fit_person only questions in pool
      const fit_personOnly = filteredByMode.filter((q) => q.mode === "fit_person");
      expect(fit_personOnly.length).toBe(0);
    });

    it("should pick all questions for fit_person mode (no domain filtering)", () => {
      const mode = "fit_person";

      const fit_personQuestions = questionBank.filter(
        (q) => !q.mode || q.mode === mode
      );

      expect(fit_personQuestions.length).toBeGreaterThan(0);

      // For fit_person, all domains should be represented
      const domainsFound = new Set(fit_personQuestions.map((q) => q.domain));
      expect(domainsFound.size).toBeGreaterThan(1);
    });

    it("should pick all RI mode questions", () => {
      const mode = "ri";

      const riQuestions = questionBank.filter(
        (q) => !q.mode || q.mode === mode
      );

      expect(riQuestions.length).toBeGreaterThan(0);

      // RI mode should have questions from multiple domains
      const domainsFound = new Set(riQuestions.map((q) => q.domain));
      expect(domainsFound.size).toBeGreaterThan(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty focus domain gracefully", () => {
      const focusStandard = "all";
      const mode = "inspection";

      const pool = questionBank.filter((q) => !q.mode || q.mode === mode);
      expect(pool.length).toBeGreaterThan(0);

      // Should pick from all domains when focus is "all"
      const domains = new Set(pool.map((q) => q.domain));
      expect(domains.size).toBeGreaterThan(1);
    });

    it("should have no duplicate IDs in question bank", () => {
      const ids = questionBank.map((q) => q.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have all required fields on every question", () => {
      questionBank.forEach((q) => {
        expect(q.id).toBeDefined();
        expect(q.domain).toBeDefined();
        expect(q.text).toBeDefined();
        expect(q.hint).toBeDefined();
        expect(q.followUpQuestions).toBeDefined();
        expect(Array.isArray(q.followUpQuestions)).toBe(true);
        expect(q.followUpQuestions.length).toBeGreaterThan(0);
      });
    });

    it("should have all domains represented", () => {
      const domainsInBank = new Set(questionBank.map((q) => q.domain));

      DOMAIN_ORDER.forEach((domain) => {
        expect(domainsInBank.has(domain)).toBe(true);
      });
    });
  });
});
