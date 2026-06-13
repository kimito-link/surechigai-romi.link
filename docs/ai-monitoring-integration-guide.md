# AI × E2Eテスト・監視システム統合ガイド

## 概要
このガイドでは、四六時中AIがサービスをテスト・バグ検知・自動修正・セキュリティ監視を行う仕組みの統合方法を説明します。

## システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                    AI監視システム全体図                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Cloudflare  │────▶│   Railway    │────▶│   Database   │
│  (CDN/WAF)   │     │   (Server)   │     │  (MySQL)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Rate Limiting│     │    Sentry    │     │  Playwright  │
│ DDoS防御     │     │  AI Autofix  │     │  E2Eテスト   │
│ Bot検知      │     │  エラー監視  │     │  (6時間ごと) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │    Slack     │
                      │   通知統合   │
                      └──────────────┘
```

## 導入済みコンポーネント

### 1. GitHub Dependabot ✅
**機能**: 依存関係の脆弱性を自動検知・PR作成

**設定ファイル**: `.github/dependabot.yml`

**動作**:
- 週次で依存関係をチェック
- 脆弱性を発見したら自動的にPR作成
- セキュリティアップデートを見逃さない

**確認方法**:
```bash
# GitHubリポジトリで確認
# Security → Dependabot → Dependabot alerts
```

### 2. GitHub CodeQL ✅
**機能**: コードの脆弱性を自動検知

**設定ファイル**: `.github/workflows/codeql.yml`

**動作**:
- 週次でコードをスキャン
- SQLインジェクション、XSS等を検出
- PR時にも自動スキャン

**確認方法**:
```bash
# GitHubリポジトリで確認
# Security → Code scanning → CodeQL
```

### 3. E2E継続監視 ✅
**機能**: 6時間ごとに自動E2Eテスト実行

**設定ファイル**: `.github/workflows/e2e-continuous-monitoring.yml`

**動作**:
- 0:00, 6:00, 12:00, 18:00 (UTC)に自動実行
- 本番環境をテスト
- 失敗時にSlack通知（設定後）

**確認方法**:
```bash
# GitHubリポジトリで確認
# Actions → E2E Continuous Monitoring
```

### 4. Rate Limiter ✅
**機能**: アプリケーションレベルのRate limiting

**設定ファイル**: `server/_core/rate-limiter.ts`

**動作**:
- `/api/auth`: 5リクエスト/分
- `/api/trpc`: 10リクエスト/10秒
- その他: 100リクエスト/分
- 超過時に429エラーを返す

**確認方法**:
```bash
# ローカルでテスト
for i in {1..15}; do
  curl -I http://localhost:3000/api/health
  sleep 0.5
done
```

## 次のステップ（ユーザー設定が必要）

### 5. Sentry AI Autofix ⏳
**機能**: エラー自動検知・修正PR作成

**設定手順**: `docs/sentry-ai-autofix-setup.md`参照

**必要な作業**:
1. GitHub MarketplaceでSentry Copilot Extensionをインストール
2. Sentryダッシュボードで設定
3. AI Autofixを有効化

**期待される効果**:
- エラー発生時に自動分析
- 修正コードを含むPRを自動作成
- ユニットテストも自動生成

### 6. Cloudflare ⏳
**機能**: DDoS防御、Rate limiting、Bot検知

**設定手順**: `docs/cloudflare-setup.md`参照

**必要な作業**:
1. Cloudflareアカウント作成
2. ドメインを追加
3. ネームサーバーを変更
4. Rate Limiting Rules設定

**期待される効果**:
- DDoS攻撃を自動防御
- 不正アクセスを自動ブロック
- Bot攻撃を自動検知・ブロック

### 7. Slack通知統合 ⏳
**機能**: すべてのアラートをSlackに集約

**設定手順**:

1. Slack Incoming Webhookを作成
   - Slackワークスペースにログイン
   - https://api.slack.com/apps にアクセス
   - **Create New App** → **From scratch**
   - アプリ名を入力（例: `AI Monitoring Bot`）
   - ワークスペースを選択
   - **Incoming Webhooks** → **Activate Incoming Webhooks** → **On**
   - **Add New Webhook to Workspace**
   - 通知先チャンネルを選択（例: `#alerts`）
   - Webhook URLをコピー

2. GitHubシークレットに追加
   - GitHubリポジトリ → **Settings** → **Secrets and variables** → **Actions**
   - **New repository secret**をクリック
   - Name: `SLACK_WEBHOOK_URL`
   - Value: コピーしたWebhook URL
   - **Add secret**をクリック

3. 動作確認
   - E2Eテストを手動実行（失敗させる）
   - Slackに通知が届くことを確認

**期待される効果**:
- すべてのアラートをSlackで一元管理
- リアルタイム通知
- チーム全体で状況共有

## 統合テスト

