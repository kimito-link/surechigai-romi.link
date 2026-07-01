import { describe, it, expect } from "vitest";
import { isNightHourJst, HOME_MASK_MIN_NIGHT_VISITS } from "@/modules/encounter/core/home-mask";

describe("home-mask", () => {
  it("JST 夜間帯を判定", () => {
    expect(isNightHourJst(23)).toBe(true);
    expect(isNightHourJst(0)).toBe(true);
    expect(isNightHourJst(5)).toBe(true);
    expect(isNightHourJst(12)).toBe(false);
    expect(isNightHourJst(18)).toBe(false);
  });

  it("最低夜間回数は3以上", () => {
    expect(HOME_MASK_MIN_NIGHT_VISITS).toBeGreaterThanOrEqual(3);
  });
});
