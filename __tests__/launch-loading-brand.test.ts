// 起動直後の待機画面が、起動ベールと同じブランドの画面に寄っていることの契約テスト（ソース検査）。
// 経緯: iPhoneのホーム画面から開く(PWA)と、ベール → 無地 → 灰色の骨組み → 本編 と色の違う画面が
//       続いて「ちかちか」に見えた。灰色の骨組み(ChunkFallback)は寄せ忘れだった。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "..", "app/(tabs)/index.tsx"), "utf8");

describe("app/(tabs)/index.tsx の起動直後の待機画面", () => {
  it("ログイン済みヒントで認証待ちの間は、ブランドの待機画面（BrandLoadingScreen）を出す", () => {
    expect(src).toMatch(/import \{ BrandLoadingScreen \} from "@\/components\/atoms\/brand-loading-screen"/);
    expect(src).toMatch(/if \(hasClerkSessionHint\(\)\) \{\s*return <BrandLoadingScreen \/>;/);
  });

  it("灰色の骨組み（ChunkFallback）に戻っていない", () => {
    expect(src).not.toMatch(/import[^;]*ChunkFallback|<ChunkFallback/);
  });

  it("ゲストにはヒーローを即表示する（待機画面を挟まない）既存の挙動を保つ", () => {
    expect(src).toMatch(/return <PostGuestScreen \/>;\s*\}\s*if \(!isAuthenticated\)/);
  });
});

describe("タブ全体の待機も、ベールと同じブランドの待機画面（BrandLoadingScreen）", () => {
  const FULL_TAB_FILES = [
    "components/tabs/tab-authenticated-shell.tsx",
    "app/(tabs)/map.tsx",
    "app/(tabs)/mypage.tsx",
    "app/(tabs)/zukan.tsx",
  ];

  it.each(FULL_TAB_FILES)("%s は灰色の骨組み（ChunkFallback）を使わず BrandLoadingScreen を使う", (rel) => {
    const f = readFileSync(join(__dirname, "..", rel), "utf8");
    expect(f).toMatch(/import \{ BrandLoadingScreen \} from "@\/components\/atoms\/brand-loading-screen"/);
    expect(f).toMatch(/<BrandLoadingScreen \/>/);
    expect(f).not.toMatch(/import[^;]*ChunkFallback|<ChunkFallback/);
  });

  it("画面の一部の小さな待機（lazy-heavy-components）は、全画面にしないので ChunkFallback のまま", () => {
    const f = readFileSync(join(__dirname, "..", "lib/lazy-heavy-components.tsx"), "utf8");
    expect(f).toMatch(/<ChunkFallback minHeight=\{/);
  });
});

