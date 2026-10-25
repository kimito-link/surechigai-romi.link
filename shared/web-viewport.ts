/**
 * 横スワイプで画面が拡大し、横へずれるのを止める viewport。
 *
 * iOS Safari / Android Chrome（と、この HTML を開く WebView）は、
 * 幅が viewport より 1px でも広いと横パンを拡大のように扱う。
 * width=device-width と initial-scale=1 に加え、maximum-scale=1 で
 * そのジェスチャーを viewport 側で止める。shrink-to-fit は付けない
 * （Android WebView が画面幅に合わせて縮小し、スワイプで拡大し直す）。
 *
 * ネイティブの React Native 画面は viewport を使わない。
 * WebView を足すときは WEBVIEW_ZOOM_LOCK を渡す（scalesPageToFit / 拡大コントロール）。
 */
export const ROOT_VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover";

export function viewportLocksHorizontalZoom(content: string): boolean {
  return (
    content.includes("width=device-width") &&
    content.includes("initial-scale=1") &&
    /(?:^|,)\s*maximum-scale=1(?:\s*,|$)/.test(content) &&
    !content.includes("shrink-to-fit")
  );
}

/** react-native-webview を使うときの拡大禁止。現状このアプリに WebView は無い。 */
export const WEBVIEW_ZOOM_LOCK = {
  scalesPageToFit: false,
  setBuiltInZoomControls: false,
  setDisplayZoomControls: false,
} as const;
