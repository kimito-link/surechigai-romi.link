/**
 * ヘッダーの Clerk 標準 <UserButton>（Web）に渡す props 定数。
 *
 * 意図を「名前と定数」に固定し、テスト（__tests__/header-user-button-props.test.ts）で
 * 恒久的に守る流儀は lib/clerk-route.ts と同じ。satellite でも sign-in を自オリジンに
 * 保つ設計（lib/clerk-provider-props.ts）と対で、この定数には auto=x を一切混ぜない。
 *
 * 設計: docs/HEADER-USERBUTTON-DESIGN.md C-2 / docs/MULTI-SESSION-X-SWITCH-DESIGN.md。
 * 2026-08-11 改訂: multi-session（複数Xアカウント切替）を活かす。
 *   共有 Clerk アプリ(kimito.link)は既に single_session_mode=false（本番 environment で実測）。
 *   よって UserButton に「アカウント追加 / 切替 / 全サインアウト」を**出す**（X本体と同じ切替体験）。
 * - userProfileMode は既定("modal"): 「アカウントの管理」で kimito.link と同じ管理モーダル。
 * - afterSignOutUrl "/logout": 「すべてのアカウントからサインアウト」時の全消し演出＋ローカル掃除。
 * - afterMultiSessionSingleSignOutUrl "/": 単垢サインアウトは残る垢で使い続けるので /logout（全消し）を
 *   通さず素直にトップへ。→ 残った垢を巻き添えにしない（設計 G の地雷回避）。
 * - afterSwitchSessionUrl "/": 別垢へ即時切替したらトップに着地し、ヘッダー/mypage/記録先が新垢に。
 * - 追加時の X OAuth 制約（同一垢に戻る）は /sign-in の AddXAccountNotice で案内する（設計 A/C）。
 * この定数には auto=x を一切混ぜない（テストで固定・AutoAdvanceToX を誘発しない）。
 */
export const HEADER_USER_BUTTON_PROPS = {
  afterSignOutUrl: "/logout",
  afterMultiSessionSingleSignOutUrl: "/",
  afterSwitchSessionUrl: "/",
  appearance: {
    elements: {
      userButtonAvatarBox: { width: "36px", height: "36px" },
    },
  },
} as const;
