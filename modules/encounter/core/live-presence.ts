/**
 * リアルタイム居場所（レーダー公開）の定数・判定。
 */

/** この時間より古い更新は「オフライン」扱い */
export const LIVE_PRESENCE_STALE_MS = 5 * 60 * 1000;

/** クライアントの位置送信間隔（目安・watch 補助用） */
export const LIVE_PRESENCE_PULSE_INTERVAL_MS = 30 * 1000;

/** 連続 pulse の最短間隔（API / バッテリー保護） */
export const LIVE_PRESENCE_MIN_PULSE_GAP_MS = 10 * 1000;

export function isLivePresenceFresh(
  updatedAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!updatedAt) return false;
  const t = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(String(updatedAt));
  if (!Number.isFinite(t)) return false;
  return nowMs - t <= LIVE_PRESENCE_STALE_MS;
}

/** 吹き出し用の短い地名（市区町村から県名プレフィックスを除く） */
export function shortPlaceLabel(
  municipality: string | null | undefined,
  prefecture: string | null | undefined,
): string | null {
  if (municipality) {
    const trimmed = municipality.trim();
    if (prefecture && trimmed.startsWith(prefecture)) {
      const rest = trimmed.slice(prefecture.length).trim();
      if (rest.length > 0) return rest.length > 12 ? `${rest.slice(0, 11)}…` : rest;
    }
    return trimmed.length > 12 ? `${trimmed.slice(0, 11)}…` : trimmed;
  }
  if (prefecture) {
    return prefecture.replace(/[都道府県]$/, "");
  }
  return null;
}
