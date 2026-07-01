/** WCAG 2.1 相対輝度に基づくコントラスト比（AA 判定用） */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = luminance(...parseHex(fgHex));
  const l2 = luminance(...parseHex(bgHex));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(fgHex: string, bgHex: string, largeText = false): boolean {
  const ratio = contrastRatio(fgHex, bgHex);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}
