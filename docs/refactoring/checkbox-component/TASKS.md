# Checkbox コンポーネント統一 - タスクリスト

## Phase 1: コンポーネント作成（TDD）

### Task 1.1: テストファイル作成
- [x] `__tests__/ui/checkbox.test.tsx` を作成
- [x] 基本機能のテストケースを記述
  - checked/unchecked表示
  - onChange呼び出し
  - disabled状態
  - サイズバリエーション
  - 説明文の表示

### Task 1.2: Checkboxコンポーネント実装
- [x] `components/ui/checkbox.tsx` を作成
- [x] Props interface定義
- [x] 基本レイアウト実装
- [x] スタイル実装（sm/mdサイズ）
- [x] チェックアイコン表示ロジック
- [x] Pressableハンドラ実装

### Task 1.3: エクスポート設定
- [x] `components/ui/index.ts` にCheckboxを追加
- [x] 型定義もエクスポート

### Task 1.4: テスト実行・修正
- [x] テストを実行
- [x] 失敗するテストを修正
- [x] 全てのテストが通ることを確認

## Phase 2: 既存コードの置き換え

### Task 2.1: TermsAndPermissions.tsx
- [x] VideoPermissionCheckboxをCheckboxに置き換え
- [x] スタイル調整
- [x] 動作確認

### Task 2.2: TemplateSaveSection.tsx
- [x] 1つ目のcheckbox（テンプレート保存）を置き換え
- [x] 2つ目のcheckbox（公開設定）を置き換え
- [x] スタイル調整
- [x] 動作確認

### Task 2.3: challenge-created-modal.tsx
- [ ] checkboxパターンをCheckboxに置き換え（構造が異なるため後回し）
- [ ] 動作確認

## Phase 3: クリーンアップ

### Task 3.1: 不要コード削除
- [x] VideoPermissionCheckbox関数を削除
- [x] その他のローカルcheckbox実装を削除

### Task 3.2: ドキュメント更新
- [x] COMPONENT_REGISTRY.mdにCheckboxを追加
- [x] 使用例を記載

### Task 3.3: 最終確認
- [x] 全ファイルで型チェック
- [x] ビルド確認
- [x] 視覚的確認
