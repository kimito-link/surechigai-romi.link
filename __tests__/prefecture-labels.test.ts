import { describe, it, expect } from "vitest";
import {
  prefectureShortLabel,
  prefectureBaseLabel,
} from "@/modules/encounter/core/prefecture-labels";

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

describe("prefectureBaseLabel", () => {
  it("「道」は接尾辞として省かない（北海道→北海道）", () => {
    expect(prefectureBaseLabel("北海道")).toBe("北海道");
  });

  it("都・府・県の接尾辞のみ省く", () => {
    expect(prefectureBaseLabel("京都府")).toBe("京都");
    expect(prefectureBaseLabel("東京都")).toBe("東京");
    expect(prefectureBaseLabel("長野県")).toBe("長野");
  });

  it("4文字県名は3文字になる（切り詰めない）", () => {
    expect(prefectureBaseLabel("神奈川県")).toBe("神奈川");
    expect(prefectureBaseLabel("和歌山県")).toBe("和歌山");
    expect(prefectureBaseLabel("鹿児島県")).toBe("鹿児島");
  });
});
