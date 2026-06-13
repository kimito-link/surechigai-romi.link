# Checkbox コンポーネント - 設計書

## アーキテクチャ

### コンポーネント構造
```
components/ui/checkbox.tsx
├── Checkbox (メインコンポーネント)
│   ├── Pressable (ラッパー)
│   ├── View (チェックボックス本体)
│   │   └── MaterialIcons (check icon, checked時のみ表示)
│   └── View (ラベル・説明文コンテナ)
│       ├── Text (ラベル)
│       └── Text (説明文, optional)
```

### スタイル定義
- **サイズ**
  - `sm`: 20x20px, fontSize 12
  - `md`: 24x24px, fontSize 14
- **ボーダー**: 2px, borderRadius 4px
- **カラー**
  - checked: `color.accentPrimary` (border + background)
  - unchecked: `color.textHint` (border), transparent (background)
  - disabled: `color.textDisabled`

### レイアウト
```
[Checkbox] [Label]
           [Description (optional)]
```

## 実装詳細

### Props Interface
```typescript
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  containerStyle?: ViewStyle;
}
```

### 状態管理
- 内部状態なし（完全にcontrolled component）
- Pressableのpressed状態で視覚的フィードバック

### アクセシビリティ
- Pressableの最小サイズ: 44x44px（Apple HIG準拠）
- チェックボックス自体は20-24pxだが、Pressable全体でタッチ可能

### テーマ統合
- `useColors()` hookでテーマカラーを取得
- `color` tokensを使用

## 既存コードとの互換性

### VideoPermissionCheckbox の置き換え
```typescript
// Before
<VideoPermissionCheckbox
  allowVideoUse={allowVideoUse}
  setAllowVideoUse={setAllowVideoUse}
/>

// After
<Checkbox
  checked={allowVideoUse}
  onChange={setAllowVideoUse}
  label="応援動画への使用を許可する"
  description="あなたのコメントを応援動画に使用させていただく場合があります"
/>
```

### TemplateSaveSection の置き換え
```typescript
// Before (2箇所)
<View style={{...checkbox style...}}>
  {saveAsTemplate && <MaterialIcons name="check" />}
</View>

// After
<Checkbox
  checked={saveAsTemplate}
  onChange={onSaveAsTemplateChange}
  label="テンプレートとして保存"
  size="md"
/>
```

## テスト戦略

### ユニットテスト
1. checked状態の表示
2. unchecked状態の表示
3. onChange呼び出し
4. disabled状態
5. サイズバリエーション
6. 説明文の表示/非表示

### 統合テスト
1. 既存ファイルでの置き換え後の動作確認
