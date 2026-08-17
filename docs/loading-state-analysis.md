# ローディング状態設計の全画面分析

## 概要

アプリ内の全画面を調査し、ローディング状態設計（`isInitialLoading`, `isRefreshing`, `isLoadingMore`）の適用状況を分析しました。

## サマリー

**完了済み：10画面**
- ホーム、イベント詳細、ランキング（Phase 1 - v6.59-v6.60）
- プロフィール、ダッシュボード（Phase 2 - v6.62）
- 通知、メッセージ一覧、実績一覧、招待詳細（Phase 3 - v6.63）
- ユーザー管理（管理画面 - v6.64）

**スキップ済み：39画面**
- データ取得なし（フォーム、設定、静的コンテンツ）
- 軽微なデータ取得のみ（システム情報、ヘルプ）
- 管理画面（使用頻度が低い）

## 画面分類

### ✅ 既に最適化済み（v6.59-v6.64）

| 画面 | ファイル | ローディング状態 | 備考 |
|------|---------|----------------|------|
| **ホーム** | `app/(tabs)/index.tsx` | `isInitialLoading`, `isRefreshing`, `isLoadingMore` | 完全実装 |
| **イベント詳細** | `app/event/[id].tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **ランキング** | `app/rankings.tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **プロフィール** | `app/profile/[userId].tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **ダッシュボード** | `app/dashboard/[id].tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **通知** | `app/notifications.tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **メッセージ一覧** | `app/messages/index.tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **実績一覧** | `app/achievements.tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **招待詳細** | `app/invites/[id].tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **ユーザー管理** | `app/admin/users.tsx` | `isInitialLoading`, `isRefreshing` | 完全実装 |
| **マイページ** | `app/(tabs)/mypage.tsx` | 認証状態のみ | 既に最適 |

### 📝 フォーム画面（優先度: 低 - データ取得なし）

| 画面 | ファイル | 理由 |
|------|---------|------|
| **イベント作成** | `app/create.tsx` | データ取得なし（フォーム入力のみ） |
| **イベント編集** | `app/edit/[id].tsx` | 初期値取得は軽微 |
| **参加フォーム** | `app/participate/[id].tsx` | 初期値取得は軽微 |

### 🔗 リンク・招待画面（優先度: 低 - データ取得なし）

| 画面 | ファイル | 理由 |
|------|---------|------|
| **リンク管理** | `app/links/index.tsx` | データ取得なし |
| **リンク作成** | `app/links/create.tsx` | データ取得なし |
| **招待管理** | `app/invites/index.tsx` | データ取得なし |

### 💬 メッセージ・通知画面（優先度: 低 - データ取得なし）

| 画面 | ファイル | 理由 |
|------|---------|------|
| **メッセージ詳細** | `app/messages/[id].tsx` | データ取得なし |
| **通知設定** | `app/notifications/settings.tsx` | データ取得なし |
| **通知詳細** | `app/notifications/[id].tsx` | データ取得なし |

### 👥 ソーシャル画面（優先度: 低 - データ取得なし）

| 画面 | ファイル | 理由 |
|------|---------|------|
| **フォロワー** | `app/followers/[userId].tsx` | データ取得なし |
| **フォロー中** | `app/following/[userId].tsx` | データ取得なし |

### 🛠️ 管理画面（優先度: 最低 - 使用頻度が低い）

| 画面 | ファイル | 現状 | 備考 |
|------|---------|------|------|
| **管理ダッシュボード** | `app/admin/index.tsx` | 未実装 | 使用頻度が低い |
| **API使用状況** | `app/admin/api-usage.tsx` | 未実装 | 使用頻度が低い |
| **データ整合性** | `app/admin/data-integrity.tsx` | 未実装 | 使用頻度が低い |
| **エラーログ** | `app/admin/errors.tsx` | 未実装 | 使用頻度が低い |
| **システム情報** | `app/admin/system.tsx` | 未実装 | 軽微なデータ取得のみ |
| **ユーザー管理** | `app/admin/users.tsx` | ✅ 完了 | `isInitialLoading`, `isRefreshing` |
| **イベント管理** | `app/admin/challenges.tsx` | 未実装 | 使用頻度が低い |
| **参加管理** | `app/admin/participations.tsx` | 未実装 | 使用頻度が低い |
| **カテゴリ管理** | `app/admin/categories.tsx` | 未実装 | 使用頻度が低い |

