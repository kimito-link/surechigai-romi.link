import { lazy, ComponentType } from "react";

/**
 * 動的インポート用のユーティリティ
 * 
 * Expo Routerはファイルベースのルーティングを使用するため、
 * 画面コンポーネントの動的インポートは自動的に行われます。
 * 
 * このファイルでは、重いコンポーネントの遅延読み込みを
 * 手動で行うためのユーティリティを提供します。
 */

/**
 * コンポーネントを遅延読み込みするラッパー関数
 * 
 * @param importFn - 動的インポート関数
 * @param chunkName - Webpackチャンク名（デバッグ用）
 * @returns 遅延読み込みされるコンポーネント
 * 
 * @example
 * ```tsx
 * const HeavyChart = lazyLoad(
 *   () => import('@/components/heavy-chart'),
 *   'heavy-chart'
 * );
 * ```
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  _chunkName?: string
): React.LazyExoticComponent<T> {
  return lazy(importFn);
}

/**
 * 名前付きエクスポートを持つコンポーネントを遅延読み込み
 * 
 * @param importFn - 動的インポート関数
 * @param exportName - エクスポート名
 * @returns 遅延読み込みされるコンポーネント
 * 
 * @example
 * ```tsx
 * const { JapanHeatmap } = lazyLoadNamed(
 *   () => import('@/components/organisms/japan-heatmap'),
 *   'JapanHeatmap'
 * );
 * ```
 */
export function lazyLoadNamed<
  T extends ComponentType<any>,
  K extends string
>(
  importFn: () => Promise<Record<K, T>>,
  exportName: K
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const module = await importFn();
    return { default: module[exportName] };
  });
}

/**
 * プリロード機能付きの遅延読み込み
 * 
 * コンポーネントを事前に読み込むことで、
 * 実際に表示する際のローディング時間を短縮できます。
 * 
 * @example
 * ```tsx
 * const { Component: HeavyChart, preload } = lazyWithPreload(
 *   () => import('@/components/heavy-chart')
 * );
 * 
 * // ユーザーがボタンにホバーした時にプリロード
 * <Button onHoverIn={preload}>
 *   Show Chart
 * </Button>
 * ```
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  let modulePromise: Promise<{ default: T }> | null = null;

  const preload = async () => {
    if (!modulePromise) {
      modulePromise = importFn();
    }
    await modulePromise;
  };

  const Component = lazy(() => {
    if (modulePromise) {
      return modulePromise;
    }
    modulePromise = importFn();
    return modulePromise;
  });

  return { Component, preload };
}

/**
 * 重いコンポーネントのリスト
 * これらは遅延読み込みの候補です
 */
export const HEAVY_COMPONENTS = {
  // チャート系
  "japan-heatmap": () => import("@/components/organisms/japan-heatmap"),
  "japan-map": () => import("@/components/organisms/japan-map"),
  "japan-block-map": () => import("@/components/organisms/japan-block-map"),
  "japan-deformed-map": () => import("@/components/organisms/japan-deformed-map"),
  "growth-trajectory-chart": () => import("@/components/organisms/growth-trajectory-chart"),
  
  // 複雑なモーダル系（名前付きエクスポート）
  "prefecture-participants-modal": () => import("@/components/molecules/prefecture-participants-modal"),
  "region-participants-modal": () => import("@/components/molecules/region-participants-modal"),
} as const;

/**
 * 遅延読み込みされた重いコンポーネント
 * すべて名前付きエクスポートのためlazyLoadNamedを使用
 */
export const LazyComponents = {
  // チャート系
  JapanHeatmap: lazyLoadNamed(
    HEAVY_COMPONENTS["japan-heatmap"] as any,
    "JapanHeatmap"
  ),
  JapanMap: lazyLoadNamed(
    HEAVY_COMPONENTS["japan-map"] as any,
    "JapanMap"
  ),
  JapanBlockMap: lazyLoadNamed(
    HEAVY_COMPONENTS["japan-block-map"] as any,
    "JapanBlockMap"
  ),
  JapanDeformedMap: lazyLoadNamed(
    HEAVY_COMPONENTS["japan-deformed-map"] as any,
    "JapanDeformedMap"
  ),
  GrowthTrajectoryChart: lazyLoadNamed(
    HEAVY_COMPONENTS["growth-trajectory-chart"] as any,
    "GrowthTrajectoryChart"
  ),
  // モーダル系
  PrefectureParticipantsModal: lazyLoadNamed(
    HEAVY_COMPONENTS["prefecture-participants-modal"] as any,
    "PrefectureParticipantsModal"
  ),
  RegionParticipantsModal: lazyLoadNamed(
    HEAVY_COMPONENTS["region-participants-modal"] as any,
    "RegionParticipantsModal"
  ),
};

/**
 * プリロード関数
 * 特定のコンポーネントを事前に読み込む
 */
export async function preloadComponent(
  componentName: keyof typeof HEAVY_COMPONENTS
): Promise<void> {
  try {
    await HEAVY_COMPONENTS[componentName]();
  } catch (error) {
    console.warn(`Failed to preload component: ${componentName}`, error);
  }
}

/**
 * 複数のコンポーネントを並列でプリロード
 */
export async function preloadComponents(
  componentNames: Array<keyof typeof HEAVY_COMPONENTS>
): Promise<void> {
  await Promise.all(
    componentNames.map(name => preloadComponent(name))
  );
}
