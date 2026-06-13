/**
 * イベントカテゴリ定義
 * 
 * 3軸カテゴリシステム:
 * - ジャンル: アイドル/アーティスト/Vtuber/配信者など
 * - 目的: イベント/グッズ/調査/その他
 * - タグ: 自由入力のキーワード（将来実装）
 */

// ジャンル（活動ジャンル）
export const GENRES = [
  { id: "idol", label: "アイドル", icon: "🎀", color: "#EC4899" },
  { id: "artist", label: "アーティスト", icon: "🎤", color: "#8B5CF6" },
  { id: "vtuber", label: "Vtuber", icon: "🎮", color: "#06B6D4" },
  { id: "streamer", label: "配信者", icon: "📺", color: "#F59E0B" },
  { id: "band", label: "バンド", icon: "🎸", color: "#EF4444" },
  { id: "dancer", label: "ダンサー", icon: "💃", color: "#10B981" },
  { id: "voice_actor", label: "声優", icon: "🎙️", color: "#6366F1" },
  { id: "other", label: "その他", icon: "✨", color: "#64748B" },
] as const;

export type GenreId = typeof GENRES[number]["id"];

// 目的（チャレンジの目的）
// 現在はライブ動員のみに集中（将来的にstreaming/releaseを追加予定）
export const PURPOSES = [
  { id: "live", label: "ライブ・イベント", icon: "🎪", description: "ライブ、コンサート、ファンミーティングなど" },
] as const;

// 将来追加予定の目的（伏線）
// { id: "streaming", label: "配信イベント", icon: "📡", description: "YouTubeプレミア同時視聴など" },
// { id: "release", label: "作品リリース", icon: "💿", description: "漫画、楽曲、動画などの反応を見る" },

// 既存データ用のフォールバック定義（表示のみ、新規作成不可）
export const LEGACY_PURPOSES = [
  { id: "streaming", label: "配信イベント", icon: "📡", description: "YouTube配信、ミクチャ、ツイキャスなど" },
  { id: "release", label: "リリース", icon: "💿", description: "CD、DVD、グッズのリリースイベント" },
  { id: "birthday", label: "生誕祭", icon: "🎂", description: "メンバーの誕生日イベント" },
  { id: "anniversary", label: "周年イベント", icon: "🎉", description: "デビュー周年、グループ結成周年など" },
  { id: "goods", label: "グッズ・物販", icon: "🛍️", description: "グッズ販売、物販イベント" },
  { id: "survey", label: "調査・アンケート", icon: "📊", description: "ファン調査、アンケート企画" },
  { id: "other", label: "その他", icon: "📋", description: "上記に当てはまらないもの" },
] as const;

// 新規作成でサポートされる目的（現在はliveのみ）
export type SupportedPurposeId = typeof PURPOSES[number]["id"];

// 既存データで使われている可能性があるレガシー目的
export type LegacyPurposeId = typeof LEGACY_PURPOSES[number]["id"];

// 全ての目的ID（新規 + レガシー）
export type PurposeId = SupportedPurposeId | LegacyPurposeId;

// ジャンルIDからジャンル情報を取得
export function getGenreById(id: GenreId | string | null | undefined) {
  return GENRES.find((g) => g.id === id) || null;
}

// 目的IDから目的情報を取得（フォールバック対応）
export function getPurposeById(id: PurposeId | string | null | undefined) {
  // まずPURPOSESから検索
  const purpose = PURPOSES.find((p) => p.id === id);
  if (purpose) return purpose;
  
  // 見つからなければLEGACY_PURPOSESから検索（既存データ用）
  return LEGACY_PURPOSES.find((p) => p.id === id) || null;
}

// ジャンルと目的の組み合わせからラベルを生成
export function getCategoryLabel(genreId: GenreId | string | null | undefined, purposeId: PurposeId | string | null | undefined): string {
  const genre = getGenreById(genreId);
  const purpose = getPurposeById(purposeId);
  
  if (genre && purpose) {
    return `${genre.icon} ${genre.label} / ${purpose.icon} ${purpose.label}`;
  } else if (genre) {
    return `${genre.icon} ${genre.label}`;
  } else if (purpose) {
    return `${purpose.icon} ${purpose.label}`;
  }
  return "カテゴリ未設定";
}