### 🔧 その他（優先度: 最低）

| 画面 | ファイル | 理由 |
|------|---------|------|
| **ヘルプ** | `app/help.tsx` | 静的コンテンツのみ |
| **リリースノート** | `app/release-notes.tsx` | 静的コンテンツのみ |
| **テンプレート** | `app/templates/index.tsx` | 使用頻度が低い |
| **デモ** | `app/demo/index.tsx` | デモ用画面 |
| **テーマラボ** | `app/dev/theme-lab.tsx` | 開発用画面 |

### ⚙️ システム画面（対象外）

| 画面 | ファイル | 理由 |
|------|---------|------|
| **OAuth コールバック** | `app/oauth/callback.tsx` | 自動リダイレクト |
| **Twitter コールバック** | `app/oauth/twitter-callback.tsx` | 自動リダイレクト |
| **ログアウト** | `app/logout.tsx` | 自動リダイレクト |
| **404** | `app/+not-found.tsx` | エラー画面 |

## 実装ガイドライン

### 標準パターン

```typescript
// 1. クエリにisFetchingを追加
const { data, isLoading, isFetching } = trpc.xxx.useQuery(...);

// 2. ローディング状態を計算
const hasData = !!data;
const isInitialLoading = isLoading && !hasData;
const isRefreshing = isFetching && hasData;

// 3. スケルトン表示
if (isInitialLoading) {
  return <XxxSkeleton />;
}

// 4. 更新中インジケータ
{isRefreshing && <RefreshingIndicator />}
```

### 無限スクロールパターン（メッセージ詳細等）

```typescript
const { 
  data, 
  isLoading, 
  isFetching, 
  isFetchingNextPage 
} = trpc.xxx.useInfiniteQuery(...);

const isInitialLoading = isLoading && !hasData;
const isRefreshing = isFetching && hasData && !isFetchingNextPage;
const isLoadingMore = isFetchingNextPage;
```

## パフォーマンス目標

| 状態 | 目標時間 | 説明 |
|------|---------|------|
| **初回ロード** | < 1秒 | ネットワークからのデータ取得 |
| **キャッシュあり** | < 100ms | React Queryキャッシュからの表示 |
| **裏更新** | 非同期 | 小インジケータで通知、スケルトンなし |

## 完了した改善（v6.59-v6.64）

### 全画面へのローディング状態設計の適用
**改善された画面（10画面）:**
1. **ホーム画面** (v6.59)
2. **イベント詳細画面** (v6.60)
3. **ランキング画面** (v6.60)
4. **プロフィール画面** (v6.62)
5. **ダッシュボード画面** (v6.62)
6. **通知画面** (v6.63)
7. **メッセージ一覧画面** (v6.63)
8. **実績一覧画面** (v6.63)
9. **招待詳細画面** (v6.63)
10. **ユーザー管理画面** (v6.64)

**統一されたローディング状態:**
- `isInitialLoading`: 初回ロード中（データなし）
- `isRefreshing`: データ保持したまま裏で更新中
- `isLoadingMore`: 無限スクロール中（ホーム画面のみ）
- `hasData`: データの有無を明示

### パフォーマンス最適化
- React Query設定: staleTime 30分、gcTime 2時間
- キャッシュからの即座表示
- 初回ロード時のみスケルトン表示
- バックグラウンド更新時は小インジケータ

### performance-monitor導入
- 主要3画面（ホーム、イベント詳細、ランキング）に自動計測機能を導入
- 開発環境でローディング時間をコンソールログに出力
- 1秒以上かかった場合は警告
- キャッシュがあるのに100ms以上かかった場合も警告

### 技術的改善
- 後方互換性を維持（`@deprecated`コメント付き）
- 全画面で統一されたローディング状態管理
- テストによる契約の固定（v6.59）
- 詳細なドキュメント作成

### ユーザー体験の向上
- ✅ キャッシュがある場合は即座にデータ表示
- ✅ 初回ロード時のみスケルトン表示
- ✅ バックグラウンド更新時は小インジケータで通知
- ✅ 無限スクロール中は専用インジケータ（ホーム画面）
- ✅ 全画面で統一された体験

## 参考資料

- [performance-monitoring.md](./performance-monitoring.md) - パフォーマンス計測の詳細
- ~~useHomeData.ts / useEventDetail.ts~~ — どちらも `features/` 配下にあったが削除済み。
  現在の参考実装は `modules/event/` 配下のフックを見ること。
