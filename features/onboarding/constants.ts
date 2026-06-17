/**
 * オンボーディングチュートリアルの定数とスライドデータ
 * v6.31: 宇宙テーマとキャラクター対応
 */

// v6.164: ストレージキーを変更して、既存ユーザーにもオンボーディングを再表示
export const ONBOARDING_STORAGE_KEY = "@onboarding_completed_v2";

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
  backgroundColor: string;
  features?: string[];
  // v6.31: キャラクター表示用
  characterType?: "all" | "rinku" | "konta" | "tanune";
  showLogo?: boolean;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    title: "全国のりんくちゃんファンへ",
    description: "推しと同じ空気を吸うファンが\n今日もどこかにいる",
    emoji: "🎉",
    backgroundColor: "#0a1628",
    features: [
      "全国のファンと「すれちがう」",
      "出会いが図鑑に積み上がっていく",
      "地図が日本全土に広がる",
    ],
    characterType: "all",
    showLogo: true,
  },
  {
    id: "checkin",
    title: "今いる場所でチェックイン",
    description: "難しいことは何もない\n今ここにいるだけで始まる",
    emoji: "📍",
    backgroundColor: "#0a1628",
    features: [
      "チェックインボタンをタップするだけ",
      "すれちがったファンの封筒が届く",
      "同じ場所にいた人と記念に残る",
    ],
    characterType: "rinku",
  },
  {
    id: "friends",
    title: "一人でも、みんなといる",
    description: "遠くの友達も、初めて会う人も\n同じ推しでつながっている",
    emoji: "👥",
    backgroundColor: "#0a1628",
    features: [
      "友達と同行者登録ができる",
      "SNSで盛り上がりをシェア",
      "推しの記念日を一緒に祝おう",
    ],
    characterType: "konta",
  },
  {
    id: "map",
    title: "あなたが地図を塗り替える",
    description: "チェックインするたびに\n日本の地図が広がっていく",
    emoji: "🗾",
    backgroundColor: "#0a1628",
    features: [
      "47都道府県コレクションに挑戦",
      "地域別の参加者数をリアルタイム確認",
      "あなたの足跡が永遠に記録される",
    ],
    characterType: "tanune",
  },
  {
    id: "start",
    title: "さあ、扉を開こう",
    description: "Xアカウントでログインするだけ\n今日、誰かとすれちがうかもしれない",
    emoji: "✨",
    backgroundColor: "#0a1628",
    features: [
      "ログインは30秒",
      "チェックイン後すぐに封筒が届くことも",
      "推しの生誕祭を、全国のファンと",
    ],
    characterType: "all",
    showLogo: true,
  },
];
