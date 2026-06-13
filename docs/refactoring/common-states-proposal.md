# 共通状態コンポーネント化の提案

## 現状分析

### 重複しているパターン（2回以上）

1. **ローディング状態のUI**
   - `ActivityIndicator` + `Text` の組み合わせが **30+画面** で重複
   - 「読み込み中...」という文言が各画面で個別に書かれている
   - ローディング状態の判定ロジック（`isInitialLoading`, `isRefreshing`）が各画面で重複

2. **エラー状態のUI**
   - エラー表示のUIが各画面で個別に実装されている
   - 再試行ボタンの実装が重複

3. **空状態のUI**
   - `EmptyState`コンポーネントは既にあるが、一部の画面では独自実装

### 既存の共通コンポーネント

- ✅ `LoadingScreen` - キャラクター付きローディング（`components/molecules/loading-screen.tsx`）
- ✅ `LoadingIndicator` - インラインローディング
- ✅ `EmptyState` - 空状態（`components/ui/section.tsx`）

## 提案：共通状態コンポーネントの作成

### 1. 画面レベルのローディング状態コンポーネント

**作成場所**: `components/ui/screen-loading-state.tsx`

```typescript
// 画面全体のローディング状態を表示
<ScreenLoadingState message="データを読み込み中..." />
```

**使用例**:
```typescript
if (isInitialLoading) {
  return <ScreenLoadingState message="ユーザーを読み込み中..." />;
}
```

### 2. 画面レベルのエラー状態コンポーネント

**作成場所**: `components/ui/screen-error-state.tsx`

```typescript
// エラー状態を表示（再試行ボタン付き）
<ScreenErrorState 
  errorMessage={error?.message || "データを読み込めませんでした"}
  onRetry={refetch}
/>
```

### 3. ローディング状態判定フック

**作成場所**: `hooks/use-loading-state.ts`

```typescript
// ローディング状態の判定ロジックを共通化
const loadingState = useLoadingState({
  isLoading,
  isFetching,
  hasData,
  isFetchingNextPage, // 無限スクロール用（オプション）
});

// loadingState.isInitialLoading
// loadingState.isRefreshing
// loadingState.isLoadingMore
```

### 4. 文言の設定化

**作成場所**: `constants/copy/common.ts`

```typescript
export const loadingMessages = {
  default: "読み込み中...",
  user: "ユーザーを読み込み中...",
  challenge: "チャレンジを読み込み中...",
  data: "データを読み込み中...",
  // ...
};
```

## 実装優先順位

### Phase 1: 共通コンポーネント作成（高優先度）
- [x] `ScreenLoadingState` コンポーネント
- [x] `ScreenErrorState` コンポーネント
- [x] `useLoadingState` フック
- [x] 文言の設定化

### Phase 2: 主要画面への適用（中優先度）
以下の画面から順次適用：
1. `app/admin/users.tsx`
2. `app/admin/challenges.tsx`
3. `app/admin/categories.tsx`
4. `app/admin/participations.tsx`
5. `app/admin/errors.tsx`
6. `app/admin/api-usage.tsx`
7. `app/release-notes.tsx`
8. `app/messages/index.tsx`
9. `app/following.tsx`
10. `app/followers.tsx`

### Phase 3: その他の画面（低優先度）
- フォーム画面（データ取得なし）はスキップ
- 管理画面の細かい画面は後回し

## 判断基準の適用

### ✅ コンポーネント化すべきもの（2回以上出る）
- ローディング状態のUI → `ScreenLoadingState`
- エラー状態のUI → `ScreenErrorState`
- ローディング状態の判定ロジック → `useLoadingState`

### ✅ 設定化すべきもの
- 文言（「読み込み中...」など） → `constants/copy/common.ts`

### ✅ 直書きOK（1回しか出ない）
- 各画面の固有のレイアウト構造
- ページ固有のストーリー
- 画面固有の空状態メッセージ

## 期待される効果

1. **コード削減**: 各画面で10-20行削減 → 全体で300-500行削減見込み
2. **保守性向上**: ローディング/エラーUIの修正が1箇所で済む
3. **一貫性向上**: 全画面で統一されたローディング/エラー表示
4. **開発速度向上**: 新しい画面を作る際のテンプレートとして利用可能
