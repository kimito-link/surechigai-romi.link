/**
 * 認証済み lazy タブ画面用 ErrorBoundary ラッパー
 */
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";

type TabAuthenticatedShellProps = {
  screenName: string;
  children: ReactNode;
};

/**
 * ★2026-10-05: タブ全体の待機を、灰色の骨組み（ChunkFallback）から BrandLoadingScreen に寄せた。
 *   ホーム画面から開いた(PWA)とき、起動ベールの次にこの待機が出る。色の違う画面が続くと
 *   「ちかちか」に見えるため、ベールと背景色・ロゴ・配置を揃えてある BrandLoadingScreen にする
 *   （読み込み画面は全部これに寄せる、が元々の設計。lib/boot-veil.ts / docs/symptoms.md SG-09）。
 *   画面の一部の小さな待機（lazy-heavy-components 等）は、全画面にしないので ChunkFallback のまま。
 */
export function TabAuthenticatedShell({ screenName, children }: TabAuthenticatedShellProps) {
  return (
    <ErrorBoundary screenName={screenName}>
      <Suspense fallback={<BrandLoadingScreen />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
