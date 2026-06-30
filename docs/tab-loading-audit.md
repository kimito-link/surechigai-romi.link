# タブ loading / empty 監査（Phase B）

`*-authenticated-screen.tsx` と `useScreenContextBar` の組み合わせ。

| 画面 | ファイル | isLoading | isPending | isFetching | empty 分離 | lazy 段数 | invalidate / optimistic |
|------|----------|-----------|-----------|------------|------------|-----------|-------------------------|
| 軌跡 | `map-authenticated-screen.tsx` | ✅ myAreas + myTrail | — | RefreshControl | ✅ WebTrailMap + TabQueryShell | map.tsx → screen → WebTrailMap | checkIn → myTrail setData |
| 図鑑 | `zukan-authenticated-screen.tsx` | ✅ myAreas + myTrail | — | RefreshControl | ✅ サマリー「—」/ 地図スケルトン | zukan.tsx → screen → maps | checkIn → myTrail setData |
| ポスト | `post-authenticated-screen.tsx` | ⚠️ encounter.list isLoading 未使用 | — | RefreshControl | ⚠️ emptyOverlay は fetch 中も可 | index → screen + radar lazy | encounter.list invalidate |
| 集まり | `events-authenticated-screen.tsx` | ✅ 参照実装 | — | 各セグメント | ✅ EventsEmptyState + loading | events.tsx → screen | — |
| マイページ | `mypage-authenticated-screen.tsx` | 部分 MySignalSummary | — | 部分 | 部分 | mypage.tsx → screen | mySignal |
| チェックイン | `checkin-authenticated-screen.tsx` | ボタン状態のみ | — | — | N/A | checkin.tsx → screen | mySignal + myTrail + myAreas optimistic |

## コンテキストバー（`use-screen-context-bar.tsx`）

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| データ源 | `dashboard.mySignal`（persist + stale 30s） | 非 persist + AUTHENTICATED_QUERY_OPTIONS |
| pending 時 | 古い件数を表示しうる | `isPending` 時はバー非表示 |
| 本文との関係 | myTrail とは独立 | 同一 invalidate / prefetch で同期 |

## 共通契約（`TabQueryShell`）

- `isLoading` → `testID="tab-query-loading"` + スケルトン
- `!isLoading && isEmpty` → emptyFallback
- それ以外 → children

適用済み: `web-trail-map.tsx`, `zukan-authenticated-screen.tsx`（地図部）
