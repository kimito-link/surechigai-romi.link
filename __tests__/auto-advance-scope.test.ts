// ワンタップXのフォールバック検索が Clerk の UI の中だけであることの契約テスト（ソース検査）。
// 経緯: exosome の本番で、ページ自身の「X でログイン」ボタンを拾って合成クリックし、openSignIn に再入していた。
// 正本: web-ios-android/templates/web/auth-mode/ の x-one-tap-signin.js.example と nextjs/AutoAdvanceToX.tsx.example
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

describe.each([
  ["apps/web/components/AutoAdvanceToX.tsx"],
  ["components/auth/auto-advance-to-x.tsx"],
])("%s のフォールバック検索", (rel) => {
  const src = readFileSync(join(ROOT, rel), "utf8");

  it("Clerk の UI の中だけを探す（ページ自身のXボタンを拾わない）", () => {
    expect(src).toMatch(/document\.querySelector<HTMLElement>\(\s*"\.cl-rootBox, \.cl-modalBackdrop, \.cl-signIn-root"/);
    expect(src).toMatch(/if \(!scope\) return null;/);
    expect(src).toMatch(/scope\.querySelectorAll<HTMLElement>\(\s*"button, a, \[role='button'\]"/);
  });

  it("ページ全体の総当たりに戻っていない", () => {
    expect(src).not.toMatch(/document\.querySelectorAll<HTMLElement>\(\s*"button, a, \[role='button'\]"/);
  });
});
