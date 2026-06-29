/**
 * アプリ内ブラウザ（WebView）判定と「外部ブラウザへの脱出方法」決定。
 * kimitolink-linktree/lib/in-app-browser.ts と同一。
 */

export type MobileOs = "ios" | "android" | "other";

export type EscapeStrategy = "android-intent" | "copy-link";

export function isInAppBrowser(ua: string): boolean {
  return /\b(Line|Instagram|FBAN|FBAV|Twitter)\b/i.test(ua || "");
}

export function detectMobileOs(ua: string): MobileOs {
  const s = ua || "";
  if (/iPhone|iPad|iPod/i.test(s)) return "ios";
  if (/Android/i.test(s)) return "android";
  return "other";
}

export function escapeStrategyFor(ua: string): EscapeStrategy {
  return detectMobileOs(ua) === "android" ? "android-intent" : "copy-link";
}

export function buildAndroidChromeIntentUrl(targetUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const hostAndPath = `${parsed.host}${parsed.pathname}${parsed.search}`;
  const fallback = encodeURIComponent(parsed.toString());
  return (
    `intent://${hostAndPath}#Intent;scheme=${parsed.protocol.replace(":", "")};` +
    `package=com.android.chrome;S.browser_fallback_url=${fallback};end`
  );
}
