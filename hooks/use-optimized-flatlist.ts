import { Platform } from "react-native";
import { useCallback, useMemo, useRef } from "react";

/**
 * FlatListのパフォーマンス最適化設定を提供するフック
 * 
 * 使用例:
 * ```tsx
 * const { optimizedProps, getItemLayout } = useOptimizedFlatList({ itemHeight: 72 });
 * 
 * <FlatList
 *   {...optimizedProps}
 *   getItemLayout={getItemLayout}
 *   data={data}
 *   renderItem={renderItem}
 * />
 * ```
 */

interface UseOptimizedFlatListOptions {
  /** アイテムの高さ（固定高さの場合に指定） */
  itemHeight?: number;
  /** 初期表示アイテム数（デフォルト: 10） */
  initialNumToRender?: number;
  /** バッチあたりの最大レンダリング数（デフォルト: 10） */
  maxToRenderPerBatch?: number;
  /** ウィンドウサイズ（デフォルト: 5） */
  windowSize?: number;
  /** 更新バッチ間隔（ミリ秒、デフォルト: 50） */
  updateCellsBatchingPeriod?: number;
}

interface OptimizedFlatListProps {
  windowSize: number;
  maxToRenderPerBatch: number;
  initialNumToRender: number;
  removeClippedSubviews: boolean;
  updateCellsBatchingPeriod: number;
}

interface UseOptimizedFlatListReturn {
  /** FlatListに渡す最適化プロパティ */
  optimizedProps: OptimizedFlatListProps;
  /** getItemLayout関数（itemHeightが指定されている場合のみ有効） */
  getItemLayout: ((data: any, index: number) => { length: number; offset: number; index: number }) | undefined;
}

export function useOptimizedFlatList(
  options: UseOptimizedFlatListOptions = {}
): UseOptimizedFlatListReturn {
  const {
    itemHeight,
    initialNumToRender = 10,
    maxToRenderPerBatch = 10,
    windowSize = 5,
    updateCellsBatchingPeriod = 50,
  } = options;

  // 最適化プロパティをメモ化
  const optimizedProps = useMemo<OptimizedFlatListProps>(() => ({
    windowSize,
    maxToRenderPerBatch,
    initialNumToRender,
    removeClippedSubviews: Platform.OS !== "web",
    updateCellsBatchingPeriod,
  }), [windowSize, maxToRenderPerBatch, initialNumToRender, updateCellsBatchingPeriod]);

  // getItemLayout関数をメモ化（固定高さの場合のみ）
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (_data: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  return {
    optimizedProps,
    getItemLayout,
  };
}

/**
 * 画面に表示されているアイテムを追跡するフック
 * 画像のプリフェッチなどに使用
 */
export function useViewableItemsTracker<T>(
  onViewableItemsChanged?: (items: T[]) => void
) {
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: T }> }) => {
      if (onViewableItemsChanged) {
        onViewableItemsChanged(viewableItems.map(v => v.item));
      }
    },
    [onViewableItemsChanged]
  );

  return {
    viewabilityConfig,
    onViewableItemsChanged: handleViewableItemsChanged,
  };
}

/**
 * FlatListのスクロール位置を保持するフック
 */
export function useScrollPosition() {
  const scrollOffset = useRef(0);

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const getScrollOffset = useCallback(() => scrollOffset.current, []);

  return {
    handleScroll,
    getScrollOffset,
  };
}

/**
 * デフォルトの最適化設定
 */
export const DEFAULT_FLATLIST_OPTIMIZATION = {
  windowSize: 5,
  maxToRenderPerBatch: 10,
  initialNumToRender: 10,
  updateCellsBatchingPeriod: 50,
} as const;

/**
 * リストタイプ別の推奨設定
 */
export const FLATLIST_PRESETS = {
  /** 通常のリスト（フォロワー、ランキングなど） */
  standard: {
    windowSize: 5,
    maxToRenderPerBatch: 10,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 50,
  },
  /** グリッドレイアウト（チャレンジカードなど） */
  grid: {
    windowSize: 5,
    maxToRenderPerBatch: 6,
    initialNumToRender: 6,
    updateCellsBatchingPeriod: 50,
  },
  /** チャット/メッセージ */
  chat: {
    windowSize: 10,
    maxToRenderPerBatch: 15,
    initialNumToRender: 20,
    updateCellsBatchingPeriod: 50,
  },
  /** 画像ギャラリー */
  gallery: {
    windowSize: 3,
    maxToRenderPerBatch: 4,
    initialNumToRender: 4,
    updateCellsBatchingPeriod: 100,
  },
} as const;
