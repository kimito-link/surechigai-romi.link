/**
 * Web 固定ヘッダー（AppHeader + コンテキストバー）のスペーサー高さ。
 * 狭幅でアカウントピルが2段になる分を含め、スクロール本文がヘッダー下に隠れないようにする。
 */
import {
  APP_HEADER_CHROME_HEIGHT_COMPACT,
  APP_HEADER_CHROME_HEIGHT_FOCUSED,
  APP_HEADER_CHROME_HEIGHT_FOCUSED_WIDE,
  APP_HEADER_CHROME_HEIGHT_FULL,
  HEADER_FOCUSED_WIDE_BREAKPOINT,
  HEADER_NARROW_BREAKPOINT,
  SCREEN_CONTEXT_BAR_MAX_HEIGHT,
} from "@/theme/tokens";

/** 狭幅2段目: ログイン済みアカウントピル */
export const HEADER_NARROW_ACCOUNT_EXTRA = 54;
/**
 * 狭幅2段目: ログインボタン。
 * ログインボタンは AppHeader の1段目（メニューの隣）に出るため、2段目は存在しない。
 * 以前は 44px を確保しており、ゲスト画面のヘッダー下に約44pxの空白帯ができていた（2026-10-18 実測）。
 */
export const HEADER_NARROW_LOGIN_EXTRA = 0;

export type TabHeaderSpacerOptions = {
  variant?: "full" | "compact" | "focused";
  hasContextBar?: boolean;
  windowWidth?: number;
  hasLoggedInAccountRow?: boolean;
  hasLoginButtonRow?: boolean;
};

export function isHeaderNarrowLayout(windowWidth: number): boolean {
  return windowWidth < HEADER_NARROW_BREAKPOINT;
}

/** TabHeaderSpacer / ScrollView 上端余白の目安高さ */
export function computeTabHeaderSpacerHeight(options: TabHeaderSpacerOptions): number {
  const variant = options.variant ?? "compact";

  // focused はアカウント行を chrome 高さに含めている。狭幅の追加分は足さない。
  if (variant === "focused") {
    const wide =
      options.windowWidth != null && options.windowWidth >= HEADER_FOCUSED_WIDE_BREAKPOINT;
    let height = wide ? APP_HEADER_CHROME_HEIGHT_FOCUSED_WIDE : APP_HEADER_CHROME_HEIGHT_FOCUSED;
    if (options.hasContextBar) height += SCREEN_CONTEXT_BAR_MAX_HEIGHT;
    return height;
  }

  const base =
    variant === "compact" ? APP_HEADER_CHROME_HEIGHT_COMPACT : APP_HEADER_CHROME_HEIGHT_FULL;
  let height = base;

  const isNarrow =
    options.windowWidth != null
      ? isHeaderNarrowLayout(options.windowWidth)
      : false;

  if (isNarrow) {
    if (options.hasLoggedInAccountRow) height += HEADER_NARROW_ACCOUNT_EXTRA;
    else if (options.hasLoginButtonRow) height += HEADER_NARROW_LOGIN_EXTRA;
  }

  if (options.hasContextBar) {
    height += SCREEN_CONTEXT_BAR_MAX_HEIGHT;
  }

  return height;
}
