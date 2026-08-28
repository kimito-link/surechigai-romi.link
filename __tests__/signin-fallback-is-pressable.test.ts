/**
 * ★iOS build 529 却下（Guideline 2.1(a)・2026-08-28）の再発防止。
 *
 *   審査コメント: "we were unable to tap Apple and X sign in as it was greyed out"
 *   審査端末: iPad Air 11-inch (M3) / iPadOS 26.6.1
 *
 * ■ ★真因
 *   app/sign-in.tsx は `isAuthReady ? <ClerkSignIn/> : <ClerkMountFallback/>` で分岐する。
 *   ★`isAuthReady` は clerkIsLoaded そのもので**上限が無い**
 *   （上限つきの `isAuthReadyForUI` は 1000ms で true になるが、これは別の信号）。
 *
 *   その待ち側に描いていた ClerkMountFallback が、
 *   「gray100 の箱・gray400 の文字・opacity 0.85」＝**灰色の無効ボタンそのものの見た目**で、
 *   しかも Pressable ですらない ただの View だった。
 *   ⟹ Clerk の解決が遅い/失敗すると、灰色の押せない箱が残り続ける。
 *   ★審査は初回起動＝キャッシュ空なので、ここに入りやすい。
 *
 * ■ ★このテストが守る不変条件
 *   「認証の準備ができていない間に見せる画面」も、
 *   **押せる X と Apple のボタンが並んでいる**こと。
 *   ★押せない見た目を作らない（520 で永久 disabled の詰みを作りかけた）。
 *   ★無言にもしない（521 は押しても何も起きなかった）。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

/**
 * ★コメントを剥がしてから判定する。
 *
 * 剥がさないと「disabled にしない」と**説明したコメント自体**が違反として拾われる
 * （このテストを書いた直後に実際に踏んだ）。
 * ★このリポで繰り返し出る型: 弱い印は両方向に壊れる。
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|\s)\/\/.*$/, "$1"))
    .join("\n");
}

const FALLBACK = stripComments(read("components/auth/clerk-mount-fallback.tsx"));

describe("★準備中の画面も押せる（529 却下の再発防止）", () => {
  it("Pressable で描いている（飾りの View にしない）", () => {
    expect(FALLBACK).toMatch(/<Pressable/);
    // ★押した先が実際にログインへ繋がっていること
    expect(FALLBACK).toMatch(/onPress=\{\(\)\s*=>\s*login\(/);
  });

  it("★X と Apple が両方ある（4.8 と 2.1(a) を同時に満たす）", () => {
    expect(FALLBACK).toMatch(/login\([^)]*"x"\)/);
    expect(FALLBACK).toMatch(/login\([^)]*"apple"\)/);
  });

  it("★灰色で無効に見える見た目を作らない", () => {
    // 却下時の実装が持っていた印。これらが戻ったら赤にする。
    expect(FALLBACK).not.toMatch(/opacity:\s*0\.85/);
    expect(FALLBACK).not.toMatch(/backgroundColor:\s*palette\.gray100/);
    // ★押せない指定を入れない
    expect(FALLBACK).not.toMatch(/\bdisabled\b/);
    expect(FALLBACK).not.toMatch(/pointerEvents:\s*"none"/);
  });

  it("★アクセシビリティ上もボタンとして見える（審査員の支援技術対策）", () => {
    // 却下時は accessibilityElementsHidden で存在ごと隠していた。
    expect(FALLBACK).not.toMatch(/accessibilityElementsHidden/);
    expect(FALLBACK).not.toMatch(/importantForAccessibility="no-hide-descendants"/);
    expect(FALLBACK).toMatch(/accessibilityRole="button"/);
  });
});
