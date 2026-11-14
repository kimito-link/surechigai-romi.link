import { describe, it, expect } from "vitest";
import {
  resolveShareAreaLabel,
  resolveShareDetailedPlace,
  buildOgImageSearchParams,
  buildPublicSharePageUrl,
  buildOgRedirectMetaUrl,
  buildOgRedirectImageTarget,
  featureShareLocationFirst,
  parseShareLocationFromQuery,
  preferExplicitShareLocation,
} from "@/lib/ogp/share-meta";
import { buildWarmTargetUrl } from "@/lib/ogp/warm-og-image";
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

  it("明示シェア地点が丸め済みDB地点とずれる場合は正確地点を先頭に補う", () => {
    const rounded = {
      ...base,
      id: 30,
      lat: 36.203,
      lng: 137.965,
      latGrid: 36.203,
      lngGrid: 137.965,
      municipality: "松本市",
      prefecture: "長野県",
      recordedAt: "2026-07-10T10:01:00.000Z",
    };
    const ordered = featureShareLocationFirst([rounded], {
      area: "松本市",
      prefecture: "長野県",
      lat: 36.20626,
      lng: 137.96951,
      hasLocation: true,
      zoom: 16,
      recordedAt: new Date("2026-07-10T10:01:00.000Z"),
    });
    expect(ordered[0]?.id).toBe(-1);
    expect(ordered[0]?.lat).toBe(36.20626);
    expect(ordered[1]?.id).toBe(30);
  });
});

describe("buildOgRedirectMetaUrl", () => {
  it("slug ベースの OGP 入口 URL を返す", () => {
    const at = new Date("2026-06-30T12:00:00.000Z");
    expect(buildOgRedirectMetaUrl("abc123", at)).toBe(
      `https://surechigai.kimito.link/api/og-redirect/abc123?v=${at.getTime()}`,
    );
  });
});

describe("buildOgRedirectImageTarget", () => {
  it("座標付き /api/og へリダイレクト先を組み立てる", () => {
    const target = buildOgRedirectImageTarget({
      location: {
        area: "岡谷市",
        prefecture: "長野県",
        lat: 36.07,
        lng: 138.06,
        hasLocation: true,
        zoom: 15,
        recordedAt: new Date("2026-06-30T12:00:00.000Z"),
      },
      username: "streamerfunch",
      version: 123,
    });
    expect(target).toContain("/api/og?");
    expect(target).toContain("lat=36.07");
    expect(target).toContain("name=streamerfunch");
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

/**
 * ウォーム対象URLは、クローラーが実際に取りに来るURLと完全一致しなければならない。
 * 1文字でも違うと別キャッシュキーになり、事前ウォーム(2026-07-30 導入)が黙って
 * 無意味になる — 症状は「OGP画像が出たり出なかったり」に戻るだけで気づきにくい。
 */
describe("buildWarmTargetUrl（OGPキャッシュ事前ウォーム）", () => {
  const location = {
    area: "岡谷市",
    prefecture: "長野県",
    lat: 36.065296,
    lng: 138.05211,
    hasLocation: true,
    zoom: 14,
    recordedAt: new Date("2026-07-30T05:45:11.187Z"),
  };

  it("api/u/[slug].ts が og:image に出すURLと一致する", () => {
    // シェア側（api/u/[slug].ts・server/routers/ogp.ts）と同じ組み立て
    const crawlerFetches = buildOgRedirectImageTarget({
      origin: "https://surechigai.kimito.link",
      location,
      username: "streamerfunch",
      version: location.recordedAt.getTime(),
    });
    expect(buildWarmTargetUrl(location, "streamerfunch")).toBe(crawlerFetches);
  });

  it("recordedAt があれば v= に使う（チェックインごとに別URLになる）", () => {
    const url = buildWarmTargetUrl(location, "streamerfunch");
    expect(url).toContain(`v=${location.recordedAt.getTime()}`);
    expect(url).toContain("area=%E5%B2%A1%E8%B0%B7%E5%B8%82");
    expect(url).toContain("lat=36.065296");
  });

  it("位置なしでも生成でき、座標クエリを含まない", () => {
    const url = buildWarmTargetUrl(null, null);
    expect(url).toContain("/api/og");
    expect(url).not.toContain("lat=");
  });
});

/**
 * OGP/シェア文言で「岡谷市」ではなくチェックイン画面と同じ詳しさを出す（2026-07-31 の方針）。
 * 逆ジオの address は重複を含む冗長な文字列なので、畳んで読める形にする。
 */
describe("resolveShareDetailedPlace", () => {
  const base = {
    area: "岡谷市",
    prefecture: "長野県",
    lat: 36.06,
    lng: 138.05,
    hasLocation: true,
    zoom: 14,
    recordedAt: new Date("2026-07-31T00:00:00Z"),
  };

  it("重複と「日本」を畳んで詳細住所を返す", () => {
    expect(
      resolveShareDetailedPlace({
        ...base,
        address: "川岸, 岡谷街道, 川岸東四丁目, 川岸, 岡谷市, 長野県, 日本",
      }),
    ).toBe("川岸 岡谷街道 川岸東四丁目 岡谷市 長野県");
  });

  it("address が無ければ市区町村へフォールバック", () => {
    expect(resolveShareDetailedPlace({ ...base, address: null })).toBe("岡谷市");
  });

  it("address が空文字でもフォールバックする", () => {
    expect(resolveShareDetailedPlace({ ...base, address: "   " })).toBe("岡谷市");
  });

  it("null を渡すと null", () => {
    expect(resolveShareDetailedPlace(null)).toBeNull();
  });
});
