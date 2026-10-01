import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Service Worker が Next.js（apps/web）のアセットを素通しすることを固定する。
 *
 * ★なぜ実ファイル（public/sw.js）を読むのか:
 *   `lib/pwa/sw-routing.ts` にも同名の判定があるが、**本番で動くのは public/sw.js の方**。
 *   lib 側だけをテストすると「テストは緑なのに実物は直っていない」になる
 *   （このリポの既知の型: 緑なのに検査していない）。ここでは実物を読む。
 *
 * ★何を守るのか（2026-10-01・Web の Next.js 化 / strangler 移行）:
 *   移行したパスは別プロジェクト（surechigai-web）が応答する。その配下の
 *   `/_next/` を旧 Service Worker が握ると、**旧ビルドのチャンクを掴んだまま**になり
 *   「デプロイしたのに画面が変わらない」事故になる。
 *   `isJsBundlePath` は「.js で終わる」だけで判定するため、素通しが無いと
 *   `/_next/static/.../*.js` が networkFirstStrategy に入ってキャッシュされる。
 */
const SW_SOURCE = readFileSync(
  join(process.cwd(), "public", "sw.js"),
  "utf8",
);

/** fetch ハンドラ内で、その分岐が何行目に現れるか（見つからなければ -1）。 */
function lineOf(pattern: RegExp): number {
  const lines = SW_SOURCE.split(/\r?\n/);
  return lines.findIndex((l) => pattern.test(l));
}

describe("sw.js: Next.js アセットの素通し", () => {
  it("/_next/ の早期 return が存在する", () => {
    expect(lineOf(/url\.pathname\.startsWith\(["']\/_next\/["']\)/)).toBeGreaterThan(-1);
  });

  it("★/_next/ の分岐は isJsBundlePath より前にある（後ろだと手遅れ）", () => {
    const bypass = lineOf(/url\.pathname\.startsWith\(["']\/_next\/["']\)/);
    const jsBundle = lineOf(/if \(isJsBundlePath\(url\.pathname\)\)/);

    // 両方が実在することを先に確かめる（-1 同士の比較で偽の緑を作らない）
    expect(bypass).toBeGreaterThan(-1);
    expect(jsBundle).toBeGreaterThan(-1);
    expect(bypass).toBeLessThan(jsBundle);
  });

  it("既存の素通し（Clerk / API）を壊していない", () => {
    expect(lineOf(/startsWith\(["']\/__clerk\/["']\)/)).toBeGreaterThan(-1);
    expect(lineOf(/startsWith\(["']\/api\/["']\)/)).toBeGreaterThan(-1);
  });
});
