# X API コスト管理ガイド

## 概要

X API（旧Twitter API）の従量課金に対応し、使用量とコストを管理する機能です。

## 機能

### 1. API呼び出し回数の監視
- すべてのAPI呼び出しをデータベースに記録
- エンドポイント別の使用量を追跡
- 月間使用量を集計

### 2. コスト計算
- 月100件まで無料
- 100件を超えた分は $0.01/件（要確認・更新）
- 月間コストを自動計算

### 3. コスト上限アラート
- 月間コスト上限を設定可能（デフォルト: $10）
- 上限の80%で警告アラート
- 上限到達時に通知送信
- オプション: 自動停止機能

## 初期設定

### 1. データベースマイグレーション

新しいテーブルを作成するため、マイグレーションを実行します：

```bash
# マイグレーションファイルを生成
pnpm drizzle-kit generate

# マイグレーションを実行
pnpm drizzle-kit migrate
```

### 2. コスト設定の初期化

初期設定スクリプトを実行して、コスト上限とアラートメールを設定します：

```bash
npx tsx scripts/init-api-cost-settings.ts
```

これにより以下が設定されます：
- 月間コスト上限: $10.00
- アラート閾値: $8.00（上限の80%）
- アラートメール: info@best-trust.biz
- 自動停止: 有効

### 3. 設定の確認

管理画面（`/admin/api-usage`）で設定を確認できます。

## 管理画面での設定変更

管理画面から以下の設定を変更できます：

1. **月間コスト上限**: 月間の最大コスト（USD）
2. **アラート閾値**: 警告を送信するコスト（USD）
3. **アラートメール**: 通知先メールアドレス
4. **自動停止**: 上限到達時にAPI呼び出しを自動停止するか

## API使用量の確認

管理画面（`/admin/api-usage`）で以下を確認できます：

- 今月の使用量（件数）
- 無料枠残り（100件まで無料）
- 推定コスト（USD）
- エンドポイント別の使用量
- コスト上限の警告・超過アラート

## アラート通知

### 通知の届け方（info@best-trust.biz に届けるには）

1. **Manus Notification Service（Forge）**  
   `notifyOwner` が Forge に送信します。**info@best-trust.biz に届けるには、Forge 側で配信先をそのメールアドレスに設定してください。**

2. **任意: Webhook（Zapier / Make 等）**  
   環境変数 `COST_ALERT_WEBHOOK_URL` を設定すると、アラート発生時にその URL へ JSON が POST されます。Zapier や Make で「Webhook 受信 → メール送信」とつなげれば、任意のメール（例: info@best-trust.biz）に転送できます。  
   ペイロード例: `{ "title", "content", "alertEmail", "exceeded", "currentCost", "limit" }`

### 警告アラート（上限の80%）
- コストがアラート閾値に達すると通知が送信されます
- 通知先: `notifyOwner` 経由（Manus Notification Service）+ 任意で Webhook

### 超過アラート（上限到達）
- コスト上限に達すると通知が送信されます
- 自動停止が有効な場合、API呼び出しが停止されます

## コスト計算の仕組み

1. **無料枠**: 月100件まで無料
2. **超過分**: 100件を超えた分は $0.01/件（要確認）
3. **計算式**: `cost = max(0, (usage - 100)) * 0.01`

### コスト単価の更新

X APIの実際の従量課金価格を確認し、`server/db/api-usage-db.ts` の `COST_PER_REQUEST` を更新してください：

```typescript
const COST_PER_REQUEST = 0.01; // 実際の価格に更新
```

## トラブルシューティング

### API呼び出しが停止される

1. 管理画面でコスト設定を確認
2. `autoStop` が有効になっているか確認
3. 必要に応じて上限を引き上げるか、自動停止を無効化

### アラートが届かない

1. `notifyOwner` の設定を確認（`BUILT_IN_FORGE_API_URL` と `BUILT_IN_FORGE_API_KEY`）
2. アラートメールアドレスが正しく設定されているか確認
3. サーバーログでエラーを確認

### 使用量が記録されない

1. データベース接続を確認
2. `api_usage` テーブルが作成されているか確認
3. サーバーログでエラーを確認

## 関連ファイル

- `drizzle/schema/api-usage.ts` - データベーススキーマ
- `server/db/api-usage-db.ts` - DB操作関数
- `server/api-usage-tracker.ts` - 使用量追跡
- `server/api-cost-alert.ts` - コストアラート
- `server/rate-limit-handler.ts` - API呼び出しラッパー
- `app/admin/api-usage.tsx` - 管理画面UI
- `scripts/init-api-cost-settings.ts` - 初期設定スクリプト

## 日次レポート機能

### 概要
毎日のAPI使用量とコストを自動的にメール通知する機能です。

### 設定方法

#### Vercel Cron Jobsを使用する場合

`vercel.json`に以下の設定を追加：

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 0 * * *"
    }
  ]
}
```

`app/api/cron/daily-report/route.ts`を作成：

```typescript
import { sendDailyReport } from "@/server/api-daily-report";

export async function GET(request: Request) {
  // 認証チェック（Vercel Cron Secretを使用）
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await sendDailyReport();
    return Response.json({ success: true });
  } catch (error) {
    console.error("[Cron] Daily report failed:", error);
    return Response.json({ error: "Failed to send daily report" }, { status: 500 });
  }
}
```

環境変数に`CRON_SECRET`を設定してください。

#### GitHub Actionsを使用する場合

`.github/workflows/daily-api-report.yml`を作成：

```yaml
name: Daily API Report

on:
  schedule:
    - cron: '0 0 * * *' # 毎日UTC 0時（JST 9時）
  workflow_dispatch: # 手動実行も可能

jobs:
  send-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Send Daily Report
        run: |
          curl -X POST "${{ secrets.API_BASE_URL }}/api/cron/daily-report" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 次のステップ

1. ✅ データベースマイグレーションの実行
2. ✅ コスト設定の初期化（`scripts/init-api-cost-settings.ts`）
3. ⚠️ **COST_PER_REQUEST の更新（推奨）**  
   X APIの従量課金価格を確認し、[server/db/api-usage-db.ts](../server/db/api-usage-db.ts) の定数を更新する。  
   手順: ファイルを開き `COST_PER_REQUEST` を検索 → 公式の単価（USD/件）に書き換え → 保存。現在は仮の `0.01`。
4. ✅ 管理画面で設定を確認
5. ✅ テストAPI呼び出しで動作確認
6. ✅ 日次レポート機能の設定（Vercel Cron JobsまたはGitHub Actions）
7. ✅ キャッシュ期間の調整（`FOLLOW_STATUS_CACHE_TTL_HOURS`環境変数、デフォルト: 48時間）
