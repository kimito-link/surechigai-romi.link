import { describe, it, expect } from "vitest";
import {
  buildTrailGpx,
  buildTrailGeoJson,
  type ExportableTrailPoint,
} from "@/modules/encounter/core/trail-export";

const points: ExportableTrailPoint[] = [
  {
    lat: 36.065296,
    lng: 138.05211,
    recordedAt: new Date("2026-07-31T00:01:00Z"),
    prefecture: "長野県",
    municipality: "岡谷市",
    address: "川岸, 岡谷市, 長野県",
    placeName: "岡谷SS",
    note: "レギュラー153円",
  },
];

describe("buildTrailGeoJson", () => {
  it("座標が [経度, 緯度] の順（GeoJSON仕様。緯度経度の逆）", () => {
    const parsed = JSON.parse(buildTrailGeoJson(points));
    expect(parsed.features[0].geometry.coordinates).toEqual([138.05211, 36.065296]);
  });

  it("FeatureCollection として妥当", () => {
    const parsed = JSON.parse(buildTrailGeoJson(points));
    expect(parsed.type).toBe("FeatureCollection");
    expect(parsed.features[0].type).toBe("Feature");
    expect(parsed.features[0].geometry.type).toBe("Point");
  });

  it("場所メモも書き出す", () => {
    const parsed = JSON.parse(buildTrailGeoJson(points));
    expect(parsed.features[0].properties.placeName).toBe("岡谷SS");
    expect(parsed.features[0].properties.note).toBe("レギュラー153円");
  });

  it("空でも壊れない", () => {
    const parsed = JSON.parse(buildTrailGeoJson([]));
    expect(parsed.features).toEqual([]);
  });
});

describe("buildTrailGpx", () => {
  it("lat/lon 属性に実座標が入る", () => {
    const gpx = buildTrailGpx(points);
    expect(gpx).toContain('lat="36.065296"');
    expect(gpx).toContain('lon="138.05211"');
  });

  it("本人が付けた名前を優先する", () => {
    const gpx = buildTrailGpx(points);
    expect(gpx).toContain("<name>岡谷SS</name>");
  });

  it("placeName が無ければ住所へフォールバック", () => {
    const gpx = buildTrailGpx([{ ...points[0], placeName: null }]);
    expect(gpx).toContain("川岸, 岡谷市, 長野県");
  });

  it("XML特殊文字をエスケープする（壊れたGPXを吐かない）", () => {
    const gpx = buildTrailGpx([
      { ...points[0], placeName: 'A&B<test>"q"', note: "1 < 2" },
    ]);
    expect(gpx).toContain("A&amp;B&lt;test&gt;");
    expect(gpx).not.toMatch(/<name>[^<]*<test>/);
  });

  it("空でも妥当なGPXになる", () => {
    const gpx = buildTrailGpx([]);
    expect(gpx).toContain("<gpx");
    expect(gpx).toContain("</gpx>");
  });
});
