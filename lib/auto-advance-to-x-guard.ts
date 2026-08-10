/**
 * X 自動クリックを発火してよいかの純判定（設計 docs/HEADER-USERBUTTON-DESIGN.md C-1）。
 * RN/JSX 依存を持たない純ロジックとして lib に置き、vitest で直接 import して固定する
 * （lib/clerk-route.ts と同じ流儀。RN コンポーネント本体は import 不可なため分離する）。
 *
 * 肝は `isAuthReady && !hasUser`: Clerk 確定を待ち、**ログイン済みなら発火しない**。
 * UserButton の「アカウント管理」等でログイン済みのまま /sign-in?auto=x に戻っても、
 * X 自動クリック → sso-callback → 帰還 → 再発火… のループを構造的に断つ。
 */
export function shouldAutoAdvanceToX(input: {
  hasParam: boolean;
  isSso: boolean;
  isAuthReady: boolean;
  hasUser: boolean;
}): boolean {
  const { hasParam, isSso, isAuthReady, hasUser } = input;
  return hasParam && !isSso && isAuthReady && !hasUser;
}
