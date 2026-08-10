/**
 * Web 専用: kimito.link と同じ Clerk 標準 <UserButton>（アバター＋「アカウントの管理」
 * 「サインアウト」）をヘッダーに出す。設計 docs/HEADER-USERBUTTON-DESIGN.md。
 *
 * ⚠️ @clerk/expo/web を **静的 import しない**（lazy で取り込む）。AppHeader は全ルートの
 * 初期チャンクに入るため、静的 import すると Clerk UI が初期 JS に染み出し、Metro の
 * チャンク分割も崩れる（clerk-sign-in.tsx の事故メモ参照）。LazyGlobalMenu と同じ流儀。
 *
 * ⚠️ ClerkProvider の外で <UserButton> を描画するとクラッシュし ErrorBoundary が "/" へ
 * 押し戻す（app/sign-in.tsx の実測メモ）。ゲスト Web シェルは user が常に null、chunk 解決
 * 待ちは isAuthReady が false。その両方を `isAuthReady && user` ガードで自然に落とす。
 */
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { HEADER_USER_BUTTON_PROPS } from "@/lib/header-user-button-props";

const UserButton = lazy(() =>
  import("@clerk/expo/web").then((m) => ({ default: m.UserButton })),
);

export function HeaderUserButton() {
  const { user, isAuthReady } = useAuth();
  // ClerkProvider 未確定 or 未ログイン（ゲストシェル含む）では一切描画しない。
  if (!isAuthReady || !user) return null;

  return (
    <Suspense fallback={null}>
      <UserButton {...HEADER_USER_BUTTON_PROPS} />
    </Suspense>
  );
}
