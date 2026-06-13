## 変更概要
（1変更 = 1目的 で簡潔に）

## Gate 1（壊れない運用）チェック

- [ ] このPRは「1変更=1commit / 1目的=1PR」になっている
- [ ] Diff-check: CIで pass（Gate1 Diff Check）
- [ ] 危険ファイルに触れていない（oauth / vercel.json / deploy workflow など）
- [ ] もし触れた場合：理由・影響範囲・ロールバック手順を本文に明記した
- [ ] 本番照合: `/api/health` の commitSha がこのPRのmerge後SHAになる（deploy-verifyが pass）

### 確認結果（貼る）
- `/api/health` レスポンス（commitShaが見える状態）:


## 影響範囲
- [ ] 認証 / OAuth
- [ ] API
- [ ] DB
- [ ] UI表示のみ
- [ ] 文言のみ

## 手動1分チェック（必須）
- [ ] ログインできる
- [ ] ホーム表示OK
- [ ] 詳細表示OK
- [ ] 参加表明OK
- [ ] メッセージ投稿OK
- [ ] /api/health の version が更新されている

## diff-check
- [ ] 危険ファイルを触っていない
- [ ] 禁止ワードを使っていない

## レスポンシブ
- [ ] モバイル
- [ ] タブレット
- [ ] デスクトップ
