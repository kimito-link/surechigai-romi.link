/**
 * 内部ナビゲーション用の型定義とユーティリティ
 * v6.38: 型安全なナビゲーション関数を追加
 * 
 * アプリ内のルーティングを型安全に管理します。
 */

import { router } from "expo-router";

// ============================================
// ルート定義
// ============================================

/**
 * 静的ルート（パラメータなし）
 */
export const STATIC_ROUTES = {
  // タブ画面
  HOME: "/(tabs)",
  HOME_ROOT: "/",
  CREATE_TAB: "/(tabs)/create",
  MYPAGE_TAB: "/(tabs)/mypage",
  
  // 認証関連
  OAUTH: "/oauth",
  LOGOUT: "/logout",
  
  // 設定関連
  SETTINGS: "/settings",
  NOTIFICATION_SETTINGS: "/notification-settings",
  PROFILE_EDIT: "/profile/edit",
  HELP: "/help",
  ACHIEVEMENTS: "/achievements",
  API_USAGE: "/admin/api-usage",
  ADMIN: "/admin",
  
  // その他
  TEMPLATES: "/templates",
  CREATE: "/create",
  ONBOARDING: "/onboarding",
  TUTORIAL: "/tutorial",
  INSTALL_INSTRUCTIONS: "/install-instructions",
} as const;

/**
 * 動的ルート（パラメータあり）
 */
export const DYNAMIC_ROUTES = {
  // イベント関連
  EVENT_DETAIL: "/event/[id]",
  EDIT_CHALLENGE: "/edit-challenge/[id]",
  ACHIEVEMENT: "/achievement/[id]",
  DASHBOARD: "/dashboard/[id]",
  MANAGE_COMMENTS: "/manage-comments/[id]",
  COLLABORATORS: "/collaborators/[id]",
  INVITE: "/invite/[id]",
  
  // プロフィール関連
  PROFILE: "/profile/[userId]",
  FOLLOWING: "/following",
  FOLLOWERS: "/followers",
  
  // メッセージ関連
  MESSAGES: "/messages/[id]",
  
  // その他
  JOIN: "/join/[code]",
  REMINDERS: "/reminders/[id]",
} as const;

// ============================================
// 型定義
// ============================================

export type StaticRoute = typeof STATIC_ROUTES[keyof typeof STATIC_ROUTES];
export type DynamicRoute = typeof DYNAMIC_ROUTES[keyof typeof DYNAMIC_ROUTES];

/**
 * ルートパラメータの型定義
 */
export type RouteParams = {
  // 静的ルート
  [STATIC_ROUTES.HOME]: undefined;
  [STATIC_ROUTES.HOME_ROOT]: undefined;
  [STATIC_ROUTES.CREATE_TAB]: undefined;
  [STATIC_ROUTES.MYPAGE_TAB]: undefined;
  [STATIC_ROUTES.OAUTH]: undefined;
  [STATIC_ROUTES.LOGOUT]: undefined;
  [STATIC_ROUTES.SETTINGS]: undefined;
  [STATIC_ROUTES.NOTIFICATION_SETTINGS]: undefined;
  [STATIC_ROUTES.PROFILE_EDIT]: undefined;
  [STATIC_ROUTES.HELP]: undefined;
  [STATIC_ROUTES.ACHIEVEMENTS]: undefined;
  [STATIC_ROUTES.API_USAGE]: undefined;
  [STATIC_ROUTES.TEMPLATES]: undefined;
  [STATIC_ROUTES.CREATE]: undefined;
  [STATIC_ROUTES.ONBOARDING]: undefined;
  [STATIC_ROUTES.TUTORIAL]: undefined;
  [STATIC_ROUTES.INSTALL_INSTRUCTIONS]: undefined;
  
  // 動的ルート
  [DYNAMIC_ROUTES.EVENT_DETAIL]: { id: string | number };
  [DYNAMIC_ROUTES.EDIT_CHALLENGE]: { id: string | number };
  [DYNAMIC_ROUTES.ACHIEVEMENT]: { id: string | number };
  [DYNAMIC_ROUTES.DASHBOARD]: { id: string | number };
  [DYNAMIC_ROUTES.MANAGE_COMMENTS]: { id: string | number };
  [DYNAMIC_ROUTES.COLLABORATORS]: { id: string | number };
  [DYNAMIC_ROUTES.INVITE]: { id: string | number };
  [DYNAMIC_ROUTES.PROFILE]: { userId: string | number };
  [DYNAMIC_ROUTES.FOLLOWING]: { userId: string | number };
  [DYNAMIC_ROUTES.FOLLOWERS]: { userId: string | number };
  [DYNAMIC_ROUTES.MESSAGES]: { id: string | number; challengeId?: string | number };
  [DYNAMIC_ROUTES.JOIN]: { code: string };
  [DYNAMIC_ROUTES.REMINDERS]: { id: string | number };
};

