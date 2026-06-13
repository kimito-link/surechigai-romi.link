# diff機能による誤作動防止ワークフロー

## 目的

修正時に既存機能を壊さないようにするため、diff確認とテストを徹底する。

## ワークフロー

### 修正前

#### 1. 現在の動作を記録
- 修正対象以外の主要機能の動作を確認
- 必要に応じてスクリーンショットを保存
- 現在のコミットハッシュを記録

#### 2. 影響範囲を特定
- 修正するファイルをリストアップ
- 依存関係を確認（どのコンポーネントが影響を受けるか）
- 重要ファイル（Critical Files）に該当するか確認

#### 3. テスト計画を立てる
- 修正後にテストする機能をリストアップ
- `docs/critical-features-checklist.md`を参照

### 修正中

#### 4. 変更を最小限に
- 修正対象のファイルのみを変更
- 無関係なコードの整形やリファクタリングは別PRで行う
- コミットは小さく、意味のある単位で行う

#### 5. 定期的にdiffを確認
```bash
# 変更内容を確認
git diff

# 変更されたファイル一覧
git status

# 特定ファイルのdiff
git diff path/to/file.tsx
```

### 修正後

#### 6. diffを徹底確認
```bash
# 全体のdiff統計
git diff --stat

# 詳細なdiff
git diff

# 意図しない変更がないか確認
# - インデント変更のみ
# - 不要なインポート追加
# - コメントアウトされたコード
# - デバッグ用のconsole.log
```

#### 7. 型チェック・Lint
```bash
# TypeScript型チェック
pnpm run check

# ESLint
pnpm run lint
```

#### 8. 既存機能のテスト
`docs/critical-features-checklist.md`に従って、以下を確認：

- [ ] ログイン機能（カスタム認証画面）
- [ ] サムネイル表示
- [ ] お気に入り機能
- [ ] ホーム画面レイアウト
- [ ] マイページレイアウト

#### 9. PR作成
- PR作成時、GitHub Actionsが自動的にdiffチェックを実行
- 重要ファイルが変更された場合、警告コメントが自動投稿される
- diffサマリーを確認

### マージ前

#### 10. 最終確認
- [ ] 全てのCI/CDが成功
- [ ] レビュアーの承認
- [ ] 既存機能のテストが完了
- [ ] diffに意図しない変更がないことを確認

## 重要ファイル（Critical Files）

以下のファイルを変更する場合は特に注意：

### 認証関連
- `hooks/use-auth.ts`
- `components/organisms/login-prompt-modal.tsx`
- `app/oauth/**`
- `server/twitter-*.ts`

### 画像表示関連
- `components/molecules/colorful-challenge-card.tsx`
- `components/molecules/optimized-image.tsx`

### 主要画面
- `app/(tabs)/index.tsx` (ホーム画面)
- `app/(tabs)/mypage.tsx` (マイページ)
- `features/home/**`
- `features/mypage/**`

## トラブルシューティング

### 既存機能が壊れた場合

#### 1. 変更をrevert
```bash
# 最新のコミットをrevert
git revert HEAD

# 特定のコミットをrevert
git revert <commit-hash>
```

#### 2. diffを確認して原因特定
```bash
# 壊れる前のコミットと比較
git diff <good-commit> <bad-commit>

# 特定ファイルの変更履歴
git log -p path/to/file.tsx
```

#### 3. 修正して再テスト
- 原因を特定してから修正
- 小さな変更ごとにテスト
- diffを確認しながら進める

## ベストプラクティス

### ✅ 推奨

- 小さなコミット単位で作業
- diffを頻繁に確認
- 既存機能のテストを怠らない
- PR作成前に自分でレビュー
- 重要ファイルの変更は慎重に

### ❌ 避けるべき

- 複数の機能を1つのPRにまとめる
- diffを確認せずにコミット
- テストをスキップ
- 無関係なファイルの変更を含める
- 大規模なリファクタリングと機能追加を同時に行う

## GitHub Actions連携（Gate 1）

PRを `main` に作成すると、**Gate 1**（`.github/workflows/gate1.yml`）が自動実行されます。

1. **diff-check**（`scripts/diff-check.sh`）で変更ファイルを検出
2. 認証・Deploy・環境変数・DB・ヘルス・ルーティングなど「危険な変更」を検知
3. 検知した場合、PRに必須アクションのチェックリストをコメントで投稿
4. **危険な変更があるPRは Gate 1 で失敗し、マージできない**

ローカルで事前に確認するには：

```bash
# 現在のブランチの変更（直前コミット対比）をチェック
bash scripts/diff-check.sh

# main との差分をチェック（main を fetch 済みの場合）
bash scripts/diff-check.sh origin/main HEAD
```

実行すると、変更ファイル一覧と「どの領域に触ったか」のサマリーが表示されます。
