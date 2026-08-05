/**
 * lib/native-app-shell.ts
 *
 * iOS/Android のネイティブアプリ（Capacitor シェル）として動いているかの判定。
 *
 * このアプリは capacitor.config.json の server.url でリモートWebを読む構成なので、
 * ネイティブアプリの中でも Platform.OS === "web" になる。Platform では判別できないため
 * Capacitor のブリッジ有無で見る（lib/location-start-policy.ts の判定と同じ考え方）。
 *
 * なぜ必要か（2026-08-05 App Store 却下 / Guideline 4.8）:
 * ログイン導線は「1タップではじめる」= X を自動で押す設計だった。Sign in with Apple は
 * 以前から実装済みだったが、自動クリックのせいで審査員が Apple を選ぶ機会そのものが無く、
 * 「サードパーティログインしか提供していない」と判定された。
 * ストア審査の対象になるネイティブアプリでだけ自動遷移を止め、プロバイダを明示的に
 * 選ばせる必要がある（Web の 1 タップ UX は維持する）。
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
};

export function isNativeAppShell(win?: Window & typeof globalThis): boolean {
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
