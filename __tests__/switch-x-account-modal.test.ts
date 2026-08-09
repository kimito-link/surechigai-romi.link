import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Xアカウント切り替えモーダルの不変条件をソース文字列で固定する。
 *
 * なぜ描画テストではなくソース検査なのか:
 *   このコンポーネントは expo-image / expo-haptics / react-native の Modal に依存し、
 *   vitest(jsdom) では描画できない（既存の clerk-auth-bridge テストと同じ制約）。
 *   一方で守りたいのは**描画結果ではなく「何を呼ばないか」**なので、
 *   ソースを読んで禁止パターンの不在を確認するのが確実で、しかも壊れにくい。
 *   同種の先例: __tests__/expo-web-types-tracked.test.ts
 */
/**
 * コメントを同じ長さの空白に潰す（行番号と位置関係は保つ）。
 *
 * なぜ必要か（実際に踏んだ）:
 *   このファイルのコメントは「redirect_after_logout は絶対に付けない」「await を挟むと
 *   ポップアップブロックされる」と**禁止パターン名を引用して教訓を残している**。
 *   素のソースを検査すると、その引用に反応して**実装は正しいのにテストが落ちる**。
 *   引用をやめると教訓が失われるので、検査側でコメントを除くのが正しい。
 *   同じ判断を scripts/check-tracked-imports.mjs でもしている。
 */
function stripComments(text: string): string {
  return (
    text
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      // 直前が `:` のときはコメントではなく URL のスキーム区切り（https://…）。
      // これを潰すと "https://x.com/logout" ごと消えてテストが誤って落ちる（実際に踏んだ）。
      .replace(/(^|[^:])\/\/[^\n]*/g, (m, keep: string) =>
        keep + " ".repeat(m.length - keep.length),
      )
  );
}

describe("switch-x-account-modal の安全性", () => {
  const raw = readFileSync(
    join(__dirname, "..", "components", "auth", "switch-x-account-modal.tsx"),
    "utf8",
  );
  // 実行コードだけを検査対象にする（コメント内の禁止パターン引用に反応しないため）。
  const src = stripComments(raw);

  describe("本番を落とさないための制約", () => {
    it("Clerk の React フックを直接呼ばない", () => {
      // ClerkProvider は動的 import されるため、chunk 解決前にこれらを呼ぶと
      // 「useUser can only be used within the <ClerkProvider />」でアプリ全体が落ちる。
      // 2026-07-31 と 08-01 に2度、本番が白画面になった経路。
      // 現在の @handle と twitterId は独自 useAuth() の user から取ること。
      expect(src).not.toMatch(/from\s+["']@clerk\//);
      expect(src).not.toMatch(/\buseUser\s*\(/);
      expect(src).not.toMatch(/\buseClerk\s*\(/);
    });
  });

  describe("Xのログアウト誘導", () => {
    it("redirect_after_logout を付けない", () => {
      // 技術的には動くが、未修正のオープンリダイレクト脆弱性として報告されているもの。
      // フィッシング悪用経路であり、塞がれた瞬間にこの導線も壊れる。
      expect(src).not.toContain("redirect_after_logout");
    });

    it("x.com のログアウトURLをそのまま使う", () => {
      expect(src).toContain("https://x.com/logout");
    });

    it("window.open をタップハンドラ内で同期的に呼ぶ（await を挟まない）", () => {
      // 非同期処理の後に window.open するとポップアップブロックされる（既知の地雷）。
      // handleOpenXLogout の中に await が現れないことを確認する。
      const fn = src.slice(
        src.indexOf("const handleOpenXLogout"),
        src.indexOf("const handleProceed"),
      );
      expect(fn.length).toBeGreaterThan(0);
      expect(fn).toContain("window.open");
      expect(fn).not.toMatch(/\bawait\b/);
    });
  });

  describe("足あとが消えたと誤解させない", () => {
    it("操作前に保全を約束する文言がある", () => {
      // このアプリの中核価値は足あとの永続保存。ログアウトを伴う操作の前に
      // 「消えません」と明言しないと、中核価値が失われたと受け取られる。
      expect(src).toContain("足あとはそのまま残ります");
      expect(src).toContain("消えません");
    });

    it("セッション破棄より前にスナップショットを取る", () => {
      // 帰還後に「本当に切り替わったか」を判定するための記録。
      // openLoginGuide（この中で signOut が走る）より前に書かないと記録が残らない。
      const proceed = src.slice(src.indexOf("const handleProceed"));
      const snapshotAt = proceed.indexOf("writeSnapshot");
      const loginAt = proceed.indexOf("openLoginGuide");
      expect(snapshotAt).toBeGreaterThan(-1);
      expect(loginAt).toBeGreaterThan(-1);
      expect(snapshotAt).toBeLessThan(loginAt);
    });

    it("切り替えは mode:\"switch\" で呼ぶ（auto=x を外す経路）", () => {
      // mode を渡さないと auto=x 付きの通常ログイン経路に入り、
      // X の認可が素通りして同じアカウントで戻ってくる。
      expect(src).toMatch(/mode:\s*["']switch["']/);
    });
  });

  describe("誤った結果表示を出さない", () => {
    it("スナップショットは読んだら消す（ワンショット）", () => {
      expect(src).toContain("removeItem");
    });

    it("期限切れのスナップショットは使わない", () => {
      expect(src).toContain("SNAPSHOT_TTL_MS");
    });
  });
});
