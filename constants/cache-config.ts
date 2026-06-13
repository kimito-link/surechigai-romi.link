/**
 * キャッシュ戦略設定
 * ブラウザキャッシュとデータキャッシュの最適化
 */

export const CACHE_CONFIG = {
  // ブラウザキャッシュの有効期限（秒）
  cacheControl: {
    // 静的アセット（画像、フォントなど）
    static: 31536000, // 1年
    // APIレスポンス
    api: 300, // 5分
    // HTML
    html: 0, // キャッシュしない
  },
  
  // データキャッシュの有効期限（ミリ秒）
  dataCache: {
    // チャレンジ一覧
    challenges: 5 * 60 * 1000, // 5分
    // ユーザー情報
    user: 10 * 60 * 1000, // 10分
    // カテゴリー
    categories: 60 * 60 * 1000, // 1時間
  },
  
  // Stale-While-Revalidate設定
  swr: {
    enabled: true,
    // 古いデータを表示しながら再検証する期間（秒）
    staleTime: 60,
  },
} as const;
