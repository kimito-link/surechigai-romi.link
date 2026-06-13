import { Platform } from "react-native";

/**
 * Service Workerを登録する
 * Web環境でのみ動作し、オフラインキャッシュを有効にする
 */
export function registerServiceWorker(): void {
  if (Platform.OS !== "web") {
    return;
  }

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", {
        // 重要: updateViaCacheを'none'にすることで、Service Workerファイル自体も常に最新を取得
        updateViaCache: "none",
      })
      .then((registration) => {
        console.log("[SW] Service Worker registered with scope:", registration.scope);

        // 定期的に更新をチェック（1時間ごと）
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // 新しいService Workerが利用可能になった時の処理
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // 新しいバージョンが利用可能 - 即座に更新を適用
                  console.log("[SW] New version available, forcing update...");
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  // ページをリロードして新しいService Workerを有効化
                  window.location.reload();
                } else {
                  // 初回インストール
                  console.log("[SW] Service Worker installed for the first time");
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log("[SW] Service Worker registration skipped:", error.message);
      });
  });
}

/**
 * Service Workerのキャッシュをクリアする
 */
export async function clearServiceWorkerCache(): Promise<void> {
  if (Platform.OS !== "web") {
    return;
  }

  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName.startsWith("douin-")) {
        return caches.delete(cacheName);
      }
      return Promise.resolve();
    })
  );
  console.log("[SW] Cache cleared");
}
