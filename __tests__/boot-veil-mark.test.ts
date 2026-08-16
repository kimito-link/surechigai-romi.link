/**
 * ブートベール（PWA起動画面）のマーク画像に関する回帰テスト。
 *
 * 背景（2026-08-16 iOS実機PWAの録画で判明）:
 * 起動が「灰色 → 無地＋タブバーだけ → 本体」と流れ、起動画面の絵が一度も出なかった。
 * 原因は参照先が /lp/img/chara/link.png = 1500x1500 / 500KB で、表示は最大260pxなのに
 * 6倍の解像度を起動直後に読ませていたこと。読み終わる前にベールが外れて絵が出ない。
 *
 * ここで守りたい失敗:
 *   1. 起動画面の画像が重くなる（また間に合わなくなる）
 *   2. preload / fetchpriority が外れる（最優先で取りに行かなくなる）
 *   3. 参照先がうっかり元の巨大画像に戻る
 */
import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");
const MARK_PATH = resolve(ROOT, "public/boot-mark.png");

/** 起動直後に読ませてよい上限。これを超えるとベール解除に間に合わなくなる。 */
const MAX_MARK_KB = 60;

describe("ブートベールのマーク画像", () => {
  it("実体が存在する（参照だけ書いてファイルが無い、を防ぐ）", () => {
    expect(() => statSync(MARK_PATH)).not.toThrow();
  });

  it(`起動に間に合う軽さ（${MAX_MARK_KB}KB以下）`, () => {
    const kb = statSync(MARK_PATH).size / 1024;
    expect(kb).toBeLessThanOrEqual(MAX_MARK_KB);
  });

  it("ベールは /boot-mark.png を参照している", () => {
    expect(HTML_SRC).toContain('src="/boot-mark.png"');
  });

  it("巨大な元画像(/lp/img/chara/link.png)をベールで使っていない", () => {
    // 経緯を書いたコメントには出てくるので、src/href 属性としての使用だけを見る
    // （LP本体での利用は別ファイルなのでここでは対象外）
    expect(HTML_SRC).not.toMatch(/(?:src|href)="\/lp\/img\/chara\/link\.png"/);
  });

  it("head で preload している（Reactマウント前に取り始める）", () => {
    expect(HTML_SRC).toMatch(/rel="preload"[^>]*href="\/boot-mark\.png"/);
  });

  it("最優先で取りに行く指定がある", () => {
    expect(HTML_SRC).toContain('fetchpriority="high"');
  });
});
