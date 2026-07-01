/**
 * 初回起動の位置取得ポリシー（fujisan-clean 互換）。
 * - 通常タブ: 明示同意後のみ自動開始
 * - PWA / TWA / ホーム画面: 再訪問時も自動開始
 */

export function detectInstalledWebShell(refs?: {
  window?: Window & typeof globalThis;
  document?: Document;
  navigator?: Navigator;
}): boolean {
  const w = refs?.window ?? (typeof window !== "undefined" ? window : undefined);
  const d = refs?.document ?? (typeof document !== "undefined" ? document : undefined);
  const nav = refs?.navigator ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!w || !nav) return false;

  try {
    const C = (w as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (C && typeof C.isNativePlatform === "function" && C.isNativePlatform()) {
      return true;
    }
  } catch {
    /* noop */
  }

  if ((nav as Navigator & { standalone?: boolean }).standalone === true) return true;

  try {
    if (w.matchMedia?.("(display-mode: standalone)")?.matches) return true;
    if (w.matchMedia?.("(display-mode: fullscreen)")?.matches) return true;
  } catch {
    /* noop */
  }

  const ref = typeof d?.referrer === "string" ? d.referrer : "";
  if (ref.startsWith("android-app://")) return true;

  return false;
}

export function shouldAutoStartLocation({
  locationOptIn = false,
  installedShell = false,
}: {
  locationOptIn?: boolean;
  installedShell?: boolean;
} = {}): boolean {
  return locationOptIn === true || installedShell === true;
}
