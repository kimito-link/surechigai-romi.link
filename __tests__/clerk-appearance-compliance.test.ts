import { describe, expect, it } from "vitest";

import { kimitoClerkAppearance } from "../lib/clerk-appearance";
import { kimitoJaJP } from "../lib/clerk-localization";

/**
 * ログインボタンの Apple / Google 規約準拠を固定する。
 *
 * 背景（kimitolink-linktree 4229014 の調査結果を輸入・2026-08-09）:
 *   旧実装は「X を大きく・Apple/Google を小さく薄く(opacity 0.7〜0.85)」していたが、
 *   これは両社の公式規約に正面から抵触していた:
 *     Apple HIG: "Make a Sign in with Apple button **no smaller than** other sign-in buttons"
 *     Google:    "at least as prominently ... approximately the same size and similar visual weight"
 *   しかも規約リスクを負いながら事故は防げていなかった。Google の「最後に使用したもの」
 *   バッジは Google 側が描画するため、こちらのボタンサイズでは打ち消せないため。
 *
 * なぜテストが要るか:
 *   規約違反は**動作としては壊れない**（見た目が変わるだけでログインは通る）。
 *   型チェックでもE2Eでも検出できず、審査で指摘されて初めて分かる種類の欠陥。
 *   「X を目立たせたい」という真っ当な動機で簡単に戻せてしまうので、機械で固定する。
 *
 * 主役化は規約が縛らない自由度（色・順序・ボタン外の説明文）だけで行う。
 */
describe("ログインボタンの Apple/Google 規約準拠", () => {
  const el = kimitoClerkAppearance.elements as Record<string, Record<string, unknown>>;

  const blockButtons = {
    x: el.socialButtonsBlockButton__x,
    twitter: el.socialButtonsBlockButton__twitter,
    apple: el.socialButtonsBlockButton__apple,
    google: el.socialButtonsBlockButton__google,
  };
  const iconButtons = {
    x: el.socialButtonsIconButton__x,
    twitter: el.socialButtonsIconButton__twitter,
    apple: el.socialButtonsIconButton__apple,
    google: el.socialButtonsIconButton__google,
  };

  describe("サイズ・視覚的重みが3プロバイダで同一", () => {
    it("ブロック形態の高さが全て同じ (Apple: no smaller than)", () => {
      const heights = Object.values(blockButtons).map((b) => b.minHeight);
      expect(new Set(heights).size).toBe(1);
      expect(heights[0]).toBeTruthy();
    });

    it("ブロック形態の文字サイズ・太さが全て同じ (Google: similar visual weight)", () => {
      expect(new Set(Object.values(blockButtons).map((b) => b.fontSize)).size).toBe(1);
      expect(new Set(Object.values(blockButtons).map((b) => b.fontWeight)).size).toBe(1);
    });

    it("アイコン形態（フォールバック）も同寸法", () => {
      // socialButtonsVariant:"blockButton" で通常は使われないが、Clerk 側の都合で
      // 落ちても規約違反にならないようにしておく。
      expect(new Set(Object.values(iconButtons).map((b) => b.height)).size).toBe(1);
      expect(new Set(Object.values(iconButtons).map((b) => b.minWidth)).size).toBe(1);
    });

    it("opacity で薄くしているボタンが無い", () => {
      // 旧実装は Apple/Google を opacity 0.7〜0.85 にしていた。これが
      // "at least as prominently" 違反の本体。
      for (const [name, btn] of Object.entries({ ...blockButtons, ...iconButtons })) {
        expect(btn.opacity, `${name} に opacity が指定されている`).toBeUndefined();
      }
    });

    it("transform で拡大しているボタンが無い", () => {
      // 旧実装は X アイコンを transform:scale(1.06) で拡大していた。
      for (const [name, btn] of Object.entries({ ...blockButtons, ...iconButtons })) {
        expect(btn.transform, `${name} に transform が指定されている`).toBeUndefined();
      }
    });
  });

  describe("規約が縛らない自由度で主役化する", () => {
    it("X は色（Xブランドの黒）で主役を示す", () => {
      expect(blockButtons.x.backgroundColor).toBe("#0f1419");
      // Apple/Google は白ベース。Apple の黒ボタンと紛らわしくしない（HIG が許容）。
      expect(blockButtons.apple.backgroundColor).toBe("#ffffff");
      expect(blockButtons.google.backgroundColor).toBe("#ffffff");
    });

    it("X は order で先頭に出す（順序を規定する規約は存在しない）", () => {
      expect(blockButtons.x.order).toBe(-1);
      expect(blockButtons.twitter.order).toBe(-1);
      expect(blockButtons.apple.order).toBeUndefined();
      expect(blockButtons.google.order).toBeUndefined();
    });
  });

  describe("アイコンのみ表示をしない", () => {
    it("socialButtonsVariant が blockButton に固定されている", () => {
      // Google のブランド規約が明示的に禁止:
      // "Don't use the Google icon or logo by itself without the button boundary and without text"
      // Clerk はプロバイダ3つ以上だと既定でアイコン形態になるため、明示的に固定する必要がある。
      expect(kimitoClerkAppearance.options.socialButtonsVariant).toBe("blockButton");
    });

    it("ボタン文言にプロバイダ名だけでなく動詞が入る", () => {
      // Google は "Google" 単独表記を認めていない（承認文言は
      // "Sign in with Google" / "Sign up with Google" / "Continue with Google"）。
      // ★キーは2つある。プロバイダが複数あるときは ManyInView が使われ、
      //   その既定は {{provider|titleize}}（プロバイダ名のみ）。両方指定しないと効かない。
      const loc = kimitoJaJP as unknown as Record<string, unknown>;
      expect(loc.socialButtonsBlockButton).toContain("で続ける");
      expect(loc.socialButtonsBlockButtonManyInView).toContain("で続ける");
    });
  });

  it("ログイン画面の説明文が3プロバイダ全てに触れる", () => {
    // 「X または Apple」だと Google だけ案内から漏れ、"at least as prominently" に反する。
    const subtitle = String(kimitoJaJP.signIn?.start?.subtitle ?? "");
    for (const p of ["X", "Apple", "Google"]) {
      expect(subtitle, `説明文に ${p} が無い`).toContain(p);
    }
  });
});
