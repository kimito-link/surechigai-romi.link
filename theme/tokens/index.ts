// theme/tokens/index.ts
// グローバルトークンのエクスポート

export { palette } from "./palette";
export type { PaletteKey, PaletteValue } from "./palette";

export { color } from "./semantic";
export type { SemanticColor } from "./semantic";

export { grad } from "./gradients";
export type { Gradients } from "./gradients";

export {
  spacing,
  typography,
  borderRadius,
  shadows,
  touchTarget,
  animation,
  zIndex,
  breakpoints,
  contentMaxWidth,
  HEADER_NARROW_BREAKPOINT,
  NARROW_ROW_WIDTH,
  APP_HEADER_CHROME_HEIGHT,
  APP_HEADER_CHROME_HEIGHT_COMPACT,
  APP_HEADER_CHROME_HEIGHT_FULL,
  SCREEN_CONTEXT_BAR_HEIGHT,
  SCREEN_CONTEXT_BAR_MAX_HEIGHT,
  tabBar,
  CHECKIN_STICKY_DOCK_HEIGHT,
  CHECKIN_MOBILE_WEB_CHROME,
} from "./layout";
export { typographyScale } from "./typography";
export type { TypographyScaleKey } from "./typography";
