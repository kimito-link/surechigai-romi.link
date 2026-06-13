/**
 * 共通タイポグラフィトークン（フォントサイズ）
 *
 * TOKENS_INVENTORY 方針: meta=12, body=14, title=16 を定義し、
 * 各 feature は必要に応じて参照する。直書きの fontSize 数を減らす。
 */
export const typographyScale = {
  meta: 12,
  body: 14,
  title: 16,
  lg: 18,
  xl: 20,
} as const;

export type TypographyScaleKey = keyof typeof typographyScale;
