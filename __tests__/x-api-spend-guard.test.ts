/**
 * X API 支出ガードのテスト（server/x-api-spend-guard.ts）。
 *
 * 背景: Pay-Per-Use は返却オブジェクト数で課金され、2026-11-22 から expansions の
 * includes も通常単価で課金される。従来の推定は「1リクエスト $0.01」固定で、
 * following 一覧（最大1000 user）を 1/1000 に過小評価していた。
 */
import { describe, expect, it } from "vitest";
import {
  createXProfileLookupGuard,
  estimateXApiCallCostUsd,
  readXApiPricing,
  readXProfileLookupGuardOptions,
} from "../server/x-api-spend-guard";

const pricing = { userReadUsd: 0.01, postReadUsd: 0.005 };

describe("estimateXApiCallCostUsd", () => {
  it("単一ユーザー取得は user 1件", () => {
    const e = estimateXApiCallCostUsd("/2/users/by/username/foo", { data: { id: "1" } }, pricing);
    expect(e).toEqual({ userObjects: 1, postObjects: 0, costUsd: 0.01 });
  });

  it("following 一覧は件数ぶん課金される（リクエスト1回でも）", () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }));
    const e = estimateXApiCallCostUsd("/2/users/123/following", { data }, pricing);
    expect(e.userObjects).toBe(1000);
    expect(e.costUsd).toBe(10);
  });

  it("expansions の includes.users / includes.tweets も数える", () => {
    const e = estimateXApiCallCostUsd(
      "/2/users/by/username/foo",
      { data: { id: "1" }, includes: { tweets: [{ id: "t1" }], users: [{ id: "2" }] } },
      pricing,
    );
    expect(e).toEqual({ userObjects: 2, postObjects: 1, costUsd: 0.025 });
  });

  it("tweets 系は post 単価", () => {
    const e = estimateXApiCallCostUsd("/2/tweets", { data: [{ id: "a" }, { id: "b" }] }, pricing);
    expect(e).toEqual({ userObjects: 0, postObjects: 2, costUsd: 0.01 });
  });

  it("OAuth トークン系・空レスポンスは0", () => {
    expect(estimateXApiCallCostUsd("/2/oauth2/token", { access_token: "x" }, pricing).costUsd).toBe(0);
    expect(estimateXApiCallCostUsd("/2/users/me", {}, pricing).costUsd).toBe(0);
    expect(estimateXApiCallCostUsd("/2/users/me", null, pricing).costUsd).toBe(0);
  });
});

describe("env 読み取り（未設定なら安全な既定値）", () => {
  it("単価の既定は user $0.010 / post $0.005", () => {
    expect(readXApiPricing({})).toEqual({ userReadUsd: 0.01, postReadUsd: 0.005 });
    expect(readXApiPricing({ X_API_COST_PER_USER_READ_USD: "0.02" }).userReadUsd).toBe(0.02);
    expect(readXApiPricing({ X_API_COST_PER_USER_READ_USD: "abc" }).userReadUsd).toBe(0.01);
  });

  it("ガードの既定は有効・100件/時・6時間クールダウン", () => {
    expect(readXProfileLookupGuardOptions({})).toEqual({
      disabled: false,
      maxPerHour: 100,
      retryCooldownMs: 6 * 60 * 60 * 1000,
    });
    expect(readXProfileLookupGuardOptions({ X_API_ENRICH_DISABLED: "true" }).disabled).toBe(true);
    expect(readXProfileLookupGuardOptions({ X_API_ENRICH_MAX_PER_HOUR: "5" }).maxPerHour).toBe(5);
  });
});

describe("createXProfileLookupGuard", () => {
  function make(overrides: Partial<Parameters<typeof createXProfileLookupGuard>[0]> = {}) {
    let t = 1_000_000;
    const guard = createXProfileLookupGuard({
      disabled: false,
      maxPerHour: 3,
      retryCooldownMs: 60_000,
      now: () => t,
      ...overrides,
    });
    return { guard, advance: (ms: number) => (t += ms) };
  }

  it("同じユーザー名は cooldown 中に取り直さない（大文字小文字を区別しない）", () => {
    const { guard, advance } = make();
    expect(guard.tryAcquire("Foo").allowed).toBe(true);
    expect(guard.tryAcquire("foo")).toEqual({ allowed: false, reason: "cooldown" });
    advance(60_000);
    expect(guard.tryAcquire("foo").allowed).toBe(true);
  });

  it("1時間の上限を超えたら止め、次の窓で再開する", () => {
    const { guard, advance } = make();
    expect(guard.tryAcquire("a").allowed).toBe(true);
    expect(guard.tryAcquire("b").allowed).toBe(true);
    expect(guard.tryAcquire("c").allowed).toBe(true);
    expect(guard.tryAcquire("d")).toEqual({ allowed: false, reason: "hourly_cap" });
    advance(60 * 60 * 1000);
    expect(guard.tryAcquire("d").allowed).toBe(true);
  });

  it("キルスイッチで全停止", () => {
    const { guard } = make({ disabled: true });
    expect(guard.tryAcquire("a")).toEqual({ allowed: false, reason: "disabled" });
  });
});
