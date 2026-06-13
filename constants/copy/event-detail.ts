/**
 * イベント詳細画面の文言定数
 * 差し替え可能な形で一元管理
 */
export const eventDetailCopy = {
  section: {
    participation: "参加表明",
  },
  actions: {
    participate: "参加表明する",
    participateLogin: "参加表明するにはログインが必要です",
    participateLoginDesc: "参加表明にはXログインが必要です。",
    participateDone: "参加表明済みです",
    participateDoneDesc: "上のメッセージ一覧であなたの投稿を確認できます",
    edit: "参加表明を編集",
    cancel: "キャンセル",
    submit: "送信",
    update: "更新する",
    submitting: "送信中...",
  },
  labels: {
    participant: "参加者",
    prefecture: "都道府県を選択してください",
    prefectureRequired: "都道府県を選択してください",
    gender: "性別",
    companions: "一緒に参加する友人",
    message: "応援メッセージ",
    attendanceType: "リアルタイム参加方法",
    attendanceTypeHint: "同じ時間を共有する仲間を募集中",
    venue: "会場参加",
    streaming: "配信視聴",
    both: "両方",
  },
  login: {
    required: "ログインが必要です",
    loginWithX: "Xでログイン",
  },
  errors: {
    prefectureRequired: "都道府県を選択してください",
    failed: "参加表明に失敗しました",
  },
  success: {
    participated: "参加表明完了！",
    participatedMessage: "あなたの応援メッセージが反映されました",
    updated: "参加表明を更新しました",
  },
  confirmations: {
    cancel: "参加表明を取り消しますか？",
    cancelDesc: "参加表明を取り消すと、応援メッセージが非表示になります。\n主催者には引き続き表示されます。",
  },
} as const;
