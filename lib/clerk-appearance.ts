/**
 * Clerk `<SignIn />` の見た目（appearance）— kimito.link からの忠実コピー。
 *
 * ねらい＝「X を主役に、Apple/Google は消さず小さく」:
 *   - Apple/Google を消すと §4.8 違反になるため、全プロバイダのボタンは残したまま
 *     視覚的優先度だけを変える（X=主役、Apple/Google=脇役）。
 *   - Clerk 標準 `<SignIn />` には一切触らず、appearance（スタイル注入）だけで調整する。
 *
 * 仕組み:
 *   プロバイダ3つ以上だと自動でアイコン形態（`cl-socialButtonsIconButton`）になり、
 *   2つ以下だと横長のブロック形態になる。両形態に X 主役・脇役のスタイルを当てる。
 *
 * 出典: kimitolink-linktree/lib/clerk-appearance.ts（完全コピー）。
 */

// kimito.link 本番のロゴ（サブドメインからは絶対URLで参照する）。
const KIMITO_FAVICON_PATH =
  "https://kimito.link/images/brand/logo/color/logo_kimito-link_RGB_maru_ginga.png";

// X（旧 Twitter）ブランドの黒。主役ボタンの塗り。
const X_BLACK = "#0f1419";
const X_BLACK_HOVER = "#000000";

// 主役（X）ボタン: 塗りつぶし・大きめ・太字。最初に押させたい一手。
const heroButton = {
  backgroundColor: X_BLACK,
  color: "#ffffff",
  border: "none",
  fontWeight: 700,
  fontSize: "1.0625rem",
  minHeight: "3rem",
  borderRadius: "0.875rem",
  boxShadow: "0 6px 16px rgba(15,20,25,0.22)",
  "&:hover": { backgroundColor: X_BLACK_HOVER },
  "&:focus": { backgroundColor: X_BLACK_HOVER },
} as const;

// 脇役（Apple/Google）ボタン: 控えめ・小さめ・アウトライン寄り。残すが目立たせない。
const secondaryButton = {
  backgroundColor: "transparent",
  color: "#475569",
  border: "1px solid rgba(15,23,42,0.12)",
  fontWeight: 500,
  fontSize: "0.8125rem",
  minHeight: "2.25rem",
  borderRadius: "0.625rem",
  opacity: 0.85,
  boxShadow: "none",
  "&:hover": { backgroundColor: "rgba(15,23,42,0.04)", opacity: 1 },
} as const;

// --- アイコン形態（本番の実態）。X/Apple/Google の3つ＝アイコン横並びになる。 ---
const heroIconButton = {
  backgroundColor: X_BLACK,
  border: "none",
  borderRadius: "0.875rem",
  minWidth: "3.5rem",
  height: "3rem",
  boxShadow: "0 6px 16px rgba(15,20,25,0.22)",
  transform: "scale(1.06)",
  "&:hover": { backgroundColor: X_BLACK_HOVER },
  "&:focus": { backgroundColor: X_BLACK_HOVER },
} as const;

const secondaryIconButton = {
  backgroundColor: "transparent",
  border: "1px solid rgba(15,23,42,0.12)",
  borderRadius: "0.625rem",
  height: "2.5rem",
  opacity: 0.7,
  boxShadow: "none",
  "&:hover": { backgroundColor: "rgba(15,23,42,0.04)", opacity: 1 },
} as const;

// X アイコン（黒背景に乗るので白く反転させる）。Apple/Google のアイコンは触らない。
const heroIconGlyph = {
  filter: "brightness(0) invert(1)",
} as const;

/**
 * `<ClerkProvider appearance={...}>` に渡す appearance オブジェクト。
 */
export const kimitoClerkAppearance = {
  variables: {
    colorPrimary: "#00427B",
  },
  options: {
    logoImageUrl: KIMITO_FAVICON_PATH,
    logoPlacement: "inside",
  },
  elements: {
    // === ブロック形態（プロバイダが2個以下のとき） ===
    socialButtonsBlockButton: secondaryButton,
    socialButtonsBlockButton__x: heroButton,
    socialButtonsBlockButton__twitter: heroButton,
    socialButtonsBlockButton__apple: secondaryButton,
    socialButtonsBlockButton__google: secondaryButton,

    // === アイコン形態（プロバイダ3個以上＝本番の実態） ===
    socialButtonsIconButton: secondaryIconButton,
    socialButtonsIconButton__x: heroIconButton,
    socialButtonsIconButton__twitter: heroIconButton,
    socialButtonsIconButton__apple: secondaryIconButton,
    socialButtonsIconButton__google: secondaryIconButton,
    socialButtonsProviderIcon__x: heroIconGlyph,
    socialButtonsProviderIcon__twitter: heroIconGlyph,
  },
} as const;
