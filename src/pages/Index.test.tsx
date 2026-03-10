import { describe, it, expect, beforeEach } from "vitest";
import { clearPaused, loadPaused, progressColor, savePaused } from "@/lib/simulator";

const SID = "session-123";

describe("simulator helpers", () => {
  beforeEach(() => {
    clearPaused(SID);
  });

  it("persists pause state", () => {
    savePaused(SID, true);
    expect(loadPaused(SID)).toBe(true);
    savePaused(SID, false);
    expect(loadPaused(SID)).toBe(false);
  });

  it("maps progress color by average score", () => {
    expect(progressColor(3.2)).toBe("bg-emerald-500");
    expect(progressColor(2.4)).toBe("bg-amber-500");
    expect(progressColor(1.4)).toBe("bg-red-500");
  });
});
