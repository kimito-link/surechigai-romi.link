import { describe, it, expect } from "vitest";
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  MAX_PROFILE_CATEGORIES,
  categoryLabel,
  isCategoryId,
  parseCategories,
  serializeCategories,
  sharedCategories,
} from "@/modules/encounter/core/category";

describe("カテゴリの語彙", () => {
  // ★「その他」を置かないのは設計判断。一致しても共通点を示さない値は
  //   「属性が合う」の意味を薄めるため。
  it("その他(other)を持たない", () => {
    expect(CATEGORY_IDS).not.toContain("other");
  });

  it("12件以下に収まっている", () => {
    expect(CATEGORY_IDS.length).toBeLessThanOrEqual(12);
  });

  it("重複が無い", () => {
    expect(new Set(CATEGORY_IDS).size).toBe(CATEGORY_IDS.length);
  });

  it("全 id に表示ラベルがある（ラベル漏れでチップが消えない）", () => {
    for (const id of CATEGORY_IDS) {
      expect(CATEGORY_LABELS[id]).toBeTruthy();
    }
  });

  it("id は ASCII snake_case（表記揺れを構造的に防ぐ）", () => {
    for (const id of CATEGORY_IDS) {
      expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe("parseCategories", () => {
  // ★語彙を減らしても古いデータで壊れないことが要件。
  it("未知の id は捨てる", () => {
    expect(parseCategories("seichi,unknown_id,camp")).toEqual([
      "seichi",
      "camp",
    ]);
  });

  it("空・null・undefined は空配列", () => {
    expect(parseCategories("")).toEqual([]);
    expect(parseCategories(null)).toEqual([]);
    expect(parseCategories(undefined)).toEqual([]);
  });

  it("前後の空白を無視し、重複を除く", () => {
    expect(parseCategories(" seichi , seichi , camp ")).toEqual([
      "seichi",
      "camp",
    ]);
  });
});

describe("serializeCategories", () => {
  it("重複を除き max 件で切る", () => {
    const out = serializeCategories(
      ["seichi", "seichi", "camp", "gourmet", "onsen"],
      MAX_PROFILE_CATEGORIES,
    );
    expect(out.split(",")).toHaveLength(MAX_PROFILE_CATEGORIES);
  });

  it("未知 id を捨てる（呼び出し側の検証漏れを吸収する）", () => {
    expect(serializeCategories(["seichi", "<script>", "camp"], 3)).toBe(
      "seichi,camp",
    );
  });

  it("空配列は空文字", () => {
    expect(serializeCategories([], 3)).toBe("");
  });
});

describe("sharedCategories", () => {
  // ★「属性が合う」の判定はこれだけ。相性スコアは作らない。
  it("交わりだけを返す", () => {
    expect(sharedCategories(["seichi", "camp"], ["camp", "onsen"])).toEqual([
      "camp",
    ]);
  });

  it("交わりが無ければ空配列", () => {
    expect(sharedCategories(["seichi"], ["onsen"])).toEqual([]);
  });

  it("未知 id は一致に数えない", () => {
    expect(sharedCategories(["unknown_x"], ["unknown_x"])).toEqual([]);
  });

  it("順序は第1引数に揃う（表示順が呼び出しで揺れない）", () => {
    expect(
      sharedCategories(["camp", "seichi"], ["seichi", "camp"]),
    ).toEqual(["camp", "seichi"]);
  });
});

describe("categoryLabel / isCategoryId", () => {
  it("未知 id は空文字（チップを描かない合図）", () => {
    expect(categoryLabel("unknown_id")).toBe("");
  });

  it("既知 id はラベルを返す", () => {
    expect(categoryLabel("seichi")).toBe("聖地巡礼");
  });

  it("isCategoryId は文字列以外を弾く", () => {
    expect(isCategoryId(null)).toBe(false);
    expect(isCategoryId(123)).toBe(false);
    expect(isCategoryId({})).toBe(false);
  });
});
