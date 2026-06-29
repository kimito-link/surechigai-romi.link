import { describe, it, expect } from "vitest";
import {
  isValidTwitterUsername,
  normalizeTwitterUsername,
  isValidShareSlug,
} from "../lib/twitter-username.js";

describe("twitter username validation", () => {
  it("streamerfunch は有効", () => {
    expect(isValidTwitterUsername("streamerfunch")).toBe(true);
    expect(normalizeTwitterUsername("@streamerfunch")).toBe("streamerfunch");
  });

  it("表示名は username として拒否する", () => {
    expect(isValidTwitterUsername("君斗りんく@クリエイター応援")).toBe(false);
    expect(normalizeTwitterUsername("君斗りんく@クリエイター応援")).toBeNull();
  });

  it("空・記号のみは拒否", () => {
    expect(normalizeTwitterUsername(null)).toBeNull();
    expect(normalizeTwitterUsername("")).toBeNull();
    expect(normalizeTwitterUsername("user/name")).toBeNull();
  });
});

describe("share slug validation", () => {
  it("base62 12文字は有効", () => {
    expect(isValidShareSlug("aBc123XyZ456")).toBe(true);
  });

  it("17文字以上は無効", () => {
    expect(isValidShareSlug("a".repeat(17))).toBe(false);
  });
});
