# Performance Monitoring

## 概要

v6.59-v6.60で実装したperformance-monitorにより、主要3画面（ホーム、イベント詳細、ランキング）のローディング時間を自動計測できるようになりました。

## 計測対象画面

### 1. ホーム画面
- **画面名**: `Home`
- **計測開始**: `isInitialLoading = true`の時
- **計測終了**: `isInitialLoading = false`の時
- **キャッシュ判定**: `hasData`で判定

### 2. イベント詳細画面
- **画面名**: `EventDetail`
- **計測開始**: `isInitialLoading = true`の時
- **計測終了**: `isInitialLoading = false`の時
- **キャッシュ判定**: `hasData`で判定

### 3. ランキング画面
- **画面名**: `Rankings`
- **計測開始**: `isInitialLoading = true`の時
- **計測終了**: `isInitialLoading = false`の時
- **キャッシュ判定**: `hasData`で判定

## 計測内容

### 自動ログ出力

開発環境（`__DEV__ = true`）で、以下のログが自動出力されます：

```
[Performance] Home loaded in 450ms
[Performance] EventDetail loaded in 320ms
[Performance] Rankings loaded in 580ms
```

### 警告ログ

**1秒以上かかった場合:**
```
[Performance] Home took 1200ms (>1s target)
```

**キャッシュがあるのに100ms以上かかった場合:**
```
[Performance] Home has cache but took 150ms (should be <100ms)
```

## パフォーマンス目標

| 状態 | 目標時間 | 説明 |
|------|---------|------|
| **初回ロード** | < 1秒 | ネットワークからのデータ取得 |
| **キャッシュあり** | < 100ms | React Queryキャッシュからの表示 |
| **裏更新** | 非同期 | 小インジケータで通知、スケルトンなし |

## 実装詳細

### usePerformanceMonitorフック

```typescript
usePerformanceMonitor(
  "Home",              // 画面名
  homeData.hasData,    // キャッシュの有無
  homeData.isInitialLoading,  // ローディング中か
  !homeData.hasData    // 初回ロードか
);
```

### 計測ロジック

1. **開始**: `isInitialLoading = true`になった瞬間に`Date.now()`を記録
2. **終了**: `isInitialLoading = false`になった瞬間に経過時間を計算
3. **ログ出力**: 計測結果をコンソールに出力

## React Query設定

パフォーマンス最適化のため、以下の設定を使用：

```typescript
{
  staleTime: 30 * 60 * 1000,  // 30分間はキャッシュを新鮮とみなす
  gcTime: 2 * 60 * 60 * 1000, // 2時間キャッシュを保持
  refetchOnWindowFocus: false, // フォーカス時の自動再取得を無効化
}
```

## 計測結果の確認方法

### 開発環境（Expo Go）

1. Expo Goでアプリを起動
2. Metro Bundlerのターミナルでログを確認
3. 各画面に遷移してローディング時間を確認

### 実機テスト推奨シナリオ

1. **初回ロード**: アプリを完全に終了してから起動
2. **キャッシュあり**: 一度訪れた画面に再度遷移
3. **裏更新**: データがある状態でpull-to-refresh

## 期待される結果

### 初回ロード（キャッシュなし）
- ホーム画面: 500-800ms
- イベント詳細: 300-500ms
- ランキング画面: 500-700ms

### キャッシュあり
- 全画面: 50-100ms（即座に表示）

### 裏更新
- スケルトンなし、小インジケータのみ表示
- ユーザーは古いデータを見続けられる

## トラブルシューティング

### ログが出力されない

- `__DEV__`が`false`になっている可能性
- `usePerformanceMonitor`が正しく呼ばれているか確認

### 計測時間が異常に長い

- ネットワーク接続を確認
- APIサーバーの応答時間を確認
- React Queryのキャッシュ設定を確認

### キャッシュが効いていない

- `staleTime`と`gcTime`の設定を確認
- ブラウザ/アプリのキャッシュをクリアしていないか確認

## 今後の改善案

1. **計測結果の集計**: 平均値、最大値、最小値を自動計算
2. **パフォーマンスダッシュボード**: 開発環境で計測結果を可視化
3. **本番環境での計測**: Sentryなどの監視ツールと統合
4. **ネットワーク速度別の計測**: 3G/4G/WiFi環境での比較

## 参考資料

- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
- [Expo Performance](https://docs.expo.dev/guides/performance/)
- [React Native Performance](https://reactnative.dev/docs/performance)
