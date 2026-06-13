/**
 * 画像最適化設定
 * パフォーマンス向上のための画像読み込み設定
 */

export const IMAGE_CONFIG = {
  // WebP形式を優先
  preferredFormat: "webp" as const,
  
  // サムネイルサイズ
  thumbnailSize: {
    small: 48,   // リスト表示用
    medium: 80,  // カード表示用
    large: 120,  // ヘッダー表示用
  },
  
  // 画像品質（0-100）
  quality: {
    thumbnail: 70,  // サムネイル
    standard: 80,   // 標準画像
    high: 90,       // 高品質画像
  },
  
  // 遅延読み込み設定
  lazyLoading: {
    // 画面外の画像を読み込む距離（ピクセル）
    threshold: 100,
    // プレースホルダー画像
    placeholder: require("@/assets/images/placeholder.png"),
  },
  
  // キャッシュ設定
  cache: {
    // メモリキャッシュのサイズ（MB）
    memorySize: 50,
    // ディスクキャッシュのサイズ（MB）
    diskSize: 200,
  },
} as const;
