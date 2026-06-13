# パフォーマンス最適化ガイド

このドキュメントでは、アプリケーションのパフォーマンス最適化について説明します。

## 1. FlatListの最適化

### 最適化プロパティ

すべてのFlatListコンポーネントに以下の最適化プロパティを適用しています：

```tsx
<FlatList
  // パフォーマンス最適化
  windowSize={5}                              // 表示領域の5倍をレンダリング
  maxToRenderPerBatch={10}                    // バッチあたり最大10アイテム
  initialNumToRender={10}                     // 初期表示10アイテム
  removeClippedSubviews={Platform.OS !== "web"} // ネイティブのみ
  updateCellsBatchingPeriod={50}              // 50msごとに更新
/>
```

### プリセット設定

`hooks/use-optimized-flatlist.ts`で提供されるプリセット：

| プリセット | 用途 | windowSize | maxToRenderPerBatch |
|-----------|------|------------|---------------------|
| standard | フォロワー、ランキング | 5 | 10 |
| grid | チャレンジカード | 5 | 6 |
| chat | メッセージ | 10 | 15 |
| gallery | 画像ギャラリー | 3 | 4 |

### 使用例

```tsx
import { useOptimizedFlatList, FLATLIST_PRESETS } from "@/hooks/use-optimized-flatlist";

function MyList() {
  const { optimizedProps, getItemLayout } = useOptimizedFlatList({
    itemHeight: 72, // 固定高さの場合
    ...FLATLIST_PRESETS.standard,
  });

  return (
    <FlatList
      {...optimizedProps}
      getItemLayout={getItemLayout}
      data={data}
      renderItem={renderItem}
    />
  );
}
```

## 2. 画像の最適化

### LazyImage コンポーネント

画面に表示されるまで画像の読み込みを遅延させます：

```tsx
import { LazyImage } from "@/components/lazy-image";

<LazyImage
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  lazy={true}                    // 遅延読み込みを有効化
  rootMargin={100}               // 100px手前から読み込み開始
/>
```

### OptimizedImage コンポーネント

シマーエフェクト付きのプレースホルダーを表示：

```tsx
import { OptimizedImage } from "@/components/optimized-image";

<OptimizedImage
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  placeholderType="shimmer"      // shimmer | blur | solid
/>
```

### 画像プリフェッチ

次に表示される画像を事前に読み込み：

```tsx
import { prefetchChallengeImages } from "@/lib/image-prefetch";

// チャレンジリストの画像をプリフェッチ
useEffect(() => {
  if (challenges) {
    prefetchChallengeImages(challenges);
  }
}, [challenges]);
```

## 3. コンポーネントのメモ化

### React.memo の使用

頻繁に再レンダリングされるコンポーネントをメモ化：

```tsx
import { memo } from "react";

export const MemoizedCard = memo(function Card({ data, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      {/* ... */}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数
  return prevProps.data.id === nextProps.data.id;
});
```

### useCallback の使用

イベントハンドラをメモ化：

```tsx
const handlePress = useCallback(() => {
  navigation.navigate("Detail", { id: item.id });
}, [item.id]);
```

### useMemo の使用

計算コストの高い値をメモ化：

```tsx
const sortedData = useMemo(() => {
  return [...data].sort((a, b) => b.score - a.score);
}, [data]);
```

## 4. 最適化されたコンポーネント一覧

| コンポーネント | 最適化内容 |
|--------------|-----------|
| `LazyImage` | Intersection Observer、遅延読み込み |
| `OptimizedImage` | シマーエフェクト、フェードイン |
| `LazyAvatar` | 遅延読み込み、フォールバック表示 |

## 5. パフォーマンス計測

### 開発時のプロファイリング

React DevToolsのProfilerを使用してパフォーマンスを計測：

1. Chrome DevToolsを開く
2. React DevToolsタブを選択
3. Profilerタブで記録を開始
4. 操作を実行
5. 結果を分析

### 主要な指標

- **Time to Interactive (TTI)**: ユーザーが操作可能になるまでの時間
- **First Contentful Paint (FCP)**: 最初のコンテンツが表示されるまでの時間
- **Largest Contentful Paint (LCP)**: 最大のコンテンツが表示されるまでの時間

## 6. ベストプラクティス

### DO（推奨）

- ✅ FlatListに最適化プロパティを設定する
- ✅ 固定高さのアイテムには`getItemLayout`を使用する
- ✅ 画像は`expo-image`を使用する（キャッシュ機能付き）
- ✅ 重いコンポーネントは`React.memo`でメモ化する
- ✅ イベントハンドラは`useCallback`でメモ化する

### DON'T（非推奨）

- ❌ ScrollViewで`.map()`を使用する（FlatListを使う）
- ❌ インラインスタイルオブジェクトを使用する
- ❌ renderItem内で新しい関数を作成する
- ❌ 不要な状態更新を行う
- ❌ 大きな画像をそのまま表示する

## 7. 今後の改善予定

- [ ] バンドルサイズの分析と削減
- [ ] コード分割（Dynamic Import）の導入
- [ ] Service Workerによるキャッシング（Web）
- [ ] 画像のWebP形式への変換
- [ ] フォントのサブセット化
