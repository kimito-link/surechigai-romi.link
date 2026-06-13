# Railway デプロイ設定ガイド

このガイドでは、Railway環境でのデプロイ時自動マイグレーションと通知設定について説明します。

## 概要

v6.51で追加された機能により、以下が自動化されます。

| 機能 | 説明 | 実装ファイル |
|------|------|-------------|
| 自動マイグレーション | デプロイ時にDBスキーマを自動更新 | `scripts/migrate.ts` |
| スキーマ整合性チェック | コードとDBの不一致を検出 | `server/schema-check.ts` |
| 失敗通知 | マイグレーション失敗時にSlack/Discordへ通知 | 上記両ファイル |

## 1. Railwayビルドコマンドの設定

Railwayダッシュボードで以下の設定を行います。

### 手順

1. Railwayダッシュボードにログイン
2. プロジェクト → Settings → Build & Deploy を開く
3. **Build Command** を以下に変更:

```bash
pnpm install && pnpm db:migrate && pnpm build
```

### 動作の流れ

```
pnpm install      → 依存関係インストール
       ↓
pnpm db:migrate   → マイグレーション実行（失敗時はここで停止）
       ↓
pnpm build        → アプリケーションビルド
```

マイグレーションが失敗すると `exit 1` が返され、ビルドが中断されます。これにより、スキーマ不整合のままデプロイされることを防ぎます。

## 2. 環境変数の設定

Railwayダッシュボードの Variables セクションで以下を設定します。

### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | MySQL接続文字列 | `mysql://user:pass@host:3306/db` |

### オプション環境変数（推奨）

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `APP_VERSION` | アプリバージョン | `6.51` |
| `GIT_SHA` | Gitコミットハッシュ | `abc1234` |
| `BUILT_AT` | ビルド日時 | `2025-01-22T10:00:00Z` |
| `DEPLOY_WEBHOOK_URL` | 通知用Webhook URL | `https://discord.com/api/webhooks/...` |
| `APP_NAME` | アプリ名（通知に表示） | `動員ちゃれんじ` |
| `RAILWAY_ENVIRONMENT` | 環境名（通知に表示） | `production` |

### Railwayでの自動設定

Railwayは以下の変数を自動で設定します。

- `RAILWAY_ENVIRONMENT`: `production` または `staging`
- `RAILWAY_GIT_COMMIT_SHA`: Gitコミットハッシュ

これらを活用する場合、ビルドコマンドを以下のように変更できます。

```bash
GIT_SHA=$RAILWAY_GIT_COMMIT_SHA BUILT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ) pnpm install && pnpm db:migrate && pnpm build
```

## 3. 通知Webhook URLの取得

### Discord Webhookの場合

1. Discordサーバーの設定 → 連携サービス → Webhook を開く
2. 「新しいウェブフック」をクリック
3. 名前を設定（例: `Deploy Notifications`）
4. 「ウェブフックURLをコピー」をクリック
5. RailwayのVariablesに `DEPLOY_WEBHOOK_URL` として設定

### Slack Webhookの場合

1. [Slack API](https://api.slack.com/apps) にアクセス
2. アプリを作成 → Incoming Webhooks を有効化
3. 「Add New Webhook to Workspace」をクリック
4. 通知先チャンネルを選択
5. Webhook URLをコピー
6. RailwayのVariablesに `DEPLOY_WEBHOOK_URL` として設定

## 4. スキーマ整合性チェックの使い方

### 手動チェック

本番環境のスキーマ整合性を確認するには、以下のURLにアクセスします。

```
https://doin-challenge.com/api/health?schema=true
```

### レスポンス例（正常時）

```json
{
  "ok": true,
  "timestamp": 1705900000000,
  "version": "6.51",
  "gitSha": "abc1234",
  "builtAt": "2025-01-22T10:00:00Z",
  "nodeEnv": "production",
  "schema": {
    "status": "ok",
    "expectedVersion": "0023",
    "actualVersion": "abc12345",
    "missingColumns": [],
    "errors": [],
    "checkedAt": "2025-01-22T10:00:00.000Z"
  }
}
```

### レスポンス例（不整合時）

```json
{
  "ok": true,
  "schema": {
    "status": "mismatch",
    "expectedVersion": "0023",
    "missingColumns": [
      { "table": "participations", "column": "deletedAt" },
      { "table": "participations", "column": "deletedBy" }
    ],
    "errors": [],
    "checkedAt": "2025-01-22T10:00:00.000Z"
  }
}
```

## 5. トラブルシューティング

### マイグレーションが失敗する場合

1. Railwayのデプロイログを確認
2. `[migrate]` プレフィックスのログを探す
3. エラーメッセージに基づいて対処

**よくある原因:**
- `DATABASE_URL` が未設定または不正
- DBサーバーへの接続タイムアウト
- 既存データとの制約違反

### スキーマ不整合が検出された場合

1. `/api/health?schema=true` で不足カラムを確認
2. 該当するマイグレーションファイルを特定
3. 手動でSQLを実行するか、`pnpm db:migrate` を再実行

### 通知が届かない場合

1. `DEPLOY_WEBHOOK_URL` が正しく設定されているか確認
2. Webhook URLの有効期限が切れていないか確認
3. Railwayのログで `[migrate] Notification sent` を確認

## 6. 本番DBへの緊急マイグレーション

デプロイを待たずに本番DBにマイグレーションを適用する場合:

### 方法1: Railwayダッシュボードから実行

1. Railwayダッシュボード → Database → Query を開く
2. 該当するマイグレーションSQLを実行

### 方法2: ローカルから実行

```bash
# 本番DB接続文字列を設定
export DATABASE_URL="mysql://..."

# マイグレーション実行
pnpm db:migrate
```

## 7. ロールバック時の注意

アプリをロールバックする場合、DBスキーマは自動的には戻りません。

**推奨手順:**
1. アプリをロールバック
2. `/api/health?schema=true` でスキーマ状態を確認
3. 必要に応じて手動でカラムを削除（データ損失に注意）

**重要:** カラム削除は不可逆操作です。本番環境では十分なバックアップを取ってから実行してください。
