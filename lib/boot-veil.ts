/**
 * ブートベール（app/+html.tsx の #romi-boot-veil）の解除。
 *
 * ベールは HTML の最初のバイトから出ている（data-auth-boot は <html> に直書き）。
 * スクリプトで「出すかどうか」を決めると、決まるまでの1フレームが別の色になる。
 *
 * 解除は最初の実画面が描画されたあと、1回だけ短くフェードする。
 * スピナーや別レイアウトの待機画面を挟まない。
 * 解除し忘れても +html.tsx の保険（6秒）と、ルートレイアウトの同じ保険がある。
 */
import { BOOT } from "@/theme/tokens/boot";

/** 画面自身がベールを外すパス。ルートのレイアウトが先に外すと、読込中の別画面が露出する。 */
const SCREEN_OWNED = new Set(["", "/", "/index", "/checkin", "/zukan", "/map", "/mypage"]);

let released = false;
let nativeHide: (() => void) | null = null;

/** テストがモジュール状態を持ち越さないようにする。 */
export function resetBootVeilStateForTests(): void {
  released = false;
  nativeHide = null;
}

/** ネイティブの SplashScreen.hideAsync。boot-veil は document だけのモジュールに保つ（vitest が RN を読まない）。 */
export function registerNativeSplashHide(fn: () => void): void {
  nativeHide = fn;
  if (released) fn();
}

export function isBootVeilReleased(): boolean {
  return released;
}

/** トップや各タブ、公開プロフィールは画面自身が外す。それ以外はルートのレイアウトが外す。 */
export function isBootVeilReleasedByLandingScreen(pathname: string | null | undefined): boolean {
  if (typeof pathname !== "string") return false;
  const p = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "");
  if (p === "/u" || p.startsWith("/u/")) return true;
  return SCREEN_OWNED.has(p);
}

function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * ベールを外す。React のマウントは「描画が終わった」ことを意味しないので、
 * 2フレーム待ってからフェードを始める（2026-08-16 の実機録画で、1フレームでは足りないと確認済み）。
 * Web 以外ではネイティブの起動画面を隠すだけ。何度呼んでも安全。
 */
export function releaseBootVeil(): void {
  if (released) return;
  released = true;
  nativeHide?.();

  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const finish = () => {
    root.removeAttribute("data-auth-boot");
    root.removeAttribute("data-boot-leave");
  };
  const start = () => {
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    root.setAttribute("data-boot-leave", "1");
    const host = typeof window !== "undefined" ? window : globalThis;
    host.setTimeout(finish, BOOT.fadeMs);
  };

  if (typeof requestAnimationFrame !== "function") {
    start();
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(start));
}
