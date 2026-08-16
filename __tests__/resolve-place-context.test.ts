/**
 * 「いまの様子」バーがどの場所を見せるかの回帰テスト。
 *
 * ★2026-08-16: 判断を JSX の中に書いていたため、
 * 「足あとが0件だと機能ごと画面から消える」状態に長く気づけなかった。
 * データが無いと機能が消えるのは、ユーザーから見れば機能が無いのと同じ。
 * 条件をここで固定する。
 */
import { describe, it, expect } from "vitest";
import { resolvePlaceContext } from "@/lib/place-context/resolve-place-context";

describe("いまの様子バーの場所決定", () => {
  it("自分の足あとがあればその県と市区町村を使う", () => {
    expect(
      resolvePlaceContext({ prefecture: "長野県", municipality: "岡谷市" }),
    ).toEqual({ prefecture: "長野県", municipality: "岡谷市", isFallback: false });
  });

  it("足あとが無くてもフォールバック県があれば消えない（機能ごと消さない）", () => {
    const r = resolvePlaceContext({ prefecture: null, fallbackPrefecture: "長野県" });
    expect(r.prefecture).toBe("長野県");
    expect(r.isFallback).toBe(true);
  });

  it("フォールバック時は自分の市区町村を引き継がない（他人の県に自分の市名を混ぜない）", () => {
    const r = resolvePlaceContext({
      prefecture: null,
      municipality: "岡谷市",
      fallbackPrefecture: "北海道",
    });
    expect(r.prefecture).toBe("北海道");
    expect(r.municipality).toBeNull();
  });

  it("自分の足あとがあるときはフォールバックを使わない", () => {
    const r = resolvePlaceContext({
      prefecture: "東京都",
      fallbackPrefecture: "長野県",
    });
    expect(r.prefecture).toBe("東京都");
    expect(r.isFallback).toBe(false);
  });

  it("場所が全く無いときだけ何も出さない", () => {
    expect(resolvePlaceContext({})).toEqual({
      prefecture: null,
      municipality: null,
      isFallback: false,
    });
  });

  it("空文字や空白だけの値は「無い」として扱う（DB由来の空文字で誤動作しない）", () => {
    const r = resolvePlaceContext({ prefecture: "  ", fallbackPrefecture: "長野県" });
    expect(r.prefecture).toBe("長野県");
    expect(r.isFallback).toBe(true);

    expect(resolvePlaceContext({ prefecture: "", fallbackPrefecture: "" }).prefecture).toBeNull();
  });

  it("フォールバックで見せているときは必ず判別できる（断り書きを出すため）", () => {
    // isFallback が false のまま他人の県を出すと「自分の現在地」と誤解される
    const own = resolvePlaceContext({ prefecture: "長野県" });
    const fb = resolvePlaceContext({ prefecture: null, fallbackPrefecture: "長野県" });
    expect(own.isFallback).toBe(false);
    expect(fb.isFallback).toBe(true);
  });
});
