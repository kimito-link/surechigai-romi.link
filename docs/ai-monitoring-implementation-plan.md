# AI × E2Eテスト・監視システム導入計画

## 目標
四六時中AIがサービスをテスト・バグ検知・自動修正・セキュリティ監視を行う仕組みを構築する

## 導入フェーズ

### フェーズ1: 即座に導入（無料/低コスト）✅

#### 1.1 GitHub Dependabot（無料）
**目的**: 依存関係の脆弱性を自動検知・PR作成

**導入手順**:
```bash
# .github/dependabot.ymlを作成
mkdir -p .github
cat > .github/dependabot.yml << 'EOF'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-github-username"
EOF

git add .github/dependabot.yml
git commit -m "Add Dependabot configuration"
git push
```

**効果**:
- 週次で依存関係の脆弱性をチェック
- 自動的にPR作成
- セキュリティアップデートを見逃さない

#### 1.2 GitHub CodeQL（無料）
**目的**: コードの脆弱性を自動検知

**導入手順**:
```bash
# .github/workflows/codeql.ymlを作成
mkdir -p .github/workflows
cat > .github/workflows/codeql.yml << 'EOF'
name: "CodeQL"

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 1'  # 毎週月曜日

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript', 'typescript' ]

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: ${{ matrix.language }}

    - name: Autobuild
      uses: github/codeql-action/autobuild@v3

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
EOF

git add .github/workflows/codeql.yml
git commit -m "Add CodeQL security scanning"
git push
```

**効果**:
- コードの脆弱性を自動検知
- SQLインジェクション、XSS等を検出
- 週次スキャン + PR時スキャン

#### 1.3 Sentry AI Autofix（既存プラン拡張）
**目的**: エラー自動検知・修正PR作成

**導入手順**:
1. GitHub MarketplaceでSentry Copilot Extensionをインストール
   - URL: https://github.com/marketplace/sentry
2. Sentryダッシュボードで設定
   - Settings → Integrations → GitHub Copilot
   - リポジトリを連携
3. Autofixを有効化
   - Settings → Features → AI Autofix → Enable

**効果**:
- エラー発生時に自動分析
- 修正コードを含むPRを自動作成
- ユニットテストも自動生成

### フェーズ2: 短期導入（1週間以内）

#### 2.1 Cloudflare Rate Limiting（無料プラン）
**目的**: DDoS防御、Rate limiting、Bot検知

**導入手順**:
1. Cloudflareアカウント作成（無料プラン）
2. ドメインをCloudflareに追加
3. DNS設定を変更（Cloudflareのネームサーバーに変更）
4. Rate Limiting Rules設定:
   - Security → WAF → Rate limiting rules → Create rule

**推奨ルール**:
```
Rule 1: API Rate Limiting
- Name: API Protection
- Expression: (http.request.uri.path matches "^/api/.*")
- Rate: 10 requests per 10 seconds
- Characteristics: IP Address
- Action: Block
- Duration: 1 hour

Rule 2: Login Protection
- Name: Login Protection
- Expression: (http.request.uri.path matches "^/api/auth/.*")
- Rate: 5 requests per 1 minute
- Characteristics: IP Address
- Action: Challenge (CAPTCHA)
- Duration: 15 minutes

Rule 3: Global Rate Limiting
- Name: Global Protection
- Expression: (http.request.uri.path matches "^/.*")
- Rate: 100 requests per 1 minute
- Characteristics: IP Address
- Action: JS Challenge
- Duration: 5 minutes
```

**効果**:
- DDoS攻撃を自動防御
- 不正アクセスを自動ブロック
- Bot攻撃を自動検知・ブロック

#### 2.2 Railway/Vercel Rate Limiting
**目的**: アプリケーションレベルのRate limiting

**導入手順**:
```typescript
// server/_core/rate-limiter.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per 1 second
});

export async function checkRateLimit(ip: string) {
  try {
    await rateLimiter.consume(ip);
    return true;
  } catch (error) {
    return false;
  }
}

// server/_core/index.ts（ミドルウェアとして追加）
app.use(async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const allowed = await checkRateLimit(ip);
  
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
});
```

**効果**:
- アプリケーションレベルでRate limiting
- Cloudflareと二重防御
- きめ細かい制御が可能

### フェーズ3: 中期導入（1ヶ月以内）

#### 3.1 Playwright + AI E2Eテスト
**目的**: 継続的E2Eテスト自動化

