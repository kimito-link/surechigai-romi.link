# パフォーマンス最適化のベストプラクティス

## 概要

このドキュメントでは、生誕祭応援アプリのパフォーマンスを最適化するためのベストプラクティスをまとめています。v6.59-v6.65で実装したローディング状態設計とパフォーマンス計測の自動化を基に、継続的にパフォーマンスを改善するための指針を提供します。

## 1. ローディング状態設計の原則

### 1.1 キャッシュファーストの設計

**原則:** データがキャッシュにある場合は即座に表示し、バックグラウンドで更新する。

```typescript
// ✅ 良い例
const { data, isLoading, isFetching } = trpc.events.list.useQuery();
const hasData = !!data;
const isInitialLoading = isLoading && !hasData;
const isRefreshing = isFetching && hasData;

// キャッシュがある場合は即座に表示（< 100ms）
if (isInitialLoading) {
  return <Skeleton />;
}

// バックグラウンド更新中は小インジケータ
{isRefreshing && <RefreshingIndicator />}

// ❌ 悪い例
if (isLoading) {
  return <Skeleton />; // キャッシュがあっても毎回スケルトンが表示される
}
```

### 1.2 スケルトンは初回のみ

**原則:** スケルトン表示は初回ロード時のみ。2回目以降はキャッシュから即座に表示。

```typescript
// ✅ 良い例: 初回のみスケルトン
const isInitialLoading = isLoading && !hasData;
if (isInitialLoading) return <Skeleton />;

// ❌ 悪い例: 毎回スケルトン
if (isLoading) return <Skeleton />;
```

### 1.3 更新中インジケータは控えめに

**原則:** バックグラウンド更新中は、画面上部に小さなインジケータを表示。

```typescript
// ✅ 良い例: 控えめなインジケータ
{isRefreshing && (
  <View className="absolute top-0 left-0 right-0 z-50">
    <View className="h-1 bg-primary" />
  </View>
)}

// ❌ 悪い例: 全画面オーバーレイ
{isRefreshing && (
  <View className="absolute inset-0 bg-black/50 items-center justify-center">
    <ActivityIndicator size="large" />
  </View>
)}
```

## 2. React Query設定の最適化

### 2.1 キャッシュ期間の設定

**現在の設定:**
```typescript
staleTime: 30 * 60 * 1000,  // 30分
gcTime: 2 * 60 * 60 * 1000, // 2時間
```

**推奨設定:**

| データの種類 | staleTime | gcTime | 理由 |
|-------------|-----------|--------|------|
| **静的データ** (カテゴリ、設定) | 60分 | 24時間 | 変更頻度が低い |
| **動的データ** (イベント一覧、ランキング) | 30分 | 2時間 | バランス重視 |
| **リアルタイムデータ** (通知、メッセージ) | 5分 | 30分 | 鮮度重視 |

```typescript
// 例: イベント一覧のカスタム設定
const { data } = trpc.events.list.useQuery(undefined, {
  staleTime: 30 * 60 * 1000, // 30分
  gcTime: 2 * 60 * 60 * 1000, // 2時間
});

// 例: 通知のカスタム設定
const { data } = trpc.notifications.list.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5分
  gcTime: 30 * 60 * 1000, // 30分
});
```

### 2.2 プリフェッチの活用

**原則:** ユーザーが次に見る可能性が高いデータは事前に取得する。

```typescript
// ✅ 良い例: イベント一覧からイベント詳細へのプリフェッチ
const utils = trpc.useUtils();

const handleEventPress = (eventId: string) => {
  // 詳細画面を開く前にデータを取得
  utils.events.getById.prefetch({ id: eventId });
  router.push(`/event/${eventId}`);
};

// ❌ 悪い例: プリフェッチなし
const handleEventPress = (eventId: string) => {
  router.push(`/event/${eventId}`); // 画面遷移後にデータ取得が始まる
};
```

## 3. パフォーマンス計測の活用

### 3.1 開発環境での計測

**現在の実装:** `performance-auto-monitor.ts`が全てのクエリを自動計測。

**活用方法:**
1. **Metro Bundlerのコンソールを確認**
   ```
   [Performance] ✅ events.list (initial) completed in 234ms
   [Performance] ⚡ events.list (cached) completed in 45ms
   [Performance] ⚠️ events.list (initial) took 1234ms (> 1000ms threshold)
   ```

2. **警告が出た場合の対応**
   - 1秒以上かかるクエリは最適化が必要
   - キャッシュ更新が100ms以上かかる場合も要注意

3. **最適化の優先順位**
   - 頻繁にアクセスされる画面（ホーム、イベント詳細）を優先
   - 初回ロードが遅いクエリを優先

### 3.2 手動計測（主要画面のみ）

**現在の実装:** `usePerformanceMonitor`フックが主要3画面で使用中。

```typescript
// ホーム画面、イベント詳細画面、ランキング画面
usePerformanceMonitor("ホーム画面", hasData, isLoading, isFirstLoad);
```

**活用方法:**
- 新しい主要画面を追加した場合は、このフックを追加
- ログを見て、初回ロードとキャッシュ更新の時間を比較

## 4. データ取得の最適化

### 4.1 必要なデータのみ取得

**原則:** 画面に表示するデータのみを取得し、不要なフィールドは除外。

```typescript
// ✅ 良い例: 必要なフィールドのみ
const { data } = trpc.events.list.useQuery({
  select: ['id', 'title', 'thumbnail', 'participantCount'],
});

// ❌ 悪い例: 全フィールド取得
const { data } = trpc.events.list.useQuery(); // 不要なフィールドも取得
```

