# コンポーネントレジストリ

**このファイルは、既存のコンポーネント一覧を記載しています。新しいコンポーネントを作成する前に、このファイルを確認してください。**

---

## 認証関連

### LoginModal
- **パス**: `components/common/LoginModal.tsx`
- **用途**: すべての画面で使用する統一されたログインUI
- **使用箇所**: マイページ、ホーム、チャレンジ
- **重要**: 新しいログインUIを作成しない。必ずこのコンポーネントを使用すること
- **Props**:
  - `visible: boolean` - モーダルの表示/非表示
  - `onConfirm: () => void` - ログイン確認時のコールバック
  - `onCancel: () => void` - キャンセル時のコールバック

### LoginConfirmModal（削除済み）
- **状態**: 削除済み。ログイン確認には必ず `LoginModal`（`components/common/LoginModal.tsx`）を使用すること。

### LoginButton（非推奨）
- **パス**: `features/mypage/components/login-screen/LoginButton.tsx`
- **状態**: **非推奨** - `LoginModal` を使用すること
- **理由**: 重複実装のため

---

## UI部品

### Button
- **パス**: `components/ui/button.tsx`
- **用途**: すべてのボタン
- **バリエーション**: `primary`, `outline`, `loading`
- **Props**:
  - `onPress: () => void` - ボタン押下時のコールバック
  - `disabled?: boolean` - 無効化フラグ
  - `loading?: boolean` - ローディング表示フラグ
  - `icon?: string` - アイコン名
  - `variant?: 'primary' | 'outline'` - バリエーション

### Card
- **パス**: `components/ui/card.tsx`
- **用途**: カード型のコンテナ
- **使用箇所**: ホーム、チャレンジ、マイページ

### Input
- **パス**: `components/ui/input.tsx`
- **用途**: テキスト入力フィールド
- **使用箇所**: チャレンジ作成、プロフィール編集

### Checkbox
- **パス**: `components/ui/checkbox.tsx`
- **用途**: チェックボックス（ラベル・説明文対応）
- **使用箇所**: 動画利用許可、テンプレート保存設定
- **Props**:
  - `checked: boolean` - チェック状態
  - `onChange: (checked: boolean) => void` - 状態変更ハンドラ
  - `label: string` - ラベルテキスト
  - `description?: string` - 説明文（任意）
  - `size?: "sm" | "md"` - サイズ（デフォルト: "md"）
  - `disabled?: boolean` - 無効化フラグ

### Modal
- **パス**: `components/ui/modal.tsx`
- **用途**: モーダルダイアログ
- **使用箇所**: 各種確認ダイアログ

---

## レイアウト

### ScreenContainer
- **パス**: `components/organisms/screen-container.tsx`
- **用途**: 画面全体のコンテナ（SafeArea対応）
- **使用箇所**: すべての画面
- **Props**:
  - `edges?: Edge[]` - SafeAreaのエッジ設定
  - `className?: string` - Tailwindクラス
  - `containerClassName?: string` - 外側のコンテナのクラス

### AppHeader
- **パス**: `components/organisms/app-header.tsx`
- **用途**: アプリケーションヘッダー
- **使用箇所**: すべての画面

---

## チャレンジ関連

### ChallengeCard
- **パス**: `features/home/components/ChallengeCard.tsx`
- **用途**: チャレンジカード（ホーム画面）
- **使用箇所**: ホーム画面

### ColorfulChallengeCard
- **パス**: `components/molecules/colorful-challenge-card.tsx`
- **用途**: カラフルなチャレンジカード
- **使用箇所**: チャレンジ一覧

---

## 画像関連

### LazyImage / LazyAvatar
- **パス**: `components/molecules/lazy-image.tsx`
- **用途**: 遅延読み込み画像（Intersection Observer・フェードイン）。LazyAvatar はアバター用フォールバック対応
- **使用箇所**: チャレンジカード、プロフィール画像、ランキング
- **注意**: どちらも molecules に統一。`@/components/molecules/lazy-image` から import すること

### OptimizedImage
- **パス**: `components/molecules/optimized-image.tsx`
- **用途**: 最適化された画像
- **使用箇所**: 高解像度画像

### ProgressiveImage
- **パス**: `components/molecules/progressive-image.tsx`
- **用途**: プログレッシブ読み込み画像
- **使用箇所**: 大きな画像

---

## モーダル

