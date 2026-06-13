# パフォーマンス計測の自動化

## 概要

v6.65で、React Queryのグローバル設定を拡張し、**全てのクエリのローディング時間を自動計測**する機能を実装しました。開発環境でのみ有効化され、Metro Bundlerのコンソールにログを出力します。

## 実装内容

### 1. 自動計測の仕組み

`lib/performance-auto-monitor.ts`で、React QueryのQueryCacheとMutationCacheをカスタマイズし、全てのクエリの開始時刻と完了時刻を記録します。

```typescript
// app/_layout.tsx
const [queryClient] = useState(
  () =>
    new QueryClient({
      // v6.65: パフォーマンス計測の自動化（開発環境のみ）
      queryCache: createPerformanceQueryCache(),
      mutationCache: createPerformanceMutationCache(),
      defaultOptions: {
        queries: {
          staleTime: 30 * 60 * 1000, // 30分
          gcTime: 2 * 60 * 60 * 1000, // 2時間
        },
      },
    }),
);
```

### 2. ログの出力形式

開発環境（`__DEV__ === true`）でのみ、以下の形式でログが出力されます：

#### 正常なパフォーマンス

```
[Performance] ✅ events.list (initial) completed in 234ms
[Performance] ⚡ events.list (cached) completed in 45ms
```

#### パフォーマンス警告

```
[Performance] ⚠️ events.list (initial) took 1234ms (> 1000ms threshold)
[Performance] ⚠️ events.list (cached) took 150ms (> 100ms threshold for cached queries)
```

#### エラー

```
[Performance] ❌ events.list failed after 567ms [Error details]
```

### 3. パフォーマンス閾値

| 状態 | 閾値 | 説明 |
|------|------|------|
| **初回ロード** | 1000ms | データがない状態での初回フェッチ |
| **キャッシュ更新** | 100ms | キャッシュがある状態でのバックグラウンド更新 |

閾値を超えた場合、警告ログが出力されます。

## 使用方法

### 自動計測（全画面）

**何もする必要はありません。**全てのtRPCクエリが自動的に計測されます。

```typescript
// 自動的に計測される
const { data, isLoading } = trpc.events.list.useQuery();
```

### 手動計測（特定画面のみ）

主要画面（ホーム、イベント詳細、ランキング）では、`usePerformanceMonitor`フックを使用して、より詳細な計測を行っています。

```typescript
import { usePerformanceMonitor } from "@/lib/performance-monitor";

const { data, isLoading } = trpc.events.list.useQuery();
const hasData = !!data;
const isInitialLoading = isLoading && !hasData;

// 手動計測（オプション）
usePerformanceMonitor("ホーム画面", hasData, isLoading, isFirstLoad);
```

## 本番環境での動作

本番環境（`__DEV__ === false`）では、パフォーマンス計測は**完全に無効化**されます。ログは一切出力されず、パフォーマンスへの影響もありません。

## トラブルシューティング

### ログが出力されない

1. **開発環境で実行していますか？**
   - `expo start`で起動していることを確認
   - `expo start --no-dev`では無効化されます

2. **Metro Bundlerのコンソールを確認していますか？**
   - ターミナルで`expo start`を実行したウィンドウを確認
   - Expo Goアプリ内のコンソールではなく、Metro Bundlerのコンソールに出力されます

### パフォーマンス警告が多い

1. **ネットワーク環境を確認**
   - Wi-Fiの速度が遅い場合、初回ロードが1秒を超えることがあります

2. **サーバーの応答時間を確認**
   - バックエンドのデータベースクエリが遅い可能性があります
   - `server/routers/`のクエリを最適化してください

3. **キャッシュ設定を確認**
   - `staleTime`が短すぎると、頻繁に再フェッチが発生します
   - 現在の設定: 30分（推奨）

## 関連ファイル

- `lib/performance-auto-monitor.ts` - 自動計測の実装
- `lib/performance-monitor.ts` - 手動計測のフック（主要画面のみ）
- `app/_layout.tsx` - React Query設定の統合
- `docs/performance-monitoring.md` - 手動計測の詳細ガイド

## 今後の拡張

### オプション1: パフォーマンスメトリクスのダッシュボード

現在はコンソールログのみですが、将来的には以下のような拡張が可能です：

- 画面ごとの平均ローディング時間
- 最も遅いクエリのランキング
- 時系列でのパフォーマンス推移

### オプション2: 本番環境でのモニタリング

Sentry、Datadog、New Relicなどのモニタリングサービスと統合し、本番環境でのパフォーマンスを追跡できます。

```typescript
// 例: Sentryとの統合
if (!__DEV__) {
  Sentry.addBreadcrumb({
    category: "performance",
    message: `Query ${queryName} took ${duration}ms`,
    level: duration > SLOW_QUERY_THRESHOLD ? "warning" : "info",
  });
}
```

## まとめ

v6.65で実装したパフォーマンス計測の自動化により、開発中に全てのクエリのローディング時間を自動的に監視できるようになりました。これにより、パフォーマンスの問題を早期に発見し、ユーザー体験を継続的に改善できます。
