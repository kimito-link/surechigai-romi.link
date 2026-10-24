/**
 * ペイウォールの表示ロジック（lib/premium-paywall.ts）と成長フラグの既定値を固定する。
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));

const { PREMIUM_FEATURES } = await import("@/lib/premium-features");
const { orderPremiumFeatureKeys, paywallContextLine, parsePaywallSource } = await import(
  "@/lib/premium-paywall"
);
const { isPremiumExportEntryEnabled, isShareEncounterCopyEnabled } = await import(
  "@/lib/growth-flags"
);

describe("parsePaywallSource", () => {
  it("既知の機能キーだけ受け付ける", () => {
    expect(parsePaywallSource("export")).toBe("export");
    expect(parsePaywallSource(["adFree"])).toBe("adFree");
  });

  it("未知の値・空は null（任意文字列を画面に出さない）", () => {
    expect(parsePaywallSource("<script>")).toBeNull();
    expect(parsePaywallSource(undefined)).toBeNull();
    expect(parsePaywallSource(123)).toBeNull();
  });
});

describe("paywallContextLine", () => {
  it("提供中の機能はプレミアムで使える旨を1行で示す", () => {
    expect(paywallContextLine("export", PREMIUM_FEATURES)).toBe(
      "「足あとの書き出し」はプレミアムでご利用いただけます。",
    );
  });

  it("準備中の機能は準備中と明示する（誤認させない）", () => {
    expect(paywallContextLine("markerCustom", PREMIUM_FEATURES)).toContain("準備中");
  });

  it("from が無ければ何も出さない（従来どおり）", () => {
    expect(paywallContextLine(null, PREMIUM_FEATURES)).toBeNull();
  });
});

describe("orderPremiumFeatureKeys", () => {
  it("いま使える機能を先に並べ、定義順は保つ", () => {
    expect(orderPremiumFeatureKeys(PREMIUM_FEATURES)).toEqual([
      "adFree",
      "export",
      "advancedStats",
      "markerCustom",
    ]);
  });
});

describe("growth flags は既定 OFF（従来の挙動）", () => {
  const keys = ["EXPO_PUBLIC_PREMIUM_EXPORT_ENTRY", "EXPO_PUBLIC_SHARE_ENCOUNTER_COPY"];
  const original = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of keys) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });

  it("未設定なら OFF、\"true\" のときだけ ON", () => {
    for (const k of keys) delete process.env[k];
    expect(isPremiumExportEntryEnabled()).toBe(false);
    expect(isShareEncounterCopyEnabled()).toBe(false);
    process.env.EXPO_PUBLIC_PREMIUM_EXPORT_ENTRY = "true";
    process.env.EXPO_PUBLIC_SHARE_ENCOUNTER_COPY = "1";
    expect(isPremiumExportEntryEnabled()).toBe(true);
    expect(isShareEncounterCopyEnabled()).toBe(false);
  });
});