### ConfirmModal
- **パス**: `components/molecules/confirm-modal.tsx`
- **用途**: 確認ダイアログ
- **使用箇所**: 削除確認、ログアウト確認

### WelcomeModal
- **パス**: `components/molecules/welcome-modal.tsx`
- **用途**: ウェルカムモーダル
- **使用箇所**: 初回訪問時

### EncouragementModal
- **パス**: `components/molecules/encouragement-modal.tsx`
- **用途**: 励ましモーダル
- **使用箇所**: チャレンジ参加時

### SharePromptModal
- **パス**: `components/molecules/share-prompt-modal.tsx`
- **用途**: シェア促進モーダル
- **使用箇所**: チャレンジ作成後

---

## ローディング

### LoadingScreen
- **パス**: `components/molecules/loading-screen.tsx`
- **用途**: 全画面ローディング
- **使用箇所**: 初期ローディング

### SkeletonLoader
- **パス**: `components/atoms/skeleton-loader.tsx`
- **用途**: スケルトンローディング
- **使用箇所**: データ読み込み中

### CharacterLoadingIndicator
- **パス**: `components/atoms/character-loading-indicator.tsx`
- **用途**: キャラクター付きローディング
- **使用箇所**: 長時間の処理

---

## エラー表示

### ErrorDialog
- **パス**: `components/organisms/error-dialog.tsx`
- **用途**: エラーダイアログ
- **使用箇所**: エラー発生時

### ErrorMessage
- **パス**: `components/organisms/error-message.tsx`
- **用途**: エラーメッセージ
- **使用箇所**: フォームバリデーション

### InlineValidationError
- **パス**: `components/molecules/inline-validation-error.tsx`
- **用途**: インラインバリデーションエラー
- **使用箇所**: フォーム入力

---

## マップ関連

### JapanHeatmap
- **パス**: `components/organisms/japan-heatmap/JapanHeatmap.tsx`
- **用途**: 日本地図ヒートマップ
- **使用箇所**: 統計画面

### JapanMap
- **パス**: `components/organisms/japan-map.tsx`
- **用途**: 日本地図
- **使用箇所**: 地域別参加者表示

### JapanRegionBlocks
- **パス**: `components/organisms/japan-region-blocks.tsx`
- **用途**: 日本地域ブロック
- **使用箇所**: 地域別統計

---

## ランキング

### ParticipantRanking
- **パス**: `components/organisms/participant-ranking/ParticipantRanking.tsx`
- **用途**: 参加者ランキング
- **使用箇所**: チャレンジ詳細

### TopThreeRanking
- **パス**: `components/organisms/participant-ranking/TopThreeRanking.tsx`
- **用途**: トップ3ランキング
- **使用箇所**: チャレンジ詳細

---

## チュートリアル

### TutorialOverlay
- **パス**: `components/organisms/tutorial-overlay/TutorialOverlay.tsx`
- **用途**: チュートリアルオーバーレイ
- **使用箇所**: 初回訪問時

### OnboardingSteps
- **パス**: `components/organisms/onboarding-steps.tsx`
- **用途**: オンボーディングステップ
- **使用箇所**: 初回訪問時

---

## その他

### Toast
- **パス**: `components/atoms/toast.tsx`
- **用途**: トースト通知
- **使用箇所**: 成功/エラー通知

### NetworkToast
- **パス**: `components/organisms/network-toast.tsx`
- **用途**: ネットワーク状態通知
- **使用箇所**: オフライン時

### OfflineBanner
- **パス**: `components/organisms/offline-banner.tsx`
- **用途**: オフラインバナー
- **使用箇所**: オフライン時

### SyncStatusIndicator
- **パス**: `components/atoms/sync-status-indicator.tsx`
- **用途**: 同期状態インジケーター
- **使用箇所**: オフライン同期時

---

## コンポーネント作成時のガイドライン

### 新しいコンポーネントを作成する前に

1. **このファイルを確認**: 既存のコンポーネントで代用できないか確認
2. **検索**: `match` ツールで類似コンポーネントを検索
3. **再利用**: 既存のコンポーネントを再利用できる場合は、必ず再利用

### 新しいコンポーネントを作成した場合

1. **このファイルに追加**: コンポーネントの情報を追加
2. **カテゴリ分け**: 適切なカテゴリに分類
3. **情報を記載**:
   - パス
   - 用途
   - 使用箇所
   - Props（主要なもの）

---

**最終更新**: 2026-01-31
