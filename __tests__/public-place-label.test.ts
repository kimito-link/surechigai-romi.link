import { describe, expect, it } from "vitest";
import { mapPinLabel, toPublicPlaceLabel } from "@/lib/public-place-label";

describe("toPublicPlaceLabel", () => {
  it("空とひみつの場所", () => {
    expect(toPublicPlaceLabel(null)).toBeNull();
    expect(toPublicPlaceLabel(undefined)).toBeNull();
    expect(toPublicPlaceLabel("  ")).toBeNull();
    expect(toPublicPlaceLabel("ひみつの場所")).toBe("ひみつの場所");
  });

  it("都道府県・市区町村だけを残す", () => {
    expect(toPublicPlaceLabel("山梨")).toBe("山梨");
    expect(toPublicPlaceLabel("山梨県")).toBe("山梨");
    expect(toPublicPlaceLabel("山梨県甲府市")).toBe("甲府市");
    expect(toPublicPlaceLabel("山梨県 甲府市")).toBe("甲府市");
    expect(toPublicPlaceLabel("山梨県甲府市丸の内1-1-1")).toBe("甲府市");
    expect(toPublicPlaceLabel("北海道小樽市")).toBe("小樽市");
    expect(toPublicPlaceLabel("東京都渋谷区神宮前1丁目2-3")).toBe("渋谷区");
    expect(toPublicPlaceLabel("渋谷区")).toBe("渋谷区");
    expect(toPublicPlaceLabel("札幌市中央区")).toBe("札幌市中央区");
    expect(toPublicPlaceLabel("桜丘町(渋谷区)")).toBe("渋谷区");
    expect(toPublicPlaceLabel("〒400-0031 山梨県甲府市丸の内")).toBe("甲府市");
  });

  it("座標・番地だけは出さない", () => {
    expect(toPublicPlaceLabel("35.6631, 138.5683")).toBeNull();
    expect(toPublicPlaceLabel("lat: 35.66 lng: 138.56")).toBeNull();
    expect(toPublicPlaceLabel("丸の内1-6-1")).toBeNull();
    expect(toPublicPlaceLabel("神宮前1丁目")).toBeNull();
  });
});

describe("mapPinLabel", () => {
  it("場所があれば名前は出さず、場所が無ければ自分は現在地", () => {
    expect(mapPinLabel({ place: "山梨県甲府市", name: "君斗りんく", isSelf: true })).toBe("甲府市");
    expect(mapPinLabel({ place: "山梨", name: "君斗りんく", isSelf: true })).toBe("山梨");
    expect(mapPinLabel({ place: null, name: "君斗りんく", isSelf: true })).toBe("現在地");
    expect(mapPinLabel({ place: "35.66, 138.56", isSelf: true })).toBe("現在地");
  });

  it("他人は場所、無ければ短い名前。座標は名前にも出さない", () => {
    expect(mapPinLabel({ place: "渋谷区", name: "あおい", isSelf: false })).toBe("渋谷区");
    expect(mapPinLabel({ place: null, name: "あおい", isSelf: false })).toBe("あおい");
    expect(mapPinLabel({ place: null, name: "35.6631, 138.568", isSelf: false })).toBe("ユーザー");
  });
});
