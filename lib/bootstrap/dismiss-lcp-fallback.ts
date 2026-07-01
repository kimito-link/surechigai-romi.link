/** +html の静的 LCP シェルを React 初回 paint 後に除去（CLS 回避）。 */
export function dismissLcpFallback(): void {
  if (typeof document === "undefined") return;
  document.getElementById("kimito-lcp-fallback")?.remove();
}
