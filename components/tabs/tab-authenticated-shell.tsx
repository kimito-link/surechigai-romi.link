/**
 * 認証済み lazy タブ画面用 ErrorBoundary ラッパー
 */
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ChunkFallback } from "@/lib/chunk-fallback";

type TabAuthenticatedShellProps = {
  screenName: string;
  children: ReactNode;
  fallbackMinHeight?: number;
};

export function TabAuthenticatedShell({
  screenName,
  children,
  fallbackMinHeight = 360,
}: TabAuthenticatedShellProps) {
  return (
    <ErrorBoundary screenName={screenName}>
      <Suspense fallback={<ChunkFallback minHeight={fallbackMinHeight} />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
