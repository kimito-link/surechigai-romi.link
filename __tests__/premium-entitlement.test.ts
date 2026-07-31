import { describe, it, expect } from "vitest";
import {
  isPremiumActive,
  resolveStatusFromWebhookEvent,
  buildRcAppUserId,
  parseRcAppUserId,
} from "@/modules/encounter/core/premium-entitlement";

const NOW = new Date("2026-07-31T12:00:00Z");
const future = new Date("2026-08-31T12:00:00Z");
const past = new Date("2026-07-01T12:00:00Z");

describe("isPremiumActive — フェイルクローズであること", () => {
  it("行が無ければ無料（null/undefined）", () => {
    expect(isPremiumActive(null, NOW)).toBe(false);
    expect(isPremiumActive(undefined, NOW)).toBe(false);
  });

  it("status が active 以外なら無料", () => {
    expect(
      isPremiumActive({ status: "expired", currentPeriodEnd: future }, NOW),
    ).toBe(false);
    expect(
      isPremiumActive({ status: "revoked", currentPeriodEnd: future }, NOW),
    ).toBe(false);
    expect(
      isPremiumActive({ status: null, currentPeriodEnd: future }, NOW),
    ).toBe(false);
  });

  it("期限切れなら無料", () => {
    expect(
      isPremiumActive({ status: "active", currentPeriodEnd: past }, NOW),
    ).toBe(false);
  });

  it("期限が無い・壊れていれば無料", () => {
    expect(isPremiumActive({ status: "active", currentPeriodEnd: null }, NOW)).toBe(
      false,
    );
    expect(
      isPremiumActive({ status: "active", currentPeriodEnd: "not-a-date" }, NOW),
    ).toBe(false);
  });

  it("有効なのは active かつ期限が未来のときだけ", () => {
    expect(
      isPremiumActive({ status: "active", currentPeriodEnd: future }, NOW),
    ).toBe(true);
  });

  it("ISO文字列でも判定できる（APIレスポンス経由）", () => {
    expect(
      isPremiumActive(
        { status: "active", currentPeriodEnd: future.toISOString() },
        NOW,
      ),
    ).toBe(true);
  });

  it("解約予約中(willRenew=false)でも期間内なら有効", () => {
    // willRenew は判定に使わない。currentPeriodEnd だけが有効期限の真実
    expect(
      isPremiumActive({ status: "active", currentPeriodEnd: future }, NOW),
    ).toBe(true);
  });
});

describe("resolveStatusFromWebhookEvent", () => {
  it("購入・更新・解約取消は有効化する", () => {
    for (const e of ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]) {
      expect(resolveStatusFromWebhookEvent(e)).toEqual({
        status: "active",
        willRenew: true,
      });
    }
  });

  it("解約は willRenew だけ倒し、status は active のまま（期間内は使える）", () => {
    expect(resolveStatusFromWebhookEvent("CANCELLATION")).toEqual({
      status: "active",
      willRenew: false,
    });
  });

  it("失効は expired", () => {
    expect(resolveStatusFromWebhookEvent("EXPIRATION")?.status).toBe("expired");
  });

  it("返金は revoked", () => {
    expect(resolveStatusFromWebhookEvent("REFUND")?.status).toBe("revoked");
  });

  it("未知のイベントは null（勝手に有効化しない）", () => {
    expect(resolveStatusFromWebhookEvent("SOMETHING_NEW")).toBeNull();
    expect(resolveStatusFromWebhookEvent("")).toBeNull();
  });
});

describe("rcAppUserId", () => {
  it("往復できる", () => {
    expect(parseRcAppUserId(buildRcAppUserId(42))).toBe(42);
  });

  it("Clerk の ID 形式ではなく自前の users.id を使う", () => {
    expect(buildRcAppUserId(7)).toBe("user_7");
  });

  it("想定外の形式は null（他人の権利を書き換えさせない）", () => {
    expect(parseRcAppUserId("clerk:abc")).toBeNull();
    expect(parseRcAppUserId("user_")).toBeNull();
    expect(parseRcAppUserId("user_-1")).toBeNull();
    expect(parseRcAppUserId("user_0")).toBeNull();
    expect(parseRcAppUserId("")).toBeNull();
  });
});
