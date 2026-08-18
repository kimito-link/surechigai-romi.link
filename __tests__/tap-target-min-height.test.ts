/**
 * 主要な押下要素が Apple HIG の下限 44px を満たすことを固定する。
 *
 * なぜ必要か（2026-08-19・本番実測 375px 幅）:
 *   タブバーの item が実測 61x24px、天気/ライブカメラのボタンが 106x32px しか無かった。
 *   どちらも主要導線なのに押しにくい状態で、型チェックもテストも素通りしていた。
 *
 * kimitolink-linktree の ca8f327 と同型の穴。あちらでは
 * 「テストが別コンポーネント(Header.tsx)を見ていたので一度も落ちなかった」
 * という silent green が起きていた。ここでは**実際に直したファイルそのもの**を読む。
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/** style オブジェクト名の直後のブロックから minHeight の値を取る。 */
function minHeightOf(source: string, styleName: string): number | null {
  const start = source.indexOf(`${styleName}: {`);
  if (start === -1) return null;
  const block = source.slice(start, start + 600);
  const m = block.match(/minHeight:\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

const HIG_MIN = 44;

describe("押下領域は 44px 以上", () => {
  it("固定タブバーの item（ポスト/チェックイン/集まり…）", () => {
    const src = read("components/organisms/web-fixed-tab-bar.tsx");
    const h = minHeightOf(src, "item");
    expect(h, "web-fixed-tab-bar の item に minHeight が無い").not.toBeNull();
    expect(h!).toBeGreaterThanOrEqual(HIG_MIN);
  });

  it("ヘッダーのホーム導線（compact でアイコンだけになる）", () => {
    const src = read("components/brand/brand-home-link.tsx");
    const h = minHeightOf(src, "hitArea");
    expect(h, "brand-home-link の hitArea に minHeight が無い").not.toBeNull();
    expect(h!).toBeGreaterThanOrEqual(HIG_MIN);
  });

  it("タグライン行のホーム導線", () => {
    const src = read("components/brand/brand-home-link.tsx");
    const h = minHeightOf(src, "taglineHit");
    expect(h, "brand-home-link の taglineHit に minHeight が無い").not.toBeNull();
    expect(h!).toBeGreaterThanOrEqual(HIG_MIN);
  });

  it("ゲストトップの紹介ページリンク", () => {
    const src = read("components/post/post-guest-screen.tsx");
    const h = minHeightOf(src, "marketingLink");
    expect(h, "post-guest-screen の marketingLink に minHeight が無い").not.toBeNull();
    expect(h!).toBeGreaterThanOrEqual(HIG_MIN);
  });

  it("天気・ライブカメラのボタン", () => {
    const src = read("components/molecules/place-context-bar.tsx");
    const h = minHeightOf(src, "liveButton");
    expect(h, "place-context-bar の liveButton に minHeight が無い").not.toBeNull();
    expect(h!).toBeGreaterThanOrEqual(HIG_MIN);
  });
});
