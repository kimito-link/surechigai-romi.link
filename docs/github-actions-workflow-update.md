# GitHub Actionsワークフローの手動更新方法

## 問題

GitHub Appの権限不足により、`.github/workflows/deploy-vercel.yml`の変更をプログラムからプッシュできません。

## 解決方法

GitHubのWeb UIから直接ワークフローファイルを編集します。

## 手順

### 1. GitHubリポジトリにアクセス

https://github.com/kimito-link/doin-challenge.com にアクセスします。

### 2. ワークフローファイルを開く

1. `Code`タブをクリック
2. `.github/workflows/deploy-vercel.yml`ファイルを開く
3. 右上の鉛筆アイコン（Edit this file）をクリック

### 3. 以下の変更を適用

**変更箇所**: `Install Playwright browsers`ステップの後に、以下を追加：

```yaml
      - name: Check for file changes and run related tests
        run: |
          echo "Checking for file changes..."
          chmod +x scripts/check-diff.sh
          ./scripts/check-diff.sh github/main
        env:
          PLAYWRIGHT_BASE_URL: https://doin-challenge.com
          CI: true
        continue-on-error: false
```

**完全な変更後のファイル**:

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

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Check for file changes and run related tests
        run: |
          echo "Checking for file changes..."
          chmod +x scripts/check-diff.sh
          ./scripts/check-diff.sh github/main
        env:
          PLAYWRIGHT_BASE_URL: https://doin-challenge.com
          CI: true
        continue-on-error: false

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
          echo "Generated build-info.json:"
          cat server/_core/build-info.json
          mkdir -p dist
          cp server/_core/build-info.json dist/build-info.json
          echo "Copied build-info.json to dist directory"

      - name: Run E2E smoke tests (pre-deployment)
        run: |
          echo "Running E2E smoke tests before deployment..."
          pnpm exec playwright test tests/e2e/public.smoke.spec.ts --reporter=list
        env:
          PLAYWRIGHT_BASE_URL: https://doin-challenge.com
          CI: true
        continue-on-error: false

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./

      - name: Wait for deployment to be live
        run: sleep 60

      - name: Display deployment info
        run: |
          echo "✅ Deployment completed"
          echo "Expected commit SHA: ${{ github.sha }}"
          echo "Verify at: https://doin-challenge.com/api/health"

      - name: Smoke check
        run: |
          set -e
          URL="https://doin-challenge.com/api/health"
          echo "Checking $URL"
          response=$(curl -s "$URL" )
          echo "Response: $response"
          status=$(echo "$response" | jq -r '.ok // false')
          if [ "$status" != "true" ]; then
            echo "❌ Health check failed"
            exit 1
          fi
          echo "✅ Health check passed"
```

### 4. コミットして保存

1. ページ下部の「Commit changes」をクリック
2. コミットメッセージを入力（例: "Add diff check to workflow"）
3. 「Commit directly to the main branch」を選択
4. 「Commit changes」をクリック

## 確認

次回のプッシュ時に、GitHub Actionsが自動的にdiffチェックを実行します。

## トラブルシューティング

### エラー: `scripts/check-diff.sh: No such file or directory`

`scripts/check-diff.sh`ファイルがリポジトリに存在することを確認してください。存在しない場合は、最新のコミットをプッシュしてください。

### エラー: `Permission denied`

`chmod +x scripts/check-diff.sh`が実行されていることを確認してください。
