/**
 * ナビゲーションユーティリティ
 * v6.38: 型安全なナビゲーション関数を追加
 * 
 * 外部リンクと内部ナビゲーションを一元管理します。
 */

// 外部リンク用
export {
  openExternalUrl,
  openTwitterProfile,
  openTwitterDM,
  openTwitterShare,
  openYouTubeVideo,
  openYouTubeChannel,
  openTwitcastingLive,
  openShowroomRoom,
  openTicketSite,
  getAllowedDomains,
} from "./external-links";

// 内部ナビゲーション用
export {
  // 型安全なナビゲーション関数
  navigate,
  navigateBack,
  navigateReplace,
  
  // ルート定義
  STATIC_ROUTES,
  DYNAMIC_ROUTES,
  
  // バリデーション
  isValidAppRoute,
  validateRouteParams,
  
  // 型定義
  type StaticRoute,
  type DynamicRoute,
  type RouteParams,
  
  // 後方互換性（非推奨）
  APP_ROUTES,
  routes,
} from "./app-routes";
