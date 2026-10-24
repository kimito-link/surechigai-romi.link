/**
 * ペイウォール（app/premium.tsx）の表示ロジック。React に依存しない純粋関数だけを置く。
 *
 * - 機能ゲートから来たときの1行案内（docs/monetization-DESIGN.md B-4:
 *   「この機能はプレミアムで使えます」と1行で示す。煽り・カウントダウンは禁止）
 * - 特典の並び順: いま使える機能を先に、準備中は後ろにまとめる
 *   （「準備中」が先頭に混ざると、払って得られるものが薄く見える）
 */
import type { PremiumFeatureKey } from "@/lib/premium-features";

/** /premium?from=<key> の from に許す値。未知の値は無視する（任意文字列を画面に出さない）。 */
export type PaywallSource = PremiumFeatureKey;

export function parsePaywallSource(raw: unknown): PaywallSource | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const allowed: readonly PaywallSource[] = ["adFree", "export", "advancedStats", "markerCustom"];
  return (allowed as readonly string[]).includes(value) ? (value as PaywallSource) : null;
}

/** 機能ゲートから来たときの1行案内。features の label を使い、文言の二重管理をしない。 */
export function paywallContextLine(
  source: PaywallSource | null,
  features: Record<PremiumFeatureKey, { label: string; shipped: boolean }>,
): string | null {
  if (!source) return null;
  const feature = features[source];
  if (!feature) return null;
  return feature.shipped
    ? `「${feature.label}」はプレミアムでご利用いただけます。`
    : `「${feature.label}」は準備中のプレミアム機能です。`;
}

/** いま使える機能を先に。同じ区分の中では定義順を保つ。 */
export function orderPremiumFeatureKeys<K extends string>(
  features: Record<K, { shipped: boolean }>,
): K[] {
  const keys = Object.keys(features) as K[];
  return [
    ...keys.filter((k) => features[k].shipped),
    ...keys.filter((k) => !features[k].shipped),
  ];
}
