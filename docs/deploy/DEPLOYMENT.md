# デプロイメントガイド

**プロジェクト名**: 動員チャレンジ（Doin Challenge）  
**バージョン**: 6.144  
**最終更新**: 2026年1月29日  
**作成者**: Manus AI

---

## 概要

本ドキュメントは「動員チャレンジ」アプリケーションのデプロイメント環境、CI/CDパイプライン、環境変数の設定方法を記述したものです。本番環境へのデプロイ手順と、トラブルシューティングの方法を提供します。

---

## デプロイメント環境

本アプリケーションは、以下の2つのプラットフォームにデプロイされています。

| 環境 | プラットフォーム | URL | 役割 |
|------|----------------|-----|------|
| **バックエンド** | Railway | https://doin-challenge.com/api | Express + tRPC + PostgreSQL |
| **フロントエンド** | Vercel | https://doin-challenge.com | 静的ファイル配信（HTML/CSS/JS） |

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                      (main branch)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ git push
                           │
              ┌────────────▼────────────┐
              │   GitHub Actions        │
              │  (CI/CD Pipeline)       │
              │                         │
              │  1. Checkout code       │
              │  2. Install deps        │
              │  3. Generate build-info │
              │  4. Deploy to platforms │
              └────────┬────────┬───────┘
                       │        │
         ┌─────────────┘        └─────────────┐
         │                                    │
         │ deploy                             │ deploy
         │                                    │
┌────────▼────────┐                  ┌────────▼────────┐
│     Railway     │                  │     Vercel      │
│  (Backend API)  │                  │   (Frontend)    │
├─────────────────┤                  ├─────────────────┤
│ • Express       │◄─────────────────┤ • Static Files  │
│ • tRPC          │      API Call    │ • Expo Web      │
│ • PostgreSQL    │                  │                 │
│ • WebSocket     │                  │                 │
└─────────────────┘                  └─────────────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│  doin-challenge │
│      .com       │
│  (Custom Domain)│
└─────────────────┘
```

---

## Railway（バックエンド）

### 概要

Railwayは、バックエンドAPIとPostgreSQLデータベースをホスティングしています。Node.js 22.xランタイムで動作し、自動スケーリングとゼロダウンタイムデプロイをサポートしています。

### デプロイ方法

Railwayは、GitHubリポジトリと連携して自動デプロイを行います。

**手動デプロイ手順**:

1. Railwayダッシュボードにログイン
2. プロジェクト「doin-challenge」を選択
3. 「Deployments」タブを開く
4. 「Redeploy」ボタンをクリック

**自動デプロイ**:

- `main`ブランチへのpushで自動的にデプロイが開始されます
- デプロイ時間: 約3〜5分

### ビルドコマンド

Railwayは、以下のカスタムビルドコマンドを使用しています。

```bash
set -eux && \
echo "PWD=$(pwd)" && \
ls -la && \
rm -rf server/_core/build-info.json dist/build-info.json && \
pnpm install && \
pnpm db:migrate && \
mkdir -p server/_core && \
COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "railway-$(date +%s)") && \
echo "{\"commitSha\":\"$COMMIT_SHA\",\"gitSha\":\"$COMMIT_SHA\",\"builtAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"version\":\"$COMMIT_SHA\",\"buildTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > server/_core/build-info.json && \
echo "=== build-info (server/_core) ===" && \
cat server/_core/build-info.json || true && \
pnpm build && \
echo "=== build-info (dist) ===" && \
cat dist/build-info.json || true
```

**ビルドプロセス**:

1. **依存関係のインストール**: `pnpm install`
2. **データベースマイグレーション**: `pnpm db:migrate`
3. **build-info.json生成**: Git commit SHAを取得してJSON生成
4. **アプリケーションビルド**: `pnpm build`（esbuildでバンドル）
5. **build-info.jsonコピー**: `dist/`ディレクトリにコピー

### スタートコマンド

```bash
NODE_ENV=production node dist/index.js
```

### 環境変数

Railwayには以下の環境変数を設定する必要があります。

| 環境変数 | 説明 | 例 |
|---------|------|---|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host:5432/db` |
| `TWITTER_CLIENT_ID` | Twitter OAuth 2.0クライアントID | `your_client_id` |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth 2.0クライアントシークレット | `your_client_secret` |
| `TWITTER_CALLBACK_URL` | Twitter OAuthコールバックURL | `https://doin-challenge.com/oauth/callback` |
| `SESSION_SECRET` | セッションCookie暗号化キー | `random_secret_key` |
| `NODE_ENV` | Node.js環境 | `production` |
| `PORT` | サーバーポート | `3000`（Railwayが自動設定） |
| `RAILWAY_GIT_COMMIT_SHA` | Git commit SHA（Railwayが自動設定） | `ea51793...` |

