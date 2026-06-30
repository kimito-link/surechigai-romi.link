import { lazy, ComponentType } from "react";

/**
 * 動的インポート用のユーティリティ
 *
 * このファイルでは、重いコンポーネントの遅延読み込みを
 * 手動で行うためのユーティリティを提供します。
 */

/**
 * コンポーネントを遅延読み込みするラッパー関数
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  _chunkName?: string
): React.LazyExoticComponent<T> {
  return lazy(importFn);
}

/**
 * 名前付きエクスポートを持つコンポーネントを遅延読み込み
 */
export function lazyLoadNamed<T extends ComponentType<any>, K extends string>(
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
 * 重いコンポーネントの lazy ラッパー（lib/lazy-heavy-components.tsx が正本）。
 */
export const HEAVY_COMPONENTS = {
  WebTrailMap: "lazy-heavy-components/LazyWebTrailMap",
  PrecisionTileMap: "lazy-heavy-components/LazyPrecisionTileMap",
  JapanBlockMap: "lazy-heavy-components/LazyJapanBlockMap",
} as const;
