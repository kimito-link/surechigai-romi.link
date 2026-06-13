# TextInput → Input コンポーネント移行 - 設計書

## 移行パターン

### パターン1: ラベル + エラー表示（TitleInputSection）

**Before:**
```typescript
<View>
  <Text>チャレンジ名 *</Text>
  <TextInput
    value={value}
    onChangeText={onChange}
    style={{...}}
  />
  <InlineValidationError
    message="チャレンジ名を入れてね！"
    visible={hasError}
  />
</View>
```

**After:**
```typescript
<Input
  label="チャレンジ名 *"
  value={value}
  onChangeText={onChange}
  placeholder="例: ○○ワンマンライブ動員チャレンジ"
  error={hasError ? "チャレンジ名を入れてね！" : undefined}
  ref={inputRef}
/>
```

**注意点:**
- `InlineValidationError`は`Input`の`error` propに統合可能
- ただし、キャラクター表示が必要な場合は`InlineValidationError`を併用

### パターン2: Multiline入力（DescriptionSection）

**Before:**
```typescript
<View>
  <Text>チャレンジ説明（任意）</Text>
  <TextInput
    value={value}
    onChangeText={onChange}
    multiline
    numberOfLines={4}
    style={{...}}
  />
</View>
```

**After:**
```typescript
<Input
  label="チャレンジ説明（任意）"
  value={value}
  onChangeText={onChange}
  placeholder="チャレンジの詳細を書いてね"
  multiline
  numberOfLines={4}
/>
```

### パターン3: 検索入力（SearchBar）

**Before:**
```typescript
<TextInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="検索..."
/>
```

**After:**
```typescript
<SearchInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="検索..."
  onSearch={handleSearch}
/>
```

## テーマトークンの扱い

既存コードでは`createFont`などのテーマトークンを使用しているが、`Input`コンポーネントは標準の`color`トークンを使用。

**対応方針:**
- `Input`コンポーネントのスタイルを優先
- 必要に応じて`containerStyle`や`inputStyle`で微調整
- ラベルのフォントサイズは`Input`のデフォルト（14px）を使用

## エラー表示の統合

### オプション1: Inputのerror propを使用
- シンプルなエラーメッセージ表示
- アイコン付きエラー表示

### オプション2: InlineValidationErrorと併用
- キャラクター表示が必要な場合
- カスタムエラーUIが必要な場合

**推奨:** まずは`Input`の`error` propで統一し、特別な要件がある場合のみ`InlineValidationError`を併用

## refの扱い

`Input`コンポーネントは`forwardRef`で実装されているため、既存の`inputRef`をそのまま使用可能。

```typescript
const inputRef = useRef<TextInput>(null);

<Input
  ref={inputRef}
  ...
/>
```
