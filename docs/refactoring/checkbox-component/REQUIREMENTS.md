# Checkbox コンポーネント統一 - 要件定義

## 目的
複数のファイルで重複実装されているCheckboxパターンを統一し、保守性と一貫性を向上させる。

## 現状の問題
1. `features/event-detail/components/form-inputs/TermsAndPermissions.tsx` - VideoPermissionCheckbox（24x24）
2. `features/create/ui/components/TemplateSaveSection.tsx` - 2つのcheckboxパターン（24x24, 20x20）
3. `components/molecules/challenge-created-modal.tsx` - checkboxパターン

各実装でサイズ、スタイル、レイアウトが微妙に異なる。

## 要件

### 機能要件
1. **基本機能**
   - checked/unchecked状態の表示
   - タップで状態を切り替え
   - ラベルと説明文の表示（説明文は任意）

2. **スタイル要件**
   - サイズバリエーション: `sm` (20x20), `md` (24x24)
   - チェックアイコン: MaterialIcons "check"
   - ボーダー: 2px, 角丸: 4px
   - アクセシビリティ: 十分なタッチターゲットサイズ

3. **プロップス**
   - `checked: boolean` - チェック状態
   - `onChange: (checked: boolean) => void` - 状態変更ハンドラ
   - `label: string` - ラベルテキスト（必須）
   - `description?: string` - 説明文（任意）
   - `size?: "sm" | "md"` - サイズ（デフォルト: "md"）
   - `disabled?: boolean` - 無効化フラグ
   - `containerStyle?: ViewStyle` - コンテナのカスタムスタイル

4. **統合要件**
   - `components/ui/checkbox.tsx` に配置
   - `components/ui/index.ts` からエクスポート
   - 既存の3ファイルで使用されているパターンを置き換え可能

## 非機能要件
- TypeScript型安全性
- アクセシビリティ対応（最小タッチターゲット44x44px）
- テーマ対応（useColors hook使用）
- パフォーマンス最適化（必要に応じてmemo化）

## 成功基準
1. 統一されたCheckboxコンポーネントが作成される
2. 既存の3ファイルで使用されているcheckboxが新しいコンポーネントに置き換えられる
3. 視覚的な一貫性が保たれる
4. テストが全て通る
