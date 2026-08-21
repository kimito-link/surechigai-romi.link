/**
 * OGP画像に「現在地ピン」を出す条件を守る。
 *
 * 背景（2026-08-21 本番の画像を目視して発覚）:
 *   場所が解決できない共有URLでも、**日本地図の中央にピンが描かれていた**。
 *   ラベルは「日本のどこか」なのにマーカーが一点を指しており、
 *   **場所が分からないのに分かっているように見える**矛盾した絵だった。
 *
 * ★なぜ見逃されたか:
 *   判断が api/og.tsx の描画コードの中にあり、テストで守れなかった。
 *   OGP画像は `curl -I` が 200 / image/png を返すので配信確認では気づけず、
 *   **画像を落として目視するまで**分からない類の不具合
 *   （2026-08-19 の丸ピン未表示と同じ型）。
 *
 * ★守りたい失敗:
 *   1. 場所が分からないのにピンを打つ（＝嘘の一点を指す）
 *   2. 場所が分かっているのにピンを出さない（＝機能が死ぬ）
 */
import { describe, it, expect } from "vitest";
import { shouldShowLocationPin } from "@/lib/ogp/pin-visibility";

const base = {
  isNightScene: false,
  hasPrefPosition: false,
  hasStaticMap: false,
  hasTiles: false,
};

describe("ピンを出す（場所が言える）", () => {
  it("夜景で県が特定できたら出す", () => {
    // 県の位置に「灯」をともす経路。本番の既定はこちら。
    expect(
      shouldShowLocationPin({ ...base, isNightScene: true, hasPrefPosition: true }),
    ).toBe(true);
  });

  it("Static Map が取れたら出す（中心＝実座標）", () => {
    expect(shouldShowLocationPin({ ...base, hasStaticMap: true })).toBe(true);
  });

  it("OSMタイルが取れたら出す（中心＝実座標）", () => {
    expect(shouldShowLocationPin({ ...base, hasTiles: true })).toBe(true);
  });
});

describe("ピンを出さない（場所が言えない）", () => {
  it("夜景で県が特定できなければ出さない", () => {
    // これが本番で起きていた状態。「日本のどこか」なのにピンが立っていた。
    expect(
      shouldShowLocationPin({ ...base, isNightScene: true, hasPrefPosition: false }),
    ).toBe(false);
  });

  it("地図も県も無ければ出さない", () => {
    expect(shouldShowLocationPin(base)).toBe(false);
  });

  it("県名はあるが夜景でない場合、県だけを根拠にピンを打たない", () => {
    // 夜景以外では県の座標表(PREF_POS)を使わない。
    // 地図が無いのに県を根拠に中央へ打つと、また嘘の一点になる。
    expect(
      shouldShowLocationPin({ ...base, isNightScene: false, hasPrefPosition: true }),
    ).toBe(false);
  });
});

describe("実座標があるときは夜景かどうかに関わらず出す", () => {
  it("夜景でも Static Map があれば出す", () => {
    expect(
      shouldShowLocationPin({ ...base, isNightScene: true, hasStaticMap: true }),
    ).toBe(true);
  });
});
