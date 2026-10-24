import { describe, expect, it } from "vitest";
import { buildOgImageSearchParams, buildPublicSharePageUrl } from "@/lib/ogp/share-meta";
import {
  coarsenPublicCoordinate,
  formatPublicCoordinate,
  publicShareLabel,
  sanitizePublicText,
  toPublicPlace,
} from "@/lib/ogp/sanitize-public-place";

const IKEBUKURO =
  "日本、〒170-0013 東京都豊島区東池袋一丁目1-2 サンシャインビル";

describe("公開地名サニタイザ", () => {
  it("東池袋一丁目と郵便番号170-0013を落とし、東京都豊島区だけ残す", () => {
    const place = toPublicPlace({ address: IKEBUKURO });
    expect(place).toEqual({
      prefecture: "東京都",
      municipality: "豊島区",
      label: "東京都豊島区",
    });
    expect(place.label).not.toContain("東池袋");
    expect(place.label).not.toContain("一丁目");
    expect(place.label).not.toContain("170-0013");
    expect(place.label).not.toContain("サンシャイン");
  });

  it("og:title に混ざった実例の断片からも番地と郵便番号を消す", () => {
    const title = sanitizePublicText(
      "@streamerfunch は 東池袋一丁目 豊島区 東京都 170-0013 にいるよ｜君斗りんくのすれ違ひ通信",
    );
    expect(title).not.toContain("東池袋");
    expect(title).not.toContain("丁目");
    expect(title).not.toContain("170-0013");
    expect(title).toContain("豊島区");
    expect(title).toContain("東京都");
    expect(publicShareLabel({ label: title })).toBe("東京都豊島区");
  });

  it("全角の〒と丁目も落とす", () => {
    const place = toPublicPlace({
      address: "〒１７０－００１３ 東京都豊島区東池袋一丁目",
    });
    expect(place.label).toBe("東京都豊島区");
    expect(JSON.stringify(place)).not.toContain("170");
  });

  it("逆ジオの重複住所は都道府県+市区町村だけにする", () => {
    expect(
      toPublicPlace({
        address: "川岸, 岡谷街道, 川岸東四丁目, 川岸, 岡谷市, 長野県, 日本",
        area: "岡谷市",
        prefecture: "長野県",
      }).label,
    ).toBe("長野県岡谷市");
  });

  it("政令市は市と区を残す", () => {
    expect(
      toPublicPlace({
        address: "神奈川県横浜市西区みなとみらい一丁目1-1 ランドマークタワー",
      }).label,
    ).toBe("神奈川県横浜市西区");
  });

  it("座標は小数2桁に丸め、公開URLへ6桁を出さない", () => {
    expect(formatPublicCoordinate(35.729812)).toBe("35.73");
    expect(formatPublicCoordinate(139.715432)).toBe("139.72");
    expect(coarsenPublicCoordinate(35.729812)).toBe(35.73);

    const at = new Date("2026-10-24T00:00:00.000Z");
    const page = buildPublicSharePageUrl("TGszTcz7stEb", at, "https://surechigai.kimito.link", {
      area: "豊島区",
      prefecture: "東京都",
      address: IKEBUKURO,
      lat: 35.729812,
      lng: 139.715432,
      hasLocation: true,
      zoom: 16,
      recordedAt: at,
    });
    expect(page).not.toContain("lat=");
    expect(page).not.toContain("lng=");
    expect(page).not.toContain("35.729812");
    expect(page).not.toContain("東池袋");
    expect(page).not.toContain("170-0013");
    expect(page).toContain(encodeURIComponent("豊島区"));

    const og = buildOgImageSearchParams({
      area: "東池袋一丁目",
      prefecture: "東京都",
      address: IKEBUKURO,
      lat: 35.729812,
      lng: 139.715432,
      hasLocation: true,
      zoom: 16,
      recordedAt: at,
    });
    expect(og.get("lat")).toBe("35.73");
    expect(og.get("lng")).toBe("139.72");
    expect(og.get("zoom")).toBe("11");
    expect(og.get("area")).toBe("豊島区");
    expect(og.toString()).not.toContain("東池袋");
    expect(og.toString()).not.toContain("170-0013");
    expect(og.toString()).not.toContain("35.729812");
  });
});
