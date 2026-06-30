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
  NARROW_ROW_WIDTH,
  tabBar,
  CHECKIN_STICKY_DOCK_HEIGHT,
  CHECKIN_MOBILE_WEB_CHROME,
} from "./layout";
export { typographyScale } from "./typography";
export type { TypographyScaleKey } from "./typography";
