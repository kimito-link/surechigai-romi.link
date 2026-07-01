import { describe, expect, it } from "vitest";
import { ONBOARDING_SLIDES, ONBOARDING_STORAGE_KEY } from "@/features/onboarding/constants";

describe("onboarding slides", () => {
  it("uses v4 storage key for fresh rollout", () => {
    expect(ONBOARDING_STORAGE_KEY).toBe("@onboarding_completed_v4");
  });

  it("opens with favicon brand character on hero", () => {
    expect(ONBOARDING_SLIDES[0]?.characterType).toBe("brand");
    expect(ONBOARDING_SLIDES[0]?.showLogo).toBe(false);
  });

  it("has 5 value-first slides ending with start", () => {
    expect(ONBOARDING_SLIDES).toHaveLength(5);
    expect(ONBOARDING_SLIDES[0]?.id).toBe("hero");
    expect(ONBOARDING_SLIDES[1]?.id).toBe("live-map");
    expect(ONBOARDING_SLIDES.at(-1)?.id).toBe("start");
  });

  it("leads with core product copy", () => {
    expect(ONBOARDING_SLIDES[0]?.chip).toContain("現在地");
    expect(ONBOARDING_SLIDES[1]?.chip).toBe("みんなの現在地");
  });

  it("avoids doin-challenge legacy terms", () => {
    const blob = JSON.stringify(ONBOARDING_SLIDES);
    expect(blob).not.toContain("チャレンジ");
    expect(blob).not.toContain("同行者");
  });
});
