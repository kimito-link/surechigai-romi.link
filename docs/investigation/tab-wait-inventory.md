# タブ遷移待ち — 静的 inventory（WS1）

調査日: 2026-07-01  
対象: Web 6タブ（`/`, `/checkin`, `/events`, `/zukan`, `/map`, `/mypage`）

---

## 1. 待ちの層 × タブ マトリクス

| タブ | Route | Layer B Auth | Layer C Route lazy | Layer C 内側 lazy | Layer D データ | TabQueryShell |
|------|-------|--------------|-------------------|-------------------|---------------|---------------|
| ポスト | `/` | `index.tsx` `isAuthReadyForUI` → 全画面 spinner | `PostAuthenticatedScreen` | `JapanRadarMap`, `RadarHud`, `lazy-heavy-*` | `encounter.list`, `presence.list`, `myTrail` limit 1 | 未使用（isLoading 取得のみ） |
| チェックイン | `/checkin` | `isAuthReady` → guest は `ScreenContainer`+spinner | `CheckinAuthenticatedScreen` | なし | `settings.get`, `myTrail` limit 10 | なし |
| 集まり | `/events` | `isAuthReadyForUI` | `EventsAuthenticatedScreen` | `EventsHostPanel` | `listUpcoming`, `listLive` | `EventsEmptyState loading` |
| みんなの現在地 | `/zukan` | `isAuthReadyForUI` | `ZukanAuthenticatedScreen` | 地図 chunk（screen 内） | `myAreas`, `myTrail` limit 500, `activePrefectures` | 地図部のみ |
| 軌跡 | `/map` | `isAuthReadyForUI` | `MapAuthenticatedScreen` | `WebTrailMap` | `myAreas`, `myTrail` limit 120 | あり |
| マイページ | `/mypage` | `isAuthReadyForUI` | `MypageAuthenticatedScreen` | なし | 多数（settings, mySignal 等） | 部分 |

### ゲスト専用 Layer A（Provider）

| 条件 | ファイル | 挙動 |
|------|---------|------|
| Guest shell + `/` or `/index` | `guest-web-providers.tsx` | tRPC defer。`trpcMounted` 前は **children ごと `AppBootstrapFallback`** |
| Guest shell + 他タブ | 同上 L33-34 | `needsTrpcNow=true` かつ `!trpcMounted` → **全画面 spinner、ルートアンマウント** |
| Guest shell + PublicWebProviders lazy | 同上 L42-44 | Suspense 中も `AppBootstrapFallback` |

### ルートレイアウト Layer A/B

| ファイル | 待ち UI |
|---------|---------|
| `app/_layout.tsx` L97 | `useGuestWebShell` 時 **`prefetchHeavyTabChunks()` は no-op** |
| `app/_layout.tsx` L145 | Guest shell 時 AppNavigationStack Suspense fallback = **null**（真っ白の可能性） |
| `app/_layout.tsx` L161 | ClerkRootProvider Suspense → `AppBootstrapFallback` |

---

## 2. Fallback / Spinner 発生箇所一覧

### AppBootstrapFallback（全画面・#F0F4F8 + ActivityIndicator）

- `components/providers/app-bootstrap-fallback.tsx`
- `components/providers/guest-web-providers.tsx`（3箇所）
- `app/_layout.tsx`（Clerk 読込）

### ChunkFallback（メイン領域・ActivityIndicator）

- `lib/chunk-fallback.tsx`
- 全 `app/(tabs)/*.tsx` 認証済み Suspense
- `components/events/events-guest-screen.tsx`（ゲスト集まり）
- `lib/lazy-heavy-components.tsx`（6箇所）
- `components/events/events-authenticated-screen.tsx`（HostPanel）
- `components/molecules/tab-query-shell.tsx`（`TabMapLoadingFallback`）

### tab-query-loading（testID）

- `components/molecules/tab-query-shell.tsx` — `isLoading` 時

### 全画面 ActivityIndicator（Layer B・ヘッダーなし）

- `app/(tabs)/index.tsx`, `events.tsx`, `zukan.tsx`, `map.tsx`, `mypage.tsx` — `!isAuthReadyForUI`
- `app/(tabs)/checkin.tsx` — `!isAuthReady`（ゲストは別 UI だが auth 待ち中は spinner）

---

## 3. Route レベル lazy import

| ファイル | lazy 対象 |
|---------|-----------|
| `app/(tabs)/index.tsx` | `@/components/post/post-authenticated-screen` |
| `app/(tabs)/checkin.tsx` | `@/components/checkin/checkin-authenticated-screen` |
| `app/(tabs)/events.tsx` | `@/components/events/events-authenticated-screen` |
| `app/(tabs)/zukan.tsx` | `@/components/zukan/zukan-authenticated-screen` |
| `app/(tabs)/map.tsx` | `@/components/map/map-authenticated-screen` |
| `app/(tabs)/mypage.tsx` | `@/components/mypage/mypage-authenticated-screen` |
| `app/(tabs)/_layout.tsx` | `CheckinTabIconAuthenticated`, `EventsTabIconAuthenticated` |