**導入手順**:
```bash
# Playwrightインストール
pnpm add -D @playwright/test

# playwright.config.tsを作成
npx playwright install

# テストファイル作成
mkdir -p tests/e2e
cat > tests/e2e/home.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('ホーム画面が正しく表示される', async ({ page }) => {
  await page.goto('https://your-app-url.com');
  
  // チャレンジカードが表示されることを確認
  await expect(page.locator('[data-testid="challenge-card"]')).toBeVisible();
  
  // サムネイル画像が表示されることを確認
  await expect(page.locator('[data-testid="challenge-thumbnail"]')).toBeVisible();
});

test('ログインボタンが動作する', async ({ page }) => {
  await page.goto('https://your-app-url.com');
  
  // ログインボタンをクリック
  await page.click('[data-testid="login-button"]');
  
  // OAuth画面に遷移することを確認
  await expect(page).toHaveURL(/oauth/);
});
EOF

# GitHub Actionsワークフローを作成
cat > .github/workflows/e2e-tests.yml << 'EOF'
name: E2E Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 */6 * * *'  # 6時間ごと

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: pnpm install
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: pnpm exec playwright test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
EOF
```

**効果**:
- 6時間ごとに自動E2Eテスト実行
- サムネイル画像・ログイン機能を継続監視
- テスト失敗時にSlack通知

#### 3.2 Autify または mabl トライアル
**目的**: AI-nativeなE2Eテスト自動化

**導入手順**:
1. Autify無料デモ申し込み: https://autify.jp/e2e-testing
2. または mabl無料トライアル: https://www.mabl.com/
3. 主要ユーザーフローをテストシナリオ化:
   - ログイン → チャレンジ一覧表示
   - チャレンジ作成
   - 参加表明
4. 継続的モニタリング設定（1時間ごと）

**効果**:
- ノーコードでテストシナリオ作成
- AIによる自動メンテナンス
- 継続的モニタリング（24時間365日）

### フェーズ4: 統合・最適化

#### 4.1 Slack通知統合
**目的**: すべての監視・テスト結果をSlackに集約

**導入手順**:
```typescript
// server/_core/slack-notifier.ts
import axios from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function notifySlack(message: string, severity: 'info' | 'warning' | 'error') {
  if (!SLACK_WEBHOOK_URL) return;
  
  const color = {
    info: '#36a64f',
    warning: '#ff9900',
    error: '#ff0000',
  }[severity];
  
  await axios.post(SLACK_WEBHOOK_URL, {
    attachments: [{
      color,
      text: message,
      ts: Math.floor(Date.now() / 1000),
    }],
  });
}

// Sentryエラー発生時
Sentry.init({
  beforeSend(event) {
    notifySlack(`🚨 エラー発生: ${event.message}`, 'error');
    return event;
  },
});

// E2Eテスト失敗時
// playwright.config.ts
reporter: [
  ['html'],
  ['list'],
  ['./slack-reporter.ts'], // カスタムレポーター
],
```

**効果**:
- すべてのアラートをSlackで一元管理
- リアルタイム通知
- チーム全体で状況共有

#### 4.2 ダッシュボード構築
**目的**: 監視状況を可視化

**推奨ツール**:
- Grafana（無料）: メトリクス可視化
- Sentry Dashboard: エラー状況
- Cloudflare Analytics: トラフィック・攻撃状況
- GitHub Actions: テスト実行状況

## コスト見積もり

| サービス | 月額コスト | 備考 |
|---------|-----------|------|
| GitHub Dependabot | 無料 | 既存プラン |
| GitHub CodeQL | 無料 | 既存プラン |
| Sentry AI Autofix | 無料〜$26 | 既存プラン拡張 |
| Cloudflare | 無料 | 無料プラン |
| Playwright | 無料 | オープンソース |
| Autify/mabl | 要問い合わせ | トライアル後検討 |
| **合計** | **$0〜$26** | Autify/mabl除く |

## 導入スケジュール

| フェーズ | 期間 | 内容 |
|---------|------|------|
| フェーズ1 | 即日〜3日 | Dependabot, CodeQL, Sentry Autofix |
| フェーズ2 | 1週間 | Cloudflare, Rate Limiting |
| フェーズ3 | 1ヶ月 | Playwright, Autify/mablトライアル |
| フェーズ4 | 継続 | 統合・最適化 |

## 期待効果

1. **バグ検知**: 24時間365日、AIが自動的にバグを検知
2. **自動修正**: エラー発生時に自動的に修正PRを作成
3. **セキュリティ**: 不正アクセスを自動的にブロック
4. **安心感**: 常に監視されているという安心感
5. **開発効率**: 手動テストの時間を大幅削減

## 次のアクション

1. ✅ GitHub Dependabotを設定
2. ✅ GitHub CodeQLを設定
3. ✅ Sentry AI Autofixを有効化
4. ⏳ Cloudflareアカウント作成・設定
5. ⏳ Rate Limiting実装
6. ⏳ Playwright E2Eテスト作成
7. ⏳ Autify/mablトライアル申し込み
