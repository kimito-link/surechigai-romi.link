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
  WEB_TAB_BAR_HEIGHT,
  CHECKIN_STICKY_DOCK_HEIGHT,
  CHECKIN_MOBILE_WEB_CHROME,
} from "./layout";
export { typographyScale } from "./typography";
export type { TypographyScaleKey } from "./typography";

/**
 * CDNキャッシュ・エポック。
 * Metro は「子チャンクの参照先URL」をファイル名ハッシュに含めないため、
 * 子チャンクだけが変わるデプロイでは親チャンクが「同名・別内容」になり、
 * CDN の immutable キャッシュ（Cloudflare/Vercel edge）が旧内容を配り続ける
 * （2026-07-04 の本番障害: 修正版 clerk-root-provider が配信されなかった真因）。
 * ほぼ全チャンクが本モジュールを import しているため、この値を +1 すると
 * 全チャンクの内容＝ファイル名が変わり、キャッシュ汚染を強制的に払える。
 * デプロイが「反映されない」時は +1 してデプロイすること。
 */
export const CDN_CACHE_EPOCH = 13; // 2026-07-14: ダッシュボード再設計Step5(マイページ残りカードのborderRadius8px収束)を確実に配信するため+1
