import { describe, it, expect } from "vitest";
import { prefectureShortLabel } from "@/modules/encounter/core/prefecture-labels";

describe("prefectureShortLabel", () => {
  it("4文字県名を切らず短縮表記にする", () => {
    expect(prefectureShortLabel("神奈川県")).toBe("神奈");
    expect(prefectureShortLabel("和歌山県")).toBe("和歌");
    expect(prefectureShortLabel("鹿児島県")).toBe("鹿児");
  });

  it("3文字以下はそのまま", () => {
    expect(prefectureShortLabel("東京都")).toBe("東京");
    expect(prefectureShortLabel("長野県")).toBe("長野");
  });
});