// ============================================
// ナビゲーション関数
// ============================================

/**
 * 型安全なナビゲーション関数
 */
export const navigate = {
  // タブ画面
  toHome: () => {
    console.log("[Navigation] Navigating to home");
    router.push(STATIC_ROUTES.HOME as never);
  },
  
  toCreateTab: () => {
    console.log("[Navigation] Navigating to create tab");
    router.push(STATIC_ROUTES.CREATE_TAB as never);
  },
  
  toMypageTab: () => {
    console.log("[Navigation] Navigating to mypage tab");
    router.push(STATIC_ROUTES.MYPAGE_TAB as never);
  },
  
  toMypageWithReturn: (returnTo: string) => {
    console.log(`[Navigation] Navigating to mypage with return: ${returnTo}`);
    router.push({ pathname: STATIC_ROUTES.MYPAGE_TAB, params: { returnTo } } as never);
  },
  
  // 認証関連
  toOAuth: () => {
    console.log("[Navigation] Navigating to OAuth");
    router.push(STATIC_ROUTES.OAUTH as never);
  },
  
  toLogout: () => {
    console.log("[Navigation] Navigating to logout");
    router.push(STATIC_ROUTES.LOGOUT as never);
  },
  
  // 設定関連
  toSettings: () => {
    console.log("[Navigation] Navigating to settings");
    router.push(STATIC_ROUTES.SETTINGS as never);
  },
  
  toNotificationSettings: () => {
    console.log("[Navigation] Navigating to notification settings");
    router.push(STATIC_ROUTES.NOTIFICATION_SETTINGS as never);
  },
  
  toProfileEdit: () => {
    console.log("[Navigation] Navigating to profile edit");
    router.push(STATIC_ROUTES.PROFILE_EDIT as never);
  },
  
  toHelp: () => {
    console.log("[Navigation] Navigating to help");
    router.push(STATIC_ROUTES.HELP as never);
  },
  
  toAchievements: () => {
    console.log("[Navigation] Navigating to achievements");
    router.push(STATIC_ROUTES.ACHIEVEMENTS as never);
  },
  
toApiUsage: () => {
    console.log("[Navigation] Navigating to api-usage");
    router.push(STATIC_ROUTES.API_USAGE as never);
  },
  
  toAdmin: () => {
    console.log("[Navigation] Navigating to admin dashboard");
    router.push(STATIC_ROUTES.ADMIN as never);
  },
  
  // 管理画面（動的パス）
  toAdminPath: (path: string) => {
    console.log(`[Navigation] Navigating to admin path: ${path}`);
    router.push(path as never);
  },
  
  toAdminChallenge: (id: number | string) => {
    console.log(`[Navigation] Navigating to admin challenge: ${id}`);
    router.push(`/challenge/${id}` as never);
  },
  
  // その他静的ルート
  toTemplates: () => {
    console.log("[Navigation] Navigating to templates");
    router.push(STATIC_ROUTES.TEMPLATES as never);
  },
  
  toCreate: () => {
    console.log("[Navigation] Navigating to create");
    router.push(STATIC_ROUTES.CREATE as never);
  },
  
  toCreateWithTemplate: (template: {
    id: number;
    goalType: string;
    goalValue: number;
    goalUnit: string;
    eventType: string;
    ticketPresale?: string | null;
    ticketDoor?: string | null;
  }) => {
    console.log(`[Navigation] Navigating to create with template: ${template.id}`);
    router.push({
      pathname: STATIC_ROUTES.CREATE_TAB,
      params: {
        templateId: template.id,
        goalType: template.goalType,
        goalValue: template.goalValue,
        goalUnit: template.goalUnit,
        eventType: template.eventType,
        ticketPresale: template.ticketPresale || "",
        ticketDoor: template.ticketDoor || "",
      },
    } as never);
  },
  
  // イベント関連（動的）
  toEventDetail: (id: string | number) => {
    console.log(`[Navigation] Navigating to event detail: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.EVENT_DETAIL, params: { id: String(id) } } as never);
  },
  
  toEventDetailWithInvite: (id: string | number, inviteCode: string) => {
    console.log(`[Navigation] Navigating to event detail with invite: ${id}, code: ${inviteCode}`);
    router.push({ pathname: DYNAMIC_ROUTES.EVENT_DETAIL, params: { id: String(id), inviteCode } } as never);
  },
  
  toEditChallenge: (id: string | number) => {
    console.log(`[Navigation] Navigating to edit challenge: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.EDIT_CHALLENGE, params: { id: String(id) } } as never);
  },
  
  toAchievement: (id: string | number) => {
    console.log(`[Navigation] Navigating to achievement: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.ACHIEVEMENT, params: { id: String(id) } } as never);
  },
  
  toDashboard: (id: string | number) => {
    console.log(`[Navigation] Navigating to dashboard: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.DASHBOARD, params: { id: String(id) } } as never);
  },
  
  toManageComments: (id: string | number) => {
    console.log(`[Navigation] Navigating to manage comments: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.MANAGE_COMMENTS, params: { id: String(id) } } as never);
  },
  
  toCollaborators: (id: string | number) => {
    console.log(`[Navigation] Navigating to collaborators: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.COLLABORATORS, params: { id: String(id) } } as never);
  },
  
  toInvite: (id: string | number) => {
    console.log(`[Navigation] Navigating to invite: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.INVITE, params: { id: String(id) } } as never);
  },
  
  // プロフィール関連（動的）
  toProfile: (userId: string | number) => {
    console.log(`[Navigation] Navigating to profile: ${userId}`);
    router.push({ pathname: DYNAMIC_ROUTES.PROFILE, params: { userId: String(userId) } } as never);
  },
  
  toFollowing: (userId: string | number) => {
    console.log(`[Navigation] Navigating to following: ${userId}`);
    router.push({ pathname: DYNAMIC_ROUTES.FOLLOWING, params: { userId: String(userId) } } as never);
  },
  
  toFollowers: (userId: string | number) => {
    console.log(`[Navigation] Navigating to followers: ${userId}`);
    router.push({ pathname: DYNAMIC_ROUTES.FOLLOWERS, params: { userId: String(userId) } } as never);
  },
  
  // メッセージ関連（動的）
  toMessages: (id: string | number, challengeId?: string | number) => {
    console.log(`[Navigation] Navigating to messages: ${id}, challengeId: ${challengeId}`);
    const params: Record<string, string> = { id: String(id) };
    if (challengeId !== undefined) {
      params.challengeId = String(challengeId);
    }
    router.push({ pathname: DYNAMIC_ROUTES.MESSAGES, params } as never);
  },
  
  // その他動的ルート
  toJoin: (code: string) => {
    console.log(`[Navigation] Navigating to join: ${code}`);
    router.push({ pathname: DYNAMIC_ROUTES.JOIN, params: { code } } as never);
  },
  
  toReminders: (id: string | number) => {
    console.log(`[Navigation] Navigating to reminders: ${id}`);
    router.push({ pathname: DYNAMIC_ROUTES.REMINDERS, params: { id: String(id) } } as never);
  },

  toInstallInstructions: () => {
    console.log("[Navigation] Navigating to install instructions");
    router.push(STATIC_ROUTES.INSTALL_INSTRUCTIONS as never);
  },
  
  toEditParticipation: (participationId: string | number, challengeId: string | number) => {
    console.log(`[Navigation] Navigating to edit participation: ${participationId}, challengeId: ${challengeId}`);
    router.push({ pathname: "/edit-participation/[id]", params: { id: String(participationId), challengeId: String(challengeId) } } as never);
  },
  
  // 戻る
  back: () => {
    console.log("[Navigation] Going back");
    router.back();
  },
};

/**
 * 戻る関数
 */
export const navigateBack = () => {
  console.log("[Navigation] Going back");
  router.back();
};

/**
 * 型安全なリプレース関数（履歴を置き換え）
 */
export const navigateReplace = {
  toHome: () => {
    console.log("[Navigation] Replacing to home");
    router.replace(STATIC_ROUTES.HOME as never);
  },
  
  toHomeRoot: () => {
    console.log("[Navigation] Replacing to home root");
    router.replace(STATIC_ROUTES.HOME_ROOT as never);
  },
  
  toMypageTab: () => {
    console.log("[Navigation] Replacing to mypage tab");
    router.replace(STATIC_ROUTES.MYPAGE_TAB as never);
  },
  
  // 動的ルートへのリプレース
  withUrl: (url: string) => {
    console.log(`[Navigation] Replacing to: ${url}`);
    if (!isValidAppRoute(url)) {
      console.error(`[Navigation] Invalid route for replace: ${url}`);
      return;
    }
    router.replace(url as never);
  },
};

// ============================================
// バリデーション
// ============================================

/**
 * ルートが有効かどうかを検証
 */
export function isValidAppRoute(path: string): boolean {
  // 相対パスは禁止
  if (!path.startsWith("/")) {
    console.warn(`[Navigation] Invalid route (must start with /): ${path}`);
    return false;
  }
  
  // 外部URLは禁止
  if (path.startsWith("http://") || path.startsWith("https://")) {
    console.warn(`[Navigation] External URL passed to app route: ${path}`);
    return false;
  }
  
  return true;
}

/**
 * 動的ルートのパラメータを検証
 */
export function validateRouteParams(route: string, params: Record<string, unknown>): boolean {
  // IDパラメータの検証
  if (route.includes("[id]") && params.id !== undefined) {
    const id = params.id;
    if (typeof id !== "string" && typeof id !== "number") {
      console.warn(`[Navigation] Invalid id param type: ${typeof id}`);
      return false;
    }
    if (typeof id === "number" && (isNaN(id) || id < 0)) {
      console.warn(`[Navigation] Invalid id param value: ${id}`);
      return false;
    }
  }
  
  // userIdパラメータの検証
  if (route.includes("[userId]") && params.userId !== undefined) {
    const userId = params.userId;
    if (typeof userId !== "string" && typeof userId !== "number") {
      console.warn(`[Navigation] Invalid userId param type: ${typeof userId}`);
      return false;
    }
  }
  
  return true;
}

// ============================================
// 後方互換性のためのエクスポート
// ============================================

/**
 * @deprecated APP_ROUTESは非推奨です。STATIC_ROUTESとDYNAMIC_ROUTESを使用してください。
 */
export const APP_ROUTES = {
  ...STATIC_ROUTES,
  EVENT_DETAIL: (id: number | string) => `/event/${id}` as const,
  CHALLENGE_DETAIL: (id: number | string) => `/challenge/${id}` as const,
} as const;

/**
 * @deprecated routesは非推奨です。navigateを使用してください。
 */
export const routes = {
  home: () => STATIC_ROUTES.HOME,
  createChallenge: () => STATIC_ROUTES.CREATE,
  mypage: () => STATIC_ROUTES.MYPAGE_TAB,
  eventDetail: (id: number | string) => `/event/${id}`,
  challengeDetail: (id: number | string) => `/challenge/${id}`,
  settings: () => STATIC_ROUTES.SETTINGS,
  notificationSettings: () => STATIC_ROUTES.NOTIFICATION_SETTINGS,
  login: () => STATIC_ROUTES.OAUTH,
  onboarding: () => STATIC_ROUTES.ONBOARDING,
  tutorial: () => STATIC_ROUTES.TUTORIAL,
} as const;
