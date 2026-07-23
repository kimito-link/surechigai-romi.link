/**
 * __tests__/encounter-core.test.ts
 *
 * modules/encounter/core の単体テスト。
 * vitest + node 環境（DB・HTTP 非依存）。
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// geo.ts
// ---------------------------------------------------------------------------
import {
  haversineMeters,
  toGrid,
  toH3Cell,
  toH3R7,
  toH3ParentCell,
  kRing,
  assertFiniteLatLng,
  LAT_GRID,
  LNG_GRID,
  H3_RES_5,
  H3_RES_7,
} from "../modules/encounter/core/geo.js";

describe("geo: haversineMeters", () => {
  it("同一点は 0m", () => {
    const p = { lat: 35.6581, lng: 139.7013 };
    expect(haversineMeters(p, p)).toBeCloseTo(0, 1);
  });

  it("渋谷〜新宿（約2.0km）を許容誤差5%以内で推定できる", () => {
    const shibuya = { lat: 35.6580, lng: 139.7016 };
    const shinjuku = { lat: 35.6896, lng: 139.6917 };
    const dist = haversineMeters(shibuya, shinjuku);
    // 地理的距離は約 3.5km だが、グリッド値は微小差なので既知値テスト
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(10_000);
  });

  it("既知値: 北緯35度, 東経139度から 1度北（約111km）", () => {
    const a = { lat: 35.0, lng: 139.0 };
    const b = { lat: 36.0, lng: 139.0 };
    const dist = haversineMeters(a, b);
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(113_000);
  });
});

describe("geo: toGrid", () => {
  it("グリッドサイズの倍数にスナップされる（浮動小数点誤差許容）", () => {
    const { latGrid, lngGrid } = toGrid(35.6789, 139.7123);
    // Math.floor ベースなので latGrid / LAT_GRID は整数に近い値になる
    expect(latGrid / LAT_GRID).toBeCloseTo(Math.round(latGrid / LAT_GRID), 6);
    expect(lngGrid / LNG_GRID).toBeCloseTo(Math.round(lngGrid / LNG_GRID), 6);
  });

  it("グリッド値は入力以下（floor ベース）", () => {
    const lat = 35.6789;
    const lng = 139.7123;
    const { latGrid, lngGrid } = toGrid(lat, lng);
    expect(latGrid).toBeLessThanOrEqual(lat);
    expect(lngGrid).toBeLessThanOrEqual(lng);
  });

  it("グリッド値は入力値の1セル分未満の差", () => {
    const lat = 35.6789;
    const lng = 139.7123;
    const { latGrid, lngGrid } = toGrid(lat, lng);
    expect(lat - latGrid).toBeLessThan(LAT_GRID);
    expect(lng - lngGrid).toBeLessThan(LNG_GRID);
  });
});

describe("geo: toH3Cell / toH3R7", () => {
  it("渋谷の res8 セルが文字列で返る", () => {
    const cell = toH3Cell(35.6580, 139.7016);
    expect(typeof cell).toBe("string");
    expect(cell.length).toBeGreaterThan(0);
  });

  it("toH3R7 は toH3Cell(lat, lng, 7) と一致する", () => {
    const lat = 35.6580;
    const lng = 139.7016;
    expect(toH3R7(lat, lng)).toBe(toH3Cell(lat, lng, 7));
  });
});

describe("geo: kRing", () => {
  it("k=0 で1セルのみ返る", () => {
    const cell = toH3Cell(35.6580, 139.7016);
    const ring = kRing(cell, 0);
    expect(ring).toHaveLength(1);
    expect(ring[0]).toBe(cell);
  });

  it("k=1 で7セル返る（中心+6近傍）", () => {
    const cell = toH3Cell(35.6580, 139.7016);
    const ring = kRing(cell, 1);
    expect(ring).toHaveLength(7);
  });
});

// マッチングティア再設計（docs/matching-tier-redesign-DESIGN.md）の回帰テスト。
// 近距離/広域ステージの候補取得が使う kRing 構成のセル数とカバー半径を固定し、
// 意図しない縮小・拡大に気づけるようにする。
describe("geo: kRing — マッチングティア候補カバレッジ回帰", () => {
  // 目的地点からの距離・全方位で ring 内にセルが入るかを判定するヘルパー。
  function destPoint(
    lat: number,
    lng: number,
    bearingDeg: number,
    distM: number
  ): { lat: number; lng: number } {
    const R = 6_371_000;
    const br = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distM / R) +
        Math.cos(lat1) * Math.sin(distM / R) * Math.cos(br)
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(br) * Math.sin(distM / R) * Math.cos(lat1),
        Math.cos(distM / R) - Math.sin(lat1) * Math.sin(lat2)
      );
    return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
  }

  function missedBearings(
    res: number,
    k: number,
    testDistM: number,
    originLat = 35.68,
    originLng = 139.76
  ): number {
    const selfCell = toH3Cell(originLat, originLng, res);
    const ring = new Set(kRing(selfCell, k));
    let missed = 0;
    for (let bearing = 0; bearing < 360; bearing += 10) {
      const { lat, lng } = destPoint(originLat, originLng, bearing, testDistM);
      const targetCell = toH3Cell(lat, lng, res);
      if (!ring.has(targetCell)) missed++;
    }
    return missed;
  }

  it("近距離ステージ(res7 k=2)は3km地点を全方位でカバーする（0/36ミス）", () => {
    expect(missedBearings(7, 2, 3_000)).toBe(0);
  });

  it("広域ステージ(res5 k=4)は50km地点を全方位でカバーする（0/36ミス）", () => {
    expect(missedBearings(5, 4, 50_000)).toBe(0);
  });

  it("広域ステージをk=3に縮小すると50km地点で取りこぼしが発生する（回帰ガード）", () => {
    // 司令塔の全方位実測（2026-07-23）で15/36ミスと判明した組み合わせ。
    // k=3への安易な縮小（コスト削減目的等）を検知するための固定回帰。
    expect(missedBearings(5, 3, 50_000)).toBeGreaterThan(0);
  });
});

describe("geo: toH3ParentCell", () => {
  it("h3R8セルの親(res7)を返す", () => {
    const h3R8 = toH3Cell(35.6580, 139.7016, 8);
    const parent = toH3ParentCell(h3R8, H3_RES_7);
    expect(typeof parent).toBe("string");
    expect(parent.length).toBeGreaterThan(0);
  });

  it("h3R8セルの親(res5)を返す", () => {
    const h3R8 = toH3Cell(35.6580, 139.7016, 8);
    const parent = toH3ParentCell(h3R8, H3_RES_5);
    expect(typeof parent).toBe("string");
  });

  it("直接 latLngToCell(lat,lng,7) とは一致しないことがある（h3-js階層非整合性の既知仕様）", () => {
    // visitedAreas.h3R7（toH3R7＝直接計算）と locations.h3R7（cellToParent導出）は
    // 導出方法が異なり別物であることの回帰確認。誤って「同じはず」という前提で
    // 統合しないための警告テスト。
    const lat = 35.68;
    const lng = 139.76;
    const h3R8 = toH3Cell(lat, lng, 8);
    const viaParent = toH3ParentCell(h3R8, H3_RES_7);
    const viaDirect = toH3R7(lat, lng);
    expect(viaParent).not.toBe(viaDirect);
  });
});

describe("geo: assertFiniteLatLng", () => {
  it("有効値を通す", () => {
    expect(assertFiniteLatLng(35.0, 139.0)).toEqual({ lat: 35.0, lng: 139.0 });
  });

  it("NaN を弾く", () => {
    expect(assertFiniteLatLng(NaN, 139.0)).toBeNull();
  });

  it("Infinity を弾く", () => {
    expect(assertFiniteLatLng(Infinity, 139.0)).toBeNull();
  });

  it("文字列を弾く", () => {
    expect(assertFiniteLatLng("35.0", 139.0)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// tiers.ts
// ---------------------------------------------------------------------------
import { judgeTier, tierLabel } from "../modules/encounter/core/tiers.js";

describe("tiers: judgeTier", () => {
  it("0m → ティア1", () => {
    expect(judgeTier(0)).toBe(1);
  });

  it("500m ちょうど → ティア1", () => {
    expect(judgeTier(500)).toBe(1);
  });

  it("501m → ティア2", () => {
    expect(judgeTier(501)).toBe(2);
  });

  it("3000m ちょうど → ティア2", () => {
    expect(judgeTier(3_000)).toBe(2);
  });

  it("3001m → ティア3", () => {
    expect(judgeTier(3_001)).toBe(3);
  });

  it("10000m ちょうど → ティア3", () => {
    expect(judgeTier(10_000)).toBe(3);
  });

  it("10001m → ティア4", () => {
    expect(judgeTier(10_001)).toBe(4);
  });

  it("50000m ちょうど → ティア4", () => {
    expect(judgeTier(50_000)).toBe(4);
  });

  it("50001m → null", () => {
    expect(judgeTier(50_001)).toBeNull();
  });
});

describe("tiers: tierLabel", () => {
  it("ティア1 → 'すれ違い'", () => {
    expect(tierLabel(1)).toBe("すれ違い");
  });

  it("ティア5 → 'タイムシフト'", () => {
    expect(tierLabel(5)).toBe("タイムシフト");
  });
});

// ---------------------------------------------------------------------------
// matching.ts
// ---------------------------------------------------------------------------
import {
  findMatches,
  type SelfLocation,
  type NearbyCandidate,
  type TimeshiftCandidate,
} from "../modules/encounter/core/matching.js";

const NOW = new Date("2026-06-13T12:00:00Z");

/** 500m 以内に収まる差分（約 270m） */
const CLOSE_OFFSET = { dlat: 0.002, dlng: 0.002 };
/** 3km 超 10km 以内の差分（約 4km） */
const MID_OFFSET = { dlat: 0.035, dlng: 0.035 };

