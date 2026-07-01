import { describe, it, expect } from "vitest";
import {
  resolveShareAreaLabel,
  buildOgImageSearchParams,
  buildPublicSharePageUrl,
  featureShareLocationFirst,
  parseShareLocationFromQuery,
  preferExplicitShareLocation,
} from "@/lib/ogp/share-meta";
import { shouldMaskHomeCellFromShare } from "@/modules/encounter/core/location-visibility";

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

describe("buildPublicSharePageUrl", () => {
  it("recordedAt を v= クエリに含める", () => {
    const at = new Date("2026-06-30T12:00:00.000Z");
    expect(buildPublicSharePageUrl("abc123", at)).toBe(
      `https://surechigai.kimito.link/u/abc123?v=${at.getTime()}`,
    );
  });

  it("地点ヒントをクエリに含める", () => {
    const at = new Date("2026-06-30T12:00:00.000Z");
    expect(
      buildPublicSharePageUrl("abc123", at, "https://surechigai.kimito.link", {
        area: "岡谷市",
        prefecture: "長野県",
        lat: 36.07,
        lng: 138.06,
        hasLocation: true,
        zoom: 13,
        recordedAt: at,
      }),
    ).toBe(
      `https://surechigai.kimito.link/u/abc123?v=${at.getTime()}&area=${encodeURIComponent("岡谷市")}&pref=${encodeURIComponent("長野県")}&lat=36.07&lng=138.06&zoom=13`,
    );
  });
});

describe("shouldMaskHomeCellFromShare", () => {
  it("本人は自宅マスクをシェアから除外しない", () => {
    expect(shouldMaskHomeCellFromShare("8928308280fffff", 1, 1)).toBe(false);
  });

  it("第三者は自宅マスクをシェアから除外する", () => {
    expect(shouldMaskHomeCellFromShare("8928308280fffff", null, 1)).toBe(true);
    expect(shouldMaskHomeCellFromShare("8928308280fffff", 2, 1)).toBe(true);
  });
});

describe("featureShareLocationFirst", () => {
  const base = {
    id: 10,
    h3R8: "abc",
    latGrid: 35.68,
    lngGrid: 139.76,
    lat: 35.681,
    lng: 139.767,
    accuracyM: 50,
    municipality: "千代田区",
    prefecture: "東京都",
    address: null,
    recordedAt: new Date("2026-07-01T07:48:00Z"),
    visibility: "public",
  };

  it("OGP 地点を先頭に移動する", () => {
    const okaya = {
      ...base,
      id: 20,
      lat: 36.07,
      lng: 138.06,
      latGrid: 36.07,
      lngGrid: 138.06,
      municipality: "岡谷市",
      prefecture: "長野県",
      recordedAt: new Date("2026-07-01T09:00:00Z"),
    };
    const ordered = featureShareLocationFirst([base, okaya], {
      area: "岡谷市",
      prefecture: "長野県",
      lat: 36.07,
      lng: 138.06,
      hasLocation: true,
      zoom: 13,
      recordedAt: okaya.recordedAt,
    });
    expect(ordered[0]?.municipality).toBe("岡谷市");
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

describe("parseShareLocationFromQuery", () => {
  it("シェア URL の地点クエリを復元", () => {
    const hint = parseShareLocationFromQuery({
      area: "岡谷市",
      pref: "長野県",
      lat: "36.07",
      lng: "138.06",
      zoom: "13",
      v: "1782865622212",
    });
    expect(hint?.area).toBe("岡谷市");
    expect(hint?.hasLocation).toBe(true);
    expect(hint?.lat).toBe(36.07);
  });
});

describe("preferExplicitShareLocation", () => {
  it("明示シェア地点が新しければ優先", () => {
    const resolved = {
      area: "千代田区",
      prefecture: "東京都",
      lat: 35.68,
      lng: 139.76,
      hasLocation: true,
      zoom: 13,
      recordedAt: new Date("2026-06-30T13:48:00Z"),
    };
    const explicit = {
      area: "岡谷市",
      prefecture: "長野県",
      lat: 36.07,
      lng: 138.06,
      hasLocation: true,
      zoom: 13,
      recordedAt: new Date("2026-06-30T15:50:00Z"),
    };
    expect(preferExplicitShareLocation(resolved, explicit)?.area).toBe("岡谷市");
  });
});
