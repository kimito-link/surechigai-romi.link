/**
 * Clerk `<SignIn />` / `<SignUp />` の見た目（appearance）の単一の真実。
 * ★出典: kimitolink-linktree/lib/clerk-appearance.ts
 *
 * ねらい＝「X を主役に。ただし**サイズでは差をつけない**（規約遵守）」:
 *   - Apple/Google を**消すと §4.8 違反**になる（ボタン構成は Clerk Dashboard の
 *     グローバル設定が決め、Web で消すと server.url で包む iOS でも消える）。
 *   - サイズ・視覚的重みは3つとも同一にし、規約が縛らない自由度（色・順序・外側の説明文）に
 *     主役化を移す。詳細な規約根拠はkimitolink-linktree側のコメント参照。
 *   - Clerk 標準 `<SignIn />` には一切触らない（appearance＝CSS/スタイルの注入だけ）。
 */

// X（旧 Twitter）ブランドの黒。主役ボタンの塗り。
const X_BLACK = "#0f1419";
const X_BLACK_HOVER = "#000000";

// 共通の寸法。3プロバイダで完全に同一にする（規約の "same size / no smaller than" を満たす）。
const sharedButtonSize = {
  minHeight: "3rem",
  fontSize: "0.9375rem",
  fontWeight: 600,
  borderRadius: "0.875rem",
} as const;

const heroButton = {
  ...sharedButtonSize,
  backgroundColor: X_BLACK,
  color: "#ffffff",
  border: "none",
  boxShadow: "0 6px 16px rgba(15,20,25,0.22)",
  "&:hover": { backgroundColor: X_BLACK_HOVER },
  "&:focus": { backgroundColor: X_BLACK_HOVER },
} as const;

const secondaryButton = {
  ...sharedButtonSize,
  backgroundColor: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15,23,42,0.18)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  "&:hover": { backgroundColor: "rgba(15,23,42,0.04)" },
} as const;

const sharedIconButtonSize = {
  minWidth: "3.5rem",
  height: "3rem",
  borderRadius: "0.875rem",
} as const;

const heroIconButton = {
  ...sharedIconButtonSize,
  backgroundColor: X_BLACK,
  border: "none",
  boxShadow: "0 6px 16px rgba(15,20,25,0.22)",
  "&:hover": { backgroundColor: X_BLACK_HOVER },
  "&:focus": { backgroundColor: X_BLACK_HOVER },
} as const;

const secondaryIconButton = {
  ...sharedIconButtonSize,
  backgroundColor: "#ffffff",
  border: "1px solid rgba(15,23,42,0.18)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  "&:hover": { backgroundColor: "rgba(15,23,42,0.04)" },
} as const;

const heroIconGlyph = {
  filter: "brightness(0) invert(1)",
} as const;

/**
 * `<ClerkProvider appearance={...}>` に渡す appearance オブジェクト。
 */
export const surechigaiClerkAppearance = {
  variables: {
    colorPrimary: "#0f1419",
  },
  options: {
    // ★icon-tab.pngは旧ビルドスクリプト(scripts/sync-brand-to-dist.cjs)がstale扱いで
    //   削除する廃止パス。pwa-icon-192.pngが現行の正しいブランドアイコン
    //   （2026-10-02実機確認: icon-tab.pngは旧プロジェクトのcatch-allでindex.htmlに
    //   フォールバックしtext/htmlが返り、ロゴがdisplay:noneになっていた）。
    logoImageUrl: "/pwa-icon-192.png",
    logoPlacement: "inside",
    socialButtonsVariant: "blockButton",
  },
  elements: {
    socialButtons: {
      display: "flex",
      flexDirection: "column",
      gap: "0.625rem",
    },
    socialButtonsBlockButton: secondaryButton,
    socialButtonsBlockButton__x: { ...heroButton, order: -1 },
    socialButtonsBlockButton__twitter: { ...heroButton, order: -1 },
    socialButtonsBlockButton__apple: secondaryButton,
    socialButtonsBlockButton__google: secondaryButton,
    socialButtonsIconButton: secondaryIconButton,
    socialButtonsIconButton__x: { ...heroIconButton, order: -1 },
    socialButtonsIconButton__twitter: { ...heroIconButton, order: -1 },
    socialButtonsIconButton__apple: secondaryIconButton,
    socialButtonsIconButton__google: secondaryIconButton,
    socialButtonsProviderIcon__x: heroIconGlyph,
    socialButtonsProviderIcon__twitter: heroIconGlyph,
  },
} as const;
