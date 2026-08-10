/**
 * ヘッダーの Clerk 標準 <UserButton>（Web）に渡す props 定数。
 *
 * 意図を「名前と定数」に固定し、テスト（__tests__/header-user-button-props.test.ts）で
 * 恒久的に守る流儀は lib/clerk-route.ts と同じ。satellite でも sign-in を自オリジンに
 * 保つ設計（lib/clerk-provider-props.ts）と対で、この定数には auto=x を一切混ぜない。
 *
 * 設計: docs/HEADER-USERBUTTON-DESIGN.md C-2。
 * - userProfileMode "navigation": UserProfile モーダルを封印し、破壊的な書き込み
 *   （X 連携の追加/解除等）を satellite 側から開放しない。管理は自オリジン /mypage に集約。
 * - afterSignOutUrl "/logout": 既存のログアウト演出＋ローカル掃除（app/logout.tsx）へ合流。
 * - appearance: primary(kimito.link) 側で将来 multi-session が ON にされても
 *   「アカウントを追加 / 全てからサインアウト」を出さない防御（X は prompt/force_login
 *   非対応で標準切替が同一垢ループになるため）。色・日本語化・kimito appearance は
 *   ClerkProvider から自動継承されるので、ここでは寸法と防御だけ足す。
 */
export const HEADER_USER_BUTTON_PROPS = {
  userProfileMode: "navigation" as const,
  userProfileUrl: "/mypage",
  afterSignOutUrl: "/logout",
  appearance: {
    elements: {
      userButtonAvatarBox: { width: "36px", height: "36px" },
      userButtonPopoverActionButton__addAccount: { display: "none" },
      userButtonPopoverActionButton__signOutAll: { display: "none" },
    },
  },
} as const;
