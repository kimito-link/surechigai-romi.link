# Skeleton コンポーネント統合 - 要件定義

## 目的
2つの重複実装されているSkeletonコンポーネントを統合し、保守性と一貫性を向上させる。

## 現状の問題
1. `components/atoms/skeleton.tsx` - opacityベースのアニメーション、SKELETON_CONFIG使用
2. `components/atoms/skeleton-loader.tsx` - LinearGradient + translateXベースのアニメーション

**使用状況:**
- `skeleton-loader.tsx`: mypage-skeleton, event-detail-skeleton, HomeListHeader で使用
- `skeleton.tsx`: 直接使用は少ないが、SKELETON_CONFIGを使用

## 要件

### 機能要件
1. **統合されたSkeletonコンポーネント**
   - 1つの実装に統一
   - 既存の使用箇所と互換性を保つ

2. **アニメーション方式**
   - LinearGradient + translateX方式を採用（より視覚的に分かりやすい）
   - SKELETON_CONFIGの設定値を活用

3. **コンポーネントバリエーション**
   - `Skeleton` - 基本コンポーネント
   - `CardSkeleton` - カード型
   - `ListItemSkeleton` - リストアイテム型
   - `ProfileSkeleton` - プロフィール型
   - `ChallengeCardSkeleton` - チャレンジカード型

### 非機能要件
- 既存の使用箇所で動作することを保証
- パフォーマンスを維持
- 型安全性を保つ

## 統合計画

### Phase 1: skeleton-loader.tsxをベースに統合
- `skeleton-loader.tsx`をベースに（より多く使われている）
- `skeleton.tsx`のSKELETON_CONFIG設定を取り入れる
- 既存の使用箇所を確認

### Phase 2: skeleton.tsxを削除
- 使用箇所がないことを確認
- ファイル削除
- エクスポートの整理

## 成功基準
1. 統合されたSkeletonコンポーネントが作成される
2. 既存の使用箇所が正常に動作する
3. skeleton.tsxが削除される
4. 型チェック・ビルドが通る
