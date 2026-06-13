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
    title: "ようこそ！",
    description: "君斗りんくの動員ちゃれんじへ\nようこそ！",
    emoji: "🎉",
    backgroundColor: "#0a1628", // 宇宙ダークブルー
    features: [
      "推しの生誕祭を盛り上げよう",
      "全国のファンと一緒に参加",
      "目標達成を目指そう",
    ],
    characterType: "all",
    showLogo: true,
  },
  {
    id: "challenges",
    title: "チャレンジに参加",
    description: "好きなイベントを見つけて\n参加表明しよう",
    emoji: "🎯",
    backgroundColor: "#0a1628",
    features: [
      "ホーム画面でチャレンジを探す",
      "参加ボタンをタップ",
      "都道府県と応援メッセージを入力",
    ],
    characterType: "rinku",
  },
  {
    id: "friends",
    title: "友達と一緒に",
    description: "友達を誘って\nもっと盛り上げよう",
    emoji: "👥",
    backgroundColor: "#0a1628",
    features: [
      "友達を同行者として追加",
      "SNSでシェアして拡散",
      "みんなで目標達成を目指す",
    ],
    characterType: "konta",
  },
  {
    id: "map",
    title: "全国マップ",
    description: "日本全国から\n参加者が集まります",
    emoji: "🗾",
    backgroundColor: "#0a1628",
    features: [
      "都道府県別の参加者を確認",
      "地域ごとの盛り上がりをチェック",
      "あなたの地域を代表しよう",
    ],
    characterType: "tanune",
  },
  {
    id: "start",
    title: "さあ、始めよう！",
    description: "推しの生誕祭を\n一緒に盛り上げましょう",
    emoji: "🚀",
    backgroundColor: "#0a1628",
    features: [
      "Xアカウントでログイン",
      "お気に入りのチャレンジを見つける",
      "参加して応援しよう",
    ],
    characterType: "all",
    showLogo: true,
  },
];
