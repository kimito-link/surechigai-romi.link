/**
 * Event Detail Screen Constants
 * イベント詳細画面で使用する定数
 */

import { Dimensions } from "react-native";

/**
 * 画面幅
 */
export const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * 進捗グリッドの最大セル数
 */
export const MAX_GRID_CELLS = 100;

/**
 * 進捗グリッドのセルサイズ計算
 */
export const calculateCellSize = (screenWidth: number): number => {
  return Math.floor((screenWidth - 64) / 10);
};

/**
 * 勢い判定の閾値
 */
export const MOMENTUM_THRESHOLDS = {
  /** 24時間以内の参加者数がこれ以上なら「ホット」 */
  HOT_24H: 5,
  /** 1時間以内の参加者数がこれ以上なら「ホット」 */
  HOT_1H: 2,
} as const;

/**
 * マイルストーン定義
 */
export const MILESTONES = [
  { count: 1, message: "最初の参加者!" },
  { count: 10, message: "10人達成!" },
  { count: 50, message: "50人達成!" },
  { count: 100, message: "100人達成!" },
  { count: 500, message: "500人達成!" },
  { count: 1000, message: "1000人達成!" },
] as const;

/**
 * マイルストーンメッセージを取得
 */
export const getMilestoneMessage = (count: number): string | undefined => {
  const milestone = MILESTONES.find(m => m.count === count);
  return milestone?.message;
};

/**
 * 日程未定を示す年
 */
export const UNDECIDED_DATE_YEAR = 9999;

/**
 * シェアプロンプト表示までの遅延（ミリ秒）
 */
export const SHARE_PROMPT_DELAY = 2000;

/**
 * メッセージセクションへのスクロール遅延（ミリ秒）
 */
export const SCROLL_TO_MESSAGES_DELAY = 600;

/**
 * デフォルトのシェアハッシュタグ
 */
export const DEFAULT_HASHTAGS = ["動員ちゃれんじ", "KimitoLink"] as const;

/**
 * シェアURL生成
 */
export const generateShareUrl = (challengeId: number): string => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/event/${challengeId}`;
  }
  return `https://doin-challenge.com/event/${challengeId}`;
};

/**
 * シェアメッセージ生成
 */
export const generateShareMessage = (
  title: string,
  currentValue: number,
  goalValue: number,
  unit: string,
  progress: number,
  remaining: number
): string => {
  return `🎯 ${title}\n\n📊 現在 ${currentValue}/${goalValue}${unit}（${Math.round(progress)}%）\nあと${remaining}${unit}で目標達成！\n\n一緒に応援しよう！`;
};

/**
 * 日付フォーマット
 */
export const formatEventDate = (date: Date): string => {
  if (date.getFullYear() === UNDECIDED_DATE_YEAR) {
    return "日程未定";
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
