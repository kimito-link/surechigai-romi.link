/**
 * RevenueCat webhook の純粋ロジックを固定する。
 *
 * 権利の書き込み経路はここだけなので、取り違えると
 * 「払っていない人がプレミアムになる」「払った人が無料に落ちる」が直接起きる。
 * 特に CANCELLATION を expire に倒すと、解約したその瞬間に
 * 支払い済み期間を取り上げてしまう（返金・低評価の直行便）ので必ず区別する。
 */
import { describe, expect, it } from "vitest";
import { effectForEvent, parseAppUserId, toDate } from "@/api/revenuecat-webhook";

describe("effectForEvent", () => {
  it("購入・更新・解約取消・プラン変更は有効化", () => {
    for (const t of ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"]) {
      expect(effectForEvent(t)).toBe("activate");
    }
  });

  it("解約は「更新しない」だけ。期間満了までは有効なので expire にしない", () => {
    expect(effectForEvent("CANCELLATION")).toBe("stop-renewal");
  });

  it("期限切れ・一時停止は expire", () => {
    expect(effectForEvent("EXPIRATION")).toBe("expire");
    expect(effectForEvent("SUBSCRIPTION_PAUSED")).toBe("expire");
  });

  it("返金は revoke", () => {
    expect(effectForEvent("REFUND")).toBe("revoke");
  });

  it("TEST や未知イベントは権利を動かさない", () => {
    expect(effectForEvent("TEST")).toBeNull();
    expect(effectForEvent("TRANSFER")).toBeNull();
    expect(effectForEvent("SOMETHING_NEW")).toBeNull();
    expect(effectForEvent("")).toBeNull();
  });
});

describe("parseAppUserId", () => {
  it("user_123 を 123 として読む", () => {
    expect(parseAppUserId("user_123")).toBe(123);
  });

  it("匿名IDや不正な形は null（＝権利を書かない）", () => {
    for (const v of [
      "$RCAnonymousID:abc123",
      "user_",
      "user_abc",
      "user_-1",
      "user_1.5",
      "123",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(parseAppUserId(v)).toBeNull();
    }
  });
});

describe("toDate", () => {
  it("ミリ秒エポックを Date にする", () => {
    const d = toDate(1_800_000_000_000);
    expect(d).toBeInstanceOf(Date);
    expect(d?.getTime()).toBe(1_800_000_000_000);
  });

  it("数値でなければ null", () => {
    for (const v of ["1800000000000", null, undefined, NaN, Infinity, {}]) {
      expect(toDate(v)).toBeNull();
    }
  });
});
