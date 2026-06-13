# コンポーネント設計ガイドライン

v6.22: エラーが出にくく発見しやすい構造

## ディレクトリ構造

```
components/
├── ui/                    # 新しい統一UIコンポーネント（推奨）
│   ├── button.tsx
│   ├── card.tsx
│   ├── modal.tsx
│   ├── input.tsx
│   ├── list.tsx
│   ├── section.tsx
│   └── index.ts           # 統一エクスポート
├── atoms/                 # 基本UI要素（ui/から再エクスポート + レガシー）
├── molecules/             # 複合コンポーネント
├── organisms/             # 機能単位コンポーネント
└── index.ts               # ルートエクスポート
```

## インポート規則

### 推奨パターン

```tsx
// 新UIコンポーネント（推奨）
import { Button, Card, Modal } from "@/components/ui";

// 型のみインポート
import type { ButtonProps, CardProps } from "@/types";

// レガシーコンポーネント
import { OptimizedImage } from "@/components/molecules";
import { JapanMap } from "@/components/organisms";
```

### 避けるべきパターン

```tsx
// ❌ 深いパスからの直接インポート
import { Button } from "@/components/ui/button";

// ❌ 相対パスでの親ディレクトリ参照
import { Button } from "../../atoms/button";
```

## コンポーネント設計原則

### 1. 単一責任原則

各コンポーネントは1つの責任のみを持つ。

```tsx
// ✅ 良い例: 1つの責任
function UserAvatar({ src, size }: UserAvatarProps) {
  return <Image source={{ uri: src }} style={{ width: size, height: size }} />;
}

// ❌ 悪い例: 複数の責任
function UserCard({ user, onEdit, onDelete, onShare, ... }) {
  // 表示、編集、削除、シェアなど多くの責任
}
```

### 2. Props型の明示的定義

すべてのPropsは明示的に型定義する。

```tsx
// ✅ 良い例
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) {
  // ...
}
```

### 3. デフォルト値の設定

オプショナルなPropsにはデフォルト値を設定する。

```tsx
// ✅ 良い例
function Card({ 
  variant = "default", 
  padding = "md",
  children 
}: CardProps) {
  // ...
}
```

### 4. エラーバウンダリの活用

大きなコンポーネントにはエラーバウンダリを設置する。

```tsx
// organisms/japan-map.tsx
export function JapanMap(props: JapanMapProps) {
  return (
    <ErrorBoundary fallback={<MapErrorFallback />}>
      <JapanMapContent {...props} />
    </ErrorBoundary>
  );
}
```

## ファイル命名規則

| 種類 | 命名規則 | 例 |
|------|----------|-----|
| コンポーネント | kebab-case.tsx | `button.tsx`, `user-avatar.tsx` |
| 型定義 | types.ts | `types.ts` |
| フック | use-xxx.ts | `use-auth.ts`, `use-colors.ts` |
| ユーティリティ | xxx.ts | `utils.ts`, `helpers.ts` |
| 定数 | xxx.ts | `constants.ts`, `config.ts` |

## テーマ・スタイル

### ダークモード専用

v6.22以降、ダークモード専用。ライトモード対応は不要。

```tsx
// ✅ 良い例: ダークモード専用のスタイル
const styles = StyleSheet.create({
  container: {
    backgroundColor: color.bg,      // #0D1117
    borderColor: color.border,      // #30363D
  },
  text: {
    color: color.textPrimary,       // #E6EDF3
  },
});
```

### カラートークンの使用

直接の色指定は避け、カラートークンを使用する。

```tsx
// ✅ 良い例
import { color } from "@/theme/tokens";
backgroundColor: color.bg

// ❌ 悪い例
backgroundColor: "#0D1117"
```

## エラー発見のためのチェックリスト

1. [ ] TypeScriptエラーがないか確認
2. [ ] Props型が明示的に定義されているか
3. [ ] デフォルト値が適切に設定されているか
4. [ ] インポートパスが正しいか
5. [ ] 未使用のインポートがないか
6. [ ] コンポーネントがindex.tsからエクスポートされているか