**重要**: `RAILWAY_GIT_COMMIT_SHA`は、Railwayが自動的に設定する環境変数です。この値は`/api/health`エンドポイントでバージョン情報として使用されます。

### バージョン情報の取得

Railwayでは、`RAILWAY_GIT_COMMIT_SHA`環境変数を優先的に使用してバージョン情報を取得します。

**優先順位**:

1. **RAILWAY_GIT_COMMIT_SHA**: Railwayが自動設定（最優先）
2. **build-info.json**: ビルド時に生成されたファイル
3. **"unknown"**: 上記が取得できない場合のフォールバック

**確認方法**:

```bash
curl https://doin-challenge.com/api/health
```

**期待される出力**:

```json
{
  "ok": true,
  "timestamp": 1769588915268,
  "version": "ea51793dcf09d6d347432389afe6d1c4cbfce5f1",
  "commitSha": "ea51793dcf09d6d347432389afe6d1c4cbfce5f1",
  "gitSha": "ea51793dcf09d6d347432389afe6d1c4cbfce5f1",
  "builtAt": "2026-01-28T09:04:00Z",
  "nodeEnv": "production"
}
```

---

## Vercel（フロントエンド）

### 概要

Vercelは、Expo Webで生成された静的ファイル（HTML/CSS/JS）をホスティングしています。CDNによる高速配信とゼロダウンタイムデプロイをサポートしています。

### デプロイ方法

Vercelは、GitHub Actionsを通じて自動デプロイされます。

**手動デプロイ手順**:

1. Vercelダッシュボードにログイン
2. プロジェクト「doin-challenge」を選択
3. 「Deployments」タブを開く
4. 「Redeploy」ボタンをクリック

**自動デプロイ**:

- GitHub Actionsの「Deploy to Vercel」ワークフローが実行されます
- デプロイ時間: 約2〜3分

### ビルドコマンド

Vercelは、GitHub Actionsで事前にビルドされたファイルをデプロイします。

```bash
# GitHub Actionsで実行
pnpm install --frozen-lockfile
node scripts/generate-build-info.cjs
pnpm build
```

### 環境変数

Vercelには以下の環境変数を設定する必要があります。

| 環境変数 | 説明 | 例 |
|---------|------|---|
| `VITE_API_URL` | バックエンドAPIのURL | `https://doin-challenge.com/api` |
| `VITE_GIT_SHA` | Git commit SHA（ビルド時に設定） | `ea51793...` |
| `VITE_BUILD_TIME` | ビルド時刻（ビルド時に設定） | `2026-01-28T09:04:00Z` |

**注意**: `VITE_*`環境変数は、ビルド時にクライアント側のコードに埋め込まれます。機密情報を含めないでください。

---

## GitHub Actions（CI/CD）

### 概要

GitHub Actionsは、`main`ブランチへのpush時に自動的にVercelへデプロイします。Railwayは独自の自動デプロイ機能を使用しているため、GitHub Actionsでは管理していません。

### ワークフローファイル

`.github/workflows/deploy-vercel.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate build-info.json
        run: |
          mkdir -p server/_core
          cat > server/_core/build-info.json << EOF
          {
            "commitSha": "${{ github.sha }}",
            "gitSha": "${{ github.sha }}",
            "builtAt": "${{ github.event.head_commit.timestamp }}",
            "version": "${{ github.sha }}",
            "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          EOF
          mkdir -p dist
          cp server/_core/build-info.json dist/build-info.json

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Wait for deployment to be live
        run: sleep 60

      - name: Smoke check
        run: |
          URL="https://doin-challenge.com/api/health"
          response=$(curl -s "$URL")
          status=$(echo "$response" | jq -r '.ok // false')
          if [ "$status" != "true" ]; then
            echo "❌ Health check failed"
            exit 1
          fi
          echo "✅ Health check passed"
```

### GitHub Secrets

GitHub Actionsで使用するシークレットは、リポジトリの「Settings」→「Secrets and variables」→「Actions」で設定します。

