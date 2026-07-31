import { describe, it, expect } from "vitest";
import {
  cleanUserText,
  buildModerationTarget,
} from "@/modules/encounter/core/user-text";

describe("cleanUserText", () => {
  it("前後の空白を落とす", () => {
    expect(cleanUserText("  岡谷駅前  ")).toBe("岡谷駅前");
  });

  it("空文字・空白だけ・undefined・null は null", () => {
    expect(cleanUserText("")).toBeNull();
    expect(cleanUserText("   ")).toBeNull();
    expect(cleanUserText("　　")).toBeNull(); // 全角スペースのみ
    expect(cleanUserText(undefined)).toBeNull();
    expect(cleanUserText(null)).toBeNull();
  });

  it("NFKC 正規化する（全角英数・半角カナを揃える）", () => {
    expect(cleanUserText("ＡＢＣ")).toBe("ABC");
    expect(cleanUserText("ﾗｰﾒﾝ")).toBe("ラーメン");
  });
});

describe("buildModerationTarget", () => {
  it("複数欄を1本に連結する", () => {
    expect(buildModerationTarget("岡谷SS", "レギュラー153円")).toBe(
      "岡谷SS レギュラー153円",
    );
  });

  it("空の欄は無視する", () => {
    expect(buildModerationTarget("岡谷SS", "")).toBe("岡谷SS");
    expect(buildModerationTarget(null, "メモだけ")).toBe("メモだけ");
    expect(buildModerationTarget("  ", "メモだけ")).toBe("メモだけ");
  });

  it("全欄が空なら null（呼び出し側はモデレーションを省略できる）", () => {
    expect(buildModerationTarget()).toBeNull();
    expect(buildModerationTarget(null, undefined, "")).toBeNull();
    expect(buildModerationTarget("　", "  ")).toBeNull();
  });

  it("連結した結果に NG ワードが含まれれば検出対象になる", async () => {
    const { moderateText } = await import(
      "@/modules/encounter/core/moderation"
    );
    const target = buildModerationTarget("店の名前", "LINE交換しませんか");
    expect(target).not.toBeNull();
    const result = await moderateText(target!, {});
    expect(result.rejected).toBe(true);
    expect(result.stage).toBe("ng_word");
  });
});
