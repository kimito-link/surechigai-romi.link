/**
 * ★「いまの様子」と言ってよいのは、その市区町村で当たったときだけ。
 *
 * 2026-08-23 の実害: 茅野市にいる人に「【ライブ配信】長野市内の様子」を出していた。
 * ★直線距離 73km。市区町村で見つからないと都道府県で引き直す仕組みのため、
 * 「長野市」の配信が「長野県」の名前で一致していた。
 */
import { describe, expect, it } from "vitest";
import {
  isSameCityStream,
  liveStreamProximityLabel,
} from "../lib/live-camera/live-stream-pick";

describe("配信が「その場所のもの」か判定する", () => {
  it("★市区町村で当たったものだけ「いまの様子」", () => {
    expect(isSameCityStream("伊那市", "伊那市")).toBe(true);
    expect(liveStreamProximityLabel("伊那市", "伊那市")).toBe("いまの様子");
  });

  it("★県で当たったものは「いまの様子」と名乗らせない（73km先の実害）", () => {
    expect(isSameCityStream("長野県", "茅野市")).toBe(false);
    expect(liveStreamProximityLabel("長野県", "茅野市")).toBe("県内の様子");
  });

  it("接尾辞の違いは同じ場所として扱う（茅野市 と 茅野）", () => {
    expect(isSameCityStream("茅野", "茅野市")).toBe(true);
  });

  it("値が欠けているときは near と言わない（fail-closed）", () => {
    expect(isSameCityStream(null, "茅野市")).toBe(false);
    expect(isSameCityStream("茅野市", undefined)).toBe(false);
    expect(isSameCityStream("", "")).toBe(false);
  });
});
