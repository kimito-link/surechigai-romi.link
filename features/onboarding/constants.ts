/**
 * 君斗りんくのすれ違ひ通信 — 初回オンボーディング v7
 * ログイン後チュートリアル完了のあとに表示（起動時ブロックなし）
 */

export const ONBOARDING_STORAGE_KEY = "@onboarding_completed_v7";
/** v6 完了ユーザーの再表示を防ぐ */
export const ONBOARDING_STORAGE_KEY_LEGACY = "@onboarding_completed_v6";
export const POST_LOGIN_LOCATION_INTRO_KEY = "@post_login_location_intro_v1";

export type OnboardingSlideAccent = "pink" | "purple" | "teal" | "signal";

export type OnboardingCharacterType = "all" | "rinku" | "konta" | "tanune";

export interface OnboardingSlide {
  id: string;
  chip: string;
  title: string;
  description: string;
  accent: OnboardingSlideAccent;
  features?: string[];
  characterType: OnboardingCharacterType;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "hero",
    chip: "会いたい君がいる現在地",
    title: "会いたい君がいる\n現在地",
    description: "移動の足あとを、あとで行ける\n正確な場所として残す",
    accent: "signal",
    characterType: "rinku",
  },
  {
    id: "checkin",
    chip: "チェックイン",
    title: "今ここにいる、\nだけで始まる",
    description: "タップ一回で足あとを残す\n同じ場所を通った人とすれ違う",
    accent: "signal",
    characterType: "konta",
  },
  {
    id: "start",
    chip: "はじめる",
    title: "さあ、足あとを\n残しにいこう",
    description: "交流はXへ。アプリ内は一方向の合図\n移動専用アカウントの利用もおすすめ",
    accent: "signal",
    characterType: "tanune",
  },
];
