/**
 * 共通定数のエクスポート
 * 
 * 使用例:
 * import { goalTypeConfig, regionGroups, eventTypeBadge } from "@/constants";
 */

// 都道府県・地域グループ
export * from "./prefectures";

// 目標タイプ
export * from "./goal-types";

// イベントタイプ
export * from "./event-types";

// 既存のエクスポート（後方互換性）
export * from "./theme";
export * from "./colors";
