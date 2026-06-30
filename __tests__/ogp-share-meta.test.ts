import { describe, it, expect } from "vitest";
import {
  resolveShareAreaLabel,
  buildOgImageSearchParams,
} from "@/lib/ogp/share-meta";

describe("resolveShareAreaLabel", () => {
  it("area を優先", () => {
    expect(
      resolveShareAreaLabel({
        area: "塩尻市",
        prefecture: "長野県",
        lat: 1,
        lng: 2,
        hasLocation: true,
        zoom: 16,
        recordedAt: new Date("2026-06-30T00:00:00Z"),
      }),
    ).toBe("塩尻市");
  });

  it("area が無ければ prefecture", () => {
    expect(
      resolveShareAreaLabel({
        area: null,
        prefecture: "長野県",
        lat: null,
        lng: null,
        hasLocation: false,
        zoom: 13,
        recordedAt: null,
      }),
    ).toBe("長野県");
  });
});

describe("buildOgImageSearchParams", () => {
  it("recordedAt を v= キャッシュバスターに含める", () => {
    const at = new Date("2026-06-30T12:00:00.000Z");
    const params = buildOgImageSearchParams({
      area: "塩尻市",
      prefecture: "長野県",
      lat: 36.1,
      lng: 137.9,
      hasLocation: true,
      zoom: 16,
      recordedAt: at,
    });
    expect(params.get("area")).toBe("塩尻市");
    expect(params.get("v")).toBe(String(at.getTime()));
  });
});
