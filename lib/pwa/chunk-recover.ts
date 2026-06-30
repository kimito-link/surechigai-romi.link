/**
 * asyncRoutes の chunk ロード失敗時、一度だけ自動リロードして復帰する。
 */

const RELOAD_KEY = "surechigai-chunk-reload";

function isChunkLoadError(reason: unknown): boolean {
  if (!reason) return false;
  const msg =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";
  return (
    /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      msg,
    )
  );
}

export function setupChunkRecover(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    if (sessionStorage.getItem(RELOAD_KEY)) return;
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  });

  window.addEventListener("load", () => {
    sessionStorage.removeItem(RELOAD_KEY);
  });
}
