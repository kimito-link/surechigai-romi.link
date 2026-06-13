/**
 * イベントタイプの共通定数
 * 
 * 使用箇所:
 * - app/(tabs)/index.tsx
 * - components/molecules/colorful-challenge-card.tsx
 * - components/molecules/colorful-challenge-card.tsx
 */

/** イベントタイプのバッジ設定 */
export const eventTypeBadge: Record<string, { label: string; color: string }> = {
  solo: { label: "ソロ", color: "#EC4899" },
  group: { label: "グループ", color: "#8B5CF6" },
} as const;

/** イベントタイプのキー */
export type EventType = keyof typeof eventTypeBadge;

/** イベントタイプのバッジ設定値 */
export type EventTypeBadge = (typeof eventTypeBadge)[EventType];

/**
 * イベントタイプのバッジ設定を取得（デフォルト値付き）
 */
export function getEventTypeBadge(eventType: string | null | undefined): EventTypeBadge {
  return eventTypeBadge[eventType || "solo"] || eventTypeBadge.solo;
}

/**
 * イベントタイプのラベルを取得
 */
export function getEventTypeLabel(eventType: string | null | undefined): string {
  return getEventTypeBadge(eventType).label;
}

/**
 * イベントタイプの色を取得
 */
export function getEventTypeColor(eventType: string | null | undefined): string {
  return getEventTypeBadge(eventType).color;
}
