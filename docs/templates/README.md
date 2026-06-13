# AI実装ルールファイル テンプレート

**このディレクトリには、他のプロジェクトでも使える汎用的なAI実装ルールファイルのテンプレートが含まれています。**

---

## ファイル一覧

1. **DESIGN_PRINCIPLES_TEMPLATE.md**: 設計原則テンプレート
2. **COMPONENT_REGISTRY_TEMPLATE.md**: コンポーネントレジストリテンプレート
3. **AI_INSTRUCTIONS_TEMPLATE.md**: AI実装ガイドラインテンプレート

---

## 使用方法

### 1. テンプレートをコピー

新しいプロジェクトを開始する際、以下のテンプレートをコピーします:

```bash
# プロジェクトルートに DESIGN_PRINCIPLES.md をコピー
cp docs/templates/DESIGN_PRINCIPLES_TEMPLATE.md DESIGN_PRINCIPLES.md

# docs/ ディレクトリに COMPONENT_REGISTRY.md をコピー
cp docs/templates/COMPONENT_REGISTRY_TEMPLATE.md docs/COMPONENT_REGISTRY.md

# docs/ ディレクトリに AI_INSTRUCTIONS.md をコピー
cp docs/templates/AI_INSTRUCTIONS_TEMPLATE.md docs/AI_INSTRUCTIONS.md
```

---

### 2. プロジェクト固有の情報を記入

各ファイルの `[...]` で囲まれた部分を、プロジェクト固有の情報に置き換えます。

#### DESIGN_PRINCIPLES.md

- `[機能名]` → 例: ログイン、検索、フィルタ
- `[ComponentName]` → 例: LoginModal、SearchBar、FilterPanel
- `[使用箇所]` → 例: ホーム、チャレンジ、マイページ
- `[禁止事項]` → プロジェクト固有の禁止事項

#### COMPONENT_REGISTRY.md

- `[カテゴリ]` → 例: 認証関連、UI部品、レイアウト
- `[ComponentName]` → 例: LoginModal、Button、Card
- `[使用箇所]` → 例: ホーム、チャレンジ、マイページ
- `[prop1の説明]` → Props の説明

#### AI_INSTRUCTIONS.md

- `/path/to/project` → 実際のプロジェクトパス
- `[機能名]` → 例: ログイン、検索、フィルタ
- `[ComponentName]` → 例: LoginModal、SearchBar、FilterPanel
- `[スタイリング方法]` → 例: Tailwind CSS、CSS Modules、styled-components

---

### 3. AIに参照させる

AI実装時に、これらのファイルを参照するように指示します。

#### 例: Manusでの指示

```
新しい機能を実装する前に、以下のファイルを必ず読んでください:
1. DESIGN_PRINCIPLES.md
2. docs/COMPONENT_REGISTRY.md
3. docs/AI_INSTRUCTIONS.md
```

#### 例: ChatGPTでの指示

```
プロジェクトルートに DESIGN_PRINCIPLES.md があります。
実装を開始する前に、このファイルを読んで、設計原則に従ってください。
```

---

## 効果

これらのファイルを使用することで、以下の効果が期待できます:

### 1. 重複実装の防止（70-80%）

- AIが既存のコンポーネントを検索・再利用するようになる
- 同じ機能を持つコンポーネントが複数作成されるのを防ぐ

### 2. 設計原則の遵守

- AIが設計原則に従って実装するようになる
- 一貫性のあるコードベースを維持できる

### 3. コードの品質向上

- コンポーネントの独立性が高まる
- 依存関係が整理される
- 保守性が向上する

---

## 効果を最大化するためのヒント

### 1. ユーザー側の指示を明確にする

❌ 悪い例:
```
ログイン機能を追加して
```

✅ 良い例:
```
ログイン機能を追加して。
ただし、既存の LoginModal コンポーネント（components/common/LoginModal.tsx）を使用すること。
新しいログインUIを作成しないこと。
```

---

### 2. 定期的なコードレビュー

AIに以下のタスクを定期的に実行させる:

```
DESIGN_PRINCIPLES.md に違反している実装がないか、プロジェクト全体をチェックして
```

---

### 3. チェックポイント前の自動チェック

チェックポイントを作成する前に、AIに以下を確認させる:

```
1. DESIGN_PRINCIPLES.md に違反していないか？
2. COMPONENT_REGISTRY.md は最新か？
3. 重複実装はないか？
```

---

## カスタマイズ例

### 例1: React Webアプリケーション

```markdown
# DESIGN_PRINCIPLES.md

## 1. UI/UXの一貫性

### 1.1 ログイン機能

**ログインUIは1種類のみ使用すること。**

- **使用するコンポーネント**: `components/common/LoginModal.tsx`
- **使用箇所**: ホーム、ダッシュボード、設定
- **禁止事項**:
  - 青いバナーなど、別のログインUIを作成しない
  - ログイン機能を複数の場所で重複実装しない
```

---

### 例2: React Native モバイルアプリ

```markdown
# DESIGN_PRINCIPLES.md

## 1. UI/UXの一貫性

### 1.1 ログイン機能

**ログインUIは1種類のみ使用すること。**

- **使用するコンポーネント**: `components/common/LoginModal.tsx`
- **使用箇所**: ホーム、チャレンジ、マイページ
- **禁止事項**:
  - 青いバナーなど、別のログインUIを作成しない
  - ログイン機能を複数の場所で重複実装しない

### 1.2 スタイリング

**Tailwind CSS（NativeWind）を使用すること。**

- **グローバルスタイルに依存しない**: `styles.ts` などのグローバルスタイルに依存しない
- **インラインスタイルを避ける**: 可能な限り Tailwind CSS を使用
```

---

## よくある質問

### Q1: これらのファイルを作成すれば、100%重複実装を防げますか？

**A1**: いいえ、100%は防げません。しかし、70-80%の確率で重複実装を防ぐことができます。ユーザー側の明確な指示と組み合わせれば、90%以上に近づきます。

---

### Q2: AIが必ずこれらのファイルを読みますか？

**A2**: いいえ、AIが「必要だと判断したとき」にファイルを読みます。ユーザー側から「DESIGN_PRINCIPLES.md を読んでください」と明示的に指示することで、読む確率が高まります。

---

### Q3: どのくらいの頻度で更新すべきですか？

**A3**: 新しいコンポーネントを作成したとき、または新しい設計原則が必要になったときに更新してください。週に1回程度の定期的なチェックも推奨します。

---

## まとめ

これらのテンプレートを使用することで、AIによる重複実装を大幅に減らすことができます。プロジェクトの開始時に設定し、定期的に更新することで、一貫性のあるコードベースを維持できます。

---

**最終更新**: 2026-01-31
