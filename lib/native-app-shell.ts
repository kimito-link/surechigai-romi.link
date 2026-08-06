/**
 * lib/native-app-shell.ts
 *
 * iOS/Android のネイティブアプリとして動いているかの判定。
 *
 * 判定を2系統持つ理由（2026-08-06 追記・重要）:
 * ビルド方式を Capacitor から Expo prebuild へ切り替えている途中で、構成によって
 * 「ネイティブである」ことの現れ方が違う。
 *
 *   - Capacitor（server.url でリモートWebを WebView で読む構成）:
 *     ネイティブアプリの中でも Platform.OS === "web" になる。Platform では判別できず、
 *     window.Capacitor.isNativePlatform() を見るしかない。
 *   - Expo prebuild（バンドルJSを実行する構成）:
 *     Platform.OS === "ios" | "android" になる。window.Capacitor は存在しない。
 *
 * 片方だけを見ると却下が再発する。prebuild 後に Capacitor 判定だけを残すと
 * 常に false になり、auto=x の自動クリックが復活して 4.8 を、
 * CTA の「無料」が復活して 2.3.7 を再び踏む。よって両方を OR で見る。
 *
 * なぜ必要か（2026-08-05 App Store 却下 / Guideline 4.8）:
 * ログイン導線は「1タップではじめる」= X を自動で押す設計だった。Sign in with Apple は
 * 以前から実装済みだったが、自動クリックのせいで審査員が Apple を選ぶ機会そのものが無く、
 * 「サードパーティログインしか提供していない」と判定された。
 * ストア審査の対象になるネイティブアプリでだけ自動遷移を止め、プロバイダを明示的に
 * 選ばせる必要がある（Web の 1 タップ UX は維持する）。
 */

import { Platform } from "react-native";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
};

/** Capacitor シェル（server.url 構成）として動いているか。 */
function isCapacitorShell(win?: Window & typeof globalThis): boolean {
  const w = win ?? (typeof window !== "undefined" ? window : undefined);
  if (!w) return false;
  try {
    const C = (w as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
    return !!C && typeof C.isNativePlatform === "function" && C.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * ストア配布されたネイティブアプリとして動いているか。
 *
 * @param win テスト用に window を差し替える。省略時はグローバルの window。
 */
export function isNativeAppShell(win?: Window & typeof globalThis): boolean {
  // Expo prebuild 構成: Platform がそのままネイティブを指す。
  if (Platform.OS === "ios" || Platform.OS === "android") return true;
  // Capacitor 構成: Platform.OS === "web" になるのでブリッジを見る。
  return isCapacitorShell(win);
}

/**
 * ログインCTAの補足文。
 *
 * ネイティブアプリでは価格表現（「無料」）を出さない。App Store は
 * スクリーンショットを含むメタデータでの価格言及を認めておらず、
 * 「無料や割引への言及も価格表現」と明記している
 * （2026-08-05 Guideline 2.3.7 で実際に却下された）。
 * Web 側は販促上の価値があるので従来どおり「無料」を出す。
 */
export function loginCtaNote(): string {
  return isNativeAppShell()
    ? "1タップ / 新規登録もこちら"
    : "無料・1タップ / 新規登録もこちら";
}
