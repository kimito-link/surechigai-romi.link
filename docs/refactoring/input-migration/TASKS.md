# TextInput → Input コンポーネント移行 - タスクリスト

## Phase 1: パイロット移行（2ファイル）

### Task 1.1: TitleInputSection.tsx
- [x] `Input`コンポーネントをimport
- [x] TextInputをInputに置き換え
- [x] ラベルを`label` propに移動
- [x] エラー表示を`error` propまたは`InlineValidationError`で処理
- [x] `inputRef`の扱いを確認
- [x] スタイル調整
- [x] 動作確認

### Task 1.2: DescriptionSection.tsx
- [x] `Input`コンポーネントをimport
- [x] TextInputをInputに置き換え（multiline対応）
- [x] ラベルを`label` propに移動
- [x] `multiline`と`numberOfLines` propを設定
- [x] スタイル調整
- [x] 動作確認

### Task 1.3: パイロット確認
- [x] 型チェック
- [x] ビルド確認
- [x] 視覚的確認
- [x] 機能動作確認

## Phase 2: 残りファイルの移行（後続タスク）

### Task 2.1-2.10: 残り10ファイル
各ファイルで同様のパターンで移行

## 完了条件
- [x] 全12ファイルでInput/SearchInputに移行完了
- [x] 型チェック・ビルドが通る
- [x] 既存機能が正常に動作
- [x] ドキュメント更新
