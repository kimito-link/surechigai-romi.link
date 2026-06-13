/**
 * modules/encounter/core/privacy.ts
 *
 * プライバシー保護ユーティリティ。
 *
 * - homeMaskCell 判定: 最頻セル（自宅推定）と同一 h3R8 なら areaName を「ひみつの場所」に置換
 * - 表示粒度は市区町村まで（丁目・番地は除外）
 *
 * DB・認証・Express に非依存の純粋TS。
 */

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const HOME_MASK_LABEL = "ひみつの場所";

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

export type AreaDisplayInfo = {
  areaName: string;
  municipality: string | null;
  prefecture: string | null;
};

// ---------------------------------------------------------------------------
// 関数
// ---------------------------------------------------------------------------

/**
 * 対象の h3R8 セルが自宅マスクセルと一致するかを判定する。
 *
 * @param locationH3R8 - チェックイン位置の H3 res8 セル
 * @param homeMaskCell - userSettings.homeMaskCell（null なら常に false）
 */
export function isHomeMasked(
  locationH3R8: string,
  homeMaskCell: string | null | undefined
): boolean {
  if (!homeMaskCell) return false;
  return locationH3R8 === homeMaskCell;
}

/**
 * 自宅マスクが有効な場合、エリア表示情報を「ひみつの場所」に置換して返す。
 * 表示粒度は市区町村まで（prefecture は残す）。
 *
 * @param info   - 元のエリア表示情報
 * @param masked - isHomeMasked() の結果
 */
export function applyHomeMask(
  info: AreaDisplayInfo,
  masked: boolean
): AreaDisplayInfo {
  if (!masked) return info;
  return {
    areaName: HOME_MASK_LABEL,
    municipality: null,
    prefecture: info.prefecture, // 都道府県は残す（より粗い粒度）
  };
}

/**
 * areaName から丁目・番地レベルの情報を除去して市区町村粒度に丸める。
 * 例: "桜丘町(渋谷区)" → "桜丘(渋谷区)" ではなく原文をそのまま返す（geocoding側で対処済み）
 * ここでは末尾の "N丁目" パターンのみ削除する安全策。
 */
export function sanitizeAreaName(areaName: string): string {
  return areaName.replace(/\d+丁目$/, "").trim();
}
