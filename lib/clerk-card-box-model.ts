/**
 * lib/clerk-card-box-model.ts — Clerk の sign-in カード（Web の `<SignIn/>`）と、ネイティブの自前ログイン画面の
 * **箱モデル（寸法）の単一の真実**。Clerk 本体が描かれるまでのプレースホルダ
 * （components/auth/clerk-mount-fallback.tsx）が本物と同寸になるために使う。
 *
 * ★依存ゼロの純モジュール（import 無し）。clerk-mount-fallback.tsx は「新しい import を足すと Metro の
 *   チャンク分割が変わって /sign-in が壊れた」地雷（2026-07-31）を持つため、ここは意図的に何も import しない。
 *
 * ★契約の正本: web-ios-android/templates/web/auth-mode/README.md ④「ログイン画面のちらつきゼロ契約」②
 *   「プレースホルダは本物と同寸・同色」。Next.js 側（apps/web/components/ClerkMountFallback.tsx）は
 *   同じ数値を自分のファイルに持つ（apps/web は別パッケージでルートの TS を import できない＝意図的な複製）。
 *   2 つの数値のずれは __tests__/signin-no-flicker.test.tsx が検出する。片方を変えたらもう片方も変える。
 *
 * ■ Web の数値の出典
 *   https://surechigai.kimito.link/sign-in/ を iPhone 15 Pro Max（幅 430px）で DOM 計測した Clerk の箱モデル（2026-10-05）。
 *     .cl-cardBox   width 25rem / max-width calc(100vw - 2.5rem) / radius 12px        → 390px @430
 *       .cl-card    margin -1px -1px 0 / padding 32px 40px / gap 32px / radius 8px / 白   → 388px
 *         header    logo 48px ＋ gap 16px ＋ (title 24px ＋ gap 4px ＋ subtitle 18px×2行)    = 128px
 *         main      ボタン 48px × 3 ＋ gap 10px × 2                                        = 164px
 *       .cl-footer  action 行 50px ＋ Secured by Clerk 行 49px
 *       → cardBox 合計 486px（before の縦ずれ +486px と一致）
 *   ★Expo Web（Metro 配信の /sign-in）の Clerk カードは本番では配信されていない（vercel.json の rewrite で Next.js が
 *     応答する）ため未計測。appearance（lib/clerk-appearance.ts: minHeight 3rem・gap 0.625rem・logoPlacement inside）と
 *     Clerk インスタンスは Next.js 側と同じなので同じ箱モデルを使う。title（「君斗りんくのすれ違ひ通信にログイン」17 文字）は
 *     312px 幅で 1 行、subtitle は 2 行の見立て（未実測）。
 */

/** 本物の Clerk カード（.cl-cardBox）の箱モデル。単位は px（cardBoxWidthRem だけ rem）。 */
export const CLERK_CARD_BOX_MODEL = {
  cardBoxWidthRem: 25,
  /** .cl-cardBox の max-width = calc(100vw - 2.5rem)。RN では useWindowDimensions の幅から引く */
  cardBoxMaxWidthInsetPx: 40,
  cardBoxRadius: 12,
  /** .cl-card の margin（-1px -1px 0）。流れの高さを 1px 削る */
  cardMarginPx: -1,
  cardRadius: 8,
  cardPaddingY: 32,
  cardPaddingX: 40,
  /** header と main の間 */
  cardGap: 32,
  logoHeight: 48,
  logoWidth: 48,
  /** logo と見出しブロックの間 */
  headerGap: 16,
  titleLineHeight: 24,
  /** title と subtitle の間 */
  titleSubtitleGap: 4,
  subtitleLineHeight: 18,
  /** subtitle の行数（文言の長さで変わる） */
  subtitleLines: 2,
  buttonHeight: 48,
  buttonGap: 10,
  buttonRadius: 14,
  /** フッター「アカウントをお持ちでないですか？ サインアップ」の行（padding 16 + 18 + 16） */
  footerActionHeight: 50,
  /** フッター Secured by Clerk バッジの行 */
  footerBadgeHeight: 49,
} as const;

export type ClerkCardBoxModel = typeof CLERK_CARD_BOX_MODEL;

/**
 * 本番 Clerk Dashboard のソーシャルプロバイダ（表示順。2026-10-05 本番 DOM 実測:
 * .cl-socialButtonsBlockButton__x / __apple / __google、X は appearance の order:-1 で先頭）。
 * Dashboard で増減したらここも合わせる（数が違うと 58px ずつ縦ずれが戻る）。
 */
export const CLERK_CARD_PROVIDERS = [
  { key: "x", title: "X / Twitter", hero: true },
  { key: "apple", title: "Apple", hero: false },
  { key: "google", title: "Google", hero: false },
] as const;

export type ClerkCardProviderKey = (typeof CLERK_CARD_PROVIDERS)[number]["key"];

/** header（logo ＋ 見出しブロック）の高さ。このサービスの値で 128。 */
export function clerkCardHeaderHeight(box: ClerkCardBoxModel = CLERK_CARD_BOX_MODEL): number {
  return (
    box.logoHeight +
    box.headerGap +
    box.titleLineHeight +
    box.titleSubtitleGap +
    box.subtitleLineHeight * box.subtitleLines
  );
}

/** プロバイダ数から .cl-cardBox の流れの高さを出す（純関数）。このサービスの値で 3 ボタン → 486。 */
export function expectedClerkCardBoxHeight(
  providerCount: number,
  box: ClerkCardBoxModel = CLERK_CARD_BOX_MODEL,
): number {
  const buttons = providerCount * box.buttonHeight + Math.max(0, providerCount - 1) * box.buttonGap;
  const card = box.cardPaddingY * 2 + clerkCardHeaderHeight(box) + box.cardGap + buttons;
  return card + box.cardMarginPx + box.footerActionHeight + box.footerBadgeHeight;
}

/** .cl-cardBox の幅（25rem と calc(100vw - 2.5rem) の小さい方）。RN は rem が無いので 16px 換算。 */
export function clerkCardBoxWidth(viewportWidth: number, box: ClerkCardBoxModel = CLERK_CARD_BOX_MODEL): number {
  return Math.min(box.cardBoxWidthRem * 16, Math.max(0, viewportWidth - box.cardBoxMaxWidthInsetPx));
}

/**
 * ネイティブ（iOS / Android）の本物＝components/organisms/clerk-sign-in.tsx（Clerk の Web カードは RN で描けないため
 * 自前の X / Apple の 2 ボタン）。プレースホルダはこの箱に合わせる。
 */
export const NATIVE_SIGN_IN_BOX_MODEL = {
  buttonMinHeight: 48,
  buttonGap: 12,
  buttonRadius: 14,
  providerCount: 2,
} as const;

/** ネイティブの本物（2 ボタン＋gap）の高さ。48×2 + 12 = 108。 */
export function expectedNativeSignInHeight(
  box: typeof NATIVE_SIGN_IN_BOX_MODEL = NATIVE_SIGN_IN_BOX_MODEL,
): number {
  return box.providerCount * box.buttonMinHeight + Math.max(0, box.providerCount - 1) * box.buttonGap;
}
