/**
 * MapErrorBoundary - 地図コンポーネント専用のエラーバウンダリ
 * 
 * 地図コンポーネントをラップして、SVG描画エラーなどをキャッチし、
 * アプリ全体のクラッシュを防ぎます。
 * 
 * 使用例:
 * ```tsx
 * <MapErrorBoundary mapType="heatmap">
 *   <JapanHeatmap data={data} />
 * </MapErrorBoundary>
 * ```
 */

import { type ReactNode, useCallback } from "react";
import { ErrorBoundary, type ErrorBoundaryProps } from "./error-boundary";
import { MapErrorFallback, type MapErrorFallbackProps } from "./map-error-fallback";

export interface MapErrorBoundaryProps {
  /** 子コンポーネント（地図） */
  children: ReactNode;
  /** 地図の種類 */
  mapType?: MapErrorFallbackProps["mapType"];
  /** コンテナの高さ */
  height?: number;
  /** エラー発生時のコールバック */
  onError?: ErrorBoundaryProps["onError"];
  /** リトライ時のコールバック */
  onReset?: ErrorBoundaryProps["onReset"];
}

/**
 * MapErrorBoundary - 地図専用エラーバウンダリ
 */
export function MapErrorBoundary({
  children,
  mapType = "standard",
  height = 300,
  onError,
  onReset,
}: MapErrorBoundaryProps) {
  const screenName = `Map:${mapType}`;
  const fallbackRender = useCallback(
    ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
      <MapErrorFallback
        error={error}
        resetErrorBoundary={resetErrorBoundary}
        mapType={mapType}
        height={height}
      />
    ),
    [mapType, height]
  );

  return (
    <ErrorBoundary
      screenName={screenName}
      fallbackRender={fallbackRender}
      onError={onError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}

export default MapErrorBoundary;
