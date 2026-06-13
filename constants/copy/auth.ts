/**
 * 認証まわりの文言定数
 * 既存の login-messages.ts の文言もここに統合予定
 */
export const authCopy = {
  login: {
    prompt: "ログインすると、参加履歴やお気に入りが使えるよ！",
    promptAlt: "ログインして、もっと楽しく推し活しよう！",
    community: "一緒に推しを応援しよう！ログインして参加しよう！",
    communityAlt: "みんなと一緒に推しを盛り上げよう！",
    planning: "ログインすると、あなたの応援が記録されるよ！",
    loginWithX: "Xでログイン",
    loginRequired: "ログインが必要です",
  },
  logout: {
    confirm: "ログアウトしますか？",
  },
} as const;
