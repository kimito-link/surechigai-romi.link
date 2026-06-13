# TextInput → Input コンポーネント移行 - 要件定義

## 目的
複数のファイルで重複実装されているTextInputパターンを統一Inputコンポーネントに置き換え、保守性と一貫性を向上させる。

## 現状の問題
12ファイルで独自のTextInput実装が存在：
1. `features/create/ui/components/create-challenge-form/TitleInputSection.tsx`
2. `features/create/ui/components/create-challenge-form/DescriptionSection.tsx`
3. `features/create/ui/components/create-challenge-form/VenueInputSection.tsx`
4. `features/create/ui/components/create-challenge-form/ExternalUrlSection.tsx`
5. `features/create/ui/components/TicketInfoSection.tsx` (3箇所)
6. `features/create/ui/components/TemplateSaveSection.tsx`
7. `features/event-detail/components/form-inputs/TermsAndPermissions.tsx`
8. `features/events/components/participation-form/ParticipationForm.tsx` (複数箇所)
9. `features/home/components/SearchBar.tsx` → SearchInput使用
10. `features/event-detail/components/companion/TwitterSearchForm.tsx` (2箇所)

各実装でスタイル、ラベル表示、エラー処理が微妙に異なる。

## 要件

### 機能要件
1. **既存Inputコンポーネントの活用**
   - `components/ui/input.tsx`の`Input`コンポーネントを使用
   - `SearchInput`は検索用に使用

2. **移行パターン**
   - ラベル付きTextInput → `Input` with `label` prop
   - multiline TextInput → `Input` with `multiline` prop
   - エラー表示 → `Input` with `error` prop または既存の`InlineValidationError`と併用
   - 検索入力 → `SearchInput`使用

3. **互換性要件**
   - 既存の`inputRef`の扱い（forwardRef対応済み）
   - 既存のバリデーションロジックとの統合
   - テーマトークン（createFont等）との統合

### 非機能要件
- 段階的移行（1-2ファイルずつ）
- 視覚的な一貫性維持
- 既存機能の動作保証

## 移行計画

### Phase 1: パイロット（2ファイル）
1. `TitleInputSection.tsx` - シンプルなラベル+エラー表示
2. `DescriptionSection.tsx` - multiline入力

### Phase 2: 残りのファイル（段階的）
3-12. 残り10ファイルを順次移行

## 成功基準
1. パイロット2ファイルでInputコンポーネントに移行完了
2. 視覚的な一貫性が保たれる
3. 既存機能が正常に動作する
4. 型チェック・ビルドが通る
