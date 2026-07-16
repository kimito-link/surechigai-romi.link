import { describe, expect, it, vi, afterEach } from "vitest";
import { hasAdminSession } from "../server/_core/context";

/**
 * admin_session は署名なしの固定文字列Cookie(refactor-instructions.md Debt #9)。
 * 本番では偽造によるprotectedProcedure通過を防ぐため常にfalseを返す必要がある。
 * この境界を安全網テストとして固定する。
 */
describe("hasAdminSession", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function makeReq(cookieHeader?: string) {
    return { headers: { cookie: cookieHeader } } as any;
  }

  it("本番(NODE_ENV=production)では正しいCookieを持っていてもfalseを返す", () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = makeReq("admin_session=authenticated");
    expect(hasAdminSession(req)).toBe(false);
  });

  it("開発環境では正しいCookieがあればtrueを返す", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = makeReq("admin_session=authenticated");
    expect(hasAdminSession(req)).toBe(true);
  });

  it("開発環境でも値が異なればfalseを返す", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = makeReq("admin_session=forged");
    expect(hasAdminSession(req)).toBe(false);
  });

  it("Cookieヘッダがなければfalseを返す", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = makeReq(undefined);
    expect(hasAdminSession(req)).toBe(false);
  });
});