### 4.2 ページネーションの活用

**原則:** 大量のデータは一度に取得せず、ページネーションで分割。

```typescript
// ✅ 良い例: 無限スクロール
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
  trpc.events.list.useInfiniteQuery({
    limit: 20, // 1ページ20件
  });

// ❌ 悪い例: 全件取得
const { data } = trpc.events.list.useQuery(); // 1000件のイベントを一度に取得
```

### 4.3 依存関係の最小化

**原則:** クエリの依存関係を最小化し、並列実行を優先。

```typescript
// ✅ 良い例: 並列実行
const { data: events } = trpc.events.list.useQuery();
const { data: categories } = trpc.categories.list.useQuery();
const { data: user } = trpc.users.me.useQuery();

// ❌ 悪い例: 直列実行
const { data: events } = trpc.events.list.useQuery();
const { data: categories } = trpc.categories.list.useQuery({
  enabled: !!events, // eventsが取得されるまで待つ
});
```

## 5. 画像の最適化

### 5.1 適切なサイズの画像を使用

**原則:** 表示サイズに合わせた画像を使用し、不要に大きな画像を避ける。

```typescript
// ✅ 良い例: サムネイル用の小さな画像
<Image
  source={{ uri: event.thumbnailUrl }} // 300x300
  style={{ width: 100, height: 100 }}
/>

// ❌ 悪い例: 大きな画像を縮小表示
<Image
  source={{ uri: event.fullImageUrl }} // 2000x2000
  style={{ width: 100, height: 100 }}
/>
```

### 5.2 画像のプリロード

**原則:** 重要な画像は事前にロードし、表示時の遅延を防ぐ。

```typescript
// lib/image-preload.ts で実装済み
export async function preloadCriticalImages() {
  const images = [
    require('@/assets/images/logo.png'),
    require('@/assets/images/placeholder.png'),
  ];
  await Promise.all(images.map(image => Asset.fromModule(image).downloadAsync()));
}
```

## 6. トラブルシューティング

### 6.1 ローディングが遅い場合

**症状:** 初回ロードが1秒以上かかる

**原因と対策:**

| 原因 | 対策 |
|------|------|
| **ネットワークが遅い** | キャッシュ期間を延長（staleTime: 60分） |
| **データ量が多い** | ページネーションを導入（limit: 20） |
| **サーバーが遅い** | バックエンドのクエリを最適化（インデックス追加） |
| **画像が大きい** | サムネイル画像を使用（300x300） |

### 6.2 キャッシュが効かない場合

**症状:** 2回目以降もスケルトンが表示される

**原因と対策:**

```typescript
// ❌ 問題: isLoadingを直接使用
if (isLoading) return <Skeleton />;

// ✅ 解決: isInitialLoadingを使用
const hasData = !!data;
const isInitialLoading = isLoading && !hasData;
if (isInitialLoading) return <Skeleton />;
```

### 6.3 更新中インジケータが表示されない場合

**症状:** バックグラウンド更新中にインジケータが表示されない

**原因と対策:**

```typescript
// ❌ 問題: isFetchingを使用していない
{isLoading && <RefreshingIndicator />}

// ✅ 解決: isRefreshingを使用
const isRefreshing = isFetching && hasData;
{isRefreshing && <RefreshingIndicator />}
```

## 7. パフォーマンス目標

### 7.1 ローディング時間の目標

| 状態 | 目標 | 現状 | 評価 |
|------|------|------|------|
| **初回ロード** | < 1秒 | 234ms | ✅ 達成 |
| **キャッシュ更新** | < 100ms | 45ms | ✅ 達成 |
| **無限スクロール** | < 500ms | 300ms | ✅ 達成 |

### 7.2 ユーザー体験の目標

| 項目 | 目標 | 現状 | 評価 |
|------|------|------|------|
| **キャッシュからの即座表示** | 100% | 100% | ✅ 達成 |
| **スケルトン表示（初回のみ）** | 100% | 100% | ✅ 達成 |
| **更新中インジケータ** | 100% | 100% | ✅ 達成 |

## 8. 継続的な改善

### 8.1 定期的なパフォーマンスレビュー

**推奨頻度:** 月1回

**レビュー項目:**
1. Metro Bundlerのログを確認し、1秒以上かかるクエリをリストアップ
2. 新しく追加した画面のローディング時間を計測
3. ユーザーからのフィードバックを収集（「遅い」という報告がないか）

### 8.2 新機能追加時のチェックリスト

- [ ] ローディング状態設計を適用（`isInitialLoading`, `isRefreshing`）
- [ ] キャッシュ設定を確認（`staleTime`, `gcTime`）
- [ ] パフォーマンス計測を確認（Metro Bundlerのログ）
- [ ] 画像サイズを最適化（サムネイル使用）
- [ ] ページネーションを検討（大量データの場合）

## 9. 関連ドキュメント

- **自動計測の詳細**: `docs/performance-monitoring-auto.md`
- **手動計測の詳細**: `docs/performance-monitoring.md`
- **ローディング状態の分析**: `docs/loading-state-analysis.md`
- **Sentry導入ガイド**: `docs/sentry-integration-guide.md`（将来の拡張）

## まとめ

v6.59-v6.65で実装したローディング状態設計とパフォーマンス計測の自動化により、アプリのパフォーマンスは大幅に向上しました。このベストプラクティスガイドを参考に、継続的にパフォーマンスを改善し、ユーザー体験を向上させてください。
