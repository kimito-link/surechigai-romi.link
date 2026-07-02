import { describe, expect, it } from "vitest";
import { ONBOARDING_SLIDES, ONBOARDING_STORAGE_KEY } from "@/features/onboarding/constants";

describe("onboarding slides", () => {
  it("uses v7 storage key for compressed rollout", () => {
    expect(ONBOARDING_STORAGE_KEY).toBe("@onboarding_completed_v7");
  });

  it("opens with yukkuri rinku on hero", () => {
    expect(ONBOARDING_SLIDES[0]?.characterType).toBe("rinku");
    expect(ONBOARDING_SLIDES[0]?.id).toBe("hero");
  });

  it("has compressed value-first slides", () => {
    expect(ONBOARDING_SLIDES).toHaveLength(3);
    expect(ONBOARDING_SLIDES[0]?.id).toBe("hero");
    expect(ONBOARDING_SLIDES[1]?.id).toBe("checkin");
    expect(ONBOARDING_SLIDES.some((s) => s.id === "events")).toBe(false);
    expect(ONBOARDING_SLIDES.some((s) => s.id === "navigate")).toBe(false);
    expect(ONBOARDING_SLIDES.some((s) => s.id === "install")).toBe(false);
    expect(ONBOARDING_SLIDES.at(-1)?.id).toBe("start");
  });

  it("does not use deprecated brand character type", () => {
    const types = ONBOARDING_SLIDES.map((s) => s.characterType);
    expect(types).not.toContain("brand");
  });

  it("leads with core product copy", () => {
    expect(ONBOARDING_SLIDES[0]?.chip).toContain("現在地");
    expect(ONBOARDING_SLIDES[1]?.chip).toBe("チェックイン");
    expect(ONBOARDING_SLIDES.every((s) => s.accent === "signal")).toBe(true);
  });

  it("avoids doin-challenge legacy terms", () => {
    const blob = JSON.stringify(ONBOARDING_SLIDES);
    expect(blob).not.toContain("チャレンジ");
    expect(blob).not.toContain("同行者");
  });
});
