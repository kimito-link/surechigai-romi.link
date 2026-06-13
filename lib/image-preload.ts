/**
 * 重要な画像のプリロード
 * 
 * アプリ起動時に即座に表示したい画像を事前に読み込む
 */

import { Image } from "expo-image";

// プリロードする画像のリスト（ローカル画像はrequire()で読み込み済み）
// Note: expo-imageのprefetchはリモートURLのみ対応
// ローカル画像はバンドルに含まれているため、prefetchは不要

let isPreloaded = false;

/**
 * 重要な画像をプリロード
 * アプリ起動時に一度だけ呼び出す
 */
export async function preloadCriticalImages(): Promise<void> {
  if (isPreloaded) return;
  
  try {
    // ローカル画像はrequire()でバンドルに含まれているため、
    // expo-imageのprefetchは不要（リモートURLのみ対応）
    // ローカル画像は自動的にキャッシュされる
    isPreloaded = true;
    console.log("[ImagePreload] Critical images preloaded");
  } catch (error) {
    console.warn("[ImagePreload] Failed to preload images:", error);
  }
}

/**
 * リモート画像をプリフェッチ
 * URLの配列を受け取り、事前に読み込む
 */
export async function prefetchRemoteImages(urls: string[]): Promise<void> {
  const validUrls = urls.filter(url => url && typeof url === "string" && url.startsWith("http"));
  
  if (validUrls.length === 0) return;
  
  try {
    await Promise.all(validUrls.map(url => Image.prefetch(url)));
  } catch (error) {
    console.warn("[ImagePreload] Failed to prefetch remote images:", error);
  }
}

/**
 * プリロード状態をリセット（テスト用）
 */
export function resetPreloadState(): void {
  isPreloaded = false;
}
