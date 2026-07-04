/**
 * modules/encounter/core/checkin-guards.ts
 *
 * encounter.checkIn ルーターの入力ガード・値組み立てを純粋関数として抽出。
 * DB・認証・geocodeの副作用順序は一切変更しない（server/routers 側の呼び出し順は
 * modules/encounter/api/encounter.ts に残したまま）。
 *
 * DB・認証・Express に非依存の純粋TS。
 */

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

/** これを超える accuracy（メートル）のチェックインは拒否する */
export const MAX_ACCEPTABLE_ACCURACY_M = 10_000;

// ---------------------------------------------------------------------------
// 関数
// ---------------------------------------------------------------------------

/**
 * チェックインの位置精度が許容範囲かどうかを判定する。
 * accuracy が undefined の場合は「精度不明」として許可する（既存挙動維持）。
 */
export function isAcceptableAccuracy(accuracy: number | undefined): boolean {
  if (accuracy === undefined) return true;
  return accuracy <= MAX_ACCEPTABLE_ACCURACY_M;
}

/**
 * userSettings.locationPausedUntil から、位置情報の記録が一時停止中かどうかを判定する。
 *
 * @param locationPausedUntil - userSettings の一時停止解除日時（null/undefined なら停止していない）
 * @param now                 - 判定基準時刻（テスト容易性のため注入可能。省略時は new Date()）
 */
export function isLocationRecordingPaused(
  locationPausedUntil: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!locationPausedUntil) return false;
  return locationPausedUntil > now;
}

/**
 * チェックインの市区町村を決定する。
 * クライアントから明示的に municipality が渡された場合はそれを優先し、
 * なければ逆ジオコーディング結果（geocoded）にフォールバックする。
 */
export function resolveMunicipality(
  clientMunicipality: string | undefined,
  geocodedMunicipality: string | null | undefined,
): string | null {
  return clientMunicipality ?? geocodedMunicipality ?? null;
}

/**
 * matching.findMatches の結果から、自己マッチ（userAId === userBId）を除外する。
 * 通常は発生しない想定だが、checkIn ルーター内の防御的フィルタを純粋関数化したもの。
 */
export function excludeSelfMatches<T extends { userAId: number; userBId: number }>(
  matches: T[],
): T[] {
  return matches.filter((m) => m.userAId !== m.userBId);
}
