/**
 * lib/footprint-map-consent.ts — チェックインした足あとを、ほかの人の地図に出してよいかの本人の答え。
 *
 * 2026-11-21 iOS build 556 が Guideline 5.1.2(i) で却下された（地図に位置を出す前に許可を求め、
 * 断れるようにすること）。iOS では初回チェックインの前に1回だけ聞き、答えを端末に保存する。
 *   - "public"  … 地図に出す（従来どおり）
 *   - "private" … 自分だけ（チェックインした足あとを private で保存し、軌跡の公開範囲も private にする）
 * マイページで軌跡の公開範囲を変えたら、ここも合わせて書き換える（mypage-authenticated-screen）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "surechigai.footprintMapConsent.v1";

export type FootprintMapConsent = "public" | "private";

export async function readFootprintMapConsent(): Promise<FootprintMapConsent | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "public" || v === "private" ? v : null;
  } catch {
    return null;
  }
}

export async function saveFootprintMapConsent(value: FootprintMapConsent): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value);
  } catch {
    // 保存できなくても次回もう一度聞くだけ
  }
}
