import { describe, expect, it } from "vitest";
import {
  classifyLocationToPrefectureName,
  extractPrefectureName,
  isValidPrefectureName,
  nearestPrefectureName,
} from "../modules/encounter/core/prefecture-classify.js";

describe("prefecture-classify", () => {
  it("isValidPrefectureName は 47 都道府県のみ true", () => {
    expect(isValidPrefectureName("長野県")).toBe(true);
    expect(isValidPrefectureName("長野")).toBe(false);
  });

  it("extractPrefectureName は municipality 先頭から県名を取る", () => {
    expect(extractPrefectureName("長野県松本市")).toBe("長野県");
    expect(extractPrefectureName("東京都渋谷区")).toBe("東京都");
  });

  it("nearestPrefectureName は座標から最寄り県を返す", () => {
    expect(nearestPrefectureName(36.651, 138.181)).toBe("長野県");
  });

  it("classifyLocationToPrefectureName は prefecture 列を優先", () => {
    expect(
      classifyLocationToPrefectureName("長野県", "千葉県美浜区", 35.6, 140.1),
    ).toBe("長野県");
  });

  it("prefecture 列が NULL でも municipality / 座標で分類", () => {
    expect(
      classifyLocationToPrefectureName(null, "長野県松本市", null, null),
    ).toBe("長野県");
    expect(classifyLocationToPrefectureName(null, null, 36.651, 138.181)).toBe(
      "長野県",
    );
  });
});
