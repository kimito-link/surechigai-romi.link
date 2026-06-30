import { describe, it, expect } from "vitest";
import {
  isNarrowTrailRow,
  getBreakpointFromWidth,
  getBodyMaxWidth,
  computeTabBarInset,
  computeAppChromeInsets,
  computeCheckinScrollBottomInset,
} from "@/lib/layout/responsive-layout";
import {
  breakpoints,
  contentMaxWidth,
  NARROW_ROW_WIDTH,
  tabBar,
  CHECKIN_STICKY_DOCK_HEIGHT,
} from "@/theme/tokens";

describe("isNarrowTrailRow", () => {
  it("320px（計画の実害幅）では狭幅=true", () => {
    expect(isNarrowTrailRow(320)).toBe(true);
  });

  it("360px でも狭幅=true", () => {
    expect(isNarrowTrailRow(360)).toBe(true);
  });

  it("419px は狭幅=true（閾値未満）", () => {
    expect(isNarrowTrailRow(NARROW_ROW_WIDTH - 1)).toBe(true);
  });

  it("420px 以上は1行レイアウト", () => {
    expect(isNarrowTrailRow(NARROW_ROW_WIDTH)).toBe(false);
    expect(isNarrowTrailRow(768)).toBe(false);
  });
});

describe("getBreakpointFromWidth", () => {
  it("計画どおりのブレークポイント境界", () => {
    expect(getBreakpointFromWidth(639)).toBe("sm");
    expect(getBreakpointFromWidth(768)).toBe("md");
    expect(getBreakpointFromWidth(1024)).toBe("lg");
    expect(getBreakpointFromWidth(1280)).toBe("xl");
    expect(getBreakpointFromWidth(1536)).toBe("2xl");
  });
});

describe("getBodyMaxWidth", () => {
  it("767px以下は全幅（undefined）", () => {
    expect(getBodyMaxWidth(360)).toBeUndefined();
    expect(getBodyMaxWidth(breakpoints.md - 1)).toBeUndefined();
  });

  it("768px以上は standard=980", () => {
    expect(getBodyMaxWidth(768)).toBe(contentMaxWidth.standard);
    expect(getBodyMaxWidth(1440)).toBe(contentMaxWidth.standard);
  });

  it("narrow サイズ指定", () => {
    expect(getBodyMaxWidth(1024, "narrow")).toBe(contentMaxWidth.narrow);
  });
});

describe("computeTabBarInset", () => {
  it("Web: 56 + 12 + 24 = 92（計画の tabInset 値）", () => {
    expect(
      computeTabBarInset({
        isWeb: true,
        safeAreaBottom: 0,
        extra: tabBar.scrollExtra,
      }),
    ).toBe(tabBar.bodyHeight + tabBar.webBottomPadding + tabBar.scrollExtra);
    expect(
      computeTabBarInset({
        isWeb: true,
        safeAreaBottom: 0,
        extra: tabBar.scrollExtra,
      }),
    ).toBe(92);
  });

  it("Native: safeAreaBottom を考慮", () => {
    expect(
      computeTabBarInset({
        isWeb: false,
        safeAreaBottom: 34,
        extra: tabBar.scrollExtra,
      }),
    ).toBe(tabBar.bodyHeight + 34 + tabBar.scrollExtra);
  });
});

describe("computeAppChromeInsets", () => {
  const base = {
    isWeb: true,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    headerChromeHeight: 124,
    extra: tabBar.chromeExtra,
  };

  it("Webタブ画面: 下部は chromeExtra のみ（ScrollView が tabInset を担当）", () => {
    const { paddingBottom } = computeAppChromeInsets({ ...base, inTabs: true });
    expect(paddingBottom).toBe(tabBar.chromeExtra);
    expect(paddingBottom).toBe(16);
  });

  it("Web非タブ画面: タブバー高さ + chromeExtra", () => {
    const { paddingBottom } = computeAppChromeInsets({ ...base, inTabs: false });
    expect(paddingBottom).toBe(
      tabBar.bodyHeight + tabBar.webBottomPadding + tabBar.chromeExtra,
    );
    expect(paddingBottom).toBe(84);
  });

  it("Webタブ画面で二重計上しない（tabInset + ScreenContainer < 120）", () => {
    const tabInset = computeTabBarInset({
      isWeb: true,
      safeAreaBottom: 0,
      extra: tabBar.scrollExtra,
    });
    const { paddingBottom } = computeAppChromeInsets({ ...base, inTabs: true });
    // 以前: 84 + 92 = 176。修正後: 16 + 92 = 108（タブバー68 + 余白40）
    expect(paddingBottom + tabInset).toBeLessThan(120);
    expect(paddingBottom + tabInset).toBe(108);
  });

  it("Web: 上部はヘッダー高さ + safeAreaTop", () => {
    const { paddingTop } = computeAppChromeInsets({ ...base, inTabs: true });
    expect(paddingTop).toBe(124);
  });
});

describe("computeCheckinScrollBottomInset", () => {
  it("地図ファースト時: tabInset + stickyDock + mobileWebChrome", () => {
    const tabInset = 92;
    const mobileWebChrome = 40;
    expect(
      computeCheckinScrollBottomInset({
        tabInset,
        stickyDockHeight: CHECKIN_STICKY_DOCK_HEIGHT,
        mobileWebChrome,
      }),
    ).toBe(tabInset + CHECKIN_STICKY_DOCK_HEIGHT + mobileWebChrome);
    expect(
      computeCheckinScrollBottomInset({
        tabInset,
        stickyDockHeight: CHECKIN_STICKY_DOCK_HEIGHT,
        mobileWebChrome,
      }),
    ).toBe(208);
  });

  it("mobileWebChrome=0 では stickyDock のみ上乗せ", () => {
    expect(
      computeCheckinScrollBottomInset({
        tabInset: 92,
        stickyDockHeight: CHECKIN_STICKY_DOCK_HEIGHT,
        mobileWebChrome: 0,
      }),
    ).toBe(168);
  });
});