### テスト1: Rate Limiting

```bash
# APIエンドポイントに大量リクエスト
for i in {1..15}; do
  curl -I https://doin-challenge.com/api/health
  sleep 0.5
done

# 期待結果: 10リクエスト後に429エラー
```

### テスト2: E2E継続監視

```bash
# GitHub Actionsで手動実行
# Actions → E2E Continuous Monitoring → Run workflow

# 期待結果: テストが実行され、結果がArtifactsに保存される
```

### テスト3: Sentry AI Autofix

```typescript
// 意図的にエラーを発生させる
throw new Error('Test error for Sentry AI Autofix');

// 期待結果:
// 1. Sentryにエラーが記録される
// 2. AI Autofixが自動分析
// 3. 修正PRが自動作成される
```

### テスト4: Cloudflare Rate Limiting

```bash
# Cloudflare経由で大量リクエスト
for i in {1..150}; do
  curl -I https://doin-challenge.com/
  sleep 0.1
done

# 期待結果: 100リクエスト後にCloudflareがブロック
```

## モニタリングダッシュボード

### 1. GitHub Actions
- URL: https://github.com/your-org/birthday-celebration/actions
- 確認項目:
  - E2E Continuous Monitoring の実行状況
  - CodeQL の実行状況
  - Dependabot の PR状況

### 2. Sentry
- URL: https://sentry.io/
- 確認項目:
  - エラー発生状況
  - AI Autofix の動作状況
  - パフォーマンス指標

### 3. Cloudflare
- URL: https://dash.cloudflare.com/
- 確認項目:
  - トラフィック状況
  - Rate Limiting の動作状況
  - DDoS攻撃の検知状況

### 4. Slack
- チャンネル: `#alerts`
- 確認項目:
  - E2Eテスト失敗通知
  - Sentryエラー通知
  - Cloudflareアラート

## トラブルシューティング

### E2Eテストが失敗する

**原因1**: 本番環境がダウンしている
- **解決策**: `/api/health`にアクセスして確認

**原因2**: テストシナリオが古い
- **解決策**: `tests/e2e/`のテストを更新

**原因3**: 環境変数が設定されていない
- **解決策**: GitHubシークレットを確認

### Rate Limitingが動作しない

**原因1**: ミドルウェアが正しく統合されていない
- **解決策**: `server/_core/index.ts`を確認

**原因2**: IPアドレスが取得できない
- **解決策**: `req.ip`または`req.headers['x-forwarded-for']`を確認

### Slack通知が届かない

**原因1**: Webhook URLが間違っている
- **解決策**: GitHubシークレットを再確認

**原因2**: ワークフローが失敗していない
- **解決策**: 意図的にテストを失敗させて確認

## コスト見積もり

| サービス | 月額コスト | 備考 |
|---------|-----------|------|
| GitHub Dependabot | 無料 | 既存プラン |
| GitHub CodeQL | 無料 | 既存プラン |
| Sentry AI Autofix | 無料〜$26 | 既存プラン拡張 |
| Cloudflare | 無料 | 無料プラン |
| Playwright | 無料 | オープンソース |
| Slack | 無料 | 無料プラン |
| **合計** | **$0〜$26** | |

## 期待される効果

1. **24時間365日監視**: AIが常にサービスを監視
2. **自動バグ検知**: エラー発生時に即座に検知
3. **自動修正**: 修正PRを自動作成
4. **セキュリティ強化**: 不正アクセスを自動ブロック
5. **開発効率向上**: 手動テストの時間を大幅削減
6. **安心感**: 常に監視されているという安心感

## 次のアクション

### 即座に実行可能（設定済み）
- [x] GitHub Dependabot
- [x] GitHub CodeQL
- [x] E2E継続監視
- [x] Rate Limiter

### ユーザー設定が必要
- [ ] Sentry AI Autofix（`docs/sentry-ai-autofix-setup.md`参照）
- [ ] Cloudflare（`docs/cloudflare-setup.md`参照）
- [ ] Slack通知統合（上記参照）

### 中期導入（1ヶ月以内）
- [ ] Autify または mabl 無料トライアル（`docs/ai-e2e-testing-research.md`参照）
- [ ] 主要ユーザーフローのテストシナリオ作成
- [ ] 継続的モニタリング設定（1時間ごと）

## 参考ドキュメント

- [AI E2Eテストサービス調査レポート](./ai-e2e-testing-research.md)
- [AI監視システム導入計画](./ai-monitoring-implementation-plan.md)
- [Sentry AI Autofix設定手順](./sentry-ai-autofix-setup.md)
- [Cloudflare設定手順](./cloudflare-setup.md)

## サポート

質問や問題がある場合は、以下のチャンネルで相談してください:
- GitHub Issues: https://github.com/your-org/birthday-celebration/issues
- Slack: `#dev-support`
