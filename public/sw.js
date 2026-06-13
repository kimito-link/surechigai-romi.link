// Service Worker for 動員ちゃれんじ
// Cache-first strategy for static assets, network-first for API
// 重要: キャッシュバージョンを更新することで、古いキャッシュを強制的に削除する
// バージョンはビルド時に更新される（public/version.jsonのcommitShaを使用）

// キャッシュバージョン（ビルド時に更新される）
// デフォルトはタイムスタンプベース（手動更新時も有効）
const CACHE_VERSION = 'v2-' + Date.now();
const CACHE_NAME = 'douin-challenge-' + CACHE_VERSION;
const STATIC_CACHE_NAME = 'douin-static-' + CACHE_VERSION;
const API_CACHE_NAME = 'douin-api-' + CACHE_VERSION;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/logo192.png',
  '/logo512.png',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // すべてのdouin-で始まるキャッシュを削除（新しいバージョンに強制更新）
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('douin-'))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // すべてのクライアントを即座に制御下に置く（更新を強制）
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/trpc/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
    return;
  }

  // Static assets (images, fonts, etc.) - Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
    return;
  }

  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached response and update cache in background
    fetchAndCache(request, cache);
    return cachedResponse;
  }
  
  return fetchAndCache(request, cache);
}

// Network-first strategy (for API requests)
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline JSON for API requests
    return new Response(
      JSON.stringify({ error: 'オフラインです', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Navigation strategy (for page requests)
// 重要: PWAで真っ暗になる問題を防ぐため、常にネットワーク優先
// 古いキャッシュを返さない（キャッシュが原因でクラッシュする可能性があるため）
async function navigationStrategy(request) {
  try {
    // 常にネットワークから取得（キャッシュは使わない）
    const networkResponse = await fetch(request, {
      cache: 'no-store', // キャッシュを無視して常にネットワークから取得
    });
    
    // 成功した場合のみレスポンスを返す
    if (networkResponse.ok) {
      return networkResponse;
    }
    
    // ネットワークエラーまたは非200レスポンスの場合、エラーを投げる
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.error('[SW] Navigation request failed:', error);
    
    // オフラインページのみ返す（古いキャッシュは返さない）
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort - return basic offline message
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>オフライン</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>オフラインです</h1><p>インターネット接続を確認してください</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  // Return cached response immediately if available
  return cachedResponse || fetchPromise;
}

// Helper to fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting' || (event.data && event.data.type === 'SKIP_WAITING')) {
    console.log('[SW] Received skipWaiting message, activating immediately');
    self.skipWaiting().then(() => {
      // すべてのクライアントに新しいService Workerが有効になったことを通知
      return self.clients.claim();
    });
  }
});
