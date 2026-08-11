/**
 * 協賛カードの表示頻度をクライアント側で抑える。
 *
 * サーバー（sponsor_config.dailyCap）でも上限をかけているが、
 * こちらは「そもそも取りに行かない」ための前段。無駄なクエリを減らす。
 *
 * ⚠️ カウンタは **全スロット共通**（キーを1つしか持たない）。
 * スロットごとに数えると checkin_complete / zukan_feed / mypage_stats で
 * 1日 3×3=9 回出てしまい、体感がうるさくなる。
 * 「1日にこのアプリで見る協賛は最大3枚」を守るのが狙い。
 *
 * 元は checkin-authenticated-screen.tsx に閉じていた実装を、
 * 図鑑・マイページからも使えるよう切り出した（挙動は変えていない）。
 */
import { Platform } from "react-native";

/** 1日に表示してよい上限（全スロット合計） */
export const SPONSOR_CLIENT_CAP = 3;

/** localStorage のキー。既存の値をそのまま引き継ぐため変更しないこと */
export const SPONSOR_CLIENT_COUNTER_KEY = "kimito:sponsor-impressions";

export type SponsorClientCounter = {
  date: string;
  count: number;
};

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function readSponsorClientCounter(): SponsorClientCounter {
  const fallback = { date: todayKey(), count: 0 };
  if (Platform.OS !== "web" || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SPONSOR_CLIENT_COUNTER_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SponsorClientCounter>;
    // 日付が変わっていたら 0 から数え直す
    if (parsed.date !== fallback.date || typeof parsed.count !== "number") return fallback;
    return { date: parsed.date, count: Math.max(0, parsed.count) };
  } catch {
    return fallback;
  }
}

/** まだ今日の枠が残っているか（＝クエリを投げてよいか） */
export function canRequestSponsorCard(): boolean {
  return readSponsorClientCounter().count < SPONSOR_CLIENT_CAP;
}

/**
 * 1枚表示したことを記録する。
 * @returns まだ次の枠が残っているか
 */
export function rememberSponsorCardDisplay(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return true;
  try {
    const current = readSponsorClientCounter();
    const next = {
      date: todayKey(),
      count: Math.min(SPONSOR_CLIENT_CAP, current.count + 1),
    };
    window.localStorage.setItem(SPONSOR_CLIENT_COUNTER_KEY, JSON.stringify(next));
    return next.count < SPONSOR_CLIENT_CAP;
  } catch {
    return true;
  }
}
