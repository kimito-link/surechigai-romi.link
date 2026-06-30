import { describe, it, expect } from "vitest";
import { isJsBundlePath, buildSwCacheVersion } from "@/lib/pwa/sw-routing";

describe("isJsBundlePath", () => {
  it("Expo web バンドル", () => {
    expect(isJsBundlePath("/_expo/static/js/web/entry-abc.js")).toBe(true);
  });

  it("ルート JS", () => {
    expect(isJsBundlePath("/sw.js")).toBe(true);
  });

  it("HTML/CSS は false", () => {
    expect(isJsBundlePath("/index.html")).toBe(false);
    expect(isJsBundlePath("/global.css")).toBe(false);
  });
});

describe("buildSwCacheVersion", () => {
  it("commitSha から安定したキャッシュ名", () => {
    expect(buildSwCacheVersion("837cddbabc")).toMatch(/^v3-837cddbabc$/);
  });
});
