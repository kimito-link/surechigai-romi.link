import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface LazyLoadingFallbackProps {
  /** ローディングインジケーターのサイズ */
  size?: "small" | "large";
  /** 背景色を透明にするか */
  transparent?: boolean;
}

/**
 * 遅延読み込み中に表示するフォールバックコンポーネント
 * 
 * React.lazyとSuspenseで使用します：
 * ```tsx
 * const LazyComponent = lazy(() => import('./HeavyComponent'));
 * 
 * <Suspense fallback={<LazyLoadingFallback />}>
 *   <LazyComponent />
 * </Suspense>
 * ```
 */
export function LazyLoadingFallback({ 
  size = "large",
  transparent = false 
}: LazyLoadingFallbackProps) {
  const colors = useColors();

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: transparent ? "transparent" : colors.background }
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

/**
 * スケルトンローダー付きのフォールバック
 * より洗練されたローディング体験を提供
 */
export function SkeletonFallback() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skeletonContainer}>
        {/* ヘッダースケルトン */}
        <View style={[styles.skeletonHeader, { backgroundColor: colors.surface }]} />
        
        {/* コンテンツスケルトン */}
        <View style={[styles.skeletonContent, { backgroundColor: colors.surface }]} />
        <View style={[styles.skeletonContent, styles.skeletonShort, { backgroundColor: colors.surface }]} />
        
        {/* カードスケルトン */}
        <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonContainer: {
    width: "100%",
    padding: 16,
    gap: 16,
  },
  skeletonHeader: {
    height: 32,
    width: "60%",
    borderRadius: 8,
  },
  skeletonContent: {
    height: 16,
    width: "100%",
    borderRadius: 4,
  },
  skeletonShort: {
    width: "80%",
  },
  skeletonCard: {
    height: 120,
    width: "100%",
    borderRadius: 12,
    marginTop: 8,
  },
});

export default LazyLoadingFallback;
