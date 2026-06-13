/**
 * ジャンル定義（思想・前提・ポリシーベース）
 *
 * 思想: 迷わない／分かりやすい／集中できる
 * 前提: hostは後で追加できる、既存データは保持
 * ポリシー: UIだけ絞る、DBは触らない、既存データを壊さない
 */

export const SUPPORTED_GENRES = ["live", "youtube"] as const;
export type SupportedGenre = (typeof SUPPORTED_GENRES)[number];

export type AnyGenre = SupportedGenre | "host" | "other" | (string & {});

// 画面表示用ラベル
export const GENRE_LABEL: Record<string, string> = {
  live: "ライブ動画",
  youtube: "YouTubeリアルタイム視聴動員",
  host: "ホスト",
  other: "その他",
};

export const isSupportedGenre = (genre: string): genre is SupportedGenre => {
  return (SUPPORTED_GENRES as readonly string[]).includes(genre);
};

export const toGenreLabel = (genre: string): string => {
  return GENRE_LABEL[genre] ?? `非対応ジャンル（${genre}）`;
};

export const isLegacyGenre = (genre: string): boolean => {
  return genre === "host" || genre === "other";
};
