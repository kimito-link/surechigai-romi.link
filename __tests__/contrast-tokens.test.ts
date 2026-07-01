import { describe, expect, it } from "vitest";
import { contrastRatio, meetsWcagAA } from "@/lib/contrast/wcag-ratio";
import { palette } from "@/theme/tokens/palette";

describe("kimito light theme contrast", () => {
  it("textPrimary on kimitoBg meets AA", () => {
    expect(meetsWcagAA(palette.gray900, palette.kimitoBg)).toBe(true);
  });

  it("textMuted on white meets AA", () => {
    expect(meetsWcagAA(palette.gray750, palette.white)).toBe(true);
  });

  it("kimitoInkMuted on kimitoBlueSoft meets AA", () => {
    expect(meetsWcagAA(palette.kimitoInkMuted, palette.kimitoBlueSoft)).toBe(true);
  });

  it("white on kimitoBlue CTA meets AA", () => {
    expect(meetsWcagAA(palette.white, palette.kimitoBlue)).toBe(true);
    expect(contrastRatio(palette.white, palette.kimitoBlue)).toBeGreaterThan(7);
  });

  it("white on twitter blue fails AA (why we avoid it for CTA)", () => {
    expect(meetsWcagAA(palette.white, palette.twitter)).toBe(false);
  });

  it("kimitoOrange accent on kimitoBg meets AA for large text", () => {
    expect(meetsWcagAA(palette.kimitoOrange, palette.kimitoBg, true)).toBe(true);
  });
});
