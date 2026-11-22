import { describe, expect, it } from "vitest";
import {
  characterLines,
  filterByRange,
  formatAgo,
  formatDistance,
  getNearbyRange,
  sortByDistance,
  widerRange,
} from "../lib/nearby-presence";

const now = "2026-11-22T12:00:00.000Z";
const base = { updatedAt: now, isSelf: false };

describe("nearby-presence", () => {
  const origin = { lat: 35.6812, lng: 139.7671 }; // 東京駅
  const people = [
    { ...base, id: "far", lat: 34.7025, lng: 135.4959 }, // 大阪
    { ...base, id: "near", lat: 35.6830, lng: 139.7671 }, // 約200m
    { ...base, id: "self", lat: 35.6812, lng: 139.7671, isSelf: true },
    { ...base, id: "mid", lat: 35.6900, lng: 139.7671 }, // 約1km
  ];

  it("自分を除いて近い順に並べる", () => {
    const sorted = sortByDistance(people, origin);
    expect(sorted.map((p) => p.id)).toEqual(["near", "mid", "far"]);
    expect(sorted[0].distanceM).toBeGreaterThan(150);
    expect(sorted[0].distanceM).toBeLessThan(250);
  });

  it("現在地が無いときは新しい順", () => {
    const sorted = sortByDistance(
      [
        { ...base, id: "old", lat: 1, lng: 1, updatedAt: "2026-11-22T11:58:00.000Z" },
        { ...base, id: "new", lat: 2, lng: 2, updatedAt: "2026-11-22T11:59:00.000Z" },
      ],
      null,
    );
    expect(sorted.map((p) => p.id)).toEqual(["new", "old"]);
    expect(sorted[0].distanceM).toBeNull();
  });

  it("範囲で絞る", () => {
    const sorted = sortByDistance(people, origin);
    expect(filterByRange(sorted, getNearbyRange("walk5")).map((p) => p.id)).toEqual(["near"]);
    expect(filterByRange(sorted, getNearbyRange("walk15")).map((p) => p.id)).toEqual(["near", "mid"]);
    expect(filterByRange(sorted, getNearbyRange("all"))).toHaveLength(3);
    expect(widerRange("walk5")?.key).toBe("walk15");
    expect(widerRange("all")).toBeNull();
  });

  it("距離と時刻の表示", () => {
    expect(formatDistance(560)).toBe("徒歩7分・560m");
    expect(formatDistance(12_345)).toBe("12.3km");
    expect(formatDistance(null)).toBe("距離不明");
    expect(formatAgo("2026-11-22T11:57:00.000Z", Date.parse(now))).toBe("3分前");
    expect(formatAgo(now, Date.parse(now))).toBe("たった今");
  });

  it("キャラのひとこと", () => {
    expect(characterLines(0, 2, getNearbyRange("walk5"), true).rinku).toContain("徒歩5分以内にはいない");
    expect(characterLines(2, 2, getNearbyRange("walk15"), true).rinku).toBe("徒歩15分以内に2人いるよ！");
    expect(characterLines(0, 0, getNearbyRange("all"), true).rinku).toContain("誰も");
  });
});
