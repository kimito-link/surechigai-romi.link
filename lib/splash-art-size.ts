import { BOOT } from "@/theme/tokens/boot";

/**
 * 起動画面の絵の表示サイズ。
 * Web の CSS（BOOT.artWidth）と iOS の imageWidth 300（幅 390pt の約 77%）に揃える。
 * 幅 0 は「未確定」なので、絵を消さず 300px で出す。
 */
export function splashArtSize(width: number, height: number): { width: number; height: number } {
  const aspect = BOOT.artWidthPx / BOOT.artHeightPx;
  const fallbackW = 300;
  if (!(width > 0 && height > 0)) {
    return { width: fallbackW, height: fallbackW / aspect };
  }
  let w = Math.min(width * 0.78, 420);
  let h = w / aspect;
  if (h > height * 0.86) {
    h = height * 0.86;
    w = h * aspect;
  }
  return { width: w, height: h };
}
