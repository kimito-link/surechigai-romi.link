import { describe, expect, it, vi } from "vitest";
import { resolveCheckinErrorMessage } from "@/components/checkin/resolve-checkin-error-message";

/**
 * checkin-authenticated-screen.tsx から抽出した純粋関数(refactor-instructions.md
 * Debt #11)。抽出前の挙動をここで固定する。
 */
describe("resolveCheckinErrorMessage", () => {
  it("Errorインスタンスはtoユーザーフレンドリーな文言に変換する", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = resolveCheckinErrorMessage(
      new Error("足あとを保存できませんでした。もう一度送ってください"),
      "fallback",
    );
    expect(result.message).toContain("足あと");
    expect(result.retryAfterSec).toBeUndefined();
    vi.restoreAllMocks();
  });

  it("429エラーはretryAfterSecを伝播する", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = Object.assign(new Error("err"), {
      data: { code: "TOO_MANY_REQUESTS", httpStatus: 429, retryAfter: 12 },
    });
    const result = resolveCheckinErrorMessage(err, "fallback");
    expect(result.retryAfterSec).toBe(12);
    vi.restoreAllMocks();
  });

  it("Errorインスタンスでない場合はfallback文言をそのまま返す", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = resolveCheckinErrorMessage("plain string error", "fallback");
    expect(result).toEqual({ message: "fallback" });
    vi.restoreAllMocks();
  });

  it("Errorインスタンスでない場合はretryAfterSecを持たない", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = resolveCheckinErrorMessage(null, "fallback");
    expect(result.retryAfterSec).toBeUndefined();
    vi.restoreAllMocks();
  });
});
