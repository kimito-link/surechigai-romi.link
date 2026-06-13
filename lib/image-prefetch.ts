import { Image } from "expo-image";

/**
 * 画像のプリフェッチ（事前読み込み）機能
 * 次に表示されそうな画像を事前に読み込んでおくことで、
 * ユーザーが画面遷移したときに即座に画像を表示できる
 */

// プリフェッチ済みURLのキャッシュ
const prefetchedUrls = new Set<string>();

/**
 * 単一の画像をプリフェッチ
 */
export async function prefetchImage(url: string): Promise<boolean> {
  if (!url || prefetchedUrls.has(url)) {
    return true;
  }

  try {
    await Image.prefetch(url);
    prefetchedUrls.add(url);
    return true;
  } catch (error) {
    console.warn("Image prefetch failed:", url, error);
    return false;
  }
}

/**
 * 複数の画像を並列でプリフェッチ
 */
export async function prefetchImages(urls: string[]): Promise<void> {
  const validUrls = urls.filter(url => url && !prefetchedUrls.has(url));
  
  if (validUrls.length === 0) {
    return;
  }

  // 最大5つずつ並列でプリフェッチ
  const batchSize = 5;
  for (let i = 0; i < validUrls.length; i += batchSize) {
    const batch = validUrls.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(prefetchImage));
  }
}

/**
 * チャレンジリストの画像をプリフェッチ
 * ホストのプロフィール画像などを事前に読み込む
 */
export async function prefetchChallengeImages(challenges: Array<{
  hostProfileImage?: string | null;
  thumbnailUrl?: string | null;
}>): Promise<void> {
  const urls: string[] = [];

  challenges.forEach(challenge => {
    if (challenge.hostProfileImage) {
      urls.push(challenge.hostProfileImage);
    }
    if (challenge.thumbnailUrl) {
      urls.push(challenge.thumbnailUrl);
    }
  });

  await prefetchImages(urls);
}

/**
 * 参加者リストの画像をプリフェッチ
 */
export async function prefetchParticipantImages(participants: Array<{
  profileImage?: string | null;
}>): Promise<void> {
  const urls = participants
    .filter(p => p.profileImage)
    .map(p => p.profileImage as string);

  await prefetchImages(urls);
}

/**
 * 次に表示されそうな画像を予測してプリフェッチ
 * FlatListのonViewableItemsChangedと組み合わせて使用
 */
export function createViewportPrefetcher<T>(
  getImageUrls: (item: T) => string[]
) {
  let lastPrefetchedIndex = -1;

  return (viewableItems: Array<{ item: T; index: number | null }>) => {
    if (viewableItems.length === 0) return;

    // 現在表示されている最後のアイテムのインデックスを取得
    const lastVisibleIndex = Math.max(
      ...viewableItems.map(v => v.index ?? 0)
    );

    // 既にプリフェッチ済みの場合はスキップ
    if (lastVisibleIndex <= lastPrefetchedIndex) return;

    // 次の5アイテムの画像をプリフェッチ
    const nextItems = viewableItems
      .filter(v => v.index !== null && v.index > lastPrefetchedIndex)
      .slice(0, 5);

    const urls = nextItems.flatMap(v => getImageUrls(v.item));
    prefetchImages(urls);

    lastPrefetchedIndex = lastVisibleIndex;
  };
}

/**
 * プリフェッチキャッシュをクリア
 */
export function clearPrefetchCache(): void {
  prefetchedUrls.clear();
}

/**
 * プリフェッチ済みURLの数を取得
 */
export function getPrefetchedCount(): number {
  return prefetchedUrls.size;
}
