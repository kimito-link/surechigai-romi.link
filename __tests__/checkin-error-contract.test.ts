/**
 * チェックイン失敗系の契約テスト(P0-1/P1-1/P1-3 回帰防止)
 *
 * 1. toUserFriendlyError が checkIn の失敗文言を UNKNOWN_ERROR に落とさない
 * 2. 「保存の確定」は saved === true のみ(肯定形判定)。saved 欠落の旧「無言成功」形は失敗扱い
 */
import { describe, it, expect } from "vitest";
import { toUserFriendlyError } from "../shared/error-messages";

describe("toUserFriendlyError: checkIn失敗系の文言がUNKNOWNに落ちない", () => {
  it("「足あとを保存できませんでした」は文言そのまま・再試行可", () => {
    const r = toUserFriendlyError(
      new Error("足あとを保存できませんでした。もう一度送ってください"),
    );
    expect(r.code).not.toBe("UNKNOWN_ERROR");
    expect(r.message).toContain("足あと");
    expect(r.canRetry).toBe(true);
  });

  it("一時停止中(PRECONDITION_FAILED相当の文言)は文言そのまま", () => {
    const r = toUserFriendlyError(
      new Error(
        "位置記録は一時停止中です。マイページで「灯を消す」を解除してからお試しください",
      ),
    );
    expect(r.code).not.toBe("UNKNOWN_ERROR");
    expect(r.message).toContain("一時停止");
  });

  it("Database not available は DATABASE_NOT_AVAILABLE(再試行可)", () => {
    const r = toUserFriendlyError(new Error("Database not available"));
    expect(r.code).toBe("DATABASE_NOT_AVAILABLE");
    expect(r.canRetry).toBe(true);
  });

  it("tRPCの429形(data.httpStatus)は待機メッセージ", () => {
    const r = toUserFriendlyError({
      message: "err",
      data: { code: "TOO_MANY_REQUESTS", httpStatus: 429 },
    });
    expect(r.message).toContain("リクエストが多すぎます");
    expect(r.canRetry).toBe(true);
  });
});

describe("checkIn結果の肯定形判定(クライアント契約)", () => {
  // checkin-authenticated-screen.tsx の判定式と同じ述語
  const isSaved = (result: { saved?: boolean }) => result.saved === true;

  it("saved:true のみ成功", () => {
    expect(isSaved({ saved: true })).toBe(true);
  });
  it("saved:false は失敗", () => {
    expect(isSaved({ saved: false })).toBe(false);
  });
  it("saved欠落(旧・無言成功形)も失敗扱い", () => {
    expect(isSaved({})).toBe(false);
  });
});
