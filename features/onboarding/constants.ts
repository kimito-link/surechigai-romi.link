/**
 * 君斗りんくのすれ違ひ通信 — 初回オンボーディング v5（ゆっくりりんく中心）
 */

export const ONBOARDING_STORAGE_KEY = "@onboarding_completed_v5";
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
  /** Web + 非 standalone のときだけ表示 */
  webInstallOnly?: boolean;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "hero",
    chip: "会いたい君がいる現在地",
    title: "会いたい君がいる\n現在地",
    description: "DSのすれ違い通信を、\n正確な足あととして残す",
    accent: "pink",
    features: [
      "移動の場所を、あとで行ける精度で保存",
      "思い出の場所にもう一度行ける",
      "推しの軌跡をファンがたどれる",
    ],
    characterType: "rinku",
  },
  {
    id: "live-map",
    chip: "みんなの現在地",
    title: "いま、誰が\nどこにいる？",
    description: "公開中の足あとが\n都道府県マップにリアルタイムで並ぶ",
    accent: "signal",
    features: [
      "サイドナビですぐ都道府県がわかる",
      "直近24時間の記録を一覧",
      "すれ違いの予感が先に届く",
    ],
    characterType: "konta",
  },
  {
    id: "checkin",
    chip: "チェックイン",
    title: "今ここにいる、\nだけで始まる",
    description: "タップ一回で足あとを残す\n同じ場所を通った人とすれ違う",
    accent: "teal",
    features: [
      "チェックインボタンを押すだけ",
      "封筒が届くかもしれない",
      "タイムシフトで過去30日もマッチ",
    ],
    characterType: "rinku",
  },
  {
    id: "trail",
    chip: "軌跡",
    title: "移動の軌跡を\n地図に刻む",
    description: "道路や建物まで辿れる精度\nあとからあの場所へ戻れる",
    accent: "purple",
    features: [
      "正確な lat/lng を OpenStreetMap 上に表示",
      "訪れた市区町村が図鑑に積もる",
      "Xで市区町村粒度の思い出をシェア",
    ],
    characterType: "tanune",
  },
  {
    id: "install",
    chip: "ホーム画面に追加",
    title: "アプリのように\nすぐ開ける",
    description: "ホーム画面に追加すると\nチェックインが1タップで始まる",
    accent: "signal",
    features: [
      "ブラウザのアドレスバー不要",
      "オフラインでも起動画面から再開",
      "通知や位置の許可もスムーズ",
    ],
    characterType: "rinku",
    webInstallOnly: true,
  },
  {
    id: "start",
    chip: "はじめる",
    title: "さあ、\n扉を開こう",
    description: "Xでログインして記録を始める\nゲストでも閲覧できます",
    accent: "pink",
    features: [
      "交流はXへ。アプリ内は一方向の合図",
      "移動専用Xアカウントの利用を推奨",
      "ログイン後、位置の許可でチェックイン",
    ],
    characterType: "rinku",
  },
];
