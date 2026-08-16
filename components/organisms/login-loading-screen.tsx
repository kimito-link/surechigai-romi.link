import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";

/**
 * ログインローディング画面。
 *
 * ★2026-08-16: ブランド読み込み画面（ロゴ＋ゆっくりりんく）に統一。
 * 実体は components/atoms/brand-loading-screen.tsx。
 */
export function LoginLoadingScreen() {
  return <BrandLoadingScreen message="X で認証中…" />;
}
