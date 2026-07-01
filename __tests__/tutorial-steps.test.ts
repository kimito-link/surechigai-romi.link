import { describe, expect, it } from "vitest";
import { SURECHIGAI_TUTORIAL_STEPS } from "@/lib/tutorial/surechigai-steps";
import { TUTORIAL_SEEN_STORAGE_KEY } from "@/lib/tutorial/constants";

describe("surechigai tutorial steps", () => {
  it("uses v2 seen key", () => {
    expect(TUTORIAL_SEEN_STORAGE_KEY).toBe("tutorial_seen_v2");
  });

  it("has 4 post-login steps", () => {
    expect(SURECHIGAI_TUTORIAL_STEPS).toHaveLength(4);
    expect(SURECHIGAI_TUTORIAL_STEPS.map((s) => s.previewType)).toEqual([
      "checkin",
      "envelope",
      "map",
      "trail",
    ]);
  });

  it("avoids legacy challenge copy", () => {
    const blob = JSON.stringify(SURECHIGAI_TUTORIAL_STEPS);
    expect(blob).not.toContain("チャレンジ");
    expect(blob).not.toContain("参加表明");
  });
});
