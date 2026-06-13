import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";

// ブレークポイント定義
export const BREAKPOINTS = {
  sm: 640,   // スマートフォン
  md: 768,   // タブレット
  lg: 1024,  // 小型デスクトップ
  xl: 1280,  // デスクトップ
  "2xl": 1536, // 大型デスクトップ
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768px - 1023px
  isDesktop: boolean;     // >= 1024px
  isLargeDesktop: boolean; // >= 1280px
  breakpoint: BreakpointKey;
}

/**
 * レスポンシブ対応のためのカスタムフック
 * 画面サイズに応じたブレークポイント情報を提供
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions;

  // ブレークポイントの判定
  const getBreakpoint = (w: number): BreakpointKey => {
    if (w >= BREAKPOINTS["2xl"]) return "2xl";
    if (w >= BREAKPOINTS.xl) return "xl";
    if (w >= BREAKPOINTS.lg) return "lg";
    if (w >= BREAKPOINTS.md) return "md";
    return "sm";
  };

  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isLargeDesktop: width >= BREAKPOINTS.xl,
    breakpoint: getBreakpoint(width),
  };
}

/**
 * グリッドカラム数を取得
 */
export function useGridColumns(defaultColumns: number = 1): number {
  const { breakpoint } = useResponsive();
  
  switch (breakpoint) {
    case "2xl":
      return Math.min(defaultColumns * 3, 4);
    case "xl":
      return Math.min(defaultColumns * 3, 3);
    case "lg":
      return Math.min(defaultColumns * 2, 3);
    case "md":
      return Math.min(defaultColumns * 2, 2);
    default:
      return defaultColumns;
  }
}

/**
 * コンテンツの最大幅を取得
 */
export function useContentMaxWidth(): number | undefined {
  const { isDesktop, isLargeDesktop } = useResponsive();
  
  if (isLargeDesktop) return 1200;
  if (isDesktop) return 1024;
  return undefined; // モバイル・タブレットは全幅
}

/**
 * レスポンシブな値を取得するユーティリティ
 */
export function useResponsiveValue<T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}): T {
  const { breakpoint } = useResponsive();
  
  const breakpointOrder: BreakpointKey[] = ["sm", "md", "lg", "xl", "2xl"];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // 現在のブレークポイント以下で最も近い定義値を探す
  for (let i = currentIndex; i >= 0; i--) {
    const key = breakpointOrder[i];
    if (values[key] !== undefined) {
      return values[key] as T;
    }
  }
  
  return values.base;
}

/**
 * PC用のホバー効果を適用するかどうか
 */
export function useHoverEffects(): boolean {
  const { isDesktop } = useResponsive();
  // Webかつデスクトップサイズの場合のみホバー効果を有効化
  return Platform.OS === "web" && isDesktop;
}

/**
 * グリッドレイアウト計算フック
 * minItemWidthベースで列数・カード幅・gap・paddingを自動計算
 */
type GridLayout = {
  numColumns: number;
  gap: number;
  paddingHorizontal: number;
  maxWidth?: number;
  containerWidth: number;
  itemWidth: number;
};

export function useGridLayout(options?: {
  minItemWidth?: number;
  maxColumns?: number;
  desktopMaxWidth?: number;
}): GridLayout {
  const { width, isDesktop, isTablet } = useResponsive();

  const minItemWidth = options?.minItemWidth ?? 280;
  const maxColumns = options?.maxColumns ?? 4;
  const desktopMaxWidth = options?.desktopMaxWidth ?? 1200;

  // gap/paddingはブレークポイントで固定（見た目が安定する）
  const gap = isDesktop ? 16 : 8;
  const paddingHorizontal = isDesktop ? 24 : 8;
  const maxWidth = isDesktop ? desktopMaxWidth : undefined;

  // 実効コンテナ幅（desktopは中央寄せ & maxWidth制限）
  const raw = width;
  const limited = maxWidth ? Math.min(raw, maxWidth) : raw;
  const containerWidth = Math.max(0, limited - paddingHorizontal * 2);

  // 列数：minItemWidthベースで自動計算
  const tentative = Math.floor((containerWidth + gap) / (minItemWidth + gap));

  // スマホは最低2列、タブは2〜3、デスクトップは3〜4を許容
  const minCols = isDesktop ? 3 : isTablet ? 2 : 2;
  const maxCols = isDesktop ? maxColumns : isTablet ? Math.min(maxColumns, 3) : 2;

  const numColumns = Math.max(minCols, Math.min(maxCols, tentative || minCols));

  // itemWidth（pxで決める）
  const itemWidth =
    numColumns <= 1
      ? containerWidth
      : Math.floor((containerWidth - gap * (numColumns - 1)) / numColumns);

  return {
    numColumns,
    gap,
    paddingHorizontal,
    maxWidth,
    containerWidth,
    itemWidth,
  };
}
