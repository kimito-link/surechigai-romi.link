import { Platform } from "react-native";

/**
 * 画像フォーマット最適化ユーティリティ
 * 
 * WebP形式は従来のJPEG/PNGと比較して:
 * - 25-35%小さいファイルサイズ
 * - 同等以上の画質
 * - 透過対応
 */

/**
 * WebPサポートの検出
 * 
 * @returns WebPがサポートされているかどうか
 */
export function supportsWebP(): boolean {
  // ネイティブ環境ではexpo-imageがWebPをサポート
  if (Platform.OS !== "web") {
    return true;
  }

  // Web環境ではブラウザのサポートを確認
  if (typeof document === "undefined") {
    return false;
  }

  // Canvas APIを使用してWebPサポートを検出
  try {
    const canvas = document.createElement("canvas");
    if (canvas.getContext && canvas.getContext("2d")) {
      // WebPのdata URLを生成できるか確認
      return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    }
  } catch (e) {
    // エラーが発生した場合はサポートなしとみなす
  }

  return false;
}

// WebPサポートをキャッシュ
let webpSupported: boolean | null = null;

/**
 * WebPサポートを取得（キャッシュ付き）
 */
export function isWebPSupported(): boolean {
  if (webpSupported === null) {
    webpSupported = supportsWebP();
  }
  return webpSupported;
}

/**
 * 画像URLをWebP形式に変換
 * 
 * CDNやサーバーがWebP変換をサポートしている場合に使用
 * 
 * @param url - 元の画像URL
 * @param options - 変換オプション
 * @returns 最適化された画像URL
 */
export function optimizeImageUrl(
  url: string | undefined | null,
  options: {
    /** 幅（ピクセル） */
    width?: number;
    /** 高さ（ピクセル） */
    height?: number;
    /** 画質（1-100） */
    quality?: number;
    /** WebPを強制使用 */
    forceWebP?: boolean;
  } = {}
): string {
  if (!url) return "";

  const { width, height, quality = 80, forceWebP = false } = options;

  // WebPをサポートしていない場合は元のURLを返す
  if (!forceWebP && !isWebPSupported()) {
    return url;
  }

  // 既にWebP形式の場合はそのまま返す
  if (url.endsWith(".webp")) {
    return url;
  }

  // Cloudinary URLの場合
  if (url.includes("cloudinary.com")) {
    return transformCloudinaryUrl(url, { width, height, quality });
  }

  // imgix URLの場合
  if (url.includes("imgix.net")) {
    return transformImgixUrl(url, { width, height, quality });
  }

  // Twitter/X画像の場合はそのまま返す（パラメータ追加で404になるため）
  if (url.includes("pbs.twimg.com")) {
    return url;
  }

  // その他のURLはそのまま返す
  return url;
}

/**
 * Cloudinary URLを最適化
 */
function transformCloudinaryUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number }
): string {
  const { width, height, quality = 80 } = options;
  
  // Cloudinaryの変換パラメータを構築
  const transforms: string[] = [];
  
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`q_${quality}`);
  transforms.push("f_webp"); // WebP形式に変換
  
  // URLに変換パラメータを挿入
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex !== -1) {
    const before = url.substring(0, uploadIndex + 8);
    const after = url.substring(uploadIndex + 8);
    return `${before}${transforms.join(",")}/${after}`;
  }
  
  return url;
}

/**
 * imgix URLを最適化
 */
function transformImgixUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number }
): string {
  const { width, height, quality = 80 } = options;
  
  const urlObj = new URL(url);
  
  if (width) urlObj.searchParams.set("w", String(width));
  if (height) urlObj.searchParams.set("h", String(height));
  urlObj.searchParams.set("q", String(quality));
  urlObj.searchParams.set("fm", "webp"); // WebP形式に変換
  urlObj.searchParams.set("auto", "compress"); // 自動圧縮
  
  return urlObj.toString();
}

/**
 * Twitter画像URLを最適化
 * 
 * Twitter画像URLのサイズパラメータ:
 * - ?name=thumb (150x150)
 * - ?name=small (680x680)
 * - ?name=medium (1200x1200)
 * - ?name=large (2048x2048)
 * - ?name=orig (オリジナル)
 */
function transformTwitterImageUrl(
  url: string,
  options: { width?: number; quality?: number }
): string {
  const { width } = options;
  
  // 既存のサイズパラメータを削除
  let baseUrl = url.replace(/\?.*$/, "");
  
  // 幅に基づいて適切なサイズを選択
  let size = "medium";
  if (width) {
    if (width <= 150) size = "thumb";
    else if (width <= 680) size = "small";
    else if (width <= 1200) size = "medium";
    else size = "large";
  }
  
  // WebP形式を要求（Twitterがサポートしている場合）
  return `${baseUrl}?name=${size}&format=webp`;
}

/**
 * 画像のプレースホルダーURLを生成
 * 
 * 低解像度のプレースホルダー画像を生成して
 * プログレッシブローディングを実現
 */
export function getPlaceholderUrl(
  url: string | undefined | null,
  options: { width?: number; blur?: number } = {}
): string {
  if (!url) return "";

  const { width = 20, blur = 10 } = options;

  // Cloudinary URLの場合
  if (url.includes("cloudinary.com")) {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex !== -1) {
      const before = url.substring(0, uploadIndex + 8);
      const after = url.substring(uploadIndex + 8);
      return `${before}w_${width},e_blur:${blur * 100},q_10/${after}`;
    }
  }

  // imgix URLの場合
  if (url.includes("imgix.net")) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("w", String(width));
    urlObj.searchParams.set("blur", String(blur * 20));
    urlObj.searchParams.set("q", "10");
    return urlObj.toString();
  }

  // その他のURLはそのまま返す
  return url;
}

/**
 * 画像サイズのプリセット
 */
export const IMAGE_SIZE_PRESETS = {
  /** サムネイル（アバター等） */
  thumbnail: { width: 64, height: 64, quality: 75 },
  /** 小（リストアイテム等） */
  small: { width: 150, height: 150, quality: 80 },
  /** 中（カード等） */
  medium: { width: 400, height: 300, quality: 85 },
  /** 大（詳細画面等） */
  large: { width: 800, height: 600, quality: 90 },
  /** フル幅（ヒーロー画像等） */
  fullWidth: { width: 1200, height: 800, quality: 90 },
} as const;

/**
 * デバイスのピクセル密度に基づいて画像サイズを調整
 */
export function getResponsiveImageSize(
  baseWidth: number,
  baseHeight?: number
): { width: number; height?: number } {
  // React Nativeではピクセル密度を考慮
  const pixelRatio = Platform.OS === "web" 
    ? (typeof window !== "undefined" ? window.devicePixelRatio : 1)
    : 2; // ネイティブではデフォルト2x

  // 最大3xまで
  const ratio = Math.min(pixelRatio, 3);

  return {
    width: Math.round(baseWidth * ratio),
    height: baseHeight ? Math.round(baseHeight * ratio) : undefined,
  };
}
