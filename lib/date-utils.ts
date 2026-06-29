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

/** 相対時間（例: 2 か月前）を日本語で返す */
export function formatRelativeJa(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "たった今";
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin} 分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} 日前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} か月前`;
  return `${Math.floor(diffMonth / 12)} 年前`;
}