### ゲスト追加 lazy

| ファイル | lazy 対象 |
|---------|-----------|
| `events-guest-screen.tsx` | `events-guest-content` |
| `tab-guest-preview-screen.tsx` | `AppHeader`, `LoginPreviewBanner` |
| `post-guest-screen.tsx` | `AppHeader`, `LoginPreviewBanner` |

### 認証済み screen 内 lazy（Layer C 二段）

| ファイル | lazy 対象 |
|---------|-----------|
| `post-authenticated-screen.tsx` | `JapanRadarMap`, `RadarHud` + `lazy-heavy-components` 経由 |
| `map-authenticated-screen.tsx` | `WebTrailMap`（import 経路要確認） |
| `events-authenticated-screen.tsx` | `EventsHostPanel` |

---

## 4. prefetch-tab-chunks 登録 vs 未登録

### 登録済み（`lib/bootstrap/prefetch-tab-chunks.ts`）

1. `checkin-authenticated-screen`
2. `map-authenticated-screen`
3. `web-trail-map`
4. `event-calendar`
5. `envelope-pulse`
6. `character-here`
7. `material-icons.web`（フォント）

### 未登録（route lazy・調査 gap）

| 優先度 | モジュール | 紐づくタブ |
|--------|-----------|-----------|
| **P0** | `post-authenticated-screen` | ポスト |
| **P0** | `events-authenticated-screen` | 集まり |
| **P0** | `zukan-authenticated-screen` | みんなの現在地 |
| **P1** | `mypage-authenticated-screen` | マイページ |
| **P1** | `events-guest-content` | 集まり（ゲスト） |
| **P1** | `japan-radar-map` | ポスト |
| **P2** | `public-web-providers` | Guest tRPC 初回 |
| **P2** | `clerk-root-provider` | ログイン済み初回 |

### Guest shell 時の prefetch 無効化

`app/_layout.tsx` L97: `useGuestWebShell ? () => {} : prefetchHeavyTabChunks()`  
→ **ゲストは chunk prefetch 自体が走らない**（Layer A と併せて初回タブ移動が最重）。

---

## 5. prefetch-tab-data vs 実際の useQuery

| Tab | prefetch 定義 | screen 側クエリ | Gap |
|-----|--------------|----------------|-----|
| post | encounter.list, presence.list, myTrail limit 1 | 同左 + staleTime 60s on trail | 整合 |
| checkin | settings.get, myTrail limit 1 | settings.get, myTrail limit **10** | limit 不一致 |
| events | listUpcoming 100, listLive | 同左 | 整合 |
| zukan | activePrefectures, myAreas, myTrail **500** | 同左 | 整合（重い） |
| map | myAreas, myTrail **120** | 同左 | 整合 |
| mypage | mySignal, settings, myUpcoming | settings + 他 direct query | mySignal prefetch あるが screen は複数追加 query |

### AUTHENTICATED_QUERY_OPTIONS（Layer D 再 fetch）

`lib/authenticated-query-options.ts`:

```ts
staleTime: 0,
refetchOnMount: true,
refetchOnReconnect: true,
```

→ zukan / map は `AUTHENTICATED_QUERY_OPTIONS` 使用。**タブ再訪問のたび refetch**（prefetch キャッシュがあっても mount 時再取得）。

post の encounter.list は `staleTime: 60_000` を個別指定（例外）。

---

## 6. 既存監査（`docs/tab-loading-audit.md`）からの未解決 gap

| 項目 | 状態 |
|------|------|
| post `isLoadingEncounters` 未使用 | **未解決** — emptyOverlay が fetch 中も出うる |
| mypage loading 部分のみ | **未解決** |
| TabQueryShell 契約 | map / zukan 地図部のみ適用 |

---

## 7. WS1 結論（仮説の静的裏付け）

1. **Layer A がゲスト tab 遷移の構造的主因** — `GuestWebProviders` が children を差し替える設計。
2. **Layer C** — 6タブすべて route-level lazy。post / events / zukan の route chunk は prefetch 未登録。
3. **Layer D** — `staleTime: 0` により認証済み再訪問で API 待ちが再発しうる。
4. **Guest では chunk prefetch も tRPC mount も遅延** — `/` LCP 優先と tab UX がトレードオフ。

数値裏付けは `tab-wait-timings.md`（WS2）および Playwright アーティファクト（WS3）を参照。
