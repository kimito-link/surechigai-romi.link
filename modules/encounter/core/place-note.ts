/**
 * modules/encounter/core/place-note.ts
 *
 * 場所メモの表示に関する純粋関数。
 * 設計は docs/place-info-DESIGN.md。
 */

/** これを超えたら「古い情報」として減光する（消しはしない） */
export const PLACE_NOTE_STALE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * メモが古いか。
 *
 * ガソリン価格のように数日で変わる情報があるため、鮮度は必ず利用者に見せる。
 * ただし自動削除はしない（足あとを消さないという設計方針と矛盾するため）。
 */
export function isPlaceNoteStale(
  noteUpdatedAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!noteUpdatedAt) return false;
  const updated =
    noteUpdatedAt instanceof Date ? noteUpdatedAt : new Date(noteUpdatedAt);
  if (Number.isNaN(updated.getTime())) return false;
  return now.getTime() - updated.getTime() > PLACE_NOTE_STALE_DAYS * DAY_MS;
}

/** メモに必ず添える「いつの情報か」。例: 2026/7/31時点 */
export function formatPlaceNoteDate(
  noteUpdatedAt: Date | string | null | undefined,
): string | null {
  if (!noteUpdatedAt) return null;
  const d =
    noteUpdatedAt instanceof Date ? noteUpdatedAt : new Date(noteUpdatedAt);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}時点`;
}

/** メモとして表示すべき中身があるか */
export function hasPlaceNote(point: {
  placeName?: string | null;
  note?: string | null;
}): boolean {
  return Boolean(point.placeName?.trim() || point.note?.trim());
}
