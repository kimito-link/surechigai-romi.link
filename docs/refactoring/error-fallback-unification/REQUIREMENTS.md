# エラーフォールバック統一 - 要件定義

## 目的
複数のエラーフォールバックコンポーネントで重複しているRetryButtonパターンを統一し、保守性を向上させる。

## 現状の問題
1. `components/ui/error-boundary.tsx` - DefaultErrorFallback（RetryButton実装あり）
2. `components/ui/map-error-fallback.tsx` - MapErrorFallback（RetryButton実装あり）
3. `components/organisms/error-dialog.tsx` - ErrorDialog（RetryButton実装あり）
4. `components/organisms/error-message.tsx` - ErrorMessage（RetryButton実装あり）
5. `components/molecules/auth-ux/ErrorScreen.tsx` - ErrorScreen（RetryButton実装あり）

各コンポーネントで類似のRetryButtonが実装されている。

## 要件

### 機能要件
1. **共通RetryButtonコンポーネント**
   - `components/ui/retry-button.tsx` を新規作成
   - MaterialIcons "refresh" アイコン
   - テキスト: "再試行" / "再読み込み" / "もう一度試す"（カスタマイズ可能）
   - ハプティクスフィードバック
   - Pressable wrapper with opacity/scale feedback

2. **統合**
   - 既存の5コンポーネントでRetryButtonを使用
   - 必要に応じてvariant（"retry" | "reload" | "tryAgain"）を追加

### 非機能要件
- 既存の動作を維持
- 型安全性を保つ

## 成功基準
1. RetryButtonコンポーネントが作成される
2. 既存の5コンポーネントでRetryButtonが使用される
3. 型チェック・ビルドが通る
