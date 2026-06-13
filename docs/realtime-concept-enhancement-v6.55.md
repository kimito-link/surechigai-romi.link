# リアルタイム動員コンセプトのビジュアル強化 v6.55

## 修正日時
2026-01-26

## コンセプト強化の方針
**リアルタイム動員** = その瞬間に同じ体験を共有する
- 会場で一緒に見る（物理的なリアルタイム）
- 配信で一緒に見る（オンラインのリアルタイム）
- 「同じ時間を共有する」という価値を全面に押し出す

---

## 修正内容

### 1. 参加フォーム (`features/events/components/participation-form/ParticipationForm.tsx`)

#### Line 136-141: ラベルとヒントの追加
```tsx
// 修正前
<Text style={[styles.inputLabel, { color: colors.foreground }]}>
  参加方法
</Text>

// 修正後
<Text style={[styles.inputLabel, { color: colors.foreground }]}>
  リアルタイム参加方法
</Text>
<Text style={[styles.inputHint, { color: colors.muted }]}>
  同じ時間を共有する仲間を募集中
</Text>
```

**効果：**
- 「参加方法」→「リアルタイム参加方法」で、リアルタイム性を明示
- 「同じ時間を共有する仲間を募集中」で、コンセプトを直接的に伝達

---

### 2. 参加フォームスタイル (`features/events/components/participation-form/ParticipationForm.styles.ts`)

#### Line 124-132: inputHintスタイルの追加
```typescript
// 修正前
inputLabel: {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 8,
},

// 修正後
inputLabel: {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 4,
},
inputHint: {
  fontSize: 12,
  marginBottom: 8,
},
```

**効果：**
- ヒントテキスト用のスタイルを追加
- ラベルとヒントの間隔を調整

---

### 3. イベント詳細画面 (`app/event/[id].tsx`)

#### Line 314: りんく吹き出しのメッセージ
```tsx
// 修正前
message={`あなたは${participationForm.participantNumber}人目の参加表明だよ！\nみんなで盛り上げよう！`}

// 修正後
message={`あなたは${participationForm.participantNumber}人目の参加表明だよ！\n同じ時間を共有する仲間が増えてるね♪`}
```

**効果：**
- 「みんなで盛り上げよう！」→「同じ時間を共有する仲間が増えてるね♪」
- リアルタイム性と共有の価値を強調

---

### 4. シェア促進モーダル (`components/molecules/share-prompt-modal.tsx`)

#### Line 262-267: メッセージの変更
```tsx
// 修正前
<Text style={styles.message}>
  仲間を増やして目標達成を目指そう！
</Text>
<Text style={styles.subMessage}>
  シェアで参加予定者が増えると達成率がアップ
</Text>

// 修正後
<Text style={styles.message}>
  同じ時間を共有する仲間を増やそう！
</Text>
<Text style={styles.subMessage}>
  リアルタイムで一緒に盛り上がる仲間を募集中
</Text>
```

**効果：**
- 「仲間を増やして目標達成」→「同じ時間を共有する仲間を増やそう」
- 「達成率がアップ」→「リアルタイムで一緒に盛り上がる仲間を募集中」
- 目標達成ではなく、共有体験の価値を強調

---

### 5. チャレンジ作成モーダル (`components/molecules/challenge-created-modal.tsx`)

#### Line 134: チェックリストの説明文
```tsx
// 修正前
description: "フォロワーに参加を呼びかけよう",

// 修正後
description: "同じ時間を共有する仲間を募集",
```

**効果：**
- 「フォロワーに参加を呼びかけよう」→「同じ時間を共有する仲間を募集」
- 一方的な呼びかけではなく、共有体験の価値を伝達

---

## 修正サマリー

| ファイル | 修正箇所 | 修正内容 |
|---------|---------|---------|
| `features/events/components/participation-form/ParticipationForm.tsx` | 1箇所 | 「リアルタイム参加方法」ラベル＋ヒント追加 |
| `features/events/components/participation-form/ParticipationForm.styles.ts` | 1箇所 | `inputHint`スタイル追加 |
| `app/event/[id].tsx` | 1箇所 | りんく吹き出し「同じ時間を共有する仲間が増えてるね♪」 |
| `components/molecules/share-prompt-modal.tsx` | 2箇所 | メッセージを「同じ時間を共有」「リアルタイムで一緒に盛り上がる」に変更 |
| `components/molecules/challenge-created-modal.tsx` | 1箇所 | チェックリスト説明「同じ時間を共有する仲間を募集」 |

**合計：** 5ファイル、6箇所の修正

---

## メッセージング戦略

### Before（v6.54以前）
- 「参加者を集める」
- 「目標達成を目指そう」
- 「達成率がアップ」
- 「みんなで盛り上げよう」

### After（v6.55）
- 「同じ時間を共有する仲間を募集」
- 「リアルタイムで一緒に盛り上がる」
- 「リアルタイム参加方法」
- 「同じ時間を共有する仲間が増えてるね♪」

**変化：**
- 集客・達成から、共有体験の価値へシフト
- リアルタイム性を全面に押し出す
- 一方的な呼びかけではなく、共有の価値を伝達

---

## 次のステップ

1. ✅ リアルタイムコンセプトのメッセージング強化完了
2. ⏳ コミット・プッシュ
3. ⏳ Vercelデプロイ確認
4. ⏳ 弁護士面談用の資料準備（必要に応じて）

---

## 備考

- v6.54の文言修正（参加者→参加予定者）と組み合わせることで、一貫したメッセージングを実現
- 誇張表現を避けつつ、リアルタイム性という明確な価値を提示
- 法務的に安全なトンマナを維持しながら、コンセプトを強化
