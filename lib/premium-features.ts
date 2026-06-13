/**
 * プレミアム機能のリスト
 */
export const PREMIUM_FEATURES = [
  {
    id: "create_challenge",
    name: "チャレンジ作成",
    description: "新しいチャレンジを作成できます",
    icon: "add-circle",
    isPremium: true,
  },
  {
    id: "statistics",
    name: "統計ダッシュボード",
    description: "詳細な統計情報を閲覧できます",
    icon: "analytics",
    isPremium: true,
  },
  {
    id: "collaboration",
    name: "コラボ機能",
    description: "他のホストと共同でチャレンジを開催できます",
    icon: "people",
    isPremium: true,
  },
  {
    id: "export",
    name: "データエクスポート",
    description: "参加者データをエクスポートできます",
    icon: "download",
    isPremium: true,
  },
  {
    id: "templates",
    name: "テンプレート保存",
    description: "チャレンジ設定をテンプレートとして保存できます",
    icon: "bookmark",
    isPremium: true,
  },
] as const;

/**
 * 機能がプレミアム限定かどうかをチェック
 */
export function isPremiumFeature(featureId: string): boolean {
  const feature = PREMIUM_FEATURES.find((f) => f.id === featureId);
  return feature?.isPremium ?? false;
}
