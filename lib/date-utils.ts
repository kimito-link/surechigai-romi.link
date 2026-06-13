/**
 * 日付ユーティリティ
 */

import { ONE_DAY_MS } from "@/constants/const";

/** ISO日付文字列を日本語表記（例: 2025年6月15日）にフォーマット */
export function formatJaDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** ISO日付文字列から現在日時までの残り日数（切り上げ）を返す */
export function getDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  return Math.ceil(diff / ONE_DAY_MS);
}
