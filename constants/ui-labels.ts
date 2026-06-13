/**
 * UI用語マッピング
 * 
 * 専門用語を初心者向けのわかりやすい言葉に置き換える
 * 管理画面・UI全体で統一して使用する
 */

export const UI_LABELS = {
  // ナビゲーション・メニュー
  dashboard: "参加状況",
  dashboardAdmin: "管理画面",
  collaborators: "共同主催者",
  templates: "保存した設定",
  achievements: "実績バッジ",
  rankings: "ランキング",
  notifications: "お知らせ",
  settings: "設定",
  profile: "プロフィール",
  
  // チャレンジ関連
  challenge: "チャレンジ",
  challenges: "チャレンジ一覧",
  createChallenge: "チャレンジを作る",
  myChallenges: "参加中のチャレンジ",
  hostedChallenges: "主催したチャレンジ",
  
  // 目標タイプ
  attendance: "来場者数",
  followers: "フォロワー数",
  viewers: "視聴者数",
  points: "ポイント",
  custom: "カスタム",
  
  // イベントタイプ
  solo: "ソロ",
  group: "グループ",
  
  // 参加関連
  join: "参加する",
  participate: "参加表明",
  participants: "参加者",
  participantCount: "参加者数",
  
  // 統計・データ
  statistics: "データ",
  analytics: "分析",
  progress: "進捗",
  goalProgress: "目標達成率",
  
  // アクション
  share: "シェア",
  invite: "招待",
  edit: "編集",
  delete: "削除",
  save: "保存",
  cancel: "キャンセル",
  confirm: "確認",
  
  // 状態
  active: "開催中",
  completed: "終了",
  upcoming: "開催予定",
  draft: "下書き",
  
  // ロール
  owner: "主催者",
  coHost: "共同主催者",
  moderator: "スタッフ",
  participant: "参加者",
  
  // その他
  myPage: "マイページ",
  home: "ホーム",
  search: "検索",
  filter: "絞り込み",
  sort: "並び替え",
} as const;

/**
 * 用語を取得するヘルパー関数
 */
export function getLabel(key: keyof typeof UI_LABELS): string {
  return UI_LABELS[key];
}

/**
 * ダッシュボード関連の用語変換
 */
export const DASHBOARD_LABELS = {
  title: "参加状況",
  subtitle: "チャレンジの進捗を確認",
  overview: "概要",
  details: "詳細",
  stats: "統計データ",
  chart: "グラフ",
  export: "データを出力",
} as const;

/**
 * コラボレーター関連の用語変換
 */
export const COLLABORATOR_LABELS = {
  title: "共同主催者",
  subtitle: "一緒にチャレンジを運営するメンバー",
  invite: "メンバーを招待",
  remove: "メンバーを外す",
  changeRole: "役割を変更",
  roles: {
    owner: "主催者",
    "co-host": "共同主催者",
    moderator: "スタッフ",
  },
  status: {
    pending: "招待中",
    accepted: "参加中",
    declined: "辞退",
  },
} as const;

/**
 * テンプレート関連の用語変換
 */
export const TEMPLATE_LABELS = {
  title: "保存した設定",
  subtitle: "よく使う設定を保存して再利用",
  myTemplates: "自分の設定",
  publicTemplates: "みんなの設定",
  save: "設定を保存",
  use: "この設定を使う",
  delete: "削除",
  empty: "保存した設定はまだありません",
  emptyHint: "チャレンジ作成時に保存できます",
} as const;
