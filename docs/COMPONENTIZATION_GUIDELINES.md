# コンポーネント化・定数化のガイドライン

**最終更新**: 2026年1月31日

## 基本方針

「直書き0」を目標にするのではなく、**「変わるものだけをコンポーネント化/設定化」**を原則とします。

---

## 判断ルール（迷ったらこれ）

### ✅ 定数化すべきもの（複数箇所で使われる・変わりやすい）

1. **同じ文言が2回以上出る**
   - 例: 「参加表明」「ログイン」「Xでログイン」「キャンセル」「送信」
   - → `constants/copy/` に定義

2. **表示や仕様が変わりやすい**
   - 例: エラーメッセージ、ボタンラベル、バリデーション文言
   - → `constants/copy/` に定義

3. **共通の挙動（loading/error/empty）**
   - 例: 「読み込み中...」「エラーが発生しました」「データがありません」
   - → `constants/copy/common.ts` に定義

### ✅ コンポーネント化すべきもの（同じUIが2回以上）

1. **同じUIが2回以上出る**
   - 例: Button、Card、Modal、Table、FormInput
   - → `components/ui/` または `components/molecules/` に配置

2. **共通の挙動（バリデーション、エラーハンドリング）**
   - 例: フォームバリデーション、エラー表示、ローディング状態
   - → 共通コンポーネント or 共通hook

3. **表示ルールがあるもの**
   - 例: ステータス表示、通知バッジ、IP表示の強調
   - → ドメイン固有コンポーネント（`components/domain/`）

### ✅ 直書きでOKなもの（ページ固有・骨格）

1. **画面のレイアウト構造**
   - Grid/Stackの並び、ページ固有の配置
   - → そのまま直書き

2. **ページ固有のストーリー**
   - そのページでしか成立しない長文、キャッチコピー
   - → 直書きOK（ただし、変更頻度が高い場合は定数化を検討）

3. **1回しか出ない超固有UI**
   - 再利用予定がない、その画面だけの特殊なUI
   - → 直書きOK

---

## 実装例

### ✅ 良い例：複数箇所で使われる文言は定数化

```typescript
// constants/copy/event-detail.ts
export const eventDetailCopy = {
  actions: {
    participate: "参加表明する",
    cancel: "キャンセル",
  },
};

// 使用箇所1: features/event-detail/components/FormButtonsSection.tsx
<Button>{eventDetailCopy.actions.participate}</Button>

// 使用箇所2: features/events/components/participation-form/ParticipationForm.tsx
<Button>{eventDetailCopy.actions.participate}</Button>
```

### ✅ 良い例：ページ固有のストーリーは直書き

```typescript
// features/home/components/CatchCopySection.tsx
// このページでしか使われない長文は直書きでOK
<Text>
  あなたの「推し」が、大きなステージに立つ瞬間を想像してみて。
  客席を埋め尽くすファンの声援、リアルタイムで流れる応援コメント...
</Text>
```

### ❌ やりすぎ例：すべてを定数化

```typescript
// これはやりすぎ（1回しか使わない長文を細かく分割）
export const homeCopy = {
  catchCopy: {
    scene: {
      line1: "客席を埋め尽くすファンの声援、",
      line2: "リアルタイムで流れる応援コメント、",
      line3: "ステージを照らすスポットライト…",
    },
  },
};
```

---

## ディレクトリ構造（推奨）

```
constants/
├── copy/              # 文言定数（複数箇所で使われるもの）
│   ├── common.ts       # 共通文言（ボタン、エラー、ローディング）
│   ├── event-detail.ts # イベント詳細画面の文言
│   ├── auth.ts         # 認証まわりの文言
│   └── index.ts
├── config/             # 設定値（URL、タイムアウト、閾値）
│   ├── api.ts          # API設定
│   └── features.ts     # 機能フラグ
└── ...

components/
├── ui/                 # 基本UI部品（Button、Input、Card）
├── molecules/          # 複合コンポーネント（Form、Modal）
├── domain/             # ドメイン固有コンポーネント（IPカード、ジョブ実行パネル）
└── ...

features/
└── [feature-name]/
    ├── components/     # その機能固有のコンポーネント
    └── hooks/          # その機能固有のhooks
```

---

## チェックリスト（実装前に確認）

- [ ] この文言/UIは2回以上使われますか？
  - Yes → 定数化/コンポーネント化を検討
  - No → 直書きでOK（ただし、変更頻度が高い場合は定数化を検討）

- [ ] この文言/UIは変更されやすいですか？
  - Yes → 定数化/設定化を検討
  - No → 直書きでOK

- [ ] この文言/UIはページ固有のストーリーですか？
  - Yes → 直書きでOK
  - No → 定数化/コンポーネント化を検討

---

## 現在の実装状況

### ✅ 実装済み（適切）

- `constants/copy/event-detail.ts` - 複数箇所で使われる「参加表明」「ログイン」などの文言
- `constants/copy/common.ts` - 共通のボタン、エラー、ローディング文言
- `constants/copy/auth.ts` - 認証まわりの文言

### ⚠️ 見直し推奨

- `constants/copy/home.ts` - CatchCopySectionの長文は、このページでしか使われないため、直書きに戻すか、定数化を緩めることを検討

---

## 参考

- [Atomic Design](https://atomicdesign.bradfrost.com/) - コンポーネント設計の原則
- [Feature-Sliced Design](https://feature-sliced.design/) - 機能単位での分割
