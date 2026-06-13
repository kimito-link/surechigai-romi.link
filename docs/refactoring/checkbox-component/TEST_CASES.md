# Checkbox コンポーネント - テストケース

## テストファイル: `__tests__/ui/checkbox.test.tsx`

### Test Suite 1: 基本表示

#### Test 1.1: checked状態の表示
```typescript
it("should display checked state correctly", () => {
  // Given: checked=true
  // When: レンダリング
  // Then: チェックアイコンが表示される
  //       borderColorとbackgroundColorがaccentPrimary
})
```

#### Test 1.2: unchecked状態の表示
```typescript
it("should display unchecked state correctly", () => {
  // Given: checked=false
  // When: レンダリング
  // Then: チェックアイコンが表示されない
  //       borderColorがtextHint、backgroundColorがtransparent
})
```

### Test Suite 2: インタラクション

#### Test 2.1: onChange呼び出し
```typescript
it("should call onChange when pressed", () => {
  // Given: onChange mock
  // When: Pressableをタップ
  // Then: onChangeが!checkedで呼ばれる
})
```

#### Test 2.2: disabled時の動作
```typescript
it("should not call onChange when disabled", () => {
  // Given: disabled=true
  // When: Pressableをタップ
  // Then: onChangeが呼ばれない
  //       opacityが低くなる
})
```

### Test Suite 3: サイズバリエーション

#### Test 3.1: smサイズ
```typescript
it("should render with sm size", () => {
  // Given: size="sm"
  // When: レンダリング
  // Then: チェックボックスが20x20px
  //       fontSizeが12
})
```

#### Test 3.2: mdサイズ（デフォルト）
```typescript
it("should render with md size by default", () => {
  // Given: size未指定
  // When: レンダリング
  // Then: チェックボックスが24x24px
  //       fontSizeが14
})
```

### Test Suite 4: ラベル・説明文

#### Test 4.1: ラベル表示
```typescript
it("should display label", () => {
  // Given: label="テストラベル"
  // When: レンダリング
  // Then: ラベルテキストが表示される
})
```

#### Test 4.2: 説明文表示（あり）
```typescript
it("should display description when provided", () => {
  // Given: description="説明文"
  // When: レンダリング
  // Then: 説明文が表示される
})
```

#### Test 4.3: 説明文表示（なし）
```typescript
it("should not display description when not provided", () => {
  // Given: description未指定
  // When: レンダリング
  // Then: 説明文が表示されない
})
```

### Test Suite 5: スタイリング

#### Test 5.1: カスタムcontainerStyle
```typescript
it("should apply custom containerStyle", () => {
  // Given: containerStyle={{ marginTop: 10 }}
  // When: レンダリング
  // Then: カスタムスタイルが適用される
})
```

#### Test 5.2: テーマカラー適用
```typescript
it("should use theme colors", () => {
  // Given: useColors hook
  // When: レンダリング
  // Then: テーマカラーが適用される
})
```

### Test Suite 6: アクセシビリティ

#### Test 6.1: 最小タッチターゲット
```typescript
it("should have minimum touch target size", () => {
  // Given: Pressable
  // When: レンダリング
  // Then: 最小サイズが44x44px以上
})
```

## 統合テスト

### Integration Test 1: TermsAndPermissions統合
- VideoPermissionCheckboxをCheckboxに置き換え
- 既存の機能が正常に動作することを確認

### Integration Test 2: TemplateSaveSection統合
- 2つのcheckboxをCheckboxに置き換え
- 既存の機能が正常に動作することを確認
