# セットアップガイド

**このガイドでは、AI実装ミス防止システムをプロジェクトに導入する手順を説明します。**

---

## 📋 前提条件

- プロジェクトのルートディレクトリにアクセスできること
- `docs/` フォルダを作成できること
- テキストエディタでファイルを編集できること

---

## 🚀 セットアップ手順

### ステップ1: フォルダ構成を作成

プロジェクトのルートディレクトリに `docs/` フォルダを作成します。

```bash
# プロジェクトのルートディレクトリで実行
mkdir -p docs
```

---

### ステップ2: テンプレートファイルをコピー

以下のファイルをコピーします：

```bash
# COMMON_MISTAKES.md をコピー
cp COMMON_MISTAKES_TEMPLATE.md docs/COMMON_MISTAKES.md

# AI_INSTRUCTIONS.md をコピー
cp AI_INSTRUCTIONS_TEMPLATE.md docs/AI_INSTRUCTIONS.md
```

---

### ステップ3: プロジェクト固有の情報を記入

コピーしたファイルを開き、`[プレースホルダー]` をプロジェクト固有の情報に置き換えます。

#### 3.1 COMMON_MISTAKES.md の記入

**置き換える情報**:
- `[プロジェクト名]` → 実際のプロジェクト名（例: 「生誕祭応援アプリ」）
- `[具体例]` → プロジェクト固有の具体例
- `[共通コンポーネントのパス]` → 実際のコンポーネントパス（例: `components/common/LoginModal.tsx`）
- `[関連する設計原則]` → 実際の設計原則

**記入例**:

```markdown
### 1. ログインUIの重複実装

**問題**:
- ログインUIを複数の場所で実装してしまう
- 例: ホーム画面、チャレンジ詳細画面、マイページでそれぞれ異なるログインUIを実装

**防止策**:
- **必ず `components/common/LoginModal.tsx` を使用**
- 新しいログインUIを作成しない
- `DESIGN_PRINCIPLES.md` の「UI/UXの一貫性」を厳守

**チェックリスト**:
- [ ] `components/common/LoginModal.tsx`を使用しているか?
- [ ] 新しいログインUIを作成していないか?
- [ ] `COMPONENT_REGISTRY.md`を確認したか?
```

---

#### 3.2 AI_INSTRUCTIONS.md の記入

**置き換える情報**:
- `[機能名]` → プロジェクト固有の機能名（例: 「ログイン」「検索」「フィルタ」）
- `[ComponentName]` → コンポーネント名（例: `LoginModal`、`SearchBar`）
- `[スタイリング方法]` → スタイリング方法（例: Tailwind CSS、CSS Modules）
- `/path/to/project` → 実際のプロジェクトパス
- `[画面名]` → 画面名（例: ホーム、チャレンジ詳細、マイページ）

**記入例**:

```markdown
### 1. ログイン機能

**ログインのUIは `components/common/LoginModal.tsx` のみ使用すること。**

#### 使用例

\`\`\`tsx
import { LoginModal } from "@/components/common/LoginModal";
import { useState } from "react";

export function MyComponent() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <Button onPress={() => setShowLoginModal(true)}>
        ログイン
      </Button>
      
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
\`\`\`

#### 禁止事項

- **新しいログインのUIを作成しない**: `LoginModal` 以外のログインのUIを作成しない
- **重複実装を避ける**: ログインを複数の場所で実装しない
```

---

### ステップ4: （オプション）追加ファイルを作成

プロジェクトの規模に応じて、以下のファイルを追加で作成することを推奨します：

#### 4.1 DESIGN_PRINCIPLES.md（推奨）

プロジェクトの設計原則を記載します。

```bash
cp DESIGN_PRINCIPLES_TEMPLATE.md DESIGN_PRINCIPLES.md
```

**記入内容**:
- UI/UXの一貫性
- コンポーネントの独立性
- データフローの明確化
- パフォーマンスの最適化
- セキュリティの確保

---

#### 4.2 COMPONENT_REGISTRY.md（推奨）

既存のコンポーネント一覧を記載します。

```bash
cp COMPONENT_REGISTRY_TEMPLATE.md docs/COMPONENT_REGISTRY.md
```

**記入内容**:
- コンポーネント名
- ファイルパス
- 用途
- 使用箇所
- 主要なProps

---

### ステップ5: AIに実装を依頼

AI実装時に、以下のように明示的に指示します：

```
「ログイン機能を実装してください。DESIGN_PRINCIPLES.md、COMPONENT_REGISTRY.md、COMMON_MISTAKES.md、AI_INSTRUCTIONS.md を読んでから実装してください。」
```

---

## ✅ セットアップ完了チェックリスト

セットアップが完了したら、以下をチェックしてください：

- [ ] `docs/` フォルダが作成されている
- [ ] `docs/COMMON_MISTAKES.md` が作成されている
- [ ] `docs/AI_INSTRUCTIONS.md` が作成されている
- [ ] `[プレースホルダー]` がすべて置き換えられている
- [ ] プロジェクト固有の具体例が記載されている
- [ ] （オプション）`DESIGN_PRINCIPLES.md` が作成されている
- [ ] （オプション）`docs/COMPONENT_REGISTRY.md` が作成されている

---

## 🔧 トラブルシューティング

### 問題1: AIがファイルを読まない

**原因**: AIが「必要だと判断していない」可能性があります。

**解決策**: ユーザー側から明示的に指示してください。

```
「DESIGN_PRINCIPLES.md、COMPONENT_REGISTRY.md、COMMON_MISTAKES.md、AI_INSTRUCTIONS.md を読んでから実装してください。」
```

---

### 問題2: プレースホルダーが残っている

**原因**: 置き換えが不完全です。

**解決策**: 以下のコマンドで検索してください。

```bash
# プレースホルダーを検索
grep -r "\[" docs/COMMON_MISTAKES.md docs/AI_INSTRUCTIONS.md
```

---

### 問題3: AIが重複実装をしてしまう

**原因**: ファイルの記載が不十分、または指示が曖昧です。

**解決策**:
1. `COMMON_MISTAKES.md` に具体例を追加
2. `AI_INSTRUCTIONS.md` に使用例を追加
3. ユーザー側から明確な指示を出す

---

## 📚 次のステップ

セットアップが完了したら、以下のガイドを参照してください：

1. **AI_PROMPT_TEMPLATE.md**: AI実装時の指示テンプレート
2. **MAINTENANCE_GUIDE.md**: 定期的な更新ガイド

---

## 🤝 サポート

質問やフィードバックがある場合は、以下までご連絡ください：

- **X (Twitter)**: [@reversehackrepu](https://x.com/reversehackrepu)

---

**最終更新**: 2026-01-31
