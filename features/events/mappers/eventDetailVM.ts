// features/events/mappers/eventDetailVM.ts
// イベント詳細のViewModel型定義と変換関数

/**
 * 目標タイプの設定
 */
export const goalTypeConfig: Record<string, { label: string; icon: string; unit: string }> = {
  attendance: { label: "動員", icon: "people", unit: "人" },
  followers: { label: "フォロワー", icon: "person-add", unit: "人" },
  viewers: { label: "同時視聴", icon: "visibility", unit: "人" },
  points: { label: "ポイント", icon: "star", unit: "pt" },
  custom: { label: "カスタム", icon: "flag", unit: "" },
};

/**
 * イベント詳細のViewModel（画面表示用）
 */
export type EventDetailVM = {
  id: number;
  title: string;
  description: string | null;
  
  // 日時関連
  startDate: Date | null;
  endDate: Date | null;
  dateRangeText: string;
  isUpcoming: boolean;
  isOngoing: boolean;
  isEnded: boolean;
  daysUntilStart: number | null;
  
  // 目標関連
  goalType: string;
  goalTypeLabel: string;
  goalTypeIcon: string;
  goalUnit: string;
  goalTarget: number;
  goalText: string;
  
  // 進捗関連
  currentProgress: number;
  progressPercent: number;
  progressText: string;
  
  // ホスト情報
  hostUserId: number | null;
  hostName: string;
  hostUsername: string | null;
  hostProfileImage: string | null;
  hostTwitterId: string | null;
  
  // 会場情報
  venueName: string | null;
  venueAddress: string | null;
  
  // 公開設定
  isPublic: boolean;
  status: string;
  
  // カテゴリ
  categoryId: number | null;
  categoryName: string | null;
  
  // サムネイル
  thumbnailUrl: string | null;
  
  // AI生成サマリー
  aiSummary: string | null;
  regionSummary: Record<string, number> | null;
};

/**
 * APIレスポンスのイベント型（推論用）
 */
type RawEvent = {
  id: number;
  title: string;
  description: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  goalType: string | null;
  goalTarget: number | null;
  currentProgress?: number;
  hostUserId: number | null;
  hostName?: string;
  hostUsername?: string | null;
  hostProfileImage?: string | null;
  hostTwitterId?: string | null;
  venueName: string | null;
  venueAddress: string | null;
  isPublic: boolean;
  status: string;
  categoryId: number | null;
  categoryName?: string | null;
  thumbnailUrl: string | null;
  aiSummary?: string | null;
  regionSummary?: string | null;
};

/**
 * 日付範囲のテキストを生成
 */
function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start) return "日程未定";
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[d.getDay()];
    return `${year}/${month}/${day}(${weekday})`;
  };
  
  const formatTime = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };
  
  if (!end) {
    return `${formatDate(start)} ${formatTime(start)}〜`;
  }
  
  // 同じ日の場合
  if (start.toDateString() === end.toDateString()) {
    return `${formatDate(start)} ${formatTime(start)}〜${formatTime(end)}`;
  }
  
  return `${formatDate(start)} ${formatTime(start)} 〜 ${formatDate(end)} ${formatTime(end)}`;
}

/**
 * 開始までの日数を計算
 */
function calculateDaysUntil(startDate: Date | null): number | null {
  if (!startDate) return null;
  
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : null;
}

/**
 * イベントをViewModelに変換
 */
export function toEventDetailVM(raw: RawEvent): EventDetailVM {
  const startDate = raw.startDate ? (raw.startDate instanceof Date ? raw.startDate : new Date(raw.startDate)) : null;
  const endDate = raw.endDate ? (raw.endDate instanceof Date ? raw.endDate : new Date(raw.endDate)) : null;
  
  const now = new Date();
  const isUpcoming = startDate ? startDate > now : false;
  const isEnded = endDate ? endDate < now : false;
  const isOngoing = !isUpcoming && !isEnded;
  
  const goalType = raw.goalType ?? "attendance";
  const config = goalTypeConfig[goalType] ?? goalTypeConfig.attendance;
  const goalTarget = raw.goalTarget ?? 0;
  const currentProgress = raw.currentProgress ?? 0;
  const progressPercent = goalTarget > 0 ? Math.min(100, Math.round((currentProgress / goalTarget) * 100)) : 0;
  
  // regionSummaryをパース
  let regionSummary: Record<string, number> | null = null;
  if (raw.regionSummary) {
    try {
      regionSummary = typeof raw.regionSummary === "string" 
        ? JSON.parse(raw.regionSummary) 
        : raw.regionSummary;
    } catch {
      regionSummary = null;
    }
  }
  
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    
    startDate,
    endDate,
    dateRangeText: formatDateRange(startDate, endDate),
    isUpcoming,
    isOngoing,
    isEnded,
    daysUntilStart: calculateDaysUntil(startDate),
    
    goalType,
    goalTypeLabel: config.label,
    goalTypeIcon: config.icon,
    goalUnit: config.unit,
    goalTarget,
    goalText: `目標: ${goalTarget.toLocaleString()}${config.unit}`,
    
    currentProgress,
    progressPercent,
    progressText: `${currentProgress.toLocaleString()} / ${goalTarget.toLocaleString()}${config.unit} (${progressPercent}%)`,
    
    hostUserId: raw.hostUserId,
    hostName: raw.hostName ?? "不明",
    hostUsername: raw.hostUsername ?? null,
    hostProfileImage: raw.hostProfileImage ?? null,
    hostTwitterId: raw.hostTwitterId ?? null,
    
    venueName: raw.venueName,
    venueAddress: raw.venueAddress,
    
    isPublic: raw.isPublic,
    status: raw.status,
    
    categoryId: raw.categoryId,
    categoryName: raw.categoryName ?? null,
    
    thumbnailUrl: raw.thumbnailUrl,
    
    aiSummary: raw.aiSummary ?? null,
    regionSummary,
  };
}
