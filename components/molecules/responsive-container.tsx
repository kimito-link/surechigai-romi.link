import { View, ViewProps, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { useContentMaxWidth, useResponsive } from "@/hooks/use-responsive";

interface ResponsiveContainerProps extends ViewProps {
  /**
   * 最大幅を適用するかどうか（デフォルト: true）
   */
  maxWidth?: boolean;
  /**
   * 中央揃えにするかどうか（デフォルト: true）
   */
  centered?: boolean;
  /**
   * 水平パディング（デフォルト: 16）
   */
  horizontalPadding?: number;
}

/**
 * レスポンシブ対応のコンテナコンポーネント
 * PC画面では最大幅を設定し、中央揃えにする
 */
export function ResponsiveContainer({
  children,
  style,
  maxWidth = true,
  centered = true,
  horizontalPadding = 16,
  ...props
}: ResponsiveContainerProps) {
  const contentMaxWidth = useContentMaxWidth();
  const { isDesktop } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: maxWidth && contentMaxWidth ? contentMaxWidth : undefined,
          alignSelf: centered && isDesktop ? "center" : undefined,
          width: centered && isDesktop ? "100%" : undefined,
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * レスポンシブグリッドコンポーネント
 * 画面サイズに応じてカラム数を自動調整
 */
interface ResponsiveGridProps extends ViewProps {
  /**
   * モバイルでのカラム数（デフォルト: 1）
   */
  columns?: number;
  /**
   * アイテム間のギャップ（デフォルト: 16）
   */
  gap?: number;
}

export function ResponsiveGrid({
  children,
  style,
  columns = 1,
  gap = 16,
  ...props
}: ResponsiveGridProps) {
  return (
    <View
      style={[
        styles.grid,
        {
          flexDirection: "row",
          flexWrap: "wrap",
          gap,
          marginHorizontal: -gap / 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * グリッドアイテムコンポーネント
 */
interface GridItemProps extends ViewProps {
  /**
   * 占有するカラム数（デフォルト: 1）
   */
  span?: number;
  /**
   * グリッドのギャップ（親のResponsiveGridと同じ値を指定）
   */
  gap?: number;
  /**
   * 現在のカラム数（親から渡される）
   */
  totalColumns?: number;
}

export function GridItem({
  children,
  style,
  span = 1,
  gap = 16,
  totalColumns = 1,
  ...props
}: GridItemProps) {
  const { isDesktop, isTablet } = useResponsive();

  // ブレークポイントに応じたカラム数
  const getColumns = () => {
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 1;
  };

  const columns = getColumns();
  // React Nativeではパーセント値を数値として計算
  const itemWidthPercent = (100 / columns) * span;

  return (
    <View
      style={[
        {
          width: `${itemWidthPercent}%` as any,
          paddingHorizontal: gap / 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * PC用サイドバーレイアウト
 * デスクトップではサイドバー + メインコンテンツのレイアウト
 */
interface SidebarLayoutProps extends ViewProps {
  sidebar?: React.ReactNode;
  sidebarWidth?: number;
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarWidth = 280,
  style,
  ...props
}: SidebarLayoutProps) {
  const { isDesktop } = useResponsive();

  if (!isDesktop || !sidebar) {
    return <View style={[styles.container, style]} {...props}>{children}</View>;
  }

  return (
    <View style={[styles.sidebarLayout, style]} {...props}>
      <View style={[styles.sidebar, { width: sidebarWidth }]}>
        {sidebar}
      </View>
      <View style={styles.mainContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    width: "100%",
  },
  sidebarLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    backgroundColor: color.surface,
    borderRightWidth: 1,
    borderRightColor: color.border,
  },
  mainContent: {
    flex: 1,
  },
});
