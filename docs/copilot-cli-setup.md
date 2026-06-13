# GitHub Copilot CLI 導入ガイド

Phase 2実装の品質向上のため、GitHub Copilot CLIを導入しました。

---

## 📋 概要

GitHub Copilot CLIは、コマンドラインからGitHub Copilotを使用できるツールです。

**Phase 2での活用目的**:
- OAuth破壊のような致命的ミスを事前検知
- FSM状態遷移の論理エラーを早期発見
- コードの可読性・保守性向上

**コスト**:
- gpt-5.2-codex xhighで1回4円
- GitHub Copilot契約があれば追加コストなし

---

## 🚀 セットアップ

### 1. GitHub CLIのインストール

```bash
# 既にインストール済み（sandbox環境）
gh --version
# gh version 2.81.0 (2025-10-01)
```

### 2. GitHub Copilot CLI拡張のインストール

```bash
gh extension install github/gh-copilot
```

### 3. 動作確認

```bash
gh copilot --version
# version 1.2.0 (2025-10-30)
```

---

## 📖 使い方

### Phase 2簡易レビュー（推奨）

```bash
./scripts/phase2-quick-review.sh
```

**機能**:
- 変更されたファイルを自動検出
- NG集チェック（触ってはいけないファイル）
- 禁止ワードチェック
- Copilot CLIによる差分説明

**実行タイミング**:
- PR作成前
- コミット前
- 実装完了後

---

### Phase 2詳細レビュー（オプション）

```bash
./scripts/phase2-review.sh
```

**機能**:
- Phase 2実装ガイドを読み込んでレビュー
- FSM状態遷移の妥当性チェック
- login()の扱いチェック
- レスポンシブデザインチェック

**実行タイミング**:
- 複雑な実装の後
- レビュー依頼前
- 不安な実装がある場合

---

## 🎯 レビュー項目

### 1. NG集（触ってはいけないファイル）

- `app/oauth/**`
- `server/twitter*`
- `hooks/use-auth.ts`
- `lib/auth-provider.tsx`

### 2. 禁止ワード

- `callback`
- `oauth`
- `pkce`
- `code_verifier`
- `redirect_uri`
- `state=`
- `token`
- `twitter-callback`

### 3. FSM状態遷移の妥当性

- idle → confirm → redirecting → waitingReturn → success/cancel/error
- 不正な状態遷移がないか
- 状態管理がFSM以外で分岐していないか

### 4. login()の扱い

- login()は黒箱として扱っているか
- 成否はAuth Contextが管理しているか
- UIは状態に追従するだけか

### 5. レスポンシブデザイン

- 375px（モバイル）で正しく表示されるか
- 768px（タブレット）で正しく表示されるか
- 1024px以上（デスクトップ）で正しく表示されるか

---

## 📋 ワークフロー

### PR作成前のチェックリスト

1. **ユニットテスト実行**
   ```bash
   pnpm test
   ```

2. **Copilot CLI簡易レビュー**
   ```bash
   ./scripts/phase2-quick-review.sh
   ```

3. **diff-check CI確認**
   - GitHub Actionsで自動実行
   - 危険ファイル/禁止ワードチェック

4. **手動1分儀式**
   - アプリ起動→ログイン→戻る→結果確認

5. **レスポンシブチェック**
   - 3サイズでスクリーンショット

---

## 🔧 トラブルシューティング

### Copilot CLIが動作しない

```bash
# 拡張を再インストール
gh extension remove github/gh-copilot
gh extension install github/gh-copilot
```

### 認証エラー

```bash
# GitHub CLIで再認証
gh auth login
```

### レビュー結果が表示されない

```bash
# 差分があるか確認
git diff --name-only main

# 差分がない場合は何も表示されない
```

---

## 📚 参考リンク

- [GitHub Copilot CLI公式ドキュメント](https://docs.github.com/en/copilot/github-copilot-in-the-cli)
- [Phase 2実装ガイド](./phase2-implementation-guide.md)
- [PRテンプレート](./.github/PULL_REQUEST_TEMPLATE/phase2_pr_template.md)

---

## 🎉 期待される効果

- **OAuth破壊のような致命的ミスを防止**
- **FSM状態遷移の論理エラーを早期発見**
- **コードの可読性・保守性向上**
- **レビュー時間の短縮**
- **品質の均一化**
