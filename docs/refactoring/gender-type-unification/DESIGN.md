# Gender型統一 - 設計書

## 設計方針

### 標準Gender型
- **定義場所**: `types/participation.ts`
- **型**: `Gender = "male" | "female" | "unspecified"`
- **用途**: データベーススキーマと一致する標準型

### フォーム用Gender型
- **定義場所**: `components/ui/gender-selector.tsx`
- **型**: `FormGender = Gender | ""`
- **用途**: フォーム入力時の未選択状態を表現

## 実装パターン

### 1. 標準Gender型の使用
```typescript
import type { Gender } from "@/types/participation";

const gender: Gender = "male"; // "male" | "female" | "unspecified"
```

### 2. フォーム用Gender型の使用
```typescript
import type { FormGender } from "@/components/ui";

const [gender, setGender] = useState<FormGender>(""); // "" | "male" | "female" | "unspecified"
```

### 3. 型変換
```typescript
// FormGender → Gender（空文字列を除外）
const dbGender: Gender = gender || "unspecified";

// Gender → FormGender（そのまま使用可能）
const formGender: FormGender = dbGender;
```

## 変更箇所

### 型定義の変更
1. `components/ui/gender-selector.tsx`
   - `Gender`型を削除
   - `FormGender = Gender | ""`を追加
   - `GenderSelectorProps`の型を`FormGender`に変更

2. `components/ui/index.ts`
   - `Gender`エクスポートを削除
   - `FormGender`エクスポートを追加

### 使用箇所の変更
1. `features/event-detail/components/form-inputs/GenderSelector.tsx`
   - `Gender`を`FormGender`に変更

2. `features/event-detail/hooks/useParticipationForm.ts`
   - `FormGender`と`Gender`をインポート
   - フォーム状態は`FormGender`を使用
   - API送信時は`Gender`に変換

3. `features/events/hooks/useEventDetailScreen.ts`
   - `FormGender`と`Gender`をインポート
   - フォーム状態は`FormGender`を使用
   - API送信時は`Gender`に変換

4. `features/events/components/participation-form/types.ts`
   - `ParticipationFormProps`の`gender`を`FormGender`に変更

5. `app/oauth/twitter-callback.tsx`
   - `Gender`型を使用

6. `app/event/[id].tsx`
   - 文字列リテラルを`Gender`型に統一（表示ロジック）

## 注意事項

1. **空文字列の扱い**
   - フォーム入力時のみ空文字列を許可
   - データベース保存時は`"unspecified"`に変換

2. **型アサーション**
   - `FormGender`から`Gender`への変換時は、空文字列を除外
   - `gender || "unspecified"`パターンを使用

3. **後方互換性**
   - 既存の動作を維持
   - 型安全性を向上させるが、実行時の動作は変更しない
