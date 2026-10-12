import { describe, expect, it } from "vitest";
import { hasSignedInUatCookie } from "../apps/web/lib/session-hint";

const c = (name: string, value: string) => ({ name, value });

describe("hasSignedInUatCookie", () => {
  it("__client_uat が 0 以外ならログイン済みヒント", () => {
    expect(hasSignedInUatCookie([c("__client_uat", "1700000000")])).toBe(true);
  });

  it("0 はゲスト", () => {
    expect(hasSignedInUatCookie([c("__client_uat", "0")])).toBe(false);
  });

  it("cookie が無い・空はゲスト", () => {
    expect(hasSignedInUatCookie([])).toBe(false);
    expect(hasSignedInUatCookie([c("__client_uat", "")])).toBe(false);
  });

  it("接尾辞付きが先に 0 でも、無印が 0 以外ならログイン済み（2026-09-29 実損）", () => {
    expect(
      hasSignedInUatCookie([c("__client_uat_abc", "0"), c("__client_uat", "1700000000")]),
    ).toBe(true);
  });

  it("接尾辞付きだけが 0 以外でもログイン済み", () => {
    expect(hasSignedInUatCookie([c("__client_uat_abc", "1700000000")])).toBe(true);
  });

  it("無関係な cookie は見ない（名前が似ていても）", () => {
    expect(hasSignedInUatCookie([c("x__client_uat", "1"), c("session", "1")])).toBe(false);
  });
});