| シークレット名 | 説明 | 取得方法 |
|--------------|------|---------|
| `VERCEL_TOKEN` | Vercel APIトークン | Vercelダッシュボード → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel組織ID | `vercel link`コマンドで取得 |
| `VERCEL_PROJECT_ID` | Vercelプロジェクトid | `vercel link`コマンドで取得 |

**取得手順**:

```bash
# ローカルでVercel CLIをインストール
npm install -g vercel

# プロジェクトをVercelにリンク
vercel link

# .vercel/project.jsonから取得
cat .vercel/project.json
```

---

## カスタムドメイン設定

### Vercel

1. Vercelダッシュボードで「Settings」→「Domains」を開く
2. 「Add Domain」をクリック
3. `doin-challenge.com`を入力
4. DNS設定でCNAMEレコードを追加：
   - **Name**: `@`
   - **Value**: `cname.vercel-dns.com`

### Railway

1. Railwayダッシュボードで「Settings」→「Domains」を開く
2. 「Generate Domain」をクリック
3. カスタムドメインを追加：
   - **Domain**: `api.doin-challenge.com`
4. DNS設定でCNAMEレコードを追加：
   - **Name**: `api`
   - **Value**: `<railway-generated-domain>.railway.app`

---

## デプロイフロー

### 通常のデプロイ

```
1. ローカルで開発
   ↓
2. git commit & git push origin main
   ↓
3. GitHub Actions起動
   ├─ Vercelへデプロイ（フロントエンド）
   └─ Railwayが自動検知してデプロイ（バックエンド）
   ↓
4. デプロイ完了（3〜5分）
   ↓
5. https://doin-challenge.com で確認
```

### ホットフィックスデプロイ

緊急の修正が必要な場合は、以下の手順で迅速にデプロイできます。

```bash
# 1. 修正をコミット
git add .
git commit -m "hotfix: Fix critical bug"

# 2. mainブランチにpush
git push origin main

# 3. GitHub Actionsで自動デプロイ
# （Railwayも自動的にデプロイ開始）

# 4. デプロイ完了を確認
curl https://doin-challenge.com/api/health
```

---

## デプロイ後の確認

### ヘルスチェック

```bash
# バックエンドのヘルスチェック
curl https://doin-challenge.com/api/health

# 期待される出力
{
  "ok": true,
  "version": "ea51793...",
  "commitSha": "ea51793...",
  "gitSha": "ea51793...",
  "builtAt": "2026-01-28T09:04:00Z",
  "nodeEnv": "production"
}
```

### フロントエンドの確認

1. ブラウザで`https://doin-challenge.com`にアクセス
2. ログインボタンが表示されることを確認
3. Twitter OAuth認証が正常に動作することを確認

### データベース接続の確認

```bash
# Railwayダッシュボード → PostgreSQL → Connect
# 接続情報を取得してローカルから接続テスト

psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

---

## ロールバック手順

### Vercel

1. Vercelダッシュボードで「Deployments」タブを開く
2. 以前のデプロイメントを選択
3. 「Promote to Production」をクリック

### Railway

1. Railwayダッシュボードで「Deployments」タブを開く
2. 以前のデプロイメントを選択
3. 「Redeploy」をクリック

### GitHub（コードレベル）

```bash
# 以前のコミットにリセット
git reset --hard <commit-sha>

# 強制push
git push origin main --force

# GitHub Actionsが自動的に再デプロイ
```

---

## トラブルシューティング

### デプロイが失敗する

**症状**: GitHub Actionsが失敗する

**原因**:
- GitHub Secretsが設定されていない
- Vercel APIトークンが無効

**解決方法**:
1. GitHub Secretsを確認
2. Vercel APIトークンを再生成

### バージョン情報が"unknown"になる

**症状**: `/api/health`が`"version": "unknown"`を返す

**原因**:
- `RAILWAY_GIT_COMMIT_SHA`環境変数が設定されていない
- `build-info.json`が生成されていない

**解決方法**:
1. Railwayの環境変数を確認
2. ビルドログで`build-info.json`の生成を確認
3. 詳細は[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)を参照

### データベース接続エラー

**症状**: サーバーが起動しない、`ECONNREFUSED`エラー

**原因**:
- `DATABASE_URL`環境変数が正しくない
- PostgreSQLサービスが停止している

**解決方法**:
1. Railwayダッシュボードで`DATABASE_URL`を確認
2. PostgreSQLサービスのステータスを確認

---

## 参考資料

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo Web Deployment](https://docs.expo.dev/distribution/publishing-websites/)
