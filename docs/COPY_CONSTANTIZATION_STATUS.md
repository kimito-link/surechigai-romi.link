# 文言定数化の適用状況

**最終更新**: 2026年1月31日

## 適用済みコンポーネント ✅

### イベント詳細・参加表明関連

1. **`features/event-detail/components/ParticipationFormSection.tsx`**
   - ✅ 「参加表明」セクションヘッダー

2. **`features/event-detail/components/FormButtonsSection.tsx`**
   - ✅ 「キャンセル」「参加表明する」「都道府県を選択してください」

3. **`features/event-detail/components/form-inputs/UserInfoSection.tsx`**
   - ✅ 「参加者」「ログインが必要です」「Xでログイン」

4. **`features/events/components/participation-form/ParticipationForm.tsx`**
   - ✅ 「参加表明する」「参加表明するにはログインが必要です」
   - ✅ 「参加表明済みです」「参加表明を編集」
   - ✅ 「送信中...」「更新する」
   - ✅ 「会場参加」「配信視聴」「両方」

5. **`features/events/components/ConfirmationModal.tsx`**
   - ✅ 「参加表明の確認」「参加表明する」「送信中...」

6. **`features/events/components/MessagesSection.tsx`**
   - ✅ 「参加表明完了！」「あなたの応援メッセージが反映されました」

7. **`features/events/components/ParticipationSuccessModal.tsx`**
   - ✅ 「参加表明完了！」

### 認証・ログイン関連

8. **`features/mypage/components/login-screen/LoginButton.tsx`**
   - ✅ 「Xでログインする」「ログイン中...」

9. **`features/mypage/components/login-screen/LoginMessageCard.tsx`**
   - ✅ 「Xでログイン」「ログイン中...」

10. **`features/create/ui/components/create-challenge-form/TwitterLoginSection.tsx`**
    - ✅ 「Xでログインして作成」

### ホーム画面関連

11. **`features/home/components/EngagementSection.tsx`**
    - ✅ 「総参加表明」「人が参加表明中」

12. **`features/home/components/FeatureListSection.tsx`**
    - ✅ 「参加表明で応援メッセージを送れる」

---

## 定数化していないもの（意図的）✅

以下の文言は、**ページ固有のストーリー**または**1回しか使われない文言**のため、直書きのままです。

### ページ固有のストーリー（直書きでOK）

- `features/home/components/CatchCopySection.tsx` - ホーム画面のキャッチコピー（長文）
- `features/home/components/ExperienceBanner.tsx` - 体験バナーの文言

### コメント・テストファイル

- コメント内の文言（例: `// 参加表明フォーム全体`）
- テストファイル内の文言

### エラーメッセージ・アラート

- `features/events/hooks/useEventDetailScreen.ts` - Alert.alert のメッセージ
- `features/event-detail/hooks/useParticipationForm.ts` - エラーメッセージ

**理由**: エラーメッセージは文脈に応じて動的に生成されることが多く、定数化すると逆に複雑になる場合があるため。

---

## 定数ファイル構成

```
constants/copy/
├── home.ts          # ホーム画面の文言（複数箇所で使われるもののみ）
├── event-detail.ts  # イベント詳細・参加表明関連の文言
├── auth.ts          # 認証・ログイン関連の文言
├── common.ts        # 共通の文言（ボタン、エラー、ローディング）
└── index.ts         # エクスポート
```

---

## 適用状況のまとめ

### ✅ 適用済み（主要コンポーネント）

- 参加表明フォーム関連: **7ファイル**
- 認証・ログイン関連: **3ファイル**
- ホーム画面関連: **2ファイル**

**合計: 12ファイル**

### 📝 適用対象外（意図的）

- ページ固有のストーリー: 直書きでOK
- コメント・テストファイル: 定数化不要
- 動的エラーメッセージ: 文脈依存のため定数化しない

---

## 今後の方針

### 追加で定数化を検討する場合

1. **エラーメッセージの定数化**
   - 頻繁に使われるエラーメッセージのみ定数化
   - 例: `commonCopy.errors.network`, `commonCopy.errors.unauthorized`

2. **アラートメッセージの定数化**
   - 確認ダイアログのメッセージを定数化
   - 例: `commonCopy.confirmations.delete`

### 定数化しないもの

- ページ固有のストーリー（長文のキャッチコピーなど）
- 1回しか使われない文言
- コメント内の文言
- テストファイル内の文言

---

## 参考

- `docs/COMPONENTIZATION_GUIDELINES.md` - 定数化の判断基準
- `constants/copy/` - 定数ファイルの実装
