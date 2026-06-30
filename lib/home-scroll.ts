/** ヘッダーのホームリンク再タップ時に、ポスト画面などを先頭へスクロール */
const listeners = new Set<() => void>();

export function subscribeHomeScroll(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function triggerHomeScroll(): void {
  for (const fn of listeners) fn();
}
