import { describe, expect, it, vi, afterEach } from "vitest";

/**
 * syncClerkAuthFromBearerToken は api/auth/sync.ts (Vercel Functions) と
 * server/_core/index.ts (Express dev) の共通ロジック
 * (refactor-instructions.md Debt #10)。以前はExpress版にだけ
 * enrichTwitterProfile呼び出しが欠落していた。ここでは@clerk/backendの実呼び出し
 * に到達しない入力バリデーションの挙動のみを固定する。
 */
describe("syncClerkAuthFromBearerToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Authorizationヘッダがなければ401 No token", async () => {
    const { syncClerkAuthFromBearerToken } = await import(
      "../clerk-auth-sync.js"
    );
    const result = await syncClerkAuthFromBearerToken(undefined);
    expect(result).toEqual({
      ok: false,
      status: 401,
      body: { error: "No token" },
    });
  });

  it("Bearer形式でなければ401 No token", async () => {
    const { syncClerkAuthFromBearerToken } = await import(
      "../clerk-auth-sync.js"
    );
    const result = await syncClerkAuthFromBearerToken("Basic abc123");
    expect(result).toEqual({
      ok: false,
      status: 401,
      body: { error: "No token" },
    });
  });

  it("CLERK_SECRET_KEY未設定なら500 Clerk not configured", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    const { syncClerkAuthFromBearerToken } = await import(
      "../clerk-auth-sync.js"
    );
    const result = await syncClerkAuthFromBearerToken("Bearer sometoken");
    expect(result).toEqual({
      ok: false,
      status: 500,
      body: { error: "Clerk not configured" },
    });
  });
});
