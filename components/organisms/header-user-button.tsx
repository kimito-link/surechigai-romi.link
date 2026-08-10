/**
 * native/フォールバック実体。ヘッダーの Clerk 標準 <UserButton> は Web だけに出す。
 *
 * ⚠️ このファイルは **@clerk/expo/web を import しない**。Web 専用 UI を native バンドルに
 * 混ぜると Metro のチャンク分割が壊れる既往事故があるため（clerk-sign-in.tsx と同じ分割手本）。
 * Web の実体は header-user-button.web.tsx。
 */
export function HeaderUserButton() {
  return null;
}
