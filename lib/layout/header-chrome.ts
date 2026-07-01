/**
 * Web 固定ヘッダー（AppHeader + コンテキストバー）のスペーサー高さ。
 * 狭幅でアカウントピルが2段になる分を含め、スクロール本文がヘッダー下に隠れないようにする。
 */
import {
  APP_HEADER_CHROME_HEIGHT_COMPACT,
  APP_HEADER_CHROME_HEIGHT_FULL,
  HEADER_NARROW_BREAKPOINT,
  SCREEN_CONTEXT_BAR_MAX_HEIGHT,
} from "@/theme/tokens";

/** 狭幅2段目: ログイン済みアカウントピル */
export const HEADER_NARROW_ACCOUNT_EXTRA = 54;
/** 狭幅2段目: ログインボタン */
export const HEADER_NARROW_LOGIN_EXTRA = 44;

export type TabHeaderSpacerOptions = {
  variant?: "full" | "compact";
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
