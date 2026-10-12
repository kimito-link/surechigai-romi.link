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
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { BOOT } from "../theme/tokens/boot";
import { BOOT_MARK_DATA_URI, BOOT_MARK_SOURCE_SHA256 } from "../theme/tokens/boot-mark-data";

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

  it("ベールは、マークを CSS の背景画像（data URI で埋め込み）として持っている", () => {
    /* ★2026-08-17: <img> をやめて CSS 背景画像にした。
       <img> だと React が全ページの <head> に preload を自動生成し、
       ベールが display:none の通常訪問でも 27KB を取りに行っていたため
       （Lighthouse: offscreen-images）。背景画像は表示時にだけ読まれる。
       ★2026-10-12: さらに外部ファイルをやめ、data URI を CSS に直接埋め込んだ。実機の起動録画 10 回中 4 回、
       OS の起動画面→ベールの切り替わりでアイコンが 15〜109ms 消えていた（外部ファイルの取得が最初の描画に
       間に合わない）。静的 preload（media 付き）では頻度が変わらなかったため。 */
    expect(HTML_SRC).toContain('background-image: url("${BOOT_MARK_DATA_URI}")');
    // 外部ファイルの URL を背景画像に直接書かない（待機画面・動的 preload 用の BOOT.markSrc は別用途）
    expect(HTML_SRC).not.toContain('background-image: url("${BOOT.markSrc}")');
    expect(BOOT.markSrc).toBe("/boot-mark.png");
    // img に戻すと preload が復活するので、src 属性では持たないこと
    expect(HTML_SRC).not.toContain('src="/boot-mark.png"');
  });

  it("埋め込みの data URI は WebP で、HTML の増分に予算がある（40KB 以下）", () => {
    // 全訪問者の HTML に入る。大きくなりすぎると通常訪問が遅くなる（約31KB。2026-10-12 時点）
    expect(BOOT_MARK_DATA_URI.startsWith("data:image/webp;base64,")).toBe(true);
    expect(BOOT_MARK_DATA_URI.length / 1024).toBeLessThanOrEqual(40);
  });

  it("埋め込みは public/boot-mark.png と同期している（PNG を変えたら gen-boot-mark-data を再実行）", () => {
    const sha = createHash("sha256").update(readFileSync(MARK_PATH)).digest("hex");
    expect(BOOT_MARK_SOURCE_SHA256).toBe(sha);
  });

  it("★data URI のモジュールを import してよいのは app/+html.tsx だけ（クライアントのバンドルに入れない）", () => {
    // 入ると全員の JS が約31KB 増える。+html.tsx は Node 側の静的レンダリング専用でバンドルされない。
    const offenders: string[] = [];
    const skip = new Set(["node_modules", ".git", ".expo", "dist", ".vercel", "apps", "line-bot", ".claude"]);
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (skip.has(name)) continue;
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) {
          const rel = p.slice(ROOT.length + 1).replace(/\\/g, "/");
          if (rel === "theme/tokens/boot-mark-data.ts" || rel === "scripts/gen-boot-mark-data.mjs") continue;
          if (rel.startsWith("__tests__/")) continue;
          if (readFileSync(p, "utf8").includes("boot-mark-data")) offenders.push(rel);
        }
      }
    };
    walk(ROOT);
    expect(offenders).toEqual(["app/+html.tsx"]);
  });

  it("巨大な元画像(/lp/img/chara/link.png)をベールで使っていない", () => {
    // 経緯を書いたコメントには出てくるので、src/href 属性としての使用だけを見る
    // （LP本体での利用は別ファイルなのでここでは対象外）
    expect(HTML_SRC).not.toMatch(/(?:src|href)="\/lp\/img\/chara\/link\.png"/);
  });

  it("preload は「ベールを出すと決めたとき」だけ動的に挿す", () => {
    /* ★2026-08-17: 静的な <link rel="preload"> にしていたため、ベールが出ない
       未ログインの通常訪問でも 27KB を最優先で取りに行っていた
       （Lighthouse: offscreen-images 27KB / uses-responsive-images 6KB）。
       判定スクリプト内（h||pwa が真のとき）で挿すようにした。 */
    /* JSX として静的な <link rel="preload" ... /> を書いていないこと。
       経緯を説明するコメント内には文字列として出てくるので、
       JSX 要素の形（末尾が /> で閉じる link タグ）だけを見る。 */
    expect(HTML_SRC).not.toMatch(
      /<link\s+rel="preload"\s+as="image"\s+href="\/boot-mark\.png"[^>]*\/>/,
    );

    const script = HTML_SRC.slice(
      HTML_SRC.indexOf("var pwa=false"),
      HTML_SRC.indexOf("data-auth-boot", HTML_SRC.indexOf("var pwa=false")),
    );
    // 条件が真になった側のブロックで preload を挿していること
    expect(script).toContain('pl.rel="preload"');
    expect(script).toContain('${BOOT.markSrc}');
  });

  it("アイコンは画面中央に固定され、OS の起動画面と同じ大きさ（55vw）で、タイトルの有無で動かない", () => {
    /* ★2026-10-12 Android 実機の録画: OS の起動画面のアイコン = 幅55.3% / 縦中心49.9%。
       ベールは 44% / 約45%（タイトル+スピナーと一緒に中央寄せで上へ押し上がっていた）で、
       切り替わりでアイコンが飛んでいた。 */
    // 値そのもの（OS の起動画面に合わせた実測値）は BOOT.markSize に1か所だけ。+html.tsx は参照する。
    expect(BOOT.markSize).toBe("clamp(160px, 55vw, 260px)");
    expect(HTML_SRC).toContain("--romi-boot-mark: ${BOOT.markSize}");
    const chara = HTML_SRC.slice(
      HTML_SRC.indexOf("#romi-boot-veil .romi-boot-chara {"),
      HTML_SRC.indexOf("}", HTML_SRC.indexOf("#romi-boot-veil .romi-boot-chara {")),
    );
    expect(chara).toContain("position: absolute");
    expect(chara).toContain("top: 50%");
    expect(chara).toContain("left: 50%");
    expect(chara).toContain("translate(-50%, -50%)");
    // タイトル+スピナーは別枠（アイコンの位置に影響させない）
    expect(HTML_SRC).toContain('className="romi-boot-meta"');
  });

  it("最優先で取りに行く指定がある", () => {
    expect(HTML_SRC).toContain('fetchpriority');
  });
});
