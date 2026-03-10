import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "test@example.com" } }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { name: "Jo", role: "Registered Manager", home_name: "Elm View" } }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { status: "trialing", stripe_subscription_id: null, created_at: new Date().toISOString() },
      }),
    })),
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "tok" } } }),
    },
    functions: { invoke: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock("@/components/ConfettiBurst", () => ({ default: () => null }));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { computeTrialUsage, TRIAL_DAILY_LIMIT, TRIAL_TOTAL_LIMIT } from "@/lib/trial";

function makeTrialInfo(usedToday: number, usedTotal: number) {
  const trialStart = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
  const fakeSessions = Array.from({ length: usedTotal }, (_, i) => ({
    started_at:
      i < usedToday
        ? new Date().toISOString() // today
        : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
  }));
  return computeTrialUsage(trialStart, fakeSessions);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("computeTrialUsage", () => {
  it("counts today vs total correctly", () => {
    const info = makeTrialInfo(3, 7);
    expect(info.usedToday).toBe(3);
    expect(info.usedTotal).toBe(7);
    expect(info.remainingToday).toBe(TRIAL_DAILY_LIMIT - 3);
    expect(info.remainingTotal).toBe(TRIAL_TOTAL_LIMIT - 7);
    expect(info.expired).toBe(false);
  });

  it("marks expired when past trial end date", () => {
    const oldStart = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
    const info = computeTrialUsage(oldStart, []);
    expect(info.expired).toBe(true);
    expect(info.remainingToday).toBe(0);
    expect(info.remainingTotal).toBe(0);
  });

  it("clamps remainingToday to 0 when limit reached", () => {
    const info = makeTrialInfo(5, 5);
    expect(info.remainingToday).toBe(0);
  });
});

describe("formatDomainMix (inline tests)", () => {
  // Test the formatting logic independently
  const DOMAIN_LABELS: Record<string, string> = {
    ProtectionChildren: "Protection of Children",
    LeadershipManagement: "Leadership and Management",
  };

  function formatDomainMix(responses: Array<{ domain: string }>): string {
    const uniqueDomains = [...new Set(responses.map((r) => r.domain))];
    if (uniqueDomains.length === 0) return "—";
    const primary = uniqueDomains.includes("ProtectionChildren")
      ? "Safeguarding"
      : uniqueDomains.includes("LeadershipManagement")
        ? "Leadership"
        : DOMAIN_LABELS[uniqueDomains[0]] ?? uniqueDomains[0];
    const primaryDomain = uniqueDomains.includes("ProtectionChildren")
      ? "ProtectionChildren"
      : uniqueDomains.includes("LeadershipManagement")
        ? "LeadershipManagement"
        : uniqueDomains[0];
    const othersCount = uniqueDomains.filter((d) => d !== primaryDomain).length;
    if (othersCount === 0) return primary;
    return `${primary} + ${othersCount} other${othersCount !== 1 ? "s" : ""}`;
  }

  it('shows "Safeguarding + N others" when ProtectionChildren present', () => {
    const result = formatDomainMix([
      { domain: "ProtectionChildren" },
      { domain: "LeadershipManagement" },
      { domain: "Education" },
      { domain: "HealthWellbeing" },
      { domain: "CarePlanning" },
    ]);
    expect(result).toBe("Safeguarding + 4 others");
  });

  it('shows "—" for empty responses', () => {
    expect(formatDomainMix([])).toBe("—");
  });

  it("singular 'other' when only 1 extra domain", () => {
    const result = formatDomainMix([
      { domain: "ProtectionChildren" },
      { domain: "Education" },
    ]);
    expect(result).toBe("Safeguarding + 1 other");
  });
});
