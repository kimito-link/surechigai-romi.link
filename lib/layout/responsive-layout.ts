/**
 * レスポンシブレイアウトの純粋関数。
 * フック/コンポーネントから分離し、vitest で境界値を検証する。
 */
import {
  breakpoints,
  contentMaxWidth,
  NARROW_ROW_WIDTH,
  tabBar,
} from "@/theme/tokens";

export type BreakpointKey = keyof typeof breakpoints;

/** 履歴行を2段レイアウトに切り替えるか */
export function isNarrowTrailRow(
  width: number,
  threshold: number = NARROW_ROW_WIDTH,
): boolean {
  return width < threshold;
}

/** 画面幅からブレークポイントキーを返す */
export function getBreakpointFromWidth(width: number): BreakpointKey {
  if (width >= breakpoints["2xl"]) return "2xl";
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  return "sm";
}

/** 本文の中央寄せ最大幅（タブレット以上で適用） */
export function getBodyMaxWidth(
  width: number,
  size: keyof typeof contentMaxWidth = "standard",
): number | undefined {
  return width < breakpoints.md ? undefined : contentMaxWidth[size];
}

export type TabBarInsetParams = {
  isWeb: boolean;
  safeAreaBottom: number;
  extra?: number;
};

/** ScrollView の paddingBottom（固定タブバー回避） */
export function computeTabBarInset(params: TabBarInsetParams): number {
  const extra = params.extra ?? tabBar.scrollExtra;
  const bottomPadding = params.isWeb
    ? tabBar.webBottomPadding
    : Math.max(params.safeAreaBottom, 8);
  return tabBar.bodyHeight + bottomPadding + extra;
}

export type AppChromeInsetParams = {
  isWeb: boolean;
  inTabs: boolean;
  safeAreaTop: number;
  safeAreaBottom: number;
  headerChromeHeight: number;
  extra?: number;
};

/** ScreenContainer の SafeAreaView padding */
export function computeAppChromeInsets(params: AppChromeInsetParams): {
  paddingTop: number;
  paddingBottom: number;
} {
  const extra = params.extra ?? tabBar.chromeExtra;

  const paddingTop = params.isWeb
    ? params.inTabs
      ? Math.max(params.safeAreaTop, 0)
      : params.headerChromeHeight + Math.max(params.safeAreaTop, 0)
    : Math.max(params.safeAreaTop, 0);

  const tabBarBottom =
    tabBar.bodyHeight +
    (params.isWeb ? tabBar.webBottomPadding : Math.max(params.safeAreaBottom, 8));

  // Web タブ画面: ScrollView 側が tabInset を付与するため、ここではタブバー分を付けない
  const paddingBottom =
    params.isWeb && params.inTabs ? extra : tabBarBottom + extra;

  return { paddingTop, paddingBottom };
}

export type CheckinScrollInsetParams = {
  tabInset: number;
  stickyDockHeight: number;
  mobileWebChrome: number;
};

/** チェックイン地図ファースト ScrollView の paddingBottom */
export function computeCheckinScrollBottomInset(
  params: CheckinScrollInsetParams,
): number {
  return params.tabInset + params.stickyDockHeight + params.mobileWebChrome;
}
