import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

const { resolveGuestReturnUrl } = await import("@/lib/auth-context");

/**
 * ReturnUrl正規化(/(tabs)/→/置換)は auth-context.tsx / clerk-auth-bridge.tsx に
 * 3実装が散在している(refactor-instructions.md Debt #12)。統合前に現行挙動を
 * 固定し、統合後も同じ入出力になることをここで保証する。
 */
describe("resolveGuestReturnUrl", () => {
  it("未指定・空文字は / を返す", () => {
    expect(resolveGuestReturnUrl(undefined)).toBe("/");
    expect(resolveGuestReturnUrl("")).toBe("/");
  });

  it("/(tabs)/ プレフィックスを / に置換する", () => {
    expect(resolveGuestReturnUrl("/(tabs)/checkin")).toBe("/checkin");
    expect(resolveGuestReturnUrl("/(tabs)/")).toBe("/");
  });

  it("先頭スラッシュがなければ付与する", () => {
    expect(resolveGuestReturnUrl("checkin")).toBe("/checkin");
  });

  it("すでに / で始まる通常パスはそのまま返す", () => {
    expect(resolveGuestReturnUrl("/map")).toBe("/map");
  });
});
