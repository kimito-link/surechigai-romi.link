import { describe, expect, it, vi } from "vitest";

// react-native 実体は Flow 構文(import typeof)を含み vitest/rollup が解釈できない。
// 被験関数は Platform.OS しか見ないためモックで遮断する(これが無いとスイート全体が collect エラー)。
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

import { haversineMeters, refineWithPreciseAnchor } from "@/lib/get-current-location";

describe("refineWithPreciseAnchor", () => {
  const anchor = {
    lat: 36.0755,
    lng: 138.0621,
    accuracyM: 12,
    recordedAt: new Date(),
  };

  it("粗いPC測位を直近の高精度足あとに寄せる", () => {
    const coarse = { lat: 36.0752, lng: 138.0618, accuracy: 180 };
    const refined = refineWithPreciseAnchor(coarse, anchor);
    expect(refined.lat).toBe(anchor.lat);
    expect(refined.lng).toBe(anchor.lng);
    expect(refined.accuracy).toBe(12);
  });

  it("すでに精度が良ければ補正しない", () => {
    const precise = { lat: 36.0752, lng: 138.0618, accuracy: 18 };
    const refined = refineWithPreciseAnchor(precise, anchor);
    expect(refined).toEqual(precise);
  });

  it("距離が離れていれば補正しない", () => {
    const coarse = { lat: 35.68, lng: 139.76, accuracy: 200 };
    const refined = refineWithPreciseAnchor(coarse, anchor);
    expect(refined).toEqual(coarse);
  });
});

describe("haversineMeters", () => {
  it("同一地点は0m", () => {
    const p = { lat: 35.68, lng: 139.76 };
    expect(haversineMeters(p, p)).toBeCloseTo(0, 1);
  });
});