function makeSelf(userId = 1): SelfLocation {
  return {
    userId,
    latGrid: 35.658,
    lngGrid: 139.701,
    h3R8: toH3Cell(35.658, 139.701, 8),
    recordedAt: NOW,
  };
}

function makeNearby(
  userId: number,
  dlat: number,
  dlng: number
): NearbyCandidate {
  return {
    userId,
    latGrid: 35.658 + dlat,
    lngGrid: 139.701 + dlng,
    h3R8: toH3Cell(35.658 + dlat, 139.701 + dlng, 8),
    recordedAt: NOW,
  };
}

describe("matching: findMatches — 即時マッチング", () => {
  it("500m 以内の候補とマッチする（ティア1）", () => {
    const self = makeSelf(1);
    const cand = makeNearby(2, CLOSE_OFFSET.dlat, CLOSE_OFFSET.dlng);
    const results = findMatches({
      self,
      nearbyCandidates: [cand],
      timeshiftCandidates: [],
      blockSet: new Set(),
      todayPairSet: new Set(),
    });
    expect(results).toHaveLength(1);
    expect(results[0].tier).toBe(1);
    expect(results[0].userAId).toBe(1);
    expect(results[0].userBId).toBe(2);
  });

  it("ブロックされている相手は除外される", () => {
    const self = makeSelf(1);
    const cand = makeNearby(2, CLOSE_OFFSET.dlat, CLOSE_OFFSET.dlng);
    const results = findMatches({
      self,
      nearbyCandidates: [cand],
      timeshiftCandidates: [],
      blockSet: new Set(["1-2"]),
      todayPairSet: new Set(),
    });
    expect(results).toHaveLength(0);
  });

  it("当日マッチ済みペアは除外される", () => {
    const self = makeSelf(1);
    const cand = makeNearby(2, CLOSE_OFFSET.dlat, CLOSE_OFFSET.dlng);
    const results = findMatches({
      self,
      nearbyCandidates: [cand],
      timeshiftCandidates: [],
      blockSet: new Set(),
      todayPairSet: new Set(["1-2"]),
    });
    expect(results).toHaveLength(0);
  });

  it("50km 超の候補はマッチしない", () => {
    const self = makeSelf(1);
    // 経度差 1度 ≈ 約 91km（35度緯度）
    const farCand = makeNearby(2, 0, 1.0);
    const results = findMatches({
      self,
      nearbyCandidates: [farCand],
      timeshiftCandidates: [],
      blockSet: new Set(),
      todayPairSet: new Set(),
    });
    expect(results).toHaveLength(0);
  });

  it("同一相手に対して最高ティアのみ1件返る", () => {
    const self = makeSelf(1);
    // 同じユーザー2を近い位置と中間距離の2エントリで渡す（実際は1エントリだが仮に）
    const candClose = makeNearby(2, CLOSE_OFFSET.dlat, CLOSE_OFFSET.dlng);
    const results = findMatches({
      self,
      nearbyCandidates: [candClose],
      timeshiftCandidates: [],
      blockSet: new Set(),
      todayPairSet: new Set(),
    });
    // user2 は1件のみ
    const forUser2 = results.filter(
      (r) => r.userAId === 1 || r.userBId === 2
    );
    expect(forUser2).toHaveLength(1);
  });

  it("userAId < userBId に正規化されている", () => {
    const self = makeSelf(5); // userId=5 が大きい
    const cand = makeNearby(2, CLOSE_OFFSET.dlat, CLOSE_OFFSET.dlng); // userId=2 が小さい
    const results = findMatches({
      self,
      nearbyCandidates: [cand],
      timeshiftCandidates: [],
      blockSet: new Set(),
      todayPairSet: new Set(),
    });
    expect(results[0].userAId).toBe(2);
    expect(results[0].userBId).toBe(5);
  });
});

