/**
 * 横にはみ出して画面がずれるのを止める viewport。ピンチと文字の拡大は残す。
 *
 * iOS Safari / Android Chrome は、幅が viewport より 1px でも広いと
 * 横パンをページの横スクロール（ずれ）として扱う。止めるのははみ出しであって、
 * maximum-scale や user-scalable=no ではない（アクセシビリティ）。
 * shrink-to-fit も付けない（Android WebView が幅に合わせて縮小する）。
 *
 * ネイティブの React Native 画面は viewport を使わない。地図のピンチは MapLibre の操作。
 */
export const ROOT_VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, viewport-fit=cover";

export function viewportAllowsUserZoom(content: string): boolean {
  return (
    content.includes("width=device-width") &&
    content.includes("initial-scale=1") &&
    content.includes("viewport-fit=cover") &&
    !/maximum-scale\s*=/.test(content) &&
    !/minimum-scale\s*=/.test(content) &&
    !/user-scalable\s*=\s*no/i.test(content) &&
    !content.includes("shrink-to-fit")
  );
}
