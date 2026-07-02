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

  // 新 SW が制御を取得したら 1 度だけ自動リロードする。
  // 目的: 壊れたバンドル（例: 過去に配信した OOM 版）をキャッシュした
  // 古いページから確実に脱出させる。reload しないと、新 SW が入っても
  // 古い DOM/JS が動き続けてクラッシュループになる。
  // controllerchange は「新 SW が clients.claim() で制御を奪った瞬間」に発火。
  //
  // 初回インストール（登録時に controller が無い）では reload しない
  // — それは「更新」ではなく初回取得であり、無駄な再読み込みになるため。
  // 既に別の SW に制御されているページで controllerchange が起きたときだけ、
  // 「新版への切替」とみなして 1 度だけ reload する。
  const hadControllerAtStartup = !!navigator.serviceWorker.controller;
  let hasReloadedForNewSw = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadControllerAtStartup) return; // 初回インストールは対象外
    if (hasReloadedForNewSw) return; // 二重 reload 防止
    hasReloadedForNewSw = true;
    console.log("[SW] New Service Worker took control — reloading once to apply update");
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", {
        // 重要: updateViaCacheを'none'にすることで、Service Workerファイル自体も常に最新を取得
        updateViaCache: "none",
      })
      .then((registration) => {
        console.log("[SW] Service Worker registered with scope:", registration.scope);

        // 起動直後に必ず更新チェック（壊れた版からの復帰を速める）
        registration.update();

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
                  // 新しいバージョンが installed。skipWaiting で即 activate し、
                  // activate 内の clients.claim() → controllerchange →
                  // 上のハンドラで 1 度だけ reload される。
                  console.log("[SW] New version installed, activating…");
                  newWorker.postMessage({ type: "SKIP_WAITING" });
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
