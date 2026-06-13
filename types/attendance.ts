/**
 * types/attendance.ts
 * 
 * 参加方法に関する型定義
 */

/**
 * 参加方法の種類
 * - venue: 会場参加のみ
 * - streaming: 配信視聴のみ
 * - both: 両方参加
 */
export type AttendanceType = "venue" | "streaming" | "both";

/**
 * 参加方法の表示情報
 */
export interface AttendanceTypeInfo {
  value: AttendanceType;
  label: string;
  description: string;
  icon: string;
}

/**
 * 参加方法の選択肢
 */
export const ATTENDANCE_TYPES: Record<AttendanceType, AttendanceTypeInfo> = {
  venue: {
    value: "venue",
    label: "会場参加",
    description: "会場に足を運んで、生の熱量を共有する",
    icon: "location-on",
  },
  streaming: {
    value: "streaming",
    label: "配信視聴",
    description: "同じ時間に配信を見て、みんなと熱狂を共有する",
    icon: "play-circle",
  },
  both: {
    value: "both",
    label: "両方参加",
    description: "会場でも配信でも、同じ時間に熱狂を共有する",
    icon: "done-all",
  },
} as const;

/**
 * 参加方法別のメッセージ
 */
export const ATTENDANCE_MESSAGES: Record<AttendanceType, string> = {
  venue: "会場で会おうね！",
  streaming: "配信で一緒に盛り上がろうね！",
  both: "会場でも配信でも一緒だよ！",
} as const;
