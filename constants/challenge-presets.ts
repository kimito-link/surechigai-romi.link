/**
 * チャレンジ作成プリセット
 * 
 * よく使う設定をワンタップで適用できるプリセット定義
 * 初心者でも迷わずチャレンジを作成できるようにする
 */

export interface ChallengePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  goalType: "attendance" | "followers" | "viewers" | "points" | "custom";
  goalValue: number;
  goalUnit: string;
  eventType: "solo" | "group";
  // 推奨値（ユーザーが変更可能）
  suggestedTicketPresale?: number;
  suggestedTicketDoor?: number;
}

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    id: "live_small",
    name: "小規模ライブ",
    description: "ライブハウスでのワンマン・対バン",
    icon: "music",
    goalType: "attendance",
    goalValue: 50,
    goalUnit: "人",
    eventType: "solo",
    suggestedTicketPresale: 3000,
    suggestedTicketDoor: 3500,
  },
  {
    id: "live_medium",
    name: "中規模ライブ",
    description: "ホール・大型ライブハウス",
    icon: "guitar",
    goalType: "attendance",
    goalValue: 200,
    goalUnit: "人",
    eventType: "solo",
    suggestedTicketPresale: 4000,
    suggestedTicketDoor: 4500,
  },
  {
    id: "live_large",
    name: "大規模ライブ",
    description: "アリーナ・ドーム公演",
    icon: "star",
    goalType: "attendance",
    goalValue: 1000,
    goalUnit: "人",
    eventType: "solo",
    suggestedTicketPresale: 8000,
    suggestedTicketDoor: 9000,
  },
  {
    id: "streaming",
    name: "配信イベント",
    description: "YouTube/Twitchなどの生配信",
    icon: "video",
    goalType: "viewers",
    goalValue: 100,
    goalUnit: "人",
    eventType: "solo",
  },
  {
    id: "youtube_premiere",
    name: "YouTube プレミア公開",
    description: "新曲・MV公開の同時視聴",
    icon: "play",
    goalType: "viewers",
    goalValue: 500,
    goalUnit: "人",
    eventType: "solo",
  },
  {
    id: "fan_meeting",
    name: "ファンミーティング",
    description: "交流会・握手会・チェキ会",
    icon: "users",
    goalType: "attendance",
    goalValue: 30,
    goalUnit: "人",
    eventType: "solo",
    suggestedTicketPresale: 2000,
    suggestedTicketDoor: 2500,
  },
  {
    id: "group_event",
    name: "グループイベント",
    description: "複数アーティストの合同イベント",
    icon: "people-group",
    goalType: "attendance",
    goalValue: 300,
    goalUnit: "人",
    eventType: "group",
    suggestedTicketPresale: 3500,
    suggestedTicketDoor: 4000,
  },
  {
    id: "follower_goal",
    name: "フォロワー目標",
    description: "SNSフォロワー数の目標達成",
    icon: "user-plus",
    goalType: "followers",
    goalValue: 1000,
    goalUnit: "人",
    eventType: "solo",
  },
  {
    id: "custom",
    name: "カスタム",
    description: "自由に設定する",
    icon: "sliders",
    goalType: "custom",
    goalValue: 100,
    goalUnit: "人",
    eventType: "solo",
  },
];

/**
 * プリセットIDからプリセットを取得
 */
export function getPresetById(id: string): ChallengePreset | undefined {
  return CHALLENGE_PRESETS.find(preset => preset.id === id);
}

/**
 * 目標タイプに基づいてプリセットをフィルタリング
 */
export function getPresetsByGoalType(goalType: string): ChallengePreset[] {
  return CHALLENGE_PRESETS.filter(preset => preset.goalType === goalType);
}
