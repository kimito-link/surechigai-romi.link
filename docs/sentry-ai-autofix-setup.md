# Sentry AI Autofix設定手順

## 概要
Sentry AI Autofixは、エラー発生時に自動的に原因を分析し、修正コードを含むPRを作成する機能です。

## 前提条件
- Sentryプロジェクトが既に設定されている
- GitHubリポジトリと連携している
- GitHub Copilotのサブスクリプション（推奨）

## 設定手順

### 1. Sentry GitHub Copilot Extensionをインストール

1. GitHub Marketplaceにアクセス
   - URL: https://github.com/marketplace/sentry

2. **Install**ボタンをクリック

3. インストール先を選択
   - 個人アカウントまたは組織を選択
   - リポジトリのアクセス権限を設定（All repositoriesまたは特定のリポジトリ）

4. **Install & Authorize**をクリック

### 2. Sentryダッシュボードで設定

1. Sentryダッシュボードにログイン
   - URL: https://sentry.io/

2. プロジェクトを選択
   - 左サイドバーから該当プロジェクトを選択

3. **Settings** → **Integrations** → **GitHub**に移動

4. **Configure**をクリック

5. リポジトリを連携
   - リポジトリ一覧から`birthday-celebration`を選択
   - **Save**をクリック

### 3. AI Autofixを有効化

1. **Settings** → **Features**に移動

2. **AI Autofix**セクションを探す

3. **Enable AI Autofix**トグルをONにする

4. 設定オプション:
   - **Auto-create PRs**: エラー発生時に自動的にPRを作成（推奨: ON）
   - **Auto-generate tests**: 修正コードと一緒にテストも生成（推奨: ON）
   - **Notification settings**: Slack通知を設定（オプション）

5. **Save Changes**をクリック

### 4. GitHub Copilot統合（オプション）

1. GitHub Copilot Chatを開く（VS Code、GitHub.com等）

2. コマンド入力:
   ```
   @sentry help
   ```

3. Sentryとの連携を確認
   - エラーの詳細を取得
   - 修正提案を受け取る
   - PRを作成

### 5. 動作確認

1. 意図的にエラーを発生させる（テスト環境）
   ```typescript
   // テスト用エラー
   throw new Error('Test error for Sentry AI Autofix');
   ```

2. Sentryダッシュボードでエラーを確認

3. AI Autofixが自動的に:
   - エラーを分析
   - 修正コードを生成
   - PRを作成

4. PRを確認
   - 修正コードの内容を確認
   - テストコードが生成されているか確認
   - マージまたは修正

## 期待される効果

1. **自動エラー分析**: エラー発生時に自動的に原因を分析
2. **自動修正PR作成**: 修正コードを含むPRを自動生成
3. **自動テスト生成**: 修正コードと一緒にテストも生成
4. **開発効率向上**: 手動デバッグの時間を大幅削減

## トラブルシューティング

### AI Autofixが動作しない

**原因1**: GitHub連携が正しく設定されていない
- **解決策**: Settings → Integrations → GitHubで連携を確認

**原因2**: AI Autofixが有効化されていない
- **解決策**: Settings → Features → AI Autofixを有効化

**原因3**: エラーが複雑すぎる
- **解決策**: エラーの詳細情報を追加（コンテキスト、スタックトレース等）

### PRが自動作成されない

**原因1**: Auto-create PRsがOFFになっている
- **解決策**: Settings → Features → AI Autofix → Auto-create PRsをON

**原因2**: GitHubのアクセス権限が不足
- **解決策**: GitHub Marketplaceで権限を再確認

## 参考URL

- Sentry AI Autofix公式ドキュメント: https://docs.sentry.io/product/issues/issue-details/ai-autofix/
- Sentry GitHub Copilot Extension: https://github.com/marketplace/sentry
- ブログ記事: https://blog.sentry.io/ai-powered-autofix-debugs-and-fixes-your-code-in-minutes/

## 次のステップ

1. ✅ Sentry GitHub Copilot Extensionをインストール
2. ✅ Sentryダッシュボードで設定
3. ✅ AI Autofixを有効化
4. ⏳ 動作確認（テストエラーを発生させる）
5. ⏳ 本番環境でのモニタリング開始
