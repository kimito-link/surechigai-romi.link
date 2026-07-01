import { describe, it, expect } from "vitest";
import {
  hasAmbiguousShareSlugChars,
  randomShareSlug,
  SHARE_SLUG_CHARS,
} from "@/lib/share-slug";

describe("share-slug", () => {
  it("生成文字に I/l/1/0/O を含まない", () => {
    for (let i = 0; i < 50; i++) {
      const slug = randomShareSlug();
      expect(slug).toHaveLength(12);
      expect(hasAmbiguousShareSlugChars(slug)).toBe(false);
      for (const ch of slug) {
        expect(SHARE_SLUG_CHARS.includes(ch)).toBe(true);
      }
    }
  });

  it("旧スラッグの紛らわしい文字を検出", () => {
    expect(hasAmbiguousShareSlugChars("18n8McIuq4Ou")).toBe(true);
    expect(hasAmbiguousShareSlugChars("abcDefGhJkmn")).toBe(false);
  });
});
