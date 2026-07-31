import { describe, it, expect } from "vitest";
import {
  isPlaceNoteStale,
  formatPlaceNoteDate,
  hasPlaceNote,
  PLACE_NOTE_STALE_DAYS,
} from "@/modules/encounter/core/place-note";

const NOW = new Date("2026-07-31T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("isPlaceNoteStale", () => {
  it("30日以内は古くない", () => {
    expect(isPlaceNoteStale(daysAgo(0), NOW)).toBe(false);
    expect(isPlaceNoteStale(daysAgo(29), NOW)).toBe(false);
    expect(isPlaceNoteStale(daysAgo(PLACE_NOTE_STALE_DAYS), NOW)).toBe(false);
  });

  it("30日を超えたら古い", () => {
    expect(isPlaceNoteStale(daysAgo(31), NOW)).toBe(true);
    expect(isPlaceNoteStale(daysAgo(365), NOW)).toBe(true);
  });

  it("メモが無い（null/undefined）なら古くない扱い", () => {
    expect(isPlaceNoteStale(null, NOW)).toBe(false);
    expect(isPlaceNoteStale(undefined, NOW)).toBe(false);
  });

  it("文字列の日付も扱える（APIがISO文字列を返すため）", () => {
    expect(isPlaceNoteStale(daysAgo(31).toISOString(), NOW)).toBe(true);
    expect(isPlaceNoteStale(daysAgo(1).toISOString(), NOW)).toBe(false);
  });

  it("壊れた日付は古くない扱い（表示を壊さない）", () => {
    expect(isPlaceNoteStale("not-a-date", NOW)).toBe(false);
  });
});

describe("formatPlaceNoteDate", () => {
  it("「いつの情報か」を返す", () => {
    expect(formatPlaceNoteDate(new Date("2026-07-31T09:00:00"))).toBe(
      "2026/7/31時点",
    );
  });

  it("メモが無ければ null", () => {
    expect(formatPlaceNoteDate(null)).toBeNull();
    expect(formatPlaceNoteDate(undefined)).toBeNull();
  });

  it("壊れた日付は null（表示を壊さない）", () => {
    expect(formatPlaceNoteDate("not-a-date")).toBeNull();
  });
});

describe("hasPlaceNote", () => {
  it("場所名かメモのどちらかがあれば true", () => {
    expect(hasPlaceNote({ placeName: "岡谷SS", note: null })).toBe(true);
    expect(hasPlaceNote({ placeName: null, note: "レギュラー153円" })).toBe(true);
  });

  it("両方空なら false", () => {
    expect(hasPlaceNote({ placeName: null, note: null })).toBe(false);
    expect(hasPlaceNote({})).toBe(false);
  });

  it("空白だけは中身なし扱い", () => {
    expect(hasPlaceNote({ placeName: "   ", note: "" })).toBe(false);
  });
});