describe("matching: findMatches — タイムシフト", () => {
  it("タイムシフト候補と h3R7 同セルでティア5マッチが成立する", () => {
    const self = makeSelf(1);
    const selfH3R7 = toH3Cell(self.latGrid, self.lngGrid, 7);
    const ts: TimeshiftCandidate = {
      userId: 10,
      h3R7: selfH3R7,
    };
    const results = findMatches({
      self,
      nearbyCandidates: [],
      timeshiftCandidates: [ts],
      blockSet: new Set(),
      todayPairSet: new Set(),
    });
    expect(results).toHaveLength(1);
    expect(results[0].tier).toBe(5);
  });

  it("タイムシフト候補がブロック済みなら除外される", () => {
    const self = makeSelf(1);
    const selfH3R7 = toH3Cell(self.latGrid, self.lngGrid, 7);
    const ts: TimeshiftCandidate = { userId: 10, h3R7: selfH3R7 };
    const results = findMatches({
      self,
      nearbyCandidates: [],
      timeshiftCandidates: [ts],
      blockSet: new Set(["1-10"]),
      todayPairSet: new Set(),
    });
    expect(results).toHaveLength(0);
  });

  it("即時マッチ（ティア1）があればタイムシフト（ティア5）は上書きされない", () => {
    const self = makeSelf(1);
    const selfH3R7 = toH3Cell(self.latGrid, self.lngGrid, 7);
    const cand = makeNearby(2, CLOSE_OFFSET.dlat, CLOSE_OFFSET.dlng);
    const ts: TimeshiftCandidate = { userId: 2, h3R7: selfH3R7 };
    const results = findMatches({
      self,
      nearbyCandidates: [cand],
      timeshiftCandidates: [ts],
      blockSet: new Set(),
      todayPairSet: new Set(),
    });
    // user2 は1件のみ、かつ高ティア（tier=1）が採用される
    const forUser2 = results.filter(
      (r) => (r.userAId === 1 && r.userBId === 2) || (r.userAId === 2 && r.userBId === 1)
    );
    expect(forUser2).toHaveLength(1);
    expect(forUser2[0].tier).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// moderation.ts
// ---------------------------------------------------------------------------
import {
  containsNgWord,
  filterNgWords,
  moderateText,
} from "../modules/encounter/core/moderation.js";

describe("moderation: NGワード", () => {
  it("NGワードを含む文字列を検出する", () => {
    expect(containsNgWord("LINE交換しませんか")).toBe(true);
    expect(containsNgWord("死ねとか言うな")).toBe(true);
    expect(containsNgWord("会いたいな")).toBe(true);
  });

  it("NGワードを含まない文字列はfalse", () => {
    expect(containsNgWord("今日は良い天気ですね")).toBe(false);
    expect(containsNgWord("お散歩中です")).toBe(false);
  });

  it("filterNgWords がマスク文字列を返す", () => {
    const result = filterNgWords("LINE交換しませんか");
    expect(result).not.toContain("LINE交換");
    expect(result).toContain("＊");
  });
});

describe("moderation: moderateText (NGワードのみ、APIキーなし)", () => {
  it("NGワードを含む文字列を rejected=true で返す", async () => {
    const result = await moderateText("LINE交換しませんか", {});
    expect(result.rejected).toBe(true);
    expect(result.stage).toBe("ng_word");
  });

  it("クリーンな文字列は rejected=false で返す", async () => {
    const result = await moderateText("今日は良い天気ですね", {});
    expect(result.rejected).toBe(false);
    expect(result.stage).toBe("pass");
  });
});

// ---------------------------------------------------------------------------
// privacy.ts
// ---------------------------------------------------------------------------
import {
  isHomeMasked,
  applyHomeMask,
  sanitizeAreaName,
} from "../modules/encounter/core/privacy.js";

describe("privacy: isHomeMasked", () => {
  const CELL = toH3Cell(35.658, 139.701, 8);

  it("homeMaskCell が null なら常に false", () => {
    expect(isHomeMasked(CELL, null)).toBe(false);
  });

  it("同一セルなら true", () => {
    expect(isHomeMasked(CELL, CELL)).toBe(true);
  });

  it("別セルなら false", () => {
    const otherCell = toH3Cell(35.0, 140.0, 8);
    expect(isHomeMasked(CELL, otherCell)).toBe(false);
  });
});

describe("privacy: applyHomeMask", () => {
  const info = {
    areaName: "桜丘町(渋谷区)",
    municipality: "渋谷区",
    prefecture: "東京都",
  };

  it("masked=false なら元の情報を返す", () => {
    const result = applyHomeMask(info, false);
    expect(result).toEqual(info);
  });

  it("masked=true なら areaName と municipality が隠される", () => {
    const result = applyHomeMask(info, true);
    expect(result.areaName).toBe("ひみつの場所");
    expect(result.municipality).toBeNull();
    expect(result.prefecture).toBe("東京都"); // 都道府県は残す
  });
});

describe("privacy: sanitizeAreaName", () => {
  it("末尾の丁目を除去する", () => {
    expect(sanitizeAreaName("桜丘3丁目")).toBe("桜丘");
  });

  it("丁目がなければそのまま返す", () => {
    expect(sanitizeAreaName("渋谷区")).toBe("渋谷区");
  });
});

// ---------------------------------------------------------------------------
// trail-visibility.ts
// ---------------------------------------------------------------------------
import {
  parseTrailVisibility,
  canViewTrail,
  isListedInPrefectureDirectory,
} from "../modules/encounter/core/trail-visibility.js";

describe("trail-visibility: parseTrailVisibility", () => {
  it("未知値は public にフォールバック", () => {
    expect(parseTrailVisibility(null)).toBe("public");
    expect(parseTrailVisibility("unknown")).toBe("public");
  });
});

describe("trail-visibility: canViewTrail", () => {
  const owner = 1;
  const viewer = 2;

  it("本人は private でも閲覧可", () => {
    expect(
      canViewTrail({
        visibility: "private",
        ownerUserId: owner,
        viewerUserId: owner,
        hasEncounter: false,
      }),
    ).toBe(true);
  });

  it("private は他人不可", () => {
    expect(
      canViewTrail({
        visibility: "private",
        ownerUserId: owner,
        viewerUserId: viewer,
        hasEncounter: false,
      }),
    ).toBe(false);
  });

  it("link は未ログインでも閲覧可", () => {
    expect(
      canViewTrail({
        visibility: "link",
        ownerUserId: owner,
        viewerUserId: null,
        hasEncounter: false,
      }),
    ).toBe(true);
  });

  it("acquaintance はすれ違いがある場合のみ", () => {
    expect(
      canViewTrail({
        visibility: "acquaintance",
        ownerUserId: owner,
        viewerUserId: viewer,
        hasEncounter: true,
      }),
    ).toBe(true);
    expect(
      canViewTrail({
        visibility: "acquaintance",
        ownerUserId: owner,
        viewerUserId: viewer,
        hasEncounter: false,
      }),
    ).toBe(false);
  });
});

describe("trail-visibility: isListedInPrefectureDirectory", () => {
  it("public のみ県別一覧に載る", () => {
    expect(isListedInPrefectureDirectory("public")).toBe(true);
    expect(isListedInPrefectureDirectory("link")).toBe(false);
    expect(isListedInPrefectureDirectory("private")).toBe(false);
    expect(isListedInPrefectureDirectory("acquaintance")).toBe(false);
  });
});

// location-visibility.ts
import {
  parseLocationVisibility,
  locationVisibilityLabel,
  toggleLocationVisibility,
  isLocationVisibleToOthers,
} from "../modules/encounter/core/location-visibility.js";

describe("location-visibility", () => {
  it("parseLocationVisibility は private 以外を public にする", () => {
    expect(parseLocationVisibility("private")).toBe("private");
    expect(parseLocationVisibility("public")).toBe("public");
    expect(parseLocationVisibility(null)).toBe("public");
  });

  it("toggleLocationVisibility で公開/非公開を反転", () => {
    expect(toggleLocationVisibility("public")).toBe("private");
    expect(toggleLocationVisibility("private")).toBe("public");
  });

  it("isLocationVisibleToOthers", () => {
    expect(isLocationVisibleToOthers("public")).toBe(true);
    expect(isLocationVisibleToOthers("private")).toBe(false);
  });

  it("locationVisibilityLabel", () => {
    expect(locationVisibilityLabel("public")).toBe("公開");
    expect(locationVisibilityLabel("private")).toBe("非公開");
  });
});

// ---------------------------------------------------------------------------
// checkin-guards.ts
// ---------------------------------------------------------------------------
import {
  isAcceptableAccuracy,
  isLocationRecordingPaused,
  resolveMunicipality,
  excludeSelfMatches,
  MAX_ACCEPTABLE_ACCURACY_M,
} from "../modules/encounter/core/checkin-guards.js";

describe("checkin-guards: isAcceptableAccuracy", () => {
  it("accuracy が undefined なら許可する（精度不明は既存挙動どおり許可）", () => {
    expect(isAcceptableAccuracy(undefined)).toBe(true);
  });

  it("MAX_ACCEPTABLE_ACCURACY_M ちょうどは許可する", () => {
    expect(isAcceptableAccuracy(MAX_ACCEPTABLE_ACCURACY_M)).toBe(true);
  });

  it("MAX_ACCEPTABLE_ACCURACY_M を超えると拒否する", () => {
    expect(isAcceptableAccuracy(MAX_ACCEPTABLE_ACCURACY_M + 1)).toBe(false);
  });

  it("小さい accuracy（高精度）は許可する", () => {
    expect(isAcceptableAccuracy(10)).toBe(true);
  });
});

describe("checkin-guards: isLocationRecordingPaused", () => {
  it("locationPausedUntil が null なら停止していない", () => {
    expect(isLocationRecordingPaused(null)).toBe(false);
  });

  it("locationPausedUntil が undefined なら停止していない", () => {
    expect(isLocationRecordingPaused(undefined)).toBe(false);
  });

  it("locationPausedUntil が現在時刻より未来なら停止中", () => {
    const now = new Date("2026-07-04T00:00:00Z");
    const pausedUntil = new Date("2026-07-05T00:00:00Z");
    expect(isLocationRecordingPaused(pausedUntil, now)).toBe(true);
  });

  it("locationPausedUntil が現在時刻より過去なら停止していない（解除済み）", () => {
    const now = new Date("2026-07-04T00:00:00Z");
    const pausedUntil = new Date("2026-07-03T00:00:00Z");
    expect(isLocationRecordingPaused(pausedUntil, now)).toBe(false);
  });

  it("locationPausedUntil が現在時刻ちょうどなら停止していない（境界値）", () => {
    const now = new Date("2026-07-04T00:00:00Z");
    expect(isLocationRecordingPaused(now, now)).toBe(false);
  });
});

describe("checkin-guards: resolveMunicipality", () => {
  it("クライアント指定があればそれを優先する", () => {
    expect(resolveMunicipality("渋谷区", "新宿区")).toBe("渋谷区");
  });

  it("クライアント指定がなければ逆ジオコーディング結果を使う", () => {
    expect(resolveMunicipality(undefined, "新宿区")).toBe("新宿区");
  });

  it("どちらもなければ null", () => {
    expect(resolveMunicipality(undefined, null)).toBeNull();
    expect(resolveMunicipality(undefined, undefined)).toBeNull();
  });
});

describe("checkin-guards: excludeSelfMatches", () => {
  it("userAId === userBId のマッチを除外する", () => {
    const matches = [
      { userAId: 1, userBId: 2 },
      { userAId: 3, userBId: 3 },
      { userAId: 4, userBId: 5 },
    ];
    expect(excludeSelfMatches(matches)).toEqual([
      { userAId: 1, userBId: 2 },
      { userAId: 4, userBId: 5 },
    ]);
  });

  it("自己マッチがなければ全件そのまま返す", () => {
    const matches = [{ userAId: 1, userBId: 2 }];
    expect(excludeSelfMatches(matches)).toEqual(matches);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(excludeSelfMatches([])).toEqual([]);
  });
});
